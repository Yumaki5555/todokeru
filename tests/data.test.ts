// データの点検（npm run validate）：public/data のファイルがすべて正しい形か確かめる
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Agency, Contact, DataSummary, MasterFile, Municipality, Prefecture } from '../src/types';
import {
  isDisplayable,
  validateAgencyContactsFile,
  validateContact,
  validateMasters,
  validateMunicipalityContactsFile,
  withCheckDigit,
} from '../src/data/validate';

const dataDir = resolve(__dirname, '../public/data');
const read = <T>(p: string): T => JSON.parse(readFileSync(resolve(dataDir, p), 'utf8')) as T;

const agencies = read<MasterFile<Agency>>('master/agencies.json');
const prefectures = read<MasterFile<Prefecture>>('master/prefectures.json');
const municipalities = read<MasterFile<Municipality>>('master/municipalities.json');

describe('マスター', () => {
  it('都道府県47・市区町村1,741・国の機関がそろっている', () => {
    expect(prefectures.items).toHaveLength(47);
    expect(municipalities.items).toHaveLength(1741);
    expect(agencies.items.length).toBeGreaterThanOrEqual(20);
  });

  it('コードの検査数字・重複・都道府県の対応に問題がない', () => {
    expect(validateMasters(prefectures.items, municipalities.items, agencies.items)).toEqual([]);
  });

  it('出典と確認日が書かれている', () => {
    for (const f of [prefectures, municipalities]) {
      expect(f.source).toContain('総務省');
      expect(f.source_url).toMatch(/^https:\/\/www\.soumu\.go\.jp\//);
      expect(f.checked_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('検査数字の計算（江東区 131083・札幌市 011002・東京都 130001）', () => {
    expect(withCheckDigit('13108')).toBe('131083');
    expect(withCheckDigit('01100')).toBe('011002');
    expect(withCheckDigit('13000')).toBe('130001');
  });
});

describe('窓口データ', () => {
  const files = readdirSync(resolve(dataDir, 'contacts')).filter((f) => f.endsWith('.json'));

  it('47都道府県分と国の機関の分のファイルがある', () => {
    for (const p of prefectures.items) expect(files).toContain(`${p.code}.json`);
    expect(files).toContain('agencies.json');
  });

  it('都道府県ごとのファイルがすべて点検に通る', () => {
    const errors = prefectures.items.flatMap((p) =>
      validateMunicipalityContactsFile(p.code, read(`contacts/${p.code}.json`), prefectures.items, municipalities.items),
    );
    expect(errors).toEqual([]);
  });

  it('警察の窓口は都道府県のまとまりにだけ入れられる（教育委員会は市区町村にも入れられる）', () => {
    const c = (id: string, type: Contact['type']): Contact => ({
      id,
      type,
      department: 'テスト',
      phone: null,
      email: null,
      form_url: null,
      postal_code: null,
      postal_address: null,
      hours: null,
      source_url: null,
      verified_at: null,
      status: 'unverified',
    });
    const file = (code: string, name: string, type: Contact['type']) => [{ municipality_code: code, municipality_name: name, contacts: [c(`${code}-${type}`, type)] }];
    const check = (records: unknown) => validateMunicipalityContactsFile('13', records, prefectures.items, municipalities.items);
    expect(check(file('130001', '東京都', 'police'))).toEqual([]);
    expect(check(file('131083', '江東区', 'education'))).toEqual([]);
    expect(check(file('131083', '江東区', 'police')).join()).toContain('警察の窓口は都道府県のまとまりに入れます');
  });

  it('国の機関のファイルが点検に通る', () => {
    expect(validateAgencyContactsFile(read('contacts/agencies.json'), agencies.items)).toEqual([]);
  });

  it('件数のまとめ（summary.json）が実際のデータと一致する', () => {
    const summary = read<DataSummary>('summary.json');
    const all = files.flatMap((f) => read<{ contacts: Contact[] }[]>(`contacts/${f}`).flatMap((r) => r.contacts));
    expect(summary.entities).toEqual({
      agencies: agencies.items.length,
      prefectures: prefectures.items.length,
      municipalities: municipalities.items.length,
    });
    expect(summary.contacts.total).toBe(all.length);
    expect(summary.contacts.verified).toBe(all.filter((c) => c.status === 'verified').length);
  });

  it('機関・自治体ごとの登録状況（summary.json の coverage・by_pref）が実際のデータと一致する', () => {
    const summary = read<DataSummary>('summary.json');
    const records = files.flatMap((f) =>
      read<{ agency_id?: string; municipality_code?: string; contacts: Contact[] }[]>(`contacts/${f}`).map((r) => ({
        key: r.agency_id ?? r.municipality_code!,
        contacts: r.contacts,
      })),
    );
    const withVerified = new Set(records.filter((r) => r.contacts.some((c) => c.status === 'verified')).map((r) => r.key));
    const withShown = new Set(records.filter((r) => r.contacts.some((c) => ['verified', 'review', 'auto_matched'].includes(c.status))).map((r) => r.key));
    const count = (keys: string[]) => keys.filter((k) => withVerified.has(k)).length;
    const shown = (keys: string[]) => keys.filter((k) => withShown.has(k)).length;
    expect(summary.coverage.agencies.with_verified).toBe(count(agencies.items.map((a) => a.id)));
    expect(summary.coverage.prefectures.with_verified).toBe(count(prefectures.items.map((p) => p.lg_code)));
    expect(summary.coverage.municipalities.with_verified).toBe(count(municipalities.items.map((m) => m.code)));
    expect(summary.coverage.municipalities.with_shown).toBe(shown(municipalities.items.map((m) => m.code)));
    for (const p of prefectures.items) {
      const munis = municipalities.items.filter((m) => m.pref_code === p.code).map((m) => m.code);
      expect(summary.by_pref[p.code].municipalities).toEqual({
        total: munis.length,
        researched: munis.filter((k) => records.some((r) => r.key === k && r.contacts.length > 0)).length,
        with_verified: count(munis),
        with_shown: shown(munis),
      });
    }
  });

  it('公式確認済み・要再確認・自動照合の窓口は、出典が公式ドメイン（go.jp・lg.jp・pref./city. など、または確認済みの公式ドメイン）', () => {
    const extra = new Set(
      (JSON.parse(readFileSync(resolve(__dirname, '../research/official-hosts.json'), 'utf8')) as { hosts: { host: string }[] }).hosts.map(
        (h) => h.host,
      ),
    );
    const official = (u: string) => {
      const h = new URL(u).host;
      return extra.has(h) || /(^|\.)(lg|go)\.jp$/.test(h) || /(^|\.)(pref|city|town|vill|metro)\.[a-z0-9-]+(\.[a-z0-9-]+)*\.jp$/.test(h);
    };
    const all = files.flatMap((f) => read<{ contacts: Contact[] }[]>(`contacts/${f}`).flatMap((r) => r.contacts));
    const bad = all.filter((c) => ['verified', 'review', 'auto_matched'].includes(c.status) && !official(c.source_url!)).map((c) => c.id);
    expect(bad).toEqual([]);
  });

  it('画面に出す窓口の電話番号は、同じ機関・自治体の中で窓口の種類ごとに重複しない（代表電話の流用がない）', () => {
    const recs = files.flatMap((f) => read<{ contacts: Contact[] }[]>(`contacts/${f}`));
    const bad: string[] = [];
    for (const r of recs) {
      const general = r.contacts.find((c) => c.type === 'general' && isDisplayable(c));
      for (const c of r.contacts) {
        if (c.type !== 'general' && isDisplayable(c) && general?.phone && c.phone === general.phone && c.source_url === general.source_url)
          bad.push(c.id);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('窓口1件の点検', () => {
  const base: Contact = {
    id: '131083-general',
    type: 'general',
    department: '代表窓口',
    phone: null,
    email: null,
    form_url: null,
    postal_code: null,
    postal_address: null,
    hours: null,
    source_url: null,
    verified_at: null,
    status: 'unverified',
  };
  const verified: Contact = {
    ...base,
    status: 'verified',
    phone: '03-0000-0000',
    source_url: 'https://example.lg.jp/contact.html',
    verified_at: '2026-10-01',
  };

  it('未確認（すべて null）は形として正しい', () => {
    expect(validateContact(base)).toEqual([]);
  });

  it('確認済みには出典URLと確認日と連絡手段が必要', () => {
    expect(validateContact(verified, '2026-11-01')).toEqual([]);
    expect(validateContact({ ...verified, source_url: null }, '2026-11-01').join()).toContain('source_url');
    expect(validateContact({ ...verified, verified_at: null }, '2026-11-01').join()).toContain('verified_at');
    expect(validateContact({ ...verified, phone: null }, '2026-11-01').join()).toContain('電話・メール・フォーム・住所');
  });

  it('電話番号・メール・URL・日付の形の誤りを見つける', () => {
    expect(validateContact({ ...verified, phone: '03-1234' }, '2026-11-01').join()).toContain('電話番号');
    expect(validateContact({ ...verified, email: 'abc' }, '2026-11-01').join()).toContain('メール');
    expect(validateContact({ ...verified, source_url: 'http://example.jp/' }, '2026-11-01').join()).toContain('https');
    // 公式ページから開くフォームの印は、フォームと出典があるときだけ
    expect(validateContact({ ...verified, form_url: 'https://example.jp/form', form_via_page: 'ご意見フォーム' }, '2026-11-01')).toEqual([]);
    expect(validateContact({ ...verified, form_via_page: 'ご意見フォーム' }, '2026-11-01').join()).toContain('form_via_page');
    expect(validateContact({ ...verified, form_via_page: 1 }, '2026-11-01').join()).toContain('form_via_page');
    expect(validateContact({ ...verified, verified_at: '2026-12-31' }, '2026-11-01').join()).toContain('確認日');
    expect(validateContact({ ...verified, status: 'ok' as never }, '2026-11-01').join()).toContain('status');
  });

  it('自動照合の代表電話には、出典・照合日・電話番号が必要で、確認日は入れない', () => {
    const auto: Contact = { ...verified, type: 'general', verified_at: null, matched_at: '2026-11-01', status: 'auto_matched' };
    expect(validateContact(auto, '2026-11-01')).toEqual([]);
    expect(validateContact({ ...auto, verified_at: '2026-11-01' }, '2026-11-01').join()).toContain('確認日（verified_at）を入れません');
    expect(validateContact({ ...auto, matched_at: null }, '2026-11-01').join()).toContain('matched_at');
    expect(validateContact({ ...auto, phone: null }, '2026-11-01').join()).toContain('電話番号');
    expect(validateContact({ ...auto, type: 'feedback' }, '2026-11-01').join()).toContain('general');
    expect(validateContact({ ...verified, matched_at: '2026-11-01' }, '2026-11-01').join()).toContain('自動照合の窓口だけ');
    expect(isDisplayable(auto)).toBe(true);
  });

  it('画面に連絡先を出すのは確認済み・要再確認・自動照合で点検に通るものだけ', () => {
    expect(isDisplayable(verified)).toBe(true);
    expect(isDisplayable({ ...verified, status: 'review' })).toBe(true);
    expect(isDisplayable({ ...verified, status: 'unverified' })).toBe(false);
    expect(isDisplayable({ ...verified, source_url: null })).toBe(false);
  });
});

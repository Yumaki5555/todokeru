// 連絡先の管理画面（admin/core.ts）の点検
import { describe, expect, it } from 'vitest';
import type { Contact } from '../src/types';
import { validateContact } from '../src/data/validate';
import {
  applyAction,
  findOnPage,
  nextId,
  normalizeEmail,
  normalizePhone,
  normalizePostal,
  plainMessage,
  type ContactInput,
  type ContactRecord,
  type Entity,
} from '../admin/core';

const today = '2026-11-03';
const koto: Entity = { key: '131083', name: '江東区', kind: 'muni', file: '13', pref_code: '13', pref_name: '東京都' };
const extraHosts = new Set<string>(['www.gikai-adachi.jp']);
const opts = { today, extraHosts };

const general: Contact = {
  id: '131083-general',
  type: 'general',
  department: '代表電話',
  phone: '03-3647-9111',
  email: null,
  form_url: null,
  postal_code: null,
  postal_address: null,
  hours: null,
  source_url: 'https://www.city.koto.lg.jp/',
  verified_at: null,
  matched_at: '2026-11-02',
  status: 'auto_matched',
  note: null,
};
const records = (): ContactRecord[] => [
  { municipality_code: '131016', municipality_name: '千代田区', contacts: [] },
  { municipality_code: '131083', municipality_name: '江東区', contacts: [structuredClone(general)] },
];
const input = (x: Partial<ContactInput> = {}): ContactInput => ({
  type: 'feedback',
  department: '広報広聴課',
  phone: '０３−３６４７−２３８１',
  source_url: 'https://www.city.koto.lg.jp/kocho/index.html',
  check: 'checked',
  ...x,
});
const koto1 = (r: ContactRecord[]) => r.find((x) => x.municipality_code === '131083')!.contacts;

describe('入力の整え', () => {
  it('電話番号：全角・いろいろな横棒・かっこをハイフンに', () => {
    expect(normalizePhone('０３−３６４７−９１１１')).toBe('03-3647-9111');
    expect(normalizePhone('03(3647)9111')).toBe('03-3647-9111');
    expect(normalizePhone('03ー3647ー9111 ')).toBe('03-3647-9111');
    expect(normalizePhone('  ')).toBeNull();
  });
  it('郵便番号・メール', () => {
    expect(normalizePostal('〒１３５８３８３')).toBe('135-8383');
    expect(normalizePostal('135－8383')).toBe('135-8383');
    expect(normalizeEmail('koho(at)city.koto.lg.jp')).toBe('koho@city.koto.lg.jp');
    expect(normalizeEmail('ｋｏｈｏ＠city.koto.lg.jp')).toBe('koho@city.koto.lg.jp');
  });
  it('点検の言葉の項目名を、画面の欄の名前に', () => {
    expect(plainMessage('照合日（matched_at）は自動照合の窓口だけに入れます')).toBe('照合日は自動照合の窓口だけに入れます');
    expect(plainMessage('verified_at（確認日）が不正です: 2026-12-31')).toBe('確認日が不正です: 2026-12-31');
    expect(plainMessage('source_url は https の URL にしてください: http://a')).toBe('出典ページのURL は https の URL にしてください: http://a');
  });
  it('id：同じ種類がもうあれば -2、-3', () => {
    expect(nextId('131083', 'feedback', [])).toBe('131083-feedback');
    expect(nextId('131083', 'general', [general])).toBe('131083-general-2');
    expect(nextId('131083', 'general', [general, { ...general, id: '131083-general-2' }])).toBe('131083-general-3');
  });
});

describe('画面の操作を反映する', () => {
  it('自動照合の代表電話を「確認できた」にすると、公式確認済み・今日の確認日になり、照合日は消える', () => {
    const r = applyAction(records(), koto, { kind: 'verify', id: '131083-general' }, opts);
    expect(r.errors).toEqual([]);
    const c = koto1(r.records)[0];
    expect(c).toMatchObject({ status: 'verified', verified_at: today });
    expect('matched_at' in c).toBe(false);
    expect(validateContact(c, today)).toEqual([]);
    expect(r.changes).toEqual([
      {
        date: today,
        batch: 'manual-admin',
        id: '131083-general',
        change: 'updated',
        fields: { verified_at: [null, today], matched_at: ['2026-11-02', null], status: ['auto_matched', 'verified'] },
      },
    ]);
  });

  it('新しく登録：入力を整え、確かめたなら公式確認済みで追加。代表電話の後ろに並ぶ', () => {
    const r = applyAction(records(), koto, { kind: 'add', input: input() }, opts);
    expect(r.errors).toEqual([]);
    expect(koto1(r.records).map((c) => c.id)).toEqual(['131083-general', '131083-feedback']);
    expect(koto1(r.records)[1]).toMatchObject({ phone: '03-3647-2381', status: 'verified', verified_at: today, email: null });
    expect(r.changes[0]).toMatchObject({ change: 'added', id: '131083-feedback', status: 'verified' });
    // 窓口のない千代田区のまとまりは、ファイルから外す
    expect(r.records.map((x) => x.municipality_code)).toEqual(['131083']);
  });

  it('「まだ確かめていない」で登録すると未確認（確認日なし）', () => {
    const r = applyAction(records(), koto, { kind: 'add', input: input({ check: 'unchecked', source_url: '' }) }, opts);
    expect(r.errors).toEqual([]);
    expect(koto1(r.records)[1]).toMatchObject({ status: 'unverified', verified_at: null, source_url: null });
  });

  it('連絡先がまだない自治体にも登録できる', () => {
    const chiyoda: Entity = { ...koto, key: '131016', name: '千代田区' };
    const r = applyAction([], chiyoda, { kind: 'add', input: input({ source_url: 'https://www.city.chiyoda.lg.jp/a.html' }) }, opts);
    expect(r.errors).toEqual([]);
    expect(r.records).toEqual([{ municipality_code: '131016', municipality_name: '千代田区', contacts: [expect.objectContaining({ id: '131016-feedback' })] }]);
  });

  it('止める：公式でない出典・代表電話の流用・形の誤り・サイトに出ない種類', () => {
    const bad = (x: Partial<ContactInput>) => applyAction(records(), koto, { kind: 'add', input: input(x) }, opts);
    expect(bad({ source_url: 'https://example.com/koto' }).errors.join()).toContain('公式サイト');
    expect(bad({ source_url: 'https://www.gikai-adachi.jp/' }).errors).toEqual([]);
    expect(bad({ phone: '03-3647-9111', source_url: 'https://www.city.koto.lg.jp/' }).errors.join()).toContain('代表電話と同じ番号');
    expect(bad({ phone: '0336472381' }).errors.join()).toContain('ハイフン');
    expect(bad({ phone: '03-1234' }).errors.join()).toContain('電話番号の形');
    expect(bad({ source_url: '' }).errors.join()).toContain('出典ページのURL');
    expect(bad({ email: 'abc' }).errors.join()).toContain('メールアドレスの形');
    expect(bad({ type: 'department' }).errors.join()).toContain('サイトに出ません');
    const r = bad({ department: ' ' });
    expect(r.errors.join()).toContain('窓口名');
    expect(r.records).toEqual(records()); // 止めたときは元のまま
  });

  it('直す：種類を変えると id もその種類に。フォームが同じなら「公式ページから開くフォーム」の印を引き継ぐ', () => {
    const base = records();
    koto1(base).push({ ...general, id: '131083-feedback', type: 'feedback', department: '広聴', phone: '03-3647-2381', form_url: 'https://www.city.koto.lg.jp/f', form_via_page: 'ご意見フォーム', matched_at: undefined, status: 'verified', verified_at: '2026-11-01', source_url: 'https://www.city.koto.lg.jp/kocho/' });
    const r = applyAction(base, koto, { kind: 'edit', id: '131083-feedback', input: input({ form_url: 'https://www.city.koto.lg.jp/f', source_url: 'https://www.city.koto.lg.jp/kocho/' }) }, opts);
    expect(r.errors).toEqual([]);
    expect(koto1(r.records)[1]).toMatchObject({ department: '広報広聴課', form_via_page: 'ご意見フォーム', verified_at: today });
    const moved = applyAction(base, koto, { kind: 'edit', id: '131083-feedback', input: input({ type: 'assembly', department: '区議会事務局', source_url: 'https://www.city.koto.lg.jp/gikai/' }) }, opts);
    expect(moved.errors).toEqual([]);
    expect(koto1(moved.records).map((c) => c.id)).toEqual(['131083-general', '131083-assembly']);
    expect(moved.changes[0].fields!.id).toEqual(['131083-feedback', '131083-assembly']);
  });

  it('要再確認は公式確認済みの窓口だけ。廃止・消す', () => {
    expect(applyAction(records(), koto, { kind: 'status', id: '131083-general', status: 'review' }, opts).errors.join()).toContain('公式確認済みの窓口だけ');
    const d = applyAction(records(), koto, { kind: 'status', id: '131083-general', status: 'discontinued' }, opts);
    expect(d.errors).toEqual([]);
    expect(koto1(d.records)[0].status).toBe('discontinued');
    const del = applyAction(records(), koto, { kind: 'delete', id: '131083-general' }, opts);
    expect(del.records).toEqual([]);
    expect(del.changes[0]).toMatchObject({ change: 'deleted', id: '131083-general' });
    expect(applyAction(records(), koto, { kind: 'delete', id: 'nothing' }, opts).errors.join()).toContain('見つかりません');
  });

  it('何も変えなければ記録を残さない', () => {
    const base = records();
    koto1(base)[0] = { ...general, status: 'verified', verified_at: today, matched_at: undefined };
    delete koto1(base)[0].matched_at;
    const r = applyAction(base, koto, { kind: 'verify', id: '131083-general' }, opts);
    expect(r.changes).toEqual([]);
  });
});

describe('出典ページの中を探す', () => {
  const html = `<html><body><p>代表電話：０３－３６４７－９１１１</p><p>〒135-8383 江東区東陽4丁目11番28号</p>
    <a href="mailto:koho@city.koto.lg.jp">メール</a><a href="/kocho/form.html">ご意見フォーム</a></body></html>`;
  it('電話・メール・フォームのリンク・郵便番号・住所（都道府県名を省いた書き方も）を見つける', () => {
    expect(
      findOnPage(
        { phone: '03-3647-9111', email: 'koho@city.koto.lg.jp', form_url: 'https://www.city.koto.lg.jp/kocho/form.html', postal_code: '135-8383', postal_address: '東京都江東区東陽4丁目11番28号' },
        html,
        '東京都',
      ),
    ).toEqual({ phone: true, email: true, form_url: true, postal_code: true, postal_address: true });
  });
  it('違う番号は見つからない。空の項目は探さない', () => {
    expect(findOnPage({ phone: '03-3647-9112', email: null }, html)).toEqual({ phone: false });
  });
});

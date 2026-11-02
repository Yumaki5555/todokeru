// データの点検（バリデーション）
// テスト（npm run validate）で public/data のファイルをすべて点検するほか、
// 画面に出す直前にも使い、形の崩れた窓口や、確認の記録がない連絡先は表示しない。
import type {
  Agency,
  AgencyContacts,
  Contact,
  ContactStatus,
  ContactType,
  Municipality,
  MunicipalityContacts,
  Prefecture,
} from '../types';

export const CONTACT_TYPES: ContactType[] = ['general', 'feedback', 'assembly', 'police', 'education', 'department'];
export const CONTACT_STATUSES: ContactStatus[] = ['verified', 'unverified', 'review', 'unavailable', 'discontinued', 'auto_matched'];

/** 全国地方公共団体コード（5けた）の検査数字を足して6けたにする */
export function withCheckDigit(code5: string): string {
  const d = code5.split('').map(Number);
  const sum = d[0] * 6 + d[1] * 5 + d[2] * 4 + d[3] * 3 + d[4] * 2;
  return code5 + String((11 - (sum % 11)) % 10);
}

export function isValidLgCode(code: string): boolean {
  return /^\d{6}$/.test(code) && withCheckDigit(code.slice(0, 5)) === code;
}

const RE_PHONE = /^0\d{1,4}-\d{1,4}-\d{3,4}$/;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_POSTAL = /^\d{3}-\d{4}$/;
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isPhone(v: string): boolean {
  const digits = v.replace(/-/g, '');
  return RE_PHONE.test(v) && digits.length >= 10 && digits.length <= 11;
}

function isHttpsUrl(v: string): boolean {
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
}

function isPastDate(v: string, today: string): boolean {
  if (!RE_DATE.test(v)) return false;
  const t = Date.parse(v + 'T00:00:00Z');
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === v && v <= today;
}

// 確認日は日本時間で付けるので、比べる「今日」も日本時間にする（世界標準時だと朝9時まで前の日になる）
const todayStr = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

/** 窓口1件を点検し、問題点を日本語で返す（問題がなければ空の配列） */
export function validateContact(c: unknown, today = todayStr()): string[] {
  const e: string[] = [];
  if (!c || typeof c !== 'object') return ['窓口が object ではありません'];
  const x = c as Record<string, unknown>;
  const str = (k: string) => typeof x[k] === 'string' && (x[k] as string).trim() !== '';
  const strOrNull = (k: string) => x[k] === null || typeof x[k] === 'string';
  if (!str('id')) e.push('id がありません');
  if (!CONTACT_TYPES.includes(x.type as ContactType)) e.push(`type が不正です: ${String(x.type)}`);
  if (!CONTACT_STATUSES.includes(x.status as ContactStatus)) e.push(`status が不正です: ${String(x.status)}`);
  if (!str('department')) e.push('department（窓口名）がありません');
  for (const k of ['phone', 'email', 'form_url', 'postal_code', 'postal_address', 'hours', 'source_url', 'verified_at']) {
    if (!(k in x)) e.push(`${k} の項目がありません（不明なら null）`);
    else if (!strOrNull(k)) e.push(`${k} は文字列か null にしてください`);
  }
  if ('matched_at' in x && !strOrNull('matched_at')) e.push('matched_at は文字列か null にしてください');
  if ('form_via_page' in x && !strOrNull('form_via_page')) e.push('form_via_page は文字列か null にしてください');
  if (e.length) return e;
  const v = x as unknown as Contact;
  if (v.phone !== null && !isPhone(v.phone)) e.push(`電話番号の形が不正です: ${v.phone}`);
  if (v.email !== null && !RE_EMAIL.test(v.email)) e.push(`メールアドレスの形が不正です: ${v.email}`);
  if (v.form_url !== null && !isHttpsUrl(v.form_url)) e.push(`form_url は https の URL にしてください: ${v.form_url}`);
  if (v.source_url !== null && !isHttpsUrl(v.source_url)) e.push(`source_url は https の URL にしてください: ${v.source_url}`);
  if (v.form_via_page && (!v.form_url || !v.source_url)) e.push('form_via_page（公式ページから開くフォーム）には form_url と source_url が必要です');
  if (v.postal_code !== null && !RE_POSTAL.test(v.postal_code)) e.push(`郵便番号の形が不正です: ${v.postal_code}`);
  if (v.verified_at !== null && !isPastDate(v.verified_at, today)) e.push(`verified_at（確認日）が不正です: ${v.verified_at}`);
  if (v.matched_at != null && !isPastDate(v.matched_at, today)) e.push(`matched_at（照合日）が不正です: ${v.matched_at}`);
  const hasMeans = Boolean(v.phone || v.email || v.form_url || v.postal_address);
  if (v.status === 'verified' || v.status === 'review') {
    if (!v.source_url) e.push('確認済み・要再確認の窓口には公式出典URL（source_url）が必要です');
    if (!v.verified_at) e.push('確認済み・要再確認の窓口には確認日（verified_at）が必要です');
    if (!hasMeans) e.push('確認済み・要再確認の窓口には、電話・メール・フォーム・住所のどれかが必要です');
  }
  if (v.status === 'auto_matched') {
    // 公式サイトと自動照合した代表電話：出典・照合日・電話番号が必要。人が確かめていないので確認日は持たない
    if (v.type !== 'general') e.push('自動照合の窓口は代表電話（general）だけです');
    if (!v.source_url) e.push('自動照合の窓口には公式出典URL（source_url）が必要です');
    if (!v.matched_at) e.push('自動照合の窓口には照合日（matched_at）が必要です');
    if (!v.phone) e.push('自動照合の窓口には電話番号が必要です');
    if (v.verified_at !== null) e.push('自動照合の窓口には確認日（verified_at）を入れません');
  } else if (v.matched_at != null) e.push('照合日（matched_at）は自動照合の窓口だけに入れます');
  if (v.status === 'unavailable' && (!v.source_url || !v.verified_at)) {
    e.push('「公式連絡先が確認できない」とした窓口にも、調べた公式ページ（source_url）と確認日が必要です');
  }
  return e;
}

/** 画面に連絡先を出してよい窓口か（公式確認済み・要再確認・公式サイトと自動照合で、点検に通るものだけ） */
export function isDisplayable(c: Contact): boolean {
  return (c.status === 'verified' || c.status === 'review' || c.status === 'auto_matched') && validateContact(c).length === 0;
}

/** 都道府県ごとの窓口ファイル（contacts/<2けた>.json）を点検する */
export function validateMunicipalityContactsFile(
  prefCode: string,
  records: unknown,
  prefectures: Prefecture[],
  municipalities: Municipality[],
  today = todayStr(),
): string[] {
  if (!Array.isArray(records)) return [`contacts/${prefCode}.json が配列ではありません`];
  const pref = prefectures.find((p) => p.code === prefCode);
  if (!pref) return [`都道府県コード ${prefCode} はマスターにありません`];
  const names = new Map<string, string>([[pref.lg_code, pref.name]]);
  for (const m of municipalities) if (m.pref_code === prefCode) names.set(m.code, m.name);
  const e: string[] = [];
  const seenCodes = new Set<string>();
  const seenIds = new Set<string>();
  for (const r of records as MunicipalityContacts[]) {
    const where = `contacts/${prefCode}.json の ${r?.municipality_code ?? '(コードなし)'}`;
    if (!r || typeof r.municipality_code !== 'string' || !Array.isArray(r.contacts)) {
      e.push(`${where}: 形が不正です`);
      continue;
    }
    if (!names.has(r.municipality_code)) e.push(`${where}: この都道府県のマスターにないコードです`);
    else if (names.get(r.municipality_code) !== r.municipality_name) e.push(`${where}: 自治体名がマスターと違います（${r.municipality_name}）`);
    if (seenCodes.has(r.municipality_code)) e.push(`${where}: 同じ自治体が2回あります`);
    seenCodes.add(r.municipality_code);
    for (const c of r.contacts) {
      for (const msg of validateContact(c, today)) e.push(`${where} ${c?.id ?? ''}: ${msg}`);
      if (c?.id && !c.id.startsWith(r.municipality_code + '-')) e.push(`${where}: id は「自治体コード-種類」の形にしてください（${c.id}）`);
      if (c?.type === 'police' && r.municipality_code !== pref.lg_code) e.push(`${where}: 警察の窓口は都道府県のまとまりに入れます（${c.id}）`);
      if (c?.id && seenIds.has(c.id)) e.push(`${where}: 同じ id が2回あります（${c.id}）`);
      if (c?.id) seenIds.add(c.id);
    }
  }
  return e;
}

/** 国の機関の窓口ファイル（contacts/agencies.json）を点検する */
export function validateAgencyContactsFile(records: unknown, agencies: Agency[], today = todayStr()): string[] {
  if (!Array.isArray(records)) return ['contacts/agencies.json が配列ではありません'];
  const names = new Map(agencies.map((a) => [a.id, a.name]));
  const e: string[] = [];
  const seen = new Set<string>();
  for (const r of records as AgencyContacts[]) {
    const where = `contacts/agencies.json の ${r?.agency_id ?? '(IDなし)'}`;
    if (!r || typeof r.agency_id !== 'string' || !Array.isArray(r.contacts)) {
      e.push(`${where}: 形が不正です`);
      continue;
    }
    if (!names.has(r.agency_id)) e.push(`${where}: 機関マスターにない ID です`);
    else if (names.get(r.agency_id) !== r.agency_name) e.push(`${where}: 機関名がマスターと違います（${r.agency_name}）`);
    if (seen.has(r.agency_id)) e.push(`${where}: 同じ機関が2回あります`);
    seen.add(r.agency_id);
    for (const c of r.contacts) {
      for (const msg of validateContact(c, today)) e.push(`${where} ${c?.id ?? ''}: ${msg}`);
      if (c?.id && !c.id.startsWith(r.agency_id + '-')) e.push(`${where}: id は「機関ID-種類」の形にしてください（${c.id}）`);
    }
  }
  return e;
}

/** マスター（都道府県・市区町村・国の機関）を点検する */
export function validateMasters(prefectures: Prefecture[], municipalities: Municipality[], agencies: Agency[]): string[] {
  const e: string[] = [];
  const prefCodes = new Set<string>();
  for (const p of prefectures) {
    if (!/^\d{2}$/.test(p.code)) e.push(`都道府県コードが2けたではありません: ${p.code}`);
    if (p.lg_code !== withCheckDigit(p.code + '000')) e.push(`都道府県の6けたコードが不正です: ${p.name} ${p.lg_code}`);
    if (!p.name || !p.kana) e.push(`都道府県の名前・よみがありません: ${p.code}`);
    if (prefCodes.has(p.code)) e.push(`都道府県コードの重複: ${p.code}`);
    prefCodes.add(p.code);
  }
  const codes = new Set<string>();
  for (const m of municipalities) {
    if (!isValidLgCode(m.code)) e.push(`市区町村コードの検査数字が合いません: ${m.name} ${m.code}`);
    if (m.code.slice(0, 2) !== m.pref_code || !prefCodes.has(m.pref_code)) e.push(`市区町村の都道府県コードが不正です: ${m.name} ${m.code}`);
    if (!m.name || !m.kana) e.push(`市区町村の名前・よみがありません: ${m.code}`);
    if (codes.has(m.code)) e.push(`市区町村コードの重複: ${m.code}`);
    codes.add(m.code);
  }
  const ids = new Set<string>();
  for (const a of agencies) {
    if (!/^[a-z][a-z0-9-]*$/.test(a.id)) e.push(`機関IDは半角英小文字で: ${a.id}`);
    if (ids.has(a.id)) e.push(`機関IDの重複: ${a.id}`);
    ids.add(a.id);
    if (!['cabinet', 'ministry', 'agency', 'diet'].includes(a.category)) e.push(`機関の分類が不正です: ${a.id}`);
    if (!isHttpsUrl(a.official_url)) e.push(`機関の公式サイトは https の URL に: ${a.id}`);
    if (!RE_DATE.test(a.url_checked_at)) e.push(`機関の確認日が不正です: ${a.id}`);
  }
  return e;
}

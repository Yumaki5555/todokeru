// 連絡先の管理画面（admin/server.mjs）の中身の処理
// 画面での「確認できた」「直す」「新しく登録」などを、public/data/contacts の JSON に反映する前の組み立てと点検を受け持つ。
// ファイルの読み書きやネットへの接続はしない（それは server.mjs が行う）。テストは tests/admin.test.ts。
// Node でそのまま読み込めるよう、型だけの import は import type にし、拡張子 .ts を付けている。
import type { Agency, AgencyCategory, Contact, ContactStatus, ContactType, Municipality, Prefecture } from '../src/types.ts';
import {
  CONTACT_TYPE_INFO,
  EXTRA_TYPES_FOR_MUNI,
  EXTRA_TYPES_FOR_PREF,
  STATUS_LABEL,
  TYPES_FOR_AGENCY,
  TYPES_FOR_DIET,
  TYPES_FOR_LOCAL,
} from '../src/data/labels.ts';
import { validateContact } from '../src/data/validate.ts';

export { CONTACT_TYPE_INFO, STATUS_LABEL };

/** 管理画面で選ぶ「どこの窓口か」（都道府県・市区町村・国の機関） */
export interface Entity {
  key: string; // 自治体コード6けた、または機関ID
  name: string;
  kind: 'pref' | 'muni' | 'agency';
  file: string; // contacts/<file>.json
  pref_code?: string;
  pref_name?: string;
  category?: AgencyCategory;
  official_url?: string;
}

/** ファイルの中の1つのまとまり（自治体ごと・機関ごと） */
export interface ContactRecord {
  municipality_code?: string;
  municipality_name?: string;
  agency_id?: string;
  agency_name?: string;
  contacts: Contact[];
}

/** 画面の入力欄から届く窓口の中身（文字はまだ整えていない） */
export interface ContactInput {
  type: ContactType;
  department: string;
  phone?: string;
  email?: string;
  form_url?: string;
  postal_code?: string;
  postal_address?: string;
  hours?: string;
  source_url?: string;
  note?: string;
  /** checked：公式ページで確かめた（今日の日付で公式確認済み）／unchecked：まだ（サイトには出さない） */
  check: 'checked' | 'unchecked';
}

export type AdminAction =
  | { kind: 'verify'; id: string }
  | { kind: 'edit'; id: string; input: ContactInput }
  | { kind: 'add'; input: ContactInput }
  | { kind: 'status'; id: string; status: 'review' | 'discontinued' }
  | { kind: 'delete'; id: string };

export interface ChangeLogEntry {
  date: string;
  batch: string;
  id: string;
  change: 'added' | 'updated' | 'deleted';
  status?: ContactStatus;
  fields?: Record<string, [unknown, unknown]>;
}

export const BATCH = 'manual-admin';
export const TYPE_ORDER: ContactType[] = ['general', 'feedback', 'assembly', 'police', 'education', 'department'];
/** サイトの画面に出す確認状態（ここに入る窓口は、出典が公式のページでないといけない） */
const SHOWN: ContactStatus[] = ['verified', 'review', 'auto_matched'];
/** 人が確かめられなかったときに research-merge が付ける補足（確かめ直したら消す） */
const MERGE_REVIEW_NOTE = '最新の公式ページで確認できませんでした';

export const jstToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

/** 管理画面で選べる機関・自治体の一覧（都道府県 → その市区町村、最後に国の機関） */
export function listEntities(prefectures: Prefecture[], municipalities: Municipality[], agencies: Agency[]): Entity[] {
  const out: Entity[] = [];
  for (const p of prefectures) {
    out.push({ key: p.lg_code, name: p.name, kind: 'pref', file: p.code, pref_code: p.code, pref_name: p.name });
    for (const m of municipalities.filter((x) => x.pref_code === p.code))
      out.push({ key: m.code, name: m.name, kind: 'muni', file: p.code, pref_code: p.code, pref_name: p.name });
  }
  for (const a of agencies)
    out.push({ key: a.id, name: a.name, kind: 'agency', file: 'agencies', category: a.category, official_url: a.official_url });
  return out;
}

/** その機関・自治体で、サイトに出る窓口の種類（ここにない種類は登録しても画面に出ない） */
export function allowedTypes(e: Entity): ContactType[] {
  if (e.kind === 'pref') return [...TYPES_FOR_LOCAL, ...EXTRA_TYPES_FOR_PREF];
  if (e.kind === 'muni') return [...TYPES_FOR_LOCAL, ...EXTRA_TYPES_FOR_MUNI];
  return e.category === 'diet' ? TYPES_FOR_DIET : TYPES_FOR_AGENCY;
}

export function findRecord(records: ContactRecord[], e: Entity): ContactRecord | undefined {
  return records.find((r) => (e.kind === 'agency' ? r.agency_id : r.municipality_code) === e.key);
}

// ---- 入力の整え ----

/** 番号・メール・URL：全角の英数字や記号を半角にそろえる */
const blank = (v: string | undefined) => {
  const s = (v ?? '').normalize('NFKC').trim();
  return s === '' ? null : s;
};
/** 窓口名・住所・受付時間・補足：日本語の文なので、全角かっこ「（）」などはそのまま（前後の空白だけ取る） */
const text = (v: string | undefined) => {
  const s = (v ?? '').trim();
  return s === '' ? null : s;
};
const DASHES = /[‐‑‒–—―−ーｰ－]/g;

/** 電話番号：全角→半角、いろいろな横棒・かっこ → ハイフン（03(1234)5678 → 03-1234-5678） */
export function normalizePhone(v: string | undefined): string | null {
  const s = blank(v);
  if (!s) return null;
  return s
    .replace(DASHES, '-')
    .replace(/[（(]/g, '-')
    .replace(/[）)]/g, '-')
    .replace(/\s+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** 郵便番号：〒・全角を取り、7けたなら 135-8383 の形に */
export function normalizePostal(v: string | undefined): string | null {
  const s = blank(v)?.replace(/^〒\s*/, '').replace(DASHES, '-').replace(/\s+/g, '');
  if (!s) return null;
  return /^\d{7}$/.test(s) ? `${s.slice(0, 3)}-${s.slice(3)}` : s;
}

/** メール：全角→半角、「(at)」「＠」→ @ */
export function normalizeEmail(v: string | undefined): string | null {
  const s = blank(v);
  return s ? s.replace(/\s*[(\[]\s*at\s*[)\]]\s*/gi, '@').replace(/\s+/g, '') : null;
}

/** 公式ドメイン（go.jp・lg.jp・pref./city. など、または research/official-hosts.json で確かめたもの）のページか */
export function isOfficialUrl(url: string | null | undefined, extraHosts: Set<string>): boolean {
  if (!url) return false;
  let h: string;
  try {
    h = new URL(url).host.toLowerCase();
  } catch {
    return false;
  }
  return extraHosts.has(h) || /(^|\.)(lg|go)\.jp$/.test(h) || /(^|\.)(pref|city|town|vill|metro)\.[a-z0-9-]+(\.[a-z0-9-]+)*\.jp$/.test(h);
}

/** 新しい窓口の id：「コード-種類」、同じ種類がもうあれば「コード-種類-2」「-3」… */
export function nextId(key: string, type: ContactType, existing: Contact[]): string {
  const ids = new Set(existing.map((c) => c.id));
  if (!ids.has(`${key}-${type}`)) return `${key}-${type}`;
  let n = 2;
  while (ids.has(`${key}-${type}-${n}`)) n++;
  return `${key}-${type}-${n}`;
}

/** 点検の言葉に出てくる項目名を、画面の欄の名前に直す */
const KEYS = 'source_url|verified_at|matched_at|form_via_page|form_url|department|postal_code|postal_address|general';
const FIELD_NAMES: [RegExp, string][] = [
  [new RegExp(`(?:${KEYS})（([^）]+)）`, 'g'), '$1'], // verified_at（確認日） → 確認日
  [new RegExp(`（(?:${KEYS})）`, 'g'), ''], // 照合日（matched_at） → 照合日
  [/source_url|公式出典URL/g, '出典ページのURL'],
  [/verified_at/g, '確認日'],
  [/matched_at/g, '照合日'],
  [/form_via_page/g, '公式ページから開くフォーム'],
  [/form_url/g, 'フォームのURL'],
  [/postal_code/g, '郵便番号'],
  [/postal_address/g, '住所'],
];
export const plainMessage = (m: string) => FIELD_NAMES.reduce((s, [re, to]) => s.replace(re, to), m);

/** 入力欄の中身から窓口1件を組み立てる（status と日付は、確かめたかどうかで決める） */
export function buildContact(id: string, input: ContactInput, base: Partial<Contact>, today: string): Contact {
  const checked = input.check === 'checked';
  const c: Contact = {
    id,
    type: input.type,
    department: text(input.department) ?? '',
    phone: normalizePhone(input.phone),
    email: normalizeEmail(input.email),
    form_url: blank(input.form_url),
    postal_code: normalizePostal(input.postal_code),
    postal_address: text(input.postal_address),
    hours: text(input.hours),
    source_url: blank(input.source_url),
    verified_at: checked ? today : null,
    status: checked ? 'verified' : 'unverified',
    note: text(input.note),
  };
  // フォームが同じなら「公式ページから開くフォーム」の印はそのまま引き継ぐ
  if (base.form_via_page && base.form_url === c.form_url) c.form_via_page = base.form_via_page;
  return c;
}

/** 窓口1件を点検する（形・公式の出典・代表電話の流用・画面に出る種類）。問題点を画面向けの言葉で返す */
export function checkContact(c: Contact, rec: Contact[], e: Entity, today: string, extraHosts: Set<string>): string[] {
  const errs = validateContact(c, today).map(plainMessage);
  if (!c.department.trim()) errs.push('窓口名を入れてください');
  if (c.phone && /^\d+$/.test(c.phone)) errs.push('電話番号は 03-1234-5678 のように、ハイフン（-）で区切って入れてください');
  if (SHOWN.includes(c.status) && c.source_url && !isOfficialUrl(c.source_url, extraHosts))
    errs.push(
      '出典ページが役所の公式サイト（lg.jp・go.jp・city.〜.jp など）ではないようです。役所の公式ページのURLにしてください（議会などが独自の名前のサイトのときは、Claude に「公式のサイトとして追加して」と頼んでください）',
    );
  if (c.type === 'police' && e.kind === 'muni') errs.push(`警察の窓口は、都道府県（${e.pref_name}）のページで登録してください（市区町村の結果にも自動で出ます）`);
  else if (!allowedTypes(e).includes(c.type)) errs.push(`この${e.kind === 'agency' ? '機関' : '自治体'}では「${CONTACT_TYPE_INFO[c.type].label}」はサイトに出ません`);
  if (c.type !== 'general' && SHOWN.includes(c.status) && c.phone) {
    const general = rec.find((x) => x.type === 'general' && x.id !== c.id && SHOWN.includes(x.status));
    if (general?.phone === c.phone && general.source_url === c.source_url)
      errs.push('代表電話と同じ番号で、出典ページも同じです。代表電話を流用していないか、窓口のページで確かめてください（窓口のページに同じ番号が書かれているなら、出典をそのページにしてください）');
  }
  return [...new Set(errs)];
}

const diffFields = (a: Contact, b: Contact) => {
  const out: Record<string, [unknown, unknown]> = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof Contact>) {
    if (k === 'id') continue;
    if ((a[k] ?? null) !== (b[k] ?? null)) out[k] = [a[k] ?? null, b[k] ?? null];
  }
  return out;
};

export interface ApplyResult {
  records: ContactRecord[];
  changes: ChangeLogEntry[];
  errors: string[];
  id?: string;
}

/**
 * 画面の操作を1つ反映した新しい records を返す（元の records は変えない）。
 * 点検に通らなければ errors に理由を入れ、records は元のまま返す。
 */
export function applyAction(
  records: ContactRecord[],
  e: Entity,
  action: AdminAction,
  opts: { today: string; extraHosts: Set<string>; agencyOrder?: string[] },
): ApplyResult {
  const { today, extraHosts } = opts;
  const next: ContactRecord[] = structuredClone(records);
  let rec = findRecord(next, e);
  if (!rec) {
    rec = e.kind === 'agency' ? { agency_id: e.key, agency_name: e.name, contacts: [] } : { municipality_code: e.key, municipality_name: e.name, contacts: [] };
    next.push(rec);
  }
  const fail = (...errors: string[]) => ({ records, changes: [], errors });
  const idx = 'id' in action ? rec.contacts.findIndex((c) => c.id === action.id) : -1;
  if ('id' in action && idx < 0) return fail('その窓口が見つかりません（ほかの作業で変わったかもしれません。画面を読み込み直してください）');
  const old = idx >= 0 ? rec.contacts[idx] : undefined;

  let updated: Contact | null;
  if (action.kind === 'add') {
    updated = buildContact(nextId(e.key, action.input.type, rec.contacts), action.input, {}, today);
  } else if (action.kind === 'edit') {
    // 種類を変えたら、id もその種類に合わせる
    const id = action.input.type === old!.type ? old!.id : nextId(e.key, action.input.type, rec.contacts);
    updated = buildContact(id, action.input, old!, today);
  } else if (action.kind === 'verify') {
    updated = { ...old!, status: 'verified', verified_at: today };
    delete updated.matched_at;
    if (updated.note === MERGE_REVIEW_NOTE) updated.note = null;
  } else if (action.kind === 'status') {
    if (action.status === 'review' && old!.status !== 'verified') return fail('「要再確認」にできるのは、公式確認済みの窓口だけです');
    updated = { ...old!, status: action.status };
    delete updated.matched_at; // 照合日は自動照合の窓口だけが持つ
  } else {
    updated = null;
  }

  if (updated) {
    const others = rec.contacts.filter((_, i) => i !== idx);
    if (others.some((c) => c.id === updated!.id)) return fail(`同じ id の窓口がすでにあります（${updated.id}）`);
    // 「変更・廃止」にした窓口は画面に出ないので、形の点検だけにする
    const errors = updated.status === 'discontinued' ? validateContact(updated, today).map(plainMessage) : checkContact(updated, others, e, today, extraHosts);
    if (errors.length) return fail(...errors);
    if (idx >= 0) rec.contacts[idx] = updated;
    else rec.contacts.push(updated);
  } else {
    rec.contacts.splice(idx, 1);
  }

  rec.contacts.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || a.id.localeCompare(b.id));
  const kept = next.filter((r) => r.contacts.length > 0);
  if (e.kind === 'agency' && opts.agencyOrder) kept.sort((a, b) => opts.agencyOrder!.indexOf(a.agency_id!) - opts.agencyOrder!.indexOf(b.agency_id!));
  else kept.sort((a, b) => String(a.municipality_code).localeCompare(String(b.municipality_code)));

  let change: ChangeLogEntry;
  if (!old) change = { date: today, batch: BATCH, id: updated!.id, change: 'added', status: updated!.status };
  else if (!updated) change = { date: today, batch: BATCH, id: old.id, change: 'deleted', status: old.status };
  else {
    const fields = diffFields(old, updated);
    if (!Object.keys(fields).length) return { records, changes: [], errors: [], id: old.id };
    change = { date: today, batch: BATCH, id: updated.id, change: 'updated', fields };
    if (updated.id !== old.id) change.fields!.id = [old.id, updated.id];
  }
  return { records: kept, changes: [change], errors: [], id: updated?.id };
}

// ---- 出典ページの中を探す（「ページの中を自動で探す」ボタン） ----

/** ページの文字コードを読み取って文字にする */
export function decodePage(buf: Uint8Array, contentType: string): string {
  let cs = /charset=([\w-]+)/i.exec(contentType || '')?.[1];
  if (!cs) cs = /<meta[^>]+charset=["']?([\w-]+)/i.exec(Buffer.from(buf.slice(0, 4096)).toString('latin1'))?.[1];
  cs = (cs || 'utf-8').toLowerCase();
  if (['shift-jis', 'sjis', 'x-sjis', 'windows-31j', 'cp932'].includes(cs)) cs = 'shift_jis';
  try {
    return new TextDecoder(cs).decode(buf);
  } catch {
    return new TextDecoder('utf-8').decode(buf);
  }
}

const ENTITIES: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ensp: ' ', emsp: ' ', thinsp: ' ' };
/** HTML から本文の文字だけを取り出す（全角は半角にそろえる） */
export function pageText(html: string): string {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .normalize('NFKC')
    .replace(/\s+/g, ' ');
}

const squash = (s: string) => s.normalize('NFKC').replace(/\s/g, '');

/** 窓口の各項目が、出典ページに書かれているか（true：見つかった／false：見つからない。項目が空なら入れない） */
export function findOnPage(
  c: { phone?: string | null; email?: string | null; form_url?: string | null; postal_code?: string | null; postal_address?: string | null },
  raw: string,
  prefName?: string,
): Record<string, boolean> {
  const text = pageText(raw);
  const out: Record<string, boolean> = {};
  if (c.phone) out.phone = new RegExp('(?<!\\d)' + c.phone.split('-').join('\\D{0,4}') + '(?!\\d)').test(text);
  if (c.email) {
    const m = c.email.toLowerCase();
    out.email = text.toLowerCase().replace(/\s*[(\[［（]\s*at\s*[)\]］）]\s*/g, '@').includes(m) || raw.toLowerCase().includes('mailto:' + m);
  }
  if (c.form_url) {
    const r = raw.replace(/&amp;/g, '&');
    let path = '';
    try {
      path = new URL(c.form_url).pathname;
    } catch {
      /* 形の誤りは保存のときの点検で知らせる */
    }
    out.form_url = r.includes(c.form_url) || r.includes(c.form_url.replace(/^https:/, '')) || (path.length > 1 && r.includes(path));
  }
  if (c.postal_code) {
    const [a, b] = c.postal_code.split('-');
    out.postal_code = new RegExp(`(?<!\\d)${a}\\D{0,2}${b ?? ''}(?!\\d)`).test(text);
  }
  if (c.postal_address) {
    const t = squash(text);
    const a = squash(c.postal_address);
    out.postal_address = t.includes(a) || Boolean(prefName && a.startsWith(prefName) && a.length - prefName.length >= 4 && t.includes(a.slice(prefName.length)));
  }
  return out;
}

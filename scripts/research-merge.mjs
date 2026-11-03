// 調査結果（research/batches/<バッチ>.json）を照合して、公開データ（public/data/contacts）に反映するスクリプト
// 実行：npm run research:merge -- pref-01        （--dry をつけると照合だけして書き込まない）
//
// 照合のしかた（調査メモをそのまま信じない）：
//   1. 出典ページ（source_url）をこのスクリプトが自分で開き直す。開けなければ「未確認」。
//   2. 電話番号・メールアドレス・郵便番号・住所・受付時間の数字が、そのページの本文に本当に書かれているかを確かめる。
//      書かれていない項目は捨てる（null にする）。
//   3. 問い合わせフォームは、出典ページからリンクされているか、公式ドメインで開けることを確かめる。
//   4. 出典が公式ドメイン（go.jp・lg.jp・pref./city./town./vill. など）でなければ「未確認」。
//   5. 代表電話と同じ番号を、同じページを出典にして広聴・議会の番号にしていたら捨てる（代表電話の流用を防ぐ）。
//   6. 電話・メール・フォームのどれかが照合に通った窓口だけを「公式確認済み」とし、確認日は照合した日にする。
// 反映のしかた：
//   - 既存の窓口は消さない。内容が変わったら新しい公式情報で更新し、research/changelog.jsonl に変更履歴を残す。
//   - 以前は確認済みだった窓口が今回確認できなければ、消さずに「要再確認」にする。
//   - 最後に summary.json を作り直し、research/progress.json のバッチを「反映済み」にする。
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const writeJson = (p, v, indent = 1) => writeFileSync(join(root, p), JSON.stringify(v, null, indent) + '\n', 'utf8');

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const batchId = args.find((a) => !a.startsWith('--'));
if (!batchId) {
  console.error('使い方：npm run research:merge -- <バッチID>（例 pref-01）');
  process.exit(1);
}
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }); // YYYY-MM-DD（日本時間）

const batch = readJson(`research/batches/${batchId}.json`);
const progress = readJson('research/progress.json');
const plan = progress.batches.find((b) => b.id === batchId);
if (!plan) throw new Error(`progress.json に ${batchId} がありません`);

const prefectures = readJson('public/data/master/prefectures.json').items;
const municipalities = readJson('public/data/master/municipalities.json').items;
const agencies = readJson('public/data/master/agencies.json').items;
const targetCodes = new Set(plan.targets.map((t) => t.code));

// 請願・陳情の届け先・警察・教育委員会は見つかったときだけ書けばよい（調査結果がなくても誤りにしない）
const REQUIRED = ['general', 'feedback', 'assembly'];

/** 機関・自治体を調べる（コード・名前・調べる窓口の種類・保存先ファイル） */
function lookup(code) {
  const a = agencies.find((x) => x.id === code);
  if (a) return { name: a.name, ...(a.category === 'diet' ? { types: ['general', 'petition'], required: ['general'] } : { types: ['general', 'feedback'] }), file: 'agencies', key: 'agency' };
  const p = prefectures.find((x) => x.lg_code === code);
  if (p) return { name: p.name, types: ['general', 'feedback', 'assembly', 'petition', 'police', 'education'], required: REQUIRED, file: p.code, key: 'municipality' };
  const m = municipalities.find((x) => x.code === code);
  if (m) return { name: m.name, types: ['general', 'feedback', 'assembly', 'petition', 'education'], required: REQUIRED, file: m.pref_code, key: 'municipality' };
  return null;
}

// ---- 公式ドメインの判定 ----
// go.jp・lg.jp などのほか、公式ページからのリンクで公式と確かめたドメイン（research/official-hosts.json）
const extraHosts = new Set(readJson('research/official-hosts.json').hosts.map((h) => h.host));
function isOfficialHost(host) {
  return (
    extraHosts.has(host) || /(^|\.)(lg|go)\.jp$/.test(host) || /(^|\.)(pref|city|town|vill|metro)\.[a-z0-9-]+(\.[a-z0-9-]+)*\.jp$/.test(host)
  );
}

// 自動取得できない（ロボット拒否など）出典ページを、ブラウザで直接確かめた記録（research/manual-checks.json）
const manualChecks = new Map(readJson('research/manual-checks.json').checks.map((m) => [m.id, m]));
const hostOf = (u) => {
  try {
    return new URL(u).host.toLowerCase();
  } catch {
    return '';
  }
};
const isHttps = (u) => typeof u === 'string' && /^https:\/\//.test(u) && hostOf(u) !== '';

// ---- ページを開く（同じ URL は1回だけ。巡回ルールは todokeru_tools/02_collect_candidates.py の Client と同じ） ----
//   robots.txt（RFC 9309）を守る・同じサイトへは前の取得が終わってから 1.5秒以上（Crawl-delay があればその秒数）あける・
//   401/403/429/503 が返ったらそのサイトはその回はやめる・転送は自分でたどり、行き先ごとに同じ確認をする
const pageCache = new Map();
const lastHit = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA_TOKEN = 'todokerupubliccontactresearch';
const MIN_GAP_MS = 1500;
const MAX_CRAWL_DELAY = 600; // これより長い Crawl-delay（秒）のサイトは取りに行かない
const STOP_CODES = new Set([401, 403, 429, 503]);
const robotsCache = new Map(); // origin → 判定 | false（制限なし）| null（確かめられない＝取りに行かない）
const stopped = new Map(); // host → 断られたときの HTTP 状態
const safeDecode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

// robots.txt の読み方：空行では区切らない・* と $ が使える・いちばん長く一致した指定に従う（同じ長さなら許可）
function parseRobots(text) {
  const groups = [];
  let cur = null;
  let uaRun = false;
  for (const raw of text.replace(/^﻿/, '').split(/\r\n|\r|\n/)) {
    const line = raw.split('#')[0].trim();
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim().toLowerCase();
    const v = line.slice(i + 1).trim();
    if (k === 'user-agent' || k === 'useragent') {
      if (!uaRun) groups.push((cur = { ua: new Set(), rules: [], delay: null }));
      cur.ua.add(v.split('/')[0].trim().toLowerCase());
      uaRun = true;
    } else if (cur) {
      uaRun = false;
      if ((k === 'allow' || k === 'disallow') && v) {
        const pat = safeDecode(v);
        const end = pat.endsWith('$');
        const body = (end ? pat.slice(0, -1) : pat).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
        cur.rules.push({ allow: k === 'allow', n: pat.length, rx: new RegExp('^' + body + (end ? '$' : ''), 's') });
      } else if (k === 'crawl-delay' && v !== '' && Number.isFinite(Number(v))) cur.delay = Math.max(cur.delay ?? 0, Number(v));
    }
  }
  let mine = groups.filter((g) => g.ua.has(UA_TOKEN));
  if (!mine.length) mine = groups.filter((g) => g.ua.has('*'));
  return { rules: mine.flatMap((g) => g.rules), delay: Math.max(0, ...mine.map((g) => g.delay ?? 0)) };
}
function robotsAllows(robots, url) {
  const u = new URL(url);
  const path = safeDecode(u.pathname + u.search);
  if (path === '/robots.txt') return true;
  let best = null;
  for (const r of robots.rules) if (r.rx.test(path) && (!best || r.n > best.n || (r.n === best.n && r.allow))) best = r;
  return !best || best.allow;
}
async function politeWait(url) {
  const r = robotsCache.get(new URL(url).origin);
  const wait = (lastHit.get(hostOf(url)) || 0) + Math.max(MIN_GAP_MS, (r ? r.delay : 0) * 1000) - Date.now();
  if (wait > 0) await sleep(wait);
}
async function crawlBlock(url) {
  const host = hostOf(url);
  if (stopped.has(host)) return `同じサイトに断られたため中止（HTTP ${stopped.get(host)}）`;
  const origin = new URL(url).origin;
  if (!robotsCache.has(origin)) {
    await politeWait(url);
    let v = null;
    try {
      const r = await fetch(origin + '/robots.txt', { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(10000) });
      // robots.txt が 4xx（無い・閲覧不可）なら制限なし、5xx・通信失敗は全部だめ（RFC 9309 2.3.1.3・2.3.1.4）
      if (r.ok) v = parseRobots((await r.text()).slice(0, 500000));
      else if (r.status >= 400 && r.status < 500) v = false;
    } catch {
      v = null;
    }
    lastHit.set(host, Date.now());
    robotsCache.set(origin, v);
  }
  const robots = robotsCache.get(origin);
  if (robots === null) return 'robots.txt を確かめられないため取得しない';
  if (robots && !robotsAllows(robots, url)) return 'robots.txt で自動取得が禁止されている';
  if (robots && robots.delay > MAX_CRAWL_DELAY) return `robots.txt の間隔指定が長すぎる（${robots.delay}秒）`;
  return null;
}
// 取得できたら { status, ok, ct, buf, finalUrl }、ルールで取りに行かないときは { blocked: 理由 }
async function politeFetch(url) {
  for (let hop = 0; hop <= 5; hop++) {
    const why = await crawlBlock(url);
    if (why) return { blocked: why };
    await politeWait(url);
    const host = hostOf(url);
    try {
      const r = await fetch(url, { headers: HEADERS, redirect: 'manual', signal: AbortSignal.timeout(25000) });
      const loc = r.status >= 300 && r.status < 400 ? r.headers.get('location') : null;
      const ct = r.headers.get('content-type') || '';
      if (STOP_CODES.has(r.status)) stopped.set(host, r.status);
      const buf = !loc && !/pdf/i.test(ct) ? new Uint8Array(await r.arrayBuffer()) : null;
      if (!buf) await r.body?.cancel();
      if (loc) {
        url = new URL(loc, url).href;
        continue;
      }
      return { status: r.status, ok: r.ok, ct, buf, finalUrl: url };
    } finally {
      lastHit.set(host, Date.now());
    }
  }
  return { blocked: '転送が多すぎる' };
}

function decode(buf, contentType) {
  let cs = /charset=([\w-]+)/i.exec(contentType || '')?.[1];
  if (!cs) {
    const head = Buffer.from(buf.slice(0, 4096)).toString('latin1');
    cs = /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1];
  }
  cs = (cs || 'utf-8').toLowerCase();
  if (cs === 'shift-jis' || cs === 'sjis' || cs === 'x-sjis' || cs === 'windows-31j' || cs === 'cp932') cs = 'shift_jis';
  try {
    return new TextDecoder(cs).decode(buf);
  } catch {
    return new TextDecoder('utf-8').decode(buf);
  }
}

const HEADERS = { 'user-agent': 'Mozilla/5.0 (compatible; TodokeruPublicContactResearch/1.0; +https://yumaki5555.github.io/todokeru/)', 'accept-language': 'ja' };
async function fetchPage(url) {
  if (pageCache.has(url)) return pageCache.get(url);
  const job = (async () => {
    try {
      const r = await politeFetch(url);
      if (r.blocked) return { ok: false, error: r.blocked };
      if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
      if (/pdf/i.test(r.ct)) return { ok: false, error: 'PDF のため自動照合できない' };
      const raw = decode(r.buf, r.ct);
      return { ok: true, raw, text: toText(raw), finalUrl: r.finalUrl };
    } catch (e) {
      return { ok: false, error: e.name === 'TimeoutError' ? 'タイムアウト' : String(e.message || e) };
    }
  })();
  pageCache.set(url, job);
  return job;
}

const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ensp: ' ', emsp: ' ', thinsp: ' ' };
function toText(html) {
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
const squash = (s) => s.normalize('NFKC').replace(/[\s　]/g, '');

// ---- 項目ごとの照合 ----
function phoneOnPage(phone, text) {
  const parts = phone.split('-');
  const re = new RegExp('(?<!\\d)' + parts.join('\\D{0,4}') + '(?!\\d)');
  return re.test(text);
}
function emailOnPage(email, page) {
  const e = email.toLowerCase();
  const t = page.text.toLowerCase().replace(/\s*[(\[［（]\s*at\s*[)\]］）]\s*/g, '@');
  return t.includes(e) || page.raw.toLowerCase().includes('mailto:' + e);
}
function postalOnPage(code, text) {
  const [a, b] = code.split('-');
  return new RegExp(`(?<!\\d)${a}\\D{0,2}${b}(?!\\d)`).test(text);
}
function addressOnPage(addr, text, prefName) {
  const t = squash(text);
  const a = squash(addr);
  if (t.includes(a)) return true;
  // ページでは都道府県名を省いて書くことが多い
  return prefName && a.startsWith(prefName) && a.length - prefName.length >= 4 && t.includes(a.slice(prefName.length));
}
function hoursOnPage(hours, text) {
  const nums = squash(hours).match(/\d+/g) || [];
  if (!nums.length) return squash(text).includes(squash(hours));
  const pageNums = new Set(text.match(/\d+/g) || []);
  return nums.every((n) => pageNums.has(n) || pageNums.has(String(Number(n))));
}
async function formOk(formUrl, sourceUrl, page) {
  if (!isHttps(formUrl)) return { ok: false, why: 'https の URL ではない' };
  const raw = page.raw.replace(/&amp;/g, '&');
  const u = new URL(formUrl);
  const cands = [formUrl, formUrl.replace(/^https:/, ''), formUrl.replace(/\/$/, '')];
  if (u.host === hostOf(sourceUrl)) cands.push(u.pathname + u.search, u.pathname);
  const linked = formUrl === sourceUrl || cands.some((c) => c.length > 1 && raw.includes(c));
  if (linked) return { ok: true };
  if (isOfficialHost(u.host)) {
    const f = await fetchPage(formUrl);
    if (f.ok) return { ok: true };
    return { ok: false, why: `フォームのページを開けない（${f.error}）` };
  }
  return { ok: false, why: '出典ページからのリンクを確認できない外部のフォーム' };
}

// 役所のページから来た人だけに表示するフォーム（直接開くと「正規のアクセス元から閲覧要求されていません」と出る）を見分け、
// 出典ページにあるフォームへのリンクの文字を返す。サイトのボタンは出典ページへ案内し、この文字を押すよう伝える
async function formViaPage(formUrl, page) {
  const u = new URL(formUrl);
  if (!u.pathname.includes('/cgi-bin/')) return null; // この仕組みのフォームは /cgi-bin/enquetes/・/cgi-bin/contacts/ にある
  let label = null;
  for (const m of page.raw.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const h = m[1].replace(/&amp;/g, '&');
    if (h !== formUrl && !h.endsWith(u.pathname + u.search)) continue;
    label = toText(m[2]).trim().replace(/[。.]$/, '') || null;
    if (label) break;
  }
  if (!label) return null;
  let text;
  try {
    const r = await politeFetch(formUrl);
    // robots.txt などで確かめられないときは、確実に開ける「出典ページから開く」案内にする
    if (r.blocked) return label;
    text = r.buf ? toText(decode(r.buf, r.ct)) : '';
  } catch {
    return null;
  }
  if (!text.includes('正規のアクセス元')) return null;
  return label;
  return 'フォームへのリンク';
}

const pick = (c, k) => (typeof c[k] === 'string' && c[k].trim() !== '' ? c[k].trim() : null);

/** 調査メモの窓口1件を照合して、公開用の窓口（Contact）にする */
async function verifyContact(entity, c0, info, generalOf) {
  const id = `${entity.code}-${c0.type}`;
  const found = manualChecks.get(id);
  const manual = found && !found.reject ? found : null;
  const c = manual ? { ...c0, ...manual.fields, agent_status: 'found' } : c0;
  const report = { id, agent_status: c0.agent_status, checks: {}, status: '' };
  const base = {
    id,
    type: c.type,
    department: pick(c, 'department') || { general: '代表窓口', feedback: '広聴・ご意見窓口', assembly: '議会事務局', petition: '議会事務局', police: '警察本部', education: '教育委員会' }[c.type],
    phone: null,
    email: null,
    form_url: null,
    postal_code: null,
    postal_address: null,
    hours: null,
    source_url: isHttps(c.source_url) ? c.source_url : null,
    verified_at: null,
    status: 'unverified',
    note: null,
  };
  const src = base.source_url;
  if (found?.reject) {
    // 人が見て、窓口の用途が違う（例：ウェブサイトの感想の受付）と判断したもの
    report.status = base.status;
    report.why = found.reason;
    return { contact: { ...base, note: null }, report };
  }
  if (!src) {
    report.status = base.status;
    report.why = '出典URLがない';
    base.source_url = null;
    return { contact: base, report };
  }
  if (!isOfficialHost(hostOf(src))) {
    report.status = base.status;
    report.why = `公式ドメインか自動で判定できない（${hostOf(src)}）`;
    base.note = '出典の確認待ち';
    return { contact: base, report };
  }
  // ブラウザで直接確かめた項目だけを使う（自動取得が拒否されたとき・確認用の別ページが返ってきたとき）
  const useManual = () => {
    for (const k of ['phone', 'email', 'form_url', 'postal_code', 'postal_address', 'hours']) base[k] = pick(manual.fields, k);
    base.note = pick(manual.fields, 'note');
    base.status = base.phone || base.email || base.form_url ? 'verified' : 'unverified';
    base.verified_at = base.status === 'verified' ? manual.checked_at : null;
    report.status = base.status;
    report.method = manual.method;
    return { contact: base, report };
  };
  const page = await fetchPage(src);
  if (!page.ok && manual && manual.fields.source_url === src) return useManual();
  if (!page.ok) {
    report.status = base.status;
    report.why = `出典ページを開けない（${page.error}）`;
    base.note = '出典ページを自動で開けなかったため未確認';
    return { contact: base, report };
  }
  if (c.agent_status === 'not_found') {
    base.status = 'unavailable';
    base.verified_at = today;
    // 「見つからない」理由がページに書かれていれば（休止中など）、その文をそのまま案内に使う
    const ev = pick(c, 'evidence');
    if (ev && ev.length <= 80 && squash(page.text).includes(squash(ev))) base.note = `公式ページの案内：${ev}`;
    report.status = base.status;
    return { contact: base, report };
  }
  if (c.agent_status !== 'found') {
    report.status = base.status;
    report.why = `調査で確認できなかった（${c.agent_status}）`;
    return { contact: base, report };
  }

  const phone = pick(c, 'phone');
  if (phone) {
    const sameAsGeneral = c.type !== 'general' && generalOf && generalOf.phone === phone && generalOf.source_url === src;
    const ok = /^0\d{1,4}-\d{1,4}-\d{3,4}$/.test(phone) && phoneOnPage(phone, page.text) && !sameAsGeneral;
    report.checks.phone = ok ? 'ok' : sameAsGeneral ? '代表電話の流用のため除外' : 'ページで確認できない';
    if (ok) base.phone = phone;
    if (ok && c.type !== 'general' && generalOf && generalOf.phone === phone) base.note = '代表電話と同じ番号です';
  }
  const email = pick(c, 'email');
  if (email) {
    const ok = emailOnPage(email, page);
    report.checks.email = ok ? 'ok' : 'ページで確認できない';
    if (ok) base.email = email;
  }
  const form = pick(c, 'form_url');
  if (form) {
    const r = await formOk(form, src, page);
    report.checks.form_url = r.ok ? 'ok' : r.why;
    if (r.ok) {
      base.form_url = form;
      const via = await formViaPage(form, page);
      if (via) {
        base.form_via_page = via;
        report.checks.form_url = `ok（直接は開けないため、出典ページの「${via}」から開く案内にする）`;
      }
    }
  }
  const postal = pick(c, 'postal_code');
  if (postal) {
    const ok = /^\d{3}-\d{4}$/.test(postal) && postalOnPage(postal, page.text);
    report.checks.postal_code = ok ? 'ok' : 'ページで確認できない';
    if (ok) base.postal_code = postal;
  }
  const addr = pick(c, 'postal_address');
  if (addr) {
    const ok = addressOnPage(addr, page.text, info.prefName);
    report.checks.postal_address = ok ? 'ok' : 'ページで確認できない';
    if (ok) base.postal_address = addr;
  }
  if (!base.postal_address) base.postal_code = null; // 郵便番号だけでは住所として表示しない
  const hours = pick(c, 'hours');
  if (hours) {
    const ok = hoursOnPage(hours, page.text);
    report.checks.hours = ok ? 'ok' : 'ページで確認できない';
    if (ok) base.hours = hours;
  }
  // 調査メモの note は公開しない（調べた経過のメモが混ざるため）。ブラウザで確かめた記録の注意書きだけ使う
  if (manual && pick(manual.fields, 'note') && !base.note) base.note = pick(manual.fields, 'note');

  if (!(base.phone || base.email || base.form_url) && manual && manual.fields.source_url === src) {
    report.checks = {};
    return useManual();
  }
  if (base.phone || base.email || base.form_url) {
    base.status = 'verified';
    base.verified_at = today;
  } else {
    // 照合に通った連絡手段がない：連絡先の値は公開データに残さない
    Object.assign(base, { phone: null, email: null, form_url: null, postal_code: null, postal_address: null, hours: null });
    base.note = '連絡先を出典ページで照合できなかったため未確認';
    report.why = '電話・メール・フォームのどれも照合に通らなかった';
  }
  report.status = base.status;
  return { contact: base, report };
}

// ---- 実行 ----
const TYPE_ORDER = ['general', 'feedback', 'assembly', 'petition', 'police', 'education', 'department'];
const reports = [];
const errors = [];
const results = new Map(); // file → [{ code, name, contacts }]
const current = new Map();
const currentRecords = (file) => (current.has(file) ? current : current.set(file, readJson(`public/data/contacts/${file}.json`))).get(file);

for (const entity of batch.entities || []) {
  const info = lookup(entity.code);
  if (!info) {
    errors.push(`${entity.code}: マスターにないコード`);
    continue;
  }
  if (!targetCodes.has(entity.code)) {
    errors.push(`${entity.code}: このバッチの対象ではない`);
    continue;
  }
  if (info.name !== entity.name) errors.push(`${entity.code}: 名前がマスターと違う（${entity.name}）→ マスターの名前を使う`);
  info.prefName = info.key === 'municipality' ? prefectures.find((p) => p.code === info.file)?.name : null;
  const seen = new Set();
  const out = [];
  const list = (entity.contacts || []).filter((c) => {
    if (!info.types.includes(c.type)) {
      errors.push(`${entity.code}: 対象外の窓口の種類（${c.type}）`);
      return false;
    }
    if (seen.has(c.type)) {
      errors.push(`${entity.code}: ${c.type} が2件以上（最初の1件だけ使う）`);
      return false;
    }
    seen.add(c.type);
    return true;
  });
  // 代表電話：今回の調査結果に無ければ（請願・陳情の届け先だけの調査など）、掲載中の代表電話と比べる
  const general =
    list.find((c) => c.type === 'general') ||
    currentRecords(info.file)
      .find((r) => (r.agency_id ?? r.municipality_code) === entity.code)
      ?.contacts.find((c) => c.type === 'general' && ['verified', 'review', 'auto_matched'].includes(c.status));
  const generalOf = general ? { phone: pick(general, 'phone'), source_url: general.source_url } : null;
  for (const c of list) {
    const { contact, report } = await verifyContact(entity, c, info, generalOf);
    out.push(contact);
    reports.push(report);
  }
  // skipped_types：確認済みの窓口があるので今回は調べなかった種類（08_make_batch.py が書く）
  for (const t of info.required || info.types) if (!seen.has(t) && !(entity.skipped_types || []).includes(t)) errors.push(`${entity.code}: ${t} の調査結果がない`);
  if (!results.has(info.file)) results.set(info.file, []);
  results.get(info.file).push({ code: entity.code, name: info.name, key: info.key, contacts: out });
}
const missing = plan.targets.filter((t) => !(batch.entities || []).some((e) => e.code === t.code));
for (const t of missing) errors.push(`${t.code} ${t.name}: 調査結果がない`);

// ---- 公開データへの反映 ----
const SAME_KEYS = ['department', 'phone', 'email', 'form_url', 'form_via_page', 'postal_code', 'postal_address', 'hours', 'source_url', 'status', 'note'];
const changes = [];
for (const [file, items] of results) {
  const path = `public/data/contacts/${file}.json`;
  const records = readJson(path);
  for (const item of items) {
    const codeKey = item.key === 'agency' ? 'agency_id' : 'municipality_code';
    const nameKey = item.key === 'agency' ? 'agency_name' : 'municipality_name';
    let rec = records.find((r) => r[codeKey] === item.code);
    if (!rec) {
      rec = { [codeKey]: item.code, [nameKey]: item.name, contacts: [] };
      records.push(rec);
    }
    for (const nc of item.contacts) {
      const i = rec.contacts.findIndex((c) => c.id === nc.id);
      const old = i >= 0 ? rec.contacts[i] : null;
      if (!old) {
        if (nc.status === 'unverified' && !REQUIRED.includes(nc.type)) continue; // 請願・陳情の届け先・警察・教育委員会は確認できたものだけ載せる
        rec.contacts.push(nc);
        changes.push({ date: today, batch: batchId, id: nc.id, change: 'added', status: nc.status });
        continue;
      }
      if (old.status === 'auto_matched' && nc.status !== 'verified') continue; // 自動照合の代表電話は、公式確認できたときだけ置きかえる
      const diff = {};
      for (const k of SAME_KEYS) if ((old[k] ?? null) !== (nc[k] ?? null)) diff[k] = [old[k] ?? null, nc[k] ?? null];
      if ((old.status === 'verified' || old.status === 'review') && nc.status !== 'verified' && nc.status !== 'unavailable') {
        // 以前の確認済みの情報は消さず、要再確認にする
        if (old.status !== 'review') {
          rec.contacts[i] = { ...old, status: 'review', note: '最新の公式ページで確認できませんでした' };
          changes.push({ date: today, batch: batchId, id: nc.id, change: 'review' });
        }
        continue;
      }
      rec.contacts[i] = nc;
      if (Object.keys(diff).length) changes.push({ date: today, batch: batchId, id: nc.id, change: 'updated', fields: diff });
    }
    rec.contacts.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || a.id.localeCompare(b.id));
  }
  records.sort((a, b) => String(a.agency_id ?? a.municipality_code).localeCompare(String(b.agency_id ?? b.municipality_code)));
  if (file === 'agencies') {
    const order = agencies.map((a) => a.id);
    records.sort((a, b) => order.indexOf(a.agency_id) - order.indexOf(b.agency_id));
  }
  if (!dry) writeJson(path, records);
}

const count = (s) => reports.filter((r) => r.status === s).length;
const result = {
  entities: (batch.entities || []).length,
  contacts: reports.length,
  verified: count('verified'),
  unverified: count('unverified'),
  unavailable: count('unavailable'),
  errors: errors.length,
};

if (!dry) {
  mkdirSync(join(root, 'research/verify'), { recursive: true });
  writeJson(`research/verify/${batchId}.json`, { batch: batchId, checked_at: today, result, errors, reports }, 1);
  if (changes.length) appendFileSync(join(root, 'research/changelog.jsonl'), changes.map((c) => JSON.stringify(c)).join('\n') + '\n', 'utf8');
  Object.assign(plan, { status: 'merged', researched_at: batch.researched_at || null, merged_at: today, result });
  progress.updated_at = today;
  writeJson('research/progress.json', progress);
  execFileSync(process.execPath, [join(root, 'scripts/build-summary.mjs')], { stdio: 'ignore' });
}

console.log(`${batchId}${dry ? '（照合のみ）' : ''}：対象 ${result.entities}・窓口 ${result.contacts}・公式確認済み ${result.verified}・未確認 ${result.unverified}・連絡先なし ${result.unavailable}・エラー ${result.errors}`);
if (dry) {
  for (const r of reports.filter((r) => r.status !== 'verified')) console.log(`  ${r.id}: ${r.status} ${r.why || ''}`);
  for (const e of errors) console.log('  ! ' + e);
}
for (const r of reports.filter((r) => String(r.checks.form_url || '').includes('直接は開けない'))) console.log(`  ${r.id}: フォームは${r.checks.form_url}`);
if (!dry) console.log(`書き込み：research/verify/${batchId}.json${changes.length ? '・research/changelog.jsonl' : ''}・research/progress.json・public/data/summary.json・${[...results.keys()].map((f) => `public/data/contacts/${f}.json`).join('・')}`);


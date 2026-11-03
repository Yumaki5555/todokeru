// 連絡先の管理画面（このパソコンの中だけで動く）
// 起動：npm run admin（または「連絡先の管理.bat」をダブルクリック）→ http://localhost:4180
// 画面で「確認できた」「直す」「新しく登録」すると、public/data/contacts/<2けた>.json を書きかえ、
// research/changelog.jsonl に変更の記録を足し、public/data/summary.json（件数のまとめ）を作り直す。
// サイトに出るのは、ビルドして公開（commit・push）したあと。
import { createServer } from 'node:http';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgencyContactsFile, validateMunicipalityContactsFile } from '../src/data/validate.ts';
import { CONTACT_TYPE_INFO, STATUS_LABEL, allowedTypes, applyAction, decodePage, findOnPage, findRecord, jstToday, listEntities, normalizeEmail, normalizePhone, normalizePostal } from './core.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const PORT = Number(process.env.ADMIN_PORT || 4180);
const readJson = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const prefectures = readJson('public/data/master/prefectures.json').items;
const municipalities = readJson('public/data/master/municipalities.json').items;
const agencies = readJson('public/data/master/agencies.json').items;
const entities = listEntities(prefectures, municipalities, agencies);
const byKey = new Map(entities.map((e) => [e.key, e]));
const extraHosts = () => new Set(readJson('research/official-hosts.json').hosts.map((h) => h.host));

// 市区町村の公式サイト（候補）：research/targets.csv（Code for FUKUI の一覧。確かめる前の候補）
const officialCandidates = new Map();
if (existsSync(join(root, 'research/targets.csv'))) {
  for (const line of readFileSync(join(root, 'research/targets.csv'), 'utf8').replace(/^﻿/, '').split(/\r?\n/).slice(1)) {
    const [code, , , url] = line.split(',');
    if (code && /^https?:\/\//.test(url || '')) officialCandidates.set(code, url);
  }
}

const contactsPath = (file) => `public/data/contacts/${file}.json`;
const readRecords = (file) => readJson(contactsPath(file));

// Dropbox が同期中だと書き込みが一時的に失敗することがあるので、少し待って何回か試す
const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
function writeText(p, text, append = false) {
  for (let i = 0; ; i++) {
    try {
      (append ? appendFileSync : writeFileSync)(join(root, p), text, 'utf8');
      return;
    } catch (e) {
      if (i >= 6 || !['EBUSY', 'EPERM', 'EACCES'].includes(e.code)) throw e;
      pause(400);
    }
  }
}

function validateFile(e, records, today) {
  return e.file === 'agencies'
    ? validateAgencyContactsFile(records, agencies, today)
    : validateMunicipalityContactsFile(e.file, records, prefectures, municipalities, today);
}

// ---- 返す中身 ----

function entityList() {
  const counts = new Map();
  for (const file of [...prefectures.map((p) => p.code), 'agencies']) {
    for (const r of readRecords(file)) {
      const n = { verified: 0, auto_matched: 0, review: 0, unverified: 0, other: 0 };
      for (const c of r.contacts) n[c.status in n ? c.status : 'other']++;
      counts.set(r.agency_id ?? r.municipality_code, n);
    }
  }
  return entities.map((e) => ({ ...e, counts: counts.get(e.key) || null }));
}

function entityDetail(e) {
  const rec = findRecord(readRecords(e.file), e);
  return {
    entity: e,
    contacts: rec?.contacts || [],
    allowedTypes: allowedTypes(e),
    officialSite: e.official_url || officialCandidates.get(e.kind === 'pref' ? '' : e.key) || null,
    officialSiteIsCandidate: !e.official_url,
  };
}

// まだ公開していない変更：最後の commit から research/changelog.jsonl に足した、この管理画面の記録
function pending() {
  let diff = '';
  try {
    diff = execFileSync('git', ['diff', 'HEAD', '-U0', '--', 'research/changelog.jsonl'], { cwd: root, encoding: 'utf8' });
  } catch {
    return { items: [], gitError: true };
  }
  const items = [];
  for (const line of diff.split('\n')) {
    if (!line.startsWith('+{')) continue;
    try {
      const x = JSON.parse(line.slice(1));
      if (x.batch !== 'manual-admin') continue;
      const key = x.id.replace(/-(general|feedback|assembly|petition|police|education|department)(-\d+)?$/, '');
      items.push({ ...x, entityName: byKey.get(key)?.name || key, prefName: byKey.get(key)?.pref_name || null });
    } catch {
      /* 記録の形でない行は飛ばす */
    }
  }
  return { items };
}

async function checkPage(e, input) {
  const url = (input.source_url || '').trim();
  if (!/^https:\/\//.test(url)) return { ok: false, error: '出典ページのURL（https:// で始まる）を入れてください' };
  try {
    const r = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; TodokeruPublicContactResearch/1.0; +https://yumaki5555.github.io/todokeru/)', 'accept-language': 'ja' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
    const ct = r.headers.get('content-type') || '';
    if (!r.ok) return { ok: false, error: `ページを開けませんでした（${r.status}）。ボタンでページを開いて、目で確かめてください` };
    if (/pdf/i.test(ct)) return { ok: false, error: 'PDF のため自動では探せません。ページを開いて、目で確かめてください' };
    const raw = decodePage(new Uint8Array(await r.arrayBuffer()), ct);
    const c = {
      phone: normalizePhone(input.phone),
      email: normalizeEmail(input.email),
      form_url: (input.form_url || '').trim() || null,
      postal_code: normalizePostal(input.postal_code),
      postal_address: (input.postal_address || '').normalize('NFKC').trim() || null,
    };
    return { ok: true, finalUrl: r.url, found: findOnPage(c, raw, e.pref_name) };
  } catch (err) {
    return { ok: false, error: err.name === 'TimeoutError' ? 'ページが時間内に開きませんでした。ボタンでページを開いて、目で確かめてください' : `ページを開けませんでした（${err.message}）` };
  }
}

function runAction(e, action) {
  const today = jstToday();
  const records = readRecords(e.file);
  const res = applyAction(records, e, action, { today, extraHosts: extraHosts(), agencyOrder: agencies.map((a) => a.id) });
  if (res.errors.length) return { ok: false, errors: res.errors };
  if (!res.changes.length) return { ok: true, unchanged: true, ...entityDetail(e) };
  // ファイル全体の点検：前からあった問題は問わず、今回の変更で新しく出た問題だけ止める
  const before = new Set(validateFile(e, records, today));
  const added = validateFile(e, res.records, today).filter((m) => !before.has(m));
  if (added.length) return { ok: false, errors: added };
  writeText(contactsPath(e.file), JSON.stringify(res.records, null, 1) + '\n');
  writeText('research/changelog.jsonl', res.changes.map((c) => JSON.stringify(c)).join('\n') + '\n', true);
  execFileSync(process.execPath, [join(root, 'scripts/build-summary.mjs')], { stdio: 'ignore' });
  return { ok: true, id: res.id, change: res.changes[0].change, ...entityDetail(e) };
}

// ---- 画面とのやりとり ----

const STATIC = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'] };
const allowedHosts = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`]);

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'content-type': `${type}; charset=utf-8`, 'cache-control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

async function readBody(req) {
  let s = '';
  for await (const chunk of req) {
    s += chunk;
    if (s.length > 200000) throw new Error('too large');
  }
  return JSON.parse(s || '{}');
}

const server = createServer(async (req, res) => {
  // ほかのサイトから、このパソコンの管理画面を操作されないようにする
  if (!allowedHosts.has(req.headers.host || '')) return send(res, 403, { error: 'forbidden' });
  if (req.method === 'POST' && req.headers.origin && !allowedHosts.has(req.headers.origin.replace(/^https?:\/\//, '')))
    return send(res, 403, { error: 'forbidden' });
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (req.method === 'GET' && STATIC[url.pathname]) {
      const [file, type] = STATIC[url.pathname];
      return send(res, 200, readFileSync(join(here, file), 'utf8'), type);
    }
    if (req.method === 'GET' && url.pathname === '/api/entities')
      return send(res, 200, { today: jstToday(), entities: entityList(), typeInfo: CONTACT_TYPE_INFO, statusLabel: STATUS_LABEL });
    if (req.method === 'GET' && url.pathname === '/api/entity') {
      const e = byKey.get(url.searchParams.get('key') || '');
      return e ? send(res, 200, entityDetail(e)) : send(res, 404, { error: '見つかりません' });
    }
    if (req.method === 'GET' && url.pathname === '/api/pending') return send(res, 200, pending());
    if (req.method === 'POST' && (url.pathname === '/api/action' || url.pathname === '/api/check')) {
      const body = await readBody(req);
      const e = byKey.get(body.key || '');
      if (!e) return send(res, 404, { error: '見つかりません' });
      return send(res, 200, url.pathname === '/api/action' ? runAction(e, body.action) : await checkPage(e, body.input || {}));
    }
    send(res, 404, { error: 'not found' });
  } catch (err) {
    console.error(err);
    send(res, 500, { ok: false, errors: [`保存できませんでした（${err.message}）。もう一度試すか、Claude に画面の文字を伝えてください`] });
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`管理画面はすでに開いています： http://localhost:${PORT}`);
    if (process.argv.includes('--open')) openBrowser();
    process.exit(0);
  }
  throw err;
});

function openBrowser() {
  if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', `http://localhost:${PORT}`], { detached: true, stdio: 'ignore' }).unref();
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`連絡先の管理画面： http://localhost:${PORT}`);
  console.log('（終わるときは、この黒い画面を閉じてください）');
  if (process.argv.includes('--open')) openBrowser();
});

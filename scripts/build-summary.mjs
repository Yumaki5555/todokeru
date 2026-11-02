// 件数のまとめ（public/data/summary.json）を作るスクリプト
// 窓口データを追加・更新したら実行する：npm run data:summary
// 「登録している自治体・機関の数」と「公式確認済みの窓口の数」を別々に数える。
// 機関・自治体ごとの調査状況（調査済み・公式確認済みの窓口あり・画面に出す窓口あり）も、全国と都道府県別に数える。
// テスト（npm run validate）で、このファイルと実際のデータの件数が合っているかを確かめる。
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data');
const read = (p) => JSON.parse(readFileSync(join(dataDir, p), 'utf8'));

const agencies = read('master/agencies.json').items;
const prefectures = read('master/prefectures.json').items;
const municipalities = read('master/municipalities.json').items;

const byStatus = { verified: 0, unverified: 0, review: 0, unavailable: 0, discontinued: 0, auto_matched: 0 };
let total = 0;
// 機関・自治体ごとに「調査した（窓口の記録がある）」「公式確認済みの窓口が1つ以上ある」「画面に出す窓口（確認済み・要再確認・自動照合）が1つ以上ある」を数える
const researched = new Set();
const withVerified = new Set();
const withShown = new Set();
for (const f of readdirSync(join(dataDir, 'contacts')).filter((n) => n.endsWith('.json'))) {
  for (const r of read(`contacts/${f}`)) {
    const key = r.agency_id ?? r.municipality_code;
    if (r.contacts.length) researched.add(key);
    for (const c of r.contacts) {
      total++;
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      if (c.status === 'verified') withVerified.add(key);
      if (['verified', 'review', 'auto_matched'].includes(c.status)) withShown.add(key);
    }
  }
}

const cover = (keys) => ({
  total: keys.length,
  researched: keys.filter((k) => researched.has(k)).length,
  with_verified: keys.filter((k) => withVerified.has(k)).length,
  with_shown: keys.filter((k) => withShown.has(k)).length,
});
const byPref = {};
for (const p of prefectures) {
  const munis = municipalities.filter((m) => m.pref_code === p.code).map((m) => m.code);
  byPref[p.code] = { pref: cover([p.lg_code]), municipalities: cover(munis) };
}

const summary = {
  generated_at: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }),
  entities: { agencies: agencies.length, prefectures: prefectures.length, municipalities: municipalities.length },
  contacts: { total, verified: byStatus.verified, by_status: byStatus },
  coverage: {
    agencies: cover(agencies.map((a) => a.id)),
    prefectures: cover(prefectures.map((p) => p.lg_code)),
    municipalities: cover(municipalities.map((m) => m.code)),
  },
  by_pref: byPref,
};
writeFileSync(join(dataDir, 'summary.json'), JSON.stringify(summary, null, 1) + '\n', 'utf8');
console.log(JSON.stringify({ generated_at: summary.generated_at, contacts: summary.contacts, coverage: summary.coverage }));

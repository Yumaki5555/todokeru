// 件数のまとめ（public/data/summary.json）を作るスクリプト
// 窓口データを追加・更新したら実行する：npm run data:summary
// 「登録している自治体・機関の数」と「公式確認済みの窓口の数」を別々に数える。
// テスト（npm run validate）で、このファイルと実際のデータの件数が合っているかを確かめる。
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data');
const read = (p) => JSON.parse(readFileSync(join(dataDir, p), 'utf8'));

const agencies = read('master/agencies.json').items;
const prefectures = read('master/prefectures.json').items;
const municipalities = read('master/municipalities.json').items;

const byStatus = { verified: 0, unverified: 0, review: 0, unavailable: 0, discontinued: 0 };
let total = 0;
for (const f of readdirSync(join(dataDir, 'contacts')).filter((n) => n.endsWith('.json'))) {
  for (const r of read(`contacts/${f}`)) {
    for (const c of r.contacts) {
      total++;
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    }
  }
}

const summary = {
  generated_at: new Date().toISOString().slice(0, 10),
  entities: { agencies: agencies.length, prefectures: prefectures.length, municipalities: municipalities.length },
  contacts: { total, verified: byStatus.verified, by_status: byStatus },
};
writeFileSync(join(dataDir, 'summary.json'), JSON.stringify(summary, null, 1) + '\n', 'utf8');
console.log(JSON.stringify(summary));

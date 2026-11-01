// 窓口調査の進捗表（research/progress.json）を作る・足りない分を足すスクリプト
// 実行：npm run research:plan
// すでにある調査単位（バッチ）の状態は消さない。マスターに自治体が増えたときに足りないバッチだけを足す。
//   第1段階：47都道府県（5バッチ）
//   第2段階：国の機関（1バッチ）
//   第3段階：東京都・神奈川県・埼玉県・千葉県・大阪府の市区町村（1バッチ30自治体まで）
//   第4段階：残りの市区町村（同じく30自治体まで）
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const progressPath = join(root, 'research/progress.json');

const prefectures = read('public/data/master/prefectures.json').items;
const municipalities = read('public/data/master/municipalities.json').items;
const agencies = read('public/data/master/agencies.json').items;

const STAGE3 = ['13', '14', '11', '12', '27'];
const MAX = 30;

/** n 件を MAX 件以下の、ほぼ同じ大きさのまとまりに分ける */
function chunks(list, max = MAX) {
  const n = Math.ceil(list.length / max) || 1;
  const size = Math.ceil(list.length / n);
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

const planned = [];
const prefGroups = [
  ['01', '10'],
  ['11', '20'],
  ['21', '30'],
  ['31', '39'],
  ['40', '47'],
];
prefGroups.forEach(([a, b], i) =>
  planned.push({
    id: `pref-${String(i + 1).padStart(2, '0')}`,
    stage: 1,
    kind: 'pref',
    label: `都道府県 ${a}〜${b}`,
    targets: prefectures.filter((p) => p.code >= a && p.code <= b).map((p) => ({ code: p.lg_code, name: p.name })),
  }),
);
planned.push({
  id: 'agency-01',
  stage: 2,
  kind: 'agency',
  label: '国の機関・国会',
  targets: agencies.map((a) => ({ code: a.id, name: a.name, official_url: a.official_url })),
});
const prefOrder = [...STAGE3, ...prefectures.map((p) => p.code).filter((c) => !STAGE3.includes(c))];
for (const pc of prefOrder) {
  const pref = prefectures.find((p) => p.code === pc);
  const list = municipalities.filter((m) => m.pref_code === pc);
  chunks(list).forEach((part, i, all) =>
    planned.push({
      id: `muni-${pc}-${i + 1}`,
      stage: STAGE3.includes(pc) ? 3 : 4,
      kind: 'muni',
      label: `${pref.name}の市区町村 ${i + 1}/${all.length}`,
      targets: part.map((m) => ({ code: m.code, name: m.name })),
    }),
  );
}

const old = existsSync(progressPath) ? read('research/progress.json') : { batches: [] };
const oldById = new Map(old.batches.map((b) => [b.id, b]));
const batches = planned.map((p) => {
  const o = oldById.get(p.id);
  return o ? { ...p, status: o.status, researched_at: o.researched_at, merged_at: o.merged_at, result: o.result } : { ...p, status: 'pending', researched_at: null, merged_at: null, result: null };
});
for (const o of old.batches) if (!batches.some((b) => b.id === o.id)) batches.push(o); // 計画から外れたものも記録として残す

const progress = {
  note: 'status: pending（未調査）→ researched（調査ファイルあり・未照合）→ merged（照合して public/data に反映済み）',
  updated_at: new Date().toISOString().slice(0, 10),
  stages: [
    { no: 1, label: '47都道府県の代表・広聴・議会窓口' },
    { no: 2, label: '国の機関・国会' },
    { no: 3, label: '東京都・神奈川県・埼玉県・千葉県・大阪府の市区町村' },
    { no: 4, label: '残りの全国の市区町村' },
  ],
  batches,
};
writeFileSync(progressPath, JSON.stringify(progress, null, 1) + '\n', 'utf8');
const count = (s) => batches.filter((b) => b.status === s).length;
console.log(`バッチ ${batches.length}件（未調査 ${count('pending')}・調査済み ${count('researched')}・反映済み ${count('merged')}）`);

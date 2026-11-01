// 自治体マスター（都道府県・市区町村の一覧）を作るスクリプト
//
// 使い方：npm run data:master -- <市区町村一覧の JSON>
//   既定の入力は「日本を知る。」入口サイトの data/municipalities.json
//   （総務省「全国地方公共団体コード」の Excel から入口サイトの _tools/build_municipalities.py で作ったもの）。
//   入口サイトと同じ範囲（47都道府県＋1,741市区町村。政令指定都市は市全体で1件、北方領土の6村は除く）。
//
// 出力：
//   public/data/master/prefectures.json   都道府県マスター
//   public/data/master/municipalities.json 市区町村マスター
//   public/data/contacts/<2けた>.json        窓口データ（まだ無いときだけ空の [] で作る。既存の調査結果は上書きしない）
//   public/data/contacts/agencies.json      国の機関の窓口データ（同上）
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv[2] || resolve(root, '../入口サイト/data/municipalities.json');
const checkedAt = process.argv[3] || new Date().toISOString().slice(0, 10);

// 全国地方公共団体コードの検査数字（6けた目）を計算する
function withCheckDigit(code5) {
  const d = code5.split('').map(Number);
  const sum = d[0] * 6 + d[1] * 5 + d[2] * 4 + d[3] * 3 + d[4] * 2;
  return code5 + String((11 - (sum % 11)) % 10);
}

const src = JSON.parse(readFileSync(input, 'utf8'));
const version = (src.source.match(/（(.+)）/) || [])[1] || '';
const source = `総務省「全国地方公共団体コード」${version ? `（${version}）` : ''}`;

const prefectures = src.prefs.map(([code, name, kana]) => ({
  code,
  lg_code: withCheckDigit(code + '000'),
  name,
  kana,
}));

const municipalities = src.munis.map(([code, name, kana, designated]) => {
  if (withCheckDigit(code.slice(0, 5)) !== code) throw new Error(`検査数字が合わない自治体コード: ${code} ${name}`);
  const m = { code, name, kana, pref_code: code.slice(0, 2) };
  if (designated) m.designated = true;
  return m;
});

const masterDir = join(root, 'public/data/master');
const contactsDir = join(root, 'public/data/contacts');
mkdirSync(masterDir, { recursive: true });
mkdirSync(contactsDir, { recursive: true });

const write = (file, data) => writeFileSync(file, JSON.stringify(data, null, 1) + '\n', 'utf8');
// マスターは「1行に1団体」で書く（差分が見やすく、ファイルも小さい）
const writeMaster = (file, meta, items) => {
  const head = Object.entries(meta).map(([k, v]) => ` ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join('\n');
  const body = items.map((x) => '  ' + JSON.stringify(x)).join(',\n');
  writeFileSync(file, `{\n${head}\n "items": [\n${body}\n ]\n}\n`, 'utf8');
};
const meta = { source, source_url: src.url, checked_at: checkedAt };
writeMaster(join(masterDir, 'prefectures.json'), meta, prefectures);
writeMaster(join(masterDir, 'municipalities.json'), meta, municipalities);

let created = 0;
for (const p of prefectures) {
  const f = join(contactsDir, `${p.code}.json`);
  if (!existsSync(f)) {
    write(f, []);
    created++;
  }
}
const af = join(contactsDir, 'agencies.json');
if (!existsSync(af)) {
  write(af, []);
  created++;
}

console.log(`都道府県 ${prefectures.length}・市区町村 ${municipalities.length}（${source}）`);
console.log(`空の窓口データファイルを ${created} 件作成（既存のファイルはそのまま）`);

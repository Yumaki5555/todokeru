// SNS用サムネイル public/ogp.png を _ogp/ogp.html から作り直す（npm run ogp）
// 画面なしの Chrome で 1200×630 の画面写真を撮る。文字は Google Fonts を読み込むのでネット接続が必要。
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, '_ogp', 'ogp.html');
const OUT = path.join(ROOT, 'public', 'ogp.png');
const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome が見つかりません（CHROME_PATH で場所を指定できます）');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'todokeru-ogp-'));
const r = spawnSync(
  CHROME,
  [
    '--headless=new',
    `--user-data-dir=${profile}`,
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=1200,630',
    '--virtual-time-budget=8000',
    `--screenshot=${OUT}`,
    pathToFileURL(SRC).href,
  ],
  { stdio: 'inherit' },
);
fs.rmSync(profile, { recursive: true, force: true });
if (r.status !== 0 || !fs.existsSync(OUT)) throw new Error('画面写真を撮れませんでした');
console.log('作成しました:', path.relative(ROOT, OUT), `${fs.statSync(OUT).size} バイト`);

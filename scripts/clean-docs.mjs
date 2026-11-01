// ビルドの前に docs の古いファイルを消す（npm run build から自動で呼ばれる）
// Dropbox が同期中のフォルダは「フォルダごと削除」が EPERM で失敗しやすいので、
// フォルダは残してファイルだけを消し、失敗したら少し待ってやり直す。
import { existsSync, readdirSync, rmSync, rmdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const docs = resolve(dirname(fileURLToPath(import.meta.url)), '../docs');
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function removeFile(p) {
  for (let i = 0; i < 5; i++) {
    try {
      rmSync(p, { force: true });
      return;
    } catch (e) {
      if (!['EPERM', 'EBUSY', 'EACCES'].includes(e.code) || i === 4) throw e;
      sleep(400);
    }
  }
}

function clean(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      clean(p);
      try {
        rmdirSync(p); // 空になったフォルダは消す（消せなくてもビルドには困らない）
      } catch {
        // Dropbox がつかんでいるときはそのまま残す
      }
    } else {
      removeFile(p);
    }
  }
}

if (existsSync(docs)) clean(docs);

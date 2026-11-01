// テストの準備：ブラウザにしかない機能の代わりを用意し、data/ の読み込みを public/data のファイルにつなぐ
import '@testing-library/jest-dom/vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { clearDataCache } from '../src/data/loaders';

const publicDir = resolve(__dirname, '../public');

/** テストごとに差し替えられる data/ の中身（指定がなければ public/data のファイル） */
export const dataOverrides = new Map<string, unknown>();

beforeEach(() => {
  window.location.hash = '';
  clearDataCache();
  dataOverrides.clear();
  vi.stubGlobal('fetch', async (input: string | URL) => {
    const url = String(input);
    const m = /data\/(.+\.json)$/.exec(url);
    if (!m) return new Response('not found', { status: 404 });
    if (dataOverrides.has(m[1])) return new Response(JSON.stringify(dataOverrides.get(m[1])), { status: 200 });
    try {
      const text = await readFile(resolve(publicDir, 'data', m[1]), 'utf8');
      return new Response(text, { status: 200, headers: { 'content-type': 'application/json' } });
    } catch {
      return new Response('not found', { status: 404 });
    }
  });
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  if (!window.matchMedia) {
    window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  }
  // requestAnimationFrame はすぐに実行する
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

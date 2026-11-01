import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// 公開先のパス（ベースパス）。
// 既定の "./" は「どのフォルダに置いても動く」相対パス。ページの切り替えは #/ 方式なので、
// GitHub Pages のリポジトリ名が何であっても、このままで動きます。
// 絶対パスにしたいときだけ、ビルド時に BASE_PATH を指定します（例：BASE_PATH=/todokeru/ npm run build）。
const base = process.env.BASE_PATH || './';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    // GitHub Pages の「main ブランチの /docs フォルダ」で公開できるよう docs に出力する
    outDir: 'docs',
    // 古いファイルは scripts/clean-docs.mjs が先に消す（Dropbox 同期中でも失敗しにくいように）
    emptyOutDir: false,
    target: 'es2020',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});

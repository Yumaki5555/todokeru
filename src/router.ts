// ページの切り替え（#/ 方式）
// GitHub Pages ではサーバーの設定ができないため、URL の # より後ろでページを表す。
//   #/                  トップ
//   #/guide/phone       電話ガイド
//   #/contacts?code=13  窓口検索（東京都を選んだ状態）
// # の後ろはサーバーに送られないので、どのページを直接開いても index.html が表示される。
import { useSyncExternalStore } from 'react';

export interface Route {
  path: string;
  query: URLSearchParams;
}

const EVENT = 'todokeru:route';

export function parseHash(hash: string): Route {
  let h = hash.replace(/^#/, '');
  // 「#/」で始まらない古い形（#sanpun など）はトップとして扱う
  if (!h.startsWith('/')) h = '/';
  const i = h.indexOf('?');
  const rawPath = i >= 0 ? h.slice(0, i) : h;
  const q = i >= 0 ? h.slice(i + 1) : '';
  let path = rawPath;
  try {
    path = decodeURIComponent(rawPath);
  } catch {
    // そのまま使う
  }
  path = path.replace(/\/+$/, '') || '/';
  return { path, query: new URLSearchParams(q) };
}

/** ページへのリンク先（href）を作る */
export function href(path: string, query?: Record<string, string | null | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query || {})) if (v) qs.set(k, v);
  const s = qs.toString();
  return '#' + path + (s ? '?' + s : '');
}

/** ページ内の見出しへのリンク先（新しいタブで開いても、その見出しから表示できる形） */
export function sectionHref(path: string, id: string): string {
  return href(path, { s: id });
}

/** ページを移動する。replace のときは履歴を増やさない */
export function navigate(to: string, opts: { replace?: boolean } = {}): void {
  const target = to.startsWith('#') ? to : '#' + to;
  if (window.location.hash === target) return;
  if (opts.replace) {
    try {
      history.replaceState(history.state, '', target);
    } catch {
      window.location.replace(target);
      return;
    }
    window.dispatchEvent(new Event(EVENT));
  } else {
    window.location.hash = target;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener('hashchange', cb);
    window.removeEventListener(EVENT, cb);
  };
}

const getHash = () => window.location.hash;

/** いまの URL の # の部分を読む（変わると画面を描き直す） */
export function useHash(): string {
  return useSyncExternalStore(subscribe, getHash, () => '');
}

// 別のサイト（「日本を知る。」の専門サイト）から来たときの「移動元の一時メモ」
//   保存するのは、戻り先のURL・どのサイトか・自治体コード・見ていた項目の名前（60字まで）・保存した時刻だけ。
//   本文・入力内容・個人情報は入れない。このタブの中だけ（sessionStorage）で、外部へは送らない。
//   期限は保存から2時間。新しい有効な移動元情報が来たら丸ごと上書きする。
//   引き継ぎなしで別の場所から入り直す・戻るリンクを押す・×で閉じる・タブを閉じる、のどれかで消える。
// 引き継ぎのURL：#/contacts?code=221309&from=<戻り先URL>&item=<項目名>
//   読み取ったら from と item はURLから外す（共有したリンクに残さない）。
import { useEffect, useState } from 'react';

const KEY = 'todokeru:from-site:v1';
const CHANGED = 'todokeru:from-site-changed';
const PROD_ORIGIN = 'https://yumaki5555.github.io';

export const FROM_TTL_MS = 2 * 60 * 60 * 1000;
export const ITEM_MAX = 60;

/** 戻ってよいサイト（最初のフォルダ名）と、戻るリンクの固定の文言。URL の文字は画面に出さない */
export const FROM_SITES = {
  // 入口サイトは公開先のいちばん上にあるので、フォルダの名前が空
  '': { name: '日本を知る。', back: '地域の画面に戻る' },
  'tabunka-yosan': { name: '全国 多文化共生予算マップ', back: '見ていた予算に戻る' },
  zairyu: { name: '数でみる在留外国人', back: '見ていた在留外国人のページに戻る' },
  'mou-map': { name: '日本と世界のMOU・協定マップ', back: '見ていた協定のページに戻る' },
  'minpaku-map': { name: '民泊・旅館業マップ', back: '見ていた民泊のページに戻る' },
  pubcome: { name: 'パブコメ掲示板', back: '見ていたパブコメのページに戻る' },
  shomei: { name: '署名掲示板', back: '見ていた署名のページに戻る' },
} as const;

export type FromSiteKey = keyof typeof FROM_SITES;

export interface FromMemo {
  url: string;
  site: FromSiteKey;
  code: string | null;
  item: string | null;
  savedAt: number;
}

/** 戻り先のURLを点検する。公開先（手元の確認では同じ住所）の、許可したフォルダの下だけを通す */
export function checkReturnUrl(raw: string, ownOrigin: string = window.location.origin): { url: string; site: FromSiteKey } | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  if (u.username || u.password) return null;
  if (u.origin !== PROD_ORIGIN && u.origin !== ownOrigin) return null;
  const site = u.pathname.split('/')[1];
  if (site === '' && u.pathname !== '/') return null; // 入口サイトは「/」そのものだけ
  if (!Object.prototype.hasOwnProperty.call(FROM_SITES, site)) return null;
  return { url: u.href, site: site as FromSiteKey };
}

/** 項目名：見えない文字・文字の向きを変える文字を除き、60字までにする */
export function cleanItem(raw: string | null): string | null {
  if (!raw) return null;
  // eslint-disable-next-line no-control-regex
  const s = raw.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, ' ').replace(/\s+/g, ' ').trim();
  return Array.from(s).slice(0, ITEM_MAX).join('') || null;
}

const cleanCode = (raw: string | null): string | null => (raw && /^(\d{2}|\d{5,6})$/.test(raw) ? raw : null);

function notify() {
  window.dispatchEvent(new Event(CHANGED));
}

export function clearFrom(opts: { silent?: boolean } = {}): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // 保存できない設定のブラウザでは、もともと何も残らない
  }
  if (!opts.silent) notify();
}

/** メモを読む。期限切れ・形の崩れたものは消す */
export function loadFrom(now: number = Date.now()): FromMemo | null {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const m = JSON.parse(raw) as Partial<FromMemo>;
    const ok = typeof m.url === 'string' ? checkReturnUrl(m.url) : null;
    const age = typeof m.savedAt === 'number' ? now - m.savedAt : -1;
    if (ok && age >= 0 && age < FROM_TTL_MS) {
      return { url: ok.url, site: ok.site, code: cleanCode(m.code ?? null), item: cleanItem(m.item ?? null), savedAt: m.savedAt! };
    }
  } catch {
    // 下で消す
  }
  clearFrom({ silent: true });
  return null;
}

/** URL の引き継ぎ情報を読み取り、URL からは外す。有効な情報を保存できたら true */
export function consumeHandoff(now: number = Date.now()): boolean {
  const hash = window.location.hash;
  const i = hash.indexOf('?');
  if (i < 0) return false;
  const path = hash.slice(1, i);
  const q = new URLSearchParams(hash.slice(i + 1));
  if (!q.has('from') && !q.has('item')) return false;

  const checked = checkReturnUrl(q.get('from') ?? '');
  if (checked) {
    const memo: FromMemo = { url: checked.url, site: checked.site, code: cleanCode(q.get('code')), item: cleanItem(q.get('item')), savedAt: now };
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(memo));
    } catch {
      // 保存できない設定のブラウザでは、戻るリンクが出ないだけ
    }
  }
  q.delete('from');
  q.delete('item');
  // 窓口検索のページでは地域の指定そのものなので残す。ほかのページでは使わないので外す
  if (!path.startsWith('/contacts')) q.delete('code');
  const s = q.toString();
  try {
    history.replaceState(history.state, '', '#' + path + (s ? '?' + s : ''));
  } catch {
    // URL を書きかえられなくても表示には困らない
  }
  if (checked) notify();
  return !!checked;
}

/** 引き継ぎなしで、このサイトの外から新しく入ってきたか（再読み込み・「戻る」は入り直しではない） */
function enteredFromElsewhere(): boolean {
  const nav = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (!nav || nav.type !== 'navigate') return false;
  if (!document.referrer) return true;
  try {
    const r = new URL(document.referrer);
    const own = window.location.pathname.replace(/[^/]*$/, '');
    return !(r.origin === window.location.origin && r.pathname.startsWith(own));
  } catch {
    return true;
  }
}

/** ページを開いたときに1回だけ呼ぶ（画面を作る前） */
export function initFromSite(): void {
  if (!consumeHandoff() && enteredFromElsewhere()) clearFrom({ silent: true });
  loadFrom();
  // 同じタブで引き継ぎつきの URL を開き直したとき（画面は読み込み直されない）
  window.addEventListener('hashchange', () => consumeHandoff());
}

/** いまのメモを読む（消えたら・期限が来たら画面を描き直す） */
export function useFromSite(): FromMemo | null {
  const [memo, setMemo] = useState<FromMemo | null>(() => loadFrom());
  useEffect(() => {
    const update = () => setMemo(loadFrom());
    window.addEventListener(CHANGED, update);
    window.addEventListener('pageshow', update); // 「戻る」でこのページに帰ってきたとき
    document.addEventListener('visibilitychange', update);
    return () => {
      window.removeEventListener(CHANGED, update);
      window.removeEventListener('pageshow', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  const expiresAt = memo ? memo.savedAt + FROM_TTL_MS : null;
  useEffect(() => {
    if (expiresAt === null) return;
    const t = window.setTimeout(() => setMemo(loadFrom()), Math.max(0, expiresAt - Date.now()) + 50);
    return () => window.clearTimeout(t);
  }, [expiresAt]);
  return memo;
}

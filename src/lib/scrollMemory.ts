// 「戻る」「進む」や再読み込みのとき、前に見ていた位置（と開いていた折りたたみ）に戻す
// 位置はブラウザの履歴（history.state）に覚えさせる。外部へは送らない。

export interface Spot {
  y: number;
  /** ページの中の折りたたみ（details）のうち、開いていたものの順番 */
  open: number[];
}

const detailsInMain = () => Array.from(document.querySelectorAll<HTMLDetailsElement>('main details'));

/** いま見ている位置を、いまの履歴に覚えさせる */
export function rememberSpot(): void {
  const open = detailsInMain().flatMap((d, i) => (d.open ? [i] : []));
  try {
    history.replaceState({ ...(history.state || {}), spot: { y: Math.round(window.scrollY), open } }, '');
  } catch {
    // 覚えられないブラウザでは、ふつうどおり先頭から表示する
  }
}

/** いまの履歴に覚えている位置（新しく開いたページにはない） */
export function savedSpot(): Spot | null {
  const s = (history.state as { spot?: Spot } | null)?.spot;
  return s && typeof s.y === 'number' && Array.isArray(s.open) ? s : null;
}

/** 覚えていた位置に戻す。ページの中身があとから読み込まれるときは、高さが足りるまで少し待つ */
export function restoreSpot(spot: Spot): void {
  detailsInMain().forEach((d, i) => {
    d.open = spot.open.includes(i);
  });
  let tries = 0;
  const go = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max < spot.y && tries++ < 20) {
      window.setTimeout(go, 50);
      return;
    }
    window.scrollTo(0, Math.min(spot.y, Math.max(0, max)));
  };
  // 画面を描いたあとに（requestAnimationFrame は裏に回ったタブでは止まるので、タイマーで）
  window.setTimeout(go, 0);
}

/** 見ている位置を覚え続ける（スクロールが止まったとき・リンクを押したとき・折りたたみを開閉したとき・ページを離れるとき） */
export function startScrollMemory(): () => void {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  let timer = 0;
  const later = () => {
    window.clearTimeout(timer);
    const hash = window.location.hash;
    // 止まってから覚える（ブラウザによっては短い間に何度も書きかえると止められるため）。ページが変わっていたら覚えない
    timer = window.setTimeout(() => {
      if (window.location.hash === hash) rememberSpot();
    }, 250);
  };
  const onClick = (e: MouseEvent) => {
    if ((e.target as Element | null)?.closest?.('a[href^="#"]')) rememberSpot();
  };
  const onHash = () => window.clearTimeout(timer);
  window.addEventListener('scroll', later, { passive: true });
  document.addEventListener('toggle', later, true);
  document.addEventListener('click', onClick, true);
  window.addEventListener('hashchange', onHash);
  window.addEventListener('pagehide', rememberSpot);
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener('scroll', later);
    document.removeEventListener('toggle', later, true);
    document.removeEventListener('click', onClick, true);
    window.removeEventListener('hashchange', onHash);
    window.removeEventListener('pagehide', rememberSpot);
  };
}

// 画面の操作に関する小さな道具（スクロール・コピー）

const reduceMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** id の要素までスクロールし、キーボード操作の位置（フォーカス）も移す。閉じた章は開く */
export function scrollToSection(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  const details = el.closest('details');
  if (details && !details.open) details.open = true;
  if (el instanceof HTMLDetailsElement && !el.open) el.open = true;
  el.scrollIntoView?.({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
  return true;
}

/** ページの先頭へ戻る */
export function scrollToPageTop(): void {
  window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
  document.getElementById('page-top')?.focus({ preventScroll: true });
}

/** 文字をコピーする。成功したら true */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 下の方法で試す
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

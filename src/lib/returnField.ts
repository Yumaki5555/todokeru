// 入力の欄（文面を作る など）で最後に触った欄を覚え、「文面作成に戻る」などでその欄へ戻れるようにする
// 覚えた欄の id は、欄のまとまりの要素に data-return として書く（scrollToSection が読む）。
// このタブの中だけに一時保存する（sessionStorage）。マニュアルや窓口検索へ行って戻っても、再読み込みしても使える。
import { useEffect } from 'react';

export function useReturnField(areaId: string, key: string): void {
  useEffect(() => {
    const area = document.getElementById(areaId);
    if (!area) return;
    try {
      const saved = window.sessionStorage.getItem(key);
      if (saved) area.dataset.return = saved;
    } catch {
      // 保存できない設定のブラウザでは、この画面を開いている間だけ覚える
    }
    const onFocus = (e: FocusEvent) => {
      const el = e.target instanceof HTMLElement ? e.target : null;
      // 覚えるのは入力の欄だけ（移動でフォーカスを移したまとまりは覚えない）
      if (!el || !area.contains(el) || !el.matches('input, textarea, select')) return;
      // 欄そのものの id → 欄の見出しの id（文の欄）→ 欄を含むまとまりの id（選ぶ欄）
      const id =
        el.id || el.getAttribute('aria-labelledby')?.split(' ')[0] || el.closest<HTMLElement>('fieldset[id], [role="group"][id]')?.id;
      if (!id || id === areaId) return;
      area.dataset.return = id;
      try {
        window.sessionStorage.setItem(key, id);
      } catch {
        // 同上
      }
    };
    document.addEventListener('focusin', onFocus);
    return () => document.removeEventListener('focusin', onFocus);
  }, [areaId, key]);
}

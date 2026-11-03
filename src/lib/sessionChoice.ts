// 選んだもの（AIへの指示文の目的 など）を、このタブの中だけに覚えておく（sessionStorage）
// ほかのページへ行って「戻る」で帰ってきたときや、再読み込みしたときに、選んだものが最初の選択肢に戻らないようにするため。外部へは送らない。
import { useCallback, useState } from 'react';

export function useSessionChoice<T extends string>(key: string, initial: T, choices: readonly T[]): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = window.sessionStorage.getItem(key);
      // 選択肢が変わって、覚えていたものがなくなったときは最初の選択肢から
      return saved && (choices as readonly string[]).includes(saved) ? (saved as T) : initial;
    } catch {
      return initial;
    }
  });
  const choose = useCallback(
    (v: T) => {
      setValue(v);
      try {
        window.sessionStorage.setItem(key, v);
      } catch {
        // 保存できない設定のブラウザでは、この画面を開いている間だけ覚える
      }
    },
    [key],
  );
  return [value, choose];
}

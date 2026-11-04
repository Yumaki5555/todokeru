// 窓口カードの「陳情書を作ってみる」から来たときの窓口を、このタブの中だけに覚えておく（sessionStorage）
// 書き方ガイドの中を移動しても・再読み込みしても、戻り道と【提出先】の欄が消えないようにするため。外部へは送らない。
import { useCallback, useState } from 'react';
import type { CallTarget } from '../types';

const KEY = 'todokeru:petition-target:v1';

export interface PetitionTarget {
  target: CallTarget;
  /** 政令指定都市の区のコードで窓口カードを開いていたとき、そのコード（同じ表示へ戻るため） */
  ward: string | null;
}

function load(): PetitionTarget | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as PetitionTarget) : null;
    return v?.target?.contactId ? v : null;
  } catch {
    return null;
  }
}

export function usePetitionTarget(): [PetitionTarget | null, (v: PetitionTarget) => void] {
  const [value, setValue] = useState(load);
  const save = useCallback((v: PetitionTarget) => {
    setValue(v);
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(v));
    } catch {
      // 保存できない設定のブラウザでは、この画面を開いている間だけ覚える
    }
  }, []);
  return [value, save];
}

// 台本づくりの入力を、このタブの中だけに一時保存する（sessionStorage）
// 外部へは送らない。タブを閉じると消える。画面を切りかえたり、再読み込みしたりしても台本が消えないようにするため。
import { useCallback, useEffect, useState } from 'react';
import type { CallDraft } from '../types';
import { EMPTY_DRAFT } from '../content/callScript';

const KEY = 'todokeru:call-draft:v1';

export function loadDraft(): CallDraft {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return EMPTY_DRAFT;
    const d = JSON.parse(raw) as Partial<CallDraft>;
    // 郵送を追加する前に保存した送り先には住所の項目がないので、「載っていない」として補う
    const target = d.target ? { ...d.target, postalCode: d.target.postalCode ?? null, postalAddress: d.target.postalAddress ?? null } : null;
    return { ...EMPTY_DRAFT, ...d, target, memo: { ...EMPTY_DRAFT.memo, ...d.memo } };
  } catch {
    return EMPTY_DRAFT;
  }
}

function saveDraft(d: CallDraft): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // 保存できない設定のブラウザでは、この画面を開いている間だけ使える
  }
}

export type DraftUpdate = (patch: Partial<CallDraft> | ((d: CallDraft) => Partial<CallDraft>)) => void;

export function useCallDraft(): [CallDraft, DraftUpdate] {
  const [draft, setDraft] = useState<CallDraft>(loadDraft);
  useEffect(() => saveDraft(draft), [draft]);
  const update: DraftUpdate = useCallback(
    (patch) => setDraft((d) => ({ ...d, ...(typeof patch === 'function' ? patch(d) : patch) })),
    [],
  );
  return [draft, update];
}

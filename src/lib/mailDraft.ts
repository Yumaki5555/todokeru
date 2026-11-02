// メールの文面づくりの入力（名乗り・届け方・書き直した文・送った記録）を、このタブの中だけに一時保存する（sessionStorage）
// 目的・何について・理由・詳しく整理・送り先は電話の台本と共通なので、callDraft.ts の方に保存する。
import { useCallback, useEffect, useState } from 'react';
import type { MailDraft } from '../types';
import { EMPTY_MAIL } from '../content/mailText';

const KEY = 'todokeru:mail-draft:v1';

export function loadMailDraft(): MailDraft {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return EMPTY_MAIL;
    const d = JSON.parse(raw) as Partial<MailDraft>;
    return { ...EMPTY_MAIL, ...d, memo: { ...EMPTY_MAIL.memo, ...d.memo } };
  } catch {
    return EMPTY_MAIL;
  }
}

function saveMailDraft(d: MailDraft): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // 保存できない設定のブラウザでは、この画面を開いている間だけ使える
  }
}

/** 電話の台本で「入力を消す」を押したとき、メールの名乗りや記録もあわせて消す */
export function clearMailDraft(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // 保存していなければ消すものもない
  }
}

export type MailDraftUpdate = (patch: Partial<MailDraft> | ((d: MailDraft) => Partial<MailDraft>)) => void;

export function useMailDraft(): [MailDraft, MailDraftUpdate] {
  const [draft, setDraft] = useState<MailDraft>(loadMailDraft);
  useEffect(() => saveMailDraft(draft), [draft]);
  const update: MailDraftUpdate = useCallback(
    (patch) => setDraft((d) => ({ ...d, ...(typeof patch === 'function' ? patch(d) : patch) })),
    [],
  );
  return [draft, update];
}

// 電話前・提出前のチェックリスト（チェックの状態はこの画面の中だけ。送信はしない）
// doneText：すべてチェックしたときの言葉　meter：何項目まで済んだかを棒でも見せる
// storageKey：指定したときだけ、このタブの中に一時保存する（ほかのページへ行って戻っても残る）
import { useEffect, useId, useState } from 'react';

function loadChecked(key: string | undefined, n: number): boolean[] {
  try {
    const saved = key ? (JSON.parse(window.sessionStorage.getItem(key) || 'null') as unknown) : null;
    if (Array.isArray(saved) && saved.length === n) return saved.map(Boolean);
  } catch {
    // 読めなければ、すべて外した状態から
  }
  return Array.from({ length: n }, () => false);
}

export function Checklist({
  title,
  items,
  doneText = '落ち着いて、1行の台本から始めましょう。',
  meter = false,
  storageKey,
}: {
  title: string;
  items: string[];
  doneText?: string;
  meter?: boolean;
  storageKey?: string;
}) {
  const [checked, setChecked] = useState<boolean[]>(() => loadChecked(storageKey, items.length));
  useEffect(() => {
    if (!storageKey) return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {
      // 保存できない設定のブラウザでは、この画面の中だけ
    }
  }, [storageKey, checked]);
  const baseId = useId();
  const count = checked.filter(Boolean).length;
  const all = count === items.length;

  return (
    <fieldset className="checklist">
      <legend>{title}</legend>
      <ul>
        {items.map((text, i) => {
          const id = `${baseId}-${i}`;
          return (
            <li key={i}>
              <input
                id={id}
                type="checkbox"
                checked={checked[i]}
                onChange={() => setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)))}
              />
              <label htmlFor={id}>{text}</label>
            </li>
          );
        })}
      </ul>
      {meter && (
        <div className="meter checklist-meter" aria-hidden="true">
          <span style={{ width: `${(count / items.length) * 100}%` }} />
        </div>
      )}
      <div className="checklist-foot">
        <p className="checklist-count" role="status" aria-live="polite">
          {all ? `${items.length}項目すべて確認できました。${doneText}` : `${items.length}項目中 ${count}項目を確認済み`}
        </p>
        <button type="button" className="btn btn-secondary btn-small" onClick={() => setChecked(items.map(() => false))} disabled={count === 0}>
          チェックをすべて外す
        </button>
      </div>
    </fieldset>
  );
}

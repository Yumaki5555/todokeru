// 電話前・提出前のチェックリスト（チェックの状態はこの画面の中だけ。保存も送信もしない）
// doneText：すべてチェックしたときの言葉　meter：何項目まで済んだかを棒でも見せる
import { useId, useState } from 'react';

export function Checklist({
  title,
  items,
  doneText = '落ち着いて、1行の台本から始めましょう。',
  meter = false,
}: {
  title: string;
  items: string[];
  doneText?: string;
  meter?: boolean;
}) {
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
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

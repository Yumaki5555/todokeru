// 電話前チェックリスト（チェックの状態はこの画面の中だけ。保存も送信もしない）
import { useId, useState } from 'react';

export function Checklist({ title, items }: { title: string; items: string[] }) {
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
      <div className="checklist-foot">
        <p className="checklist-count" role="status" aria-live="polite">
          {all ? `${items.length}項目すべて確認できました。落ち着いて、1行の台本から始めましょう。` : `${items.length}項目中 ${count}項目を確認済み`}
        </p>
        <button type="button" className="btn btn-secondary btn-small" onClick={() => setChecked(items.map(() => false))} disabled={count === 0}>
          チェックをすべて外す
        </button>
      </div>
    </fieldset>
  );
}

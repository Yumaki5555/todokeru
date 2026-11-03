// AIへの指示文を、目的を選んで切りかえ、全文をコピーする（パブコメの書き方）
// サイトからAIには送らない。コピーできなかったときは、指示文を選択した状態にして手でコピーできるようにする。
import { useId, useRef } from 'react';
import { PASTE_NOTES, PASTE_STEPS, PROMPTS, findPrompt } from '../content/pubcomManual';
import type { PromptId } from '../types';
import { CopyButton } from './CopyButton';
import { Icon } from './Icon';

export function PromptPicker({ value, onChange }: { value: PromptId; onChange: (id: PromptId) => void }) {
  const name = useId();
  const textRef = useRef<HTMLPreElement>(null);
  const p = findPrompt(value);

  const selectText = () => {
    const el = textRef.current;
    const sel = window.getSelection?.();
    if (!el || !sel) return;
    // 先に移してから選ぶ（移したときに選択が外れることがあるため）
    el.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  return (
    <div className="pc-prompts">
      <fieldset className="pc-prompt-pick">
        <legend>やりたいことを選ぶ</legend>
        <div className="stance-chips">
          {PROMPTS.map((x, i) => (
            <label key={x.id} className="stance-chip">
              <input type="radio" name={name} value={x.id} checked={x.id === p.id} onChange={() => onChange(x.id)} />
              <span>
                {/* 選択肢の枠の .stance-chip span が中にも効かないよう、番号は b にする */}
                <b className="pc-chip-no" aria-hidden="true">
                  {'①②③④⑤'[i]}
                </b>
                {x.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="pc-prompt-panel" role="group" aria-labelledby={`${name}-h`}>
        <p className="pc-prompt-head" id={`${name}-h`}>
          <span className="pc-prompt-kicker">選んだ目的</span>
          <b>{p.label}</b>
        </p>
        <p className="pc-prompt-when">{p.when}</p>
        <CopyButton key={p.id} text={p.text} label="AIへの指示文をコピー" buttonClass="btn btn-primary" onFail={selectText} />
        <pre className="pc-prompt-text" ref={textRef} tabIndex={0} aria-label={`AIへの指示文（${p.label}）`}>
          {p.text.trimEnd()}
        </pre>
        <ol className="pc-paste" aria-label="AIへの貼り付け方">
          {PASTE_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        {PASTE_NOTES.map((n) => (
          <p className="privacy-line" key={n}>
            <Icon name="shield" />
            {n}
          </p>
        ))}
      </div>
    </div>
  );
}

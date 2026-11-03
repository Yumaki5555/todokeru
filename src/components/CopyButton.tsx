// まとめてコピーするボタン（台本・通話メモ・AIへの指示文で使う）
// onFail：コピーできなかったとき（呼び出し側で文字を選択状態にするなど）
import { useEffect, useRef, useState } from 'react';
import { copyText } from '../lib/dom';
import { Icon } from './Icon';

export function CopyButton({
  text,
  label,
  hint,
  buttonClass = 'btn btn-secondary btn-small',
  onFail,
}: {
  text: string;
  label: string;
  hint?: string;
  buttonClass?: string;
  onFail?: () => void;
}) {
  const [state, setState] = useState<'idle' | 'done' | 'fail'>('idle');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function onCopy() {
    const ok = await copyText(text);
    setState(ok ? 'done' : 'fail');
    if (!ok) onFail?.();
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 4000);
  }

  return (
    <div className="copy-row">
      <button type="button" className={buttonClass} onClick={onCopy}>
        <Icon name={state === 'done' ? 'check' : 'copy'} />
        {state === 'done' ? 'コピーしました' : label}
      </button>
      {hint && state === 'idle' && <span className="copy-hint">{hint}</span>}
      <span className="copy-status" role="status" aria-live="polite">
        {state === 'done' ? '貼り付けて使えます。' : ''}
        {state === 'fail' ? 'コピーできませんでした。文字を長押し（または選択）してコピーしてください。' : ''}
      </span>
    </div>
  );
}

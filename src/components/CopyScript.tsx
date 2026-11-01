// 台本の表示とコピー
import { useEffect, useRef, useState } from 'react';
import type { Script } from '../types';
import { copyText } from '../lib/dom';
import { Icon } from './Icon';

export function CopyScript({ script, large = false }: { script: Script; large?: boolean }) {
  const [state, setState] = useState<'idle' | 'done' | 'fail'>('idle');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function onCopy() {
    const ok = await copyText(script.text);
    setState(ok ? 'done' : 'fail');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 3000);
  }

  return (
    <figure className={'script' + (large ? ' script-large' : '')}>
      <figcaption className="script-label">{script.label}</figcaption>
      <p className="script-text">「{script.text}」</p>
      {script.note && <p className="script-note">{script.note}</p>}
      <div className="script-actions">
        <button type="button" className="btn btn-secondary btn-small" onClick={onCopy}>
          <Icon name={state === 'done' ? 'check' : 'copy'} />
          {state === 'done' ? 'コピーしました' : 'この台本をコピー'}
        </button>
        <span className="script-status" role="status" aria-live="polite">
          {state === 'done' ? `「${script.label}」をコピーしました。メモ帳などに貼り付けて使えます。` : ''}
          {state === 'fail' ? 'コピーできませんでした。文字を長押し（または選択）してコピーしてください。' : ''}
        </span>
      </div>
    </figure>
  );
}

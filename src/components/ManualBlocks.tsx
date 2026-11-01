// 電話マニュアルの本文（段落・箇条書き・台本・会話例など）を表示する
import type { ReactElement } from 'react';
import type { ManualBlock } from '../types';
import { CopyScript } from './CopyScript';
import { Icon } from './Icon';
import { SmartLink } from './Links';

export function ManualBlocks({ blocks }: { blocks: ManualBlock[] }) {
  const out: ReactElement[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const next = blocks[i + 1];
    // 「できること」と「やらないこと」が続くときは、左右に並べて見比べられるようにする
    if (b.kind === 'list' && b.tone === 'do' && next?.kind === 'list' && next.tone === 'dont') {
      out.push(
        <div className="dodont" key={i}>
          <Block block={b} />
          <Block block={next} />
        </div>,
      );
      i++;
      continue;
    }
    out.push(<Block key={i} block={b} />);
  }
  return <>{out}</>;
}

function Block({ block: b }: { block: ManualBlock }) {
  switch (b.kind) {
    case 'p':
      return <p>{b.text}</p>;
    case 'list':
      return (
        <div className={'mlist' + (b.tone ? ' mlist-' + b.tone : '')}>
          {b.title && <h3 className="mlist-title">{b.title}</h3>}
          <ul>
            {b.items.map((t) => (
              <li key={t}>
                {b.tone && <Icon name={b.tone === 'do' ? 'check' : 'cross'} className="mlist-mark" />}
                {t}
              </li>
            ))}
          </ul>
        </div>
      );
    case 'scripts':
      return (
        <div className="script-list">
          {b.items.map((s) => (
            <CopyScript key={s.id} script={s} />
          ))}
        </div>
      );
    case 'dialog':
      return (
        <div className="dialog">
          <h3 className="mlist-title">{b.title}</h3>
          <dl>
            {b.lines.map((l, i) => (
              <div key={i} className={'dialog-line dialog-' + l.who}>
                <dt>{l.who === 'me' ? 'あなた' : '職員'}</dt>
                <dd>{l.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case 'terms':
      return (
        <dl className="terms">
          {b.items.map((t) => (
            <div key={t.term}>
              <dt>{t.term}</dt>
              <dd>{t.desc}</dd>
            </div>
          ))}
        </dl>
      );
    case 'note':
      return (
        <p className="note">
          <Icon name="alert" />
          <span>{b.text}</span>
        </p>
      );
    case 'link':
      return (
        <p className="mlink">
          <SmartLink to={b.to}>
            {b.label}
            <Icon name="arrow-right" className="icon-inline" />
          </SmartLink>
        </p>
      );
  }
}

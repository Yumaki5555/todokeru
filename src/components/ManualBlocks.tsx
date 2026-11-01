// 電話マニュアルの本文（段落・箇条書き・台本・会話例など）を表示する
import type { ManualBlock } from '../types';
import { CopyScript } from './CopyScript';
import { Icon } from './Icon';
import { SmartLink } from './Links';

export function ManualBlocks({ blocks }: { blocks: ManualBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </>
  );
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
                {b.tone && (
                  <span className="mlist-mark" aria-hidden="true">
                    {b.tone === 'do' ? '○' : '×'}
                  </span>
                )}
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
          <Icon name="info" />
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

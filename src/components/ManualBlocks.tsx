// 電話・文章のマニュアルの本文（段落・箇条書き・台本・会話例・文面の見本など）を表示する
import { useId, useState, type ReactElement } from 'react';
import type { ManualBlock, ManualSample } from '../types';
import { sampleText } from '../lib/text';
import { CopyButton } from './CopyButton';
import { ScriptExample } from './ScriptExample';
import { Icon } from './Icon';
import { JumpLink, SmartLink } from './Links';

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
            <ScriptExample key={s.id} script={s} />
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
    case 'link': {
      const label = (
        <>
          {b.label}
          <Icon name="arrow-right" className="icon-inline" />
        </>
      );
      return (
        <p className="mlink">
          {b.section ? (
            <JumpLink path={b.to} id={b.section}>
              {label}
            </JumpLink>
          ) : (
            <SmartLink to={b.to}>{label}</SmartLink>
          )}
        </p>
      );
    }
    case 'sample':
      return <SampleBlock title={b.title} items={b.items} />;
  }
}

/** 文面の見本。部分ごとにラベルを付けて縦に並べ、見本が2つ以上あれば同じ枠の中で切りかえる */
function SampleBlock({ title, items }: { title: string; items: ManualSample[] }) {
  const [id, setId] = useState(items[0].id);
  const name = useId();
  const s = items.find((x) => x.id === id) ?? items[0];
  return (
    <figure className="sample" aria-label={title}>
      <figcaption className="mlist-title">{title}</figcaption>
      {items.length > 1 && (
        <fieldset className="sample-switch">
          <legend className="sr-only">見本を切りかえる</legend>
          <div className="stance-chips">
            {items.map((x) => (
              <label key={x.id} className="stance-chip">
                <input type="radio" name={name} value={x.id} checked={x.id === s.id} onChange={() => setId(x.id)} />
                <span>{x.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <dl className="sample-parts">
        {s.parts.map((p) => (
          <div key={p.label}>
            <dt>{p.label}</dt>
            <dd>{p.text}</dd>
          </div>
        ))}
      </dl>
      {s.notes && (
        <ul className="sample-notes">
          {s.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      <CopyButton key={s.id} text={sampleText(s)} label="まとめてコピー" />
    </figure>
  );
}

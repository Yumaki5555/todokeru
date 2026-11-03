// 書き方マニュアル（パブコメ・請願陳情）で共通の小さな部品
// 見た目のクラス名は、最初に作ったパブコメの書き方（pc-）のものをそのまま使う。
import type { ReactNode } from 'react';
import type { PubcomFigItem } from '../types';
import { Icon } from './Icon';
import { SmartLink } from './Links';

/** ページの入り口のそれぞれ（番号と見出し） */
export function Part({ part, children }: { part: { id: string; no: number; title: string }; children: ReactNode }) {
  return (
    <section className="section pc-part" id={part.id} aria-labelledby={`${part.id}-h`} tabIndex={-1}>
      <div className="pc-part-head">
        <span className="pc-part-no" aria-hidden="true">
          {part.no}
        </span>
        <h2 id={`${part.id}-h`}>{part.title}</h2>
      </div>
      {children}
    </section>
  );
}

/** 横（スマホでは縦）に矢印でつないだ流れ */
export function Flow({ items, label }: { items: PubcomFigItem[]; label: string }) {
  return (
    <ol className="call-flow pc-flow" aria-label={label}>
      {items.map((f) => (
        <li key={f.label + (f.sub || '')}>
          <span className="call-flow-icon" aria-hidden="true">
            <Icon name={f.icon} />
          </span>
          <b>{f.label}</b>
          <span>{f.sub || ''}</span>
        </li>
      ))}
    </ol>
  );
}

/** 「AIでできること」の小さな案内 */
export function AiTip<T extends string>({ tip, label, onUse }: { tip: { text: string; prompt: T }; label: string; onUse: (id: T) => void }) {
  return (
    <p className="pc-ai-tip">
      <span className="pc-ai-tip-label">
        <Icon name="sparkle" />
        AIでできること
      </span>
      <span className="pc-ai-tip-text">{tip.text}</span>
      <GoPrompt id={tip.prompt} label={label} onUse={onUse} />
    </p>
  );
}

/** その目的の指示文を選んで、指示文の選択へ移るボタン（label は指示文の選択肢の名前） */
export function GoPrompt<T extends string>({ id, label, onUse }: { id: T; label: string; onUse: (id: T) => void }) {
  return (
    <button type="button" className="pc-ai-go" onClick={() => onUse(id)}>
      指示文を見る
      <span className="sr-only">（{label}）</span>
      <Icon name="arrow-right" className="icon-inline" />
    </button>
  );
}

/** 公式の資料へのリンク（小さく） */
export function Sources({ links }: { links: { label: string; url: string }[] }) {
  return (
    <ul className="pc-sources">
      {links.map((l) => (
        <li key={l.url}>
          <SmartLink to={l.url}>{l.label}</SmartLink>
        </li>
      ))}
    </ul>
  );
}

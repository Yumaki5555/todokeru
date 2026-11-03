// 書き方マニュアル（パブコメ・請願陳情・署名）で共通の小さな部品
// 見た目のクラス名は、最初に作ったパブコメの書き方（pc-）のものをそのまま使う。
import type { ReactNode, RefObject } from 'react';
import type { GuidePart, PubcomFigItem } from '../types';
import { Icon } from './Icon';
import { JumpBar, useScrollSpy } from './JumpNav';
import { JumpLink, SmartLink } from './Links';

/** 丸数字（①〜⑨） */
const circled = (no: number) => String.fromCharCode(0x2460 + no - 1);

/** ページ最初の目次（4つのまとまりへの入り口） */
export function PartMenu({ path, parts, navRef }: { path: string; parts: GuidePart[]; navRef: RefObject<HTMLElement | null> }) {
  return (
    <nav aria-label="このページの内容" id="contents" tabIndex={-1} ref={navRef}>
      <ol className="pc-menu">
        {parts.map((p) => (
          <li key={p.id}>
            <JumpLink path={path} id={p.id} className="pc-menu-link">
              <span className="pc-menu-icon" aria-hidden="true">
                <Icon name={p.icon} />
              </span>
              <span className="pc-menu-text">
                <b>
                  <span className="pc-num" aria-hidden="true">
                    {p.no}
                  </span>
                  {p.title}
                </b>
                <span>{p.sub}</span>
                {p.optional && <span className="pc-optional">必要なときだけ</span>}
              </span>
            </JumpLink>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** 目次が見えなくなったら、画面の下に4つのまとまりを出し、いま読んでいるところに印を付ける */
export function PartBar({ path, parts, topRef }: { path: string; parts: GuidePart[]; topRef: RefObject<HTMLElement | null> }) {
  const current = useScrollSpy(parts.map((p) => p.id));
  return (
    <JumpBar
      path={path}
      items={parts.map((p) => ({ id: p.id, no: p.no, icon: p.icon, label: p.short }))}
      current={current}
      topRef={topRef}
      label="このページの目次（いま読んでいるところに印）"
      wide
    />
  );
}

/** ページの入り口のそれぞれ（番号と見出し）。skipTo：必要なときだけ読むまとまりで、飛ばして進む先 */
export function Part({ part, skipTo, children }: { part: GuidePart; skipTo?: { path: string; part: GuidePart }; children: ReactNode }) {
  return (
    <section className="section pc-part" id={part.id} aria-labelledby={`${part.id}-h`} tabIndex={-1}>
      <div className="pc-part-head">
        <span className="pc-part-no" aria-hidden="true">
          {part.no}
        </span>
        <h2 id={`${part.id}-h`}>{part.title}</h2>
      </div>
      {skipTo && (
        <p className="pc-skip">
          <Icon name="info" />
          <span>
            ここは、必要なときだけ読めば大丈夫です。{' '}
            <JumpLink path={skipTo.path} id={skipTo.part.id}>
              {circled(skipTo.part.no)}「{skipTo.part.title}」へ進む
            </JumpLink>
          </span>
        </p>
      )}
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

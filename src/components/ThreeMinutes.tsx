// 「まず3分でわかる」：4つのSTEPを縦の流れで見せる（大きなアイコン＋短い見出し＋1文＋選択肢や小さな図）
// STEP 1 の目的を押すと、STEP 2 の方法のうち向いているものに印がつく（押さなくても全部読める）
import { Fragment, useState } from 'react';
import { findGuide, guidePath } from '../content/guides';
import { METHODS, PURPOSES, THREE_MINUTE_STEPS } from '../content/threeMinutes';
import { href } from '../router';
import type { ThreeMinutePurpose, ThreeMinuteStep } from '../types';
import { Icon } from './Icon';
import { SmartLink } from './Links';

export function ThreeMinutes() {
  const [purposeId, setPurposeId] = useState<string | null>(null);
  const purpose = PURPOSES.find((p) => p.id === purposeId);
  return (
    <section className="section three-min" id="sanpun" aria-labelledby="sanpun-h" tabIndex={-1}>
      <div className="band">
        <span className="band-label">まず3分でわかる</span>
        <h2 id="sanpun-h">4つのステップで、声の届け方をつかむ</h2>
      </div>
      <ol className="steps">
        {THREE_MINUTE_STEPS.map((s) => (
          <li className="step" key={s.no}>
            <span className="step-icon" aria-hidden="true">
              <Icon name={s.icon} />
            </span>
            <div className="step-body">
              <h3 id={`step${s.no}-h`}>
                <span className="step-no">STEP {s.no}</span>
                {s.title}
              </h3>
              <p className="step-text">{s.text}</p>
              {s.choices === 'purposes' && <PurposePicker value={purposeId} onChange={setPurposeId} />}
              {s.choices === 'methods' && <MethodCards purpose={purpose} />}
              {s.figure && <StepFigure figure={s.figure} />}
              {s.more && (
                <p className="step-more">
                  {s.more.map((m) => (
                    <SmartLink key={m.to} to={m.to} className="btn btn-secondary btn-small">
                      {m.label}
                      <Icon name="arrow-right" />
                    </SmartLink>
                  ))}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** STEP 1：したいことを1つ押す（もう一度押すと外れる） */
function PurposePicker({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  return (
    <ul className="purpose-pick">
      {PURPOSES.map((p) => (
        <li key={p.id}>
          <button type="button" aria-pressed={value === p.id} onClick={() => onChange(value === p.id ? null : p.id)}>
            <Icon name={p.icon} />
            <Breakable label={p.label} />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** STEP 2：6つの方法の小さなカード（押すと、その方法のガイドへ） */
function MethodCards({ purpose }: { purpose: ThreeMinutePurpose | undefined }) {
  const names = METHODS.filter((m) => purpose?.methods.includes(m.slug)).map((m) => plain(m.label));
  return (
    <>
      <p className="method-hint" aria-live="polite">
        {purpose && (
          <>
            <Icon name="check" />「{plain(purpose.label)}」に向いている方法：{names.join('、')}
          </>
        )}
      </p>
      <ul className="method-cards">
        {METHODS.map((m) => {
          const g = findGuide(m.slug)!;
          const match = !!purpose?.methods.includes(m.slug);
          const coming = g.status === 'coming';
          return (
            <li className={'method-card' + (match ? ' is-match' : '')} key={m.slug}>
              <a href={href(guidePath(m.slug))}>
                <span className="method-icon" aria-hidden="true">
                  <Icon name={g.icon} />
                </span>
                <b className="method-name">
                  <Breakable label={m.label} />
                </b>
                <span className="method-sub">
                  <Breakable label={m.sub} />
                </span>
                {coming && <span className="menu-soon">準備中</span>}
                {match && (
                  <span className="method-mark">
                    <Icon name="check" />
                    <span className="sr-only">（向いている）</span>
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** 「/」の位置だけで折り返す（短いラベルは単語の途中で切らない） */
function Breakable({ label }: { label: string }) {
  return (
    <span className="breakable">
      {label.split('/').map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {part}
        </Fragment>
      ))}
    </span>
  );
}

const plain = (label: string) => label.replace(/\//g, '');

function StepFigure({ figure }: { figure: NonNullable<ThreeMinuteStep['figure']> }) {
  const List = figure.kind === 'list' ? 'ol' : 'ul';
  return (
    <List className={'fig fig-' + figure.kind}>
      {figure.items.map((it) => (
        <li key={it.label}>
          {it.icon && (
            <span className="fig-icon" aria-hidden="true">
              <Icon name={it.icon} />
            </span>
          )}
          <span className="fig-text">
            <b>{it.label}</b>
            {it.sub && <span>{it.sub}</span>}
          </span>
        </li>
      ))}
    </List>
  );
}

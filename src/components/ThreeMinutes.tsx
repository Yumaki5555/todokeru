// 「3分でわかる」：4つのSTEPを縦の流れで見せる（大きなアイコン＋短い見出し＋1文＋選択肢や小さな図）
// STEP 1 はトップと同じ「何をしたいですか？」の部品。目的を押すと、STEP 2 の方法のうち使えるものに印がつく（押さなくても全部読める）
import { BEFORE_YOU_SEND, METHODS, THREE_MINUTE_STEPS, purposeMethods } from '../content/threeMinutes';
import { findGuide, guidePath } from '../content/guides';
import { href } from '../router';
import type { ThreeMinutePurpose, ThreeMinuteStep } from '../types';
import { Icon } from './Icon';
import { SmartLink } from './Links';
import { Breakable, PurposeFinder, usePurpose } from './PurposeFinder';

export function ThreeMinutes() {
  const [purpose, setPurpose] = usePurpose();
  return (
    <section className="section three-min" id="sanpun" aria-label="4つのステップ" tabIndex={-1}>
      <ol className="steps">
        {THREE_MINUTE_STEPS.map((s) => (
          <li className="step" key={s.no}>
            <span className="step-icon" aria-hidden="true">
              <Icon name={s.icon} />
            </span>
            <div className="step-body">
              <h2 id={`step${s.no}-h`}>
                <span className="step-no">STEP {s.no}</span>
                {s.title}
              </h2>
              <p className="step-text">{s.text}</p>
              {s.choices === 'purposes' && <PurposeFinder purpose={purpose} onChange={setPurpose} />}
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

/** ガイドの最後：声を届ける前に知っておきたいこと（1行ずつ。詳しくは各マニュアルへ） */
export function BeforeYouSend() {
  return (
    <section className="section before-send" id="before" aria-labelledby="before-h">
      <h2 id="before-h" className="section-title">
        声を届ける前に知っておきたいこと
      </h2>
      <ul className="before-list">
        {BEFORE_YOU_SEND.map((b) => (
          <li key={b.text}>
            <span className="before-icon" aria-hidden="true">
              <Icon name={b.icon} />
            </span>
            <p>
              {b.text}
              <SmartLink to={b.link.to} className="before-link">
                {b.link.label}
                <Icon name="arrow-right" />
              </SmartLink>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** STEP 2：6つの方法の小さなカード（押すと、その方法のガイドへ） */
function MethodCards({ purpose }: { purpose: ThreeMinutePurpose | undefined }) {
  const marked = purpose ? purposeMethods(purpose) : [];
  return (
    <ul className="method-cards">
      {METHODS.map((m) => {
        const g = findGuide(m.slug)!;
        const match = marked.includes(m.slug);
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
                  <span className="sr-only">（選んだ目的に使える）</span>
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

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

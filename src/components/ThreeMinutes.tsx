// 「まず3分でわかる」：5つのSTEPを縦の流れで見せる（大きなアイコン＋短い見出し＋1文＋小さな図）
import { PURPOSE_NOTE, PURPOSE_TABLE, THREE_MINUTE_STEPS } from '../content/threeMinutes';
import type { ThreeMinuteStep } from '../types';
import { Icon } from './Icon';
import { SmartLink } from './Links';

export function ThreeMinutes() {
  return (
    <section className="section three-min" id="sanpun" aria-labelledby="sanpun-h" tabIndex={-1}>
      <div className="band">
        <span className="band-label">まず3分でわかる</span>
        <h2 id="sanpun-h">5つのステップで、声の届け方をつかむ</h2>
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
              {s.figure && <StepFigure figure={s.figure} />}
              {s.no === 5 && (
                <details className="fold">
                  <summary>目的別の早見表（6項目）</summary>
                  <dl className="purpose-table">
                    {PURPOSE_TABLE.map((r) => (
                      <div key={r.purpose}>
                        <dt>{r.purpose}</dt>
                        <dd>
                          <Icon name={r.icon} />
                          {r.method}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="fold-note">{PURPOSE_NOTE}</p>
                </details>
              )}
              {s.more && (
                <p className="step-more">
                  <SmartLink to={s.more.to}>{s.more.label}</SmartLink>
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function StepFigure({ figure }: { figure: NonNullable<ThreeMinuteStep['figure']> }) {
  const List = figure.kind === 'flow' ? 'ol' : 'ul';
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

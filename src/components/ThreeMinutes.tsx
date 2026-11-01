// 「まず3分でわかる」：5つのSTEPで全体をつかむ
import { PURPOSE_NOTE, PURPOSE_TABLE, THREE_MINUTE_STEPS } from '../content/threeMinutes';
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
              {s.body.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
              {s.no === 5 && (
                <dl className="purpose-table">
                  {PURPOSE_TABLE.map((r) => (
                    <div key={r.purpose}>
                      <dt>{r.purpose}</dt>
                      <dd>
                        <Icon name="arrow-right" className="icon-inline" />
                        {r.method}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {s.no === 5 && <p>{PURPOSE_NOTE}</p>}
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

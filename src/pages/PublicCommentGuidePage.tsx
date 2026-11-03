// パブコメの書き方「自分の意見を、伝わる形に。」
// 上から順に：① 3分でわかる → ② AIを使ってみよう → ③ もっと詳しく調べる（必要な人だけ開く） → ④ 提出する
//   #/guide/public-comment?s=prompts  AIへの指示文の選択から表示
// 文章と指示文は content/pubcomManual.ts にまとめてある。
import { useRef } from 'react';
import { GUIDES, guidePath } from '../content/guides';
import {
  AI_KEY,
  AI_STEPS,
  CHECKLIST_DONE,
  COMPARE,
  DEFAULT_PROMPT,
  DOUBLE_CHECK,
  FIND_CASES,
  OPINION_TEMPLATE,
  PUBCOM_CHECKLIST,
  PUBCOM_GUIDE,
  PUBCOM_PARTS,
  PROMPTS,
  PUBCOM_STEPS,
  RESEARCH,
  RESULT_POINTS,
  SUBMIT_FLOW,
  SUBMIT_METHODS,
  SUBMIT_NOTES,
  WHAT_IS,
  findPrompt,
  templateText,
} from '../content/pubcomManual';
import { scrollToSection } from '../lib/dom';
import { useSessionChoice } from '../lib/sessionChoice';
import { href } from '../router';
import type { PromptId, PubcomRevision } from '../types';
import { Checklist } from '../components/Checklist';
import { CopyButton } from '../components/CopyButton';
import { Icon } from '../components/Icon';
import { AiTip, Flow, GoPrompt, Part, PartBar, PartMenu, Sources } from '../components/GuideParts';
import { PageEndNav } from '../components/Links';
import { PageHead } from '../components/PageHead';
import { PromptPicker } from '../components/PromptPicker';

const PATH = '/guide/public-comment';

export function PublicCommentGuidePage() {
  const menuRef = useRef<HTMLElement>(null);
  const [promptId, setPromptId] = useSessionChoice<PromptId>('todokeru:prompt:pubcom:v1', DEFAULT_PROMPT, PROMPTS.map((p) => p.id));
  // 「AIでできること」から：その指示文を選んで、指示文の選択へ移る
  const pickPrompt = (id: PromptId) => {
    setPromptId(id);
    requestAnimationFrame(() => scrollToSection('prompts'));
  };

  return (
    <div className="wrap page pubcom-guide">
      <PageHead title={PUBCOM_GUIDE.title} sub={PUBCOM_GUIDE.subtitle} />

      <PartMenu path={PATH} parts={PUBCOM_PARTS} navRef={menuRef} />

      {/* ① 3分でわかる */}
      <Part part={PUBCOM_PARTS[0]}>
        <section className="pc-sub" aria-labelledby="what-h">
          <h3 id="what-h" className="pc-sub-title">
            {WHAT_IS.title}
          </h3>
          <p className="pc-lead">{WHAT_IS.lead}</p>
          <Flow items={WHAT_IS.flow} label="パブコメの流れ" />
          <ul className="pc-facts" aria-label="知っておきたいこと">
            {WHAT_IS.facts.map((f) => (
              <li key={f.label}>
                <span className="fig-icon" aria-hidden="true">
                  <Icon name={f.icon} />
                </span>
                <span>
                  <b>{f.label}</b>
                  <span>{f.sub}</span>
                </span>
              </li>
            ))}
          </ul>
          <Sources links={WHAT_IS.sources} />
        </section>

        <section className="pc-sub" aria-labelledby="steps-h">
          <h3 id="steps-h" className="pc-sub-title">
            書き方の4ステップ
          </h3>
          <ol className="steps pc-steps">
            {PUBCOM_STEPS.map((s) => (
              <li className="step" key={s.no}>
                <span className="step-icon" aria-hidden="true">
                  <Icon name={s.icon} />
                </span>
                <div className="step-body">
                  <h4>
                    <span className="step-no">STEP {s.no}</span>
                    {s.title}
                  </h4>
                  <p className="step-text">{s.text}</p>
                  {s.chips && (
                    <ul className="pc-chips">
                      {s.chips.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  )}
                  {s.examples && (
                    <div className="pc-example">
                      <span className="pc-example-label">例</span>
                      {s.examples.map((e) => (
                        <p key={e}>{e}</p>
                      ))}
                    </div>
                  )}
                  {s.revision && <Revision r={s.revision} />}
                  {s.note && <p className="pc-step-note">{s.note}</p>}
                  <AiTip tip={s.ai} label={findPrompt(s.ai.prompt).label} onUse={pickPrompt} />
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="pc-sub" aria-labelledby="template-h">
          <h3 id="template-h" className="pc-sub-title">
            {OPINION_TEMPLATE.title}
          </h3>
          <figure className="sample pc-template" aria-labelledby="template-h">
            <dl className="sample-parts">
              {OPINION_TEMPLATE.parts.map((p) => (
                <div key={p.label}>
                  <dt>{p.label}</dt>
                  <dd>{p.text}</dd>
                </div>
              ))}
            </dl>
            <p className="sample-notes pc-template-note">{OPINION_TEMPLATE.note}</p>
            <CopyButton text={templateText()} label="ひな形をコピー" />
          </figure>
        </section>

        <section className="pc-sub" aria-labelledby="compare-h">
          <h3 id="compare-h" className="pc-sub-title">
            {COMPARE.title}
          </h3>
          <div className="dodont pc-compare">
            <div className="mlist mlist-dont">
              <h4 className="mlist-title">{COMPARE.weak.title}</h4>
              <blockquote className="pc-quote">{COMPARE.weak.quote}</blockquote>
              <ul>
                {COMPARE.weak.points.map((t) => (
                  <li key={t}>
                    <Icon name="cross" className="mlist-mark" />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="pc-compare-note">{COMPARE.weak.note}</p>
            </div>
            <div className="mlist mlist-do">
              <h4 className="mlist-title">{COMPARE.strong.title}</h4>
              <blockquote className="pc-quote">{COMPARE.strong.quote}</blockquote>
              <ul>
                {COMPARE.strong.points.map((t) => (
                  <li key={t}>
                    <Icon name="check" className="mlist-mark" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="pc-summary">{COMPARE.summary}</p>
          <p className="pc-formula">
            {COMPARE.formula.map((t, i) => (
              <span key={t} className="pc-formula-item">
                {i > 0 && <span className="pc-plus">＋</span>}
                <b>{t}</b>
              </span>
            ))}
            <span className="pc-formula-result">＝ {COMPARE.formulaResult}</span>
          </p>
        </section>
      </Part>

      {/* ② AIを使ってみよう */}
      <Part part={PUBCOM_PARTS[1]}>
        <section className="pc-sub" aria-labelledby="where-h">
          <h3 id="where-h" className="pc-sub-title">
            AIはどこで使う？
          </h3>
          <ol className="pc-ai-steps">
            {AI_STEPS.map((s) => (
              <li key={s.no}>
                <p className="pc-ai-title">
                  <span className="pc-num" aria-hidden="true">
                    {s.no}
                  </span>
                  <Icon name={s.icon} />
                  <b>{s.title}</b>
                </p>
                <dl className="pc-roles">
                  <div>
                    <dt className="pc-role-me">あなた</dt>
                    <dd>{s.me}</dd>
                  </div>
                  <div>
                    <dt className="pc-role-ai">AI</dt>
                    <dd>{s.ai}</dd>
                  </div>
                </dl>
                <GoPrompt id={s.prompt} label={findPrompt(s.prompt).label} onUse={pickPrompt} />
              </li>
            ))}
          </ol>
          <p className="pc-key">
            <Icon name="user" />
            <span>
              <b>{AI_KEY.strong}</b>
              {AI_KEY.rest}
            </span>
          </p>
        </section>

        <section className="pc-sub" id="prompts" aria-labelledby="prompts-h" tabIndex={-1}>
          <h3 id="prompts-h" className="pc-sub-title">
            AIに頼んでみよう
          </h3>
          <p className="pc-lead">やりたいことを選んで、指示文をコピー！</p>
          <PromptPicker prompts={PROMPTS} value={promptId} onChange={setPromptId} />
        </section>
      </Part>

      {/* ③ もっと詳しく調べる */}
      <Part part={PUBCOM_PARTS[2]} skipTo={{ path: PATH, part: PUBCOM_PARTS[3] }}>
        <p className="pc-lead">必要な人だけ、開いて読んでください。</p>
        <div className="chapters pc-research">
          {RESEARCH.map((r, i) => (
            <details key={r.id} id={r.id} className="chapter">
              <summary>
                <span className="ch-icon" aria-hidden="true">
                  <Icon name={r.icon} />
                </span>
                <span className="ch-head">
                  <h3>
                    <span className="ch-no">調べ方{i + 1}</span>
                    <span className="ch-title">{r.title}</span>
                  </h3>
                  <span className="chapter-lead">{r.lead}</span>
                </span>
              </summary>
              <div className="chapter-body">
                <div className="pc-block">
                  <h4 className="mlist-title">{r.listTitle}</h4>
                  <ul className="pc-chips">
                    {r.items.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
                {r.links && <Sources links={r.links} />}
                {r.revision && <Revision r={r.revision} />}
                {r.notes?.map((n) => (
                  <p className="note" key={n}>
                    <Icon name="alert" />
                    <span>{n}</span>
                  </p>
                ))}
                <AiTip tip={r.ai} label={findPrompt(r.ai.prompt).label} onUse={pickPrompt} />
              </div>
            </details>
          ))}
        </div>

        <section className="pc-sub pc-double" id="double-check" aria-labelledby="double-h">
          <h3 id="double-h" className="pc-sub-title">
            {DOUBLE_CHECK.title}
          </h3>
          <p className="pc-lead">{DOUBLE_CHECK.sub}</p>
          <Flow items={DOUBLE_CHECK.flow} label="2つのAIで確かめる流れ" />
          <div className="dodont">
            <div className="mlist mlist-dont">
              <h4 className="mlist-title">{DOUBLE_CHECK.risksTitle}</h4>
              <ul>
                {DOUBLE_CHECK.risks.map((t) => (
                  <li key={t}>
                    <Icon name="alert" className="mlist-mark" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mlist mlist-do">
              <h4 className="mlist-title">{DOUBLE_CHECK.tipsTitle}</h4>
              <ul>
                {DOUBLE_CHECK.tips.map((t) => (
                  <li key={t}>
                    <Icon name="check" className="mlist-mark" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="note pc-warning">
            <Icon name="alert" />
            <span>{DOUBLE_CHECK.warning}</span>
          </p>
          <p>
            <button type="button" className="btn btn-secondary" onClick={() => pickPrompt('recheck')}>
              <Icon name="sparkle" />
              「別のAIで再検証したい」の指示文を使う
            </button>
          </p>
        </section>
      </Part>

      {/* ④ 提出する */}
      <Part part={PUBCOM_PARTS[3]}>
        <section className="pc-sub" id="checklist" aria-labelledby="check-h">
          <h3 id="check-h" className="pc-sub-title">
            提出前チェック
          </h3>
          <p className="muted">チェックはこの画面の中だけで、保存や送信はされません。チェックしなくても先へ進めます。</p>
          <Checklist title="提出する前に" items={PUBCOM_CHECKLIST} doneText={CHECKLIST_DONE} meter />
        </section>

        <section className="pc-sub" aria-labelledby="how-h">
          <h3 id="how-h" className="pc-sub-title">
            提出のしかた
          </h3>
          <Flow items={SUBMIT_FLOW} label="提出の流れ" />
          <ul className="pc-methods" aria-label="提出方法の例">
            {SUBMIT_METHODS.map((m) => (
              <li key={m.label}>
                <Icon name={m.icon} />
                {m.label}
              </li>
            ))}
          </ul>
          {SUBMIT_NOTES.map((n) => (
            <p className="note" key={n}>
              <Icon name="info" />
              <span>{n}</span>
            </p>
          ))}
          <h4 className="mlist-title">募集中の案件を探す</h4>
          <ul className="related-list">
            {FIND_CASES.national.map((r) => (
              <li key={r.url}>
                <a href={r.url} className="related-card">
                  <b>
                    {r.label}
                    <Icon name="external" className="icon-inline" />
                    <span className="sr-only">（外部サイト）</span>
                  </b>
                  <span>{r.desc}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="pc-step-note">{FIND_CASES.local}</p>
        </section>

        <section className="pc-sub" aria-labelledby="result-h">
          <h3 id="result-h" className="pc-sub-title">
            結果を確かめる
          </h3>
          <ul className="pc-points">
            {RESULT_POINTS.map((t) => (
              <li key={t}>
                <Icon name="check" />
                {t}
              </li>
            ))}
          </ul>
          <p className="pc-step-note">案や手続きでわからないことは、募集している担当の部署に問い合わせられます。</p>
          <p className="step-more">
            <a className="btn btn-secondary btn-small" href={href(guidePath('phone'))}>
              <Icon name="phone" />
              電話で問い合わせる
            </a>
            <a className="btn btn-secondary btn-small" href={href(guidePath('email'))}>
              <Icon name="mail" />
              メールで問い合わせる
            </a>
          </p>
        </section>
      </Part>

      <section className="section" aria-labelledby="next-h">
        <h2 id="next-h" className="section-title">
          ほかの届け方
        </h2>
        <ul className="guide-chips">
          {GUIDES.filter((g) => g.slug !== 'public-comment').map((g) => (
            <li key={g.slug}>
              <a href={href(guidePath(g.slug))}>
                <Icon name={g.icon} />
                {g.title}
              </a>
              {g.status === 'coming' && <span className="badge badge-muted">準備中</span>}
            </li>
          ))}
        </ul>
      </section>
      <PageEndNav />
      <PartBar path={PATH} parts={PUBCOM_PARTS} topRef={menuRef} />
    </div>
  );
}

/** 現行案 → 修正提案 ＋ 理由 */
function Revision({ r }: { r: PubcomRevision }) {
  return (
    <dl className="pc-revision">
      <div className="pc-rev-before">
        <dt>現行案</dt>
        <dd>{r.before}</dd>
      </div>
      <div className="pc-rev-after">
        <dt>修正提案</dt>
        <dd>{r.after}</dd>
      </div>
      <div className="pc-rev-reason">
        <dt>理由</dt>
        <dd>{r.reason}</dd>
      </div>
    </dl>
  );
}

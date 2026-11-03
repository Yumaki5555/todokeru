// 請願・陳情の書き方「議会に、正式に検討を求める。」
// パブコメの書き方と同じ並び：① 3分でわかる → ② 書いてみよう → ③ もっと詳しく → ④ 提出する
//   #/guide/petition?s=prompts  AIへの指示文の選択から表示
// 文章と指示文は content/petitionManual.ts にまとめてある。
import { GUIDES, guidePath } from '../content/guides';
import {
  AFTER_FLOW,
  CHECKLIST_DONE,
  COMPARE,
  DEFAULT_PROMPT,
  DOUBLE_CHECK,
  FAQ,
  INTRODUCER,
  PETITION_CHECKLIST,
  PETITION_GUIDE,
  PETITION_PARTS,
  PETITION_PROMPTS,
  PETITION_STEPS,
  PETITION_TEMPLATE,
  PRIVACY,
  PROMPT_LEAD,
  RESULTS,
  RESULT_POINTS,
  RESULT_WARNING,
  RULES,
  findPrompt,
  templateText,
} from '../content/petitionManual';
import { scrollToSection } from '../lib/dom';
import { useSessionChoice } from '../lib/sessionChoice';
import { href } from '../router';
import type { PetitionCard, PetitionPromptId, PetitionStep } from '../types';
import { Checklist } from '../components/Checklist';
import { CopyButton } from '../components/CopyButton';
import { AiTip, Flow, Part, Sources } from '../components/GuideParts';
import { Icon } from '../components/Icon';
import { JumpLink, PageEndNav, SmartLink } from '../components/Links';
import { PageHead } from '../components/PageHead';
import { PromptPicker } from '../components/PromptPicker';

const PATH = '/guide/petition';

export function PetitionGuidePage() {
  const [promptId, setPromptId] = useSessionChoice<PetitionPromptId>('todokeru:prompt:petition:v1', DEFAULT_PROMPT, PETITION_PROMPTS.map((p) => p.id));
  // 「AIでできること」などから：その指示文を選んで、指示文の選択へ移る
  const pickPrompt = (id: PetitionPromptId) => {
    setPromptId(id);
    requestAnimationFrame(() => scrollToSection('prompts'));
  };

  return (
    <div className="wrap page pubcom-guide petition-guide">
      <PageHead title={PETITION_GUIDE.title} sub={PETITION_GUIDE.subtitle} />

      <nav aria-label="このページの内容">
        <ol className="pc-menu">
          {PETITION_PARTS.map((p) => (
            <li key={p.id}>
              <JumpLink path={PATH} id={p.id} className="pc-menu-link">
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
                </span>
              </JumpLink>
            </li>
          ))}
        </ol>
      </nav>

      {/* ① 3分でわかる */}
      <Part part={PETITION_PARTS[0]}>
        <ol className="steps pc-steps">
          {PETITION_STEPS.map((s) => (
            <Step key={s.no} s={s} onUse={pickPrompt} />
          ))}
        </ol>
      </Part>

      {/* ② 書いてみよう */}
      <Part part={PETITION_PARTS[1]}>
        <section className="pc-sub" aria-labelledby="template-h">
          <h3 id="template-h" className="pc-sub-title">
            {PETITION_TEMPLATE.title}
          </h3>
          <figure className="sample pc-template" aria-labelledby="template-h">
            <div className="pt-doc">
              <p className="pt-doc-title">【{PETITION_TEMPLATE.heading}】</p>
              <p>{PETITION_TEMPLATE.to}</p>
              <p className="pt-doc-head">{PETITION_TEMPLATE.itemsTitle}</p>
              <ol className="pt-doc-items">
                {PETITION_TEMPLATE.items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
              <p className="pt-doc-head">{PETITION_TEMPLATE.reasonTitle}</p>
              {PETITION_TEMPLATE.reason.map((t) => (
                <p key={t}>{t}</p>
              ))}
              <p className="pt-doc-footer">
                {PETITION_TEMPLATE.footer.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </p>
            </div>
            <p className="sample-notes pc-template-note">{PETITION_TEMPLATE.note}</p>
            <CopyButton text={templateText()} label="ひな形をコピー" />
          </figure>
          <p className="pc-step-note">{PETITION_TEMPLATE.petitionNote}</p>
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
          <p className="note">
            <Icon name="alert" />
            <span>
              <b>{COMPARE.avoidTitle}：</b>
              {COMPARE.avoid.join('・')}
            </span>
          </p>
        </section>

        <section className="pc-sub" id="prompts" aria-labelledby="prompts-h" tabIndex={-1}>
          <h3 id="prompts-h" className="pc-sub-title">
            AIに頼んでみよう
          </h3>
          <p className="pc-lead">やりたいことを選んで、指示文をコピー！</p>
          <p className="pc-step-note">{PROMPT_LEAD}</p>
          <PromptPicker prompts={PETITION_PROMPTS} value={promptId} onChange={setPromptId} />
        </section>
      </Part>

      {/* ③ もっと詳しく */}
      <Part part={PETITION_PARTS[2]}>
        <section className="pc-sub pc-double" id="double-check" aria-labelledby="double-h">
          <h3 id="double-h" className="pc-sub-title">
            {DOUBLE_CHECK.title}
          </h3>
          <p className="pc-lead">{DOUBLE_CHECK.sub}</p>
          <Flow items={DOUBLE_CHECK.flow} label="2つのAIで確かめる流れ" />
          <ul className="pc-points">
            {DOUBLE_CHECK.points.map((t) => (
              <li key={t}>
                <Icon name="check" />
                {t}
              </li>
            ))}
          </ul>
          <p className="pc-key">
            <Icon name="user" />
            <span>
              <b>{DOUBLE_CHECK.key.strong}</b>
              {DOUBLE_CHECK.key.rest}
            </span>
          </p>
          <CopyButton text={findPrompt('review').text} label={DOUBLE_CHECK.copyLabel} buttonClass="btn btn-secondary" />
        </section>

        <section className="pc-sub" id="introducer" aria-labelledby="intro-h" tabIndex={-1}>
          <h3 id="intro-h" className="pc-sub-title">
            {INTRODUCER.title}
          </h3>
          <p className="pc-lead">{INTRODUCER.lead}</p>
          <ol className="pt-numbered">
            {INTRODUCER.steps.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          {INTRODUCER.notes.map((n) => (
            <p className="note" key={n}>
              <Icon name="info" />
              <span>{n}</span>
            </p>
          ))}
          <figure className="sample pc-template" aria-labelledby="letter-h">
            <h4 className="mlist-title" id="letter-h">
              {INTRODUCER.letterTitle}
            </h4>
            <p className="pt-letter">{INTRODUCER.letter}</p>
            <CopyButton text={INTRODUCER.letter} label="お願いの文をコピー" />
          </figure>
        </section>

        <section className="pc-sub" aria-labelledby="rules-h">
          <h3 id="rules-h" className="pc-sub-title">
            {RULES.title}
          </h3>
          <div className="dodont">
            {[RULES.common, RULES.local].map((g) => (
              <div className="mlist pt-rules" key={g.title}>
                <h4 className="mlist-title">{g.title}</h4>
                <ul>
                  {g.items.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="pc-step-note">{RULES.note}</p>
          <Sources links={RULES.links} />
        </section>

        <section className="pc-sub" aria-labelledby="faq-h">
          <h3 id="faq-h" className="pc-sub-title">
            よくある疑問
          </h3>
          {FAQ.map((f) => (
            <details className="fold" key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>
      </Part>

      {/* ④ 提出する */}
      <Part part={PETITION_PARTS[3]}>
        <section className="pc-sub" id="checklist" aria-labelledby="check-h">
          <h3 id="check-h" className="pc-sub-title">
            提出前チェック
          </h3>
          <p className="muted">チェックはこの画面の中だけで、保存や送信はされません。チェックしなくても先へ進めます。</p>
          <Checklist title="提出する前に" items={PETITION_CHECKLIST} doneText={CHECKLIST_DONE} meter />
        </section>

        <section className="pc-sub" aria-labelledby="privacy-h">
          <h3 id="privacy-h" className="pc-sub-title">
            {PRIVACY.title}
          </h3>
          <ul className="pc-points">
            {PRIVACY.items.map((t) => (
              <li key={t}>
                <Icon name="shield" />
                {t}
              </li>
            ))}
          </ul>
          <Sources links={PRIVACY.links} />
        </section>

        <section className="pc-sub" aria-labelledby="result-h">
          <h3 id="result-h" className="pc-sub-title">
            提出後はどうなる？
          </h3>
          <Flow items={AFTER_FLOW} label="提出後の流れ" />
          <dl className="pt-results">
            {RESULTS.map((r) => (
              <div key={r.term}>
                <dt>{r.term}</dt>
                <dd>{r.desc}</dd>
              </div>
            ))}
          </dl>
          <p className="note pc-warning">
            <Icon name="alert" />
            <span>{RESULT_WARNING}</span>
          </p>
          <ul className="pc-points">
            {RESULT_POINTS.map((t) => (
              <li key={t}>
                <Icon name="check" />
                {t}
              </li>
            ))}
          </ul>
          <p className="pc-step-note">手続きでわからないことは、提出先の議会事務局に問い合わせられます。</p>
          <p className="step-more">
            <a className="btn btn-secondary btn-small" href={href('/contacts', { tab: 'area' })}>
              <Icon name="search" />
              議会の窓口を探す
            </a>
            <a className="btn btn-secondary btn-small" href={href(guidePath('phone'))}>
              <Icon name="phone" />
              電話で問い合わせる
            </a>
          </p>
        </section>
      </Part>

      <section className="section" aria-labelledby="next-h">
        <h2 id="next-h" className="section-title">
          ほかの届け方
        </h2>
        <ul className="guide-chips">
          {GUIDES.filter((g) => g.slug !== 'petition').map((g) => (
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
    </div>
  );
}

/** 3分でわかるの1ステップ */
function Step({ s, onUse }: { s: PetitionStep; onUse: (id: PetitionPromptId) => void }) {
  return (
    <li className="step">
      <span className="step-icon" aria-hidden="true">
        <Icon name={s.icon} />
      </span>
      <div className="step-body">
        <h3>
          <span className="step-no">STEP {s.no}</span>
          {s.title}
        </h3>
        <p className="step-text">{s.text}</p>
        {s.cards && <Cards cards={s.cards} />}
        {s.branches && (
          <ul className="pt-branches" aria-label={s.title}>
            {s.branches.map((b) => (
              <li key={b.when}>
                {b.icon && <Icon name={b.icon} className="pt-branch-icon" />}
                <span>{b.when}</span>
                <Icon name="arrow-right" className="pt-branch-arrow" />
                <b>{b.then}</b>
              </li>
            ))}
          </ul>
        )}
        {s.parts && (
          <ol className="pt-parts">
            {s.parts.map((p) => (
              <li key={p.label}>
                <b>{p.label}</b>
                <span>{p.sub}</span>
              </li>
            ))}
          </ol>
        )}
        {s.chips && (
          <ul className="pc-chips">
            {s.chips.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
        {s.notes?.map((n) => (
          <p className="pc-step-note" key={n}>
            {n}
          </p>
        ))}
        {s.more && (
          <details className="fold">
            <summary>{s.more.title}</summary>
            <ul className="pt-more">
              {s.more.items.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            {s.more.links && <Sources links={s.more.links} />}
          </details>
        )}
        {s.links && (
          <p className="step-more">
            {s.links.map((l) =>
              l.prompt ? (
                <button type="button" className="btn btn-secondary btn-small" key={l.label} onClick={() => onUse(l.prompt!)}>
                  <Icon name={l.icon} />
                  {l.label}
                </button>
              ) : l.to.startsWith('/') ? (
                <SmartLink to={l.to} className="btn btn-secondary btn-small" key={l.label}>
                  <Icon name={l.icon} />
                  {l.label}
                </SmartLink>
              ) : (
                <JumpLink path={PATH} id={l.to} className="btn btn-secondary btn-small" key={l.label}>
                  <Icon name={l.icon} />
                  {l.label}
                </JumpLink>
              ),
            )}
          </p>
        )}
        {s.ai && <AiTip tip={s.ai} label={findPrompt(s.ai.prompt).label} onUse={onUse} />}
      </div>
    </li>
  );
}

/** 見比べるカード（スマホは1列、広い画面は2列） */
function Cards({ cards }: { cards: PetitionCard[] }) {
  return (
    <ul className="pt-cards">
      {cards.map((c) => (
        <li key={c.title} className="pt-card">
          <p className="pt-card-head">
            <span className="fig-icon" aria-hidden="true">
              <Icon name={c.icon} />
            </span>
            <b>{c.title}</b>
            {c.sub && <span className="pt-card-sub">{c.sub}</span>}
          </p>
          <ul>
            {c.points.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

// 署名の方法「署名で、声を集める。」
// 入り口は「賛同する（join）」「立ち上げる（start）」の2つ。並びはパブコメ・請願陳情の書き方と同じ
// ① 3分でわかる → ② やってみよう → ③ もっと詳しく → ④ 署名する・公開する
//   #/guide/signature?s=start  立ち上げの手順から表示
// 文章と指示文は content/signatureManual.ts にまとめてある。
import { useRef, useState } from 'react';
import { GUIDES, guidePath } from '../content/guides';
import {
  AFTER_PUBLISH,
  DEFAULT_PROMPT,
  ENTRY,
  FAQ,
  JOIN_CHECKLIST,
  JOIN_DONE,
  JOIN_STEPS,
  KINDS,
  LINKS,
  PROMPT_LEAD,
  PROMPT_NOTES,
  SIGNATURE_GUIDE,
  SIGNATURE_PARTS,
  SIGNATURE_PROMPTS,
  SIGNATURE_TEMPLATE,
  SITES,
  SOURCES,
  START_CHECKLIST,
  START_DONE,
  START_STEPS,
  WHAT_IS,
  findPrompt,
  templateText,
} from '../content/signatureManual';
import { scrollToSection } from '../lib/dom';
import { href } from '../router';
import type { IconName, SignaturePromptId, SignatureStep } from '../types';
import { Checklist } from '../components/Checklist';
import { CopyButton } from '../components/CopyButton';
import { AiTip, Flow, Part, Sources } from '../components/GuideParts';
import { Icon } from '../components/Icon';
import { JumpBar, useScrollSpy, type JumpItem } from '../components/JumpNav';
import { JumpLink, PageEndNav, SmartLink } from '../components/Links';
import { PageHead } from '../components/PageHead';
import { PromptPicker } from '../components/PromptPicker';

const PATH = '/guide/signature';

/** スマホで上の入り口が見えなくなったときに、画面の下に出す移動メニュー */
const BAR: JumpItem[] = [
  { id: 'join', icon: 'heart', label: '賛同する' },
  { id: 'start', icon: 'signature', label: '立ち上げる' },
  { id: 'contents', icon: 'list', label: '目次' },
];

export function SignatureGuidePage() {
  const [promptId, setPromptId] = useState<SignaturePromptId>(DEFAULT_PROMPT);
  const topNav = useRef<HTMLElement>(null);
  const area = useScrollSpy(['join', 'start', 'more']);
  // 「AIでできること」から：その指示文を選んで、指示文の選択へ移る
  const pickPrompt = (id: SignaturePromptId) => {
    setPromptId(id);
    requestAnimationFrame(() => scrollToSection('prompts'));
  };

  return (
    <div className="wrap page pubcom-guide petition-guide signature-guide">
      <PageHead title={SIGNATURE_GUIDE.title} sub={SIGNATURE_GUIDE.subtitle} />

      {/* 大きな2つの入り口。それぞれの手順へページの中で移る */}
      <nav aria-label="どちらから始める？" ref={topNav}>
        <ul className="sg-entry">
          {ENTRY.map((e) => (
            <li key={e.id}>
              <JumpLink path={PATH} id={e.id} push className={'sg-entry-link sg-entry-' + e.mark}>
                <span className="sg-entry-head">
                  <span className="sg-mark" aria-hidden="true">
                    {e.mark}
                  </span>
                  <Icon name={e.icon} />
                  <b>{e.title}</b>
                </span>
                <span className="sg-entry-sub">{e.sub}</span>
                <MiniFlow steps={e.flow} />
                <span className="sg-entry-go">
                  手順を見る
                  <Icon name="arrow-right" className="icon-inline" />
                </span>
              </JumpLink>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="このページの内容" id="contents" tabIndex={-1}>
        <ol className="pc-menu">
          {SIGNATURE_PARTS.map((p) => (
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
      <Part part={SIGNATURE_PARTS[0]}>
        <p className="pc-lead">{WHAT_IS.text}</p>
        <Flow items={WHAT_IS.flow} label="署名の流れ" />
        <ul className="pc-points sg-points">
          {WHAT_IS.points.map((p) => (
            <li key={p.text}>
              <Icon name={p.icon} />
              <span>
                {p.text}
                {p.link && (
                  <>
                    {' '}
                    <JumpLink path={PATH} id={p.link.to}>
                      {p.link.label}
                    </JumpLink>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Part>

      {/* ② やってみよう：A 賛同する／B 立ち上げる */}
      <Part part={SIGNATURE_PARTS[1]}>
        <Track id="join" mark="A" title={ENTRY[0].title} other={{ id: 'start', label: 'B 立ち上げたい人はこちら' }}>
          <ol className="steps pc-steps">
            {JOIN_STEPS.map((s) => (
              <Step key={s.no} s={s} onUse={pickPrompt} />
            ))}
          </ol>
        </Track>
        <Track id="start" mark="B" title={ENTRY[1].title} other={{ id: 'join', label: 'A 賛同したい人はこちら' }}>
          <ol className="steps pc-steps">
            {START_STEPS.map((s) => (
              <Step key={s.no} s={s} onUse={pickPrompt} />
            ))}
          </ol>
        </Track>
      </Part>

      {/* ③ もっと詳しく */}
      <Part part={SIGNATURE_PARTS[2]}>
        <section className="pc-sub" id="template" aria-labelledby="template-h" tabIndex={-1}>
          <h3 id="template-h" className="pc-sub-title">
            {SIGNATURE_TEMPLATE.title}
          </h3>
          <figure className="sample pc-template" aria-labelledby="template-h">
            <div className="pt-doc sg-doc">
              {SIGNATURE_TEMPLATE.sections.map((s) => (
                <div key={s.head}>
                  <p className="pt-doc-head">【{s.head}】</p>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
            <p className="sample-notes pc-template-note">{SIGNATURE_TEMPLATE.note}</p>
            <CopyButton text={templateText()} label="ひな形をコピー" />
          </figure>
        </section>

        <section className="pc-sub" id="prompts" aria-labelledby="prompts-h" tabIndex={-1}>
          <h3 id="prompts-h" className="pc-sub-title">
            AIに頼んでみよう
          </h3>
          <p className="pc-lead">やりたいことを選んで、指示文をコピー！</p>
          <p className="pc-step-note">{PROMPT_LEAD}</p>
          <PromptPicker prompts={SIGNATURE_PROMPTS} value={promptId} onChange={setPromptId} />
          <ul className="pc-points">
            {PROMPT_NOTES.map((t) => (
              <li key={t}>
                <Icon name="check" />
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section className="pc-sub" id="sites" aria-labelledby="sites-h" tabIndex={-1}>
          <h3 id="sites-h" className="pc-sub-title">
            {SITES.title}
          </h3>
          <p className="pc-step-note">{SITES.lead}</p>
          <ul className="pt-cards sg-sites">
            {SITES.cards.map((c) => (
              <li key={c.name} className="pt-card">
                <p className="pt-card-head">
                  <b>{c.name}</b>
                </p>
                <dl className="sg-rows">
                  {c.rows.map((r) => (
                    <div key={r.label}>
                      <dt>{r.label}</dt>
                      <dd>{r.text}</dd>
                    </div>
                  ))}
                </dl>
                <p className="step-more">
                  <SmartLink to={c.url} className="btn btn-secondary btn-small">
                    {c.name}を開く
                  </SmartLink>
                </p>
              </li>
            ))}
          </ul>
          <p className="muted">{SITES.checked}</p>
        </section>

        <section className="pc-sub" id="kinds" aria-labelledby="kinds-h" tabIndex={-1}>
          <h3 id="kinds-h" className="pc-sub-title">
            {KINDS.title}
          </h3>
          <ul className="pt-cards sg-kinds">
            {KINDS.cards.map((c) => (
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
          <p className="step-more">
            <SmartLink to={LINKS.petitionGuide} className="btn btn-secondary btn-small">
              <Icon name="petition" />
              請願・陳情の書き方
            </SmartLink>
          </p>
          <Sources links={KINDS.links} />
        </section>

        <section className="pc-sub" id="faq" aria-labelledby="faq-h" tabIndex={-1}>
          <h3 id="faq-h" className="pc-sub-title">
            よくある疑問
          </h3>
          {FAQ.map((f) => (
            <details className="fold" key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
          <details className="fold">
            <summary>このページの出典（公式の案内）</summary>
            <p className="muted">{SOURCES.checked}</p>
            <Sources links={SOURCES.links} />
          </details>
        </section>
      </Part>

      {/* ④ 署名する・公開する */}
      <Part part={SIGNATURE_PARTS[3]}>
        <p className="muted">チェックはこの画面の中だけで、保存や送信はされません。チェックしなくても先へ進めます。</p>
        <div className="sg-checks">
          <section className="pc-sub" id="check-join" aria-labelledby="check-join-h" tabIndex={-1}>
            <h3 id="check-join-h" className="pc-sub-title">
              <span className="sg-mark" aria-hidden="true">
                A
              </span>
              賛同前チェック
            </h3>
            <Checklist title="署名する前に" items={JOIN_CHECKLIST} doneText={JOIN_DONE} meter />
            <p className="step-more">
              <SmartLink to={LINKS.shomei} className="btn btn-primary">
                <Icon name="search" />
                署名を探す（署名掲示板）
              </SmartLink>
            </p>
          </section>
          <section className="pc-sub" id="check-start" aria-labelledby="check-start-h" tabIndex={-1}>
            <h3 id="check-start-h" className="pc-sub-title">
              <span className="sg-mark" aria-hidden="true">
                B
              </span>
              公開前チェック
            </h3>
            <Checklist title="公開する前に" items={START_CHECKLIST} doneText={START_DONE} meter />
            <p className="step-more">
              <SmartLink to={LINKS.voiceStart} className="btn btn-primary">
                <Icon name="signature" />
                Voiceで立ち上げる
              </SmartLink>
              <SmartLink to={LINKS.changeStart} className="btn btn-primary">
                <Icon name="signature" />
                Change.orgで立ち上げる
              </SmartLink>
            </p>
          </section>
        </div>

        <section className="pc-sub" aria-labelledby="after-h">
          <h3 id="after-h" className="pc-sub-title">
            公開したあとは
          </h3>
          <ul className="pc-points">
            {AFTER_PUBLISH.map((t) => (
              <li key={t}>
                <Icon name="check" />
                {t}
              </li>
            ))}
          </ul>
        </section>
      </Part>

      <section className="section" aria-labelledby="next-h">
        <h2 id="next-h" className="section-title">
          ほかの届け方
        </h2>
        <ul className="guide-chips">
          {GUIDES.filter((g) => g.slug !== 'signature').map((g) => (
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
      <JumpBar path={PATH} items={BAR} current={area} topRef={topNav} />
    </div>
  );
}

/** 入り口のカードの中の小さな流れ（探す → 確かめる → …） */
function MiniFlow({ steps }: { steps: string[] }) {
  return (
    <span className="sg-mini-flow">
      {steps.map((t, i) => (
        <span key={t}>
          {i > 0 && <Icon name="arrow-right" className="sg-mini-arrow" />}
          <span className="sg-mini-step">{t}</span>
        </span>
      ))}
    </span>
  );
}

/** やってみようの A・B のまとまり。見出しの横に、もう一方へ移るリンク */
function Track({ id, mark, title, other, children }: { id: string; mark: string; title: string; other: { id: string; label: string }; children: React.ReactNode }) {
  return (
    <section className={'sg-track sg-track-' + mark} id={id} aria-labelledby={`${id}-h`} tabIndex={-1}>
      <div className="sg-track-head">
        <h3 id={`${id}-h`}>
          <span className="sg-mark" aria-hidden="true">
            {mark}
          </span>
          {title}
        </h3>
        <JumpLink path={PATH} id={other.id} push className="sg-switch">
          {other.label}
          <Icon name="arrow-right" className="icon-inline" />
        </JumpLink>
      </div>
      {children}
    </section>
  );
}

/** やってみようの1ステップ */
function Step({ s, onUse }: { s: SignatureStep; onUse: (id: SignaturePromptId) => void }) {
  return (
    <li className="step">
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
          <ul className="pc-chips" aria-label={s.title}>
            {s.chips.map((c) => (
              <li key={c}>{c}</li>
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
        {s.howto && (
          <ol className="pt-numbered sg-howto" aria-label={s.title + 'の手順'}>
            {s.howto.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        )}
        {s.example && (
          <p className="sg-example">
            <span className="sg-example-label">入力の例</span>
            <span>{s.example}</span>
          </p>
        )}
        {s.flow && <Flow items={s.flow} label={s.title} />}
        {s.notes?.map((n) => (
          <p className="pc-step-note" key={n}>
            {n}
          </p>
        ))}
        {s.links && (
          <p className="step-more">
            {s.links.map((l) => (
              <StepLink key={l.label} {...l} />
            ))}
          </p>
        )}
        {s.sources && <Sources links={s.sources} />}
        {s.ai && <AiTip tip={s.ai} label={findPrompt(s.ai.prompt).label} onUse={onUse} />}
      </div>
    </li>
  );
}

/** ステップのボタン：https:// は外部、/ はサイト内、それ以外はページ内の見出し */
function StepLink({ label, icon, to, primary }: { label: string; icon: IconName; to: string; primary?: boolean }) {
  const cls = primary ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small';
  if (/^https?:\/\//.test(to) || to.startsWith('/')) {
    return (
      <SmartLink to={to} className={cls}>
        <Icon name={icon} />
        {label}
      </SmartLink>
    );
  }
  return (
    <JumpLink path={PATH} id={to} push className={cls}>
      <Icon name={icon} />
      {label}
    </JumpLink>
  );
}

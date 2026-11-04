// 情報公開請求「行政が持つ文書を、自分で確かめる。」
// 上から順に：① 3分でわかる → ② 請求してみよう → ③ もっと詳しく（必要な人だけ開く） → ④ 提出する・結果を確認する
//   #/guide/disclosure?s=prompts  AIへの指示文の選択から表示
// 文章と指示文は content/disclosureManual.ts にまとめてある。入力欄は作らない（ひな形と指示文はコピーするだけ。氏名・住所などは集めない）。
import { useRef, useState } from 'react';
import { GUIDES, guidePath } from '../content/guides';
import {
  AFTER_FLOW,
  AFTER_FLOW_NOTE,
  AI_NOTES,
  AI_RETURN,
  COMPARE,
  DEFAULT_DISCLOSURE_PROMPT,
  DISCLOSURE_CHECKLIST,
  DISCLOSURE_GUIDE,
  DISCLOSURE_PARTS,
  DISCLOSURE_PROMPTS,
  DURING,
  FIND_EXAMPLE,
  FIND_MORE,
  FIND_POINTS,
  KNOW_MORE,
  KNOW_POINTS,
  KNOW_SOURCES,
  MORE_TOPICS,
  OFFICIAL,
  REQUEST_START_RESULT,
  REQUEST_STARTS,
  REQUEST_TEMPLATE,
  RESULT_NOTE,
  RESULT_SCOPE,
  RESULTS,
  TOKYO_LINK,
  WHAT_IS,
  WHAT_YOU_LEARN,
  WHAT_YOU_LEARN_NOTE,
  WHERE_CHOICES,
  WHERE_TEXT,
  templateText,
  type DisclosurePromptId,
  type DisclosureWhere,
  type RequestStart,
} from '../content/disclosureManual';
import { scrollToSection } from '../lib/dom';
import { loadLastArea } from '../lib/lastArea';
import { useSessionChoice } from '../lib/sessionChoice';
import { href } from '../router';
import type { PubcomFigItem } from '../types';
import { Checklist } from '../components/Checklist';
import { CopyButton } from '../components/CopyButton';
import { Icon } from '../components/Icon';
import { AiTip, Flow, Part, PartBar, PartMenu, Sources } from '../components/GuideParts';
import { JumpLink, PageEndNav } from '../components/Links';
import { PageHead } from '../components/PageHead';
import { PromptPicker } from '../components/PromptPicker';

const PATH = '/guide/disclosure';
const promptLabel = (id: DisclosurePromptId) => DISCLOSURE_PROMPTS.find((p) => p.id === id)?.label ?? '';

export function DisclosureGuidePage() {
  const menuRef = useRef<HTMLElement>(null);
  const [promptId, setPromptId] = useSessionChoice<DisclosurePromptId>('todokeru:prompt:disclosure:v1', DEFAULT_DISCLOSURE_PROMPT, DISCLOSURE_PROMPTS.map((p) => p.id));
  const [start, setStart] = useSessionChoice<RequestStart>('todokeru:disclosure:start:v1', '', ['', 'known', 'unknown']);
  const [where, setWhere] = useSessionChoice<DisclosureWhere>('todokeru:disclosure:where:v1', '', ['', 'national', 'pref', 'muni']);
  // その目的の指示文を選んで、指示文の選択へ移る
  const pickPrompt = (id: DisclosurePromptId) => {
    setPromptId(id);
    requestAnimationFrame(() => scrollToSection('prompts'));
  };

  return (
    <div className="wrap page pubcom-guide disclosure-guide">
      <PageHead title={DISCLOSURE_GUIDE.title} sub={DISCLOSURE_GUIDE.subtitle} />

      <PartMenu path={PATH} parts={DISCLOSURE_PARTS} navRef={menuRef} />

      {/* ① 3分でわかる */}
      <Part part={DISCLOSURE_PARTS[0]}>
        <section className="pc-sub" aria-labelledby="what-h">
          <h3 id="what-h" className="pc-sub-title">
            {WHAT_IS.title}
          </h3>
          <p className="pc-lead">{WHAT_IS.lead}</p>
          <Flow items={WHAT_IS.flow} label="情報公開請求の流れ" />
        </section>

        <section className="pc-sub" aria-labelledby="learn-h">
          <h3 id="learn-h" className="pc-sub-title">
            何がわかる？
          </h3>
          <ul className="pc-facts" aria-label="何がわかる？">
            {WHAT_YOU_LEARN.map((c) => (
              <li key={c.label}>
                <span className="fig-icon" aria-hidden="true">
                  <Icon name={c.icon} />
                </span>
                <span>
                  <b>{c.label}</b>
                  <span>{c.sub}</span>
                  <span>{c.doc}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="pc-step-note">{WHAT_YOU_LEARN_NOTE}</p>
        </section>

        <section className="pc-sub" aria-labelledby="know-h">
          <h3 id="know-h" className="pc-sub-title">
            知っておきたいこと
          </h3>
          <Facts items={KNOW_POINTS} label="知っておきたいこと" />
          <details className="fold" id="know-more">
            <summary>{KNOW_MORE.title}</summary>
            <Facts items={KNOW_MORE.items} label={KNOW_MORE.title} />
            <Sources links={KNOW_SOURCES} />
          </details>
        </section>

        <section className="pc-sub" aria-labelledby="which-h">
          <h3 id="which-h" className="pc-sub-title">
            どちらを使う？
          </h3>
          <ul className="pt-branches" aria-label="どちらを使う？">
            <li>
              <Icon name="chat" className="pt-branch-icon" />
              <span>行政に説明を聞きたい</span>
              <Icon name="arrow-right" className="pt-branch-arrow" />
              <span>
                <b>
                  <a href={href(guidePath('phone'))}>電話</a>・<a href={href(guidePath('email'))}>メール</a>
                </b>
              </span>
            </li>
            <li>
              <Icon name="folder" className="pt-branch-icon" />
              <span>行政が持つ文書を確認したい</span>
              <Icon name="arrow-right" className="pt-branch-arrow" />
              <b>
                <JumpLink path={PATH} id="request">
                  情報公開請求
                </JumpLink>
              </b>
            </li>
          </ul>
        </section>
      </Part>

      {/* ② 請求してみよう */}
      <Part part={DISCLOSURE_PARTS[1]}>
        <section className="pc-sub" id="step1" aria-labelledby="step1-h">
          <StepTitle id="step1-h" no={1} title="何を知りたい？" />
          <fieldset className="pc-prompt-pick">
            <legend>今の状況を選ぶ</legend>
            <div className="stance-chips">
              {REQUEST_STARTS.map((s) => (
                <label key={s.id} className="stance-chip">
                  <input type="radio" name="disclosure-start" value={s.id} checked={start === s.id} onChange={() => setStart(s.id)} />
                  <span>
                    <b className="pc-chip-no" aria-hidden="true">
                      {s.mark}
                    </b>
                    {s.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {start === 'known' && (
            <p className="pc-step-note" role="status">
              {REQUEST_START_RESULT.known}
            </p>
          )}
          {start === 'unknown' && (
            <div role="status">
              <p className="pc-step-note">{REQUEST_START_RESULT.unknown}</p>
              <p>
                <button type="button" className="btn btn-secondary" onClick={() => pickPrompt('find')}>
                  <Icon name="sparkle" />
                  「{promptLabel('find')}」の指示文を使う
                </button>
              </p>
            </div>
          )}
        </section>

        <section className="pc-sub" id="step2" aria-labelledby="step2-h">
          <StepTitle id="step2-h" no={2} title="請求する文書を探す" />
          <Facts items={FIND_POINTS} label="確かめる4つのこと" className="dc-four" />
          <div className="pc-example">
            <span className="pc-example-label">例</span>
            <p>{FIND_EXAMPLE}</p>
          </div>
          <details className="fold" id="find-more">
            <summary>{FIND_MORE.title}</summary>
            <ul className="pt-more">
              {FIND_MORE.items.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p>
              <JumpLink path={PATH} id="more-registry">
                行政文書ファイル管理簿の探し方
              </JumpLink>
            </p>
          </details>
        </section>

        <section className="pc-sub" id="step3" aria-labelledby="step3-h">
          <StepTitle id="step3-h" no={3} title="書き方を確認する" />
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
          <p className="pc-step-note">{COMPARE.unsure}</p>

          <h4 className="mlist-title" id="template-h">
            {REQUEST_TEMPLATE.title}
          </h4>
          <figure className="sample pc-template" aria-labelledby="template-h">
            <dl className="sample-parts">
              {REQUEST_TEMPLATE.parts.map((p) => (
                <div key={p.label}>
                  <dt>{p.label}</dt>
                  <dd>
                    {p.lines.map((l) => (
                      <div key={l}>{l}</div>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
            {REQUEST_TEMPLATE.notes.map((n) => (
              <p className="sample-notes pc-template-note" key={n}>
                {n}
              </p>
            ))}
            <CopyButton text={templateText()} label="ひな形をコピー" />
          </figure>
        </section>

        <section className="pc-sub" id="prompts" aria-labelledby="prompts-h" tabIndex={-1}>
          <StepTitle id="prompts-h" no={4} title="AIに頼んでみよう" />
          <p className="pc-lead">やりたいことを選んで、指示文をコピー！</p>
          <PromptPicker prompts={DISCLOSURE_PROMPTS} value={promptId} onChange={setPromptId} />
          <ul className="pc-points" aria-label="AIを使うときの注意">
            {AI_NOTES.map((t) => (
              <li key={t}>
                <Icon name="alert" />
                {t}
              </li>
            ))}
          </ul>
          <p className="pc-step-note">{AI_RETURN.text}</p>
          <p className="step-more">
            {AI_RETURN.links.map((l) => (
              <JumpLink key={l.id} path={PATH} id={l.id} className="btn btn-secondary btn-small">
                {l.label}
              </JumpLink>
            ))}
          </p>
        </section>
      </Part>

      {/* ③ もっと詳しく */}
      <Part part={DISCLOSURE_PARTS[2]} skipTo={{ path: PATH, part: DISCLOSURE_PARTS[3] }}>
        <div className="chapters pc-research">
          {MORE_TOPICS.map((t) => (
            <details key={t.id} id={t.id} className="chapter">
              <summary>
                <span className="ch-icon" aria-hidden="true">
                  <Icon name={t.icon} />
                </span>
                <span className="ch-head">
                  <h3>
                    <span className="ch-title">{t.title}</span>
                  </h3>
                  <span className="chapter-lead">{t.lead}</span>
                </span>
              </summary>
              <div className="chapter-body">
                <Rows rows={t.rows} />
                {t.links && <Sources links={t.links} />}
                {t.prompt && <AiTip tip={{ text: t.prompt.text, prompt: t.prompt.id }} label={promptLabel(t.prompt.id)} onUse={pickPrompt} />}
              </div>
            </details>
          ))}
        </div>
      </Part>

      {/* ④ 提出する・結果を確認する */}
      <Part part={DISCLOSURE_PARTS[3]}>
        <section className="pc-sub" id="where" aria-labelledby="where-h">
          <h3 id="where-h" className="pc-sub-title">
            提出先を探す
          </h3>
          <fieldset className="pc-prompt-pick">
            <legend>どこに請求しますか？</legend>
            <div className="stance-chips">
              {WHERE_CHOICES.map((c) => (
                <label key={c.id} className="stance-chip">
                  <input type="radio" name="disclosure-where" value={c.id} checked={where === c.id} onChange={() => setWhere(c.id)} />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {where === 'national' && <WhereNational />}
          {(where === 'pref' || where === 'muni') && <WhereLocal kind={where} />}
          {where !== '' && (
            <p className="note">
              <Icon name="info" />
              <span>{WHERE_TEXT.mail}</span>
            </p>
          )}
        </section>

        <section className="pc-sub" id="checklist" aria-labelledby="check-h">
          <h3 id="check-h" className="pc-sub-title">
            提出前チェック
          </h3>
          <p className="muted">チェックはこのタブの中だけに残り、送信はされません。チェックしなくても先へ進めます。</p>
          <Checklist title="提出する前に" items={DISCLOSURE_CHECKLIST} doneText="公式の様式で、提出しましょう。" meter storageKey="todokeru:disclosure:check:v1" />
        </section>

        <section className="pc-sub" id="after" aria-labelledby="after-h">
          <h3 id="after-h" className="pc-sub-title">
            提出したあと
          </h3>
          <Flow items={AFTER_FLOW} label="提出したあとの流れ" />
          <p className="pc-step-note">{AFTER_FLOW_NOTE}</p>
          <h4 className="mlist-title">結果は3種類</h4>
          <Facts items={RESULTS} label="決定の結果" />
          <p className="pc-step-note">{RESULT_SCOPE}</p>
          <p className="note">
            <Icon name="alert" />
            <span>
              {RESULT_NOTE}{' '}
              <JumpLink path={PATH} id="more-appeal">
                審査請求について
              </JumpLink>
            </span>
          </p>
          <details className="fold" id="during">
            <summary>{DURING.title}</summary>
            <Rows rows={DURING.rows} />
            <p className="muted">{DURING.note}</p>
          </details>
        </section>

        <section className="pc-sub" id="next" aria-labelledby="after-next-h">
          <h3 id="after-next-h" className="pc-sub-title">
            次にできること
          </h3>
          <p className="step-more">
            <a className="btn btn-secondary btn-small" href={href(guidePath('phone'))}>
              <Icon name="phone" />
              電話で追加の質問をする
            </a>
            <a className="btn btn-secondary btn-small" href={href(guidePath('email'))}>
              <Icon name="mail" />
              メールで追加の質問をする
            </a>
            <a className="btn btn-secondary btn-small" href={href(guidePath('public-comment'))}>
              <Icon name="comment" />
              パブコメを書く
            </a>
            <a className="btn btn-secondary btn-small" href={href(guidePath('petition'))}>
              <Icon name="petition" />
              請願・陳情を提出する
            </a>
          </p>
        </section>
      </Part>

      <section className="section" aria-labelledby="next-h">
        <h2 id="next-h" className="section-title">
          ほかの届け方
        </h2>
        <ul className="guide-chips">
          {GUIDES.filter((g) => g.slug !== 'disclosure').map((g) => (
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
      <PartBar path={PATH} parts={DISCLOSURE_PARTS} topRef={menuRef} />
    </div>
  );
}

function StepTitle({ id, no, title }: { id: string; no: number; title: string }) {
  return (
    <h3 id={id} className="pc-sub-title">
      <span className="step-no">STEP {no}</span> {title}
    </h3>
  );
}

/** アイコンつきの小さなカード */
function Facts({ items, label, className = '' }: { items: PubcomFigItem[]; label: string; className?: string }) {
  return (
    <ul className={`pc-facts ${className}`.trim()} aria-label={label}>
      {items.map((f) => (
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
  );
}

/** 見出し＋短い説明の並び（折りたたみの中身） */
function Rows({ rows }: { rows: { label: string; text: string }[] }) {
  return (
    <ul className="pc-points">
      {rows.map((r) => (
        <li key={r.label}>
          <Icon name="check" />
          <span>
            <b>{r.label}：</b>
            {r.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** 国の行政機関の請求先：公式の窓口一覧へ */
function WhereNational() {
  return (
    <div>
      <ul className="related-list">
        {[OFFICIAL.windows, OFFICIAL.procedure].map((r) => (
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
      <p className="pc-step-note">
        {WHERE_TEXT.nationalOther}{' '}
        <JumpLink path={PATH} id="more-law">
          制度の違いを見る
        </JumpLink>
      </p>
    </div>
  );
}

/** 都道府県・市区町村の請求先：まず対象の公式サイト。窓口検索は「担当部署を尋ねる先」として案内する（前に見た地域があれば引き継ぐ） */
function WhereLocal({ kind }: { kind: 'pref' | 'muni' }) {
  const [lastArea] = useState(loadLastArea);
  // 都道府県を選んだのに前に見たのが市区町村なら、その市区町村がある都道府県を開く（コードの先頭2けた・名前の最初）
  const area = !lastArea ? null : kind === 'pref' ? { code: lastArea.code.slice(0, 2), name: lastArea.name.split(' ')[0] } : lastArea;
  // 市区町村を選んだのに前に見たのが都道府県なら、まだ市区町村は決まっていない
  const undecided = kind === 'muni' && area !== null && area.code.length === 2;
  const who = area && !undecided ? area.name : kind === 'pref' ? '都道府県' : '市区町村';
  const label = !area ? '全国の窓口を探す' : undecided ? `${area.name}の市区町村から探す` : `${area.name}の連絡先を見る`;
  return (
    <div>
      <p className="pc-step-note">{WHERE_TEXT.localOfficial(who)}</p>
      {kind === 'pref' && area?.code === '13' && <Sources links={[TOKYO_LINK]} />}
      <p className="step-more">
        <a className="btn btn-secondary" href={href('/contacts', area ? { tab: 'area', code: area.code } : { tab: 'area' })}>
          <Icon name="search" />
          {label}
        </a>
      </p>
      {area && (
        <p className="call-target-change">
          <a href={href('/contacts', { tab: 'area' })}>ほかの地域から探す</a>
        </p>
      )}
      <p className="note">
        <Icon name="alert" />
        <span>{WHERE_TEXT.localContact}</span>
      </p>
    </div>
  );
}

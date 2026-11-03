// メール・フォーム・郵送のガイド「メール・フォーム・郵送で届ける」
// 上から順に：はじめての人への案内 → 文面を作る → 送り先 → 送る前に確かめる → 送ったあとの記録 → 詳しいマニュアル（必要な人だけ開く）
// （電話のページと同じ並び）
//   #/guide/email?for=130001-feedback  窓口検索で選んだ窓口を送り先にする
//   #/guide/email?s=ch3                 マニュアルの第3章を開いた状態
// 上部の「文面を作る・送り先を探す・書き方を読む」と、スマホの画面下の小さなメニューで行き来する。
// 「文面を作る」へ戻ると、最後に入力した欄へ戻る（useReturnField）。移動は履歴に残るので、ブラウザの「戻る」でも前の位置へ戻れる
// 目的・内容・送り先は電話の台本と共通（電話の台本を作ったあとに「文章で届けたい」と思っても、書き直さずに済む）
import { useEffect, useRef } from 'react';
import { EMPTY_DRAFT } from '../content/callScript';
import { GUIDES, guidePath } from '../content/guides';
import { MAIL_CHECKLIST, MAIL_GUIDE } from '../content/mailGuide';
import { MAIL_CHAPTERS, MAIL_FLOW } from '../content/mailManual';
import { EMPTY_MAIL, METHODS, buildMail, methodUsable, subjectText } from '../content/mailText';
import { useCallDraft } from '../lib/callDraft';
import { scrollToSection } from '../lib/dom';
import { useMailDraft } from '../lib/mailDraft';
import { useReturnField } from '../lib/returnField';
import { href, type Route } from '../router';
import { CallTargetBox, useTargetFromLink } from '../components/CallTargetBox';
import { Checklist } from '../components/Checklist';
import { Icon } from '../components/Icon';
import { JumpBar, JumpNav, useScrollSpy, type JumpItem } from '../components/JumpNav';
import { JumpLink, PageEndNav } from '../components/Links';
import { MailMaker } from '../components/MailMaker';
import { MailMemo } from '../components/MailMemo';
import { ManualBlocks } from '../components/ManualBlocks';
import { PageHead } from '../components/PageHead';
import { Toc } from '../components/Toc';

const PATH = '/guide/email';

const JUMPS: JumpItem[] = [
  { id: 'maker', icon: 'memo', label: '文面を作る' },
  { id: 'call-target', icon: 'search', label: '送り先を探す' },
  { id: 'manual', icon: 'book', label: '書き方を読む' },
];
// 画面下の小さなメニューは短いことばで。マニュアルを読んでいる間は「目次」へ
const BAR: JumpItem[] = [
  { id: 'maker', icon: 'memo', label: '文面作成' },
  { id: 'call-target', icon: 'search', label: '送り先' },
];
const BAR_MANUAL: JumpItem = { id: 'manual', icon: 'book', label: 'マニュアル' };
const BAR_TOC: JumpItem = { id: 'manual-toc', area: 'manual', icon: 'list', label: '目次' };
// いまどこを見ているか（「送る前に確かめる」と記録の間は、どのボタンにも印を付けない）
const AREAS = ['maker', 'call-target', 'checklist', 'manual'];
const CHAPTER_IDS = MAIL_CHAPTERS.map((c) => c.id);

export function MailGuidePage({ route }: { route: Route }) {
  const [draft, update] = useCallDraft();
  const [mail, updateMail] = useMailDraft();
  // 窓口検索の「この窓口あての文面を作る」から来たとき：選んだ窓口を送り先に入れる（入力中の文面はそのまま）
  const targetState = useTargetFromLink(route.query.get('for'), PATH, update);
  const t = draft.target;
  useReturnField('maker', 'todokeru:mail-return:v1');
  const topNav = useRef<HTMLElement>(null);
  const area = useScrollSpy(AREAS);
  const chapter = useScrollSpy(CHAPTER_IDS);
  const inManual = area === 'manual';

  // 窓口検索の「この窓口あての文面を作る」から来たときは、ページの先頭ではなく文面を作る欄（最後に入力した欄）から
  useEffect(() => {
    if (route.query.get('for')) window.setTimeout(() => scrollToSection('maker'), 0);
    // 来たときだけ（送り先を入れたあと URL から for を消しても動かない）
  }, []);

  // 送り先が変わったら、その窓口で使える届け方にする（メールアドレスがなくフォームだけ、住所だけ、など）
  useEffect(() => {
    if (!t) return;
    updateMail((m) => {
      if (methodUsable(t, m.method)) return {};
      const next = METHODS.find((x) => methodUsable(t, x.id));
      return next ? { method: next.id } : {};
    });
    // 窓口を選び直したときだけ見直す（同じ窓口のまま利用者が選んだ届け方は変えない）
  }, [t?.contactId]);

  const clear = () => {
    if (!window.confirm('入力した内容と文面・記録を消しますか？（電話の台本も同じ内容を使っているので、あわせて消えます）')) return;
    update((d) => ({ ...EMPTY_DRAFT, deepDive: undefined, purpose: d.purpose, target: d.target }));
    updateMail((m) => ({ ...EMPTY_MAIL, method: m.method }));
  };

  const tocItems = [
    ...MAIL_CHAPTERS.map((c) => ({
      id: c.id,
      label: (
        <>
          <span className="toc-no">第{c.no}章</span>
          {c.purpose}
        </>
      ),
    })),
    { id: 'checklist', label: '送る前に確かめたい' },
  ];

  return (
    <div className="wrap page mail-guide">
      {/* 広い画面では題名と案内を横に並べる（電話のページの監修欄と同じ位置） */}
      <div className="phone-head">
        <PageHead title={MAIL_GUIDE.title} sub={MAIL_GUIDE.subtitle} />
        <ManualIntro />
      </div>
      <JumpNav path={PATH} items={JUMPS} current={area} navRef={topNav} />

      <MailMaker draft={draft} update={update} mail={mail} updateMail={updateMail} onClear={clear} />
      <CallTargetBox kind="mail" target={t} state={targetState} />
      {/* 送る直前に見るので、送り先のすぐ下に置く（必要なときだけ開く） */}
      <details className="fold fold-section pre-call" id="checklist">
        <summary>
          <Icon name="check" />
          送る前に確かめる
          <span className="field-opt">{MAIL_CHECKLIST.length}項目</span>
        </summary>
        <div className="pre-call-body">
          <p className="muted">チェックはこのタブの中だけに残り、送信はされません。</p>
          <Checklist title="送る前に" items={MAIL_CHECKLIST} storageKey="todokeru:mail-checklist:v1" />
        </div>
      </details>
      <MailMemo draft={draft} mail={mail} updateMail={updateMail} subject={subjectText(buildMail(draft, mail).subject)} />

      <section className="manual" id="manual" aria-labelledby="manual-h">
        <h2 id="manual-h" className="manual-title">
          <Icon name="book" />
          詳しいマニュアル
        </h2>
        {/* 広い画面では左に目次（スクロールしても見える）、右に本文。本文は読みやすい幅におさえる */}
        <div className="doc-layout">
          <div className="doc-intro">
            <ol className="call-flow" aria-label="文章で届ける流れ">
              {MAIL_FLOW.map((f) => (
                <li key={f.label}>
                  <span className="call-flow-icon" aria-hidden="true">
                    <Icon name={f.icon} />
                  </span>
                  <b>{f.label}</b>
                  <span>{f.sub}</span>
                </li>
              ))}
            </ol>
          </div>

          <aside className="doc-aside" id="manual-toc">
            <Toc path={PATH} items={tocItems} title="目的から探す" className="toc-compact toc-side" current={inManual ? chapter : null} push>
              {/* 広い画面だけ（狭い画面は画面下のメニューから戻る） */}
              <JumpLink path={PATH} id="maker" push className="back-link toc-back">
                <Icon name="arrow-up" />
                文面作成に戻る
              </JumpLink>
            </Toc>
          </aside>

          <div className="doc-body">
            <div className="chapters">
              {MAIL_CHAPTERS.map((c) => (
                <details key={c.id} id={c.id} className="chapter">
                  <summary>
                    <span className="ch-icon" aria-hidden="true">
                      <Icon name={c.icon} />
                    </span>
                    <span className="ch-head">
                      <h3>
                        <span className="ch-no">第{c.no}章</span>
                        <span className="ch-title">{c.title}</span>
                      </h3>
                      {/* 章の要点は、閉じたままでも読めるように見出しの下に出す */}
                      <span className="chapter-lead">{c.lead}</span>
                    </span>
                  </summary>
                  <div className="chapter-body">
                    <ManualBlocks blocks={c.blocks} />
                  </div>
                </details>
              ))}
            </div>

            <section className="section" id="next" aria-labelledby="next-h" tabIndex={-1}>
              <h3 id="next-h" className="section-title">
                ほかの届け方
              </h3>
              <ul className="guide-chips">
                {GUIDES.filter((g) => g.slug !== 'email').map((g) => (
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
          </div>
        </div>
      </section>
      <PageEndNav />
      <JumpBar path={PATH} items={[...BAR, inManual ? BAR_TOC : BAR_MANUAL]} current={area} topRef={topNav} />
    </div>
  );
}

/** はじめて文章で送る人への案内（電話のページの監修欄と同じ形。このマニュアルは監修を受けていないので、監修者の名前は出さない） */
function ManualIntro() {
  return (
    <aside className="supervisor manual-intro" aria-label="はじめて文章で送る人へ">
      <span className="supervisor-icon" aria-hidden="true">
        <Icon name="book" />
      </span>
      <div className="supervisor-text">
        <p className="supervisor-label">はじめて文章で送る人へ</p>
        <p className="supervisor-sub">このマニュアルは当サイトが独自にまとめたもので、監修は受けていません。</p>
      </div>
    </aside>
  );
}

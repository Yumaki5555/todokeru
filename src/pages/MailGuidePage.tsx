// メール・フォーム・郵送のガイド「メール・フォーム・郵送で届ける」
// 上から順に：はじめての人への案内 → 文面を作る → 送り先 → 送る前に確かめる → 送ったあとの記録 → 詳しいマニュアル（必要な人だけ開く）
// （電話のページと同じ並び）
//   #/guide/email?for=130001-feedback  窓口検索で選んだ窓口を送り先にする
//   #/guide/email?s=ch3                 マニュアルの第3章を開いた状態
// 目的・内容・送り先は電話の台本と共通（電話の台本を作ったあとに「文章で届けたい」と思っても、書き直さずに済む）
import { useEffect } from 'react';
import { EMPTY_DRAFT } from '../content/callScript';
import { GUIDES, guidePath } from '../content/guides';
import { MAIL_CHECKLIST, MAIL_GUIDE } from '../content/mailGuide';
import { MAIL_CHAPTERS, MAIL_FLOW } from '../content/mailManual';
import { EMPTY_MAIL, METHODS, buildMail, methodUsable, subjectText } from '../content/mailText';
import { useCallDraft } from '../lib/callDraft';
import { useMailDraft } from '../lib/mailDraft';
import { href, type Route } from '../router';
import { CallTargetBox, useTargetFromLink } from '../components/CallTargetBox';
import { Checklist } from '../components/Checklist';
import { Icon } from '../components/Icon';
import { JumpLink, PageEndNav } from '../components/Links';
import { MailMaker } from '../components/MailMaker';
import { MailMemo } from '../components/MailMemo';
import { ManualBlocks } from '../components/ManualBlocks';
import { PageHead } from '../components/PageHead';
import { Toc } from '../components/Toc';

const PATH = '/guide/email';

export function MailGuidePage({ route }: { route: Route }) {
  const [draft, update] = useCallDraft();
  const [mail, updateMail] = useMailDraft();
  // 窓口検索の「この窓口あての文面を作る」から来たとき：選んだ窓口を送り先に入れる（入力中の文面はそのまま）
  const targetState = useTargetFromLink(route.query.get('for'), PATH, update);
  const t = draft.target;

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
          <p className="muted">チェックはこの画面の中だけで、保存や送信はされません。</p>
          <Checklist title="送る前に" items={MAIL_CHECKLIST} />
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

          <aside className="doc-aside">
            <Toc path={PATH} items={tocItems} title="目的から探す" className="toc-compact toc-side" />
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
      <JumpLink path={PATH} id="manual" className="btn btn-secondary btn-small supervisor-jump">
        <Icon name="book" />
        詳しいマニュアルを読む（全{MAIL_CHAPTERS.length}章）
      </JumpLink>
    </aside>
  );
}

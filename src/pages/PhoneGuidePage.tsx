// 電話ガイド「はじめての行政電話ガイド」
// 上から順に：マニュアル監修 → 電話がこわいときのコツ（必要な人だけ開く） → 台本を作る → 大きな文字で読む → 電話先 → かける前に確かめる → 電話のあとのメモ → 詳しいマニュアル（必要な人だけ開く）
//   #/guide/phone?view=read        大きな文字で読む画面を開いた状態
//   #/guide/phone?for=130001-feedback  窓口検索で選んだ窓口を電話先にする
import { useEffect, useRef } from 'react';
import { PHONE_CHAPTERS, PHONE_CHECKLIST, PHONE_FEAR_TIPS, PHONE_FLOW, PHONE_GUIDE } from '../content/phoneManual';
import { EMPTY_DRAFT, buildScript, helpLines } from '../content/callScript';
import { GUIDES, guidePath } from '../content/guides';
import { useCallDraft } from '../lib/callDraft';
import { clearMailDraft } from '../lib/mailDraft';
import { scrollToSection } from '../lib/dom';
import { href, navigate, type Route } from '../router';
import { CallMemo } from '../components/CallMemo';
import { CallTargetBox, useTargetFromLink } from '../components/CallTargetBox';
import { Checklist } from '../components/Checklist';
import { Icon } from '../components/Icon';
import { PageEndNav } from '../components/Links';
import { ManualBlocks } from '../components/ManualBlocks';
import { PageHead } from '../components/PageHead';
import { ReadAloud } from '../components/ReadAloud';
import { ScriptMaker } from '../components/ScriptMaker';
import { SupervisorNote } from '../components/SupervisorNote';
import { Toc } from '../components/Toc';

const PATH = '/guide/phone';
// 「大きな文字で読む」をこのページのボタンで開いたか（開いたなら、閉じるときは履歴を1つ戻る）
let openedByButton = false;

export function PhoneGuidePage({ route }: { route: Route }) {
  const [draft, update] = useCallDraft();
  const reading = route.query.get('view') === 'read';
  const memoAfterClose = useRef(false);
  // 窓口検索の「この窓口向けに台本を作る」から来たとき：選んだ窓口を電話先に入れる（入力中の台本はそのまま）
  const targetState = useTargetFromLink(route.query.get('for'), PATH, update);

  // 読む画面を閉じたら（ブラウザの「戻る」でも）、頼まれていればメモ欄を開く
  useEffect(() => {
    if (reading) return;
    openedByButton = false;
    if (memoAfterClose.current) {
      memoAfterClose.current = false;
      scrollToSection('memo');
    }
  }, [reading]);

  const openRead = () => {
    openedByButton = true;
    navigate(href(PATH, { view: 'read' }));
  };
  const closeRead = () => {
    if (openedByButton) history.back();
    else navigate(href(PATH), { replace: true });
  };
  const clear = () => {
    if (!window.confirm('入力した台本とメモを消しますか？')) return;
    update((d) => ({ ...EMPTY_DRAFT, deepDive: undefined, purpose: d.purpose, target: d.target }));
    // メールの文面も同じ入力を使うので、名乗りや書き直した文もあわせて消す
    clearMailDraft();
  };

  const tocItems = [
    ...PHONE_CHAPTERS.map((c) => ({
      id: c.id,
      label: (
        <>
          <span className="toc-no">第{c.no}章</span>
          {c.purpose}
        </>
      ),
    })),
    { id: 'checklist', label: 'かける前に確かめたい' },
  ];

  return (
    <div className="wrap page phone-guide">
      {/* 広い画面では題名と監修欄を横に並べる */}
      <div className="phone-head">
        <PageHead title={PHONE_GUIDE.title} sub={PHONE_GUIDE.subtitle} />
        <SupervisorNote path={PATH} manualId="manual" />
      </div>

      {/* 電話が怖くて手が止まる人のために、台本づくりの前に置く（必要なときだけ開く） */}
      <details className="fold fold-section pre-call" id="fear-tips">
        <summary>
          <Icon name="heart" />
          {PHONE_FEAR_TIPS.title}
        </summary>
        <div className="pre-call-body">
          <p className="fear-lead">{PHONE_FEAR_TIPS.lead}</p>
          <ol className="fear-tips">
            {PHONE_FEAR_TIPS.items.map((t) => (
              <li key={t.title}>
                <b>{t.title}</b>
                {t.text}
              </li>
            ))}
          </ol>
          <p className="muted">{PHONE_FEAR_TIPS.credit}</p>
        </div>
      </details>

      <ScriptMaker draft={draft} update={update} onRead={openRead} onClear={clear} />
      <CallTargetBox target={draft.target} state={targetState} />
      {/* かける直前に見るので、電話先のすぐ下に置く（必要なときだけ開く） */}
      <details className="fold fold-section pre-call" id="checklist">
        <summary>
          <Icon name="check" />
          かける前に確かめる
          <span className="field-opt">{PHONE_CHECKLIST.length}項目</span>
        </summary>
        <div className="pre-call-body">
          <p className="muted">チェックはこの画面の中だけで、保存や送信はされません。</p>
          <Checklist title="電話をかける前に" items={PHONE_CHECKLIST} />
        </div>
      </details>
      <CallMemo draft={draft} update={update} />

      <section className="manual" id="manual" aria-labelledby="manual-h">
        <h2 id="manual-h" className="manual-title">
          <Icon name="book" />
          詳しいマニュアル
        </h2>
        {/* 広い画面では左に目次（スクロールしても見える）、右に本文。本文は読みやすい幅におさえる */}
        <div className="doc-layout">
          <div className="doc-intro">
            <ol className="call-flow" aria-label="電話の流れ">
              {PHONE_FLOW.map((f) => (
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
              {PHONE_CHAPTERS.map((c) => (
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
                {GUIDES.filter((g) => g.slug !== 'phone').map((g) => (
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

      <ReadAloud
        open={reading}
        parts={buildScript(draft)}
        help={helpLines(draft)}
        target={draft.target}
        onClose={closeRead}
        onMemo={() => {
          memoAfterClose.current = true;
          closeRead();
        }}
      />
    </div>
  );
}

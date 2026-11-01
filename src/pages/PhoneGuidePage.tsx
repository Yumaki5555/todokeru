// 電話ガイド「はじめての行政電話ガイド」
import { useState } from 'react';
import { BASIC_SCRIPT, PHONE_CHAPTERS, PHONE_CHECKLIST, PHONE_FLOW, PHONE_GUIDE } from '../content/phoneManual';
import { GUIDES, guidePath } from '../content/guides';
import { href } from '../router';
import { Checklist } from '../components/Checklist';
import { CopyScript } from '../components/CopyScript';
import { Icon } from '../components/Icon';
import { PageEndNav } from '../components/Links';
import { ManualBlocks } from '../components/ManualBlocks';
import { PageHead } from '../components/PageHead';
import { SupervisorNote } from '../components/SupervisorNote';
import { Toc } from '../components/Toc';

const PATH = '/guide/phone';
// 最初に開いておく章（第0章・第1章）
const INITIAL_OPEN = PHONE_CHAPTERS.map((c) => c.no <= 1);

export function PhoneGuidePage() {
  const [open, setOpen] = useState<boolean[]>(INITIAL_OPEN);
  const setAll = (v: boolean) => setOpen(PHONE_CHAPTERS.map(() => v));

  const tocItems = [
    ...PHONE_CHAPTERS.map((c) => ({
      id: c.id,
      label: (
        <>
          <span className="toc-no">第{c.no}章</span>
          {c.title}
        </>
      ),
    })),
    { id: 'checklist', label: '電話前チェックリスト' },
    { id: 'next', label: '次の一歩' },
  ];

  return (
    <div className="wrap page phone-guide">
      <PageHead title={PHONE_GUIDE.title} sub={PHONE_GUIDE.subtitle} />
      {/* 広い画面では左に目次（スクロールしても見える）、右に本文。本文は読みやすい幅におさえる */}
      <div className="doc-layout">
        <div className="doc-intro">
          <SupervisorNote place="top" />
          <p className="lead">{PHONE_GUIDE.lead}</p>

          <CopyScript script={BASIC_SCRIPT} large />

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
          <Toc path={PATH} items={tocItems} className="toc-compact toc-side">
            <div className="toc-actions">
              <button type="button" className="btn btn-secondary btn-small" onClick={() => setAll(true)}>
                すべての章を開く
              </button>
              <button type="button" className="btn btn-secondary btn-small" onClick={() => setAll(false)}>
                すべての章を閉じる
              </button>
            </div>
          </Toc>
        </aside>

        <div className="doc-body">
          <div className="chapters">
            {PHONE_CHAPTERS.map((c, i) => (
              <details
                key={c.id}
                id={c.id}
                className="chapter"
                open={open[i]}
                onToggle={(e) => {
                  const v = e.currentTarget.open;
                  setOpen((prev) => (prev[i] === v ? prev : prev.map((x, j) => (j === i ? v : x))));
                }}
              >
                <summary>
                  <span className="ch-icon" aria-hidden="true">
                    <Icon name={c.icon} />
                  </span>
                  <span className="ch-head">
                    <h2>
                      <span className="ch-no">第{c.no}章</span>
                      <span className="ch-title">{c.title}</span>
                    </h2>
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

          <section className="section" id="checklist" aria-labelledby="checklist-h" tabIndex={-1}>
            <h2 id="checklist-h" className="section-title">
              電話前チェックリスト
            </h2>
            <p className="muted">チェックはこの画面の中だけで、保存や送信はされません。</p>
            <Checklist title="電話をかける前に" items={PHONE_CHECKLIST} />
          </section>

          <section className="section" id="next" aria-labelledby="next-h" tabIndex={-1}>
            <h2 id="next-h" className="section-title">
              次の一歩
            </h2>
            <p>
              <a className="btn btn-primary" href={href('/contacts')}>
                <Icon name="search" />
                全国の窓口を探す
              </a>
            </p>
            <p className="muted">連絡先は、公式サイトで確かめてからかけてください。</p>
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

          <SupervisorNote place="bottom" />
        </div>
      </div>
      <PageEndNav />
    </div>
  );
}

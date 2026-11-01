// 電話マニュアルの監修者表示（このガイドだけに表示する。サイト全体の監修ではない）
// 表記は site.ts の SUPERVISION.status で切りかわる。
import { SITE, SUPERVISION, formatDate } from '../site';

function XLink() {
  return (
    <a href={SUPERVISION.xUrl}>
      {SUPERVISION.name}
      <span className="sr-only">（Xのアカウント {SUPERVISION.xHandle}、外部サイト）</span>
      <span aria-hidden="true">（X {SUPERVISION.xHandle}）</span>
    </a>
  );
}

export function SupervisorNote({ place, supervision = SUPERVISION }: { place: 'top' | 'bottom'; supervision?: typeof SUPERVISION }) {
  const s = supervision;
  return (
    <aside className={'supervisor supervisor-' + place} aria-label="このガイドの監修について">
      {s.status === 'confirmed' && (
        <>
          <p className="supervisor-main">
            マニュアル監修：<XLink />
          </p>
          {place === 'bottom' && (
            <p className="supervisor-sub">
              監修は、この「はじめての行政電話ガイド」についてのものです。{SITE.name}のほかのページは監修の対象ではありません。
              {s.confirmedAt ? `（監修の確認日：${formatDate(s.confirmedAt)}）` : ''}
            </p>
          )}
        </>
      )}
      {s.status === 'pending' && (
        <>
          <p className="supervisor-main">
            マニュアル監修：<XLink />
            <span className="badge badge-muted">監修確認中</span>
          </p>
          <p className="supervisor-sub">
            このガイドは、{s.name}の投稿にある考え方を尊重して、当サイトが独自の文章でまとめたものです。監修の確認が済むまでは「監修確認中」と表示します。
            {place === 'bottom' && `監修は、このガイドについてのものです。${SITE.name}のほかのページは監修の対象ではありません。`}
          </p>
        </>
      )}
      {s.status === 'none' && (
        <p className="supervisor-main">
          このガイドは、<XLink />の投稿にある考え方を参考に、当サイトが独自の文章でまとめたものです（監修は受けていません）。
        </p>
      )}
    </aside>
  );
}

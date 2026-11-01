// 電話マニュアルの監修者表示。ページの見出しのすぐ下に1か所だけ出す。
// 表記は site.ts の SUPERVISION.status で切りかわる。
import { SUPERVISION } from '../site';
import { Icon } from './Icon';
import { JumpLink } from './Links';

function XLink() {
  return (
    <a href={SUPERVISION.xUrl}>
      {SUPERVISION.name}
      <span className="sr-only">（Xのアカウント {SUPERVISION.xHandle}、外部サイト）</span>
      <span className="supervisor-handle" aria-hidden="true">
        （X {SUPERVISION.xHandle}）
      </span>
    </a>
  );
}

/** path・manualId：「詳しいマニュアル」ボタンの飛び先 */
export function SupervisorNote({
  path,
  manualId,
  supervision = SUPERVISION,
}: {
  path: string;
  manualId: string;
  supervision?: typeof SUPERVISION;
}) {
  const s = supervision;
  return (
    <aside className="supervisor" aria-label="このガイドの監修について">
      <span className="supervisor-icon" aria-hidden="true">
        <Icon name={s.status === 'confirmed' ? 'check' : 'book'} />
      </span>
      <div className="supervisor-text">
        {s.status === 'none' ? (
          <p className="supervisor-sub">
            このマニュアルは、<XLink />の投稿にある考え方を参考に、当サイトが独自の文章でまとめたものです（監修は受けていません）。
          </p>
        ) : (
          <>
            <p className="supervisor-label">
              マニュアル監修
              {s.status === 'pending' && <span className="badge badge-muted">監修確認中</span>}
            </p>
            <p className="supervisor-name">
              <XLink />
            </p>
            {s.status === 'pending' && (
              <p className="supervisor-sub">
                このマニュアルは、{s.name}の投稿にある考え方を尊重して、当サイトが独自の文章でまとめたものです。監修の確認が済むまでは「監修確認中」と表示します。
              </p>
            )}
          </>
        )}
      </div>
      <JumpLink path={path} id={manualId} className="btn btn-secondary btn-small supervisor-jump">
        <Icon name="book" />
        詳しいマニュアル
      </JumpLink>
    </aside>
  );
}

// 詳細ページの見出し（トップへは、すぐ上のヘッダーから戻れるので、ここには戻るリンクを置かない）
import type { ReactNode } from 'react';

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="page-head">
      <h1 id="page-top" tabIndex={-1}>
        {title}
      </h1>
      {sub && <p className="page-sub">{sub}</p>}
      {children}
    </div>
  );
}

// 詳細ページの見出し（上に「声を届ける。トップへ戻る」）
import type { ReactNode } from 'react';
import { BackToSiteTop } from './Links';

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="page-head">
      <BackToSiteTop className="page-head-back" />
      <h1 id="page-top" tabIndex={-1}>
        {title}
      </h1>
      {sub && <p className="page-sub">{sub}</p>}
      {children}
    </div>
  );
}

// ページ内目次
import type { ReactNode } from 'react';
import { JumpLink } from './Links';

export interface TocItem {
  id: string;
  label: ReactNode;
}

export function Toc({
  path,
  items,
  title = 'このページの内容',
  className,
  children,
}: {
  path: string;
  items: TocItem[];
  title?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <nav className={'toc' + (className ? ' ' + className : '')} aria-label={title}>
      <p className="toc-title">{title}</p>
      <ol>
        {items.map((it) => (
          <li key={it.id}>
            <JumpLink path={path} id={it.id}>
              {it.label}
            </JumpLink>
          </li>
        ))}
      </ol>
      {children}
    </nav>
  );
}

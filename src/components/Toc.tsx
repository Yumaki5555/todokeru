// ページ内目次
// current：いま読んでいる見出し（印を付ける）　push：移動を履歴に残す（「戻る」で前の位置へ）
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
  current,
  push,
  children,
}: {
  path: string;
  items: TocItem[];
  title?: string;
  className?: string;
  current?: string | null;
  push?: boolean;
  children?: ReactNode;
}) {
  return (
    <nav className={'toc' + (className ? ' ' + className : '')} aria-label={title}>
      <p className="toc-title">{title}</p>
      <ol>
        {items.map((it) => (
          <li key={it.id}>
            <JumpLink path={path} id={it.id} push={push} current={it.id === current}>
              {it.label}
            </JumpLink>
          </li>
        ))}
      </ol>
      {children}
    </nav>
  );
}

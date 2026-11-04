// ナビゲーション（どのページからでも主なページへ移動できる）
import { scrollToPageTop, scrollToSection } from '../lib/dom';
import { href, sectionHref } from '../router';
import { Icon } from './Icon';

// section があるものはトップの中の見出しへのリンク（「声の届け方」から6つのガイドを、「AI活用ガイド」から各ページのAIへの指示文を選べる）
// label の「/」は、狭い画面で2行にするときの区切り
export const NAV_ITEMS: { path: string; label: string; section?: string; accent?: boolean }[] = [
  { path: '/', label: 'トップ' },
  { path: '/', section: 'methods', label: '声の/届け方' },
  { path: '/contacts', label: '窓口を/探す' },
  { path: '/', section: 'ai', label: 'AI活用/ガイド', accent: true },
  { path: '/about', label: 'サイト/について' },
];

export function GlobalNav({ path }: { path: string }) {
  return (
    <nav className="global-nav" aria-label="サイト内の主なページ">
      <ul>
        {NAV_ITEMS.map((n) => {
          const to = n.section ? sectionHref(n.path, n.section) : href(n.path);
          // 各ガイドのページでは「声の届け方」に現在地の印を出す
          const current = n.section ? n.section === 'methods' && path.startsWith('/guide/') : path === n.path;
          return (
            <li key={n.label}>
              <a
                className={n.accent ? 'nav-accent' : undefined}
                href={to}
                aria-label={n.label.replace('/', '')} // 2行に分けて表示しても、読み上げでは1つの名前にする
                aria-current={current ? 'page' : undefined}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // 新しいタブで開く操作はそのまま
                  // すでにそのページにいるとき（トップの中で「トップ」を押したときなど）は画面の切り替えが起きないので、ここで移動する
                  if (n.section) {
                    if (window.location.hash === to) scrollToSection(n.section);
                  } else if (path === n.path) {
                    scrollToPageTop();
                  }
                }}
              >
                {n.accent && <Icon name="sparkle" />}
                <span className="nav-label">
                  {n.label.split('/').map((part) => (
                    <span key={part}>{part}</span>
                  ))}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

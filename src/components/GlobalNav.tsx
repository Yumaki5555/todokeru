// ナビゲーション（どのページからでも主なページへ移動できる）
import { href, sectionHref } from '../router';

// section があるものはトップの中の見出しへのリンク（「すべての方法」から6つのガイドを選べる）
export const NAV_ITEMS: { path: string; label: string; section?: string }[] = [
  { path: '/', label: 'トップ' },
  { path: '/', section: 'methods', label: 'すべての方法' },
  { path: '/guide/phone', label: '電話のかけ方' },
  { path: '/guide/email', label: 'メール・手紙' },
  { path: '/contacts', label: '窓口を探す' },
  { path: '/about', label: 'このサイトについて' },
];

export function GlobalNav({ path }: { path: string }) {
  return (
    <nav className="global-nav" aria-label="サイト内の主なページ">
      <ul>
        {NAV_ITEMS.map((n) => (
          <li key={n.label}>
            <a href={n.section ? sectionHref(n.path, n.section) : href(n.path)} aria-current={!n.section && path === n.path ? 'page' : undefined}>
              {n.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

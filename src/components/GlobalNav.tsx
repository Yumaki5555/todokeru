// ナビゲーション（どのページからでも主なページへ移動できる）
import { href } from '../router';

export const NAV_ITEMS = [
  { path: '/', label: 'トップ' },
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
          <li key={n.path}>
            <a href={href(n.path)} aria-current={path === n.path ? 'page' : undefined}>
              {n.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// サイト全体の枠（ヘッダー・本文・フッター）と、URL に応じたページの切り替え
import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import { findGuide } from './content/guides';
import { parseHash, useHash, type Route } from './router';
import { scrollToSection } from './lib/dom';
import { SITE } from './site';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import { AboutPage } from './pages/AboutPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { ContactsPage } from './pages/ContactsPage';
import { HomePage } from './pages/HomePage';
import { MailGuidePage } from './pages/MailGuidePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PhoneGuidePage } from './pages/PhoneGuidePage';

/** URL のパスから、表示するページと題名を決める */
export function resolvePage(route: Route): { title: string | null; element: ReactElement } {
  const { path } = route;
  if (path === '/') return { title: null, element: <HomePage /> };
  if (path === '/guide/phone') return { title: 'はじめての行政電話ガイド', element: <PhoneGuidePage route={route} /> };
  if (path === '/guide/email') return { title: 'メール・フォーム・郵送で届ける', element: <MailGuidePage route={route} /> };
  if (path === '/contacts') return { title: '全国の窓口を探す', element: <ContactsPage route={route} /> };
  if (path === '/about') return { title: 'このサイトについて', element: <AboutPage /> };
  const m = /^\/guide\/([a-z-]+)$/.exec(path);
  const guide = m ? findGuide(m[1]) : undefined;
  if (guide && guide.status === 'coming') return { title: `${guide.title}（準備中）`, element: <ComingSoonPage guide={guide} /> };
  return { title: 'ページが見つかりません', element: <NotFoundPage /> };
}

export function App() {
  const hash = useHash();
  const route = useMemo(() => parseHash(hash), [hash]);
  const page = resolvePage(route);
  const prevPath = useRef<string | null>(null);
  const section = route.query.get('s');

  useEffect(() => {
    document.title = page.title ? `${page.title}｜${SITE.name}` : `${SITE.name}｜${SITE.catchCopy}`;
  }, [page.title]);

  // ページが変わったら先頭から表示し、キーボード操作の位置をページの見出しへ移す
  useEffect(() => {
    const first = prevPath.current === null;
    const changed = prevPath.current !== route.path;
    prevPath.current = route.path;
    if (section) {
      // #/guide/phone?s=ch3 のように見出しの指定があれば、その見出しへ
      requestAnimationFrame(() => scrollToSection(section));
      return;
    }
    if (changed && !first) {
      window.scrollTo(0, 0);
      document.getElementById('page-top')?.focus({ preventScroll: true });
    }
  }, [route.path, section]);

  return (
    <>
      <SiteHeader path={route.path} />
      <main id="main" tabIndex={-1}>
        {page.element}
      </main>
      <SiteFooter />
    </>
  );
}

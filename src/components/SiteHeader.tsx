// 共通ヘッダー：いちばん上に全サイト共通メニュー、その下にサイト名とナビゲーション
import { createElement } from 'react';
import { href } from '../router';
import { SITE } from '../site';
import { GlobalNav } from './GlobalNav';

export function SiteHeader({ path }: { path: string }) {
  const isHome = path === '/';
  return (
    <header className="site-header">
      <a className="skip-link" href="#main" onClick={(e) => {
        e.preventDefault();
        document.getElementById('main')?.focus();
      }}>
        本文へ移動
      </a>
      {/* 全サイト共通メニュー。部品（shared/site-nav.js）が読み込めなかったときだけ、中のリンクがそのまま見える */}
      {createElement(
        'nihon-site-nav',
        null,
        <div className="portal-bar">
          <div className="wrap portal-bar-in">
            <a className="portal-link" href={SITE.portal.url}>
              <b>{SITE.portal.label}</b>トップへ戻る
            </a>
          </div>
        </div>,
      )}
      <div className="site-bar">
        <div className="wrap site-bar-in">
          {/* トップページでは大きな題名と同じ文字が2つ並ばないよう、小さなサイト名は出さない */}
          {!isHome && (
            <a className="site-logo" href={href('/')}>
              {SITE.name}
            </a>
          )}
          <GlobalNav path={path} />
        </div>
      </div>
    </header>
  );
}

// 準備中ページ・サイトについて・見つからないページ・ナビゲーション
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { App, resolvePage } from '../src/App';
import { GUIDES } from '../src/content/guides';
import { NAV_ITEMS } from '../src/components/GlobalNav';
import { parseHash } from '../src/router';

function open(hash: string) {
  window.location.hash = hash;
  return render(<App />);
}

describe('準備中のガイド', () => {
  for (const g of GUIDES.filter((x) => x.status === 'coming')) {
    it(`${g.title}（#/guide/${g.slug}）は準備中と、予定している内容を出す`, () => {
      open(`#/guide/${g.slug}`);
      expect(screen.getByRole('heading', { level: 1, name: g.title })).toBeInTheDocument();
      expect(screen.getByText('準備中')).toBeInTheDocument();
      const plan = screen.getByRole('heading', { name: 'このページで案内する予定の内容' }).nextElementSibling!;
      expect(within(plan as HTMLElement).getAllByRole('listitem')).toHaveLength(g.plannedTopics.length);
      expect(screen.getAllByRole('link', { name: '声を届ける。トップへ戻る' })[0]).toHaveAttribute('href', '#/');
      expect(document.title).toBe(`${g.title}（準備中）｜声を届ける。`);
    });
  }

  it('パブコメのガイドからパブコメ掲示板へ行ける', () => {
    open('#/guide/public-comment');
    expect(screen.getAllByRole('link', { name: /パブコメ掲示板/ })[0]).toHaveAttribute('href', 'https://yumaki5555.github.io/pubcome/');
  });

  it('署名のガイドから署名掲示板へ行ける', () => {
    open('#/guide/signature');
    expect(screen.getAllByRole('link', { name: /署名掲示板/ })[0]).toHaveAttribute('href', 'https://yumaki5555.github.io/shomei/');
  });
});

describe('このサイトについて', () => {
  it('目的・運営・出典・注意・個人情報・監修・免責・最終更新日がある', () => {
    open('#/about');
    for (const t of ['サイトの目的', '運営について', '情報の出典', '利用上の注意', '個人情報とプライバシー', '電話ガイドの監修について', '免責事項']) {
      expect(screen.getByRole('heading', { level: 2, name: t })).toBeInTheDocument();
    }
    expect(within(screen.getByRole('main')).getByText(/最終更新日：2026年11月4日/)).toBeInTheDocument();
    expect(screen.getByText(/アクセス解析や、外部のトラッキング（閲覧の追跡）は使っていません/)).toBeInTheDocument();
    expect(screen.getByText(/監修は電話ガイドについてのものであり、このサイト全体の監修ではありません/)).toBeInTheDocument();
  });
});

describe('ナビゲーション', () => {
  it('ナビゲーションのリンク先は、すべて実在するページ', () => {
    for (const n of NAV_ITEMS) expect(resolvePage(parseHash('#' + n.path)).title).not.toBe('ページが見つかりません');
    for (const g of GUIDES) expect(resolvePage(parseHash(`#/guide/${g.slug}`)).title).not.toBe('ページが見つかりません');
  });

  it('いまいるページに印が付く', () => {
    open('#/contacts');
    const nav = screen.getByRole('navigation', { name: 'サイト内の主なページ' });
    expect(within(nav).getByRole('link', { name: '窓口を探す' })).toHaveAttribute('aria-current', 'page');
  });

  it('知らないページは「ページが見つかりません」とトップへのリンクを出す', () => {
    open('#/nothing');
    expect(screen.getByRole('heading', { level: 1, name: 'ページが見つかりません' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '声を届ける。トップへ戻る' })[0]).toHaveAttribute('href', '#/');
  });

  it('詳細ページでは小さなサイト名からトップへ戻れる', () => {
    open('#/about');
    expect(screen.getByRole('link', { name: '声を届ける。' })).toHaveAttribute('href', '#/');
  });
});

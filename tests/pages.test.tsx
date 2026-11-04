// 準備中ページ・サイトについて・見つからないページ・ナビゲーション
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
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

  it('情報公開請求は、問い合わせとの違いを先に伝え、電話・メールのガイドへ行ける', () => {
    open('#/guide/disclosure');
    const first = screen.getByRole('heading', { name: '先に知っておきたいこと' }).nextElementSibling as HTMLElement;
    expect(within(first).getAllByRole('listitem')).toHaveLength(2);
    expect(first).toHaveTextContent('電話やメールで尋ねる');
    expect(screen.getByRole('link', { name: 'はじめての行政電話ガイド' })).toHaveAttribute('href', '#/guide/phone');
    expect(screen.getByRole('link', { name: 'メール・フォーム・郵送で届ける' })).toHaveAttribute('href', '#/guide/email');
  });

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

  it('上部メニューは5項目：トップ｜声の届け方｜窓口を探す｜AI活用ガイド｜サイトについて', () => {
    open('#/about');
    const nav = screen.getByRole('navigation', { name: 'サイト内の主なページ' });
    expect(within(nav).getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['トップ', '#/'],
      ['声の届け方', '#/?s=methods'],
      ['窓口を探す', '#/contacts'],
      ['AI活用ガイド', '#/?s=ai'],
      ['サイトについて', '#/about'],
    ]);
  });

  it('どのページからも「声の届け方」（トップの6つのガイド）へ行け、ガイドのページでは印が付く。トップでも印は「トップ」だけ', () => {
    open('#/guide/petition');
    let nav = screen.getByRole('navigation', { name: 'サイト内の主なページ' });
    expect(within(nav).getByRole('link', { name: '声の届け方' })).toHaveAttribute('href', '#/?s=methods');
    expect(within(nav).getByRole('link', { name: '声の届け方' })).toHaveAttribute('aria-current', 'page');
    open('#/');
    nav = screen.getAllByRole('navigation', { name: 'サイト内の主なページ' }).at(-1)!;
    expect(within(nav).getByRole('link', { name: '声の届け方' })).not.toHaveAttribute('aria-current');
    expect(within(nav).getByRole('link', { name: 'AI活用ガイド' })).not.toHaveAttribute('aria-current');
    expect(within(nav).getByRole('link', { name: 'トップ' })).toHaveAttribute('aria-current', 'page');
  });

  it('すでにその場所にいても、押すと移動する（AI活用ガイド→AIの枠、トップ→ページの先頭）', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    open('#/?s=ai');
    const nav = screen.getByRole('navigation', { name: 'サイト内の主なページ' });
    const box = document.getElementById('ai')!;
    box.scrollIntoView = vi.fn();
    fireEvent.click(within(nav).getByRole('link', { name: 'AI活用ガイド' }));
    expect(box.scrollIntoView).toHaveBeenCalledTimes(1);
    fireEvent.click(within(nav).getByRole('link', { name: 'トップ' }));
    expect(scrollTo).toHaveBeenCalled();
    scrollTo.mockRestore();
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

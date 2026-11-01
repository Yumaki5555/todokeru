// トップページ
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';

describe('トップページ', () => {
  it('サイト名・キャッチコピー・説明文が出る', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: '声を届ける。' })).toBeInTheDocument();
    expect(screen.getByText('知ることから、行動へ。')).toBeInTheDocument();
    expect(screen.getByText(/電話、メール、パブコメ、請願・陳情。自分に合った方法を知り/)).toBeInTheDocument();
    expect(screen.getByText('疑問に思ったこと、伝えたいこと。その声を適切な窓口へ届けるために。')).toBeInTheDocument();
  });

  it('いちばん上に「日本を知る。トップへ戻る」（同じタブで開く）', () => {
    render(<App />);
    const link = screen.getByRole('link', { name: '日本を知る。トップへ戻る' });
    expect(link).toHaveAttribute('href', 'https://yumaki5555.github.io/');
    expect(link).not.toHaveAttribute('target');
  });

  it('「初めての方はこちら｜まず3分でわかる」で同じページの解説へ移動する', async () => {
    render(<App />);
    const gate = screen.getByRole('link', { name: /初めての方はこちら\s*まず3分でわかる/ });
    await userEvent.click(gate);
    const sanpun = document.getElementById('sanpun')!;
    expect(sanpun.scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(sanpun);
    expect(window.location.hash).toBe(''); // URL は変えない
  });

  it('「まず3分でわかる」に5つのSTEPがある', () => {
    render(<App />);
    const sec = document.getElementById('sanpun')!;
    const titles = within(sec).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual([
      'STEP 1声を届ける方法を知る',
      'STEP 2まずは質問や意見を伝える',
      'STEP 3制度について意見を出す',
      'STEP 4議会に届ける',
      'STEP 5自分に合った方法を選ぶ',
    ]);
  });

  it('6つのメニュー：電話は公開中、ほかは準備中', () => {
    render(<App />);
    const sec = document.getElementById('methods')!;
    const cards = within(sec).getAllByRole('listitem');
    expect(cards).toHaveLength(6);
    expect(within(cards[0]).getByRole('link', { name: '電話のかけ方' })).toHaveAttribute('href', '#/guide/phone');
    expect(within(cards[0]).getByText('公開中')).toBeInTheDocument();
    expect(within(sec).getAllByText('準備中')).toHaveLength(5);
    expect(within(sec).getByRole('link', { name: 'パブコメの書き方' })).toHaveAttribute('href', '#/guide/public-comment');
  });

  it('パブコメ掲示板・署名掲示板へすぐ移動できる', () => {
    render(<App />);
    const pub = screen.getAllByRole('link', { name: /パブコメ掲示板/ });
    const sho = screen.getAllByRole('link', { name: /署名掲示板/ });
    expect(pub.every((a) => a.getAttribute('href') === 'https://yumaki5555.github.io/pubcome/')).toBe(true);
    expect(sho.every((a) => a.getAttribute('href') === 'https://yumaki5555.github.io/shomei/')).toBe(true);
  });

  it('窓口検索への案内に、登録数と確認済み窓口数を別々に出す', async () => {
    render(<App />);
    expect(await screen.findByText(/公式確認済みの窓口：0件/)).toBeInTheDocument();
    expect(screen.getByText(/市区町村 1,741/)).toBeInTheDocument();
    const sec = document.getElementById('contacts')!;
    expect(within(sec).getByRole('link', { name: '窓口を探す' })).toHaveAttribute('href', '#/contacts');
  });

  it('このサイトについて：民間運営・公式でない・最終更新日', () => {
    render(<App />);
    const sec = document.getElementById('about')!;
    expect(within(sec).getByText(/民間が運営しています。国・自治体・議会の公式サイトではありません/)).toBeInTheDocument();
    expect(within(sec).getByText(/最終更新日：2026年11月1日/)).toBeInTheDocument();
  });

  it('トップでは小さなサイト名を出さない（大きな題名と重ならない）', () => {
    render(<App />);
    expect(screen.getAllByText('声を届ける。')).toHaveLength(2); // 題名とフッター
  });
});

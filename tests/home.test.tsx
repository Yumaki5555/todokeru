// トップページ
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import { GUIDES } from '../src/content/guides';
import { THREE_MINUTE_STEPS } from '../src/content/threeMinutes';

describe('トップページ', () => {
  it('サイト名・キャッチコピーが出る（長い説明文はトップに出さない）', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: '声を届ける。' })).toBeInTheDocument();
    expect(screen.getByText('知ることから、行動へ。')).toBeInTheDocument();
    expect(screen.queryByText(/電話、メール、パブコメ、請願・陳情。自分に合った方法を知り/)).not.toBeInTheDocument();
    expect(screen.queryByText('疑問に思ったこと、伝えたいこと。その声を適切な窓口へ届けるために。')).not.toBeInTheDocument();
  });

  it('「知る → 調べる → 考える → 届ける」の流れを図で見せる', () => {
    render(<App />);
    const flow = screen.getByRole('list', { name: '声を届けるまでの流れ' });
    expect(within(flow).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['知る', '調べる', '考える', '届ける']);
  });

  it('いちばん上に「日本を知る。トップへ戻る」（同じタブで開く）', () => {
    render(<App />);
    const link = screen.getByRole('link', { name: '日本を知る。トップへ戻る' });
    expect(link).toHaveAttribute('href', 'https://yumaki5555.github.io/');
    expect(link).not.toHaveAttribute('target');
  });

  it('「まず3分でわかる」で同じページの解説へ移動する', async () => {
    render(<App />);
    const gate = screen.getByRole('link', { name: 'まず3分でわかる' });
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
      'STEP 1声の届け方を選ぶ',
      'STEP 2電話・メールで伝える',
      'STEP 3パブコメを提出する',
      'STEP 4請願・陳情を提出する',
      'STEP 5窓口を探して行動する',
    ]);
  });

  it('各STEPの本文は1文（60文字以内）', () => {
    for (const s of THREE_MINUTE_STEPS) {
      expect(s.text.length).toBeLessThanOrEqual(60);
      expect(s.text.match(/。/g)).toHaveLength(1);
    }
  });

  it('STEP 4 は請願と陳情の違いを図で残し、STEP 5 の早見表は最初は閉じている', () => {
    render(<App />);
    expect(screen.getByText('原則、議員の紹介が必要')).toBeInTheDocument();
    const fold = screen.getByText('目的別の早見表（6項目）').closest('details')!;
    expect(fold.open).toBe(false);
    expect(within(fold).getAllByRole('term', { hidden: true })).toHaveLength(6);
    expect(within(fold).getByText('どの方法でも、送り先と手続きは、各機関の公式ページで確かめましょう。')).toBeInTheDocument();
  });

  it('6つのメニュー：アイコンと短い名前だけ。準備中のものだけ「準備中」', () => {
    render(<App />);
    const sec = document.getElementById('methods')!;
    const cards = within(sec).getAllByRole('listitem');
    expect(cards.map((c) => c.textContent)).toEqual(['電話', 'メール・郵送準備中', 'パブコメ準備中', '請願・陳情準備中', '情報公開請求準備中', '署名準備中']);
    expect(within(cards[0]).getByRole('link', { name: '電話のかけ方' })).toHaveAttribute('href', '#/guide/phone');
    expect(within(sec).getAllByText('準備中')).toHaveLength(5);
    expect(within(sec).getByRole('link', { name: 'パブコメの書き方（準備中）' })).toHaveAttribute('href', '#/guide/public-comment');
    for (const g of GUIDES) expect(screen.queryByText(g.summary)).not.toBeInTheDocument();
  });

  it('パブコメ掲示板・署名掲示板へすぐ移動できる', () => {
    render(<App />);
    const pub = screen.getAllByRole('link', { name: /パブコメ掲示板/ });
    const sho = screen.getAllByRole('link', { name: /署名掲示板/ });
    expect(pub.every((a) => a.getAttribute('href') === 'https://yumaki5555.github.io/pubcome/')).toBe(true);
    expect(sho.every((a) => a.getAttribute('href') === 'https://yumaki5555.github.io/shomei/')).toBe(true);
  });

  it('全国の窓口検索は大きなリンク1つ（登録数はトップに出さない）', () => {
    render(<App />);
    const sec = document.getElementById('contacts')!;
    expect(within(sec).getAllByRole('link')).toHaveLength(1);
    expect(within(sec).getByRole('link', { name: /全国の窓口を探す/ })).toHaveAttribute('href', '#/contacts');
    expect(screen.queryByText(/公式確認済みの窓口/)).not.toBeInTheDocument();
  });

  it('このサイトについて：トップは「民間運営」とリンクだけ。詳しい説明はフッターと専用ページに', () => {
    render(<App />);
    const sec = document.getElementById('about')!;
    expect(within(sec).getByText('民間運営')).toBeInTheDocument();
    expect(within(sec).getByRole('link', { name: 'このサイトについて' })).toHaveAttribute('href', '#/about');
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText(/国・自治体・議会の公式サイトではありません/)).toBeInTheDocument();
    expect(within(footer).getByText(/最終更新日：2026年11月1日/)).toBeInTheDocument();
  });

  it('トップでは小さなサイト名を出さない（大きな題名と重ならない）', () => {
    render(<App />);
    expect(screen.getAllByText('声を届ける。')).toHaveLength(2); // 題名とフッター
  });
});

// トップページと「3分でわかる」
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import { GUIDES } from '../src/content/guides';
import { METHODS, PURPOSES, THREE_MINUTE_STEPS } from '../src/content/threeMinutes';

describe('トップページ', () => {
  it('サイト名・キャッチコピーが出る（長い説明文はトップに出さない）', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: '声を届ける。' })).toBeInTheDocument();
    expect(screen.getByText('知ることから、行動へ。')).toBeInTheDocument();
    expect(screen.queryByText(/電話、メール、パブコメ、請願・陳情。自分に合った方法を知り/)).not.toBeInTheDocument();
    expect(screen.queryByText('疑問に思ったこと、伝えたいこと。その声を適切な窓口へ届けるために。')).not.toBeInTheDocument();
  });

  it('題名の下に、何ができるサイトかを2行で', () => {
    render(<App />);
    expect(screen.getByText('疑問や意見を、適切な窓口へ。')).toBeInTheDocument();
    expect(screen.getByText('調べ方・考え方・書き方・届け方を案内します。')).toBeInTheDocument();
  });

  it('並び順：題名 → 何をしたいですか？ → すぐ使いたい方 → 3分でわかる → すべての方法 → 関連サイト（3分ガイドの本文はトップに置かない）', () => {
    render(<App />);
    const ids = ['purpose', 'quick', 'first', 'methods', 'related'].map((id) => document.getElementById(id)!);
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i - 1].compareDocumentPosition(ids[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(document.getElementById('sanpun')).toBeNull();
    expect(document.getElementById('contacts')).toBeNull(); // 窓口検索の入り口は「すぐ使いたい方」に1つ
    expect(screen.queryByRole('list', { name: '声を届けるまでの流れ' })).not.toBeInTheDocument();
  });

  it('何をしたいですか？：4つの目的。押すとその下に「こんな方法があります」、もう一度押すと閉じる', async () => {
    render(<App />);
    const sec = document.getElementById('purpose')!;
    expect(within(sec).getByRole('heading', { level: 2, name: '何をしたいですか？' })).toBeInTheDocument();
    const btns = within(sec).getAllByRole('button');
    expect(btns.map((b) => b.textContent)).toEqual(['質問・確認したい', '意見・要望を伝えたい', '制度を変えてほしい', '情報・資料がほしい']);
    expect(within(sec).queryByText(/こんな方法があります/)).not.toBeInTheDocument();

    await userEvent.click(btns[0]);
    expect(btns[0]).toHaveAttribute('aria-pressed', 'true');
    expect(within(sec).getByText('「質問・確認したい」なら、こんな方法があります')).toBeInTheDocument();
    const rows = () => Array.from(sec.querySelectorAll('.way-row')) as HTMLElement[];
    expect(rows().map((r) => r.querySelector('.way-when')!.textContent)).toEqual(['直接確認する', '文章で質問する', '担当部署がわからない']);
    expect(within(rows()[0]).getByRole('link', { name: '電話' })).toHaveAttribute('href', '#/guide/phone');
    expect(within(rows()[1]).getByRole('link', { name: 'メール・手紙' })).toHaveAttribute('href', '#/guide/email');
    expect(within(rows()[2]).getByRole('link', { name: '窓口を探す' })).toHaveAttribute('href', '#/contacts');
    expect(within(sec).getByText('状況に合った方法を選びましょう。複数の方法を組み合わせることもできます。')).toBeInTheDocument();
    expect(within(sec).queryByText(/おすすめ/)).not.toBeInTheDocument();

    await userEvent.click(btns[0]);
    expect(btns[0]).toHaveAttribute('aria-pressed', 'false');
    expect(within(sec).queryByText(/こんな方法があります/)).not.toBeInTheDocument();
  });

  it('制度を変えてほしい：パブコメ・請願陳情・電話メール・署名', async () => {
    render(<App />);
    const sec = document.getElementById('purpose')!;
    await userEvent.click(within(sec).getByRole('button', { name: /^制度を\s?変えてほしい$/ }));
    const links = Array.from(sec.querySelectorAll('.way-row a')).map((a) => [a.textContent, a.getAttribute('href')]);
    expect(links).toEqual([
      ['パブリックコメント', '#/guide/public-comment'],
      ['請願・陳情', '#/guide/petition'],
      ['電話', '#/guide/phone'],
      ['メール・手紙', '#/guide/email'],
      ['署名', '#/guide/signature'],
    ]);
  });

  it('情報・資料がほしい：準備中の情報公開請求は押せない表示にし、公式サイトでの確認を案内する', async () => {
    render(<App />);
    const sec = document.getElementById('purpose')!;
    await userEvent.click(within(sec).getByRole('button', { name: /^情報・資料が\s?ほしい$/ }));
    expect(within(sec).queryByRole('link', { name: /情報公開請求/ })).not.toBeInTheDocument();
    expect(within(sec).getByText('情報公開請求').closest('.way-chip')).toHaveTextContent('準備中');
    expect(within(sec).getByText('手続きは、請求先の公式サイトで確かめてください。')).toBeInTheDocument();
    expect(within(sec).getByRole('link', { name: '公式サイトを探す' })).toHaveAttribute('href', '#/contacts');
  });

  it('目的と方法の対応表：行き先はすべて実在のガイドか補助の行動。6つの方法はどれかの目的から行ける', () => {
    const slugs = new Set<string>(GUIDES.map((g) => g.slug));
    const used = new Set<string>();
    for (const p of PURPOSES) {
      expect(p.ways.length).toBeGreaterThan(0);
      for (const w of p.ways) {
        for (const t of w.to) {
          expect(slugs.has(t) || t === 'contacts' || t === 'official').toBe(true);
          used.add(t);
        }
      }
    }
    for (const g of GUIDES) expect(used.has(g.slug)).toBe(true);
  });

  it('すぐ使いたい方：4つの機能へ直接', () => {
    render(<App />);
    const sec = document.getElementById('quick')!;
    expect(within(sec).getByRole('heading', { level: 2, name: 'すぐ使いたい方' })).toBeInTheDocument();
    expect(within(sec).getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['電話の台本を作る', '#/guide/phone'],
      ['メール・手紙を作る', '#/guide/email'],
      ['全国の窓口を探す', '#/contacts'],
      ['パブコメを書く', '#/guide/public-comment'],
    ]);
    expect(screen.queryByText(/よく使われて/)).not.toBeInTheDocument();
  });

  it('初めての方へ：3分ガイドへの入り口は1つ', () => {
    render(<App />);
    const links = screen.getAllByRole('link', { name: /3分でわかる/ });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '#/sanpun');
    expect(links[0]).toHaveTextContent('制度の仕組み・声の届け方・注意点を知る');
  });

  it('いちばん上に「日本を知る。トップへ戻る」（同じタブで開く）', () => {
    render(<App />);
    const link = screen.getByRole('link', { name: '日本を知る。トップへ戻る' });
    expect(link).toHaveAttribute('href', 'https://yumaki5555.github.io/');
    expect(link).not.toHaveAttribute('target');
  });

  it('すべての方法：アイコンと短い名前だけ。準備中のものだけ「準備中」', () => {
    render(<App />);
    const sec = document.getElementById('methods')!;
    expect(within(sec).getByRole('heading', { level: 2, name: 'すべての方法を見る' })).toBeInTheDocument();
    const cards = within(sec).getAllByRole('listitem');
    expect(cards.map((c) => c.textContent)).toEqual(['電話', 'メール・フォーム・郵送', 'パブコメ', '請願・陳情', '情報公開請求準備中', '署名']);
    expect(within(cards[0]).getByRole('link', { name: '電話のかけ方' })).toHaveAttribute('href', '#/guide/phone');
    expect(within(sec).getAllByText('準備中')).toHaveLength(1);
    expect(within(sec).getByRole('link', { name: 'パブコメの書き方' })).toHaveAttribute('href', '#/guide/public-comment');
    for (const g of GUIDES) expect(screen.queryByText(g.summary)).not.toBeInTheDocument();
  });

  it('パブコメ掲示板・署名掲示板へすぐ移動できる', () => {
    render(<App />);
    const pub = screen.getAllByRole('link', { name: /パブコメ掲示板/ });
    const sho = screen.getAllByRole('link', { name: /署名掲示板/ });
    expect(pub.every((a) => a.getAttribute('href') === 'https://yumaki5555.github.io/pubcome/')).toBe(true);
    expect(sho.every((a) => a.getAttribute('href') === 'https://yumaki5555.github.io/shomei/')).toBe(true);
  });

  it('このサイトについて：トップは「民間運営」とリンクだけ。詳しい説明はフッターと専用ページに', () => {
    render(<App />);
    const sec = document.getElementById('about')!;
    expect(within(sec).getByText('民間運営')).toBeInTheDocument();
    expect(within(sec).getByRole('link', { name: 'このサイトについて' })).toHaveAttribute('href', '#/about');
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText(/国・自治体・議会の公式サイトではありません/)).toBeInTheDocument();
    expect(within(footer).getByText(/最終更新日：2026年11月4日/)).toBeInTheDocument();
  });

  it('トップでは小さなサイト名を出さない（大きな題名と重ならない）', () => {
    render(<App />);
    expect(screen.getAllByText('声を届ける。')).toHaveLength(2); // 題名とフッター
  });
});

describe('3分でわかる（#/sanpun）', () => {
  function open(hash = '#/sanpun') {
    window.location.hash = hash;
    return render(<App />);
  }
  const step = (no: number) => document.getElementById(`step${no}-h`)!.closest('li')!;
  const marked = () => Array.from(step(2).querySelectorAll('.method-card.is-match .method-name')).map((b) => b.textContent);

  it('題名と4つのSTEP', () => {
    open();
    expect(screen.getByRole('heading', { level: 1, name: '3分でわかる' })).toBeInTheDocument();
    const titles = within(document.getElementById('sanpun')!)
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent);
    expect(titles).toEqual(['STEP 1何をしたい？', 'STEP 2方法を選ぼう', 'STEP 3届ける先を探そう', 'STEP 4準備して届けよう']);
  });

  it('各STEPの本文は1文（60文字以内）', () => {
    for (const s of THREE_MINUTE_STEPS) {
      expect(s.text.length).toBeLessThanOrEqual(60);
      expect(s.text.match(/。/g)).toHaveLength(1);
    }
  });

  it('以前の URL（#/?s=sanpun）でも開き、新しい URL に置き換わる', () => {
    open('#/?s=sanpun');
    expect(screen.getByRole('heading', { level: 1, name: '3分でわかる' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/sanpun');
  });

  it('STEP 2：6つの方法を並列のカードで見せ、押すとそれぞれのガイドへ', () => {
    open();
    expect(within(step(2)).getByText(/順番に全部行う手順ではなく/)).toBeInTheDocument();
    const cards = within(step(2)).getAllByRole('link');
    expect(cards.map((a) => a.querySelector('.method-name')!.textContent)).toEqual([
      '電話',
      'メール・手紙',
      'パブリックコメント',
      '請願・陳情',
      '情報公開請求',
      '署名',
    ]);
    expect(cards.map((a) => a.getAttribute('href'))).toEqual(METHODS.map((m) => `#/guide/${m.slug}`));
    expect(within(step(2)).getAllByText('準備中')).toHaveLength(1);
  });

  it('STEP 1 はトップと同じ目的選択。押すと方法が出て、STEP 2 の使える方法に印がつく', async () => {
    open();
    expect(marked()).toEqual([]);
    const btn = within(step(1)).getByRole('button', { name: /^質問・\s?確認したい$/ });
    await userEvent.click(btn);
    expect(within(step(1)).getByText('「質問・確認したい」なら、こんな方法があります')).toBeInTheDocument();
    expect(marked()).toEqual(['電話', 'メール・手紙']);
    expect(within(step(2)).getAllByText('（選んだ目的に使える）')).toHaveLength(2);

    await userEvent.click(within(step(1)).getByRole('button', { name: /^制度を\s?変えてほしい$/ }));
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(marked()).toEqual(['電話', 'メール・手紙', 'パブリックコメント', '請願・陳情', '署名']);

    await userEvent.click(within(step(1)).getByRole('button', { name: /^制度を\s?変えてほしい$/ }));
    expect(marked()).toEqual([]);
  });

  it('トップで選んだ目的は、3分ガイドでも選んだまま', async () => {
    const { unmount } = open('#/');
    await userEvent.click(screen.getByRole('button', { name: /^情報・資料が\s?ほしい$/ }));
    unmount();
    open();
    expect(within(step(1)).getByRole('button', { name: /^情報・資料が\s?ほしい$/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('STEP 3 は窓口検索へ、STEP 4 は電話の台本・メールや手紙の文面づくりへ進める', () => {
    open();
    expect(within(step(3)).getByRole('link', { name: /全国の窓口を探す/ })).toHaveAttribute('href', '#/contacts');
    const s4 = step(4);
    expect(within(s4).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      '必要な事実や資料を整理する',
      '台本・文章を作る',
      '選んだ方法で届ける',
      '回答を確認・記録する必要なときに',
    ]);
    expect(within(s4).getByRole('link', { name: /電話の台本を作る/ })).toHaveAttribute('href', '#/guide/phone');
    expect(within(s4).getByRole('link', { name: /メール・手紙の文面を作る/ })).toHaveAttribute('href', '#/guide/email');
  });

  it('最後に「声を届ける前に知っておきたいこと」4つ。詳しくは各マニュアルへ', () => {
    open();
    const sec = screen.getByRole('region', { name: '声を届ける前に知っておきたいこと' });
    expect(within(sec).getByText(/パブコメは多数決ではありません/)).toBeInTheDocument();
    expect(within(sec).getByText(/AIの答えは公式の資料で確かめ/)).toBeInTheDocument();
    expect(within(sec).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '#/guide/public-comment?s=sanpun',
      '#/guide/petition?s=sanpun',
      '#/guide/email?s=ch1',
      '#/guide/public-comment?s=ai',
    ]);
    expect(screen.getAllByRole('link', { name: /トップへ戻る/ }).length).toBeGreaterThan(0);
  });
});

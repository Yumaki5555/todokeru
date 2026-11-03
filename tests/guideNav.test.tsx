// 長いページの道しるべ（目次の「必要なときだけ」・飛ばして進む案内・画面下の4つのまとまり）、
// トップの AI の入り口、間違いの報告先
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { App } from '../src/App';
import { PETITION_PARTS } from '../src/content/petitionManual';
import { PUBCOM_PARTS } from '../src/content/pubcomManual';
import { SIGNATURE_PARTS } from '../src/content/signatureManual';
import { REPORT, reportPageChoice, reportUrl } from '../src/site';

function open(hash: string) {
  window.location.hash = hash;
  return render(<App />);
}

const PAGES = [
  { hash: '#/guide/petition', parts: PETITION_PARTS },
  { hash: '#/guide/public-comment', parts: PUBCOM_PARTS },
  { hash: '#/guide/signature', parts: SIGNATURE_PARTS },
];

describe('長いページの道しるべ', () => {
  it.each(PAGES)('$hash：目次は4つ、③だけ「必要なときだけ」', ({ hash, parts }) => {
    open(hash);
    const menu = screen.getByRole('navigation', { name: 'このページの内容' });
    const links = within(menu).getAllByRole('link');
    expect(links).toHaveLength(4);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(parts.map((p) => `${hash}?s=${p.id}`));
    expect(within(links[2]).getByText('必要なときだけ')).toBeInTheDocument();
    expect(within(menu).getAllByText('必要なときだけ')).toHaveLength(1);
  });

  it.each(PAGES)('$hash：③の冒頭に「飛ばして④へ進む」', ({ hash, parts }) => {
    open(hash);
    const third = document.getElementById(parts[2].id)!;
    const skip = within(third).getByRole('link', { name: `④「${parts[3].title}」へ進む` });
    expect(skip).toHaveAttribute('href', `${hash}?s=${parts[3].id}`);
    expect(within(third).getByText(/必要なときだけ読めば大丈夫です/)).toBeInTheDocument();
    // ほかのまとまりには出さない
    for (const p of [parts[0], parts[1], parts[3]]) {
      expect(within(document.getElementById(p.id)!).queryByText(/必要なときだけ読めば大丈夫です/)).not.toBeInTheDocument();
    }
  });

  it.each(PAGES)('$hash：画面下のメニューは4つのまとまり（目次が見えているあいだは隠す）', ({ hash, parts }) => {
    open(hash);
    const bar = document.querySelector('nav.jump-bar.jump-bar-wide') as HTMLElement;
    expect(bar).toHaveAttribute('aria-label', 'このページの目次（いま読んでいるところに印）');
    expect(bar.hidden).toBe(true);
    const links = within(bar).getAllByRole('link', { hidden: true });
    expect(links.map((a) => a.textContent)).toEqual(parts.map((p) => `${p.no}${p.short}`));
    expect(links.map((a) => a.getAttribute('href'))).toEqual(parts.map((p) => `${hash}?s=${p.id}`));
  });
});

describe('トップの AI の入り口', () => {
  it('すぐ使いたい方の下に、パブコメ・請願・署名の「AIへの指示文」へ直接行けるリンク', () => {
    open('#/');
    const quick = document.getElementById('quick')!;
    const box = within(quick).getByRole('group', { name: 'AIで考えを文章に整理したいとき' });
    const links = within(box).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '#/guide/public-comment?s=prompts',
      '#/guide/petition?s=prompts',
      '#/guide/signature?s=prompts',
    ]);
    expect(within(box).getByText(/AIを使わずに整えられます/)).toBeInTheDocument();
  });

  it.each(['#/guide/public-comment', '#/guide/petition', '#/guide/signature'])('%s：行き先の「AIへの指示文」の欄がある', (hash) => {
    open(hash);
    expect(document.getElementById('prompts')).not.toBeNull();
  });
});

describe('間違いの報告先', () => {
  const FORM = 'https://docs.google.com/forms/d/e/ABC/viewform';

  const ENTRIES = { kind: 'entry.1', page: 'entry.2', detail: 'entry.3', url: 'entry.4' };

  it('報告先が未設定なら URL は空', () => {
    expect(reportUrl({ detail: '窓口：広聴課' }, { formUrl: '', entries: ENTRIES })).toBe('');
  });

  it('docs.google.com のフォームなら、ページ・URL・窓口を書き込んだ状態で開く', () => {
    const u = new URL(
      reportUrl({ kind: '掲載内容の間違い', page: '全国の窓口を探す（窓口検索）', detail: '窓口：広聴課（131016-feedback）\n', url: 'https://example.jp/#/contacts?q=1' }, { formUrl: FORM, entries: ENTRIES }),
    );
    expect(u.origin + u.pathname).toBe(FORM);
    expect(u.searchParams.get('usp')).toBe('pp_url');
    expect(u.searchParams.get('entry.1')).toBe('掲載内容の間違い');
    expect(u.searchParams.get('entry.2')).toBe('全国の窓口を探す（窓口検索）');
    expect(u.searchParams.get('entry.3')).toBe('窓口：広聴課（131016-feedback）\n');
    expect(u.searchParams.get('entry.4')).toBe('https://example.jp/#/contacts?q=1');
  });

  it('書き込む値・番号がない・短縮 URL のときは、そのままの URL', () => {
    expect(reportUrl({}, { formUrl: FORM, entries: ENTRIES })).toBe(FORM);
    expect(reportUrl({ url: 'https://example.jp/' }, { formUrl: FORM, entries: { ...ENTRIES, url: '' } })).toBe(FORM);
    expect(reportUrl({ url: 'https://example.jp/' }, { formUrl: 'https://forms.gle/xyz', entries: ENTRIES })).toBe('https://forms.gle/xyz');
  });

  it('サイトのページは、フォームの「どのページ」の選択肢に対応する', () => {
    expect(reportPageChoice('/')).toBe('トップページ・3分でわかる');
    expect(reportPageChoice('/guide/petition')).toBe('請願・陳情の書き方');
    expect(reportPageChoice('/about')).toBe('このサイトについて');
    expect(reportPageChoice('/nothing')).toBe('');
  });

  it('いまの設定どおりに、フッター・「このサイトについて」・トップと各ページの末尾に出す（未設定なら出さない）', () => {
    const set = !!REPORT.formUrl;
    const about = open('#/about');
    const footer = about.container.querySelector('footer')!;
    expect(!!within(footer).queryByRole('link', { name: /間違い・ご要望を送る/ })).toBe(set);
    expect(!!about.container.querySelector('#report')).toBe(set);
    // このサイトについては専用の欄があるので、末尾の1行は出さない
    expect(about.container.querySelectorAll('.report-line').length).toBe(0);
    about.unmount();
    for (const hash of ['#/', '#/guide/phone', '#/guide/email', '#/guide/public-comment', '#/guide/petition', '#/guide/signature']) {
      const r = open(hash);
      expect(r.container.querySelectorAll('.report-line').length).toBe(set ? 1 : 0);
      r.unmount();
    }
  });

  it('報告のボタンは新しいタブで開き、見ていたページの URL とページ名を書き込む', () => {
    if (!REPORT.formUrl) return;
    const r = open('#/guide/petition');
    const a = r.container.querySelector('.report-line a') as HTMLAnchorElement;
    expect(a.textContent).toContain('間違い・ご要望を送る');
    expect(a.target).toBe('_blank');
    expect(a.rel).toContain('noopener');
    const u = new URL(a.href);
    expect(u.searchParams.get(REPORT.entries.page)).toBe('請願・陳情の書き方');
    expect(u.searchParams.get(REPORT.entries.url)).toBe(window.location.href);
  });
});

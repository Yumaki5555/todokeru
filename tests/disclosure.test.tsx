// 情報公開請求（#/guide/disclosure）
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import { saveLastArea } from '../src/lib/lastArea';
import { GUIDES } from '../src/content/guides';
import { DISCLOSURE_CHECKLIST, DISCLOSURE_PARTS, DISCLOSURE_PROMPTS, MORE_TOPICS, OFFICIAL, templateText } from '../src/content/disclosureManual';
import { MAIL_CHAPTERS } from '../src/content/mailManual';

function open(hash = '#/guide/disclosure') {
  window.location.hash = hash;
  return render(<App />);
}

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return writeText;
}

const promptText = () => screen.getByLabelText(/^AIへの指示文（/);

afterEach(() => {
  window.sessionStorage.clear();
});

describe('情報公開請求', () => {
  it('題名・副題・トップへ戻る。準備中ではない', () => {
    open();
    expect(screen.getByRole('heading', { level: 1, name: '情報公開請求' })).toBeInTheDocument();
    expect(screen.getByText('行政が持つ文書を、自分で確かめる。')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '声を届ける。トップへ戻る' })[0]).toHaveAttribute('href', '#/');
    expect(screen.getByRole('button', { name: 'ページ先頭へ戻る' })).toBeInTheDocument();
    expect(screen.queryByText('このページで案内する予定の内容')).not.toBeInTheDocument();
    expect(document.title).toBe('情報公開請求｜声を届ける。');
    expect(GUIDES.find((g) => g.slug === 'disclosure')?.status).toBe('published');
  });

  it('4つの入り口から、それぞれのまとまりへ移れる', () => {
    open();
    const links = within(screen.getByRole('navigation', { name: 'このページの内容' })).getAllByRole('link');
    expect(links).toHaveLength(4);
    DISCLOSURE_PARTS.forEach((p, i) => {
      expect(links[i]).toHaveAttribute('href', `#/guide/disclosure?s=${p.id}`);
      expect(screen.getByRole('heading', { level: 2, name: p.title })).toBeInTheDocument();
    });
  });

  it('?s= で章へ直接移れる（折りたたみの中も開く）', () => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    open('#/guide/disclosure?s=more-appeal');
    expect((document.getElementById('more-appeal') as HTMLDetailsElement).open).toBe(true);
    vi.restoreAllMocks();
  });

  it('3分でわかる：何がわかる5枚・知っておきたいこと6つ・どちらを使う', () => {
    open();
    expect(within(screen.getByRole('list', { name: '何がわかる？' })).getAllByRole('listitem')).toHaveLength(5);
    expect(within(screen.getByRole('list', { name: '知っておきたいこと' })).getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByText(/実際にあるとは限りません/)).toBeInTheDocument();
    const which = screen.getByRole('list', { name: 'どちらを使う？' });
    expect(within(which).getByRole('link', { name: '電話' })).toHaveAttribute('href', '#/guide/phone');
    expect(within(which).getByRole('link', { name: 'メール' })).toHaveAttribute('href', '#/guide/email');
    expect(within(which).getByRole('link', { name: '情報公開請求' })).toHaveAttribute('href', '#/guide/disclosure?s=request');
  });

  it('STEP 1：B を選ぶと文書の候補を整理する指示文へ案内し、選択はタブの中で残る', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    open();
    await userEvent.click(screen.getByRole('radio', { name: /何を請求すればよいかわからない/ }));
    await userEvent.click(screen.getByRole('button', { name: /「請求する文書を探したい」の指示文を使う/ }));
    expect(promptText().textContent).toContain('情報公開請求する文書の候補を整理');
    cleanup();
    open();
    expect(screen.getByRole('radio', { name: /何を請求すればよいかわからない/ })).toBeChecked();
  });

  it('STEP 2：見えているのは4つの確認項目。詳しい探し方は折りたたみ', () => {
    open();
    expect(within(screen.getByRole('list', { name: '確かめる4つのこと' })).getAllByRole('listitem')).toHaveLength(4);
    expect((document.getElementById('find-more') as HTMLDetailsElement).open).toBe(false);
  });

  it('入力欄はない（ひな形も指示文もコピーするだけ）。ひな形をコピーできる', async () => {
    const writeText = mockClipboard();
    open();
    expect(document.querySelectorAll('main input:not([type="radio"]):not([type="checkbox"]), main textarea, main select')).toHaveLength(0);
    await userEvent.click(screen.getByRole('button', { name: 'ひな形をコピー' }));
    expect(writeText).toHaveBeenCalledWith(templateText());
    expect(templateText()).toContain('【開示を請求する文書】');
    expect(templateText()).toContain('【希望する開示方法】');
  });

  it('AIへの指示文：5つすべて切りかえてコピーできる', async () => {
    const writeText = mockClipboard();
    open();
    expect(DISCLOSURE_PROMPTS).toHaveLength(5);
    for (const p of DISCLOSURE_PROMPTS) {
      await userEvent.click(screen.getByRole('radio', { name: new RegExp(p.label) }));
      expect(promptText().textContent).toBe(p.text.trimEnd());
      await userEvent.click(screen.getByRole('button', { name: 'AIへの指示文をコピー' }));
      expect(writeText).toHaveBeenLastCalledWith(p.text);
    }
  });

  it('指示文：創作・推測をさせない言葉があり、「非公開」は使わない', () => {
    const byId = Object.fromEntries(DISCLOSURE_PROMPTS.map((p) => [p.id, p.text]));
    expect(byId.find).toContain('創作しないでください');
    expect(byId.write).toContain('断定しないでください');
    expect(byId.deep).toContain('混同しないでください');
    expect(byId.check).toContain('推測しないでください');
    expect(byId.recheck).toContain('仮定せず');
    for (const p of DISCLOSURE_PROMPTS) expect(p.text).not.toContain('非公開');
  });

  it('もっと詳しく：7つのテーマはどれも閉じている。「非公開」は画面に出ない', () => {
    open();
    expect(MORE_TOPICS).toHaveLength(7);
    for (const t of MORE_TOPICS) expect((document.getElementById(t.id) as HTMLDetailsElement).open).toBe(false);
    expect(document.querySelector('main')!.textContent).not.toContain('非公開');
  });

  it('提出先：国は e-Gov の窓口一覧へ。国会・裁判所などの補足がある', async () => {
    open();
    expect(screen.queryByRole('link', { name: /情報公開窓口一覧/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: '国の行政機関' }));
    expect(screen.getByRole('link', { name: /情報公開窓口一覧/ })).toHaveAttribute('href', OFFICIAL.windows.url);
    expect(screen.getByText(/国会・裁判所・独立行政法人などは、別の法律や手続きです/)).toBeInTheDocument();
    expect(screen.getByText(/正式な請求をメールで受け付けるとは限りません/)).toBeInTheDocument();
  });

  it('提出先：自治体は窓口検索へ。ただし担当部署を尋ねる先で、正式な受付窓口ではないと書く', async () => {
    open();
    await userEvent.click(screen.getByRole('radio', { name: '市区町村' }));
    expect(screen.getByRole('link', { name: '全国の窓口を探す' })).toHaveAttribute('href', '#/contacts?tab=area');
    expect(screen.getByText(/情報公開の担当部署を尋ねるための連絡先です。正式な請求の受付窓口ではありません/)).toBeInTheDocument();
    expect(screen.getByText(/正式な請求先・提出方法は、市区町村の公式サイトで確かめます/)).toBeInTheDocument();
    expect(document.querySelector('#where')!.textContent).toContain('「確認済み」の表示も、連絡先についての確認です');
  });

  it('提出先：窓口検索で見た地域を引き継ぐ（都道府県は市区町村のコードの先頭2けた）', async () => {
    saveLastArea({ code: '131083', name: '東京都 江東区' });
    open();
    await userEvent.click(screen.getByRole('radio', { name: '市区町村' }));
    expect(screen.getByRole('link', { name: '東京都 江東区の連絡先を見る' })).toHaveAttribute('href', '#/contacts?tab=area&code=131083');
    await userEvent.click(screen.getByRole('radio', { name: '都道府県' }));
    expect(screen.getByRole('link', { name: '東京都の連絡先を見る' })).toHaveAttribute('href', '#/contacts?tab=area&code=13');
  });

  it('提出前チェック：7項目。チェックはタブの中で残る', async () => {
    open();
    const part = document.getElementById('checklist')!;
    expect(within(part).getAllByRole('checkbox')).toHaveLength(DISCLOSURE_CHECKLIST.length);
    expect(DISCLOSURE_CHECKLIST).toHaveLength(7);
    await userEvent.click(within(part).getAllByRole('checkbox')[0]);
    cleanup();
    open();
    expect(within(document.getElementById('checklist')!).getAllByRole('checkbox')[0]).toBeChecked();
  });

  it('結果は3種類。文書不存在と存否応答拒否は不開示の中、移送と意見照会は折りたたみ', () => {
    open();
    const results = screen.getByRole('list', { name: '決定の結果' });
    const items = within(results).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('全部開示');
    expect(items[1]).toHaveTextContent('一部開示');
    expect(items[2]).toHaveTextContent('不開示');
    expect(items[2]).toHaveTextContent('文書不存在');
    expect(items[2]).toHaveTextContent('存否応答拒否');
    expect(results).not.toHaveTextContent('移送');
    const during = document.getElementById('during') as HTMLDetailsElement;
    expect(during.open).toBe(false);
    expect(during).toHaveTextContent('事案の移送');
    expect(during).toHaveTextContent('第三者への意見照会');
  });

  it('次にできること：質問・パブコメ・請願陳情へ行ける', () => {
    open();
    const next = document.getElementById('next')!;
    expect(within(next).getByRole('link', { name: '電話で追加の質問をする' })).toHaveAttribute('href', '#/guide/phone');
    expect(within(next).getByRole('link', { name: 'メールで追加の質問をする' })).toHaveAttribute('href', '#/guide/email');
    expect(within(next).getByRole('link', { name: 'パブコメを書く' })).toHaveAttribute('href', '#/guide/public-comment');
    expect(within(next).getByRole('link', { name: '請願・陳情を提出する' })).toHaveAttribute('href', '#/guide/petition');
  });

  it('ほかのページから：「準備中」の表示が消えている', () => {
    expect(JSON.stringify(MAIL_CHAPTERS)).not.toContain('情報公開請求（準備中）');
    open('#/guide/petition');
    expect(screen.getByRole('link', { name: '情報公開請求' })).toHaveAttribute('href', '#/guide/disclosure');
    expect(screen.queryByText('準備中')).not.toBeInTheDocument();
  });
});

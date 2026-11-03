// 請願・陳情の書き方（#/guide/petition）
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import { INTRODUCER, PETITION_CHECKLIST, PETITION_PARTS, PETITION_PROMPTS, PETITION_STEPS, findPrompt, templateText } from '../src/content/petitionManual';

function open(hash = '#/guide/petition') {
  window.location.hash = hash;
  return render(<App />);
}

function mockClipboard(ok = true) {
  const writeText = ok ? vi.fn().mockResolvedValue(undefined) : vi.fn().mockRejectedValue(new Error('denied'));
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return writeText;
}

const promptText = () => screen.getByLabelText(/^AIへの指示文（/);

describe('請願・陳情の書き方', () => {
  it('題名・副題・トップへ戻る。準備中ではない', () => {
    open();
    expect(screen.getByRole('heading', { level: 1, name: '請願・陳情の書き方' })).toBeInTheDocument();
    expect(screen.getByText('議会に、正式に検討を求める。')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '声を届ける。トップへ戻る' })[0]).toHaveAttribute('href', '#/');
    expect(screen.queryByText('このページで案内する予定の内容')).not.toBeInTheDocument();
    expect(document.title).toBe('請願・陳情の書き方｜声を届ける。');
  });

  it('4つの入り口から、それぞれのまとまりへ移れる', () => {
    open();
    const links = within(screen.getByRole('navigation', { name: 'このページの内容' })).getAllByRole('link');
    expect(links).toHaveLength(4);
    PETITION_PARTS.forEach((p, i) => {
      expect(links[i]).toHaveAttribute('href', `#/guide/petition?s=${p.id}`);
      expect(screen.getByRole('heading', { level: 2, name: p.title })).toBeInTheDocument();
    });
  });

  it('3分でわかる：5ステップ。陳情と請願の比較カード、選び方、出す先の3つ', () => {
    open();
    for (const s of PETITION_STEPS) expect(screen.getByRole('heading', { level: 3, name: new RegExp(`STEP ${s.no}\\s*${s.title}`) })).toBeInTheDocument();
    expect(screen.getByText('議員の紹介はいらない')).toBeInTheDocument();
    expect(screen.getByText('議員の紹介が必要')).toBeInTheDocument();
    const branches = screen.getByRole('list', { name: 'どちらを選ぶ？' });
    expect(within(branches).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['紹介してくれる議員がいる請願を考える', '議員の紹介がない陳情を考える']);
    expect(within(screen.getByRole('list', { name: 'どこに出す？' })).getAllByRole('listitem')).toHaveLength(3);
    // 法律の説明は開くと読める。e-Gov の条文へのリンクつき
    const more = screen.getByText('法律では、どう決まっている？').closest('details')!;
    expect(more.open).toBe(false);
    expect(within(more).getByRole('link', { name: /地方自治法 第124条/ })).toHaveAttribute('href', 'https://laws.e-gov.go.jp/law/322AC0000000067');
  });

  it('出す先・提出の案内から、窓口検索・電話・メール・パブコメの書き方へ行ける', () => {
    open();
    const part = document.getElementById('sanpun')!;
    expect(within(part).getByRole('link', { name: '議会の窓口を探す' })).toHaveAttribute('href', '#/contacts?tab=area');
    expect(within(part).getByRole('link', { name: '電話で問い合わせる' })).toHaveAttribute('href', '#/guide/phone');
    expect(within(part).getByRole('link', { name: 'メールで要望する' })).toHaveAttribute('href', '#/guide/email');
    expect(within(part).getByRole('link', { name: 'パブコメの書き方' })).toHaveAttribute('href', '#/guide/public-comment');
    expect(within(part).getByRole('link', { name: '詳しい書き方を見る' })).toHaveAttribute('href', '#/guide/petition?s=write');
  });

  it('陳情書のひな形をコピーできる', async () => {
    const writeText = mockClipboard();
    open();
    await userEvent.click(screen.getByRole('button', { name: 'ひな形をコピー' }));
    expect(writeText).toHaveBeenCalledWith(templateText());
    expect(templateText()).toMatch(/^【〇〇に関する陳情書】\n\n〇〇議会議長 様\n\n陳情事項\n\n1\. 〇〇について調査してください。/);
  });

  it('指示文：最初は「陳情と請願、どちらがよいか調べたい」。5つで切りかわり、どれも全文をコピーできる', async () => {
    const writeText = mockClipboard();
    open();
    const group = screen.getByRole('group', { name: 'やりたいことを選ぶ' });
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(5);
    expect(radios[0]).toBeChecked();
    for (const p of PETITION_PROMPTS) {
      await userEvent.click(within(group).getByRole('radio', { name: new RegExp(p.label) }));
      expect(promptText()).toHaveAccessibleName(`AIへの指示文（${p.label}）`);
      expect(promptText().textContent).toBe(p.text.trimEnd());
      await userEvent.click(screen.getByRole('button', { name: 'AIへの指示文をコピー' }));
      expect(writeText).toHaveBeenLastCalledWith(p.text);
    }
    expect(writeText).toHaveBeenCalledTimes(5);
    // 指示文に、名前・住所などの入力値は入らない
    for (const p of PETITION_PROMPTS) expect(p.text).not.toMatch(/〒|様$/m);
  });

  it('選んだ指示文は、ほかのページへ行って戻っても残る。AIは使わなくてよいと伝える', async () => {
    const view = open();
    expect(screen.getByText(/AIは使わなくても大丈夫です/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: /陳情書・請願書を作りたい/ }));
    view.unmount();
    open();
    expect(screen.getByRole('radio', { name: /陳情書・請願書を作りたい/ })).toBeChecked();
  });

  it('「AIで文章を作る」で、陳情書・請願書の指示文を選んだ状態になる', async () => {
    open();
    await userEvent.click(screen.getByRole('button', { name: 'AIで文章を作る' }));
    expect(screen.getByRole('radio', { name: /陳情書・請願書を作りたい/ })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: /指示文を見る\s*（自分の要望を整理したい）/ }));
    expect(screen.getByRole('radio', { name: /自分の要望を整理したい/ })).toBeChecked();
  });

  it('2つ以上のAIで確かめる：点検用の指示文（E）を直接コピーできる', async () => {
    const writeText = mockClipboard();
    open();
    const sec = document.getElementById('double-check')!;
    expect(within(sec).getByText('2つのAIの答えが同じでも、正しいとは限りません。')).toBeInTheDocument();
    await userEvent.click(within(sec).getByRole('button', { name: '別のAIで確認するための指示文をコピー' }));
    expect(writeText).toHaveBeenCalledWith(findPrompt('review').text);
  });

  it('紹介議員の探し方：6つの手順と、お願いの文のコピー', async () => {
    const writeText = mockClipboard();
    open();
    const sec = document.getElementById('introducer')!;
    expect(sec.querySelectorAll('.pt-numbered li')).toHaveLength(6);
    await userEvent.click(within(sec).getByRole('button', { name: 'お願いの文をコピー' }));
    expect(writeText).toHaveBeenCalledWith(INTRODUCER.letter);
  });

  it('提出前チェック：12項目。全部でまとめの言葉', async () => {
    open();
    const list = screen.getByRole('group', { name: '提出する前に' });
    const boxes = within(list).getAllByRole('checkbox');
    expect(boxes).toHaveLength(PETITION_CHECKLIST.length);
    expect(boxes).toHaveLength(12);
    for (const b of boxes) await userEvent.click(b);
    expect(within(list).getByText(/すべて確認できました。提出先の議会の案内どおりに提出しましょう。/)).toBeInTheDocument();
  });

  it('提出後：結果の区分と、採択と実現は別であること', () => {
    open();
    const part = document.getElementById('submit')!;
    expect(within(part).getByRole('list', { name: '提出後の流れ' }).children).toHaveLength(4);
    for (const t of ['採択', '不採択', '継続審査', '審議未了']) expect(within(part).getByText(t, { selector: 'dt' })).toBeInTheDocument();
    expect(within(part).getByText('採択されても、要望がそのまま実現するとは限りません。採択と実現は別です。')).toBeInTheDocument();
    expect(within(part).getByText(/名前や住所は、会議録や議会の資料にのることがあります/)).toBeInTheDocument();
  });

  it('パブコメの書き方から、請願・陳情の書き方へ行ける（準備中ではない）', () => {
    open('#/guide/public-comment');
    const next = screen.getByRole('heading', { level: 2, name: 'ほかの届け方' }).closest('section')!;
    const link = within(next).getByRole('link', { name: /請願・陳情の書き方/ });
    expect(link).toHaveAttribute('href', '#/guide/petition');
    expect(link.parentElement!.textContent).not.toContain('準備中');
  });
});

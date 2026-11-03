// パブコメの書き方（#/guide/public-comment）
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import { PROMPTS, PUBCOM_CHECKLIST, PUBCOM_PARTS, PUBCOM_STEPS, templateText } from '../src/content/pubcomManual';

function open(hash = '#/guide/public-comment') {
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

describe('パブコメの書き方', () => {
  it('題名・副題・トップへ戻る。準備中ではない', () => {
    open();
    expect(screen.getByRole('heading', { level: 1, name: 'パブコメの書き方' })).toBeInTheDocument();
    expect(screen.getByText('自分の意見を、伝わる形に。')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '声を届ける。トップへ戻る' })[0]).toHaveAttribute('href', '#/');
    expect(screen.queryByText('このページで案内する予定の内容')).not.toBeInTheDocument();
    expect(document.title).toBe('パブコメの書き方｜声を届ける。');
  });

  it('4つの入り口から、それぞれのまとまりへ移れる', () => {
    open();
    const nav = screen.getByRole('navigation', { name: 'このページの内容' });
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(4);
    PUBCOM_PARTS.forEach((p, i) => {
      expect(links[i]).toHaveAttribute('href', `#/guide/public-comment?s=${p.id}`);
      expect(screen.getByRole('heading', { level: 2, name: p.title })).toBeInTheDocument();
    });
  });

  it('3分でわかる：流れ・多数決ではないこと・4ステップ・良い例と悪い例', () => {
    open();
    expect(screen.getByRole('list', { name: 'パブコメの流れ' }).children).toHaveLength(4);
    expect(screen.getByText('多数決ではない')).toBeInTheDocument();
    expect(screen.getByText('個別の返事は約束されていない')).toBeInTheDocument();
    for (const s of PUBCOM_STEPS) expect(screen.getByRole('heading', { level: 4, name: new RegExp(`STEP ${s.no}\\s*${s.title}`) })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: '伝わりにくい意見' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: '検討しやすい意見' })).toBeInTheDocument();
    expect(screen.getByText('気持ちを、具体的な提案に。')).toBeInTheDocument();
  });

  it('意見の基本形をコピーできる', async () => {
    const writeText = mockClipboard();
    open();
    await userEvent.click(screen.getByRole('button', { name: 'ひな形をコピー' }));
    expect(writeText).toHaveBeenCalledWith(templateText());
    expect(templateText()).toMatch(/^【対象箇所】\n第○条第○項について\n\n【意見・結論】/);
  });

  it('指示文：最初は「資料を理解したい」。5つの目的で切りかわり、どれも全文をコピーできる', async () => {
    const writeText = mockClipboard();
    open();
    const group = screen.getByRole('group', { name: 'やりたいことを選ぶ' });
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(5);
    expect(radios[0]).toBeChecked();
    for (const p of PROMPTS) {
      await userEvent.click(within(group).getByRole('radio', { name: new RegExp(p.label) }));
      expect(promptText()).toHaveAccessibleName(`AIへの指示文（${p.label}）`);
      expect(promptText().textContent).toBe(p.text.trimEnd());
      await userEvent.click(screen.getByRole('button', { name: 'AIへの指示文をコピー' }));
      expect(writeText).toHaveBeenLastCalledWith(p.text);
      expect(screen.getByRole('button', { name: 'コピーしました' })).toBeInTheDocument();
    }
    expect(writeText).toHaveBeenCalledTimes(5);
  });

  it('指示文はキーボードの矢印で選び直せる', async () => {
    open();
    const group = screen.getByRole('group', { name: 'やりたいことを選ぶ' });
    within(group).getAllByRole('radio')[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(within(group).getByRole('radio', { name: /自分の意見を文章にしたい/ })).toBeChecked();
    expect(promptText().textContent).toContain('次の私の考えを、パブリックコメントとして伝わりやすい文章に整理してください。');
  });

  it('コピーできなかったときは、手でコピーする案内を出し、指示文を選択した状態にする', async () => {
    mockClipboard(false);
    document.execCommand = vi.fn().mockReturnValue(false);
    open();
    await userEvent.click(screen.getByRole('button', { name: 'AIへの指示文をコピー' }));
    expect(screen.getByText(/コピーできませんでした/)).toBeInTheDocument();
    const sel = window.getSelection()!;
    expect(sel.rangeCount).toBe(1);
    expect(sel.getRangeAt(0).toString()).toBe(PROMPTS[0].text.trimEnd());
  });

  it('選んだ指示文は、ほかのページへ行って戻っても、再読み込みしても残る。AIは使わなくてよいと伝える', async () => {
    const view = open();
    expect(screen.getByText(/使わなくても意見は出せます/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: /もっと深く調べたい/ }));
    view.unmount();
    open('#/guide/public-comment');
    expect(screen.getByRole('radio', { name: /もっと深く調べたい/ })).toBeChecked();
    expect(promptText()).toHaveAccessibleName('AIへの指示文（もっと深く調べたい）');
  });

  it('「AIでできること」や再検証のボタンから、その指示文を選んだ状態になる', async () => {
    open();
    await userEvent.click(screen.getByRole('button', { name: '「別のAIで再検証したい」の指示文を使う' }));
    expect(screen.getByRole('radio', { name: /別のAIで再検証したい/ })).toBeChecked();
    expect(promptText().textContent).toContain('前のAIの回答に迎合せず、独立して判断してください。');
    await userEvent.click(screen.getAllByRole('button', { name: /指示文を見る\s*（もっと深く調べたい）/ })[0]);
    expect(screen.getByRole('radio', { name: /もっと深く調べたい/ })).toBeChecked();
  });

  it('もっと詳しく調べる：最初は閉じていて、公式の調べ先へのリンクがある', () => {
    open();
    const part = document.getElementById('research')!;
    const details = part.querySelectorAll('details.chapter');
    expect(details).toHaveLength(4);
    expect([...details].some((d) => (d as HTMLDetailsElement).open)).toBe(false);
    expect(within(part).getByRole('link', { name: /e-Gov法令検索/ })).toHaveAttribute('href', 'https://laws.e-gov.go.jp/');
    expect(within(part).getByRole('link', { name: /e-Stat/ })).toHaveAttribute('href', 'https://www.e-stat.go.jp/');
    expect(within(part).getByText('AIが2つとも同じ回答でも、正しいとは限りません。最後は必ず公式資料と照合してください。')).toBeInTheDocument();
  });

  it('提出前チェック：数と棒が進み、全部でまとめの言葉。外せる', async () => {
    open();
    const list = screen.getByRole('group', { name: '提出する前に' });
    const boxes = within(list).getAllByRole('checkbox');
    expect(boxes).toHaveLength(PUBCOM_CHECKLIST.length);
    const bar = list.querySelector('.checklist-meter > span') as HTMLElement;
    expect(bar.style.width).toBe('0%');
    await userEvent.click(boxes[0]);
    expect(within(list).getByText(`${PUBCOM_CHECKLIST.length}項目中 1項目を確認済み`)).toBeInTheDocument();
    for (const b of boxes.slice(1)) await userEvent.click(b);
    expect(bar.style.width).toBe('100%');
    expect(within(list).getByText(/すべて確認できました。募集要項に書かれた方法で提出しましょう。/)).toBeInTheDocument();
    await userEvent.click(within(list).getByRole('button', { name: 'チェックをすべて外す' }));
    expect(boxes.every((b) => !(b as HTMLInputElement).checked)).toBe(true);
  });

  it('提出：公式の案件一覧とパブコメ掲示板へ行ける。問い合わせは電話・メールのガイドへ', () => {
    open();
    const part = document.getElementById('submit')!;
    expect(within(part).getByRole('link', { name: /e-Govパブリック・コメント/ })).toHaveAttribute('href', 'https://public-comment.e-gov.go.jp/');
    expect(within(part).getByRole('link', { name: /パブコメ掲示板/ })).toHaveAttribute('href', 'https://yumaki5555.github.io/pubcome/');
    expect(within(part).getByRole('link', { name: '電話で問い合わせる' })).toHaveAttribute('href', '#/guide/phone');
    expect(within(part).getByRole('link', { name: 'メールで問い合わせる' })).toHaveAttribute('href', '#/guide/email');
  });
});

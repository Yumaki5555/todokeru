// メール・フォームのガイド
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import type { Contact } from '../src/types';
import { dataOverrides } from './setup';

function open(hash: string) {
  window.location.hash = hash;
  return render(<App />);
}

const maker = () => screen.getByRole('region', { name: '文面を作る' });

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return writeText;
}

const contact: Contact = {
  id: '131083-feedback',
  type: 'feedback',
  department: 'テスト広聴課',
  phone: '03-0000-0000',
  email: 'koe@example.jp',
  form_url: 'https://example.jp/form',
  postal_code: null,
  postal_address: null,
  hours: null,
  source_url: 'https://example.jp/contact',
  verified_at: '2026-10-01',
  status: 'verified',
};

function setContact(c: Partial<Contact> = {}) {
  dataOverrides.set('contacts/13.json', [{ municipality_code: '131083', municipality_name: '江東区', contacts: [{ ...contact, ...c }] }]);
}

describe('メール・フォーム：文面を作る', () => {
  it('送り先を選ぶ前でも件名・本文を作ってコピーできる。送るボタンは送り先を選んでから', async () => {
    const writeText = mockClipboard();
    open('#/guide/email');
    expect(screen.getByRole('heading', { level: 1, name: 'メール・フォーム・郵送で届ける' })).toBeInTheDocument();
    const m = maker();
    expect(within(m).getByRole('link', { name: '先に送り先を探す' })).toHaveAttribute('href', '#/contacts');
    expect(within(m).queryByRole('link', { name: 'メールアプリで開く' })).not.toBeInTheDocument();
    expect(within(m).getByText(/送り先を選ぶと、ここに「メールアプリで開く」「公式フォームを開く」のボタンが出ます/)).toBeInTheDocument();
    await userEvent.type(within(m).getByLabelText('何について？'), 'A計画');
    expect(within(m).getByLabelText('件名')).toHaveValue('【意見】A計画について');
    await userEvent.click(within(m).getByRole('button', { name: '本文をコピー' }));
    expect(writeText).toHaveBeenLastCalledWith(
      'ご担当者様\n\n突然のご連絡失礼いたします。\n\nA計画について、懸念があります。\n\n意見として記録していただけますよう、お願いいたします。\n\nお忙しいところ恐れ入りますが、よろしくお願いいたします。',
    );
    expect(screen.getByRole('region', { name: '送り先' })).toBeInTheDocument();
  });

  it('電話の台本で入れた内容を引き継ぐ。電話用に直した文は台本に残し、メールは共通の入力から作る', async () => {
    const phone = open('#/guide/phone');
    await userEvent.type(screen.getByLabelText('何について？'), 'B制度');
    await userEvent.click(screen.getByRole('radio', { name: '質問する' }));
    await userEvent.type(screen.getByLabelText(/聞きたいことは？/), 'いつから始まるか');
    const phoneMain = screen.getByRole('textbox', { name: '本題' });
    await userEvent.clear(phoneMain);
    await userEvent.type(phoneMain, '電話用の文');
    phone.unmount();
    open('#/guide/email');
    const m = maker();
    expect(within(m).getByRole('radio', { name: '質問する' })).toBeChecked();
    expect(within(m).getByLabelText('何について？')).toHaveValue('B制度');
    expect(within(m).getByLabelText('件名')).toHaveValue('【質問】B制度について');
    expect(within(m).getByRole('textbox', { name: '本題' })).toHaveValue('B制度について、いつから始まるかを教えていただけますか？');
  });

  it('返信は最初「指定しない」で文に入れない。選んだときだけ一文を加える', async () => {
    open('#/guide/email');
    const m = maker();
    expect(within(m).getByRole('radio', { name: '指定しない' })).toBeChecked();
    expect((within(m).getByRole('textbox', { name: 'お願い' }) as HTMLTextAreaElement).value).not.toContain('回答');
    await userEvent.click(within(m).getByRole('radio', { name: '返信を希望する' }));
    expect((within(m).getByRole('textbox', { name: 'お願い' }) as HTMLTextAreaElement).value).toContain('ご回答いただけますと幸いです。');
  });

  it('窓口検索から来ると送り先が入り、メールアプリで開ける（件名と本文入り）', async () => {
    setContact();
    open('#/guide/email?for=131083-feedback');
    const box = screen.getByRole('region', { name: '送り先' });
    expect(await within(box).findByText('テスト広聴課')).toBeInTheDocument();
    expect(within(box).getByText('koe@example.jp')).toBeInTheDocument();
    await waitFor(() => expect(window.location.hash).toBe('#/guide/email'));
    const send = within(maker()).getByRole('link', { name: 'メールアプリで開く' });
    expect(send.getAttribute('href')).toMatch(/^mailto:koe@example\.jp\?subject=.+&body=.+/);
    expect(within(maker()).getByRole('textbox', { name: '宛名' })).toHaveValue('江東区\nテスト広聴課 ご担当者様');
  });

  it('フォームを選ぶと、文字数と「公式フォームを開く」（新しいタブ）が出る', async () => {
    setContact();
    open('#/guide/email?for=131083-feedback');
    await within(screen.getByRole('region', { name: '送り先' })).findByText('テスト広聴課');
    const m = maker();
    expect(within(m).queryByText(/文字数：/)).not.toBeInTheDocument();
    await userEvent.click(within(m).getByRole('radio', { name: '問い合わせフォーム' }));
    expect(within(m).getByText(/文字数：件名 \d+字・本文 \d+字/)).toBeInTheDocument();
    const form = within(m).getByRole('link', { name: /公式フォームを開く/ });
    expect(form).toHaveAttribute('href', 'https://example.jp/form');
    expect(form).toHaveAttribute('target', '_blank');
    expect(within(m).getByText(/受付番号や確認の画面は/)).toBeInTheDocument();
  });

  it('直接開くとエラーになるフォームは、フォームのある公式ページを開き、押す文字を伝える', async () => {
    setContact({ form_via_page: '県政へのご意見' });
    open('#/guide/email?for=131083-feedback');
    const box = screen.getByRole('region', { name: '送り先' });
    await within(box).findByText('テスト広聴課');
    // 送り先の欄でも、公式ページから開くことを伝える
    const way = within(box).getByText(/の「県政へのご意見」から開く/);
    expect(within(way).getByRole('link', { name: /公式ページ/ })).toHaveAttribute('href', 'https://example.jp/contact');
    const m = maker();
    await userEvent.click(within(m).getByRole('radio', { name: '問い合わせフォーム' }));
    const page = within(m).getByRole('link', { name: /フォームのある公式ページを開く/ });
    expect(page).toHaveAttribute('href', 'https://example.jp/contact');
    expect(page).toHaveAttribute('target', '_blank');
    expect(within(m).getByText(/開いたページの「県政へのご意見」を押すと、フォームが開きます/)).toBeInTheDocument();
    expect(within(m).queryByRole('link', { name: /公式フォームを開く/ })).not.toBeInTheDocument();
  });

  it('フォームしかない窓口を選ぶと、届け方はフォームになる', async () => {
    setContact({ email: null });
    open('#/guide/email?for=131083-feedback');
    await within(screen.getByRole('region', { name: '送り先' })).findByText('テスト広聴課');
    await waitFor(() => expect(within(maker()).getByRole('radio', { name: '問い合わせフォーム' })).toBeChecked());
  });

  it('住所しかない窓口から来ると郵送になり、手紙の形で印刷できる（文字数ではなく印刷と郵送の注意を出す）', async () => {
    const writeText = mockClipboard();
    const print = vi.fn();
    vi.stubGlobal('print', print);
    setContact({ phone: null, email: null, form_url: null, postal_code: '135-8383', postal_address: '東京都江東区東陽4-11-28' });
    open('#/guide/email?for=131083-feedback');
    const box = screen.getByRole('region', { name: '送り先' });
    await within(box).findByText('テスト広聴課');
    expect(within(box).getByText('〒135-8383 東京都江東区東陽4-11-28')).toBeInTheDocument();
    const m = maker();
    await waitFor(() => expect(within(m).getByRole('radio', { name: '郵送（手紙）' })).toBeChecked());
    expect(within(m).getByRole('textbox', { name: '宛先' })).toHaveValue('〒135-8383\n東京都江東区東陽4-11-28\n江東区\nテスト広聴課 御中');
    expect(within(m).queryByRole('textbox', { name: '宛名' })).not.toBeInTheDocument();
    expect((within(m).getByRole('textbox', { name: '日付' }) as HTMLTextAreaElement).value).toMatch(/^\d{4}年\d{1,2}月\d{1,2}日$/);
    expect(within(m).getByRole('textbox', { name: '件名' })).toHaveValue('【意見】○○について');
    expect(within(m).queryByText(/文字数：/)).not.toBeInTheDocument();
    expect(within(m).queryByRole('link', { name: 'メールアプリで開く' })).not.toBeInTheDocument();
    expect(within(m).getByText(/最後に「御中」/)).toBeInTheDocument();
    expect(within(m).queryByText(/受付番号や確認の画面は/)).not.toBeInTheDocument();

    await userEvent.click(within(m).getByRole('button', { name: '印刷する' }));
    expect(print).toHaveBeenCalledTimes(1);
    // 印刷する手紙は、ページの外側に置く（印刷ではこれだけを出す）
    const sheet = document.querySelector('.letter-sheet')!;
    expect(sheet.parentElement).toBe(document.body);
    expect(sheet.querySelector('.letter-address')).toHaveTextContent('テスト広聴課 御中');
    expect(sheet.querySelector('.letter-subject')).toHaveTextContent('【意見】○○について');

    await userEvent.click(within(m).getByRole('button', { name: '手紙の文面をコピー' }));
    expect(writeText.mock.calls[0][0]).toMatch(/^\d{4}年\d{1,2}月\d{1,2}日\n\n〒135-8383\n東京都江東区東陽4-11-28\n江東区\nテスト広聴課 御中\n\n【意見】○○について\n\n突然の/);

    // メールを選ぶと、手紙は消え、メールアドレスがないことを知らせる
    await userEvent.click(within(m).getByRole('radio', { name: 'メール' }));
    expect(document.querySelector('.letter-sheet')).toBeNull();
    expect(within(m).getByText(/メールアドレスが載っていません/)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('住所のない窓口で郵送を選ぶと、住所を確かめて書き足すよう知らせる', async () => {
    setContact();
    open('#/guide/email?for=131083-feedback');
    await within(screen.getByRole('region', { name: '送り先' })).findByText('テスト広聴課');
    const m = maker();
    await userEvent.click(within(m).getByRole('radio', { name: '郵送（手紙）' }));
    expect(within(m).getByText(/住所が載っていません。公式ページで住所を確かめて/)).toBeInTheDocument();
    expect(within(m).getByRole('textbox', { name: '宛先' })).toHaveValue('江東区\nテスト広聴課 御中');
  });

  it('送ったあとの記録は、日時・送り先・件名が入った状態で開き、まとめてコピーできる', async () => {
    const writeText = mockClipboard();
    setContact();
    open('#/guide/email?for=131083-feedback');
    await within(screen.getByRole('region', { name: '送り先' })).findByText('テスト広聴課');
    const memo = document.getElementById('memo') as HTMLDetailsElement;
    expect(memo.open).toBe(false);
    await userEvent.click(within(memo).getByText('送ったあとに記録を残す'));
    await waitFor(() => expect(screen.getByLabelText('送った日時')).not.toHaveValue(''));
    expect(within(memo).getByLabelText('送り先')).toHaveValue('江東区 テスト広聴課');
    expect(within(memo).getByLabelText('件名')).toHaveValue('【意見】○○について');
    await userEvent.click(within(memo).getByRole('button', { name: '記録をまとめてコピー' }));
    expect(writeText.mock.calls[0][0]).toMatch(/^【送った記録】\n日時：.+\n送り先：江東区 テスト広聴課\n方法：メール\n件名：【意見】○○について$/);
  });

  it('「入力を消す」は、電話の台本と共通の内容とメールの名乗りを消す', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    open('#/guide/email');
    const m = maker();
    await userEvent.type(within(m).getByLabelText('何について？'), 'A計画');
    await userEvent.type(within(m).getByLabelText(/^名前/), '山田');
    await userEvent.click(within(m).getByRole('button', { name: '入力を消す' }));
    expect(within(m).getByLabelText('何について？')).toHaveValue('');
    expect(within(m).getByLabelText(/^名前/)).toHaveValue('');
  });
});

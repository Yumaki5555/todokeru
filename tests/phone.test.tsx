// 電話ガイド
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import { SupervisorNote } from '../src/components/SupervisorNote';
import { BASIC_SCRIPT, PHONE_CHAPTERS } from '../src/content/phoneManual';
import { SUPERVISION } from '../src/site';
import type { Contact } from '../src/types';
import { dataOverrides } from './setup';

function openPhone(hash = '#/guide/phone') {
  window.location.hash = hash;
  return render(<App />);
}

const maker = () => screen.getByRole('region', { name: '台本を作る' });
const part = (name: string) => within(maker()).getByRole('textbox', { name }) as HTMLTextAreaElement;

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return writeText;
}

describe('電話ガイド：台本を作る', () => {
  it('ページの最初は「台本を作る」。目的は3つで、最初は「意見を伝える」。マニュアルはその後', () => {
    openPhone();
    const m = maker();
    for (const name of ['意見を伝える', '質問する', '担当部署を確認する']) expect(within(m).getByRole('radio', { name })).toBeInTheDocument();
    expect(within(m).getByRole('radio', { name: '意見を伝える' })).toBeChecked();
    const manual = screen.getByRole('region', { name: '詳しいマニュアル' });
    expect(m.compareDocumentPosition(manual) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // 入力内容を送らないこと・保存のしかたを書いている
    expect(within(m).getByText(/入力した内容は送信しません。このタブを閉じるまで、この端末にだけ一時保存します/)).toBeInTheDocument();
  });

  it('1行ずつのコピーはなく、コピーは「台本をまとめてコピー」の1つだけ', async () => {
    const writeText = mockClipboard();
    openPhone();
    expect(screen.queryByRole('button', { name: 'この台本をコピー' })).not.toBeInTheDocument();
    const copies = within(maker()).getAllByRole('button', { name: /コピー/ });
    expect(copies).toHaveLength(1);
    await userEvent.type(screen.getByLabelText('何について？'), 'A計画');
    await userEvent.click(copies[0]);
    expect(writeText).toHaveBeenCalledWith(
      'お忙しいところ失礼します。\nA計画について、懸念があります。\n意見として記録をお願いします。\nご対応ありがとうございました。',
    );
    expect(await within(maker()).findByRole('button', { name: 'コピーしました' })).toBeInTheDocument();
  });

  it('入力すると、あいさつ・本題・記録のお願い・お礼がつながった台本になる', async () => {
    openPhone();
    expect(part('本題').value).toBe('○○について、懸念があります。');
    await userEvent.type(screen.getByLabelText('何について？'), '駅前の再開発計画');
    await userEvent.type(screen.getByLabelText(/理由は？/), '子どもの安全');
    expect(part('あいさつ').value).toBe('お忙しいところ失礼します。');
    expect(part('本題').value).toBe('駅前の再開発計画について、子どもの安全の面から懸念があります。');
    expect(part('記録のお願い').value).toBe('意見として記録をお願いします。');
    expect(part('お礼').value).toBe('ご対応ありがとうございました。');
    await userEvent.click(screen.getByRole('radio', { name: '見直してほしい' }));
    expect(part('本題').value).toBe('駅前の再開発計画について、子どもの安全の面から見直しが必要だと考えています。');
  });

  it('質問するときは記録のお願いを最初は入れず、必要なら選べる', async () => {
    openPhone();
    await userEvent.click(screen.getByRole('radio', { name: '質問する' }));
    await userEvent.type(screen.getByLabelText('何について？'), '○○制度');
    await userEvent.type(screen.getByLabelText(/聞きたいことは？/), '始めた理由');
    expect(part('本題').value).toBe('○○制度について、始めた理由を教えていただけますか？');
    const record = within(maker()).getByRole('checkbox', { name: '記録のお願い' });
    expect(record).not.toBeChecked();
    expect(within(maker()).queryByRole('textbox', { name: '記録のお願い' })).not.toBeInTheDocument();
    await userEvent.click(record);
    expect(part('記録のお願い').value).toBe('この件を記録していただけますか？');
  });

  it('担当部署を確認するときは、入力欄は「何について？」だけ', async () => {
    openPhone();
    await userEvent.click(screen.getByRole('radio', { name: '担当部署を確認する' }));
    expect(screen.queryByLabelText(/理由は？|聞きたいことは？/)).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('何について？'), '道路の補修');
    expect(part('本題').value).toBe('道路の補修について確認したいのですが、ご担当の部署を教えていただけますか？');
  });

  it('台本は書き直せて、「自動の文に戻す」で元に戻せる', async () => {
    openPhone();
    const main = part('本題');
    await userEvent.clear(main);
    await userEvent.type(main, '自分の言葉で伝えます。');
    expect(part('本題').value).toBe('自分の言葉で伝えます。');
    // 書き直した文は、入力を変えても消えない
    await userEvent.type(screen.getByLabelText('何について？'), 'A計画');
    expect(part('本題').value).toBe('自分の言葉で伝えます。');
    await userEvent.click(within(maker()).getByRole('button', { name: '自動の文に戻す' }));
    expect(part('本題').value).toBe('A計画について、懸念があります。');
    expect(within(maker()).queryByRole('button', { name: '自動の文に戻す' })).not.toBeInTheDocument();
  });

  it('入力は再読み込みしても残り、「入力を消す」で消せる', async () => {
    const first = openPhone();
    await userEvent.type(screen.getByLabelText('何について？'), 'A計画');
    first.unmount();
    openPhone();
    expect(screen.getByLabelText('何について？')).toHaveValue('A計画');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: '入力を消す' }));
    expect(confirm).toHaveBeenCalled();
    expect(screen.getByLabelText('何について？')).toHaveValue('');
  });
});

describe('電話ガイド：大きな文字で読む', () => {
  it('ボタンで開くと、台本だけを読む順に番号つきで出し、戻るで入力画面に戻る', async () => {
    openPhone();
    await userEvent.type(screen.getByLabelText('何について？'), 'A計画');
    await userEvent.click(screen.getByRole('button', { name: '大きな文字で読む' }));
    expect(window.location.hash).toBe('#/guide/phone?view=read');
    const reader = await screen.findByRole('dialog', { name: '台本を大きな文字で読む' });
    expect(reader).toHaveAttribute('open');
    const lines = within(reader).getAllByRole('listitem');
    expect(lines.map((li) => li.textContent)).toEqual([
      '1あいさつお忙しいところ失礼します。',
      '2本題A計画について、懸念があります。',
      '3記録のお願い意見として記録をお願いします。',
      '4お礼ご対応ありがとうございました。',
    ]);
    // 電話先を選んでいなければ、発信のボタンは出さない
    expect(within(reader).queryByRole('link', { name: /電話をかける/ })).not.toBeInTheDocument();
    await userEvent.click(within(reader).getByRole('button', { name: '戻る' }));
    await waitFor(() => expect(window.location.hash).toBe('#/guide/phone'));
    expect(reader).not.toHaveAttribute('open');
    expect(screen.getByLabelText('何について？')).toHaveValue('A計画');
  });

  it('再読み込みしても読む画面と台本が消えない', async () => {
    const first = openPhone();
    await userEvent.type(screen.getByLabelText('何について？'), 'A計画');
    first.unmount();
    openPhone('#/guide/phone?view=read');
    const reader = screen.getByRole('dialog', { name: '台本を大きな文字で読む' });
    expect(reader).toHaveAttribute('open');
    expect(within(reader).getByText('A計画について、懸念があります。')).toBeInTheDocument();
    await userEvent.click(within(reader).getByRole('button', { name: '戻る' }));
    expect(window.location.hash).toBe('#/guide/phone');
    expect(reader).not.toHaveAttribute('open');
  });

  it('文字の大きさを変えられ、選んだ大きさを覚えておく', async () => {
    openPhone('#/guide/phone?view=read');
    const reader = screen.getByRole('dialog');
    const list = within(reader).getByRole('list');
    const bigger = within(reader).getByRole('button', { name: '文字を大きく' });
    const smaller = within(reader).getByRole('button', { name: '文字を小さく' });
    // テストの画面では高さが測れないので、いちばん大きな文字になる
    expect(bigger).toBeDisabled();
    const before = parseInt(list.style.fontSize);
    await userEvent.click(smaller);
    expect(parseInt(list.style.fontSize)).toBeLessThan(before);
    expect(window.localStorage.getItem('todokeru:read-size')).not.toBeNull();
  });

  it('「メモを書く」で読む画面を閉じ、メモ欄を開く（日時は自動で入る）', async () => {
    openPhone('#/guide/phone?view=read');
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'メモを書く' }));
    const memo = document.getElementById('memo') as HTMLDetailsElement;
    await waitFor(() => expect(memo.open).toBe(true));
    expect((screen.getByLabelText('日時') as HTMLInputElement).value).toMatch(/^\d{4}年\d{1,2}月\d{1,2}日 \d{1,2}:\d{2}$/);
  });
});

describe('電話ガイド：電話先と通話メモ', () => {
  const contact: Contact = {
    id: '131083-feedback',
    type: 'feedback',
    department: 'テスト広聴課',
    phone: '03-0000-0000',
    email: null,
    form_url: null,
    postal_code: null,
    postal_address: null,
    hours: '平日 8時30分〜17時',
    source_url: 'https://example.jp/contact',
    verified_at: '2026-10-01',
    status: 'verified',
  };

  it('電話先を選んでいなければ、窓口検索へ案内する', () => {
    openPhone();
    const box = screen.getByRole('region', { name: '電話先' });
    expect(within(box).getByRole('link', { name: '電話先を探す' })).toHaveAttribute('href', '#/contacts');
  });

  it('窓口検索から来ると、入力中の台本はそのままで電話先が入り、タップで発信できる', async () => {
    const first = openPhone();
    await userEvent.type(screen.getByLabelText('何について？'), 'A計画');
    first.unmount();
    dataOverrides.set('contacts/13.json', [{ municipality_code: '131083', municipality_name: '江東区', contacts: [contact] }]);
    openPhone('#/guide/phone?for=131083-feedback');
    const box = screen.getByRole('region', { name: '電話先' });
    expect(await within(box).findByText('テスト広聴課')).toBeInTheDocument();
    expect(within(box).getByText('江東区')).toBeInTheDocument();
    expect(within(box).getByRole('link', { name: /電話をかける\s*：\s*03-0000-0000/ })).toHaveAttribute('href', 'tel:0300000000');
    expect(within(box).getByText(/最終確認日：2026年10月1日/)).toBeInTheDocument();
    expect(within(box).getByRole('link', { name: '電話先を変える' })).toHaveAttribute('href', '#/contacts?tab=area&code=131083');
    expect(screen.getByLabelText('何について？')).toHaveValue('A計画');
    await waitFor(() => expect(window.location.hash).toBe('#/guide/phone'));
    // 読む画面からも発信できる（発信は利用者が押したときだけ）
    await userEvent.click(screen.getByRole('button', { name: '大きな文字で読む' }));
    const reader = await screen.findByRole('dialog');
    expect(within(reader).getByRole('link', { name: /江東区に電話をかける\s*：\s*03-0000-0000/ })).toHaveAttribute('href', 'tel:0300000000');
  });

  it('未確認の窓口は電話先にしない', async () => {
    dataOverrides.set('contacts/13.json', [
      { municipality_code: '131083', municipality_name: '江東区', contacts: [{ ...contact, status: 'unverified' }] },
    ]);
    openPhone('#/guide/phone?for=131083-feedback');
    const box = screen.getByRole('region', { name: '電話先' });
    expect(await within(box).findByRole('alert')).toHaveTextContent('選んだ窓口を読み込めませんでした');
    expect(within(box).queryByText(/03-0000-0000/)).not.toBeInTheDocument();
  });

  it('通話メモは必要なときだけ開き、日時・電話先・回答をまとめてコピーできる', async () => {
    const writeText = mockClipboard();
    openPhone();
    const memo = document.getElementById('memo') as HTMLDetailsElement;
    expect(memo.open).toBe(false);
    await userEvent.type(screen.getByLabelText('何について？'), 'A計画');
    await userEvent.click(within(memo).getByText('電話のあとにメモを残す'));
    await waitFor(() => expect(screen.getByLabelText('日時')).not.toHaveValue(''));
    await userEvent.type(screen.getByLabelText('電話先・部署'), '○○市 広聴課');
    await userEvent.type(screen.getByLabelText('回答の内容'), '担当課に伝えると言われた');
    await userEvent.click(within(memo).getByRole('button', { name: 'メモをまとめてコピー' }));
    const text = writeText.mock.calls[0][0] as string;
    expect(text).toMatch(/^【通話メモ】\n日時：\d{4}年/);
    expect(text).toContain('電話先：○○市 広聴課');
    expect(text).toContain('伝えたこと：A計画について、懸念があります。');
    expect(text).toContain('回答：担当課に伝えると言われた');
  });
});

describe('電話ガイド：マニュアル', () => {
  it('題名・副題と、このサイトのトップへ戻るリンク', () => {
    openPhone();
    expect(screen.getByRole('heading', { level: 1, name: 'はじめての行政電話ガイド' })).toBeInTheDocument();
    expect(screen.getByText('台本は1行でいい。')).toBeInTheDocument();
    const backs = screen.getAllByRole('link', { name: '声を届ける。トップへ戻る' });
    expect(backs.length).toBeGreaterThanOrEqual(2); // 上と下
    backs.forEach((a) => expect(a).toHaveAttribute('href', '#/'));
    expect(screen.getByRole('link', { name: '日本を知る。トップへ戻る' })).toHaveAttribute('href', 'https://yumaki5555.github.io/');
    expect(screen.getByRole('button', { name: 'ページ先頭へ戻る' })).toBeInTheDocument();
  });

  it('監修の表示がマニュアルの冒頭と末尾にあり、確認中はそう表示する。道具は監修の対象外と書く', () => {
    openPhone();
    const notes = screen.getAllByRole('complementary', { name: 'このガイドの監修について' });
    expect(notes).toHaveLength(2);
    for (const n of notes) {
      expect(within(n).getByRole('link', { name: /電突の牙さん/ })).toHaveAttribute('href', 'https://x.com/MinNanoRamen21');
      expect(within(n).getByText('監修確認中')).toBeInTheDocument();
    }
    expect(within(notes[1]).getByText(/「台本を作る」「大きな文字で読む」などの道具や、声を届ける。のほかのページは監修の対象ではありません/)).toBeInTheDocument();
    // 監修の表示は台本づくりの中には置かない（監修済みと混同しないように）
    expect(within(maker()).queryByText(/監修/)).not.toBeInTheDocument();
  });

  it('監修の確認が取れたら「マニュアル監修：電突の牙さん」と表示する', () => {
    render(<SupervisorNote place="bottom" supervision={{ ...SUPERVISION, status: 'confirmed', confirmedAt: '2026-11-01' }} />);
    expect(screen.getByText(/マニュアル監修：/)).toBeInTheDocument();
    expect(screen.queryByText('監修確認中')).not.toBeInTheDocument();
    expect(screen.getByText(/ほかのページは監修の対象ではありません/)).toBeInTheDocument();
  });

  it('監修なしのときは「監修は受けていません」と表示する', () => {
    render(<SupervisorNote place="top" supervision={{ ...SUPERVISION, status: 'none' }} />);
    expect(screen.getByText(/監修は受けていません/)).toBeInTheDocument();
    expect(screen.queryByText(/マニュアル監修：/)).not.toBeInTheDocument();
  });

  it('第0章〜第7章は折りたたみで、最初はすべて閉じている', () => {
    openPhone();
    const chapters = document.querySelectorAll('details.chapter');
    expect(chapters).toHaveLength(8);
    expect(PHONE_CHAPTERS.map((c) => c.title)).toEqual([
      'これは抗議ではない',
      '台本は1行でいい',
      '国の行政機関',
      '所管省庁への質問・意見',
      '自治体への電話',
      '議会・立法への意見',
      '司法制度',
      '電話の締め方',
    ]);
    expect([...chapters].some((d) => (d as HTMLDetailsElement).open)).toBe(false);
  });

  it('「目的から探す」で章へ移動すると、閉じた章が開く', async () => {
    openPhone();
    const toc = screen.getByRole('navigation', { name: '目的から探す' });
    await userEvent.click(within(toc).getByRole('link', { name: /第5章\s*議会に意見を届けたい/ }));
    const ch5 = document.getElementById('ch5') as HTMLDetailsElement;
    expect(ch5.open).toBe(true);
    expect(ch5.scrollIntoView).toHaveBeenCalled();
  });

  it('台本の例（原案の4つの型）と、記録の注意書きは残っている', () => {
    openPhone();
    for (const t of [BASIC_SCRIPT.text, '○○という政策について、理由を教えていただけますか？', '○○について、△△の理由から懸念があります。', 'この意見を記録していただくことはできますか？']) {
      expect(screen.getByText(`「${t}」`)).toBeInTheDocument();
    }
    expect(screen.getByText(/記録をお願いしても、正式な記録として残されたり、担当部署に伝えられたりすることが保証されるわけではありません/)).toBeInTheDocument();
  });

  it('電話前チェックリストを付けたり外したりできる', async () => {
    openPhone();
    const list = screen.getByRole('group', { name: '電話をかける前に' });
    const boxes = within(list).getAllByRole('checkbox');
    expect(boxes).toHaveLength(8);
    await userEvent.click(boxes[0]);
    await userEvent.click(within(list).getByText('メモとペンを用意した'));
    expect(within(list).getByText('8項目中 2項目を確認済み')).toBeInTheDocument();
    for (const b of boxes) if (!(b as HTMLInputElement).checked) await userEvent.click(b);
    expect(within(list).getByText(/8項目すべて確認できました/)).toBeInTheDocument();
    await userEvent.click(within(list).getByRole('button', { name: 'チェックをすべて外す' }));
    expect(within(list).getByText('8項目中 0項目を確認済み')).toBeInTheDocument();
  });

  it('ページ先頭へ戻れる', async () => {
    openPhone();
    await userEvent.click(screen.getByRole('button', { name: 'ページ先頭へ戻る' }));
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('個別の議員の連絡先は載せないこと、司法の個別事件の判断変更を勧めないことを書いている', () => {
    openPhone();
    expect(screen.getByText(/個別の議員の連絡先は掲載しません/)).toBeInTheDocument();
    expect(screen.getByText(/電話で個別の事件の判断を変えるよう求めることは、おすすめしません/)).toBeInTheDocument();
  });
});

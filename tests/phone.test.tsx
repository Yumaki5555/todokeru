// 電話ガイド
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

  it('目的を切りかえても、「理由」と「聞きたいこと」は混ざらない', async () => {
    openPhone();
    await userEvent.type(screen.getByLabelText('何について？'), 'A計画');
    await userEvent.type(screen.getByLabelText(/理由は？/), '送迎の距離が長くなるため');
    await userEvent.click(screen.getByRole('radio', { name: '質問する' }));
    expect(screen.getByLabelText(/聞きたいことは？/)).toHaveValue('');
    expect(part('本題').value).toBe('A計画について、現在の仕組みを教えていただけますか？');
    await userEvent.click(screen.getByRole('radio', { name: '意見を伝える' }));
    expect(screen.getByLabelText(/理由は？/)).toHaveValue('送迎の距離が長くなるため');
  });

  it('③の下に「困ったときの一言」（最初は閉じている）があり、代表電話でつないでもらう文は入力に合わせる', async () => {
    openPhone();
    await userEvent.type(screen.getByLabelText('何について？'), 'A計画');
    const fold = within(maker()).getByText('困ったときの一言').closest('details') as HTMLDetailsElement;
    expect(fold.open).toBe(false);
    expect(within(fold).getByText('A計画について意見をお伝えしたいのですが、ご担当の部署につないでいただけますか？')).toBeInTheDocument();
    expect(within(fold).getByText('名前を聞かれたら')).toBeInTheDocument();
    expect(within(fold).getByText('「担当ではない」と言われたら')).toBeInTheDocument();
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
    // ②にも「ここを変えても本題は変わらない」と出す
    const step2 = within(maker()).getByRole('group', { name: '内容を入れる' });
    expect(within(step2).getByText(/③の本題は手で直した文なので/)).toBeInTheDocument();
    const step3 = within(maker()).getByRole('group', { name: /できた台本/ });
    await userEvent.click(within(step3).getByRole('button', { name: '自動の文に戻す' }));
    expect(part('本題').value).toBe('A計画について、懸念があります。');
    expect(within(step2).queryByText(/③の本題は手で直した文なので/)).not.toBeInTheDocument();
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

  it('「困ったとき」で困ったときの一言に切りかわり、「台本に戻る」で台本に戻る', async () => {
    openPhone();
    await userEvent.type(screen.getByLabelText('何について？'), 'A計画');
    await userEvent.click(screen.getByRole('button', { name: '大きな文字で読む' }));
    const reader = await screen.findByRole('dialog', { name: '台本を大きな文字で読む' });
    await userEvent.click(within(reader).getByRole('button', { name: '困ったとき' }));
    expect(within(reader).getByText('困ったときの一言')).toBeInTheDocument();
    expect(within(reader).getByText('A計画について意見をお伝えしたいのですが、ご担当の部署につないでいただけますか？')).toBeInTheDocument();
    expect(within(reader).queryByText('お忙しいところ失礼します。')).not.toBeInTheDocument();
    await userEvent.click(within(reader).getByRole('button', { name: '台本に戻る' }));
    expect(within(reader).getByText('お忙しいところ失礼します。')).toBeInTheDocument();
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

  it('監修の表示はページの上に1か所だけ。監修者の名前と「詳しいマニュアル」ボタンがある', () => {
    openPhone();
    const notes = screen.getAllByRole('complementary', { name: 'このガイドの監修について' });
    expect(notes).toHaveLength(1);
    const n = notes[0];
    expect(within(n).getByText('マニュアル監修')).toBeInTheDocument();
    expect(within(n).getByRole('link', { name: /電突の牙さん/ })).toHaveAttribute('href', 'https://x.com/MinNanoRamen21');
    expect(within(n).queryByText('監修確認中')).not.toBeInTheDocument();
    // 台本づくりより上にある
    expect(n.compareDocumentPosition(maker()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(maker()).queryByText(/監修/)).not.toBeInTheDocument();
    // 「詳しいマニュアル」ボタンでマニュアルへ飛ぶ
    const jump = within(n).getByRole('link', { name: '詳しいマニュアル' });
    expect(jump).toHaveAttribute('href', '#/guide/phone?s=manual');
    fireEvent.click(jump);
    expect(document.activeElement).toBe(document.getElementById('manual'));
  });

  it('監修確認中のときは「監修確認中」と表示する', () => {
    render(<SupervisorNote path="/guide/phone" manualId="manual" supervision={{ ...SUPERVISION, status: 'pending', confirmedAt: null }} />);
    expect(screen.getByText('監修確認中')).toBeInTheDocument();
    expect(screen.getByText(/監修の確認が済むまでは/)).toBeInTheDocument();
  });

  it('監修なしのときは「監修は受けていません」と表示する', () => {
    render(<SupervisorNote path="/guide/phone" manualId="manual" supervision={{ ...SUPERVISION, status: 'none' }} />);
    expect(screen.getByText(/監修は受けていません/)).toBeInTheDocument();
    expect(screen.queryByText('マニュアル監修')).not.toBeInTheDocument();
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

describe('電話ガイド：もっと詳しく整理する', () => {
  const deep = () => within(maker()).getByText('もっと詳しく整理する').closest('details') as HTMLDetailsElement;
  const applyButton = () => within(deep()).getByRole('button', { name: '③の台本に反映' });
  async function openDeep() {
    await userEvent.click(within(deep()).getByText('もっと詳しく整理する'));
    expect(deep().open).toBe(true);
  }

  it('②「内容を入れる」の最後にあり、最初は閉じている', () => {
    openPhone();
    const step2 = within(maker()).getByRole('group', { name: '内容を入れる' });
    expect(step2.lastElementChild).toBe(deep());
    expect(deep().open).toBe(false);
    // ①②③の構成はそのまま
    expect(within(maker()).getByRole('group', { name: '目的を選ぶ' })).toBeInTheDocument();
    expect(within(maker()).getByRole('group', { name: /できた台本/ })).toBeInTheDocument();
  });

  it('入力して「③の台本に反映」を押すと本題に加わり、コピーと大きな文字で読む画面にも出る', async () => {
    const writeText = mockClipboard();
    openPhone();
    await openDeep();
    // 「何について？」が空のうちは押せない
    expect(applyButton()).toBeDisabled();
    await userEvent.type(screen.getByLabelText('何について？'), 'A計画');
    await userEvent.type(screen.getByLabelText('確認できたこと（事実）'), '説明会が1回だけだった');
    await userEvent.click(screen.getByLabelText('法律・条例の根拠'));
    // 押すまでは本題は変わらない
    expect(part('本題').value).toBe('A計画について、懸念があります。');
    await userEvent.click(applyButton());
    expect(part('本題').value).toBe(
      'A計画について、懸念があります。\n私が確認した状況は、次のとおりです。説明会が1回だけでした。\n適用される制度・条例と、その根拠資料を教えていただけますか。',
    );
    expect(within(deep()).getByRole('status')).toHaveTextContent('③の「本題」に反映しました');
    await userEvent.click(within(maker()).getByRole('button', { name: '台本をまとめてコピー' }));
    expect(writeText.mock.calls[0][0]).toContain('私が確認した状況は、次のとおりです。');
    await userEvent.click(screen.getByRole('button', { name: '大きな文字で読む' }));
    const reader = await screen.findByRole('dialog', { name: '台本を大きな文字で読む' });
    expect(within(reader).getByText(/私が確認した状況は/)).toBeInTheDocument();
  });

  it('反映したあと詳しい整理を直して押し直すと、確認なしで置き換わり、同じ文が重ならない', async () => {
    openPhone();
    await userEvent.type(screen.getByLabelText('何について？'), 'A計画');
    await openDeep();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await userEvent.type(screen.getByLabelText('疑問・気になっていること'), '説明会を増やす予定はあるか');
    await userEvent.click(applyButton());
    await userEvent.click(screen.getByLabelText('現在の対応状況'));
    // 直したあとは「反映しました」を消す
    expect(within(deep()).queryByRole('status')).not.toBeInTheDocument();
    await userEvent.click(applyButton());
    expect(confirm).not.toHaveBeenCalled();
    expect(part('本題').value.match(/特に確認したいことがあります/g)).toHaveLength(1);
    expect(part('本題').value).toContain('現在どのような確認や対応が行われているか');
  });

  it('反映したあと①②を変えると、②に「前の文のまま」と出て、「③に反映し直す」で新しい内容になる', async () => {
    openPhone();
    await userEvent.type(screen.getByLabelText('何について？'), 'A計画');
    await openDeep();
    await userEvent.type(screen.getByLabelText('確認できたこと（事実）'), '区報で知った');
    await userEvent.click(applyButton());
    const step2 = within(maker()).getByRole('group', { name: '内容を入れる' });
    expect(within(step2).queryByText(/前に「詳しく整理」で反映した文のままです/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: '賛成' }));
    expect(part('本題').value).toContain('懸念があります。');
    expect(within(step2).getByText(/前に「詳しく整理」で反映した文のままです/)).toBeInTheDocument();
    await userEvent.click(within(step2).getByRole('button', { name: '③に反映し直す' }));
    expect(part('本題').value).toBe('A計画について、賛成です。\n私が確認した状況は、次のとおりです。区報で知りました。');
    expect(within(step2).queryByText(/前に「詳しく整理」で反映した文のままです/)).not.toBeInTheDocument();
  });

  it('本題を手で直していたら、置き換える前に確認する（やめると手で直した文が残る）', async () => {
    openPhone();
    await userEvent.type(screen.getByLabelText('何について？'), 'A計画');
    await userEvent.clear(part('本題'));
    await userEvent.type(part('本題'), '自分の言葉で伝えます。');
    await openDeep();
    await userEvent.type(screen.getByLabelText('確認できたこと（事実）'), '説明会が1回だけだった');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await userEvent.click(applyButton());
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(part('本題').value).toBe('自分の言葉で伝えます。');
    confirm.mockReturnValue(true);
    await userEvent.click(applyButton());
    expect(part('本題').value).toContain('私が確認した状況は');
  });

  it('入力は再読み込みしても残り、「入力を消す」で詳しい整理も消える', async () => {
    const first = openPhone();
    await userEvent.type(screen.getByLabelText('何について？'), 'A計画');
    await openDeep();
    await userEvent.type(screen.getByLabelText('確認できたこと（事実）'), '説明会が1回だけだった');
    await userEvent.click(screen.getByLabelText('予算・費用'));
    await userEvent.click(applyButton());
    first.unmount();
    openPhone();
    expect(screen.getByLabelText('確認できたこと（事実）')).toHaveValue('説明会が1回だけだった');
    expect(screen.getByLabelText('予算・費用')).toBeChecked();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: '入力を消す' }));
    expect(screen.getByLabelText('確認できたこと（事実）')).toHaveValue('');
    expect(screen.getByLabelText('予算・費用')).not.toBeChecked();
    expect(within(deep()).queryByRole('status')).not.toBeInTheDocument();
    expect(part('本題').value).toBe('○○について、懸念があります。');
  });
});

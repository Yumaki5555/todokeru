// メール・フォーム・郵送のガイド：詳しいマニュアル（第0〜7章）
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import { FIRST_SAMPLE, MAIL_CHAPTERS } from '../src/content/mailManual';
import { EMPTY_MAIL, LETTER_END, addressee, mailAutoText, postAddressee } from '../src/content/mailText';
import { EMPTY_DRAFT } from '../src/content/callScript';
import { PHONE_CHAPTERS } from '../src/content/phoneManual';
import { sampleText } from '../src/lib/text';
import type { CallTarget, ManualChapter, ManualSample } from '../src/types';

function open(hash = '#/guide/email') {
  window.location.hash = hash;
  return render(<App />);
}

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return writeText;
}

const manual = () => screen.getByRole('region', { name: '詳しいマニュアル' });
const chapter = (id: string) => document.getElementById(id) as HTMLDetailsElement;

describe('メール・フォーム・郵送：詳しいマニュアル', () => {
  it('題名はそのままで、副題は「まず、聞きたいことを一文で。」', () => {
    open();
    expect(screen.getByRole('heading', { level: 1, name: 'メール・フォーム・郵送で届ける' })).toBeInTheDocument();
    expect(screen.getByText('まず、聞きたいことを一文で。')).toBeInTheDocument();
  });

  it('第0章〜第7章は電話マニュアルと同じ番号で、最初はすべて閉じている。マニュアルは送ったあとの記録の下', () => {
    open();
    const chapters = manual().querySelectorAll('details.chapter');
    expect(chapters).toHaveLength(8);
    expect([...chapters].some((d) => (d as HTMLDetailsElement).open)).toBe(false);
    expect(MAIL_CHAPTERS.map((c) => c.no)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(MAIL_CHAPTERS.map((c) => c.id)).toEqual(PHONE_CHAPTERS.map((c) => c.id));
    expect(MAIL_CHAPTERS.map((c) => c.title)).toEqual([
      '文章で声を届ける',
      'まず、聞きたいことを一文で',
      '国の窓口を選ぶ',
      '所管省庁に質問・意見を送る',
      '自治体に送る',
      '議会に届ける',
      '司法制度について書く',
      '文章の締め方・送ったあと',
    ]);
    // 章の要点は閉じたままでも読める
    for (const c of MAIL_CHAPTERS) expect(within(manual()).getByText(c.lead)).toBeInTheDocument();
    const memo = document.getElementById('memo')!;
    expect(memo.compareDocumentPosition(manual()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // 「ほかの届け方」はマニュアルの本文の下
    const next = within(manual()).getByRole('heading', { name: 'ほかの届け方' });
    expect(chapter('ch7').compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('冒頭に5つの流れ：準備 → 書く → 読み直す → 送る → 控えを残す', () => {
    open();
    const flow = within(manual()).getByRole('list', { name: '文章で届ける流れ' });
    const items = within(flow).getAllByRole('listitem');
    expect(items.map((li) => li.querySelector('b')!.textContent)).toEqual(['準備', '書く', '読み直す', '送る', '控えを残す']);
  });

  it('「目的から探す」の目次：8章と、最後に「送る前に確かめたい」', () => {
    open();
    const toc = screen.getByRole('navigation', { name: '目的から探す' });
    const links = within(toc).getAllByRole('link');
    expect(links).toHaveLength(9);
    MAIL_CHAPTERS.forEach((c, i) => {
      expect(links[i]).toHaveTextContent(`第${c.no}章${c.purpose}`);
      expect(links[i]).toHaveAttribute('href', `#/guide/email?s=${c.id}`);
    });
    expect(links[8]).toHaveTextContent('送る前に確かめたい');
    expect(links[8]).toHaveAttribute('href', '#/guide/email?s=checklist');
  });

  it('目次から章へ移動すると、閉じた章が開く', async () => {
    open();
    const toc = screen.getByRole('navigation', { name: '目的から探す' });
    await userEvent.click(within(toc).getByRole('link', { name: /第3章\s*省庁に質問・意見を送りたい/ }));
    expect(chapter('ch3').open).toBe(true);
    expect(chapter('ch3').scrollIntoView).toHaveBeenCalled();
    await userEvent.click(within(toc).getByRole('link', { name: '送る前に確かめたい' }));
    expect(chapter('checklist').open).toBe(true);
  });

  it('#/guide/email?s=ch3 で開くと、第3章が開いた状態になる', () => {
    open('#/guide/email?s=ch3');
    expect(chapter('ch3').open).toBe(true);
    expect(chapter('ch2').open).toBe(false);
  });

  it('このページに監修者の名前は出さず、「監修は受けていません」と1行だけ書く', () => {
    open();
    expect(document.body.textContent).not.toMatch(/電突の牙|MinNanoRamen21/);
    expect(screen.queryByText('マニュアル監修')).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'このガイドの監修について' })).not.toBeInTheDocument();
    const intro = screen.getByRole('complementary', { name: 'はじめて文章で送る人へ' });
    expect(within(intro).getByText('このマニュアルは当サイトが独自にまとめたもので、監修は受けていません。')).toBeInTheDocument();
    // 文面づくりより上にある
    const maker = screen.getByRole('region', { name: '文面を作る' });
    expect(intro.compareDocumentPosition(maker) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const jump = within(intro).getByRole('link', { name: '詳しいマニュアルを読む（全8章）' });
    expect(jump).toHaveAttribute('href', '#/guide/email?s=manual');
    fireEvent.click(jump);
    expect(document.activeElement).toBe(document.getElementById('manual'));
  });

  it('一通の完成例：メール／問い合わせフォーム／郵送（手紙）を同じ枠の中で切りかえ、まとめてコピーできる', async () => {
    const writeText = mockClipboard();
    open('#/guide/email?s=ch1');
    const sample = within(manual()).getByRole('figure', { name: '一通の完成例' });
    expect(within(sample).getByRole('radio', { name: 'メール' })).toBeChecked();
    expect(within(sample).getByText('件名')).toBeInTheDocument();
    await userEvent.click(within(sample).getByRole('button', { name: 'まとめてコピー' }));
    expect(writeText).toHaveBeenLastCalledWith(sampleText(FIRST_SAMPLE[0]));
    expect(writeText.mock.calls[0][0]).toMatch(/^件名：【質問】△△説明会の資料について\n\n○○市\n△△課 ご担当者様\n\n突然のご連絡失礼いたします。/);

    await userEvent.click(within(sample).getByRole('radio', { name: '問い合わせフォーム' }));
    expect(within(sample).getByText(/専用の欄があれば、そこに入れます。本文には重ねて書きません/)).toBeInTheDocument();
    expect(within(sample).getByText(/件名の欄がないときは、本文の1行目に/)).toBeInTheDocument();
    expect(within(sample).getByText(/文字数の上限が小さいときは、本文のはじめに一文版/)).toBeInTheDocument();

    await userEvent.click(within(sample).getByRole('radio', { name: '郵送（手紙）' }));
    expect(within(sample).getByText('差出人')).toBeInTheDocument();
    await userEvent.click(within(sample).getByRole('button', { name: 'まとめてコピー' }));
    const letter = writeText.mock.lastCall![0] as string;
    expect(letter).toBe(sampleText(FIRST_SAMPLE[2]));
    expect(letter).toContain('△△課 御中');
    expect(letter).not.toContain('ご担当者様');
    expect(letter).not.toContain('件名：');
  });

  it('例文の形は、文面を作るツールが出す文と同じ', () => {
    const t = { org: '○○市', department: '△△課', postalCode: '○○○-○○○○', postalAddress: '○○県○○市○○町○-○' } as CallTarget;
    const draft = { ...EMPTY_DRAFT, purpose: 'question' as const };
    const named = { ...EMPTY_MAIL, name: '○○', area: '○○市' };
    const [mail, form, post] = FIRST_SAMPLE;
    const text = (s: ManualSample, label: string) => s.parts.find((p) => p.label === label)!.text;
    expect(text(mail, '宛名')).toBe(addressee(t));
    expect(text(post, '宛先')).toBe(postAddressee(t));
    expect(text(post, '差出人')).toBe(
      mailAutoText(draft, { ...named, method: 'post', postal: '○○○-○○○○', address: '○○県○○市○○町○-○', contact: '○○-○○○○-○○○○' }, 'sender'),
    );
    expect(text(post, '終わり')).toBe(LETTER_END);
    expect(text(mail, 'あいさつ')).toBe(mailAutoText(draft, named, 'greeting'));
    expect(text(mail, '署名')).toBe(mailAutoText(draft, named, 'signature'));
    expect(text(mail, '結び')).toBe(mailAutoText(draft, EMPTY_MAIL, 'closing'));
    expect(text(mail, 'お願い')).toBe(mailAutoText(draft, { ...EMPTY_MAIL, reply: 'want' }, 'request'));
    // フォームは名前の欄に入れるので、本文に名前を重ねない
    expect(text(form, '内容の欄')).not.toContain('と申します');
    // 件名は3つの形のどれか
    const subjects = JSON.stringify(MAIL_CHAPTERS).match(/【[^】]+】/g) ?? [];
    expect(subjects.length).toBeGreaterThan(0);
    for (const s of subjects) expect(['【質問】', '【意見】', '【お問い合わせ】']).toContain(s);
  });

  it('実在しそうなアドレスは作らない（参考ページは「https://（参考にしたページのアドレス）」）', () => {
    const all = JSON.stringify(MAIL_CHAPTERS);
    expect(all).toContain('https://（参考にしたページのアドレス）');
    expect(all).not.toMatch(/https?:\/\/(?!（参考にしたページのアドレス）)/);
    expect(all).not.toMatch(/@[a-z0-9.-]+\.[a-z]{2,}/i);
  });

  it('国の機関・自治体の窓口・行政と議会の説明は、電話マニュアルと同じデータを使う', () => {
    const terms = (cs: ManualChapter[], id: string) => cs.find((c) => c.id === id)!.blocks.find((b) => b.kind === 'terms');
    for (const id of ['ch2', 'ch4', 'ch5']) {
      expect(terms(MAIL_CHAPTERS, id)).toBeDefined();
      expect(terms(MAIL_CHAPTERS, id)).toBe(terms(PHONE_CHAPTERS, id));
    }
  });

  it('送ったあとの文は、ツールの「困ったときの文例」と同じ。携帯電話会社のメールの注意もある', () => {
    open('#/guide/email?s=ch7');
    const ch7 = chapter('ch7');
    expect(
      within(ch7).getByText('「○月○日に「【質問】○○について」という件名でお送りした件について、届いているか確認させていただけますか。お手数ですが、よろしくお願いいたします。」'),
    ).toBeInTheDocument();
    expect(within(ch7).getByText('「お手数ですが、どちらにお問い合わせすればよいか、教えていただけますか。」')).toBeInTheDocument();
    expect(within(ch7).getByText(/携帯電話会社のメールは、迷惑メールの設定で、返事が届かないことがある/)).toBeInTheDocument();
  });

  it('個別の議員の連絡先は載せないこと、請願・陳情は議会の案内で確かめることを書いている', () => {
    open();
    const ch5 = chapter('ch5');
    expect(within(ch5).getByText(/個別の議員の連絡先は掲載しません/)).toBeInTheDocument();
    expect(within(ch5).getByText(/そのまま請願・陳情として受け付けられるとは限りません/)).toBeInTheDocument();
  });

  it('マニュアルの中から、文面を作る欄と、送ったあとの記録へ移れる', async () => {
    open('#/guide/email?s=ch1');
    await userEvent.click(within(chapter('ch1')).getByRole('link', { name: 'この型で文面を作る' }));
    expect(document.activeElement).toBe(document.getElementById('maker'));
    await userEvent.click(within(chapter('ch7')).getByRole('link', { name: '送ったあとの記録をつける' }));
    expect(chapter('memo').open).toBe(true);
  });
});

describe('メール・フォーム・郵送：マニュアルへの入口', () => {
  it('ナビの「電話のかけ方」の隣に「メール・手紙」があり、このページでは印が付く', () => {
    open();
    const nav = screen.getByRole('navigation', { name: 'サイト内の主なページ' });
    const links = within(nav).getAllByRole('link');
    const i = links.findIndex((a) => a.textContent === '電話のかけ方');
    expect(links[i + 1]).toHaveTextContent('メール・手紙');
    expect(links[i + 1]).toHaveAttribute('href', '#/guide/email');
    expect(links[i + 1]).toHaveAttribute('aria-current', 'page');
  });

  it('トップの「声を届ける方法を知る」からこのページへ行ける', () => {
    open('#/');
    const methods = screen.getByRole('region', { name: '声を届ける方法を知る' });
    expect(within(methods).getByRole('link', { name: 'メール・フォーム・郵送' })).toHaveAttribute('href', '#/guide/email');
  });

  it('電話マニュアルの第7章から、文章版の第3章へ行ける', () => {
    open('#/guide/phone');
    expect(within(chapter('ch7')).getByRole('link', { name: /文章でも送るときは/ })).toHaveAttribute('href', '#/guide/email?s=ch3');
  });
});

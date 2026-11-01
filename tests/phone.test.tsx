// 電話ガイド
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import { SupervisorNote } from '../src/components/SupervisorNote';
import { BASIC_SCRIPT, PHONE_CHAPTERS } from '../src/content/phoneManual';
import { SUPERVISION } from '../src/site';

function openPhone() {
  window.location.hash = '#/guide/phone';
  return render(<App />);
}

describe('電話ガイド', () => {
  it('題名・副題と、このサイトのトップへ戻るリンク', () => {
    openPhone();
    expect(screen.getByRole('heading', { level: 1, name: 'はじめての行政電話ガイド' })).toBeInTheDocument();
    expect(screen.getByText('台本は1行でいい。')).toBeInTheDocument();
    const backs = screen.getAllByRole('link', { name: '声を届ける。トップへ戻る' });
    expect(backs.length).toBeGreaterThanOrEqual(2); // 上と下
    backs.forEach((a) => expect(a).toHaveAttribute('href', '#/'));
    // 3つの戻り先が別々にある
    expect(screen.getByRole('link', { name: '日本を知る。トップへ戻る' })).toHaveAttribute('href', 'https://yumaki5555.github.io/');
    expect(screen.getByRole('button', { name: 'ページ先頭へ戻る' })).toBeInTheDocument();
  });

  it('監修の表示が冒頭と末尾にあり、確認中はそう表示する', () => {
    openPhone();
    const notes = screen.getAllByRole('complementary', { name: 'このガイドの監修について' });
    expect(notes).toHaveLength(2);
    for (const n of notes) {
      expect(within(n).getByRole('link', { name: /電突の牙さん/ })).toHaveAttribute('href', 'https://x.com/MinNanoRamen21');
      expect(within(n).getByText('監修確認中')).toBeInTheDocument();
    }
    expect(within(notes[1]).getByText(/ほかのページは監修の対象ではありません/)).toBeInTheDocument();
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

  it('第0章〜第7章が折りたたみで並び、最初は第0章・第1章だけ開いている', async () => {
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
    expect([...chapters].map((d) => (d as HTMLDetailsElement).open)).toEqual([true, true, false, false, false, false, false, false]);
    await userEvent.click(screen.getByRole('button', { name: 'すべての章を開く' }));
    expect([...chapters].every((d) => (d as HTMLDetailsElement).open)).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'すべての章を閉じる' }));
    expect([...chapters].some((d) => (d as HTMLDetailsElement).open)).toBe(false);
  });

  it('目次から章へ移動すると、閉じた章が開く', async () => {
    openPhone();
    const toc = screen.getByRole('navigation', { name: 'このページの内容' });
    await userEvent.click(within(toc).getByRole('link', { name: /第5章\s*議会・立法への意見/ }));
    const ch5 = document.getElementById('ch5') as HTMLDetailsElement;
    expect(ch5.open).toBe(true);
    expect(ch5.scrollIntoView).toHaveBeenCalled();
  });

  it('台本をコピーできる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    openPhone();
    const buttons = screen.getAllByRole('button', { name: 'この台本をコピー' });
    await userEvent.click(buttons[0]);
    expect(writeText).toHaveBeenCalledWith(BASIC_SCRIPT.text);
    expect(await screen.findByRole('button', { name: 'コピーしました' })).toBeInTheDocument();
    expect(screen.getByText(/「基本の台本」をコピーしました/)).toBeInTheDocument();
  });

  it('基本の台本を大きく表示し、原案の4つの型がそろっている', () => {
    openPhone();
    expect(screen.getAllByText(`「${BASIC_SCRIPT.text}」`).length).toBeGreaterThanOrEqual(1);
    for (const t of ['○○という政策について、理由を教えていただけますか？', '○○について、△△の理由から懸念があります。', 'この意見を記録していただくことはできますか？']) {
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

  it('ページ先頭へ戻る・窓口検索へ進む', async () => {
    openPhone();
    await userEvent.click(screen.getByRole('button', { name: 'ページ先頭へ戻る' }));
    expect(window.scrollTo).toHaveBeenCalled();
    const next = document.getElementById('next')!;
    expect(within(next).getByRole('link', { name: '全国の窓口を探す' })).toHaveAttribute('href', '#/contacts');
  });

  it('個別の議員の連絡先は載せないこと、司法の個別事件の判断変更を勧めないことを書いている', () => {
    openPhone();
    expect(screen.getByText(/個別の議員の連絡先は掲載しません/)).toBeInTheDocument();
    expect(screen.getByText(/電話で個別の事件の判断を変えるよう求めることは、おすすめしません/)).toBeInTheDocument();
  });
});

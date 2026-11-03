// メール・フォーム・郵送のガイド：ページの中の移動（上部の3つのボタン・画面下のメニュー・戻る位置・入力の保持）
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import { rememberSpot, savedSpot } from '../src/lib/scrollMemory';

function open(hash = '#/guide/email') {
  window.location.hash = hash;
  return render(<App />);
}

const topNav = () => screen.getByRole('navigation', { name: 'このページの移動' });
const bar = () => document.querySelector('.jump-bar') as HTMLElement;
const maker = () => screen.getByRole('region', { name: '文面を作る' });

describe('メール・フォーム・郵送：ページの中の移動', () => {
  it('上部に「文面を作る・送り先を探す・書き方を読む」の3つ。案内の下、文面づくりの上にある', () => {
    open();
    const links = within(topNav()).getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual(['文面を作る', '送り先を探す', '書き方を読む']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#/guide/email?s=maker', '#/guide/email?s=call-target', '#/guide/email?s=manual']);
    const intro = screen.getByRole('complementary', { name: 'はじめて文章で送る人へ' });
    expect(intro.compareDocumentPosition(topNav()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(topNav().compareDocumentPosition(maker()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('「書き方を読む」でマニュアルへ移り、履歴に残る（ブラウザの「戻る」で元の位置へ）', async () => {
    open();
    Object.defineProperty(window, 'scrollY', { value: 640, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 5000, configurable: true });
    fireEvent.click(within(topNav()).getByRole('link', { name: '書き方を読む' }));
    expect(document.activeElement).toBe(document.getElementById('manual'));
    expect(window.location.hash).toBe('#/guide/email?s=manual');
    // 押す前の位置は、前の履歴に覚えている
    vi.mocked(window.scrollTo).mockClear();
    act(() => history.back());
    await waitFor(() => expect(window.location.hash).toBe('#/guide/email'));
    await waitFor(() => expect(window.scrollTo).toHaveBeenCalledWith(0, 640));
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  it('覚えた位置には、開いていた折りたたみも入る', () => {
    open();
    (document.getElementById('ch3') as HTMLDetailsElement).open = true;
    rememberSpot();
    const all = Array.from(document.querySelectorAll('main details'));
    expect(savedSpot()?.open).toEqual([all.indexOf(document.getElementById('ch3')!)]);
  });

  it('「文面を作る」は、最後に入力した欄へ戻る（キーボードが急に開かないよう、フォーカスは欄のまとまりへ）', async () => {
    let view = open();
    const topic = within(maker()).getByRole('textbox', { name: '何について？' });
    await userEvent.click(topic);
    await userEvent.type(topic, '駅前の再開発');
    fireEvent.click(within(topNav()).getByRole('link', { name: '書き方を読む' }));
    vi.mocked(topic.scrollIntoView).mockClear();
    fireEvent.click(within(topNav()).getByRole('link', { name: '文面を作る' }));
    expect(topic.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'center' }));
    expect(document.activeElement).toBe(within(maker()).getByRole('group', { name: /内容を入れる/ }));
    // ほかのページへ行って戻っても（作り直しても）、入力と戻る欄は残る
    view.unmount();
    view = open('#/contacts');
    await screen.findByRole('heading', { level: 1 });
    view.unmount();
    open();
    expect(within(maker()).getByRole('textbox', { name: '何について？' })).toHaveValue('駅前の再開発');
    fireEvent.click(within(topNav()).getByRole('link', { name: '文面を作る' }));
    expect(document.activeElement).toBe(within(maker()).getByRole('group', { name: /内容を入れる/ }));
  });

  it('「送る前に確かめる」のチェックは、ほかのページへ行って戻っても残る', async () => {
    const view = open();
    const box = screen.getAllByRole('checkbox')[0];
    await userEvent.click(box);
    expect(box).toBeChecked();
    view.unmount();
    open();
    expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
  });

  it('画面下のメニューは、上部のボタンが見えなくなったときだけ出し、文字を入力中は隠す', async () => {
    open();
    expect(bar()).not.toBeVisible();
    vi.spyOn(topNav(), 'getBoundingClientRect').mockReturnValue({ bottom: -20, top: -80 } as DOMRect);
    // マニュアルがまだ画面の下にあるとき
    const manualRect = vi.spyOn(document.getElementById('manual')!, 'getBoundingClientRect').mockReturnValue({ top: 3000 } as DOMRect);
    fireEvent.scroll(window);
    expect(bar()).toBeVisible();
    const labels = () => within(bar()).getAllByRole('link').map((a) => a.textContent);
    expect(labels()).toEqual(['文面作成', '送り先', 'マニュアル']);
    // マニュアルを読んでいる間は、3つめが「目次」になる
    manualRect.mockReturnValue({ top: -100 } as DOMRect);
    fireEvent.scroll(window);
    expect(labels()).toEqual(['文面作成', '送り先', '目次']);
    expect(within(bar()).getByRole('link', { name: '目次' })).toHaveAttribute('aria-current', 'location');
    await userEvent.click(within(maker()).getByRole('textbox', { name: '何について？' }));
    expect(bar()).not.toBeVisible();
    fireEvent.focusOut(document.activeElement!, { relatedTarget: null });
    expect(bar()).toBeVisible();
  });
});

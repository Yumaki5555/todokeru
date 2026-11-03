// 署名の方法（#/guide/signature）
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import {
  ENTRY,
  JOIN_CHECKLIST,
  JOIN_STEPS,
  SIGNATURE_PARTS,
  SIGNATURE_PROMPTS,
  SITES,
  SOURCES,
  START_CHECKLIST,
  START_STEPS,
  templateText,
} from '../src/content/signatureManual';

function open(hash = '#/guide/signature') {
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

describe('署名の方法', () => {
  it('題名・副題・トップへ戻る。準備中ではない', () => {
    open();
    expect(screen.getByRole('heading', { level: 1, name: '署名で、声を集める。' })).toBeInTheDocument();
    expect(screen.getByText('一人の声から、みんなの声へ。')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '声を届ける。トップへ戻る' })[0]).toHaveAttribute('href', '#/');
    expect(screen.getByRole('button', { name: 'ページ先頭へ戻る' })).toBeInTheDocument();
    expect(screen.queryByText('このページで案内する予定の内容')).not.toBeInTheDocument();
    expect(document.title).toBe('署名の方法｜声を届ける。');
  });

  it('最初の2つの入り口から、賛同・立ち上げの手順へ移れる', () => {
    open();
    const links = within(screen.getByRole('navigation', { name: 'どちらから始める？' })).getAllByRole('link');
    expect(links).toHaveLength(2);
    ENTRY.forEach((e, i) => {
      expect(links[i]).toHaveAttribute('href', `#/guide/signature?s=${e.id}`);
      expect(links[i]).toHaveTextContent(e.title);
      expect(document.getElementById(e.id)).toHaveAccessibleName(new RegExp(e.title));
    });
  });

  it('4つのまとまりへ移れる。A・Bの間も行き来できる', () => {
    open();
    const links = within(screen.getByRole('navigation', { name: 'このページの内容' })).getAllByRole('link');
    expect(links).toHaveLength(4);
    SIGNATURE_PARTS.forEach((p, i) => {
      expect(links[i]).toHaveAttribute('href', `#/guide/signature?s=${p.id}`);
      expect(screen.getByRole('heading', { level: 2, name: p.title })).toBeInTheDocument();
    });
    expect(within(document.getElementById('join')!).getByRole('link', { name: /B 立ち上げたい人はこちら/ })).toHaveAttribute('href', '#/guide/signature?s=start');
    expect(within(document.getElementById('start')!).getByRole('link', { name: /A 賛同したい人はこちら/ })).toHaveAttribute('href', '#/guide/signature?s=join');
  });

  it('やってみよう：A・Bそれぞれ4ステップ', () => {
    open();
    for (const s of [...JOIN_STEPS, ...START_STEPS]) {
      expect(screen.getAllByRole('heading', { level: 4, name: new RegExp(`STEP ${s.no}\\s*${s.title}`) }).length).toBeGreaterThan(0);
    }
    expect(within(screen.getByRole('list', { name: '内容を確かめる' })).getAllByRole('listitem')).toHaveLength(5);
    expect(within(screen.getByRole('list', { name: 'VoiceのAIを使ってみようの手順' })).getAllByRole('listitem')).toHaveLength(5);
  });

  it('外部へのリンク：署名掲示板・Voice・Change.org（公式URL、外部サイトと明示）', () => {
    open();
    const sho = screen.getAllByRole('link', { name: /署名を探す（署名掲示板）/ });
    expect(sho.length).toBeGreaterThanOrEqual(2);
    for (const a of sho) {
      expect(a).toHaveAttribute('href', 'https://yumaki5555.github.io/shomei/');
      expect(a).toHaveTextContent('（外部サイト）');
    }
    for (const a of screen.getAllByRole('link', { name: /VoiceのAIで署名文を作る|Voiceで立ち上げる/ })) expect(a).toHaveAttribute('href', 'https://voice.charity/');
    for (const a of screen.getAllByRole('link', { name: /Change.orgで(署名を始める|立ち上げる)/ })) expect(a).toHaveAttribute('href', 'https://www.change.org/start-a-petition');
    expect(screen.getByRole('link', { name: /AIを使わずに作る/ })).toHaveAttribute('href', 'https://voice.charity/help/start-a-petition/how-to-start-a-petition');
  });

  it('請願・陳情の書き方へ行ける。3つの署名の違いと、公式の出典', () => {
    open();
    const kinds = document.getElementById('kinds')!;
    expect(within(kinds).getByRole('link', { name: '請願・陳情の書き方' })).toHaveAttribute('href', '#/guide/petition');
    for (const t of ['オンライン署名', '請願・陳情', '法律にもとづく署名']) expect(within(kinds).getByText(t)).toBeInTheDocument();
    expect(within(kinds).getByRole('link', { name: /総務省「直接請求制度」/ })).toHaveAttribute('href', 'https://www.soumu.go.jp/main_sosiki/jichi_gyousei/bunken/chokusetsu_seikyu.html');
    // 出典はすべて公式のドメイン
    for (const l of SOURCES.links) expect(l.url).toMatch(/^https:\/\/(voice\.charity|help\.change\.org|www\.change\.org|laws\.e-gov\.go\.jp|www\.soumu\.go\.jp)\//);
  });

  it('署名サイトの違い：2つを同じ項目・同じ順で。支援のお金の行き先と、非公開でも名前が伝わること', () => {
    open();
    const [a, b] = SITES.cards;
    expect(a.rows.map((r) => r.label)).toEqual(b.rows.map((r) => r.label));
    const sec = document.getElementById('sites')!;
    expect(within(sec).getByText(/Change.orgに支払われ、発信者には渡りません/)).toBeInTheDocument();
    expect(within(sec).getByText(/手数料（システム利用料25%など）を引いて発起人に届きます/)).toBeInTheDocument();
    expect(within(sec).getByText(/非公開でも、発起人が管理する署名簿には名前が載ります/)).toBeInTheDocument();
    expect(within(sec).getByText(/2026年11月4日に/)).toBeInTheDocument();
  });

  it('署名文のひな形をコピーできる', async () => {
    const writeText = mockClipboard();
    open();
    await userEvent.click(screen.getByRole('button', { name: 'ひな形をコピー' }));
    expect(writeText).toHaveBeenCalledWith(templateText());
    expect(templateText()).toMatch(/^【タイトル】\n〇〇の改善を求めます\n\n【提出先】\n/);
  });

  it('指示文：4つで切りかわり、どれも全文をコピーできる', async () => {
    const writeText = mockClipboard();
    open();
    const group = screen.getByRole('group', { name: 'やりたいことを選ぶ' });
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(4);
    expect(radios[0]).toBeChecked();
    for (const p of SIGNATURE_PROMPTS) {
      await userEvent.click(within(group).getByRole('radio', { name: new RegExp(p.label) }));
      expect(promptText().textContent).toBe(p.text.trimEnd());
      await userEvent.click(screen.getByRole('button', { name: 'AIへの指示文をコピー' }));
      expect(writeText).toHaveBeenLastCalledWith(p.text);
    }
    expect(writeText).toHaveBeenCalledTimes(4);
  });

  it('「指示文を見る」で、その目的の指示文を選んだ状態になる', async () => {
    open();
    await userEvent.click(screen.getByRole('button', { name: /指示文を見る\s*（自分の署名文を作りたい）/ }));
    expect(screen.getByRole('radio', { name: /自分の署名文を作りたい/ })).toBeChecked();
  });

  it('賛同前チェック・公開前チェック：全部でまとめの言葉', async () => {
    open();
    const join = screen.getByRole('group', { name: '署名する前に' });
    expect(within(join).getAllByRole('checkbox')).toHaveLength(JOIN_CHECKLIST.length);
    for (const b of within(join).getAllByRole('checkbox')) await userEvent.click(b);
    expect(within(join).getByText(/納得できたら、署名しましょう/)).toBeInTheDocument();
    const start = screen.getByRole('group', { name: '公開する前に' });
    expect(within(start).getAllByRole('checkbox')).toHaveLength(START_CHECKLIST.length);
  });

  it('よくある疑問：9つ（と出典）。最初は閉じている', () => {
    open();
    const faq = document.getElementById('faq')!;
    expect(faq.querySelectorAll('details')).toHaveLength(10);
    expect(within(faq).getByText('署名にお金はかかる？').closest('details')!.open).toBe(false);
  });
});

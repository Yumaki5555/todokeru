// 別のサイトから来たときの一時メモ・自治体コードの対応・窓口を表示できないときの案内
import { describe, expect, it } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import { resolveArea, withCheckDigit, type AreaMasters } from '../src/lib/areaCode';
import { FROM_TTL_MS, checkReturnUrl, cleanItem, clearFrom, consumeHandoff, loadFrom } from '../src/lib/fromSite';
import { dataOverrides } from './setup';
import prefectures from '../public/data/master/prefectures.json';
import municipalities from '../public/data/master/municipalities.json';
import wards from '../public/data/master/wards.json';

const BUDGET = 'https://yumaki5555.github.io/tabunka-yosan/#/m/221309?y=2026&pj=221309-018';
const KEY = 'todokeru:from-site:v1';
const handoff = (over: Record<string, string> = {}, path = '/contacts') => '#' + path + '?' + new URLSearchParams({ code: '221309', from: BUDGET, item: '外国人相談事業', ...over }).toString();

describe('戻り先の点検', () => {
  it('公開先の許可したサイトだけ通し、事業を開く情報（pj）も保つ', () => {
    expect(checkReturnUrl(BUDGET)).toEqual({ url: BUDGET, site: 'tabunka-yosan' });
    expect(checkReturnUrl('https://yumaki5555.github.io/zairyu/muni-22138.html')?.site).toBe('zairyu');
  });

  it.each([
    ['別の住所', 'https://evil.example/tabunka-yosan/'],
    ['住所に見せかけた別の住所', 'https://yumaki5555.github.io@evil.example/tabunka-yosan/'],
    ['似た名前の住所', 'https://yumaki5555.github.io.evil.example/tabunka-yosan/'],
    ['http', 'http://yumaki5555.github.io/tabunka-yosan/'],
    ['スクリプト', 'javascript:alert(1)'],
    ['データ', 'data:text/html,x'],
    ['許可していないフォルダ', 'https://yumaki5555.github.io/other/'],
    ['入口そのもの', 'https://yumaki5555.github.io/'],
    ['フォルダをさかのぼる', 'https://yumaki5555.github.io/tabunka-yosan/../other/'],
    ['符号化してさかのぼる', 'https://yumaki5555.github.io/tabunka-yosan/%2e%2e/other/'],
    ['特別な名前', 'https://yumaki5555.github.io/constructor/'],
    ['相対パス', '/tabunka-yosan/'],
    ['空', ''],
  ])('%s は通さない', (_, url) => {
    expect(checkReturnUrl(url)).toBeNull();
  });

  it('項目名は見えない文字を除いて60字までにする', () => {
    expect(cleanItem('a‮b\nc')).toBe('a b c');
    expect(Array.from(cleanItem('あ'.repeat(80))!)).toHaveLength(60);
    expect(cleanItem('   ')).toBeNull();
  });
});

describe('一時メモ', () => {
  it('読み取ったら保存し、URL から from と item を外す（窓口検索の code は残す）', () => {
    window.location.hash = handoff();
    expect(consumeHandoff(1000)).toBe(true);
    expect(window.location.hash).toBe('#/contacts?code=221309');
    const stored = JSON.parse(window.sessionStorage.getItem(KEY)!);
    expect(stored).toEqual({ url: BUDGET, site: 'tabunka-yosan', code: '221309', item: '外国人相談事業', savedAt: 1000 });
  });

  it('窓口検索以外のページでは code も URL に残さない', () => {
    window.location.hash = handoff({}, '/guide/disclosure');
    consumeHandoff();
    expect(window.location.hash).toBe('#/guide/disclosure');
    expect(loadFrom()?.code).toBe('221309');
  });

  it('保存するのは決めた5つの項目だけ（URL に余計なものがあっても入れない）', () => {
    window.location.hash = handoff({ name: '山田太郎', body: '本文' });
    consumeHandoff();
    expect(Object.keys(JSON.parse(window.sessionStorage.getItem(KEY)!)).sort()).toEqual(['code', 'item', 'savedAt', 'site', 'url']);
  });

  it('2時間で期限切れになり、消える', () => {
    window.location.hash = handoff();
    consumeHandoff(1000);
    expect(loadFrom(1000 + FROM_TTL_MS - 1)).not.toBeNull();
    expect(loadFrom(1000 + FROM_TTL_MS)).toBeNull();
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it('新しい有効な情報で丸ごと更新し、無効な情報では更新しない', () => {
    window.location.hash = handoff();
    consumeHandoff();
    window.location.hash = handoff({ code: '13', item: '別の項目', from: 'https://yumaki5555.github.io/mou-map/#/pref/13' });
    consumeHandoff();
    expect(loadFrom()).toMatchObject({ site: 'mou-map', code: '13', item: '別の項目' });

    window.location.hash = handoff({ code: '01', item: 'だまし', from: 'https://evil.example/' });
    expect(consumeHandoff()).toBe(false);
    expect(loadFrom()).toMatchObject({ site: 'mou-map', code: '13', item: '別の項目' });
    expect(window.location.hash).toBe('#/contacts?code=01'); // 無効な from も URL に残さない
  });

  it('保存された値が書きかえられていたら信用せず消す', () => {
    window.sessionStorage.setItem(KEY, JSON.stringify({ url: 'https://evil.example/', site: 'tabunka-yosan', code: null, item: null, savedAt: Date.now() }));
    expect(loadFrom()).toBeNull();
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });
});

describe('自治体コードの対応', () => {
  const m = { prefectures: prefectures.items, municipalities: municipalities.items, wards: wards.items } as AreaMasters;
  const name = (code: string) => {
    const a = resolveArea(code, m);
    return a.kind === 'ward' ? `ward:${a.ward.name}→${a.muni.name}` : a.kind === 'muni' ? `muni:${a.muni.name}` : a.kind === 'pref' ? `pref:${a.pref.name}` : a.kind;
  };

  it('検査数字の計算が総務省のコードと合う', () => {
    expect(withCheckDigit('22130')).toBe('221309');
    expect(withCheckDigit('13101')).toBe('131016');
  });

  it.each([
    ['221309', 'muni:浜松市'],
    ['22130', 'muni:浜松市'],
    ['22', 'pref:静岡県'],
    ['220001', 'pref:静岡県'],
    ['22000', 'pref:静岡県'],
    ['22138', 'ward:浜松市中央区→浜松市'],
    ['221384', 'ward:浜松市中央区→浜松市'],
    ['01101', 'ward:札幌市中央区→札幌市'],
  ])('%s → %s', (code, want) => {
    expect(name(code)).toBe(want);
  });

  it('東京23区は親に置きかえず、その区のまま', () => {
    expect(name('131016')).toBe('muni:千代田区');
    expect(name('13101')).toBe('muni:千代田区');
    expect(name('131237')).toBe('muni:江戸川区');
    expect(wards.items.some((w) => w.code.startsWith('13'))).toBe(false);
  });

  it.each(['131008', '22137', '99999', '99', '221300', '2213', 'abc'])('対応を確かめられない %s は unknown（推測しない）', (code) => {
    expect(resolveArea(code, m).kind).toBe('unknown');
  });

  it('区の表はすべて実在する親の市を指す', () => {
    expect(wards.items).toHaveLength(171);
    for (const w of wards.items) {
      const city = municipalities.items.find((x) => x.code === w.city_code);
      expect(city?.designated, w.name).toBe(true);
      expect(w.name.startsWith(city!.name), w.name).toBe(true);
    }
  });
});

describe('画面', () => {
  const arrive = (hash: string) => {
    window.location.hash = hash;
    consumeHandoff();
    return render(<App />);
  };

  it('戻るリンクは固定の文言で事業の情報を保ち、項目名はリンクにしない。サイト内を移動しても出続ける', async () => {
    arrive(handoff());
    const bar = screen.getByRole('region', { name: '移動元のページへ戻る' });
    const back = within(bar).getByRole('link', { name: '見ていた予算に戻る' });
    expect(back).toHaveAttribute('href', BUDGET);
    expect(within(bar).getByText('見ていた項目：外国人相談事業').closest('a')).toBeNull();
    expect(await screen.findByRole('heading', { level: 3, name: '浜松市' })).toBeInTheDocument();
    expect(screen.getByText(/見ていた項目の担当部署とは限りません/)).toBeInTheDocument();

    await act(async () => {
      window.location.hash = '#/guide/phone';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    const bar2 = screen.getByRole('region', { name: '移動元のページへ戻る' });
    expect(within(bar2).getByRole('link', { name: '見ていた予算に戻る' })).toHaveAttribute('href', BUDGET);
    expect(await within(bar2).findByRole('link', { name: '浜松市の窓口を見る' })).toHaveAttribute('href', '#/contacts?tab=area&code=221309');
  });

  it('×で閉じるとメモも消える', async () => {
    const user = userEvent.setup();
    arrive(handoff());
    await user.click(screen.getByRole('button', { name: '戻る案内を閉じる' }));
    expect(screen.queryByRole('region', { name: '移動元のページへ戻る' })).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it('戻るリンクを押すとメモが消える', async () => {
    arrive(handoff());
    const back = screen.getByRole('link', { name: '見ていた予算に戻る' });
    back.addEventListener('click', (e) => e.preventDefault());
    await userEvent.setup().click(back);
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it('メモがなければ帯は出ない', () => {
    clearFrom();
    window.location.hash = '#/contacts?code=221309';
    render(<App />);
    expect(screen.queryByRole('region', { name: '移動元のページへ戻る' })).not.toBeInTheDocument();
  });

  it('政令市の区のコードは「○○市の問い合わせ先」と明示する', async () => {
    window.location.hash = '#/contacts?code=22138';
    render(<App />);
    expect(await screen.findByRole('heading', { level: 3, name: '浜松市の問い合わせ先' })).toBeInTheDocument();
    expect(screen.getByText(/浜松市中央区の窓口は載せていないため、浜松市全体の問い合わせ先/)).toBeInTheDocument();
  });

  it('東京の区は区の名前のまま出す', async () => {
    window.location.hash = '#/contacts?code=13101';
    render(<App />);
    expect(await screen.findByRole('heading', { level: 3, name: '千代田区' })).toBeInTheDocument();
    expect(screen.queryByText(/の問い合わせ先を出しています/)).not.toBeInTheDocument();
  });

  it('対応を確かめられないコードは、利用者に選んでもらう', async () => {
    window.location.hash = '#/contacts?code=99999';
    render(<App />);
    expect(await screen.findByText(/地域を自動で開けませんでした/)).toBeInTheDocument();
    expect(screen.getByLabelText(/都道府県を選ぶ/)).toHaveValue('');
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });

  const unlisted = [
    {
      municipality_code: '012025',
      municipality_name: '函館市',
      contacts: [
        { id: '012025-general', type: 'general', department: '代表', phone: null, email: null, form_url: null, postal_code: null, postal_address: null, hours: null, source_url: 'https://www.city.hakodate.hokkaido.jp/', verified_at: null, status: 'unverified', note: null },
      ],
    },
  ];

  it('窓口を表示できない自治体：確認中と案内し、確かめた公式サイトへつなぐ', async () => {
    dataOverrides.set('contacts/01.json', unlisted);
    dataOverrides.set('master/official-sites.json', { items: { '012025': 'https://www.city.hakodate.hokkaido.jp/' } });
    window.location.hash = '#/contacts?code=012025';
    render(<App />);
    expect(await screen.findByText('窓口情報は確認中です。')).toBeInTheDocument();
    expect(screen.getByText(/窓口がないという意味ではありません/)).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /函館市の公式サイト/ })).toHaveAttribute('href', 'https://www.city.hakodate.hokkaido.jp/');
  });

  it('公式サイトを確かめられていなければ、リンク集（J-LIS）で案内する', async () => {
    dataOverrides.set('contacts/01.json', unlisted);
    dataOverrides.set('master/official-sites.json', { items: {} });
    window.location.hash = '#/contacts?code=012025';
    render(<App />);
    expect(await screen.findByText('窓口情報は確認中です。')).toBeInTheDocument();
    expect(screen.getByText(/上のリンク集から探せます/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /J-LIS.*公式サイトを探す/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /函館市の公式サイト/ })).not.toBeInTheDocument();
  });

  it('調査して見当たらなかった窓口は、確認中と混ぜない', async () => {
    dataOverrides.set('contacts/01.json', [
      {
        municipality_code: '012025',
        municipality_name: '函館市',
        contacts: [{ ...unlisted[0].contacts[0], status: 'unavailable', verified_at: '2026-11-01' }],
      },
    ]);
    window.location.hash = '#/contacts?code=012025';
    render(<App />);
    expect(await screen.findByText(/公式サイトに掲載が見当たりません/)).toBeInTheDocument();
    expect(screen.queryByText('窓口情報は確認中です。')).not.toBeInTheDocument();
  });
});

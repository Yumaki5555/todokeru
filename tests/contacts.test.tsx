// 全国の窓口を探す
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import type { Contact } from '../src/types';
import { dataOverrides } from './setup';

function openContacts(hash = '#/contacts') {
  window.location.hash = hash;
  return render(<App />);
}

describe('窓口検索', () => {
  it('調査中であること、登録数と確認済み窓口数を別々に出す', async () => {
    openContacts();
    expect(screen.getByRole('heading', { level: 1, name: '全国の窓口を探す' })).toBeInTheDocument();
    expect(screen.getByText(/推測した電話番号やメールアドレスは載せません/)).toBeInTheDocument();
    const stats = await screen.findByLabelText('登録件数');
    expect(within(stats).getByText('登録している機関・自治体')).toBeInTheDocument();
    expect(within(stats).getByText('公式確認済みの窓口')).toBeInTheDocument();
    expect(within(stats).getByText('1,741')).toBeInTheDocument();
  });

  it('窓口の種類（代表・広聴・議会事務局）の違いを説明している', () => {
    openContacts();
    for (const t of ['行政代表窓口', '広聴・ご意見窓口', '議会事務局']) expect(screen.getAllByText(t).length).toBeGreaterThanOrEqual(1);
  });

  it('都道府県→市区町村を選ぶと、その自治体の窓口（未調査）が出て、URL にも残る', async () => {
    openContacts();
    const pref = await screen.findByLabelText('都道府県を選ぶ');
    await userEvent.selectOptions(pref, '13');
    expect(window.location.hash).toBe('#/contacts?tab=area&code=13');
    expect(await screen.findByRole('heading', { level: 3, name: '東京都' })).toBeInTheDocument();
    const muni = screen.getByLabelText('市区町村を選ぶ');
    expect(within(muni).getAllByRole('option')).toHaveLength(63); // 「都道府県の窓口を見る」＋62区市町村
    await userEvent.selectOptions(muni, '131083');
    expect(window.location.hash).toBe('#/contacts?tab=area&code=131083');
    const card = await screen.findByRole('article');
    expect(within(card).getByRole('heading', { name: '江東区' })).toBeInTheDocument();
    expect(within(card).getByText('131083')).toBeInTheDocument();
    expect(await within(card).findAllByText('未調査')).toHaveLength(3);
    expect(within(card).queryByRole('link', { name: /電話をかける/ })).not.toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /J-LIS「全国自治体マップ検索」/ })).toHaveAttribute(
      'href',
      'https://www.j-lis.go.jp/spd/map-search/cms_1069.html',
    );
  });

  it('自治体コードつきの URL で開くと、その自治体を選んだ状態になる', async () => {
    openContacts('#/contacts?code=131083');
    expect(await screen.findByRole('heading', { level: 3, name: '江東区' })).toBeInTheDocument();
    expect(screen.getByLabelText('都道府県を選ぶ')).toHaveValue('13');
    expect(screen.getByLabelText('市区町村を選ぶ')).toHaveValue('131083');
  });

  it('存在しないコードは無視する', async () => {
    openContacts('#/contacts?code=999999');
    await screen.findByLabelText('都道府県を選ぶ');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('国の機関から探す：機関を選ぶと公式サイトへのリンクが出る', async () => {
    openContacts();
    await screen.findByLabelText('都道府県を選ぶ');
    await userEvent.click(screen.getByRole('button', { name: '国の機関から探す' }));
    await userEvent.click(screen.getByRole('button', { name: '厚生労働省' }));
    expect(window.location.hash).toBe('#/contacts?tab=agency&id=mhlw');
    const card = await screen.findByRole('article');
    expect(within(card).getByRole('link', { name: /厚生労働省の公式サイト/ })).toHaveAttribute('href', 'https://www.mhlw.go.jp/');
    expect(await within(card).findAllByText('未調査')).toHaveLength(2); // 代表・広聴（国の機関に議会事務局はない）
  });

  it('名前で検索：ひらがなでも見つかり、選ぶとその自治体の窓口が出る', async () => {
    openContacts();
    await screen.findByLabelText('都道府県を選ぶ');
    await userEvent.click(screen.getByRole('button', { name: '名前で検索' }));
    await userEvent.type(screen.getByLabelText('自治体名・機関名'), 'こうとう');
    const hit = await screen.findByRole('button', { name: /江東区\s*東京都/ });
    await userEvent.click(hit);
    expect(window.location.hash).toBe('#/contacts?tab=area&code=131083');
    expect(await screen.findByRole('heading', { level: 3, name: '江東区' })).toBeInTheDocument();
  });

  it('見つからないときはそう表示する', async () => {
    openContacts('#/contacts?tab=search');
    await userEvent.type(await screen.findByLabelText('自治体名・機関名'), 'ぞぞぞ');
    expect(screen.getByText(/見つかりませんでした/)).toBeInTheDocument();
  });
});

describe('窓口データがあるときの表示（テスト用の架空データ）', () => {
  const base: Contact = {
    id: '131083-general',
    type: 'general',
    department: 'テスト代表窓口',
    phone: '03-0000-0000',
    email: 'test@example.jp',
    form_url: 'https://example.jp/form',
    postal_code: '100-0000',
    postal_address: 'テスト県テスト市1-1',
    hours: '平日 8時30分〜17時',
    source_url: 'https://example.jp/contact',
    verified_at: '2026-10-01',
    status: 'verified',
  };

  it('確認済みの窓口は電話・メール・フォーム・住所・出典・確認日を出す。未確認や出典なしは出さない', async () => {
    dataOverrides.set('contacts/13.json', [
      {
        municipality_code: '131083',
        municipality_name: '江東区',
        contacts: [
          base,
          { ...base, id: '131083-feedback', type: 'feedback', department: '未確認の窓口', phone: '03-1111-1111', status: 'unverified' },
          { ...base, id: '131083-assembly', type: 'assembly', department: '出典のない窓口', phone: '03-2222-2222', source_url: null },
        ],
      },
    ]);
    openContacts('#/contacts?code=131083');
    const card = await screen.findByRole('article');
    const tel = await within(card).findByRole('link', { name: /電話をかける：\s*03-0000-0000/ });
    expect(tel).toHaveAttribute('href', 'tel:0300000000');
    expect(within(card).getByRole('link', { name: /メールアプリで開く：\s*test@example\.jp/ })).toHaveAttribute('href', 'mailto:test@example.jp');
    expect(within(card).getByRole('link', { name: '公式の問い合わせフォーム' })).toHaveAttribute('href', 'https://example.jp/form');
    expect(within(card).getByText(/〒100-0000 テスト県テスト市1-1/)).toBeInTheDocument();
    expect(within(card).getByText(/受付時間：平日/)).toBeInTheDocument();
    expect(within(card).getByText(/最終確認日：2026年10月1日/)).toBeInTheDocument();
    expect(within(card).getByText('公式確認済み')).toBeInTheDocument();
    // 未確認の窓口は番号を出さない
    expect(within(card).queryByText(/03-1111-1111/)).not.toBeInTheDocument();
    expect(within(card).getByText(/公式の確認が済んでいないため、連絡先は表示していません/)).toBeInTheDocument();
    // 出典のない「確認済み」は点検ではじかれ、表示されない
    expect(within(card).queryByText(/03-2222-2222/)).not.toBeInTheDocument();
  });

  it('要再確認の窓口は注意書きつきで出す', async () => {
    dataOverrides.set('contacts/13.json', [
      { municipality_code: '131083', municipality_name: '江東区', contacts: [{ ...base, status: 'review' }] },
    ]);
    openContacts('#/contacts?code=131083');
    const card = await screen.findByRole('article');
    expect(await within(card).findByText(/情報が変わっている可能性があります/)).toBeInTheDocument();
    expect(within(card).getByText('要再確認')).toBeInTheDocument();
  });

  it('窓口データを読めないときは、もう一度読み込むボタンを出す', async () => {
    dataOverrides.set('contacts/13.json', { broken: true });
    openContacts('#/contacts?code=131083');
    const card = await screen.findByRole('article');
    expect(await within(card).findByRole('button', { name: 'もう一度読み込む' })).toBeInTheDocument();
  });
});

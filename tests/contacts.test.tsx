// 全国の窓口を探す
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import type { Contact, DataSummary } from '../src/types';
import { dataOverrides } from './setup';

function openContacts(hash = '#/contacts') {
  window.location.hash = hash;
  return render(<App />);
}

describe('窓口検索', () => {
  const emptySummary: DataSummary = {
    generated_at: '2026-11-01',
    entities: { agencies: 22, prefectures: 47, municipalities: 1741 },
    contacts: { total: 0, verified: 0, by_status: { verified: 0, unverified: 0, review: 0, unavailable: 0, discontinued: 0, auto_matched: 0 } },
    coverage: {
      agencies: { total: 22, researched: 0, with_verified: 0, with_shown: 0 },
      prefectures: { total: 47, researched: 0, with_verified: 0, with_shown: 0 },
      municipalities: { total: 1741, researched: 0, with_verified: 0, with_shown: 0 },
    },
    by_pref: {},
  };

  it('連絡先が1件もないときは「調査中」と出す', async () => {
    dataOverrides.set('summary.json', emptySummary);
    openContacts();
    expect(screen.getByRole('heading', { level: 1, name: '全国の窓口を探す' })).toBeInTheDocument();
    expect(await screen.findByText(/推測した電話番号やメールアドレスは載せません/)).toBeInTheDocument();
    expect(screen.queryByRole('note', { name: /^公式確認済みの連絡先/ })).not.toBeInTheDocument();
  });

  it('連絡先が登録されたら、冒頭は実際の登録状況（機関・自治体の数）の案内になる', async () => {
    dataOverrides.set('summary.json', {
      ...emptySummary,
      contacts: { ...emptySummary.contacts, total: 150, verified: 140 },
      coverage: {
        agencies: { total: 22, researched: 22, with_verified: 19, with_shown: 19 },
        prefectures: { total: 47, researched: 47, with_verified: 46, with_shown: 46 },
        municipalities: { total: 1741, researched: 0, with_verified: 0, with_shown: 0 },
      },
    });
    openContacts();
    const note = await screen.findByRole('note', { name: /^連絡先を掲載中/ });
    expect(screen.queryByText(/連絡先は調査中です/)).not.toBeInTheDocument();
    for (const t of ['都道府県', '国の機関', '市区町村']) expect(within(note).getByText(t)).toBeInTheDocument();
    expect(within(note).getByText('46')).toBeInTheDocument();
    expect(within(note).getByText('／1,741')).toBeInTheDocument();
    // 自動照合がなければ、内訳と色の説明は出さない
    expect(within(note).queryByText(/うち人が確認/)).not.toBeInTheDocument();
  });

  it('自動照合の窓口がある自治体も掲載中に数え、人が確認した数を内訳で示す', async () => {
    dataOverrides.set('summary.json', {
      ...emptySummary,
      contacts: { ...emptySummary.contacts, total: 766, verified: 241 },
      coverage: {
        agencies: { total: 22, researched: 22, with_verified: 22, with_shown: 22 },
        prefectures: { total: 47, researched: 47, with_verified: 46, with_shown: 46 },
        municipalities: { total: 1741, researched: 541, with_verified: 21, with_shown: 541 },
      },
    });
    openContacts();
    const note = await screen.findByRole('note', { name: /^連絡先を掲載中/ });
    expect(within(note).getByText('541')).toBeInTheDocument();
    expect(within(note).getByText('うち人が確認 21')).toBeInTheDocument();
    expect(within(note).getByText(/公式サイトと自動照合/)).toBeInTheDocument();
  });

  it('探し方を「地域から探す」「国の機関から探す」「名前で検索」で切りかえられる', async () => {
    openContacts();
    await screen.findByLabelText('都道府県を選ぶ');
    for (const name of ['地域から探す', '国の機関から探す', '名前で検索']) expect(screen.getByRole('button', { name })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '地域から探す' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('窓口の種類（代表・広聴・議会事務局）の違いを説明している', () => {
    openContacts();
    for (const t of ['行政代表窓口', '広聴・ご意見窓口', '議会事務局']) expect(screen.getAllByText(t).length).toBeGreaterThanOrEqual(1);
  });

  it('都道府県→市区町村を選ぶと、その自治体の窓口（未調査）が出て、URL にも残る', async () => {
    dataOverrides.set('contacts/13.json', []);
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
    // 未調査の説明は1か所だけ（窓口の種類ごとにくり返さない）
    expect(await within(card).findAllByText('未調査')).toHaveLength(1);
    for (const t of ['行政代表窓口', '広聴・ご意見窓口', '議会事務局']) expect(within(card).getByText(t)).toBeInTheDocument();
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
    dataOverrides.set('contacts/agencies.json', []);
    openContacts();
    await screen.findByLabelText('都道府県を選ぶ');
    await userEvent.click(screen.getByRole('button', { name: '国の機関から探す' }));
    await userEvent.click(screen.getByRole('button', { name: '厚生労働省' }));
    expect(window.location.hash).toBe('#/contacts?tab=agency&id=mhlw');
    const card = await screen.findByRole('article');
    expect(within(card).getByRole('link', { name: /厚生労働省の公式サイト/ })).toHaveAttribute('href', 'https://www.mhlw.go.jp/');
    expect(await within(card).findAllByText('未調査')).toHaveLength(1);
    expect(within(card).getByText('行政代表窓口')).toBeInTheDocument();
    expect(within(card).queryByText('議会事務局')).not.toBeInTheDocument(); // 国の機関に議会事務局はない
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
    const tel = await within(card).findByRole('link', { name: /電話をかける\s*：\s*03-0000-0000/ });
    expect(tel).toHaveAttribute('href', 'tel:0300000000');
    expect(within(card).getByRole('link', { name: /メールを送る\s*：\s*test@example\.jp/ })).toHaveAttribute('href', 'mailto:test@example.jp');
    expect(within(card).getByRole('link', { name: /問い合わせフォーム/ })).toHaveAttribute('href', 'https://example.jp/form');
    expect(within(card).getByText(/〒100-0000 テスト県テスト市1-1/)).toBeInTheDocument();
    expect(within(card).getByText('平日 8時30分〜17時')).toBeInTheDocument();
    // 出典と確認日は折りたたまずに見せる
    expect(within(card).getByRole('link', { name: /公式ページ/ })).toHaveAttribute('href', 'https://example.jp/contact');
    expect(within(card).getByText(/最終確認日：2026年10月1日/)).toBeVisible();
    expect(within(card).getByText('公式確認済み')).toBeInTheDocument();
    // 見つけた窓口から、その窓口向けの台本づくりへ進める（確認済みの窓口だけ）
    const toScript = within(card).getAllByRole('link', { name: 'この窓口向けに台本を作る' });
    expect(toScript).toHaveLength(1);
    expect(toScript[0]).toHaveAttribute('href', '#/guide/phone?for=131083-general');
    // メールかフォームがある窓口は、その窓口あての文面づくりへも進める
    expect(within(card).getByRole('link', { name: 'この窓口あての文面を作る' })).toHaveAttribute('href', '#/guide/email?for=131083-general');
    // 未確認の窓口は番号を出さない
    expect(within(card).queryByText(/03-1111-1111/)).not.toBeInTheDocument();
    expect(within(card).getByText(/公式の確認待ちのため表示していません/)).toBeInTheDocument();
    // 出典のない「確認済み」は点検ではじかれ、表示されない
    expect(within(card).queryByText(/03-2222-2222/)).not.toBeInTheDocument();
  });

  it('住所しかない窓口にも「この窓口あての文面を作る」を出す（郵送で届けられる）。電話しかない窓口には出さない', async () => {
    const only = { ...base, phone: null, email: null, form_url: null };
    dataOverrides.set('contacts/13.json', [
      {
        municipality_code: '131083',
        municipality_name: '江東区',
        contacts: [
          { ...only, department: '住所だけの窓口' },
          { ...only, id: '131083-feedback', type: 'feedback', department: '電話だけの窓口', phone: '03-3333-3333', postal_code: null, postal_address: null },
        ],
      },
    ]);
    openContacts('#/contacts?code=131083');
    const card = await screen.findByRole('article');
    const links = await within(card).findAllByRole('link', { name: 'この窓口あての文面を作る' });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '#/guide/email?for=131083-general');
  });

  it('直接開くとエラーになるフォームは、リンクのある公式ページへ案内し、押す文字を伝える', async () => {
    dataOverrides.set('contacts/13.json', [
      { municipality_code: '131083', municipality_name: '江東区', contacts: [{ ...base, form_via_page: '区政へのご意見メール' }] },
    ]);
    openContacts('#/contacts?code=131083');
    const card = await screen.findByRole('article');
    const form = await within(card).findByRole('link', { name: /問い合わせフォーム/ });
    expect(form).toHaveAttribute('href', 'https://example.jp/contact');
    expect(form).toHaveTextContent('公式ページの「区政へのご意見メール」から開く');
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

  it('公式サイトと自動照合の代表電話は、その表示と照合日を出し、最終確認日は出さない', async () => {
    const auto: Contact = { ...base, email: null, form_url: null, postal_code: null, postal_address: null, hours: null, verified_at: null, matched_at: '2026-11-01', status: 'auto_matched' };
    dataOverrides.set('contacts/13.json', [{ municipality_code: '131083', municipality_name: '江東区', contacts: [auto] }]);
    openContacts('#/contacts?code=131083');
    const card = await screen.findByRole('article');
    expect(await within(card).findByRole('link', { name: /電話をかける\s*：\s*03-0000-0000/ })).toBeInTheDocument();
    expect(within(card).getByText('公式サイトと自動照合')).toBeInTheDocument();
    expect(within(card).getByText(/人による確認の前/)).toBeInTheDocument();
    expect(within(card).getByText(/照合日：2026年11月1日/)).toBeVisible();
    expect(within(card).queryByText(/最終確認日/)).not.toBeInTheDocument();
    expect(within(card).queryByText('公式確認済み')).not.toBeInTheDocument();
  });

  it('警察・教育委員会は、載せた自治体にだけ欄を出す。都道府県の警察は、その市区町村の結果にも出す', async () => {
    dataOverrides.set('contacts/13.json', [
      {
        municipality_code: '130001',
        municipality_name: '東京都',
        contacts: [base, { ...base, id: '130001-police', type: 'police', department: 'テスト警察 相談センター', phone: '03-4444-4444' }],
      },
      {
        municipality_code: '131083',
        municipality_name: '江東区',
        contacts: [{ ...base, id: '131083-education', type: 'education', department: 'テスト教育委員会', phone: '03-5555-5555' }],
      },
    ]);
    openContacts('#/contacts?code=130001');
    let card = await screen.findByRole('article');
    expect(await within(card).findByRole('heading', { level: 4, name: '警察・公安委員会' })).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /03-4444-4444/ })).toBeInTheDocument();
    expect(within(card).queryByRole('heading', { level: 4, name: '教育委員会' })).not.toBeInTheDocument(); // 東京都の教育委員会はまだ載せていない

    window.location.hash = '#/contacts?code=131083';
    card = await screen.findByRole('article');
    expect(await within(card).findByRole('heading', { level: 3, name: '江東区' })).toBeInTheDocument();
    // 基本の3つはまだないので「未調査」の案内を1か所だけ。その下に、載せた教育委員会と、東京都の警察
    expect(await within(card).findAllByText('未調査')).toHaveLength(1);
    expect(within(card).getByRole('heading', { level: 4, name: '教育委員会' })).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /03-5555-5555/ })).toBeInTheDocument();
    expect(within(card).getByRole('heading', { level: 4, name: /警察・公安委員会\s*（東京都）/ })).toBeInTheDocument();
    expect(within(card).getByText('警察は都道府県の仕事なので、東京都の窓口を出しています。')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /03-4444-4444/ })).toBeInTheDocument();
  });

  it('警察・教育委員会を載せていない自治体には、その欄を出さない', async () => {
    dataOverrides.set('contacts/13.json', [{ municipality_code: '131083', municipality_name: '江東区', contacts: [base] }]);
    openContacts('#/contacts?code=131083');
    const card = await screen.findByRole('article');
    await within(card).findByRole('link', { name: /03-0000-0000/ });
    expect(within(card).queryByText('警察・公安委員会')).not.toBeInTheDocument();
    expect(within(card).queryByText('教育委員会')).not.toBeInTheDocument();
  });

  it('窓口データを読めないときは、もう一度読み込むボタンを出す', async () => {
    dataOverrides.set('contacts/13.json', { broken: true });
    openContacts('#/contacts?code=131083');
    const card = await screen.findByRole('article');
    expect(await within(card).findByRole('button', { name: 'もう一度読み込む' })).toBeInTheDocument();
  });
});

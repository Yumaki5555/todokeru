// サイト全体の設定（名前・外部リンク・更新日・監修の状態）
import type { SupervisionStatus } from './types';

export const SITE = {
  name: '声を届ける。',
  catchCopy: '知ることから、行動へ。',
  // subCopy と description は index.html の共有用の説明（og:description など）と同じ文。トップページには表示しない
  subCopy: '疑問に思ったこと、伝えたいこと。その声を適切な窓口へ届けるために。',
  description: '電話、メール、パブコメ、請願・陳情。自分に合った方法を知り、適切な窓口に声を届けるためのサイトです。',
  /** 最終更新日（内容を直したらここを変える） */
  updated: '2026-11-04',
  portal: { label: '日本を知る。', url: 'https://yumaki5555.github.io/' },
  pubcome: { label: 'パブコメ掲示板', url: 'https://yumaki5555.github.io/pubcome/', desc: 'いま意見を出せる国の案件（パブリックコメント）の一覧' },
  shomei: { label: '署名掲示板', url: 'https://yumaki5555.github.io/shomei/', desc: 'いま賛同を集めている署名の一覧' },
  /** 自治体の公式サイトを探すための公的なリンク集 */
  jlisMap: {
    label: 'J-LIS「全国自治体マップ検索」',
    url: 'https://www.j-lis.go.jp/spd/map-search/cms_1069.html',
    desc: '地方公共団体情報システム機構（J-LIS）による、全国の自治体の公式サイトへのリンク集',
  },
} as const;

/**
 * 電話マニュアルの監修
 * status を変えると、ガイドの冒頭と末尾の表記が変わる。
 *   'confirmed' … ご本人に監修の確認が取れた（「マニュアル監修：電突の牙さん」と表示）
 *   'pending'   … 監修をお願い中・確認中（「監修は確認中」と表示）
 *   'none'      … 監修なし（考え方を参考にしたことだけ表示）
 * 確認が取れたら status を 'confirmed' に、confirmedAt に確認日を入れる。
 */
export const SUPERVISION: {
  status: SupervisionStatus;
  name: string;
  xHandle: string;
  xUrl: string;
  confirmedAt: string | null;
} = {
  status: 'confirmed',
  name: '電突の牙さん',
  xHandle: '@MinNanoRamen21',
  xUrl: 'https://x.com/MinNanoRamen21',
  confirmedAt: '2026-11-01',
};

/**
 * 間違い・ご要望の報告先（Google フォーム「声を届ける。｜間違いの報告・ご意見・ご要望」）
 * formUrl が空のあいだは、報告の案内（各ページの末尾・フッター・このサイトについて・窓口カード）を出さない。
 * formUrl は docs.google.com/forms/… の「回答用の URL」。
 * entries は、フォームの質問の番号（事前入力した URL の entry.〇〇〇）。入れておくと、見ていたページの URL などを書き込んだ状態でフォームが開く。
 * フォームの作り直しは todokeru_tools/report_form/報告フォーム作成.gs（記録は 点検記録/第4段階/報告フォーム_2026-11-04.md）。
 */
export type ReportEntries = { kind: string; page: string; detail: string; url: string };
export const REPORT: { formUrl: string; entries: ReportEntries } = {
  formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfN-_66wZLN0OmLcssTyKHX97JbedB9f-RWAi_Ov4Jd0JKl3A/viewform',
  entries: {
    kind: 'entry.725497755', // お問い合わせの種類（選択式）
    page: 'entry.2060897046', // どのページについてですか？（選択式）
    detail: 'entry.1833540706', // 詳しい内容
    url: 'entry.741835039', // 該当ページのURL
  },
};

/** フォームに最初から書き込んでおく値（kind・page はフォームの選択肢の文字そのまま） */
export type ReportPrefill = Partial<ReportEntries>;

/** サイトのページ（#/…）→ フォームの「どのページについてですか？」の選択肢 */
const REPORT_PAGES: [string, string][] = [
  ['/', 'トップページ・3分でわかる'],
  ['/sanpun', 'トップページ・3分でわかる'],
  ['/contacts', '全国の窓口を探す（窓口検索）'],
  ['/guide/phone', '電話のかけ方・台本'],
  ['/guide/email', 'メール・フォーム・郵送（手紙）'],
  ['/guide/public-comment', 'パブコメ（パブリックコメント）の書き方'],
  ['/guide/petition', '請願・陳情の書き方'],
  ['/guide/disclosure', '情報公開請求'],
  ['/guide/signature', '署名の方法'],
  ['/about', 'このサイトについて'],
];
export function reportPageChoice(path: string): string {
  return REPORT_PAGES.find(([p]) => p === path)?.[1] ?? '';
}

/** 報告フォームの URL（prefill は最初から書き込んでおく値）。報告先が未設定なら空 */
export function reportUrl(prefill: ReportPrefill = {}, report = REPORT): string {
  if (!report.formUrl) return '';
  const u = new URL(report.formUrl);
  // 事前の書き込みは docs.google.com の URL のときだけ（短縮 URL の forms.gle では付けた値が消える）
  if (u.hostname !== 'docs.google.com') return u.toString();
  let filled = false;
  (Object.keys(report.entries) as (keyof ReportEntries)[]).forEach((k) => {
    const entry = report.entries[k];
    const value = prefill[k];
    if (entry && value) {
      u.searchParams.set(entry, value);
      filled = true;
    }
  });
  if (filled) u.searchParams.set('usp', 'pp_url');
  return u.toString();
}

/** 日付（YYYY-MM-DD）を「2026年11月1日」の形にする */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

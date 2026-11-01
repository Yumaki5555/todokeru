// サイト全体の設定（名前・外部リンク・更新日・監修の状態）
import type { SupervisionStatus } from './types';

export const SITE = {
  name: '声を届ける。',
  catchCopy: '知ることから、行動へ。',
  subCopy: '疑問に思ったこと、伝えたいこと。その声を適切な窓口へ届けるために。',
  description: '電話、メール、パブコメ、請願・陳情。自分に合った方法を知り、適切な窓口に声を届けるためのサイトです。',
  /** 最終更新日（内容を直したらここを変える） */
  updated: '2026-11-01',
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
  status: 'pending',
  name: '電突の牙さん',
  xHandle: '@MinNanoRamen21',
  xUrl: 'https://x.com/MinNanoRamen21',
  confirmedAt: null,
};

/** 日付（YYYY-MM-DD）を「2026年11月1日」の形にする */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

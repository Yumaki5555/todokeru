// 「まず3分でわかる」の内容（5つのSTEP）
// 各STEPは「大きなアイコン＋短い見出し＋1文」。説明の代わりに小さな図（figure）で見せる。
import type { IconName, ThreeMinuteStep } from '../types';
import { SITE } from '../site';

export const THREE_MINUTE_STEPS: ThreeMinuteStep[] = [
  {
    no: 1,
    title: '声の届け方を選ぶ',
    icon: 'route',
    text: '電話・メール・パブコメ・請願など、方法によって届く先や扱われ方が違います。',
    figure: {
      kind: 'icons',
      items: [
        { icon: 'phone', label: '電話' },
        { icon: 'mail', label: 'メール' },
        { icon: 'comment', label: 'パブコメ' },
        { icon: 'petition', label: '請願・陳情' },
      ],
    },
  },
  {
    no: 2,
    title: '電話・メールで伝える',
    icon: 'phone',
    text: '1行の台本を用意すれば、わからないことも落ち着いて質問できます。',
    figure: {
      kind: 'flow',
      items: [
        { icon: 'list', label: '台本は1行' },
        { icon: 'phone', label: '電話する' },
        { icon: 'memo', label: '記録をお願い' },
      ],
    },
    more: { label: '電話の台本を作る', to: '/guide/phone' },
  },
  {
    no: 3,
    title: 'パブコメを提出する',
    icon: 'comment',
    text: 'パブコメは、国や自治体が募集している案に、期限内に意見を出す方法です。',
    figure: {
      kind: 'flow',
      items: [
        { icon: 'book', label: '案を読む' },
        { icon: 'comment', label: '意見を書く' },
        { icon: 'send', label: '期限内に提出' },
      ],
    },
    more: { label: '募集中の案件を見る（パブコメ掲示板）', to: SITE.pubcome.url },
  },
  {
    no: 4,
    title: '請願・陳情を提出する',
    icon: 'assembly',
    text: '請願・陳情は、条例や予算を決める議会に、正式に検討を求める方法です。',
    figure: {
      kind: 'compare',
      items: [
        { icon: 'petition', label: '請願', sub: '原則、議員の紹介が必要' },
        { icon: 'memo', label: '陳情', sub: '紹介なしで出せる（扱いは議会ごとに違う）' },
      ],
    },
  },
  {
    no: 5,
    title: '窓口を探して行動する',
    icon: 'map',
    text: '目的に合った方法を選び、公式の窓口を確かめて届けましょう。',
    more: { label: '全国の窓口を探す', to: '/contacts' },
  },
];

/** STEP 5 の早見表：したいこと → 向いている方法（最初は折りたたむ） */
export const PURPOSE_TABLE: { purpose: string; method: string; icon: IconName }[] = [
  { purpose: '制度のしくみを知りたい', method: '担当部署に電話・メールで質問', icon: 'phone' },
  { purpose: '意見や要望を伝えたい', method: '広聴・ご意見窓口（電話・フォーム・郵送）', icon: 'chat' },
  { purpose: '募集中の案に意見したい', method: 'パブコメ', icon: 'comment' },
  { purpose: '議会で取り上げてほしい', method: '請願・陳情', icon: 'assembly' },
  { purpose: '行政の文書を見たい', method: '情報公開請求', icon: 'folder' },
  { purpose: '同じ考えの人の声を集めたい', method: '署名', icon: 'signature' },
];

export const PURPOSE_NOTE = 'どの方法でも、送り先と手続きは、各機関の公式ページで確かめましょう。';

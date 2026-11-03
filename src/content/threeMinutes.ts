// 「まず3分でわかる」の内容（4つのSTEP）
// 各STEPは「大きなアイコン＋短い見出し＋1文」。説明の代わりに選択肢のカードや小さな図で見せる。
// 電話・メール・パブコメ・請願などは順番に行う手順ではなく、目的に合わせて選ぶ「方法」として STEP 2 に並べる。
import type { ThreeMinuteMethod, ThreeMinutePurpose, ThreeMinuteStep } from '../types';

export const THREE_MINUTE_STEPS: ThreeMinuteStep[] = [
  {
    no: 1,
    title: '何をしたい？',
    icon: 'bulb',
    text: 'あてはまるものを押すと、向いている方法に印がつきます。',
    choices: 'purposes',
  },
  {
    no: 2,
    title: '方法を選ぼう',
    icon: 'route',
    text: '順番に全部行う手順ではなく、目的に合わせて選ぶ方法です。',
    choices: 'methods',
  },
  {
    no: 3,
    title: '届ける先を探そう',
    icon: 'map',
    text: '国・自治体・議会から、目的に合う公式の窓口を探します。',
    figure: {
      kind: 'icons',
      items: [
        { icon: 'landmark', label: '国の機関' },
        { icon: 'building', label: '自治体' },
        { icon: 'assembly', label: '議会' },
      ],
    },
    more: [{ label: '全国の窓口を探す', to: '/contacts' }],
  },
  {
    no: 4,
    title: '準備して届けよう',
    icon: 'send',
    text: '電話の台本やメール・手紙の文面は、このサイトで作れます。',
    figure: {
      kind: 'list',
      items: [
        { icon: 'memo', label: '必要な事実や資料を整理する' },
        { icon: 'form', label: '台本・文章を作る' },
        { icon: 'send', label: '選んだ方法で届ける' },
        { icon: 'clipboard', label: '回答を確認・記録する', sub: '必要なときに' },
      ],
    },
    more: [
      { label: '電話の台本を作る', to: '/guide/phone' },
      { label: 'メール・手紙の文面を作る', to: '/guide/email' },
    ],
  },
];

/** STEP 1：したいこと → 向いている方法（label の「/」は折り返してよい位置。表示しない） */
export const PURPOSES: ThreeMinutePurpose[] = [
  { id: 'question', label: '質問・確認したい', icon: 'question', methods: ['phone', 'email'] },
  { id: 'opinion', label: '意見や要望を/伝えたい', icon: 'chat', methods: ['phone', 'email', 'public-comment'] },
  { id: 'change', label: '制度やルールの/変更を求めたい', icon: 'scale', methods: ['public-comment', 'petition', 'signature'] },
  { id: 'info', label: '情報や資料を/入手したい', icon: 'folder', methods: ['disclosure', 'phone', 'email'] },
];

/** STEP 2：6つの方法（並列の選択肢。並び順は「声を届ける方法を知る」と同じ。「/」は折り返してよい位置） */
export const METHODS: ThreeMinuteMethod[] = [
  { slug: 'phone', label: '電話', sub: 'その場で/聞ける' },
  { slug: 'email', label: 'メール・郵送', sub: '文章で/残せる' },
  { slug: 'public-comment', label: 'パブリック/コメント', sub: '募集中の案に/意見' },
  { slug: 'petition', label: '請願・陳情', sub: '議会に/検討を求める' },
  { slug: 'disclosure', label: '情報公開/請求', sub: '行政の文書を/見る' },
  { slug: 'signature', label: '署名', sub: '賛同の声を/集める' },
];

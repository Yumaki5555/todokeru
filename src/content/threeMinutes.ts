// 「3分でわかる」の内容（4つのSTEP＋声を届ける前に知っておきたいこと）
// 各STEPは「大きなアイコン＋短い見出し＋1文」。説明の代わりに選択肢のカードや小さな図で見せる。
// 電話・メール・パブコメ・請願などは順番に行う手順ではなく、目的に合わせて選ぶ「方法」として STEP 2 に並べる。
// PURPOSES（目的 → こんな方法があります）はトップの「何をしたいですか？」と共通。直すときはここだけ直す。
import type { BeforeYouSendItem, GuideSlug, ThreeMinuteMethod, ThreeMinutePurpose, ThreeMinuteStep } from '../types';

export const THREE_MINUTE_STEPS: ThreeMinuteStep[] = [
  {
    no: 1,
    title: '何をしたい？',
    icon: 'bulb',
    text: 'あてはまるものを押すと、使える方法が出てきます。',
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
    text: '選んだ方法の準備は、ここから始められます。',
    figure: {
      kind: 'list',
      items: [
        { icon: 'memo', label: '必要な事実や資料を整理する' },
        { icon: 'form', label: '台本・文章を作る' },
        { icon: 'send', label: '選んだ方法で届ける' },
        { icon: 'clipboard', label: '回答を確認・記録する', sub: '必要なときに' },
      ],
    },
    methodActions: true,
  },
];

/** したいこと → こんな方法があります（トップと STEP 1 で共通。label の「/」は折り返してよい位置。表示しない）
 *  to の 'contacts'（窓口を探す）と 'official'（公式サイトを探す）は、届ける方法ではなく補助の行動 */
export const PURPOSES: ThreeMinutePurpose[] = [
  {
    id: 'question',
    label: '質問・/確認したい',
    icon: 'question',
    ways: [
      { when: '直接確認する', to: ['phone'] },
      { when: '文章で質問する', to: ['email'] },
      { when: '担当部署がわからない', to: ['contacts'] },
    ],
  },
  {
    id: 'opinion',
    label: '意見・要望を/伝えたい',
    icon: 'chat',
    ways: [
      { when: '担当部署に伝える', to: ['phone', 'email'] },
      { when: '募集中の案に意見を出す', to: ['public-comment'] },
      { when: '議会に要望する', to: ['petition'] },
    ],
  },
  {
    id: 'change',
    label: '制度を/変えてほしい',
    icon: 'scale',
    ways: [
      { when: '募集中の案がある', to: ['public-comment'] },
      { when: '議会に働きかける', to: ['petition'] },
      { when: '担当部署に伝える', to: ['phone', 'email'] },
      { when: '賛同の声を集める', to: ['signature'] },
    ],
  },
  {
    id: 'info',
    label: '情報・資料が/ほしい',
    icon: 'folder',
    ways: [
      { when: '内容を確認する', to: ['phone', 'email'] },
      { when: '公開資料を調べる', to: ['official'] },
      { when: '行政が持つ文書の開示を求める', to: ['disclosure'] },
    ],
  },
];

/** その目的で使える「届ける方法」（STEP 2 の印に使う。補助の行動は含めない） */
export function purposeMethods(p: ThreeMinutePurpose): GuideSlug[] {
  return p.ways.flatMap((w) => w.to).filter((t): t is GuideSlug => t !== 'contacts' && t !== 'official');
}

/** 6つの方法（STEP 2 のカード・STEP 4 のボタン・トップの「すぐ使いたい方」で共通。並び順は「声を届ける方法を知る」と同じ。「/」は折り返してよい位置）
 *  action / start：その方法の準備を始めるボタンの名前と行き先（作成欄や「書いてみよう」などの場所へ直接） */
export const METHODS: ThreeMinuteMethod[] = [
  { slug: 'phone', label: '電話', sub: 'その場で/聞ける', action: '電話の台本を/作る', start: '/guide/phone' },
  { slug: 'email', label: 'メール・/手紙', sub: '文章で/残せる', action: 'メール・手紙の/文面を作る', start: '/guide/email' },
  { slug: 'public-comment', label: 'パブリック/コメント', sub: '募集中の案に/意見', action: 'パブコメを/書く', start: '/guide/public-comment' },
  { slug: 'petition', label: '請願・陳情', sub: '議会に/検討を求める', action: '請願・陳情を/書く', start: '/guide/petition?s=write' },
  { slug: 'disclosure', label: '情報公開/請求', sub: '行政の文書を/見る', action: '情報公開を/請求する', start: '/guide/disclosure?s=request' },
  { slug: 'signature', label: '署名', sub: '賛同の声を/集める', action: '署名する・/集める', start: '/guide/signature?s=try' },
];

/** 3分ガイドの最後：声を届ける前に知っておきたいこと（どの方法にも共通することだけ。方法ごとの話は各ガイドへ） */
export const BEFORE_YOU_SEND: BeforeYouSendItem[] = [
  { icon: 'scale', text: '届けた声が、そのまま通るとは限りません。個別の返事がないこともあります。' },
  { icon: 'route', text: '方法ごとに、役割・届け先・条件が違います。' },
  { icon: 'memo', text: '確かめた事実と、自分の意見を分けて伝えます。' },
  { icon: 'sparkle', text: 'AIの答えは公式の資料で確かめ、最後は自分で判断します。' },
];

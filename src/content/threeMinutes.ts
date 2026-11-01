// 「まず3分でわかる」の内容（5つのSTEP）
import type { ThreeMinuteStep } from '../types';
import { SITE } from '../site';

export const THREE_MINUTE_STEPS: ThreeMinuteStep[] = [
  {
    no: 1,
    title: '声を届ける方法を知る',
    icon: 'route',
    body: [
      '行政や議会に声を届ける方法は、ひとつではありません。電話、メール、公式の問い合わせフォーム、郵送、パブコメ、請願・陳情などがあります。',
      '方法によって、届く先や、そのあとの扱われ方が違います。',
    ],
  },
  {
    no: 2,
    title: 'まずは質問や意見を伝える',
    icon: 'phone',
    body: [
      'いちばん身近なのは、窓口への電話です。伝えたいことを1行の台本にしておけば、読み上げるだけで伝えられます。',
      'わからないことは、わからないまま質問してかまいません。',
    ],
    more: { label: '電話のかけ方を読む', to: '/guide/phone' },
  },
  {
    no: 3,
    title: '制度について意見を出す',
    icon: 'comment',
    body: [
      '国や自治体は、新しいきまりや計画をつくるとき、案を公表して意見を募集することがあります。これがパブリックコメント（パブコメ）です。',
      '募集されている案に対して、決められた期間内に、指定された方法で意見を出します。',
    ],
    more: { label: 'いま募集中の案件を見る（パブコメ掲示板）', to: SITE.pubcome.url },
  },
  {
    no: 4,
    title: '議会に届ける',
    icon: 'assembly',
    body: [
      '条例や予算を決めるのは議会です。議会に正式に検討を求める方法として、請願と陳情があります。',
      '請願を出すには、原則として議員の紹介が必要です。陳情は紹介がなくても出せますが、扱い方は議会ごとに違います。',
    ],
  },
  {
    no: 5,
    title: '自分に合った方法を選ぶ',
    icon: 'list',
    body: ['何をしたいかによって、向いている窓口や手続きが変わります。'],
    more: { label: '全国の窓口を探す', to: '/contacts' },
  },
];

/** STEP 5 の早見表：したいこと → 向いている方法 */
export const PURPOSE_TABLE: { purpose: string; method: string }[] = [
  { purpose: '制度のしくみを知りたい', method: '担当部署に電話・メールで質問' },
  { purpose: '意見や要望を伝えたい', method: '広聴・ご意見窓口（電話・フォーム・郵送）' },
  { purpose: '募集中の案に意見したい', method: 'パブコメ' },
  { purpose: '議会で取り上げてほしい', method: '請願・陳情' },
  { purpose: '行政の文書を見たい', method: '情報公開請求' },
  { purpose: '同じ考えの人の声を集めたい', method: '署名' },
];

export const PURPOSE_NOTE = 'どの方法でも、送り先と手続きは、各機関の公式ページで確かめましょう。';

// 「声を届ける方法を知る」の6つのメニュー
// status を 'published' にし、ページを作れば、同じ URL（#/guide/<slug>）のまま公開できる。
import type { GuideMenuItem, GuideSlug } from '../types';
import { SITE } from '../site';

export const GUIDES: GuideMenuItem[] = [
  {
    slug: 'phone',
    title: '電話のかけ方',
    short: '電話',
    summary: '台本は1行でいい。行政の窓口に、落ち着いて質問や意見を伝える方法。',
    status: 'published',
    icon: 'phone',
    roadmapStep: 1,
    plannedTopics: [],
  },
  {
    slug: 'email',
    title: 'メール・フォーム・郵送',
    short: 'メール・フォーム・郵送',
    summary: '件名と本文を作って、メールや公式の問い合わせフォーム、郵送の手紙で届ける。',
    status: 'published',
    icon: 'mail',
    roadmapStep: 5,
    plannedTopics: [],
  },
  {
    slug: 'public-comment',
    title: 'パブコメの書き方',
    short: 'パブコメ',
    summary: '募集中の案に、結論・理由・具体的な提案の順で意見をまとめる。',
    status: 'published',
    icon: 'comment',
    roadmapStep: 3,
    plannedTopics: [],
    related: [SITE.pubcome],
  },
  {
    slug: 'petition',
    title: '請願・陳情の書き方',
    short: '請願・陳情',
    summary: '議会に正式に検討を求める。請願と陳情の違いと、書き方・出し方。',
    status: 'published',
    icon: 'petition',
    roadmapStep: 4,
    plannedTopics: [],
  },
  {
    slug: 'disclosure',
    title: '情報公開請求',
    short: '情報公開請求',
    summary: '行政が持っている文書の公開を求める手続き。',
    status: 'published',
    icon: 'folder',
    roadmapStep: 5,
    plannedTopics: [],
  },
  {
    slug: 'signature',
    title: '署名の方法',
    short: '署名',
    summary: '署名に賛同する・自分で立ち上げる。署名サイトの違いと、名前の扱い。',
    status: 'published',
    icon: 'signature',
    roadmapStep: 5,
    plannedTopics: [],
    related: [SITE.shomei],
  },
];

export function findGuide(slug: string): GuideMenuItem | undefined {
  return GUIDES.find((g) => g.slug === (slug as GuideSlug));
}

export const guidePath = (slug: GuideSlug) => `/guide/${slug}`;

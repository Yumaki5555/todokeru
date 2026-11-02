// 窓口の種類・確認状態・機関の分類の表示名
import type { AgencyCategory, ContactStatus, ContactType, IconName } from '../types';

export const CONTACT_TYPE_INFO: Record<ContactType, { label: string; desc: string; icon: IconName }> = {
  general: {
    icon: 'building',
    label: '行政代表窓口',
    desc: '担当部署がわからないときに。用件を伝えると、担当の部署を案内してもらえます。',
  },
  feedback: {
    icon: 'chat',
    label: '広聴・ご意見窓口',
    desc: '行政への意見・要望・提案を伝えるための公式の窓口です。「市民の声」などの名前のこともあります。',
  },
  assembly: {
    icon: 'assembly',
    label: '議会事務局',
    desc: '議会への問い合わせや、請願・陳情の手続きの確認に。議会の運営を支える事務の部署です。',
  },
  police: {
    icon: 'shield',
    label: '警察・公安委員会',
    desc: '事件・事故ではない困りごとの相談（警察相談専用電話 #9110）や、警察の対応への苦情の窓口です。警察への苦情は、都道府県の公安委員会に文書で申し出ることができます。緊急のときは110番へ。',
  },
  education: {
    icon: 'book',
    label: '教育委員会',
    desc: '公立の学校や、生涯学習・文化財などを受け持つ組織です。市区町村立の小・中学校は市区町村の、都道府県立の高校などは都道府県の教育委員会が担当します。',
  },
  department: {
    icon: 'folder',
    label: '担当部署',
    desc: '制度や事業を実際に担当している部署です。',
  },
};

export const STATUS_LABEL: Record<ContactStatus, string> = {
  verified: '公式確認済み',
  unverified: '未確認',
  review: '要再確認',
  unavailable: '公式連絡先が確認できない',
  discontinued: '変更・廃止',
  auto_matched: '公式サイトと自動照合',
};

/** 自動照合の窓口に添える注意 */
export const AUTO_MATCHED_NOTE = '公式サイトに書かれた番号を機械で照合したものです。人による確認の前のため、公式ページでも確かめてください。';

export const AGENCY_CATEGORY_LABEL: Record<AgencyCategory, string> = {
  cabinet: '内閣に置かれる機関',
  ministry: '省',
  agency: '庁（外局など）',
  diet: '国会',
};

/** 機関・自治体の種類ごとに、表示する窓口の種類 */
export const TYPES_FOR_LOCAL: ContactType[] = ['general', 'feedback', 'assembly'];
/** 都道府県・市区町村で、連絡先を載せたときだけ欄を出す種類（警察は都道府県の仕事なので都道府県だけ） */
export const EXTRA_TYPES_FOR_PREF: ContactType[] = ['police', 'education'];
export const EXTRA_TYPES_FOR_MUNI: ContactType[] = ['education'];
export const TYPES_FOR_AGENCY: ContactType[] = ['general', 'feedback'];
export const TYPES_FOR_DIET: ContactType[] = ['general'];

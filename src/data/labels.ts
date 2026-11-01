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
};

export const AGENCY_CATEGORY_LABEL: Record<AgencyCategory, string> = {
  cabinet: '内閣に置かれる機関',
  ministry: '省',
  agency: '庁（外局など）',
  diet: '国会',
};

/** 機関・自治体の種類ごとに、表示する窓口の種類 */
export const TYPES_FOR_LOCAL: ContactType[] = ['general', 'feedback', 'assembly'];
export const TYPES_FOR_AGENCY: ContactType[] = ['general', 'feedback'];
export const TYPES_FOR_DIET: ContactType[] = ['general'];

// メール・フォームの文面を作る：電話の台本と同じ入力（目的・何について・理由・詳しく整理）から、件名と本文を組み立てる
// 本題は電話と同じ組み立て（callScript.ts・deepDive.ts）を使い、件名・宛名・名乗り・お願い・結び・署名を足す。
import type { CallDraft, CallPurpose, CallTarget, IconName, MailDraft, MailMethod, MailPart, MailPartKey, MailReply } from '../types';
import { topicText, wantsRecord } from './callScript';
import { detailedMain } from './deepDive';

export const METHODS: { id: MailMethod; label: string; icon: IconName }[] = [
  { id: 'mail', label: 'メール', icon: 'mail' },
  { id: 'form', label: '問い合わせフォーム', icon: 'form' },
];

export const REPLIES: { id: MailReply; label: string }[] = [
  { id: 'unset', label: '指定しない' },
  { id: 'want', label: '返信を希望する' },
  { id: 'none', label: '返信は不要' },
];

export const MAIL_PART_LABEL: Record<MailPartKey, string> = {
  subject: '件名',
  to: '宛名',
  greeting: 'あいさつ',
  main: '本題',
  request: 'お願い',
  closing: '結び',
  signature: '署名',
};

export const EMPTY_MAIL: MailDraft = {
  method: 'mail',
  name: '',
  area: '',
  reply: 'unset',
  edits: {},
  memo: { when: '', to: '', subject: '', receipt: '', answer: '' },
};

const SUBJECT: Record<CallPurpose, (t: string) => string> = {
  opinion: (t) => `【意見】${t}について`,
  question: (t) => `【質問】${t}について`,
  department: (t) => `【お問い合わせ】${t}の担当部署について`,
};

/** 「山田と申します」と書かれても「山田と申しますと申します」にならないようにする */
function nameText(s: string): string {
  return s.trim().replace(/(と申します|と言います|です)[。．.]?$/u, '').trim();
}

/** 「江東区在住」と書かれても「江東区在住に住んでいる」にならないようにする */
function areaText(s: string): string {
  return s
    .trim()
    .replace(/[。．.、，,]+$/u, '')
    .replace(/(在住|に住んでいます|に住んでいる|の住民|住民)$/u, '')
    .trim();
}

/**
 * 宛名。窓口名が「〜課」「〜窓口」のような部署の名前なら「○○市\n△△課 ご担当者様」。
 * 「ご意見・ご要望」「代表電話」のような名前は宛名にならないので「○○市 ご担当者様」にする
 */
export function addressee(t: CallTarget | null): string {
  if (!t) return 'ご担当者様';
  const dept = t.department.replace(/[（(][^）)]*[）)]/gu, '').trim();
  if (/(課|室|局|部|係|班|所|センター|事務局|担当|グループ|コーナー|窓口|議会)$/u.test(dept)) return `${t.org}\n${dept} ご担当者様`;
  return `${t.org} ご担当者様`;
}

/** 自動で作る文（書き直す前の文）。入れる文がない部分は空 */
export function mailAutoText(draft: CallDraft, mail: MailDraft, key: MailPartKey): string {
  const name = nameText(mail.name);
  const area = areaText(mail.area);
  switch (key) {
    case 'subject':
      return SUBJECT[draft.purpose](topicText(draft.topic));
    case 'to':
      return addressee(draft.target);
    case 'greeting': {
      const who = name ? (area ? `${area}に住んでいる${name}と申します。` : `${name}と申します。`) : area ? `${area}に住んでいる者です。` : '';
      return ['突然のご連絡失礼いたします。', who].filter(Boolean).join('\n');
    }
    case 'main':
      // メールは文が長くても読み返せるので、「詳しく整理」で入れた内容はそのまま本文に入れる
      return detailedMain(draft);
    case 'request': {
      const lines: string[] = [];
      if (wantsRecord(draft)) {
        lines.push(draft.purpose === 'opinion' ? '意見として記録していただけますよう、お願いいたします。' : 'この件を記録していただけますよう、お願いいたします。');
      }
      if (mail.reply === 'want') lines.push('ご回答いただけますと幸いです。');
      if (mail.reply === 'none') lines.push('ご返信は不要です。');
      return lines.join('\n');
    }
    case 'closing':
      return 'お忙しいところ恐れ入りますが、よろしくお願いいたします。';
    case 'signature':
      return [name, area && `${area}在住`].filter(Boolean).join('\n');
  }
}

const BODY_ORDER: MailPartKey[] = ['to', 'greeting', 'main', 'request', 'closing', 'signature'];

function part(draft: CallDraft, mail: MailDraft, key: MailPartKey): MailPart {
  const edited = mail.edits[draft.purpose]?.[key];
  return { key, label: MAIL_PART_LABEL[key], text: edited ?? mailAutoText(draft, mail, key), edited: edited !== undefined };
}

/** 件名と、本文の部分（上から順）。入れる文がなく、書き直してもいない部分は出さない */
export function buildMail(draft: CallDraft, mail: MailDraft): { subject: MailPart; body: MailPart[] } {
  return {
    subject: part(draft, mail, 'subject'),
    body: BODY_ORDER.map((k) => part(draft, mail, k)).filter((p) => p.edited || p.text),
  };
}

/** 件名は1行にする */
export function subjectText(p: MailPart): string {
  return p.text.replace(/\s*\n\s*/gu, ' ').trim();
}

/** 本文（部分の間に空行を1つ入れる。空にした部分は入れない） */
export function bodyText(parts: MailPart[]): string {
  return parts
    .map((p) => p.text.trim())
    .filter(Boolean)
    .join('\n\n');
}

/** 文字数（改行・空白も1字に数える。上限のあるフォームで多めに見ておくため） */
export function countChars(s: string): number {
  return [...s].length;
}

/** これより長いリンクは、本文が切れたり開けなかったりするメールアプリがある */
export const MAILTO_MAX = 2000;

/** メールアプリで開くリンク。長すぎるときは、宛先と件名だけを渡す（本文はコピーして貼り付けてもらう） */
export function mailtoHref(to: string, subject: string, body: string): { href: string; withBody: boolean } {
  const base = `mailto:${to}?subject=${encodeURIComponent(subject)}`;
  const full = `${base}&body=${encodeURIComponent(body.replace(/\r?\n/gu, '\r\n'))}`;
  return full.length <= MAILTO_MAX ? { href: full, withBody: true } : { href: base, withBody: false };
}

/** 困ったときの文例（文面とは別に、必要なときだけ見る） */
export function mailHelpLines(mail: MailDraft, subject: string): { key: string; label: string; text: string; copy?: boolean }[] {
  const sent = /(\d{1,2})月(\d{1,2})日/u.exec(mail.memo.when);
  const day = sent ? `${sent[1]}月${sent[2]}日` : '○月○日';
  return [
    {
      key: 'again',
      label: '返事が来ないとき',
      text: `${day}に「${subject}」という件名でお送りした件について、届いているか確認させていただけますか。お手数ですが、よろしくお願いいたします。`,
      copy: true,
    },
    { key: 'other', label: '「担当ではない」と返事が来たら', text: 'お手数ですが、どちらにお問い合わせすればよいか、教えていただけますか。' },
    {
      key: 'name',
      label: '名前を書きたくないとき',
      text: '名前は書かなくても送れます。ただし、名前や連絡先がないと回答をもらえないことがあります。フォームでは「必須」の欄に合わせてください。',
    },
  ];
}

/** 送った記録をまとめてコピーするときの文 */
export function mailMemoAsText(draft: CallDraft, mail: MailDraft): string {
  const t = draft.target;
  const m = mail.memo;
  const rows: [string, string][] = [
    ['日時', m.when],
    ['送り先', m.to || (t ? `${t.org} ${t.department}` : '')],
    ['方法', METHODS.find((x) => x.id === mail.method)!.label],
    ['件名', m.subject],
    ['受付番号', m.receipt],
    ['返事', m.answer],
  ];
  return ['【送った記録】', ...rows.filter(([, v]) => v.trim()).map(([k, v]) => `${k}：${v.trim()}`)].join('\n');
}

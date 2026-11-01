// 台本を作る：目的と入力から、短い台本（あいさつ → 本題 → 記録のお願い → お礼）を組み立てる
// 文は電話マニュアルの台本・会話例（phoneManual.ts）の言い回しを使う。
import type { CallDraft, CallPurpose, CallStance, IconName, ScriptPart, ScriptPartKey } from '../types';

export const PURPOSES: {
  id: CallPurpose;
  label: string;
  /** label の折り返してよい位置 */
  parts: string[];
  icon: IconName;
  topicHint: string;
  /** 2つめの入力欄（なければ出さない） */
  detail?: { label: string; hint: string };
}[] = [
  {
    id: 'opinion',
    label: '意見を伝える',
    parts: ['意見を', '伝える'],
    icon: 'chat',
    topicHint: '例：○○市の△△計画',
    detail: { label: '理由は？', hint: '例：子どもの安全、費用が高すぎる' },
  },
  {
    id: 'question',
    label: '質問する',
    parts: ['質問する'],
    icon: 'question',
    topicHint: '例：○○制度',
    detail: { label: '聞きたいことは？', hint: '例：始めた理由、いつから始まるか' },
  },
  {
    id: 'department',
    label: '担当部署を確認する',
    parts: ['担当部署を', '確認する'],
    icon: 'building',
    topicHint: '例：家の前の道路の補修',
  },
];

export const STANCES: { id: CallStance; label: string; phrase: string }[] = [
  { id: 'concern', label: '懸念がある', phrase: '懸念があります。' },
  { id: 'review', label: '見直してほしい', phrase: '見直しが必要だと考えています。' },
  { id: 'support', label: '賛成', phrase: '賛成です。' },
];

export const PART_LABEL: Record<ScriptPartKey, string> = {
  greeting: 'あいさつ',
  main: '本題',
  record: '記録のお願い',
  thanks: 'お礼',
};

/** 入力がまだないときに入れておく文字（マニュアルの台本と同じ） */
export const BLANK = '○○';

export const EMPTY_DRAFT: CallDraft = {
  purpose: 'opinion',
  stance: 'concern',
  topic: '',
  detail: '',
  record: {},
  edits: {},
  target: null,
  memo: { when: '', who: '', answer: '' },
};

const trimEnd = (s: string) => s.trim().replace(/[\s　。．.、，,]+$/u, '');

/** 「○○計画について」と書かれても「についてについて」にならないようにする */
export function topicText(s: string): string {
  return trimEnd(s).replace(/(について|に関して|のこと)$/u, '') || BLANK;
}

/** 理由の言い方：名詞なら「○○の面から」、文なら「○○という理由から」 */
export function reasonPhrase(s: string): string {
  const r = trimEnd(s).replace(/(という理由|ですから|だから|なので|ので|から|ため)$/u, '');
  if (!r) return '';
  const clause = /(い|う|く|す|つ|ぬ|む|る|ぐ|ぶ|た|だ|ない|ます|です)$/u.test(r) || /.[がをは]./u.test(r);
  return clause ? `${r}という理由から` : `${r}の面から`;
}

/** 聞きたいことの言い方：質問の形ならそのまま、そうでなければ「○○を教えていただけますか？」 */
export function questionPhrase(s: string): string {
  const d = trimEnd(s).replace(/[?？]+$/u, '');
  if (!d) return '現在の仕組みを教えていただけますか？';
  if (/[?？]$/u.test(s.trim()) || /(ですか|ますか|でしょうか|ませんか)$/u.test(d)) return d + '？';
  return d.replace(/を?(教えて(ください|ほしい|欲しい)?|知りたい(です)?)$/u, '') + 'を教えていただけますか？';
}

/** 自動で作る文（書き直す前の文） */
export function autoText(draft: CallDraft, key: ScriptPartKey): string {
  const t = topicText(draft.topic);
  switch (key) {
    case 'greeting':
      return 'お忙しいところ失礼します。';
    case 'main':
      if (draft.purpose === 'question') return `${t}について、${questionPhrase(draft.detail)}`;
      if (draft.purpose === 'department') return `${t}について確認したいのですが、ご担当の部署を教えていただけますか？`;
      return `${t}について、${reasonPhrase(draft.detail)}${STANCES.find((s) => s.id === draft.stance)!.phrase}`;
    case 'record':
      return draft.purpose === 'opinion' ? '意見として記録をお願いします。' : 'この件を記録していただけますか？';
    case 'thanks':
      return draft.purpose === 'department' ? '担当窓口をご案内いただき、ありがとうございました。' : 'ご対応ありがとうございました。';
  }
}

/** 記録のお願いを入れるか（意見を伝えるときは最初から入れる） */
export function wantsRecord(draft: CallDraft): boolean {
  return draft.record[draft.purpose] ?? draft.purpose === 'opinion';
}

const ORDER: ScriptPartKey[] = ['greeting', 'main', 'record', 'thanks'];

/** 読む順に並べた台本。includeOff を付けると、入れないことにした「記録のお願い」も返す */
export function buildScript(draft: CallDraft, includeOff = false): ScriptPart[] {
  const edits = draft.edits[draft.purpose] || {};
  return ORDER.filter((k) => includeOff || k !== 'record' || wantsRecord(draft)).map((key) => ({
    key,
    label: PART_LABEL[key],
    text: edits[key] ?? autoText(draft, key),
    edited: edits[key] !== undefined,
  }));
}

/** まとめてコピーするときの文（1つの部分を1行に） */
export function scriptAsText(parts: ScriptPart[]): string {
  return parts
    .map((p) => p.text.trim())
    .filter(Boolean)
    .join('\n');
}

/** 「2026年11月1日 15:30」の形 */
export function formatDateTime(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 通話メモをまとめてコピーするときの文 */
export function memoAsText(draft: CallDraft): string {
  const t = draft.target;
  const main = buildScript(draft).find((p) => p.key === 'main')?.text.trim();
  const rows: [string, string][] = [
    ['日時', draft.memo.when],
    ['電話先', draft.memo.who || (t ? `${t.org} ${t.department}` : '')],
    ['電話番号', t?.phone || ''],
    ['伝えたこと', main || ''],
    ['回答', draft.memo.answer],
  ];
  return ['【通話メモ】', ...rows.filter(([, v]) => v.trim()).map(([k, v]) => `${k}：${v.trim()}`)].join('\n');
}

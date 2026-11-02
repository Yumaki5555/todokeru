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
  /** 2つめの入力欄（なければ出さない）。目的ごとに別の欄に覚えておき、切りかえても混ざらないようにする */
  detail?: { key: 'detail' | 'ask'; label: string; hint: string };
}[] = [
  {
    id: 'opinion',
    label: '意見を伝える',
    parts: ['意見を', '伝える'],
    icon: 'chat',
    topicHint: '例：○○市の△△計画',
    detail: { key: 'detail', label: '理由は？', hint: '例：子どもの安全、費用が高すぎる' },
  },
  {
    id: 'question',
    label: '質問する',
    parts: ['質問する'],
    icon: 'question',
    topicHint: '例：○○制度',
    detail: { key: 'ask', label: '聞きたいことは？', hint: '例：始めた理由、いつから始まるか' },
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
  ask: '',
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

/** 「いくら」「どこ」のような、たずねる言葉 */
const WH = /(なぜ|どうして|いつ|どこ|だれ|誰|どう|どの|どれ|どちら|何|なに|なん|いくら|いくつ)/u;

/** 聞きたいことの言い方：ていねいな質問の形ならそのまま、そうでなければ「○○を教えていただけますか？」 */
export function questionPhrase(s: string): string {
  const d = trimEnd(s)
    .replace(/[?？]+$/u, '')
    .replace(/[のん]だろうか$/u, 'のでしょうか')
    .replace(/だろうか$/u, 'でしょうか');
  if (!d) return '現在の仕組みを教えていただけますか？';
  if (/(ですか|ますか|でしょうか|ませんか)$/u.test(d)) return d + '？';
  if (/(です|ます)$/u.test(d)) return d + 'か？';
  const q = d.replace(/を?(教えて(ください|ほしい|欲しい)?|知りたい(です)?)$/u, '');
  const ask = 'を教えていただけますか？';
  // 「日程は」「日程について」→「日程について教えていただけますか？」
  if (/(について|に関して|は)$/u.test(q)) return q.replace(/(に関して|は)$/u, 'について') + '教えていただけますか？';
  // 「いつ決まるのか」「費用はいくら」→「〜か」をつけて「〜かを教えて」
  if (/か$/u.test(q)) return q + ask;
  if (new RegExp(WH.source + '$', 'u').test(q)) return q + 'か' + ask;
  // 「説明会はある」「なぜ高い」のような文 →「〜のかを教えて」
  if (/(う|く|ぐ|す|つ|ぬ|ぶ|む|る|た|だ|ない|たい)$/u.test(q) || (WH.test(q) && /い$/u.test(q))) {
    return q.replace(/([^ん])だ$/u, '$1な') + 'のか' + ask;
  }
  return q + ask;
}

/** 自動で作る文（書き直す前の文） */
export function autoText(draft: CallDraft, key: ScriptPartKey): string {
  const t = topicText(draft.topic);
  switch (key) {
    case 'greeting':
      return 'お忙しいところ失礼します。';
    case 'main':
      if (draft.purpose === 'question') return `${t}について、${questionPhrase(draft.ask)}`;
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

/** 電話中に困ったときの一言（台本とは別に、必要なときだけ見る） */
export function helpLines(draft: CallDraft): { key: string; label: string; text: string }[] {
  const t = topicText(draft.topic);
  const want = draft.purpose === 'question' ? 'お伺いしたい' : '意見をお伝えしたい';
  return [
    // 「担当部署を確認する」は、本題がそのまま担当をたずねる文なので出さない
    ...(draft.purpose === 'department'
      ? []
      : [{ key: 'transfer', label: '代表電話につながったら', text: `${t}について${want}のですが、ご担当の部署につないでいただけますか？` }]),
    { key: 'name', label: '名前を聞かれたら', text: '○○と申します。（名乗りたくないときは「匿名でお願いできますか？」）' },
    { key: 'other', label: '「担当ではない」と言われたら', text: 'どちらにお問い合わせすればよいか、教えていただけますか？' },
    { key: 'again', label: '聞き取れなかったら', text: '恐れ入ります、もう一度お願いできますか？' },
  ];
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

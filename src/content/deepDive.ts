/** 追加料金なしで動く、電話台本の詳細整理（AI・外部通信なし） */
import type { CallDraft, DeepDiveDraft } from '../types';
import { autoText, questionPhrase } from './callScript';
import { politeText } from './polite';

export const EMPTY_DEEP_DIVE: DeepDiveDraft = {
  facts: '',
  question: '',
  desired: '',
  source: '',
  points: [],
};

export const CHECK_POINTS = [
  { id: 'office', label: '担当部署・権限', question: 'この件の担当部署と、対応できる範囲を教えていただけますか？' },
  { id: 'basis', label: '法律・条例の根拠', question: '適用される制度・条例と、その根拠資料を教えていただけますか？' },
  { id: 'status', label: '現在の対応状況', question: '現在どのような確認や対応が行われているか、教えていただけますか？' },
  { id: 'process', label: '今後の手順・時期', question: '今後の対応手順と、分かる範囲で時期を教えていただけますか？' },
  { id: 'cost', label: '予算・費用', question: '関連する予算や費用の内訳は公開されていますか？' },
  { id: 'documents', label: '公式資料・公開先', question: '確認できる公式資料や掲載ページがあれば教えていただけますか？' },
] as const;

/** 1つずつの問いを「〜を教えていただけますか？」の形にする */
function questions(s: string): string {
  return s
    .split(/[。．！!？?\n]+/u)
    .map((x) => x.trim())
    .filter(Boolean)
    .map(questionPhrase)
    .join('');
}

/** 「〜してほしい」「予算の見直し」のような希望の1文を、お願いの形にする。見分けられない形は null */
function wishSentence(x: string): string | null {
  // 〜してほしい・〜してください・〜して →〜していただきたいと考えています
  const req = x.replace(/([てで])(ほしい|欲しい|もらいたい|いただきたい|ください|下さい)(です|と思います|と思う)?$/u, '$1');
  if (/[てで]$/u.test(req)) return `${req}いただきたいと考えています。`;
  if (/こと$/u.test(x)) return `${x}を希望します。`;
  const hasObj = /を/u.test(x);
  // 「説明会を開く」「増税しない」→〜ことを希望します
  if (/([うぐすつぬぶむる]|ない)$/u.test(x) || (hasObj && /く$/u.test(x))) return `${x}ことを希望します。`;
  // 「もっと安く」「早く」→〜していただきたい
  if (/く$/u.test(x)) return `${x}していただきたいと考えています。`;
  // 「を」のある言いさし：「説明会を開催」「予算を見直し」→〜していただきたい・〜ていただきたい
  if (hasObj) {
    if (/[一-龠々ァ-ヶー]$/u.test(x)) return `${x}していただきたいと考えています。`;
    if (/[しめえけせれべ]$/u.test(x)) return `${x}ていただきたいと考えています。`;
    return null;
  }
  // 「予算やりなおし」「説明会の開催」「中止」→〜を希望します
  if (/([一-龠々ァ-ヶーa-zA-Z0-9０-９]|[しめえけせれべきり]|合い)$/u.test(x)) return `${x}を希望します。`;
  return null;
}

/** 希望をお願いの形にする。形を見分けられない文があるときは、前置きを付けて「です・ます」だけそろえる */
function wishText(s: string): string {
  const sentences = s
    .split(/[。．\n]+/u)
    .map((x) => x.trim().replace(/[、，,\s]+$/u, ''))
    .filter(Boolean);
  const wishes = sentences.map((x) => (/[！!？?]$/u.test(x) || /(希望|お願い)/u.test(x) ? null : wishSentence(x)));
  const text = sentences.map((x, i) => wishes[i] ?? politeText(x)).join('');
  return wishes.every(Boolean) ? text : `希望をお伝えします。${text}`;
}

/** 現在の「本題」に、希望した追加情報だけを加えた文。確証のない断定は生成しない。 */
export function detailedMain(draft: CallDraft): string {
  const d = { ...EMPTY_DEEP_DIVE, ...draft.deepDive };
  const lines = [autoText(draft, 'main')];
  if (d.facts.trim()) lines.push(`私が確認した状況は、次のとおりです。${politeText(d.facts)}`);
  if (d.question.trim()) lines.push(`特に確認したいことがあります。${questions(d.question)}`);
  for (const p of CHECK_POINTS) {
    if (d.points.includes(p.id)) lines.push(p.question);
  }
  if (d.desired.trim()) lines.push(wishText(d.desired));
  if (d.source.trim()) lines.push(`参考資料は、${politeText(d.source)}`);
  return lines.join('\n');
}

/** 自由記述または選択項目が一つでもあるか */
export function hasDeepDive(draft: CallDraft): boolean {
  const d = { ...EMPTY_DEEP_DIVE, ...draft.deepDive };
  return !!(d.facts.trim() || d.question.trim() || d.desired.trim() || d.source.trim() || d.points.length);
}

/** 詳しい台本を③の本題に入れる。前に反映した文も覚えておき、手で直したかを見分けられるようにする */
export function applyDetailed(d: CallDraft): Partial<CallDraft> {
  const main = detailedMain(d);
  return {
    edits: { ...d.edits, [d.purpose]: { ...d.edits[d.purpose], main } },
    deepDive: { ...EMPTY_DEEP_DIVE, ...d.deepDive, applied: main },
  };
}

/**
 * ③の本題がいまどうなっているか
 * auto：②の入力から自動で作った文／detailed：詳しい整理を反映した文（最新）
 * stale：詳しい整理を反映したあと、①②や詳しい整理を変えた（本題は前のまま）／manual：手で直した文
 */
export function mainState(d: CallDraft): 'auto' | 'detailed' | 'stale' | 'manual' {
  const main = d.edits[d.purpose]?.main;
  if (main === undefined) return 'auto';
  if (main !== d.deepDive?.applied) return 'manual';
  return main === detailedMain(d) ? 'detailed' : 'stale';
}

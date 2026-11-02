/** 追加料金なしで動く、電話台本の詳細整理（AI・外部通信なし） */
import type { CallDraft, DeepDiveDraft } from '../types';
import { autoText, questionClause, questionPhrase } from './callScript';
import { plainEnd, politeText, splitSentences } from './polite';

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

/** 確認できたことの1文を「私が確認した状況は、〜です」の「〜」にする（「報道があった」→「報道があったこと」）。見分けられない形は null */
function factClause(x: string): string | null {
  if (/[！!？?]$/u.test(x)) return null;
  // 「怖がってるよ」の「よ」「ね」は取る
  const p = plainEnd(x.replace(/([うくぐすつぬぶむるいただ])[よね]+$/u, '$1'));
  if (!p || /(でしょう|だろう|ましょう|ください|下さい)$/u.test(p)) return null;
  // 「9月30日の報道」「とのこと」→そのまま
  if (/(こと|もの|ところ|とき|ため|など|まで|だけ|ほど|はず|よう|そう|[一-龠々ァ-ヶーa-zA-Z0-9０-９ａ-ｚＡ-Ｚ%％])$/u.test(p)) return p;
  // 「報道があった」「費用が高い」→〜こと
  if (/([うくぐすつぬぶむるいた]|[んい]だ)$/u.test(p)) return `${p}こと`;
  // 「危険だ」→「危険」
  if (/だ$/u.test(p)) return p.slice(0, -1);
  return null;
}

/** 確認できたことを「私が確認した状況は、〜ことです。」の1文にする。形を見分けられない文は、そのあとに「です・ます」で続ける */
function factsText(s: string): string {
  const sentences = splitSentences(s);
  const clauses = sentences.map(factClause);
  const rest = sentences.filter((_, i) => !clauses[i]).map(politeText).join('');
  const known = clauses.filter(Boolean);
  return known.length ? `私が確認した状況は、${known.join('、')}です。${rest}` : `私が確認した状況は、次のとおりです。${rest}`;
}

/** 疑問を「〜を確認したいです。」の1文にまとめる。ふつうの形に戻せない問いは「〜ますか？」のまま続ける */
function questions(s: string): string {
  const qs = s
    .split(/[。．！!？?\n]+/u)
    .map((x) => x.trim())
    .filter(Boolean);
  const clauses = qs.map(questionClause);
  const rest = qs.filter((_, i) => !clauses[i]).map(questionPhrase).join('');
  const known = clauses.filter(Boolean);
  return (known.length ? `${known.join('、')}を確認したいです。` : '') + rest;
}

/** 「やめろ」「中止しろ」「見直せ」「やめてくれ」のような強い言い方を「〜てください」にする。見分けられない形は null */
function requestSentence(x: string): string | null {
  if (/するな$/u.test(x)) return x.replace(/するな$/u, 'しないでください。');
  if (/[てで]くれ$/u.test(x)) return x.replace(/くれ$/u, 'ください。');
  if (/しろ$/u.test(x)) return x.replace(/しろ$/u, 'してください。');
  if (/[えけげせぜてでねへべめれきぎじちにびみり見着出寝]ろ$/u.test(x)) return x.replace(/ろ$/u, 'てください。');
  // 「見直せ」「減らせ」「中止せ(よ)」→〜してください（「お知らせ」「幸せ」などは除く）
  if (/([一-龠々]|[らやく])せ$/u.test(x) && !/(見|任|載|乗|寄|幸|伏|知ら)せ$/u.test(x)) return x.replace(/せ$/u, 'してください。');
  return null;
}

/** 希望の形でない文（「騒音がひどい」「騒音が続いている」）は「〜ので、対応してください」にする。ていねいな文などはそのまま */
function reasonRequest(x: string): string {
  if (/([^た]い|た|[んい]だ|[てで]いる)$/u.test(x)) return `${x}ので、対応してください。`;
  if (/[^んい]だ$/u.test(x)) return `${x.slice(0, -1)}なので、対応してください。`;
  return politeText(x);
}

/** 「〜してほしい」「予算の見直し」のような希望の1文を、お願いの形にする。見分けられない形は null */
function wishSentence(x: string): string | null {
  // 〜してほしい・〜してください・〜して →〜していただきたいと考えています
  const req = x.replace(/([てで])(ほしい|欲しい|もらいたい|いただきたい|ください|下さい)(です|と思います|と思う)?$/u, '$1');
  if (/[てで]$/u.test(req)) return `${req}いただきたいと考えています。`;
  if (/こと$/u.test(x)) return `${x}を希望します。`;
  // 「説明がほしい」→「説明を希望します」
  if (/[がを](ほしい|欲しい)(です)?$/u.test(x)) return x.replace(/[がを](ほしい|欲しい)(です)?$/u, 'を希望します。');
  // 「中止すべき」「やめた方がいい」→〜と考えています
  if (/べき(だ|です)?$/u.test(x)) return x.replace(/べき(だ|です)?$/u, 'べきだと考えています。');
  if (/(方|ほう)が(いい|良い|よい)(です)?$/u.test(x)) return x.replace(/(方|ほう)が(いい|良い|よい)(です)?$/u, '$1がよいと考えています。');
  const hasObj = /を/u.test(x);
  // 「説明会を開く」「増税しない」→〜ことを希望します（「続いている」「説明が足りない」のような様子を表す文、ていねいな文は除く）
  const state = /([てで]いる|ます|です)$/u.test(x) || (/ない$/u.test(x) && /が/u.test(x));
  if (!state && (/([うぐすつぬぶむる]|ない)$/u.test(x) || (hasObj && /く$/u.test(x)))) return `${x}ことを希望します。`;
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

/** 希望をお願いの形にする。質問の形や「希望」「〜と思う」を含む文は「です・ます」だけそろえる */
function wishText(s: string): string {
  return splitSentences(s)
    .map((x) => {
      // 「やめろ！」「しろよ」「やめてね」の「！」「よ」「ね」は取る
      const y = x.replace(/[！!]+$/u, '').replace(/([ろせれてでくいだすたる])[よね]$/u, '$1');
      if (/[？?]$/u.test(y) || /(希望|お願い|と思|と考え)/u.test(y)) return politeText(y);
      return requestSentence(y) ?? wishSentence(y) ?? reasonRequest(y);
    })
    .join('');
}

/** 現在の「本題」に、希望した追加情報だけを加えた文。確証のない断定は生成しない。 */
export function detailedMain(draft: CallDraft): string {
  const d = { ...EMPTY_DEEP_DIVE, ...draft.deepDive };
  const lines = [autoText(draft, 'main')];
  if (d.facts.trim()) lines.push(factsText(d.facts));
  if (d.question.trim()) lines.push(questions(d.question));
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

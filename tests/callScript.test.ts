// 台本を作る：入力から組み立てる文
import { describe, expect, it } from 'vitest';
import { EMPTY_DRAFT, buildScript, memoAsText, questionPhrase, reasonPhrase, scriptAsText, topicText } from '../src/content/callScript';
import type { CallDraft } from '../src/types';

const draft = (patch: Partial<CallDraft>): CallDraft => ({ ...EMPTY_DRAFT, ...patch });
const main = (d: CallDraft) => buildScript(d).find((p) => p.key === 'main')!.text;

describe('台本の組み立て', () => {
  it('意見を伝える：あいさつ → 本題 → 記録のお願い → お礼 の順で、記録のお願いは最初から入る', () => {
    const parts = buildScript(draft({ topic: '駅前の再開発計画', detail: '子どもの安全' }));
    expect(parts.map((p) => p.label)).toEqual(['あいさつ', '本題', '記録のお願い', 'お礼']);
    expect(scriptAsText(parts)).toBe(
      'お忙しいところ失礼します。\n駅前の再開発計画について、子どもの安全の面から懸念があります。\n意見として記録をお願いします。\nご対応ありがとうございました。',
    );
  });

  it('入力がまだなければ ○○ を入れておく。理由はなくてもよい', () => {
    expect(main(EMPTY_DRAFT)).toBe('○○について、懸念があります。');
  });

  it('意見の向きで結びが変わる', () => {
    expect(main(draft({ topic: 'A計画', stance: 'review' }))).toBe('A計画について、見直しが必要だと考えています。');
    expect(main(draft({ topic: 'A計画', stance: 'support', detail: '費用が安い' }))).toBe('A計画について、費用が安いという理由から賛成です。');
  });

  it('「について」「から」などを重ねない', () => {
    expect(topicText('A計画について。')).toBe('A計画');
    expect(reasonPhrase('危ないから')).toBe('危ないという理由から');
    expect(reasonPhrase('費用')).toBe('費用の面から');
    expect(reasonPhrase('説明が不十分')).toBe('説明が不十分という理由から');
    expect(reasonPhrase('  ')).toBe('');
  });

  it('質問する：聞きたいことがなければ仕組みを聞き、記録のお願いは最初は入れない', () => {
    const d = draft({ purpose: 'question', topic: '○○制度' });
    expect(main(d)).toBe('○○制度について、現在の仕組みを教えていただけますか？');
    expect(buildScript(d).map((p) => p.key)).toEqual(['greeting', 'main', 'thanks']);
    expect(buildScript(d, true).map((p) => p.key)).toEqual(['greeting', 'main', 'record', 'thanks']);
    expect(buildScript({ ...d, record: { question: true } }).map((p) => p.key)).toContain('record');
  });

  it('質問の言い方：質問の形ならそのまま、そうでなければ「〜を教えていただけますか？」', () => {
    expect(questionPhrase('始めた理由')).toBe('始めた理由を教えていただけますか？');
    expect(questionPhrase('始めた理由を教えてください')).toBe('始めた理由を教えていただけますか？');
    expect(questionPhrase('いつから始まりますか')).toBe('いつから始まりますか？');
    expect(questionPhrase('いつから始まるか')).toBe('いつから始まるかを教えていただけますか？');
  });

  it('担当部署を確認する：マニュアルの言い回しで聞き、案内のお礼で終える', () => {
    const parts = buildScript(draft({ purpose: 'department', topic: '道路の補修' }));
    expect(parts.find((p) => p.key === 'main')!.text).toBe('道路の補修について確認したいのですが、ご担当の部署を教えていただけますか？');
    expect(parts[parts.length - 1].text).toBe('担当窓口をご案内いただき、ありがとうございました。');
  });

  it('書き直した文は目的ごとに覚え、入力を変えても上書きしない', () => {
    const d = draft({ topic: 'A計画', edits: { opinion: { main: '自分の言葉で伝えます。' } } });
    const m = buildScript(d).find((p) => p.key === 'main')!;
    expect(m).toMatchObject({ text: '自分の言葉で伝えます。', edited: true });
    expect(main({ ...d, topic: 'B計画' })).toBe('自分の言葉で伝えます。');
    expect(main({ ...d, purpose: 'question' })).toBe('A計画について、現在の仕組みを教えていただけますか？');
  });

  it('空にした部分は、まとめてコピーに入れない', () => {
    const d = draft({ edits: { opinion: { greeting: '' } } });
    expect(scriptAsText(buildScript(d)).startsWith('○○について')).toBe(true);
  });

  it('通話メモは、書いた項目だけをまとめる', () => {
    const text = memoAsText(draft({ topic: 'A計画', memo: { when: '2026年11月1日 10:00', who: '', answer: '担当課に伝えると言われた' } }));
    expect(text).toBe(
      '【通話メモ】\n日時：2026年11月1日 10:00\n伝えたこと：A計画について、懸念があります。\n回答：担当課に伝えると言われた',
    );
  });
});

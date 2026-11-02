import { describe, expect, it } from 'vitest';
import { EMPTY_DRAFT } from '../src/content/callScript';
import { applyDetailed, detailedMain, hasDeepDive, mainState } from '../src/content/deepDive';
import type { CallDraft } from '../src/types';

describe('深掘り台本', () => {
  it('未入力時には通常の台本と同じ本題を作る', () => {
    const d = { ...EMPTY_DRAFT, topic: '民泊の騒音' };
    expect(hasDeepDive(d)).toBe(false);
    expect(detailedMain(d)).toContain('民泊の騒音について');
  });
  it('事実と選択した質問だけを追記する', () => {
    const d = { ...EMPTY_DRAFT, topic: '民泊', deepDive: { facts: '10月1日に騒音があった', question: '', desired: '', source: '', points: ['basis', 'status'] } };
    expect(hasDeepDive(d)).toBe(true);
    expect(detailedMain(d)).toContain('私が確認した状況');
    expect(detailedMain(d)).toContain('制度・条例');
    expect(detailedMain(d)).toContain('現在どのような確認');
    expect(detailedMain(d)).not.toContain('予算や費用');
  });
  it('入力の言い切りの形を「です・ます」にそろえ、疑問は「〜を教えていただけますか？」にする', () => {
    const d = {
      ...EMPTY_DRAFT,
      topic: 'A計画',
      deepDive: { facts: '区報で知った', question: '説明会はあるのか', desired: '説明会を開いてほしい', source: '区の公式ページ', points: [] },
    };
    const text = detailedMain(d);
    expect(text).toContain('私が確認した状況は、次のとおりです。区報で知りました。');
    expect(text).toContain('特に確認したいことがあります。説明会はあるのかを教えていただけますか？');
    expect(text).toContain('希望する対応についてもお伝えします。説明会を開いてほしいです。');
    expect(text).toContain('参考資料は、区の公式ページです。');
  });

  it('本題の状態：反映したあと①②を変えると「古い」、手で直すと「手で直した」になる', () => {
    const base: CallDraft = { ...EMPTY_DRAFT, topic: 'A計画', deepDive: { facts: '区報で知った', question: '', desired: '', source: '', points: [] } };
    expect(mainState(base)).toBe('auto');
    const applied = { ...base, ...applyDetailed(base) };
    expect(mainState(applied)).toBe('detailed');
    expect(mainState({ ...applied, stance: 'support' })).toBe('stale');
    expect(mainState({ ...applied, edits: { opinion: { main: '自分の言葉' } } })).toBe('manual');
    // 反映し直すと、新しい①②の内容で最新になる
    const changed = { ...applied, stance: 'support' as const };
    const again = { ...changed, ...applyDetailed(changed) };
    expect(mainState(again)).toBe('detailed');
    expect(again.edits.opinion?.main).toContain('賛成です。');
  });
});

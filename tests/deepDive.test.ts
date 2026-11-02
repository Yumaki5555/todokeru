import { describe, expect, it } from 'vitest';
import { EMPTY_DRAFT } from '../src/content/callScript';
import { detailedMain, hasDeepDive } from '../src/content/deepDive';

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
});

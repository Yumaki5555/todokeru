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
    expect(text).toContain('私が確認した状況は、区報で知ったことです。');
    expect(text).toContain('説明会はあるのかを確認したいです。');
    expect(text).toContain('説明会を開いていただきたいと考えています。');
    expect(text).toContain('参考資料は、区の公式ページです。');
  });

  it('ことばを足りないまま入れても、自然な文にする（江東区の予算の例）', () => {
    const d: CallDraft = {
      ...EMPTY_DRAFT,
      topic: '江東区の予算',
      detail: '多文化共生について高額過ぎる',
      deepDive: {
        facts: 'やさしい日本語に5000万もかかってる',
        question: 'もっと安くならないのか？\nお金かけ過ぎでは？',
        desired: '予算やりなおし',
        source: '江東区のホームページ',
        points: ['status', 'process', 'cost'],
      },
    };
    expect(detailedMain(d)).toBe(
      [
        '江東区の予算について、懸念があります。多文化共生について、高額過ぎるという理由からです。',
        '私が確認した状況は、やさしい日本語に5000万もかかっていることです。',
        'もっと安くならないのか、お金かけ過ぎではないかを確認したいです。',
        '現在どのような確認や対応が行われているか、教えていただけますか？',
        '今後の対応手順と、分かる範囲で時期を教えていただけますか？',
        '関連する予算や費用の内訳は公開されていますか？',
        '予算やりなおしを希望します。',
        '参考資料は、江東区のホームページです。',
      ].join('\n'),
    );
  });

  it.each([
    ['予算やりなおし', '予算やりなおしを希望します。'],
    ['説明会の開催', '説明会の開催を希望します。'],
    ['もっと安く', 'もっと安くしていただきたいと考えています。'],
    ['予算を見直してください', '予算を見直していただきたいと考えています。'],
    ['予算を見直し', '予算を見直していただきたいと考えています。'],
    ['説明会を開催', '説明会を開催していただきたいと考えています。'],
    ['説明会を開く', '説明会を開くことを希望します。'],
    ['事業を見直すこと', '事業を見直すことを希望します。'],
    ['騒音がひどい', '騒音がひどいので、対応してください。'],
    ['騒音が続いている', '騒音が続いているので、対応してください。'],
    ['中止を求めます', '中止を求めます。'],
    ['やめろ', 'やめてください。'],
    ['やめろ！', 'やめてください。'],
    ['中止しろよ', '中止してください。'],
    ['中止せよ', '中止してください。'],
    ['予算を見直せ', '予算を見直してください。'],
    ['やめてくれ', 'やめてください。'],
    ['増税するな', '増税しないでください。'],
    ['説明がほしい', '説明を希望します。'],
    ['中止すべき', '中止すべきだと考えています。'],
    ['やめた方がいい', 'やめた方がよいと考えています。'],
    ['中止すべきだと思う', '中止すべきだと思います。'],
  ])('希望：%s → %s', (desired, out) => {
    const d: CallDraft = { ...EMPTY_DRAFT, topic: 'A計画', deepDive: { facts: '', question: '', desired, source: '', points: [] } };
    expect(detailedMain(d).split('\n')[1]).toBe(out);
  });

  it.each([
    ['9月30日、報道があった', '私が確認した状況は、9月30日、報道があったことです。'],
    ['9月30日、報道がありました', '私が確認した状況は、9月30日、報道があったことです。'],
    ['9月30日の報道', '私が確認した状況は、9月30日の報道です。'],
    ['区報で知った。説明会が1回だけだった', '私が確認した状況は、区報で知ったこと、説明会が1回だけだったことです。'],
    ['子どもが怖がってるよ', '私が確認した状況は、子どもが怖がっていることです。'],
    ['費用が高いです', '私が確認した状況は、費用が高いことです。'],
    ['対応が不十分だ', '私が確認した状況は、対応が不十分です。'],
    ['報道があった。本当なのか？', '私が確認した状況は、報道があったことです。本当なのか？'],
  ])('状況：%s → %s', (facts, out) => {
    const d: CallDraft = { ...EMPTY_DRAFT, topic: 'A計画', deepDive: { facts, question: '', desired: '', source: '', points: [] } };
    expect(detailedMain(d).split('\n')[1]).toBe(out);
  });

  it.each([
    ['誰が始めたの', '誰が始めたのかを確認したいです。'],
    ['始めた理由', '始めた理由を確認したいです。'],
    ['費用はいくら', '費用はいくらかを確認したいです。'],
    ['なぜ高い', 'なぜ高いのかを確認したいです。'],
    ['日程について', '日程を確認したいです。'],
    ['やさしい日本語とは', 'やさしい日本語とは何かを確認したいです。'],
    ['説明会はありますか？', '説明会はあるかを確認したいです。'],
    ['いつ決まりましたか', 'いつ決まったかを確認したいです。'],
    ['予算の内訳を教えてほしい', '予算の内訳を確認したいです。'],
  ])('確認したいこと：%s → %s', (question, out) => {
    const d: CallDraft = { ...EMPTY_DRAFT, topic: 'A計画', deepDive: { facts: '', question, desired: '', source: '', points: [] } };
    expect(detailedMain(d).split('\n')[1]).toBe(out);
  });

  it('市川市の例：状況・確認したいこと・希望がなめらかにつながる', () => {
    const d: CallDraft = {
      ...EMPTY_DRAFT,
      topic: '市川市のモスクパトロール',
      detail: '子どもの安全',
      deepDive: { facts: '9月30日、報道があった', question: '誰が始めたの', desired: 'やめろ', source: '', points: ['basis', 'status', 'cost'] },
    };
    expect(detailedMain(d)).toBe(
      [
        '市川市のモスクパトロールについて、子どもの安全の面から懸念があります。',
        '私が確認した状況は、9月30日、報道があったことです。',
        '誰が始めたのかを確認したいです。',
        '適用される制度・条例と、その根拠資料を教えていただけますか？',
        '現在どのような確認や対応が行われているか、教えていただけますか？',
        '関連する予算や費用の内訳は公開されていますか？',
        'やめてください。',
      ].join('\n'),
    );
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

// メール・フォームの文面の組み立て
import { describe, expect, it } from 'vitest';
import { EMPTY_DRAFT } from '../src/content/callScript';
import { EMPTY_MAIL, MAILTO_MAX, addressee, bodyText, buildMail, countChars, mailAutoText, mailMemoAsText, mailtoHref } from '../src/content/mailText';
import type { CallDraft, CallTarget, MailDraft } from '../src/types';

const draft = (p: Partial<CallDraft> = {}): CallDraft => ({ ...EMPTY_DRAFT, topic: 'A計画', ...p });
const mail = (p: Partial<MailDraft> = {}): MailDraft => ({ ...EMPTY_MAIL, ...p });
const target = (p: Partial<CallTarget> = {}): CallTarget => ({
  contactId: '131083-feedback',
  org: '江東区',
  department: '広聴課（ご意見窓口）',
  typeLabel: '広聴・ご意見窓口',
  phone: null,
  email: 'koe@example.jp',
  formUrl: 'https://example.jp/form',
  hours: null,
  sourceUrl: 'https://example.jp/contact',
  verifiedAt: '2026-10-01',
  status: 'verified',
  ...p,
});

describe('件名・宛名', () => {
  it('件名は目的ごと。「について」が重ならない', () => {
    expect(mailAutoText(draft({ topic: 'A計画について' }), mail(), 'subject')).toBe('【意見】A計画について');
    expect(mailAutoText(draft({ purpose: 'question' }), mail(), 'subject')).toBe('【質問】A計画について');
    expect(mailAutoText(draft({ purpose: 'department', topic: '道路の補修' }), mail(), 'subject')).toBe('【お問い合わせ】道路の補修の担当部署について');
    expect(mailAutoText(draft({ topic: '' }), mail(), 'subject')).toBe('【意見】○○について');
  });

  it('宛名：送り先がなければ「ご担当者様」。部署の名前なら部署まで、そうでなければ機関の名前だけ', () => {
    expect(addressee(null)).toBe('ご担当者様');
    expect(addressee(target())).toBe('江東区\n広聴課 ご担当者様');
    expect(addressee(target({ org: '総務省', department: 'ご意見・ご要望' }))).toBe('総務省 ご担当者様');
    expect(addressee(target({ org: '北海道', department: '代表電話（総合案内）' }))).toBe('北海道 ご担当者様');
    expect(addressee(target({ org: '東京都', department: '東京都議会 議会局管理部広報課' }))).toBe('東京都\n東京都議会 議会局管理部広報課 ご担当者様');
  });
});

describe('名乗り・お願い・署名', () => {
  it('名前と住まいは書いた分だけ入れる。「在住」「と申します」は重ねない', () => {
    expect(mailAutoText(draft(), mail(), 'greeting')).toBe('突然のご連絡失礼いたします。');
    expect(mailAutoText(draft(), mail({ name: '山田と申します', area: '江東区在住' }), 'greeting')).toBe(
      '突然のご連絡失礼いたします。\n江東区に住んでいる山田と申します。',
    );
    expect(mailAutoText(draft(), mail({ area: '江東区' }), 'greeting')).toBe('突然のご連絡失礼いたします。\n江東区に住んでいる者です。');
    expect(mailAutoText(draft(), mail({ name: '山田' }), 'signature')).toBe('山田');
    expect(mailAutoText(draft(), mail({ name: '山田', area: '江東区' }), 'signature')).toBe('山田\n江東区在住');
  });

  it('返信は「指定しない」なら文に入れない。選んだときだけ一文を加える', () => {
    expect(mailAutoText(draft(), mail(), 'request')).toBe('意見として記録していただけますよう、お願いいたします。');
    expect(mailAutoText(draft(), mail({ reply: 'want' }), 'request')).toBe(
      '意見として記録していただけますよう、お願いいたします。\nご回答いただけますと幸いです。',
    );
    expect(mailAutoText(draft(), mail({ reply: 'none' }), 'request')).toContain('ご返信は不要です。');
    // 質問は記録のお願いが最初は入らないので、何も選ばなければ「お願い」の部分ごと出さない
    expect(buildMail(draft({ purpose: 'question' }), mail()).body.map((p) => p.key)).toEqual(['to', 'greeting', 'main', 'closing']);
  });
});

describe('本文', () => {
  it('部分の間に空行を入れる。電話の台本で直した文は使わず、共通の入力から作る', () => {
    const d = draft({ detail: '子どもの安全', edits: { opinion: { main: '電話用に直した文' } } });
    const { subject, body } = buildMail(d, mail());
    expect(subject.text).toBe('【意見】A計画について');
    expect(bodyText(body)).toBe(
      [
        'ご担当者様',
        '突然のご連絡失礼いたします。',
        'A計画について、子どもの安全の面から懸念があります。',
        '意見として記録していただけますよう、お願いいたします。',
        'お忙しいところ恐れ入りますが、よろしくお願いいたします。',
      ].join('\n\n'),
    );
  });

  it('「詳しく整理」で入れた内容は、反映ボタンなしで本題に入る', () => {
    const d = draft({ deepDive: { facts: '', question: '', desired: '', source: '市の公式ページ', points: ['documents'] } });
    const main = buildMail(d, mail()).body.find((p) => p.key === 'main')!.text;
    expect(main).toContain('確認できる公式資料や掲載ページがあれば教えていただけますか？');
    expect(main).toContain('参考資料は、市の公式ページ');
  });

  it('書き直した文はメールの方だけに覚え、空にした部分は本文に入れない', () => {
    const m = mail({ edits: { opinion: { closing: '', main: '手で直した本題です。' } } });
    const { body } = buildMail(draft(), m);
    expect(body.find((p) => p.key === 'main')).toMatchObject({ text: '手で直した本題です。', edited: true });
    expect(bodyText(body)).not.toContain('恐れ入りますが');
  });

  it('文字数は改行・空白も、絵文字も1字に数える', () => {
    expect(countChars('あい\nう 😀')).toBe(6);
  });
});

describe('メールアプリで開くリンク', () => {
  it('短い文面は件名と本文を渡す（改行は CRLF）', () => {
    const m = mailtoHref('koe@example.jp', '【意見】A計画について', '1行目\n2行目');
    expect(m.withBody).toBe(true);
    expect(m.href).toBe(`mailto:koe@example.jp?subject=${encodeURIComponent('【意見】A計画について')}&body=1%E8%A1%8C%E7%9B%AE%0D%0A2%E8%A1%8C%E7%9B%AE`);
  });

  it('長すぎる文面は、宛先と件名だけを渡す', () => {
    const m = mailtoHref('koe@example.jp', '件名', 'あ'.repeat(300));
    expect(m.withBody).toBe(false);
    expect(m.href).toBe(`mailto:koe@example.jp?subject=${encodeURIComponent('件名')}`);
    expect(m.href.length).toBeLessThanOrEqual(MAILTO_MAX);
  });
});

describe('送った記録', () => {
  it('書いた項目だけを1行ずつまとめる', () => {
    const m = mail({ method: 'form', memo: { when: '2026年11月2日 10:00', to: '', subject: '【意見】A計画について', receipt: 'No.123', answer: '' } });
    expect(mailMemoAsText(draft({ target: target() }), m)).toBe(
      '【送った記録】\n日時：2026年11月2日 10:00\n送り先：江東区 広聴課（ご意見窓口）\n方法：問い合わせフォーム\n件名：【意見】A計画について\n受付番号：No.123',
    );
  });
});

import { describe, expect, it } from 'vitest';
import { href, parseHash, sectionHref } from '../src/router';
import { normalizeForSearch, telHref } from '../src/lib/text';

describe('ページの切り替え（#/ 方式）', () => {
  it('# の後ろからパスと条件を読む', () => {
    expect(parseHash('').path).toBe('/');
    expect(parseHash('#/').path).toBe('/');
    expect(parseHash('#/guide/phone').path).toBe('/guide/phone');
    expect(parseHash('#/guide/phone/').path).toBe('/guide/phone');
    const r = parseHash('#/contacts?tab=area&code=131083');
    expect(r.path).toBe('/contacts');
    expect(r.query.get('code')).toBe('131083');
  });

  it('#/ で始まらない古い形はトップとして扱う', () => {
    expect(parseHash('#sanpun').path).toBe('/');
  });

  it('リンク先を作る（空の値は付けない）', () => {
    expect(href('/')).toBe('#/');
    expect(href('/contacts', { tab: 'area', code: null })).toBe('#/contacts?tab=area');
    expect(sectionHref('/guide/phone', 'ch3')).toBe('#/guide/phone?s=ch3');
  });
});

describe('文字の道具', () => {
  it('カタカナ・全角・空白をそろえて検索できる', () => {
    expect(normalizeForSearch('コウトウ ク')).toBe('こうとうく');
    expect(normalizeForSearch('ＡＢＣ')).toBe('abc');
  });

  it('電話番号から tel: リンクを作る', () => {
    expect(telHref('03-0000-0000')).toBe('tel:0300000000');
  });
});

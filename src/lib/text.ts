import type { ManualSample } from '../types';

/** 検索用に文字をそろえる（全角・半角、カタカナ→ひらがな、空白を除く） */
export function normalizeForSearch(s: string): string {
  return s
    .normalize('NFKC')
    .replace(/[\s　]/g, '')
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .toLowerCase();
}

/** 電話番号から tel: リンクを作る（ハイフンを除く） */
export function telHref(phone: string): string {
  return 'tel:' + phone.replace(/[^\d+]/g, '');
}

/** マニュアルの文面の見本をまとめてコピーするときの文（部分の間に空行。件名のように別の欄に入れる部分は「件名：」を付ける） */
export function sampleText(s: ManualSample): string {
  return s.parts.map((p) => (p.field ? `${p.label}：${p.text}` : p.text)).join('\n\n');
}

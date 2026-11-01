// 自治体名・機関名での検索（すべてブラウザの中で行う）
import type { Agency, Municipality, Prefecture } from '../types';
import { normalizeForSearch } from '../lib/text';
import { AGENCY_CATEGORY_LABEL } from './labels';

export type EntityRef = { kind: 'agency'; id: string } | { kind: 'pref'; code: string } | { kind: 'muni'; code: string };

export interface SearchEntry {
  ref: EntityRef;
  name: string;
  sub: string; // 補足（都道府県名・機関の分類）
  n: string; // 正規化した名前
  k: string; // 正規化したよみ
  order: number;
}

export function buildSearchIndex(agencies: Agency[], prefectures: Prefecture[], municipalities: Municipality[]): SearchEntry[] {
  const prefName = new Map(prefectures.map((p) => [p.code, p.name]));
  const out: SearchEntry[] = [];
  agencies.forEach((a, i) =>
    out.push({ ref: { kind: 'agency', id: a.id }, name: a.name, sub: `国の機関（${AGENCY_CATEGORY_LABEL[a.category]}）`, n: normalizeForSearch(a.name), k: normalizeForSearch(a.kana), order: i }),
  );
  prefectures.forEach((p, i) =>
    out.push({ ref: { kind: 'pref', code: p.code }, name: p.name, sub: '都道府県', n: normalizeForSearch(p.name), k: normalizeForSearch(p.kana), order: 100 + i }),
  );
  municipalities.forEach((m, i) =>
    out.push({
      ref: { kind: 'muni', code: m.code },
      name: m.name,
      sub: prefName.get(m.pref_code) || '',
      n: normalizeForSearch(m.name),
      k: normalizeForSearch(m.kana),
      order: 1000 + i,
    }),
  );
  return out;
}

/** 名前・よみに入力した文字を含むものを探す。前方一致を先に並べる */
export function searchEntities(index: SearchEntry[], query: string): SearchEntry[] {
  const q = normalizeForSearch(query);
  if (!q) return [];
  const hits = index.filter((e) => e.n.includes(q) || e.k.includes(q));
  const rank = (e: SearchEntry) => (e.n.startsWith(q) || e.k.startsWith(q) ? 0 : 1);
  return hits.sort((a, b) => rank(a) - rank(b) || a.order - b.order);
}

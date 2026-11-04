// 他サイトから渡された自治体コードを、このサイトの一覧と突き合わせる
//   2けた：都道府県 / 5けた：検査数字のないコード（在留外国人のサイトなど）/ 6けた：全国地方公共団体コード
//   政令指定都市の区は窓口データにないので、総務省の一覧（wards.json）から親の市を引いて「ward」として返す。
//   東京23区は市区町村の一覧にそのままあるので、親に置きかえない。
//   どれにも当たらないコードは推測せず「unknown」とし、画面で利用者に選んでもらう。
import type { Municipality, Prefecture, Ward } from '../types';

export type Area =
  | { kind: 'none' }
  | { kind: 'unknown' }
  | { kind: 'pref'; pref: Prefecture }
  | { kind: 'muni'; muni: Municipality; pref: Prefecture }
  | { kind: 'ward'; ward: Ward; muni: Municipality; pref: Prefecture };

export interface AreaMasters {
  prefectures: Prefecture[];
  municipalities: Municipality[];
  wards: Ward[];
}

/** 全国地方公共団体コードの検査数字（6けた目）を足す */
export function withCheckDigit(code5: string): string {
  const d = code5.split('').map(Number);
  const sum = d[0] * 6 + d[1] * 5 + d[2] * 4 + d[3] * 3 + d[4] * 2;
  return code5 + String((11 - (sum % 11)) % 10);
}

export function resolveArea(raw: string, { prefectures, municipalities, wards }: AreaMasters): Area {
  if (!raw) return { kind: 'none' };
  if (/^\d{2}$/.test(raw)) {
    const pref = prefectures.find((p) => p.code === raw);
    return pref ? { kind: 'pref', pref } : { kind: 'unknown' };
  }
  const code = /^\d{5}$/.test(raw) ? withCheckDigit(raw) : raw;
  if (!/^\d{6}$/.test(code)) return { kind: 'unknown' };

  const prefOf = (m: Municipality) => prefectures.find((p) => p.code === m.pref_code);
  const muni = municipalities.find((m) => m.code === code);
  if (muni) {
    const pref = prefOf(muni);
    return pref ? { kind: 'muni', muni, pref } : { kind: 'unknown' };
  }
  const pref = prefectures.find((p) => p.lg_code === code);
  if (pref) return { kind: 'pref', pref };
  const ward = wards.find((w) => w.code === code);
  if (ward) {
    const city = municipalities.find((m) => m.code === ward.city_code);
    const cityPref = city && prefOf(city);
    if (city && cityPref) return { kind: 'ward', ward, muni: city, pref: cityPref };
  }
  return { kind: 'unknown' };
}

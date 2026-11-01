// public/data の JSON を必要なときだけ読み込む（一度読んだものは覚えておく）
// 窓口データは都道府県ごとのファイルに分け、選んだ都道府県の分だけ読む。
import type { Agency, AgencyContacts, Contact, DataSummary, MasterFile, Municipality, MunicipalityContacts, Prefecture } from '../types';
import { validateContact } from './validate';

const cache = new Map<string, Promise<unknown>>();

function dataUrl(path: string): string {
  return `${import.meta.env.BASE_URL}data/${path}`;
}

function load<T>(path: string): Promise<T> {
  let p = cache.get(path);
  if (!p) {
    p = fetch(dataUrl(path)).then((r) => {
      if (!r.ok) throw new Error(`${path} を読み込めませんでした（${r.status}）`);
      return r.json();
    });
    p.catch(() => cache.delete(path)); // 失敗したら次はやり直せるように
    cache.set(path, p);
  }
  return p as Promise<T>;
}

export const loadSummary = () => load<DataSummary>('summary.json');
export const loadAgencies = () => load<MasterFile<Agency>>('master/agencies.json');
export const loadPrefectures = () => load<MasterFile<Prefecture>>('master/prefectures.json');
export const loadMunicipalities = () => load<MasterFile<Municipality>>('master/municipalities.json');

/** 形が正しい窓口だけを残す（崩れたデータを画面に出さない） */
function keepValid<T extends { contacts: unknown[] }>(records: T[]): T[] {
  return records.map((r) => ({ ...r, contacts: r.contacts.filter((c) => validateContact(c).length === 0) }));
}

export async function loadAgencyContacts(): Promise<AgencyContacts[]> {
  return keepValid(await load<AgencyContacts[]>('contacts/agencies.json'));
}

export async function loadPrefContacts(prefCode: string): Promise<MunicipalityContacts[]> {
  if (!/^\d{2}$/.test(prefCode)) throw new Error('都道府県コードが不正です');
  return keepValid(await load<MunicipalityContacts[]>(`contacts/${prefCode}.json`));
}

/** 窓口の id（131083-general・mhlw-feedback など）から、その窓口と機関・自治体の名前を探す */
export async function findContact(id: string): Promise<{ org: string; contact: Contact } | null> {
  const m = /^(\d{2})\d{4}-/.exec(id);
  const records: (AgencyContacts | MunicipalityContacts)[] = m ? await loadPrefContacts(m[1]) : await loadAgencyContacts();
  for (const r of records) {
    const contact = r.contacts.find((c) => c.id === id);
    if (contact) return { org: 'agency_name' in r ? r.agency_name : r.municipality_name, contact };
  }
  return null;
}

/** テスト用：覚えた読み込み結果を消す */
export function clearDataCache(): void {
  cache.clear();
}

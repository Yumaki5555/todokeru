// 窓口検索で最後に見た地域（都道府県・市区町村）を、このタブの中だけに覚えておく（sessionStorage）
// 電話ガイドの「電話先を探す」から、同じ地域の窓口をすぐ開けるようにするため。外部へは送らない。

const KEY = 'todokeru:last-area:v1';

export interface LastArea {
  code: string; // 都道府県は2けた、市区町村は6けた
  name: string; // 画面に出す名前（例：東京都 新宿区）
}

export function loadLastArea(): LastArea | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as Partial<LastArea>;
    if (typeof a.code !== 'string' || !/^(\d{2}|\d{6})$/.test(a.code) || typeof a.name !== 'string' || !a.name) return null;
    return { code: a.code, name: a.name };
  } catch {
    return null;
  }
}

export function saveLastArea(a: LastArea): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    // 保存できない設定のブラウザでは、地域を引き継がないだけ
  }
}

// 別のサイトから来たときに、どのページでも出す「元のページへ戻る」帯
// 文言はサイトごとの固定文。項目名は文字として見せるだけで、リンクにしない。
import { useEffect, useState, type MouseEvent } from 'react';
import { loadMunicipalities, loadPrefectures, loadWards } from '../data/loaders';
import { resolveArea, type Area } from '../lib/areaCode';
import { FROM_SITES, clearFrom, useFromSite } from '../lib/fromSite';
import { href } from '../router';
import { Icon } from './Icon';

/** 引き継いだ自治体コードを、このサイトの一覧の名前にする（URL の文字は使わない） */
function useArea(code: string | null): Area | null {
  const [area, setArea] = useState<Area | null>(null);
  useEffect(() => {
    if (!code) {
      setArea(null);
      return;
    }
    let alive = true;
    Promise.all([loadPrefectures(), loadMunicipalities(), loadWards().catch(() => ({ items: [] }))]).then(
      ([p, m, w]) => alive && setArea(resolveArea(code, { prefectures: p.items, municipalities: m.items, wards: w.items })),
      () => alive && setArea({ kind: 'unknown' }),
    );
    return () => {
      alive = false;
    };
  }, [code]);
  return area;
}

function areaLabel(area: Area | null): string {
  if (area?.kind === 'ward') return `${area.muni.name}の問い合わせ先を見る`;
  if (area?.kind === 'muni') return `${area.muni.name}の窓口を見る`;
  if (area?.kind === 'pref') return `${area.pref.name}の窓口を見る`;
  return '窓口を探す';
}

export function FromSiteBar({ path }: { path: string }) {
  const memo = useFromSite();
  const area = useArea(memo?.code ?? null);
  if (!memo) return null;
  const site = FROM_SITES[memo.site];
  const known = area && area.kind !== 'none' && area.kind !== 'unknown';

  const onBack = (e: MouseEvent) => {
    // 新しいタブで開くときは、このタブのメモを残す
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    clearFrom({ silent: true });
  };

  return (
    <section className="from-bar" aria-label="移動元のページへ戻る">
      <div className="wrap from-bar-in">
        <a className="from-back" href={memo.url} onClick={onBack}>
          <Icon name="arrow-left" />
          {site.back}
        </a>
        <p className="from-info">
          <span>{site.name}から来ました</span>
          {memo.item && <span className="from-item">見ていた項目：{memo.item}</span>}
        </p>
        {memo.code && path !== '/contacts' && (
          <a className="from-area" href={known ? href('/contacts', { tab: 'area', code: memo.code }) : href('/contacts')}>
            {areaLabel(area)}
          </a>
        )}
        <button type="button" className="from-close" aria-label="戻る案内を閉じる" onClick={() => clearFrom()}>
          ×
        </button>
      </div>
    </section>
  );
}

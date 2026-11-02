// 全国の窓口を探す
// URL で選んだ状態を表す（共有・将来の入口サイトからの地域の引き継ぎ用）
//   #/contacts?tab=area&code=13       都道府県
//   #/contacts?tab=area&code=131083   市区町村（全国地方公共団体コード6けた）
//   #/contacts?tab=agency&id=mhlw     国の機関
//   #/contacts?tab=search             名前で検索
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { Agency, AgencyCategory, Coverage, DataSummary, IconName, Municipality, Prefecture } from '../types';
import { AGENCY_CATEGORY_LABEL, CONTACT_TYPE_INFO, TYPES_FOR_LOCAL } from '../data/labels';
import { loadAgencies, loadMunicipalities, loadPrefectures, loadSummary } from '../data/loaders';
import { buildSearchIndex, searchEntities, type SearchEntry } from '../data/search';
import { href, navigate, type Route } from '../router';
import { scrollToSection } from '../lib/dom';
import { saveLastArea } from '../lib/lastArea';
import { SITE, formatDate } from '../site';
import { ContactCard, type Entity } from '../components/ContactCard';
import { Icon } from '../components/Icon';
import { PageEndNav } from '../components/Links';
import { PageHead } from '../components/PageHead';

type Tab = 'area' | 'agency' | 'search';
// label は画面に出す名前。parts の切れ目（<wbr>）でだけ折り返す
const TABS: { id: Tab; parts: string[]; icon: IconName }[] = [
  { id: 'area', parts: ['地域', 'から探す'], icon: 'map' },
  { id: 'agency', parts: ['国の機関', 'から探す'], icon: 'landmark' },
  { id: 'search', parts: ['名前で', '検索'], icon: 'search' },
];
const CATEGORY_ORDER: AgencyCategory[] = ['cabinet', 'ministry', 'agency', 'diet'];
const CATEGORY_ICON: Record<AgencyCategory, IconName> = { cabinet: 'landmark', ministry: 'building', agency: 'folder', diet: 'assembly' };
const MAX_RESULTS = 30;

/** 都道府県の選択欄を地方ごとに分ける（都道府県コードの範囲） */
const REGIONS: { label: string; from: string; to: string }[] = [
  { label: '北海道・東北', from: '01', to: '07' },
  { label: '関東', from: '08', to: '14' },
  { label: '中部', from: '15', to: '23' },
  { label: '近畿', from: '24', to: '30' },
  { label: '中国', from: '31', to: '35' },
  { label: '四国', from: '36', to: '39' },
  { label: '九州・沖縄', from: '40', to: '47' },
];

interface Masters {
  agencies: Agency[];
  prefectures: Prefecture[];
  municipalities: Municipality[];
  source: string;
  sourceUrl: string;
}

export function ContactsPage({ route }: { route: Route }) {
  const [masters, setMasters] = useState<Masters | null>(null);
  const [summary, setSummary] = useState<DataSummary | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    Promise.all([loadAgencies(), loadPrefectures(), loadMunicipalities()]).then(
      ([a, p, m]) =>
        alive &&
        setMasters({ agencies: a.items, prefectures: p.items, municipalities: m.items, source: m.source, sourceUrl: m.source_url }),
      () => alive && setFailed(true),
    );
    loadSummary().then(
      (s) => alive && setSummary(s),
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, [attempt]);

  return (
    <div className="wrap page contacts-page">
      <PageHead title="全国の窓口を探す" />
      <CoverageNote summary={summary} />

      <section className="section section-tight" aria-labelledby="find-h">
        <h2 id="find-h" className="sr-only">
          探す
        </h2>
        {failed && (
          <div className="note" role="alert">
            <Icon name="info" />
            <span>
              一覧を読み込めませんでした。通信状態を確かめて、もう一度お試しください。{' '}
              <button type="button" className="btn btn-secondary btn-small" onClick={() => setAttempt((n) => n + 1)}>
                もう一度読み込む
              </button>
            </span>
          </div>
        )}
        {!masters && !failed && <p className="muted">一覧を読み込んでいます…</p>}
        {masters && <Finder masters={masters} route={route} summary={summary} />}
      </section>

      <details className="fold fold-section">
        <summary>窓口の種類（代表・広聴・議会事務局）</summary>
        <dl className="type-cards">
          {TYPES_FOR_LOCAL.map((t) => (
            <div key={t}>
              <dt>
                <Icon name={CONTACT_TYPE_INFO[t].icon} />
                {CONTACT_TYPE_INFO[t].label}
              </dt>
              <dd>{CONTACT_TYPE_INFO[t].desc}</dd>
            </div>
          ))}
        </dl>
      </details>

      <details className="fold fold-section">
        <summary>このページの出典</summary>
        <ul className="plain-list small">
          <li>
            都道府県・市区町村の一覧：
            {masters ? <a href={masters.sourceUrl}>{masters.source}</a> : '総務省「全国地方公共団体コード」'}
            （政令指定都市は市全体で1件。区は含みません）
          </li>
          <li>国の機関：各機関の公式サイト（トップページの表示を確認した日を、それぞれに記載）</li>
          <li>
            自治体の公式サイトの探し方：<a href={SITE.jlisMap.url}>{SITE.jlisMap.label}</a>（{SITE.jlisMap.desc}）
          </li>
          <li>
            窓口の連絡先：各機関の公式ページに載っている情報だけを掲載し、窓口ごとに出典ページと最終確認日を表示します。掲載前に、電話番号・メールアドレスなどが出典ページに実際に書かれているかを照合しています。
          </li>
        </ul>
      </details>

      <PageEndNav />
    </div>
  );
}

/** ページ冒頭の登録状況（公式確認済みの連絡先がある機関・自治体の数を、実際のデータから表示する） */
function CoverageNote({ summary }: { summary: DataSummary | null }) {
  if (!summary) return null;
  if (summary.contacts.verified === 0 || !summary.coverage) {
    return (
      <div className="notice" role="note">
        <Icon name="info" />
        <p>
          <b>連絡先は調査中です。</b>
          推測した電話番号やメールアドレスは載せません。連絡先は、必ず各機関の公式サイトで確かめてください。
        </p>
      </div>
    );
  }
  const c = summary.coverage;
  const rows: { icon: IconName; label: string; cov: Coverage }[] = [
    { icon: 'map', label: '都道府県', cov: c.prefectures },
    { icon: 'landmark', label: '国の機関', cov: c.agencies },
    { icon: 'building', label: '市区町村', cov: c.municipalities },
  ];
  return (
    <div className="coverage" role="note" aria-labelledby="coverage-h">
      <p className="coverage-title" id="coverage-h">
        <Icon name="check" />
        公式確認済みの連絡先
        <span className="coverage-date">{formatDate(summary.generated_at)}時点</span>
      </p>
      <ul className="coverage-list">
        {rows.map((r) => (
          <li key={r.label}>
            <span className="coverage-label">
              <Icon name={r.icon} />
              {r.label}
            </span>
            <span className="meter" aria-hidden="true">
              <span style={{ width: `${r.cov.total ? (r.cov.with_verified / r.cov.total) * 100 : 0}%` }} />
            </span>
            <span className="coverage-num">
              {r.cov.with_verified.toLocaleString()}
              <span className="muted">／{r.cov.total.toLocaleString()}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="coverage-note">推測した連絡先は載せません。まだ載っていない窓口は、各機関の公式サイトで確かめてください。</p>
    </div>
  );
}

function Finder({ masters, route, summary }: { masters: Masters; route: Route; summary: DataSummary | null }) {
  const { agencies, prefectures, municipalities } = masters;
  const q = route.query;

  // URL から選んでいるものを読む（不正な値は無視する）
  const code = q.get('code') || '';
  const muni = /^\d{6}$/.test(code) ? municipalities.find((m) => m.code === code) : undefined;
  const pref = muni ? prefectures.find((p) => p.code === muni.pref_code) : prefectures.find((p) => p.code === code || p.lg_code === code);
  const agency = agencies.find((a) => a.id === q.get('id'));
  const tabParam = q.get('tab') as Tab | null;
  const tab: Tab = tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : agency ? 'agency' : 'area';

  // 一覧から選んだときだけ、結果の見出しへ移動する（都道府県・市区町村の選択欄では移動しない）
  const focusResult = useRef(false);
  const go = (params: Record<string, string | null>, moveToResult = false) => {
    focusResult.current = moveToResult;
    navigate(href('/contacts', params), { replace: true });
  };

  const entity: Entity | null =
    tab === 'agency' && agency
      ? { kind: 'agency', agency }
      : tab === 'area' && muni && pref
        ? { kind: 'muni', muni, pref }
        : tab === 'area' && pref
          ? { kind: 'pref', pref }
          : null;
  const entityId = entity
    ? entity.kind === 'agency'
      ? entity.agency.id
      : entity.kind === 'muni'
        ? entity.muni.code
        : entity.pref.code
    : '';

  useEffect(() => {
    if (entityId && focusResult.current) scrollToSection('entity-h');
    focusResult.current = false;
  }, [entityId]);

  // 地域を選んだら覚えておく（電話ガイドの「電話先を探す」で同じ地域を開くため）
  const areaName = entity?.kind === 'muni' ? `${entity.pref.name} ${entity.muni.name}` : entity?.kind === 'pref' ? entity.pref.name : '';
  useEffect(() => {
    if (areaName) saveLastArea({ code: entityId, name: areaName });
  }, [entityId, areaName]);

  return (
    <div className="finder">
      <div className="seg" role="group" aria-label="探し方を選ぶ">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            aria-label={t.parts.join('')}
            onClick={() =>
              go(
                t.id === 'area'
                  ? { tab: 'area', code: code || null }
                  : t.id === 'agency'
                    ? { tab: 'agency', id: agency?.id || null }
                    : { tab: 'search' },
              )
            }
          >
            <Icon name={t.icon} />
            <span>
              {t.parts.map((p, i) => (
                <Fragment key={p}>
                  {i > 0 && <wbr />}
                  {p}
                </Fragment>
              ))}
            </span>
          </button>
        ))}
      </div>

      <div className="finder-pane">
        {tab === 'area' && (
          <AreaPicker
            prefectures={prefectures}
            municipalities={municipalities}
            pref={pref}
            muni={muni}
            summary={summary}
            onChange={(c) => go({ tab: 'area', code: c || null })}
          />
        )}
        {tab === 'agency' && <AgencyPicker agencies={agencies} selected={agency} onPick={(id) => go({ tab: 'agency', id }, true)} />}
        {tab === 'search' && (
          <NameSearch
            masters={masters}
            onPick={(e) => go(e.ref.kind === 'agency' ? { tab: 'agency', id: e.ref.id } : { tab: 'area', code: e.ref.code }, true)}
          />
        )}
      </div>

      {entity && (
        <div className="finder-result">
          <ContactCard entity={entity} />
        </div>
      )}
    </div>
  );
}

function AreaPicker({
  prefectures,
  municipalities,
  pref,
  muni,
  summary,
  onChange,
}: {
  prefectures: Prefecture[];
  municipalities: Municipality[];
  pref?: Prefecture;
  muni?: Municipality;
  summary: DataSummary | null;
  onChange: (code: string) => void;
}) {
  const munis = useMemo(() => (pref ? municipalities.filter((m) => m.pref_code === pref.code) : []), [pref, municipalities]);
  const cov = pref ? summary?.by_pref?.[pref.code]?.municipalities : undefined;
  return (
    <div className="pickers">
      <div className="field">
        <label htmlFor="pick-pref">
          <span className="step-badge" data-n="1" aria-hidden="true" />
          都道府県を選ぶ
        </label>
        <select id="pick-pref" value={pref?.code || ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">選んでください</option>
          {REGIONS.map((r) => (
            <optgroup key={r.label} label={r.label}>
              {prefectures
                .filter((p) => p.code >= r.from && p.code <= r.to)
                .map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="pick-muni">
          <span className="step-badge" data-n="2" aria-hidden="true" />
          市区町村を選ぶ
        </label>
        <select id="pick-muni" value={muni?.code || ''} disabled={!pref} onChange={(e) => onChange(e.target.value || pref?.code || '')}>
          <option value="">{pref ? `${pref.name}（都道府県）の窓口を見る` : '先に都道府県を選んでください'}</option>
          {munis.map((m) => (
            <option key={m.code} value={m.code}>
              {m.name}
            </option>
          ))}
        </select>
        {pref && (
          <p className="field-hint">
            {pref.name}の市区町村：{munis.length}
            {cov && `（連絡先を掲載中：${cov.with_shown}）`}
          </p>
        )}
      </div>
    </div>
  );
}

function AgencyPicker({ agencies, selected, onPick }: { agencies: Agency[]; selected?: Agency; onPick: (id: string) => void }) {
  return (
    <div className="agency-groups">
      {CATEGORY_ORDER.map((cat) => {
        const list = agencies.filter((a) => a.category === cat);
        if (!list.length) return null;
        return (
          <div className="agency-group" key={cat}>
            <h3>
              <Icon name={CATEGORY_ICON[cat]} />
              {AGENCY_CATEGORY_LABEL[cat]}
            </h3>
            <ul>
              {list.map((a) => (
                <li key={a.id}>
                  <button type="button" className="chip" aria-pressed={selected?.id === a.id} onClick={() => onPick(a.id)}>
                    {a.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <p className="field-hint">主な府省庁と国会を掲載しています。</p>
    </div>
  );
}

function NameSearch({ masters, onPick }: { masters: Masters; onPick: (e: SearchEntry) => void }) {
  const [text, setText] = useState('');
  const index = useMemo(() => buildSearchIndex(masters.agencies, masters.prefectures, masters.municipalities), [masters]);
  const hits = useMemo(() => searchEntities(index, text), [index, text]);
  const shown = hits.slice(0, MAX_RESULTS);

  return (
    <div className="name-search">
      <div className="field">
        <label htmlFor="name-q">
          <Icon name="search" />
          自治体名・機関名
        </label>
        <input
          id="name-q"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例：江東区、こうとう、厚生労働省"
          autoComplete="off"
          aria-describedby="name-q-hint name-q-count"
        />
        <p className="field-hint" id="name-q-hint">
          ひらがなのよみでも探せます。入力した文字は送信・保存されません。
        </p>
      </div>
      <p id="name-q-count" className="search-count" role="status" aria-live="polite">
        {text.trim() === ''
          ? ''
          : hits.length === 0
            ? '見つかりませんでした。別の書き方（ひらがな・一部だけなど）でお試しください。'
            : hits.length > MAX_RESULTS
              ? `${hits.length}件見つかりました。最初の${MAX_RESULTS}件を表示しています。もう少し詳しく入力してください。`
              : `${hits.length}件見つかりました。`}
      </p>
      {shown.length > 0 && (
        <ul className="search-results">
          {shown.map((e) => (
            <li key={e.ref.kind + (e.ref.kind === 'agency' ? e.ref.id : e.ref.code)}>
              <button type="button" onClick={() => onPick(e)}>
                <b>{e.name}</b>
                <span>{e.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 全国の窓口を探す
// URL で選んだ状態を表す（共有・将来の入口サイトからの地域の引き継ぎ用）
//   #/contacts?tab=area&code=13       都道府県
//   #/contacts?tab=area&code=131083   市区町村（全国地方公共団体コード6けた）
//   #/contacts?tab=agency&id=mhlw     国の機関
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Agency, AgencyCategory, DataSummary, IconName, Municipality, Prefecture } from '../types';
import { AGENCY_CATEGORY_LABEL, CONTACT_TYPE_INFO, TYPES_FOR_LOCAL } from '../data/labels';
import { loadAgencies, loadMunicipalities, loadPrefectures, loadSummary } from '../data/loaders';
import { buildSearchIndex, searchEntities, type SearchEntry } from '../data/search';
import { href, navigate, type Route } from '../router';
import { scrollToSection } from '../lib/dom';
import { SITE, formatDate } from '../site';
import { ContactCard, type Entity } from '../components/ContactCard';
import { Icon } from '../components/Icon';
import { KindChips } from '../components/KindChips';
import { PageEndNav } from '../components/Links';
import { PageHead } from '../components/PageHead';

type Tab = 'area' | 'agency' | 'search';
// label は画面に出す短い名前。読み上げでは rest を続けて「〜から探す」と読ませる
const TABS: { id: Tab; label: string; rest?: string; icon: IconName }[] = [
  { id: 'area', label: '都道府県・市区町村', rest: 'から探す', icon: 'map' },
  { id: 'agency', label: '国の機関', rest: 'から探す', icon: 'landmark' },
  { id: 'search', label: '名前で検索', icon: 'search' },
];
const CATEGORY_ORDER: AgencyCategory[] = ['cabinet', 'ministry', 'agency', 'diet'];
const MAX_RESULTS = 30;

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
    loadSummary().then((s) => alive && setSummary(s), () => undefined);
    return () => {
      alive = false;
    };
  }, [attempt]);

  return (
    <div className="wrap page contacts-page">
      <PageHead title="全国の窓口を探す">
        <KindChips className="page-kinds" />
      </PageHead>

      <div className="notice" role="note">
        <Icon name="info" />
        <p>
          <b>連絡先は調査中です。</b>
          推測した電話番号やメールアドレスは載せません。調べていない窓口は「未調査」と表示します。連絡先は、必ず各機関の公式サイトで確かめてください。
        </p>
      </div>

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
        {masters && <Finder masters={masters} route={route} />}
      </section>

      <section className="section" aria-labelledby="types-h">
        <h2 id="types-h" className="section-title">
          窓口の種類
        </h2>
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
      </section>

      {summary && (
        <section className="section" aria-labelledby="stats-h">
          <h2 id="stats-h" className="section-title">
            登録状況
          </h2>
          <dl className="stats" aria-label="登録件数">
            <div>
              <dt>
                <Icon name="landmark" />
                国の機関
              </dt>
              <dd>{summary.entities.agencies}</dd>
            </div>
            <div>
              <dt>
                <Icon name="map" />
                都道府県
              </dt>
              <dd>{summary.entities.prefectures}</dd>
            </div>
            <div>
              <dt>
                <Icon name="building" />
                市区町村
              </dt>
              <dd>{summary.entities.municipalities.toLocaleString()}</dd>
            </div>
            <div className="stats-verified">
              <dt>
                <Icon name="check" />
                公式確認済みの窓口
              </dt>
              <dd>
                {summary.contacts.verified.toLocaleString()}件<span className="muted">（{formatDate(summary.generated_at)}時点）</span>
              </dd>
            </div>
          </dl>
        </section>
      )}

      <details className="fold fold-section">
        <summary>このページの出典</summary>
        <ul className="plain-list small">
          <li>
            都道府県・市区町村の一覧：
            {masters ? (
              <a href={masters.sourceUrl}>{masters.source}</a>
            ) : (
              '総務省「全国地方公共団体コード」'
            )}
            （政令指定都市は市全体で1件。区は含みません）
          </li>
          <li>国の機関：各機関の公式サイト（トップページの表示を確認した日を、それぞれに記載）</li>
          <li>
            自治体の公式サイトの探し方：<a href={SITE.jlisMap.url}>{SITE.jlisMap.label}</a>（{SITE.jlisMap.desc}）
          </li>
          <li>窓口の連絡先：公式に公開されている情報だけを、公式ページのURLと最終確認日をつけて掲載します。</li>
        </ul>
      </details>

      <PageEndNav />
    </div>
  );
}

function Finder({ masters, route }: { masters: Masters; route: Route }) {
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
  const entityId = entity ? (entity.kind === 'agency' ? entity.agency.id : entity.kind === 'muni' ? entity.muni.code : entity.pref.code) : '';

  useEffect(() => {
    if (entityId && focusResult.current) scrollToSection('entity-h');
    focusResult.current = false;
  }, [entityId]);

  return (
    <div className="finder">
      <div className="seg" role="group" aria-label="探し方を選ぶ">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            aria-label={t.label + (t.rest || '')}
            onClick={() => go(t.id === 'area' ? { tab: 'area', code: code || null } : t.id === 'agency' ? { tab: 'agency', id: agency?.id || null } : { tab: 'search' })}
          >
            <Icon name={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'area' && (
        <AreaPicker
          prefectures={prefectures}
          municipalities={municipalities}
          pref={pref}
          muni={muni}
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
  onChange,
}: {
  prefectures: Prefecture[];
  municipalities: Municipality[];
  pref?: Prefecture;
  muni?: Municipality;
  onChange: (code: string) => void;
}) {
  const munis = useMemo(() => (pref ? municipalities.filter((m) => m.pref_code === pref.code) : []), [pref, municipalities]);
  return (
    <div className="pickers">
      <div className="field">
        <label htmlFor="pick-pref">
          <Icon name="map" />
          都道府県を選ぶ
        </label>
        <select id="pick-pref" value={pref?.code || ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">選んでください</option>
          {prefectures.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="pick-muni">
          <Icon name="building" />
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
        {pref && <p className="field-hint">{pref.name}の市区町村：{munis.length}</p>}
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
            <h3>{AGENCY_CATEGORY_LABEL[cat]}</h3>
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
      <p className="field-hint">主な府省庁と国会を掲載しています。ほかの機関は今後追加します。</p>
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

// 窓口検索の結果：1つの機関・自治体と、その窓口（代表・広聴・議会事務局。載せたところには請願・陳情の届け先・警察・教育委員会も）
import { useEffect, useState, type ReactNode } from 'react';
import type { Agency, Contact, ContactType, Municipality, Prefecture, Ward } from '../types';
import {
  AGENCY_CATEGORY_LABEL,
  AUTO_MATCHED_NOTE,
  CONTACT_TYPE_INFO,
  EXTRA_TYPES_FOR_DIET,
  EXTRA_TYPES_FOR_MUNI,
  EXTRA_TYPES_FOR_PREF,
  PETITION_DRAFT_LABEL,
  PETITION_GUIDE_LABEL,
  STATUS_LABEL,
  TYPES_FOR_AGENCY,
  TYPES_FOR_DIET,
  TYPES_FOR_LOCAL,
} from '../data/labels';
import { loadAgencyContacts, loadOfficialSites, loadPrefContacts } from '../data/loaders';
import { isDisplayable } from '../data/validate';
import { scrollToSection } from '../lib/dom';
import { telHref } from '../lib/text';
import { href, navigate, parseHash } from '../router';
import { SITE, formatDate } from '../site';
import { Icon } from './Icon';
import { ReportLink } from './Links';

export type Entity =
  { kind: 'agency'; agency: Agency } | { kind: 'pref'; pref: Prefecture } | { kind: 'muni'; muni: Municipality; pref: Prefecture };

function entityKey(e: Entity): string {
  return e.kind === 'agency' ? 'a:' + e.agency.id : e.kind === 'pref' ? 'p:' + e.pref.code : 'm:' + e.muni.code;
}

interface ContactsState {
  key: string;
  status: 'loading' | 'ok' | 'error';
  contacts: Contact[];
  /** 市区町村のときだけ：都道府県の警察の窓口（警察は都道府県の仕事なので、市区町村の結果にも一緒に出す） */
  prefPolice: Contact[];
}

/** 選んだ機関・自治体の窓口データを読む（都道府県ごとのファイルを必要なときだけ読む） */
function useContacts(entity: Entity) {
  const [state, setState] = useState<ContactsState>({ key: '', status: 'loading', contacts: [], prefPolice: [] });
  const [attempt, setAttempt] = useState(0);
  const key = entityKey(entity);

  useEffect(() => {
    let alive = true;
    setState({ key, status: 'loading', contacts: [], prefPolice: [] });
    const job =
      entity.kind === 'agency'
        ? loadAgencyContacts().then((rs) => ({ contacts: rs.find((r) => r.agency_id === entity.agency.id)?.contacts || [], prefPolice: [] }))
        : loadPrefContacts(entity.pref.code).then((rs) => {
            const code = entity.kind === 'pref' ? entity.pref.lg_code : entity.muni.code;
            const prefPolice =
              entity.kind === 'muni' ? (rs.find((r) => r.municipality_code === entity.pref.lg_code)?.contacts || []).filter((c) => c.type === 'police') : [];
            return { contacts: rs.find((r) => r.municipality_code === code)?.contacts || [], prefPolice };
          });
    job.then(
      (found) => alive && setState({ key, status: 'ok', ...found }),
      () => alive && setState({ key, status: 'error', contacts: [], prefPolice: [] }),
    );
    return () => {
      alive = false;
    };
    // entity が同じ機関・自治体を指す間（key が同じ間）は読み直さない
  }, [key, attempt]);

  return {
    ...(state.key === key ? state : { status: 'loading' as const, contacts: [], prefPolice: [] }),
    retry: () => setAttempt((n) => n + 1),
  };
}

const ENTITY_ICON = { agency: 'landmark', pref: 'map', muni: 'building' } as const;

/** ward：政令指定都市の区のコードで来たとき（窓口データに区はないので、親の市の問い合わせ先だと明示する） */
export function ContactCard({ entity, ward }: { entity: Entity; ward?: Ward }) {
  const { status, contacts, prefPolice, retry } = useContacts(entity);
  const types: ContactType[] =
    entity.kind === 'agency' ? (entity.agency.category === 'diet' ? TYPES_FOR_DIET : TYPES_FOR_AGENCY) : TYPES_FOR_LOCAL;
  const name = entity.kind === 'agency' ? entity.agency.name : entity.kind === 'pref' ? entity.pref.name : entity.muni.name;
  // 確認待ち（unverified）だけの種類しかないときは、同じ説明を欄ごとにくり返さず1か所にまとめる
  const hasBase = contacts.some((c) => types.includes(c.type) && c.status !== 'unverified');
  // 請願・陳情の届け先・警察・教育委員会は、連絡先を載せたときだけ欄を出す（まだ調べていない全国の自治体に「未調査」を並べない）
  const extraTypes =
    entity.kind === 'pref'
      ? EXTRA_TYPES_FOR_PREF
      : entity.kind === 'muni'
        ? EXTRA_TYPES_FOR_MUNI
        : entity.agency.category === 'diet'
          ? EXTRA_TYPES_FOR_DIET
          : [];
  const extras = extraTypes
    .filter((t) => contacts.some((c) => c.type === t))
    .map((t) => ({ type: t, contacts: contacts.filter((c) => c.type === t), from: undefined as string | undefined }));
  if (entity.kind === 'muni' && prefPolice.length) extras.push({ type: 'police', contacts: prefPolice, from: entity.pref.name });

  return (
    <article className="entity" aria-labelledby="entity-h" aria-busy={status === 'loading'}>
      <header className="entity-head">
        <span className="entity-icon" aria-hidden="true">
          <Icon name={ENTITY_ICON[entity.kind]} />
        </span>
        <div className="entity-head-main">
          <h3 id="entity-h" tabIndex={-1}>
            {ward ? `${name}の問い合わせ先` : name}
          </h3>
          {ward && <p className="entity-ward">{ward.name}の窓口は載せていないため、{name}全体の問い合わせ先を出しています。</p>}
          <EntityMeta entity={entity} />
        </div>
      </header>

      {status === 'error' && (
        <div className="note" role="alert">
          <Icon name="info" />
          <span>
            窓口データを読み込めませんでした。通信状態を確かめて、もう一度お試しください。{' '}
            <button type="button" className="btn btn-secondary btn-small" onClick={retry}>
              もう一度読み込む
            </button>
          </span>
        </div>
      )}
      {status === 'loading' && <p className="muted">窓口データを読み込んでいます…</p>}
      {status === 'ok' && !hasBase && <NotListed entity={entity} types={types} />}
      {status === 'ok' && (hasBase || extras.length > 0) && (
        <ul className="slots">
          {hasBase && types.map((t) => <ContactSlot key={t} type={t} contacts={contacts.filter((c) => c.type === t)} owner={name} />)}
          {extras.map((s) => (
            <ContactSlot key={s.type} type={s.type} contacts={s.contacts} from={s.from} owner={s.from || name} wardCode={ward?.code} />
          ))}
        </ul>
      )}
    </article>
  );
}

/** 外部サイトへのボタン型リンク */
function OfficialLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a className="btn btn-secondary btn-small entity-official" href={to}>
      {children}
      <Icon name="external" />
      <span className="sr-only">（外部サイト）</span>
    </a>
  );
}

function EntityMeta({ entity }: { entity: Entity }) {
  if (entity.kind === 'agency') {
    const a = entity.agency;
    return (
      <>
        <p className="entity-kind">
          国の機関・{AGENCY_CATEGORY_LABEL[a.category]}（{a.position}）
        </p>
        <OfficialLink to={a.official_url}>{a.name}の公式サイト</OfficialLink>
        <details className="fold fold-small">
          <summary>詳しい情報</summary>
          <dl className="entity-meta">
            <div>
              <dt>主な担当（例）</dt>
              <dd>{a.roles}</dd>
            </div>
            <div>
              <dt>公式サイトの確認日</dt>
              <dd>{formatDate(a.url_checked_at)}に表示を確認</dd>
            </div>
          </dl>
        </details>
      </>
    );
  }
  const code = entity.kind === 'pref' ? entity.pref.lg_code : entity.muni.code;
  return (
    <>
      <p className="entity-kind">
        {entity.kind === 'pref' ? '都道府県' : `市区町村（${entity.pref.name}）${entity.muni.designated ? '・政令指定都市' : ''}`}
      </p>
      <OfficialLink to={SITE.jlisMap.url}>{SITE.jlisMap.label}で公式サイトを探す</OfficialLink>
      {entity.kind === 'muni' && entity.muni.designated && (
        <p className="entity-note">区役所の窓口は、市の公式サイトで確かめてください。</p>
      )}
      <details className="fold fold-small">
        <summary>詳しい情報</summary>
        <dl className="entity-meta">
          <div>
            <dt>自治体コード</dt>
            <dd>{code}</dd>
          </div>
          <div>
            <dt>公式サイトの探し方</dt>
            <dd>{SITE.jlisMap.desc}から探せます。</dd>
          </div>
        </dl>
      </details>
    </>
  );
}

/** 窓口を表示できない自治体の公式サイト（自治体名を確かめたものだけ。なければ J-LIS のリンク集で案内する） */
function useOfficialSite(entity: Entity): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const code = entity.kind === 'muni' ? entity.muni.code : null;
  useEffect(() => {
    setUrl(null);
    if (!code) return;
    let alive = true;
    loadOfficialSites().then(
      (f) => alive && setUrl(f.items[code] ?? null),
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, [code]);
  return url;
}

/** まだ窓口を表示できない機関・自治体：窓口がないという意味ではないことを、1か所にまとめて案内する */
function NotListed({ entity, types }: { entity: Entity; types: ContactType[] }) {
  const official = useOfficialSite(entity);
  return (
    <div className="not-researched">
      <p>
        <b>窓口情報は確認中です。</b>
        窓口がないという意味ではありません。{official || entity.kind === 'agency' ? '公式サイト' : '公式サイト（上のリンク集から探せます）'}
        の「お問い合わせ」で、次の窓口を確かめてください。
      </p>
      {official && entity.kind === 'muni' && <OfficialLink to={official}>{entity.muni.name}の公式サイト</OfficialLink>}
      <ul className="type-mini">
        {types.map((t) => (
          <li key={t}>
            <Icon name={CONTACT_TYPE_INFO[t].icon} />
            {CONTACT_TYPE_INFO[t].label}
          </li>
        ))}
      </ul>
      <p className="contact-script">
        <a href={href('/guide/phone')}>
          番号がわかったら、電話の台本を作る
          <Icon name="arrow-right" className="icon-inline" />
        </a>
      </p>
    </div>
  );
}

/** 窓口の種類ごとの欄。from：ほかの自治体の窓口を出すとき（市区町村の結果に出す都道府県の警察）、その自治体の名前 */
/** owner：窓口を持つ機関・自治体の名前（誤りの報告に、どの窓口かを書き込むため） */
/** wardCode：政令指定都市の区のコードで開いているとき、そのコード（書き方ガイドから同じ表示へ戻るため） */
function ContactSlot({ type, contacts, from, owner, wardCode }: { type: ContactType; contacts: Contact[]; from?: string; owner: string; wardCode?: string }) {
  const info = CONTACT_TYPE_INFO[type];
  const shown = contacts.filter(isDisplayable);
  const unavailable = contacts.find((c) => c.status === 'unavailable');
  const discontinued = contacts.find((c) => c.status === 'discontinued');

  return (
    <li className="slot">
      <h4 className="slot-title">
        <Icon name={info.icon} />
        {info.label}
        {from && <span className="slot-from">（{from}）</span>}
      </h4>
      {from && <p className="slot-lead">警察は都道府県の仕事なので、{from}の窓口を出しています。</p>}
      {shown.length > 0 ? (
        shown.map((c) => <ContactView key={c.id} c={c} owner={owner} wardCode={wardCode} />)
      ) : unavailable && unavailable.source_url && unavailable.verified_at ? (
        <p className="slot-state">
          <span className="badge badge-muted">{STATUS_LABEL.unavailable}</span>
          公式サイトに掲載が見当たりません（{formatDate(unavailable.verified_at)}確認・<a href={unavailable.source_url}>調べたページ</a>）
          {unavailable.note && <span className="slot-note">{unavailable.note}</span>}
        </p>
      ) : discontinued ? (
        <p className="slot-state">
          <span className="badge badge-muted">{STATUS_LABEL.discontinued}</span>
          新しい窓口は公式サイトで確かめてください
        </p>
      ) : (
        <p className="slot-state">窓口情報は確認中です。公式サイトで確かめてください。</p>
      )}
    </li>
  );
}

function ContactView({ c, owner, wardCode }: { c: Contact; owner: string; wardCode?: string }) {
  // 書き方ガイドの「窓口カードへ戻る」から来たとき（?card=<窓口ID>）：この窓口を見せて、URL から card を外す
  useEffect(() => {
    const { path, query } = parseHash(window.location.hash);
    if (query.get('card') !== c.id) return;
    scrollToSection(c.id);
    query.delete('card');
    navigate(`#${path}?${query}`, { replace: true });
  }, [c.id]);

  return (
    <div className="contact" id={c.id}>
      <p className="contact-name">
        {c.department}
        <span className={'badge ' + (c.status === 'verified' ? 'badge-main' : 'badge-warn')}>{STATUS_LABEL[c.status]}</span>
      </p>
      {c.status === 'review' && <p className="contact-warn">情報が変わっている可能性があります。公式ページで確かめてください。</p>}
      {c.status === 'auto_matched' && <p className="contact-warn">{AUTO_MATCHED_NOTE}</p>}
      {/* 請願・陳情の届け先：出典は議会の請願・陳情のページなので、書き方・出し方の案内として先に出す */}
      {c.type === 'petition' && c.source_url && (
        <ul className="contact-actions">
          <li>
            <a className="act" href={c.source_url}>
              <Icon name="petition" />
              <span className="act-text">
                <span className="act-label">公式ページの案内</span>
                <b>{PETITION_GUIDE_LABEL}</b>
              </span>
              <Icon name="external" className="act-ext" />
              <span className="sr-only">（外部サイト）</span>
            </a>
          </li>
          <li>
            <a className="act" href={href('/guide/petition', { s: 'prompts', for: c.id, ward: wardCode })}>
              <Icon name="memo" />
              <span className="act-text">
                <span className="act-label">このサイトの書き方ガイド</span>
                <b>{PETITION_DRAFT_LABEL}</b>
              </span>
            </a>
          </li>
        </ul>
      )}
      {/* 電話・メール・フォームは大きな操作ボタンにする */}
      <ContactActions phone={c.phone} email={c.email} formUrl={c.form_url} formViaPage={c.form_via_page} sourceUrl={c.source_url} />
      {/* 電話の窓口には台本だけ、メール・フォームの窓口には文面だけ。住所しかない窓口は手紙の文面 */}
      <p className="contact-script">
        {c.phone && (
          <a className="btn btn-secondary btn-small" href={href('/guide/phone', { for: c.id })}>
            <Icon name="memo" />
            この窓口向けに台本を作る
          </a>
        )}
        {(c.email || c.form_url || (c.postal_address && !c.phone)) && (
          <a className="btn btn-secondary btn-small" href={href('/guide/email', { for: c.id })}>
            <Icon name="mail" />
            この窓口あての文面を作る
          </a>
        )}
      </p>
      {(c.hours || c.postal_address || c.note) && (
        <dl className="contact-info">
          {c.hours && (
            <div>
              <dt>
                <Icon name="clock" />
                受付時間
              </dt>
              <dd>{c.hours}</dd>
            </div>
          )}
          {c.postal_address && (
            <div>
              <dt>
                <Icon name="memo" />
                住所
              </dt>
              <dd>
                {c.postal_code && `〒${c.postal_code} `}
                {c.postal_address}
              </dd>
            </div>
          )}
          {c.note && (
            <div>
              <dt>
                <Icon name="info" />
                注意
              </dt>
              <dd>{c.note}</dd>
            </div>
          )}
        </dl>
      )}
      <p className="contact-source">
        <Icon name="check" />
        <span>
          出典：
          <a href={c.source_url!}>
            公式ページ
            <Icon name="external" className="icon-inline" />
            <span className="sr-only">（外部サイト）</span>
          </a>
        </span>
        <span>{c.status === 'auto_matched' ? `照合日：${formatDate(c.matched_at!)}` : `最終確認日：${formatDate(c.verified_at!)}`}</span>
        <ReportLink prefill={{ kind: '掲載内容の間違い', detail: `窓口：${owner} ${c.department}（${c.id}）\n` }}>誤りを報告</ReportLink>
      </p>
    </div>
  );
}

/** フォームの開き先：直接開くとエラーになるフォームは、リンクのある公式ページへ案内する */
export function formLink(formUrl: string, formViaPage?: string | null, sourceUrl?: string | null): { url: string; via: string | null } {
  return formViaPage && sourceUrl ? { url: sourceUrl, via: formViaPage } : { url: formUrl, via: null };
}

/** 電話・メール・フォームの大きな操作ボタン（発信は利用者が押したときだけ） */
export function ContactActions({
  phone,
  email,
  formUrl,
  formViaPage,
  sourceUrl,
}: {
  phone: string | null;
  email: string | null;
  formUrl: string | null;
  formViaPage?: string | null;
  sourceUrl?: string | null;
}) {
  if (!phone && !email && !formUrl) return null;
  const form = formUrl ? formLink(formUrl, formViaPage, sourceUrl) : null;
  return (
    <ul className="contact-actions">
      {phone && (
        <li>
          <a className="act" href={telHref(phone)}>
            <Icon name="phone" />
            <span className="act-text">
              <span className="act-label">電話をかける</span>
              <span className="sr-only">：</span>
              <b>{phone}</b>
            </span>
          </a>
        </li>
      )}
      {email && (
        <li>
          <a className="act" href={'mailto:' + email}>
            <Icon name="mail" />
            <span className="act-text">
              <span className="act-label">メールを送る</span>
              <span className="sr-only">：</span>
              <b>{email}</b>
            </span>
          </a>
        </li>
      )}
      {form && (
        <li>
          <a className="act" href={form.url}>
            <Icon name="form" />
            <span className="act-text">
              <span className="act-label">問い合わせフォーム</span>
              <b>{form.via ? `公式ページの「${form.via}」から開く` : '公式の受付ページ'}</b>
            </span>
            <Icon name="external" className="act-ext" />
            <span className="sr-only">（外部サイト）</span>
          </a>
        </li>
      )}
    </ul>
  );
}

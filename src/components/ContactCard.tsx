// 窓口検索の結果：1つの機関・自治体と、その窓口（代表・広聴・議会事務局）
import { useEffect, useState, type ReactNode } from 'react';
import type { Agency, Contact, ContactType, Municipality, Prefecture } from '../types';
import { AGENCY_CATEGORY_LABEL, CONTACT_TYPE_INFO, STATUS_LABEL, TYPES_FOR_AGENCY, TYPES_FOR_DIET, TYPES_FOR_LOCAL } from '../data/labels';
import { loadAgencyContacts, loadPrefContacts } from '../data/loaders';
import { isDisplayable } from '../data/validate';
import { telHref } from '../lib/text';
import { href } from '../router';
import { SITE, formatDate } from '../site';
import { Icon } from './Icon';

export type Entity =
  { kind: 'agency'; agency: Agency } | { kind: 'pref'; pref: Prefecture } | { kind: 'muni'; muni: Municipality; pref: Prefecture };

function entityKey(e: Entity): string {
  return e.kind === 'agency' ? 'a:' + e.agency.id : e.kind === 'pref' ? 'p:' + e.pref.code : 'm:' + e.muni.code;
}

/** 選んだ機関・自治体の窓口データを読む（都道府県ごとのファイルを必要なときだけ読む） */
function useContacts(entity: Entity) {
  const [state, setState] = useState<{ key: string; status: 'loading' | 'ok' | 'error'; contacts: Contact[] }>({
    key: '',
    status: 'loading',
    contacts: [],
  });
  const [attempt, setAttempt] = useState(0);
  const key = entityKey(entity);

  useEffect(() => {
    let alive = true;
    setState({ key, status: 'loading', contacts: [] });
    const job =
      entity.kind === 'agency'
        ? loadAgencyContacts().then((rs) => rs.find((r) => r.agency_id === entity.agency.id)?.contacts || [])
        : loadPrefContacts(entity.pref.code).then((rs) => {
            const code = entity.kind === 'pref' ? entity.pref.lg_code : entity.muni.code;
            return rs.find((r) => r.municipality_code === code)?.contacts || [];
          });
    job.then(
      (contacts) => alive && setState({ key, status: 'ok', contacts }),
      () => alive && setState({ key, status: 'error', contacts: [] }),
    );
    return () => {
      alive = false;
    };
    // entity が同じ機関・自治体を指す間（key が同じ間）は読み直さない
  }, [key, attempt]);

  return { ...(state.key === key ? state : { status: 'loading' as const, contacts: [] }), retry: () => setAttempt((n) => n + 1) };
}

const ENTITY_ICON = { agency: 'landmark', pref: 'map', muni: 'building' } as const;

export function ContactCard({ entity }: { entity: Entity }) {
  const { status, contacts, retry } = useContacts(entity);
  const types: ContactType[] =
    entity.kind === 'agency' ? (entity.agency.category === 'diet' ? TYPES_FOR_DIET : TYPES_FOR_AGENCY) : TYPES_FOR_LOCAL;
  const name = entity.kind === 'agency' ? entity.agency.name : entity.kind === 'pref' ? entity.pref.name : entity.muni.name;

  return (
    <article className="entity" aria-labelledby="entity-h" aria-busy={status === 'loading'}>
      <header className="entity-head">
        <span className="entity-icon" aria-hidden="true">
          <Icon name={ENTITY_ICON[entity.kind]} />
        </span>
        <div className="entity-head-main">
          <h3 id="entity-h" tabIndex={-1}>
            {name}
          </h3>
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
      {status === 'ok' && contacts.length === 0 && <NotResearched entity={entity} types={types} />}
      {status === 'ok' && contacts.length > 0 && (
        <ul className="slots">
          {types.map((t) => (
            <ContactSlot key={t} type={t} contacts={contacts.filter((c) => c.type === t)} />
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

/** まだ1件も調べていない機関・自治体：同じ説明をくり返さず、1か所にまとめて案内する */
function NotResearched({ entity, types }: { entity: Entity; types: ContactType[] }) {
  return (
    <div className="not-researched">
      <p>
        <span className="badge badge-muted">未調査</span>
        連絡先はまだ載せていません。{entity.kind === 'agency' ? '公式サイト' : '公式サイト（上のリンクから探せます）'}
        の「お問い合わせ」で、次の窓口を確かめてください。
      </p>
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

function ContactSlot({ type, contacts }: { type: ContactType; contacts: Contact[] }) {
  const info = CONTACT_TYPE_INFO[type];
  const shown = contacts.filter(isDisplayable);
  const unavailable = contacts.find((c) => c.status === 'unavailable');
  const discontinued = contacts.find((c) => c.status === 'discontinued');
  const unverified = contacts.find((c) => c.status === 'unverified');

  return (
    <li className="slot">
      <h4 className="slot-title">
        <Icon name={info.icon} />
        {info.label}
      </h4>
      {shown.length > 0 ? (
        shown.map((c) => <ContactView key={c.id} c={c} />)
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
      ) : unverified ? (
        <p className="slot-state">
          <span className="badge badge-muted">{STATUS_LABEL.unverified}</span>
          公式の確認待ちのため表示していません
        </p>
      ) : (
        <p className="slot-state">
          <span className="badge badge-muted">未調査</span>
        </p>
      )}
    </li>
  );
}

function ContactView({ c }: { c: Contact }) {
  return (
    <div className="contact">
      <p className="contact-name">
        {c.department}
        <span className={'badge ' + (c.status === 'verified' ? 'badge-main' : 'badge-warn')}>{STATUS_LABEL[c.status]}</span>
      </p>
      {c.status === 'review' && <p className="contact-warn">情報が変わっている可能性があります。公式ページで確かめてください。</p>}
      {/* 電話・メール・フォームは大きな操作ボタンにする */}
      <ContactActions phone={c.phone} email={c.email} formUrl={c.form_url} />
      <p className="contact-script">
        <a className="btn btn-secondary btn-small" href={href('/guide/phone', { for: c.id })}>
          <Icon name="memo" />
          この窓口向けに台本を作る
        </a>
        {(c.email || c.form_url) && (
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
        <span>最終確認日：{formatDate(c.verified_at!)}</span>
      </p>
    </div>
  );
}

/** 電話・メール・フォームの大きな操作ボタン（発信は利用者が押したときだけ） */
export function ContactActions({ phone, email, formUrl }: { phone: string | null; email: string | null; formUrl: string | null }) {
  if (!phone && !email && !formUrl) return null;
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
      {formUrl && (
        <li>
          <a className="act" href={formUrl}>
            <Icon name="form" />
            <span className="act-text">
              <span className="act-label">問い合わせフォーム</span>
              <b>公式の受付ページ</b>
            </span>
            <Icon name="external" className="act-ext" />
            <span className="sr-only">（外部サイト）</span>
          </a>
        </li>
      )}
    </ul>
  );
}

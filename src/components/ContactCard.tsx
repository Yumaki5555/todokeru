// 窓口検索の結果：1つの機関・自治体と、その窓口（代表・広聴・議会事務局）
import { useEffect, useState, type ReactNode } from 'react';
import type { Agency, Contact, ContactType, Municipality, Prefecture } from '../types';
import { AGENCY_CATEGORY_LABEL, CONTACT_TYPE_INFO, STATUS_LABEL, TYPES_FOR_AGENCY, TYPES_FOR_DIET, TYPES_FOR_LOCAL } from '../data/labels';
import { loadAgencyContacts, loadPrefContacts } from '../data/loaders';
import { isDisplayable } from '../data/validate';
import { telHref } from '../lib/text';
import { SITE, formatDate } from '../site';
import { Icon } from './Icon';

export type Entity =
  | { kind: 'agency'; agency: Agency }
  | { kind: 'pref'; pref: Prefecture }
  | { kind: 'muni'; muni: Municipality; pref: Prefecture };

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
      {status === 'ok' && (
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
      {entity.kind === 'muni' && entity.muni.designated && <p className="entity-note">区役所の窓口は、市の公式サイトで確かめてください。</p>}
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
      ) : unavailable ? (
        <p className="slot-state">
          <span className="badge badge-muted">{STATUS_LABEL.unavailable}</span>
          公式サイトで、この窓口の連絡先を確認できませんでした（{formatDate(unavailable.verified_at!)}確認、
          <a href={unavailable.source_url!}>調べたページ</a>）。
        </p>
      ) : discontinued ? (
        <p className="slot-state">
          <span className="badge badge-muted">{STATUS_LABEL.discontinued}</span>
          以前の窓口は変更・廃止されています。新しい窓口は公式サイトで確かめてください。
        </p>
      ) : unverified ? (
        <p className="slot-state">
          <span className="badge badge-muted">{STATUS_LABEL.unverified}</span>
          公式の確認が済んでいないため、連絡先は表示していません。
        </p>
      ) : (
        <p className="slot-state">
          <span className="badge badge-muted">未調査</span>
          まだ調べていません。連絡先は公式サイトで確かめてください。
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
      <ul className="contact-means">
        {c.phone && (
          <li>
            <a href={telHref(c.phone)}>
              <Icon name="phone" />
              <span className="sr-only">電話をかける：</span>
              {c.phone}
            </a>
          </li>
        )}
        {c.email && (
          <li>
            <a href={'mailto:' + c.email}>
              <Icon name="mail" />
              <span className="sr-only">メールアプリで開く：</span>
              {c.email}
            </a>
          </li>
        )}
        {c.form_url && (
          <li>
            <a href={c.form_url}>
              <Icon name="form" />
              公式の問い合わせフォーム
            </a>
          </li>
        )}
      </ul>
      {c.hours && (
        <p className="contact-sub">
          <Icon name="clock" />
          受付時間：{c.hours}
        </p>
      )}
      <details className="fold fold-small">
        <summary>{c.postal_address ? '住所・出典・確認日' : '出典・確認日'}</summary>
        {c.postal_address && (
          <p className="contact-sub">
            {c.postal_code && `〒${c.postal_code} `}
            {c.postal_address}
          </p>
        )}
        {c.note && <p className="contact-sub">{c.note}</p>}
        <p className="contact-sub">
          出典：<a href={c.source_url!}>公式ページ</a>（最終確認日：{formatDate(c.verified_at!)}）
        </p>
      </details>
    </div>
  );
}

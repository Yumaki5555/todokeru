// 電話先・送り先：窓口検索で選んだ窓口（番号はタップで発信）。まだ選んでいなければ窓口検索へ案内する（前に見た地域があればそこへ）
// 電話の台本とメールの文面で同じ窓口を使う（kind で見出しや案内の言葉だけ変える）
import { useEffect, useState } from 'react';
import type { CallTarget, Contact, IconName } from '../types';
import { AUTO_MATCHED_NOTE, CONTACT_TYPE_INFO, STATUS_LABEL } from '../data/labels';
import { findContact } from '../data/loaders';
import { isDisplayable } from '../data/validate';
import type { DraftUpdate } from '../lib/callDraft';
import { loadLastArea } from '../lib/lastArea';
import { href, navigate } from '../router';
import { formatDate } from '../site';
import { ContactActions } from './ContactCard';
import { Icon } from './Icon';

export function toCallTarget(org: string, c: Contact): CallTarget {
  return {
    contactId: c.id,
    org,
    department: c.department,
    typeLabel: CONTACT_TYPE_INFO[c.type].label,
    phone: c.phone,
    email: c.email,
    formUrl: c.form_url,
    postalCode: c.postal_code,
    postalAddress: c.postal_address,
    hours: c.hours,
    sourceUrl: c.source_url!,
    verifiedAt: c.verified_at,
    matchedAt: c.matched_at ?? null,
    status: c.status === 'review' || c.status === 'auto_matched' ? c.status : 'verified',
  };
}

export type TargetState = 'idle' | 'loading' | 'error';

/**
 * 窓口検索の「この窓口向けに台本を作る」「この窓口あての文面を作る」から来たとき（?for=<窓口ID>）：
 * 選んだ窓口を電話先・送り先に入れ（入力中の台本や文面はそのまま）、URL から for を外す
 */
export function useTargetFromLink(forId: string | null, path: string, update: DraftUpdate): TargetState {
  const [state, setState] = useState<TargetState>('idle');
  useEffect(() => {
    if (!forId) return;
    let alive = true;
    setState('loading');
    findContact(forId).then(
      (r) => {
        if (!alive) return;
        if (r && isDisplayable(r.contact)) {
          update({ target: toCallTarget(r.org, r.contact) });
          setState('idle');
        } else {
          setState('error');
        }
        navigate(href(path), { replace: true });
      },
      () => alive && setState('error'),
    );
    return () => {
      alive = false;
    };
  }, [forId, path, update]);
  return state;
}

const WORDS: Record<'phone' | 'mail', { title: string; icon: IconName; find: string; change: string; hint: string }> = {
  phone: { title: '電話先', icon: 'phone', find: '電話先を探す', change: '電話先を変える', hint: '番号は、公式サイトで確かめてからかけてください。' },
  mail: {
    title: '送り先',
    icon: 'mail',
    find: '送り先を探す',
    change: '送り先を変える',
    hint: '文面を先に書いてから、送り先を選んでも大丈夫です。',
  },
};

/** 選んだ窓口の機関・自治体を、窓口検索でもう一度開くリンク先 */
function contactsHref(contactId: string): string {
  const m = /^(\d{6})-/.exec(contactId);
  return m ? href('/contacts', { tab: 'area', code: m[1] }) : href('/contacts', { tab: 'agency', id: contactId.replace(/-[a-z]+$/, '') });
}

export function CallTargetBox({ target, state, kind = 'phone' }: { target: CallTarget | null; state: TargetState; kind?: 'phone' | 'mail' }) {
  // 窓口検索で前に見た地域があれば、そこから探せるようにする
  const [lastArea] = useState(loadLastArea);
  const w = WORDS[kind];
  return (
    <section className="call-target" id="call-target" aria-labelledby="call-target-h" aria-busy={state === 'loading'}>
      <h2 id="call-target-h" className="call-target-title">
        <Icon name={w.icon} />
        {w.title}
      </h2>
      {state === 'loading' && <p className="muted">選んだ窓口を読み込んでいます…</p>}
      {state === 'error' && (
        <p className="note" role="alert">
          <Icon name="info" />
          <span>選んだ窓口を読み込めませんでした。窓口検索から選び直してください。</span>
        </p>
      )}
      {target ? (
        <div className="call-target-body">
          <p className="call-target-name">
            <b>{target.org}</b>
            <span>{target.department}</span>
            <span className={'badge ' + (target.status === 'verified' ? 'badge-main' : 'badge-warn')}>{STATUS_LABEL[target.status]}</span>
          </p>
          {target.status === 'review' && <p className="contact-warn">情報が変わっている可能性があります。公式ページで確かめてください。</p>}
          {target.status === 'auto_matched' && <p className="contact-warn">{AUTO_MATCHED_NOTE}</p>}
          {kind === 'mail' ? (
            <MailWays target={target} />
          ) : (
            <>
              <ContactActions phone={target.phone} email={target.email} formUrl={target.formUrl} />
              {target.hours && (
                <p className="call-target-hours">
                  <Icon name="clock" />
                  受付時間：{target.hours}
                </p>
              )}
            </>
          )}
          <p className="contact-source">
            <Icon name="check" />
            <span>
              出典：
              <a href={target.sourceUrl}>
                公式ページ
                <Icon name="external" className="icon-inline" />
                <span className="sr-only">（外部サイト）</span>
              </a>
            </span>
            <span>{target.status === 'auto_matched' ? `照合日：${formatDate(target.matchedAt!)}` : `最終確認日：${formatDate(target.verifiedAt!)}`}</span>
          </p>
          <p className="call-target-change">
            <a href={contactsHref(target.contactId)}>{w.change}</a>
          </p>
        </div>
      ) : (
        state !== 'loading' && (
          <div className="call-target-body">
            {lastArea ? (
              <>
                <a className="btn btn-secondary" href={href('/contacts', { tab: 'area', code: lastArea.code })}>
                  <Icon name="search" />
                  {lastArea.name}の窓口から探す
                </a>
                <p className="call-target-change">
                  <a href={href('/contacts')}>ほかの地域や国の機関から探す</a>
                </p>
              </>
            ) : (
              <a className="btn btn-secondary" href={href('/contacts')}>
                <Icon name="search" />
                {w.find}
              </a>
            )}
            <p className="field-hint">{w.hint}</p>
          </div>
        )
      )}
    </section>
  );
}

/** 送り先のメールアドレス・フォーム・住所（送るボタンや印刷は「できた文面」の下に出す） */
function MailWays({ target }: { target: CallTarget }) {
  if (!target.email && !target.formUrl && !target.postalAddress) {
    return (
      <p className="contact-warn">
        この窓口には、メールアドレスも問い合わせフォームも住所も載っていません。送り先を変えるか、電話で届けてください。
      </p>
    );
  }
  return (
    <dl className="contact-info mail-ways">
      <div>
        <dt>
          <Icon name="mail" />
          メール
        </dt>
        <dd>{target.email ?? 'この窓口には載っていません'}</dd>
      </div>
      <div>
        <dt>
          <Icon name="form" />
          フォーム
        </dt>
        <dd>
          {target.formUrl ? (
            <a href={target.formUrl} target="_blank" rel="noopener noreferrer">
              公式の問い合わせフォーム
              <Icon name="external" className="icon-inline" />
              <span className="sr-only">（外部サイト・新しいタブで開きます）</span>
            </a>
          ) : (
            'この窓口には載っていません'
          )}
        </dd>
      </div>
      <div>
        <dt>
          <Icon name="letter" />
          住所
        </dt>
        <dd>
          {target.postalAddress
            ? `${target.postalCode ? `〒${target.postalCode} ` : ''}${target.postalAddress}`
            : 'この窓口には載っていません'}
        </dd>
      </div>
    </dl>
  );
}

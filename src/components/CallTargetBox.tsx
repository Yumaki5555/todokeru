// 電話先：窓口検索で選んだ窓口（番号はタップで発信）。まだ選んでいなければ窓口検索へ案内する
import type { CallTarget, Contact } from '../types';
import { CONTACT_TYPE_INFO, STATUS_LABEL } from '../data/labels';
import { href } from '../router';
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
    hours: c.hours,
    sourceUrl: c.source_url!,
    verifiedAt: c.verified_at!,
    status: c.status === 'review' ? 'review' : 'verified',
  };
}

/** 選んだ窓口の機関・自治体を、窓口検索でもう一度開くリンク先 */
function contactsHref(contactId: string): string {
  const m = /^(\d{6})-/.exec(contactId);
  return m ? href('/contacts', { tab: 'area', code: m[1] }) : href('/contacts', { tab: 'agency', id: contactId.replace(/-[a-z]+$/, '') });
}

export function CallTargetBox({ target, state }: { target: CallTarget | null; state: 'idle' | 'loading' | 'error' }) {
  return (
    <section className="call-target" id="call-target" aria-labelledby="call-target-h" aria-busy={state === 'loading'}>
      <h2 id="call-target-h" className="call-target-title">
        <Icon name="phone" />
        電話先
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
          <ContactActions phone={target.phone} email={target.email} formUrl={target.formUrl} />
          {target.hours && (
            <p className="call-target-hours">
              <Icon name="clock" />
              受付時間：{target.hours}
            </p>
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
            <span>最終確認日：{formatDate(target.verifiedAt)}</span>
          </p>
          <p className="call-target-change">
            <a href={contactsHref(target.contactId)}>電話先を変える</a>
          </p>
        </div>
      ) : (
        state !== 'loading' && (
          <div className="call-target-body">
            <a className="btn btn-secondary" href={href('/contacts')}>
              <Icon name="search" />
              電話先を探す
            </a>
            <p className="field-hint">番号は、公式サイトで確かめてからかけてください。</p>
          </div>
        )
      )}
    </section>
  );
}

// メール・フォーム・郵送のガイド「メール・フォーム・郵送で届ける」
// 上から順に：文面を作る → 送り先 → 送る前に確かめる → 送ったあとの記録 → ほかの届け方（電話のページと同じ並び）
//   #/guide/email?for=130001-feedback  窓口検索で選んだ窓口を送り先にする
// 目的・内容・送り先は電話の台本と共通（電話の台本を作ったあとに「文章で届けたい」と思っても、書き直さずに済む）
import { useEffect } from 'react';
import { EMPTY_DRAFT } from '../content/callScript';
import { GUIDES, guidePath } from '../content/guides';
import { MAIL_CHECKLIST, MAIL_GUIDE } from '../content/mailGuide';
import { EMPTY_MAIL, METHODS, buildMail, methodUsable, subjectText } from '../content/mailText';
import { useCallDraft } from '../lib/callDraft';
import { useMailDraft } from '../lib/mailDraft';
import { href, type Route } from '../router';
import { CallTargetBox, useTargetFromLink } from '../components/CallTargetBox';
import { Checklist } from '../components/Checklist';
import { Icon } from '../components/Icon';
import { PageEndNav } from '../components/Links';
import { MailMaker } from '../components/MailMaker';
import { MailMemo } from '../components/MailMemo';
import { PageHead } from '../components/PageHead';

const PATH = '/guide/email';

export function MailGuidePage({ route }: { route: Route }) {
  const [draft, update] = useCallDraft();
  const [mail, updateMail] = useMailDraft();
  // 窓口検索の「この窓口あての文面を作る」から来たとき：選んだ窓口を送り先に入れる（入力中の文面はそのまま）
  const targetState = useTargetFromLink(route.query.get('for'), PATH, update);
  const t = draft.target;

  // 送り先が変わったら、その窓口で使える届け方にする（メールアドレスがなくフォームだけ、住所だけ、など）
  useEffect(() => {
    if (!t) return;
    updateMail((m) => {
      if (methodUsable(t, m.method)) return {};
      const next = METHODS.find((x) => methodUsable(t, x.id));
      return next ? { method: next.id } : {};
    });
    // 窓口を選び直したときだけ見直す（同じ窓口のまま利用者が選んだ届け方は変えない）
  }, [t?.contactId]);

  const clear = () => {
    if (!window.confirm('入力した内容と文面・記録を消しますか？（電話の台本も同じ内容を使っているので、あわせて消えます）')) return;
    update((d) => ({ ...EMPTY_DRAFT, deepDive: undefined, purpose: d.purpose, target: d.target }));
    updateMail((m) => ({ ...EMPTY_MAIL, method: m.method }));
  };

  return (
    <div className="wrap page mail-guide">
      <PageHead title={MAIL_GUIDE.title} sub={MAIL_GUIDE.subtitle} />

      <MailMaker draft={draft} update={update} mail={mail} updateMail={updateMail} onClear={clear} />
      <CallTargetBox kind="mail" target={t} state={targetState} />
      {/* 送る直前に見るので、送り先のすぐ下に置く（必要なときだけ開く） */}
      <details className="fold fold-section pre-call" id="checklist">
        <summary>
          <Icon name="check" />
          送る前に確かめる
          <span className="field-opt">{MAIL_CHECKLIST.length}項目</span>
        </summary>
        <div className="pre-call-body">
          <p className="muted">チェックはこの画面の中だけで、保存や送信はされません。</p>
          <Checklist title="送る前に" items={MAIL_CHECKLIST} />
        </div>
      </details>
      <MailMemo draft={draft} mail={mail} updateMail={updateMail} subject={subjectText(buildMail(draft, mail).subject)} />

      <section className="section" id="next" aria-labelledby="next-h" tabIndex={-1}>
        <h2 id="next-h" className="section-title">
          ほかの届け方
        </h2>
        <ul className="guide-chips">
          {GUIDES.filter((g) => g.slug !== 'email').map((g) => (
            <li key={g.slug}>
              <a href={href(guidePath(g.slug))}>
                <Icon name={g.icon} />
                {g.title}
              </a>
              {g.status === 'coming' && <span className="badge badge-muted">準備中</span>}
            </li>
          ))}
        </ul>
      </section>
      <PageEndNav />
    </div>
  );
}

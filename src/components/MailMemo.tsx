// 送ったあとの記録（日時・送り先・件名・受付番号・返事）。必要なときだけ開き、まとめてコピーできる
import type { CallDraft, MailDraft } from '../types';
import { formatDateTime } from '../content/callScript';
import { mailMemoAsText } from '../content/mailText';
import type { MailDraftUpdate } from '../lib/mailDraft';
import { CopyButton } from './CopyButton';
import { Icon } from './Icon';

export function MailMemo({ draft, mail, updateMail, subject }: { draft: CallDraft; mail: MailDraft; updateMail: MailDraftUpdate; subject: string }) {
  const m = mail.memo;
  const set = (patch: Partial<MailDraft['memo']>) => updateMail((d) => ({ memo: { ...d.memo, ...patch } }));

  return (
    <details
      className="fold fold-section call-memo"
      id="memo"
      onToggle={(e) => {
        // 開いたときに、日時・送り先・件名を入れておく（空のときだけ）
        if (!e.currentTarget.open) return;
        updateMail((d) => ({
          memo: {
            ...d.memo,
            when: d.memo.when || formatDateTime(new Date()),
            to: d.memo.to || (draft.target ? `${draft.target.org} ${draft.target.department}` : ''),
            subject: d.memo.subject || subject,
          },
        }));
      }}
    >
      <summary>
        <Icon name="memo" />
        送ったあとに記録を残す
      </summary>
      <div className="call-memo-body">
        <div className="field">
          <label htmlFor="mail-memo-when">送った日時</label>
          <input id="mail-memo-when" type="text" value={m.when} onChange={(e) => set({ when: e.target.value })} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="mail-memo-to">送り先</label>
          <input
            id="mail-memo-to"
            type="text"
            value={m.to}
            onChange={(e) => set({ to: e.target.value })}
            placeholder="例：○○市 広聴課"
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor="mail-memo-subject">件名</label>
          <input id="mail-memo-subject" type="text" value={m.subject} onChange={(e) => set({ subject: e.target.value })} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="mail-memo-receipt">
            受付番号<span className="field-opt">フォームで出たとき</span>
          </label>
          <input id="mail-memo-receipt" type="text" value={m.receipt} onChange={(e) => set({ receipt: e.target.value })} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="mail-memo-answer">返事の内容</label>
          <textarea
            id="mail-memo-answer"
            rows={4}
            value={m.answer}
            onChange={(e) => set({ answer: e.target.value })}
            placeholder="例：11月10日に返信あり。担当課で検討するとのこと。"
          />
        </div>
        <CopyButton text={mailMemoAsText(draft, mail)} label="記録をまとめてコピー" hint="メモ帳などに残すとき" />
      </div>
    </details>
  );
}

// 電話のあとのメモ（日時・電話先・対応した人・回答）。必要なときだけ開き、まとめてコピーできる
import type { CallDraft } from '../types';
import { formatDateTime, memoAsText } from '../content/callScript';
import type { DraftUpdate } from '../lib/callDraft';
import { CopyButton } from './CopyButton';
import { Icon } from './Icon';

export function CallMemo({ draft, update }: { draft: CallDraft; update: DraftUpdate }) {
  const m = draft.memo;
  const set = (patch: Partial<CallDraft['memo']>) => update((d) => ({ memo: { ...d.memo, ...patch } }));

  return (
    <details
      className="fold fold-section call-memo"
      id="memo"
      onToggle={(e) => {
        // 開いたときに、日時と電話先を入れておく（空のときだけ）
        if (!e.currentTarget.open) return;
        update((d) => ({
          memo: {
            ...d.memo,
            when: d.memo.when || formatDateTime(new Date()),
            who: d.memo.who || (d.target ? `${d.target.org} ${d.target.department}` : ''),
          },
        }));
      }}
    >
      <summary>
        <Icon name="memo" />
        電話のあとにメモを残す
      </summary>
      <div className="call-memo-body">
        <div className="field">
          <label htmlFor="memo-when">日時</label>
          <input id="memo-when" type="text" value={m.when} onChange={(e) => set({ when: e.target.value })} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="memo-who">電話先・部署</label>
          <input
            id="memo-who"
            type="text"
            value={m.who}
            onChange={(e) => set({ who: e.target.value })}
            placeholder="例：○○市 広聴課"
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor="memo-person">
            対応した人<span className="field-opt">聞けたら</span>
          </label>
          <input
            id="memo-person"
            type="text"
            value={m.person}
            onChange={(e) => set({ person: e.target.value })}
            placeholder="例：広聴課の田中さん"
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor="memo-answer">回答の内容</label>
          <textarea
            id="memo-answer"
            rows={4}
            value={m.answer}
            onChange={(e) => set({ answer: e.target.value })}
            placeholder="例：担当課に伝えると言われた。回答はなし。"
          />
        </div>
        <CopyButton text={memoAsText(draft)} label="メモをまとめてコピー" hint="メモ帳などに残すとき" />
      </div>
    </details>
  );
}

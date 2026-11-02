/** 台本の既存ステップ②内だけに出す、任意の詳細整理パネル */
import { useState } from 'react';
import type { CallDraft, DeepDiveDraft } from '../types';
import type { DraftUpdate } from '../lib/callDraft';
import { CHECK_POINTS, EMPTY_DEEP_DIVE, applyDetailed, detailedMain, hasDeepDive } from '../content/deepDive';

export function DeepDivePanel({ draft, update }: { draft: CallDraft; update: DraftUpdate }) {
  const d = { ...EMPTY_DEEP_DIVE, ...draft.deepDive };
  const [applied, setApplied] = useState(false);
  const change = (patch: (dd: DeepDiveDraft) => Partial<DeepDiveDraft>) => {
    update((previous) => {
      const dd = { ...EMPTY_DEEP_DIVE, ...previous.deepDive };
      return { deepDive: { ...dd, ...patch(dd) } };
    });
    setApplied(false);
  };
  const togglePoint = (id: string, checked: boolean) =>
    change((dd) => ({ points: checked ? [...dd.points, id] : dd.points.filter((x) => x !== id) }));

  const main = detailedMain(draft);
  const currentMain = draft.edits[draft.purpose]?.main;
  const canApply = !!draft.topic.trim() && hasDeepDive(draft);

  const apply = () => {
    if (!canApply) return;
    // 手で直した本題だけ確認する（前に反映した文のままなら、そのまま置き換える）
    if (currentMain !== undefined && currentMain !== main && currentMain !== d.applied) {
      if (!window.confirm('「本題」に手動編集した文章があります。詳しい台本で置き換えますか？')) return;
    }
    update(applyDetailed);
    setApplied(true);
  };

  return (
    <details className="fold deep-dive">
      <summary>
        もっと詳しく整理する
        <span className="field-opt">必要な方だけ開く</span>
      </summary>
      <div className="deep-dive-body">
        <p className="deep-dive-help">事実と疑問を分けて整理します。分からない項目は空欄で大丈夫です。</p>
        <div className="field">
          <label htmlFor="deep-facts">確認できたこと（事実）</label>
          <textarea id="deep-facts" rows={2} value={d.facts}
            placeholder="例：〇月〇日、夜間に大きな話し声が聞こえた"
            onChange={(e) => change(() => ({ facts: e.target.value }))} />
        </div>
        <div className="field">
          <label htmlFor="deep-question">疑問・気になっていること</label>
          <textarea id="deep-question" rows={2} value={d.question}
            placeholder="例：行政は苦情を受けたとき、どう対応するのか"
            onChange={(e) => change(() => ({ question: e.target.value }))} />
        </div>
        <fieldset className="deep-dive-points">
          <legend>詳しく確認したい項目（複数選択可）</legend>
          <div className="deep-dive-checks">
            {CHECK_POINTS.map((p) => (
              <label key={p.id}>
                <input type="checkbox" checked={d.points.includes(p.id)}
                  onChange={(e) => togglePoint(p.id, e.target.checked)} />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="field">
          <label htmlFor="deep-desired">どうしてほしい？（任意）</label>
          <textarea id="deep-desired" rows={2} value={d.desired}
            placeholder="例：対処方法と担当窓口を案内してほしい"
            onChange={(e) => change(() => ({ desired: e.target.value }))} />
        </div>
        <div className="field">
          <label htmlFor="deep-source">参考資料・確認先（任意）</label>
          <input id="deep-source" type="text" value={d.source}
            placeholder="例：市の公式ページ、条例の名称"
            autoComplete="off"
            onChange={(e) => change(() => ({ source: e.target.value }))} />
        </div>
        <button type="button" className="btn btn-secondary deep-dive-apply" onClick={apply} disabled={!canApply}>
          ③の台本に反映
        </button>
        {!draft.topic.trim() && <p className="deep-dive-help">上の「何について？」を入れると押せます。</p>}
        {applied && currentMain === main && (
          <p className="deep-dive-done" role="status">③の「本題」に反映しました。文章は直接修正できます。</p>
        )}
        <p className="deep-dive-help">反映はボタンを押したときだけ行います。変更後はもう一度押してください。手動編集済みの本題がある場合は確認します。</p>
      </div>
    </details>
  );
}

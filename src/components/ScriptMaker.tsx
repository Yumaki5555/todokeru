// 台本を作る：1 目的を選ぶ → 2 内容を入れる → 3 できた台本（タップして直せる）
import { Fragment, useEffect, useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react';
import type { CallDraft, ScriptPartKey } from '../types';
import { PURPOSES, STANCES, buildScript, helpLines, scriptAsText, wantsRecord } from '../content/callScript';
import { applyDetailed, mainState } from '../content/deepDive';
import type { DraftUpdate } from '../lib/callDraft';
import { DeepDivePanel } from './DeepDivePanel';
import { CopyButton } from './CopyButton';
import { Icon } from './Icon';

export function ScriptMaker({
  draft,
  update,
  onRead,
  onClear,
}: {
  draft: CallDraft;
  update: DraftUpdate;
  onRead: () => void;
  onClear: () => void;
}) {
  const purpose = PURPOSES.find((p) => p.id === draft.purpose)!;
  const record = wantsRecord(draft);
  const parts = buildScript(draft, true);
  const t = draft.target;
  const state = mainState(draft);

  const setEdit = (key: ScriptPartKey, text: string | undefined) =>
    update((d) => {
      const cur = { ...d.edits[d.purpose] };
      if (text === undefined) delete cur[key];
      else cur[key] = text;
      return { edits: { ...d.edits, [d.purpose]: cur } };
    });

  return (
    <section className="maker" id="maker" aria-labelledby="maker-h">
      <h2 id="maker-h" className="maker-title">
        <Icon name="memo" />
        台本を作る
      </h2>
      {t && (
        <p className="maker-for">
          <Icon name="phone" />
          <span>
            電話先：<b>{t.org}</b> {t.department}
          </span>
        </p>
      )}

      <div className="maker-grid">
        <div className="maker-inputs">
          <fieldset className="maker-step">
            <legend className="maker-step-title">
              <span className="step-badge" data-n="1" aria-hidden="true" />
              目的を選ぶ
            </legend>
            <div className="purpose-tiles">
              {PURPOSES.map((p) => (
                <label key={p.id} className="purpose-tile">
                  <input
                    type="radio"
                    name="call-purpose"
                    value={p.id}
                    aria-label={p.label}
                    checked={draft.purpose === p.id}
                    onChange={() => update({ purpose: p.id })}
                  />
                  <span className="tile-body">
                    <Icon name={p.icon} />
                    <span>
                      {p.parts.map((x, i) => (
                        <Fragment key={x}>
                          {i > 0 && <wbr />}
                          {x}
                        </Fragment>
                      ))}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="maker-step" role="group" aria-labelledby="maker-step2">
            <p className="maker-step-title" id="maker-step2">
              <span className="step-badge" data-n="2" aria-hidden="true" />
              内容を入れる
            </p>
            <div className="field">
              <label htmlFor="call-topic">何について？</label>
              <input
                id="call-topic"
                type="text"
                value={draft.topic}
                onChange={(e) => update({ topic: e.target.value })}
                placeholder={purpose.topicHint}
                autoComplete="off"
                enterKeyHint="done"
              />
            </div>
            {draft.purpose === 'opinion' && (
              <fieldset className="field">
                <legend>意見は？</legend>
                <div className="stance-chips">
                  {STANCES.map((s) => (
                    <label key={s.id} className="stance-chip">
                      <input
                        type="radio"
                        name="call-stance"
                        value={s.id}
                        checked={draft.stance === s.id}
                        onChange={() => update({ stance: s.id })}
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {purpose.detail && (
              <div className="field">
                <label htmlFor="call-detail">
                  {purpose.detail.label}
                  <span className="field-opt">なくても大丈夫</span>
                </label>
                <input
                  id="call-detail"
                  type="text"
                  value={draft[purpose.detail.key]}
                  onChange={(e) => update(purpose.detail?.key === 'ask' ? { ask: e.target.value } : { detail: e.target.value })}
                  placeholder={purpose.detail.hint}
                  autoComplete="off"
                  enterKeyHint="done"
                />
              </div>
            )}
            {/* ③の本題が自動で変わらなくなっているときは、ここで知らせる（①②を変えても本題は前のまま） */}
            {state === 'stale' && (
              <p className="maker-notice">
                <Icon name="info" />
                <span>
                  ③の本題は、前に「詳しく整理」で反映した文のままです。
                  <button type="button" className="link-btn" onClick={() => update(applyDetailed)}>
                    ③に反映し直す
                  </button>
                </span>
              </p>
            )}
            {state === 'manual' && (
              <p className="maker-notice">
                <Icon name="info" />
                <span>
                  ③の本題は手で直した文なので、ここを変えても変わりません。
                  <button type="button" className="link-btn" onClick={() => setEdit('main', undefined)}>
                    自動の文に戻す
                  </button>
                </span>
              </p>
            )}
            <DeepDivePanel draft={draft} update={update} />
          </div>
          <p className="privacy-line">
            <Icon name="info" />
            <span>
              入力した内容は送信しません。このタブを閉じるまで、この端末にだけ一時保存します。
              <button type="button" className="link-btn" onClick={onClear}>
                入力を消す
              </button>
            </span>
          </p>
        </div>

        <div className="maker-step maker-output" role="group" aria-labelledby="maker-step3">
          <p className="maker-step-title" id="maker-step3">
            <span className="step-badge" data-n="3" aria-hidden="true" />
            できた台本
            <span className="maker-step-note">文はタップして直せます</span>
          </p>
          <ol className="script-parts">
            {parts.map((p) => {
              const off = p.key === 'record' && !record;
              const labelId = `part-${p.key}`;
              return (
                <li key={p.key} className={'part' + (off ? ' part-off' : '')}>
                  <div className="part-head">
                    {p.key === 'record' ? (
                      <label className="part-toggle">
                        <input
                          type="checkbox"
                          checked={record}
                          onChange={(e) => update((d) => ({ record: { ...d.record, [d.purpose]: e.target.checked } }))}
                        />
                        <span id={labelId}>{p.label}</span>
                      </label>
                    ) : (
                      <span className="part-label" id={labelId}>
                        {p.label}
                      </span>
                    )}
                    {p.edited && !off && (
                      <button type="button" className="link-btn" onClick={() => setEdit(p.key, undefined)}>
                        自動の文に戻す
                      </button>
                    )}
                  </div>
                  {!off && <AutoTextarea aria-labelledby={labelId} value={p.text} onChange={(e) => setEdit(p.key, e.target.value)} />}
                </li>
              );
            })}
          </ol>
          <details className="fold help-fold">
            <summary>
              困ったときの一言
              <span className="field-opt">代表電話・名前を聞かれたとき など</span>
            </summary>
            <dl className="help-lines">
              {helpLines(draft).map((h) => (
                <div key={h.key}>
                  <dt>{h.label}</dt>
                  <dd>{h.text}</dd>
                </div>
              ))}
            </dl>
          </details>
          <div className="maker-actions">
            <button type="button" className="btn btn-primary btn-big" onClick={onRead}>
              <Icon name="book" />
              大きな文字で読む
            </button>
            <CopyButton text={scriptAsText(buildScript(draft))} label="台本をまとめてコピー" hint="メールやフォームに使うとき" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** 文の長さに合わせて高さが変わる入力欄 */
function AutoTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 2 + 'px';
  };
  useLayoutEffect(fit, [props.value]);
  useEffect(() => {
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return <textarea ref={ref} rows={1} className="part-text" {...props} />;
}

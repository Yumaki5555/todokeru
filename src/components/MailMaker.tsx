// 文面を作る：1 目的を選ぶ → 2 内容を入れる → 3 届け方を選ぶ → 4 できた文面（タップして直せる）
// 1・2 は電話の台本と同じ入力を使う（どちらのページで入れても引き継がれる）。書き直した文は電話の台本とは別に覚える
import { Fragment, useState } from 'react';
import type { CallDraft, MailDraft, MailPartKey } from '../types';
import { PURPOSES, STANCES, wantsRecord } from '../content/callScript';
import { METHOD_NOTES } from '../content/mailGuide';
import { METHODS, REPLIES, bodyText, buildMail, countChars, mailHelpLines, mailtoHref, subjectText } from '../content/mailText';
import type { DraftUpdate } from '../lib/callDraft';
import { loadLastArea } from '../lib/lastArea';
import type { MailDraftUpdate } from '../lib/mailDraft';
import { href } from '../router';
import { CopyButton } from './CopyButton';
import { DeepDivePanel } from './DeepDivePanel';
import { Icon } from './Icon';
import { AutoTextarea } from './ScriptMaker';

export function MailMaker({
  draft,
  update,
  mail,
  updateMail,
  onClear,
}: {
  draft: CallDraft;
  update: DraftUpdate;
  mail: MailDraft;
  updateMail: MailDraftUpdate;
  onClear: () => void;
}) {
  const purpose = PURPOSES.find((p) => p.id === draft.purpose)!;
  const { subject, body } = buildMail(draft, mail);
  const subjectLine = subjectText(subject);
  const bodyAll = bodyText(body);
  const t = draft.target;
  const [lastArea] = useState(loadLastArea);
  const findHref = lastArea ? href('/contacts', { tab: 'area', code: lastArea.code }) : href('/contacts');
  const methodLabel = mail.method === 'mail' ? 'メールアドレス' : '問い合わせフォーム';
  const methodMissing = !!t && (mail.method === 'mail' ? !t.email : !t.formUrl);

  const setEdit = (key: MailPartKey, text: string | undefined) =>
    updateMail((m) => {
      const cur = { ...m.edits[draft.purpose] };
      if (text === undefined) delete cur[key];
      else cur[key] = text;
      return { edits: { ...m.edits, [draft.purpose]: cur } };
    });

  return (
    <section className="maker mail-maker" id="maker" aria-labelledby="maker-h">
      <h2 id="maker-h" className="maker-title">
        <Icon name="memo" />
        文面を作る
      </h2>
      {t ? (
        <p className="maker-for">
          <Icon name="mail" />
          <span>
            送り先：<b>{t.org}</b> {t.department}
          </span>
        </p>
      ) : (
        // 「まず書く」「先に送り先を探す」のどちらからでも進める
        <p className="maker-start">
          送り先が決まっていなくても、先に書けます。
          <a href={findHref}>先に送り先を探す</a>
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
                    name="mail-purpose"
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
              <label htmlFor="mail-topic">何について？</label>
              <input
                id="mail-topic"
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
                        name="mail-stance"
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
                <label htmlFor="mail-detail">
                  {purpose.detail.label}
                  <span className="field-opt">なくても大丈夫</span>
                </label>
                <input
                  id="mail-detail"
                  type="text"
                  value={draft[purpose.detail.key]}
                  onChange={(e) => update(purpose.detail?.key === 'ask' ? { ask: e.target.value } : { detail: e.target.value })}
                  placeholder={purpose.detail.hint}
                  autoComplete="off"
                  enterKeyHint="done"
                />
              </div>
            )}
            {mail.edits[draft.purpose]?.main !== undefined && (
              <p className="maker-notice">
                <Icon name="info" />
                <span>
                  ④の本題は手で直した文なので、ここを変えても変わりません。
                  <button type="button" className="link-btn" onClick={() => setEdit('main', undefined)}>
                    自動の文に戻す
                  </button>
                </span>
              </p>
            )}
            <DeepDivePanel draft={draft} update={update} auto />
            <div className="field">
              <label htmlFor="mail-name">
                名前
                <span className="field-opt">なくても大丈夫</span>
              </label>
              <input
                id="mail-name"
                type="text"
                value={mail.name}
                onChange={(e) => updateMail({ name: e.target.value })}
                placeholder="例：山田花子"
                autoComplete="off"
                enterKeyHint="done"
              />
            </div>
            <div className="field">
              <label htmlFor="mail-area">
                住んでいる市区町村
                <span className="field-opt">なくても大丈夫</span>
              </label>
              <input
                id="mail-area"
                type="text"
                value={mail.area}
                onChange={(e) => updateMail({ area: e.target.value })}
                placeholder="例：江東区"
                autoComplete="off"
                enterKeyHint="done"
              />
            </div>
            <div className="field">
              <label className="part-toggle">
                <input
                  type="checkbox"
                  checked={wantsRecord(draft)}
                  onChange={(e) => update((d) => ({ record: { ...d.record, [d.purpose]: e.target.checked } }))}
                />
                <span>記録をお願いする</span>
              </label>
            </div>
            <fieldset className="field">
              <legend>返信は？</legend>
              <div className="stance-chips">
                {REPLIES.map((r) => (
                  <label key={r.id} className="stance-chip">
                    <input
                      type="radio"
                      name="mail-reply"
                      value={r.id}
                      checked={mail.reply === r.id}
                      onChange={() => updateMail({ reply: r.id })}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <fieldset className="maker-step">
            <legend className="maker-step-title">
              <span className="step-badge" data-n="3" aria-hidden="true" />
              届け方を選ぶ
            </legend>
            <div className="stance-chips">
              {METHODS.map((m) => (
                <label key={m.id} className="stance-chip">
                  <input
                    type="radio"
                    name="mail-method"
                    value={m.id}
                    checked={mail.method === m.id}
                    onChange={() => updateMail({ method: m.id })}
                  />
                  <span>
                    <Icon name={m.icon} />
                    {m.label}
                  </span>
                </label>
              ))}
            </div>
            {methodMissing && (
              <p className="maker-notice">
                <Icon name="info" />
                <span>この送り先には、{methodLabel}が載っていません。文面はコピーして使えます。</span>
              </p>
            )}
            <p className="field-hint">郵送（手紙）は準備中です。</p>
          </fieldset>

          <p className="privacy-line">
            <Icon name="info" />
            <span>
              入力した内容は送信しません。このタブを閉じるまで、この端末にだけ一時保存します。目的と内容は電話の台本と共通です。
              <button type="button" className="link-btn" onClick={onClear}>
                入力を消す
              </button>
            </span>
          </p>
        </div>

        <div className="maker-step maker-output" role="group" aria-labelledby="maker-step4">
          <p className="maker-step-title" id="maker-step4">
            <span className="step-badge" data-n="4" aria-hidden="true" />
            できた文面
            <span className="maker-step-note">文はタップして直せます</span>
          </p>
          <div className="mail-label-row">
            <label className="mail-label" htmlFor="mail-subject">
              件名
            </label>
            {subject.edited && (
              <button type="button" className="link-btn" onClick={() => setEdit('subject', undefined)}>
                自動の文に戻す
              </button>
            )}
          </div>
          <input id="mail-subject" type="text" className="part-text" value={subject.text} onChange={(e) => setEdit('subject', e.target.value)} />
          <p className="mail-label" id="mail-body-h">
            本文
          </p>
          <ol className="script-parts" aria-labelledby="mail-body-h">
            {body.map((p) => {
              const labelId = `mail-part-${p.key}`;
              return (
                <li key={p.key} className="part">
                  <div className="part-head">
                    <span className="part-label" id={labelId}>
                      {p.label}
                    </span>
                    {p.edited && (
                      <button type="button" className="link-btn" onClick={() => setEdit(p.key, undefined)}>
                        自動の文に戻す
                      </button>
                    )}
                  </div>
                  <AutoTextarea aria-labelledby={labelId} value={p.text} onChange={(e) => setEdit(p.key, e.target.value)} />
                </li>
              );
            })}
          </ol>
          {mail.method === 'form' && (
            <p className="mail-count">
              文字数：件名 {countChars(subjectLine)}字・本文 {countChars(bodyAll)}字<span>（改行や空白も1字に数えています）</span>
            </p>
          )}
          <details className="fold help-fold">
            <summary>
              困ったときの文例
              <span className="field-opt">返事が来ないとき など</span>
            </summary>
            <dl className="help-lines">
              {mailHelpLines(mail, subjectLine).map((h) => (
                <div key={h.key}>
                  <dt>{h.label}</dt>
                  <dd>
                    {h.text}
                    {h.copy && <CopyButton text={h.text} label="確認の文をコピー" />}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
          <div className="maker-actions">
            <SendAction draft={draft} mail={mail} subject={subjectLine} body={bodyAll} />
            <div className="maker-subactions">
              <CopyButton text={subjectLine} label="件名をコピー" />
              <CopyButton text={bodyAll} label="本文をコピー" />
            </div>
          </div>
          <ul className="mail-notes" aria-label="送るときの注意">
            {METHOD_NOTES[mail.method].map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** 送り先を選んでいて、選んだ方法が使えるときだけ「メールアプリで開く」「公式フォームを開く」を出す */
function SendAction({ draft, mail, subject, body }: { draft: CallDraft; mail: MailDraft; subject: string; body: string }) {
  const t = draft.target;
  if (mail.method === 'mail' && t?.email) {
    const m = mailtoHref(t.email, subject, body);
    return (
      <>
        <a className="btn btn-primary btn-big" href={m.href}>
          <Icon name="mail" />
          メールアプリで開く
        </a>
        {!m.withBody && (
          <p className="maker-notice">
            <Icon name="info" />
            <span>本文が長いため、メールアプリには宛先と件名だけが入ります。本文は「本文をコピー」で貼り付けてください。</span>
          </p>
        )}
      </>
    );
  }
  if (mail.method === 'form' && t?.formUrl) {
    return (
      <>
        <a className="btn btn-primary btn-big" href={t.formUrl} target="_blank" rel="noopener noreferrer">
          <Icon name="form" />
          公式フォームを開く
          <span className="sr-only">（外部サイト・新しいタブで開きます）</span>
        </a>
        <p className="field-hint">フォームは新しいタブで開きます。この画面に戻って、件名と本文をコピーできます。</p>
      </>
    );
  }
  return (
    <p className="field-hint">
      {t
        ? 'この送り先では、件名と本文をコピーして使ってください。'
        : '送り先を選ぶと、ここに「メールアプリで開く」「公式フォームを開く」のボタンが出ます。'}
    </p>
  );
}

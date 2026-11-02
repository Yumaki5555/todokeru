// 連絡先の管理画面の動き（admin/server.mjs が配る）
// 1. どこの連絡先かを選ぶ → 2. 登録されている窓口を見て「確認できた」「内容を直す」、または新しく登録する
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let data = null; // { today, entities, typeInfo, statusLabel }
let detail = null; // 今ひらいている機関・自治体
let editing = null; // { mode: 'add' | 'edit', id?, type? }

const FIELD_LABEL = {
  phone: '電話番号',
  email: 'メールアドレス',
  form_url: 'フォームのURL',
  postal_code: '郵便番号',
  postal_address: '住所',
  hours: '受付時間',
  department: '窓口名',
  type: '窓口の種類',
  source_url: '出典ページ',
  note: '補足',
  status: '確認状態',
  verified_at: '確認日',
  matched_at: '照合日',
  form_via_page: '公式ページから開くフォーム',
  id: '窓口の番号',
};

async function api(path, body) {
  const r = await fetch(path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  return r.json();
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 4500);
}

const label = (e) => (e.kind === 'muni' ? `${e.name}（${e.pref_name}）` : e.kind === 'agency' ? `${e.name}（国の機関）` : e.name);

// ---- 1. どこの連絡先？ ----

async function loadEntities() {
  data = await api('/api/entities');
  $('#entity-names').innerHTML = data.entities.map((e) => `<option value="${esc(label(e))}"></option>`).join('');
  const sel = $('#pref');
  if (!sel.options.length) {
    const prefs = data.entities.filter((e) => e.kind === 'pref');
    sel.innerHTML =
      '<option value="">都道府県を選ぶ</option>' +
      prefs.map((p) => `<option value="${p.pref_code}">${esc(p.name)}</option>`).join('') +
      '<option value="agencies">国の機関</option>';
  }
}

function countBadges(n) {
  if (!n) return '<span class="chip none">連絡先なし</span>';
  const parts = [];
  if (n.verified) parts.push(`<span class="chip ok">確認済み ${n.verified}</span>`);
  if (n.auto_matched) parts.push(`<span class="chip auto">自動照合 ${n.auto_matched}</span>`);
  if (n.review) parts.push(`<span class="chip review">要再確認 ${n.review}</span>`);
  if (n.unverified) parts.push(`<span class="chip gray">未確認 ${n.unverified}</span>`);
  if (n.other) parts.push(`<span class="chip gray">その他 ${n.other}</span>`);
  return parts.join('') || '<span class="chip none">連絡先なし</span>';
}

function renderList() {
  const code = $('#pref').value;
  const list = $('#list');
  $('#filters').hidden = !code;
  if (!code) {
    list.innerHTML = '';
    return;
  }
  const filter = document.querySelector('input[name=filter]:checked').value;
  let items = data.entities.filter((e) => (code === 'agencies' ? e.kind === 'agency' : e.pref_code === code));
  if (filter === 'todo') items = items.filter((e) => e.counts && (e.counts.auto_matched || e.counts.review || e.counts.unverified));
  if (filter === 'none') items = items.filter((e) => !e.counts);
  list.innerHTML = items.length
    ? items
        .map(
          (e) =>
            `<button type="button" class="item${detail?.entity.key === e.key ? ' current' : ''}" data-key="${e.key}"><span class="item-name">${esc(e.name)}</span><span class="chips">${countBadges(e.counts)}</span></button>`,
        )
        .join('')
    : '<p class="empty">当てはまるところはありません。</p>';
}

function showMatches(q) {
  const s = q.trim();
  if (!s) return;
  const hit = data.entities.filter((e) => label(e) === s);
  if (hit.length === 1) return openEntity(hit[0].key);
  const found = data.entities.filter((e) => e.name.includes(s) || (e.pref_name || '').includes(s) && e.kind === 'pref');
  if (found.length === 1) return openEntity(found[0].key);
  $('#pref').value = '';
  $('#filters').hidden = true;
  $('#list').innerHTML = found.length
    ? found
        .slice(0, 60)
        .map((e) => `<button type="button" class="item" data-key="${e.key}"><span class="item-name">${esc(label(e))}</span><span class="chips">${countBadges(e.counts)}</span></button>`)
        .join('')
    : `<p class="empty">「${esc(s)}」に当てはまる名前がありません。「市」「町」などを付けずに入れてみてください。</p>`;
}

// ---- 2. 窓口を見る・確認する・直す ----

async function openEntity(key, { scroll = true } = {}) {
  const d = await api('/api/entity?key=' + encodeURIComponent(key));
  if (d.error) return toast(d.error);
  detail = d;
  editing = null;
  history.replaceState(null, '', '#key=' + key);
  renderDetail();
  renderList();
  if (scroll) $('#detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function statusHint(c) {
  switch (c.status) {
    case 'auto_matched':
      return '機械が公式サイトと照合した番号です。人による確認はまだです。出典ページを開いて、番号が合っていれば「確認できた」を押してください。';
    case 'review':
      return '前に確かめたあと、もう一度確かめる必要があるとした窓口です（サイトには前の確認日のまま出ています）。';
    case 'unverified':
      return 'まだ確かめていないので、サイトには出ていません。出典ページで確かめたら「確認できた」を押してください。';
    case 'discontinued':
      return '廃止・変更になったとした窓口です。サイトには出ていません。';
    case 'unavailable':
      return '公式の連絡先が見つからなかったという記録です。サイトには「確認できない」と出ます。';
    default:
      return '';
  }
}

function contactRows(c) {
  const row = (k, v) => (v ? `<div class="row"><dt>${k}</dt><dd>${v}</dd></div>` : '');
  const link = (u) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a>`;
  return (
    '<dl>' +
    row('電話番号', c.phone ? `<span class="big">${esc(c.phone)}</span>` : '') +
    row('メール', esc(c.email)) +
    row('フォーム', c.form_url ? link(c.form_url) + (c.form_via_page ? `<br><small>公式ページの「${esc(c.form_via_page)}」から開く</small>` : '') : '') +
    row('住所', [c.postal_code && '〒' + esc(c.postal_code), esc(c.postal_address)].filter(Boolean).join(' ')) +
    row('受付時間', esc(c.hours)) +
    row('補足', esc(c.note)) +
    row('出典', c.source_url ? link(c.source_url) : '<span class="warn">まだありません</span>') +
    row('確認日', c.verified_at ? esc(c.verified_at) : '') +
    row('照合日', c.matched_at ? esc(c.matched_at) + '（機械で照合）' : '') +
    '</dl>'
  );
}

function contactCard(c) {
  const verifyLabel = c.status === 'verified' ? '今日もう一度確認できた' : '確認できた';
  const more = [
    c.status === 'verified' ? '<button type="button" data-act="review">要再確認にする</button>' : '',
    c.status !== 'discontinued' ? '<button type="button" data-act="discontinued">廃止・変更になった</button>' : '',
    '<button type="button" class="danger" data-act="delete">この窓口を消す（間違えて登録したとき）</button>',
  ].join('');
  return `<article class="card st-${c.status}" data-id="${esc(c.id)}">
    <div class="card-head"><span class="badge st-${c.status}">${esc(data.statusLabel[c.status] || c.status)}</span><strong class="dept">${esc(c.department)}</strong></div>
    ${statusHint(c) ? `<p class="hint">${statusHint(c)}</p>` : ''}
    ${contactRows(c)}
    <div class="actions">
      ${c.source_url ? `<a class="btn" href="${esc(c.source_url)}" target="_blank" rel="noopener">出典ページを開く ↗</a>` : ''}
      ${c.source_url ? '<button type="button" data-act="find">ページの中を自動で探す</button>' : ''}
      ${c.status !== 'discontinued' ? `<button type="button" class="${c.status === 'verified' ? '' : 'primary'}" data-act="verify">${verifyLabel}</button>` : ''}
      <button type="button" data-act="edit">内容を直す</button>
      <details class="more"><summary>そのほか</summary><div class="more-in">${more}</div></details>
    </div>
    <div class="find-result" hidden></div>
  </article>`;
}

function renderDetail() {
  const box = $('#detail');
  if (!detail) {
    box.hidden = true;
    return;
  }
  const { entity: e, contacts, allowedTypes, officialSite, officialSiteIsCandidate } = detail;
  const sections = allowedTypes.map((t) => {
    const cs = contacts.filter((c) => c.type === t);
    const info = data.typeInfo[t];
    const body =
      editing && editing.mode === 'add' && editing.type === t
        ? contactForm(null, t)
        : (cs.length ? '' : '<p class="empty">まだ登録がありません。</p>') +
          cs.map((c) => (editing?.mode === 'edit' && editing.id === c.id ? contactForm(c) : contactCard(c))).join('') +
          `<button type="button" class="add" data-add="${t}">＋ ${esc(info.label)}を${cs.length ? 'もう1つ' : ''}登録する</button>`;
    return `<section class="type-sec"><h3>${esc(info.label)}</h3><p class="type-desc">${esc(info.desc)}</p>${body}</section>`;
  });
  const others = contacts.filter((c) => !allowedTypes.includes(c.type));
  if (others.length)
    sections.push(
      `<section class="type-sec"><h3>サイトに出ない種類の窓口</h3>${others.map((c) => (editing?.mode === 'edit' && editing.id === c.id ? contactForm(c) : contactCard(c))).join('')}</section>`,
    );
  box.innerHTML = `
    <h2><span class="num">2</span>${esc(label(e))} の連絡先</h2>
    ${
      officialSite
        ? `<p class="official">公式サイト${officialSiteIsCandidate ? '（候補）' : ''}：<a href="${esc(officialSite)}" target="_blank" rel="noopener">${esc(officialSite)} ↗</a>${officialSiteIsCandidate ? '<br><small>一覧から集めた候補です。役所の公式サイトかどうか、画面で確かめてください。</small>' : ''}</p>`
        : ''
    }
    ${sections.join('')}`;
  box.hidden = false;
}

function contactForm(c, newType) {
  const t = c ? c.type : newType;
  const v = (k) => esc(c?.[k] ?? '');
  const types = detail.allowedTypes.includes(t) ? detail.allowedTypes : [...detail.allowedTypes, t];
  const input = (k, lab, opts = {}) => `<label class="field">
      <span class="label">${lab}${opts.req ? ' <em class="req">必須</em>' : ''}</span>
      ${opts.help ? `<span class="help">${opts.help}</span>` : ''}
      <input name="${k}" value="${v(k)}" ${opts.type ? `type="${opts.type}"` : ''} placeholder="${esc(opts.ph || '')}" autocomplete="off" ${opts.mode ? `inputmode="${opts.mode}"` : ''} />
    </label>`;
  return `<form class="cform" data-mode="${c ? 'edit' : 'add'}" ${c ? `data-id="${esc(c.id)}"` : ''} novalidate>
    <h4>${c ? '窓口の内容を直す' : '新しい窓口を登録する'}</h4>
    <div class="errors" role="alert" hidden></div>
    <fieldset class="field"><legend class="label">窓口の種類</legend>
      ${types.map((x) => `<label class="radio"><input type="radio" name="type" value="${x}" ${x === t ? 'checked' : ''} /> ${esc(data.typeInfo[x].label)}</label>`).join('')}
    </fieldset>
    ${input('department', '窓口名', { req: true, ph: '例：広報広聴課、議会事務局、代表電話' })}
    ${input('phone', '電話番号', { ph: '例：03-1234-5678', mode: 'tel', help: 'ハイフン（-）で区切って入れます。全角の数字でもかまいません。' })}
    ${input('email', 'メールアドレス', { ph: '例：koho@city.example.lg.jp', mode: 'email' })}
    ${input('form_url', '問い合わせフォームのURL', { ph: 'https://…', mode: 'url' })}
    <div class="two">
      ${input('postal_code', '郵便番号', { ph: '例：135-8383' })}
      ${input('postal_address', '住所', { ph: '例：東京都江東区東陽4-11-28' })}
    </div>
    ${input('hours', '受付時間', { ph: '例：平日 午前8時30分〜午後5時' })}
    ${input('source_url', '出典ページのURL', {
      req: true,
      ph: 'https://…',
      mode: 'url',
      help: 'この連絡先が書かれている、役所の公式ページのURLです。サイトに「出典」として出ます。ページを開いてアドレス欄からコピーしてください。',
    })}
    <div class="actions inline">
      <button type="button" data-act="form-open">出典ページを開く ↗</button>
      <button type="button" data-act="form-find">ページの中を自動で探す</button>
    </div>
    <div class="find-result" hidden></div>
    ${input('note', 'サイトに出す補足（なくてもよい）', { ph: '例：土日祝日は休み' })}
    <fieldset class="field check"><legend class="label">出典ページで確かめましたか？ <em class="req">必須</em></legend>
      <label class="radio"><input type="radio" name="check" value="checked" /> <span><strong>確かめた</strong>：今日（${esc(data.today)}）の日付で「公式確認済み」としてサイトに出す</span></label>
      <label class="radio"><input type="radio" name="check" value="unchecked" /> <span><strong>まだ</strong>：サイトには出さず、記録だけ残す</span></label>
    </fieldset>
    <div class="actions">
      <button type="submit" class="primary">保存する</button>
      <button type="button" data-act="cancel">やめる</button>
    </div>
  </form>`;
}

function formInput(form) {
  const f = new FormData(form);
  const o = {};
  for (const k of ['type', 'department', 'phone', 'email', 'form_url', 'postal_code', 'postal_address', 'hours', 'source_url', 'note', 'check']) o[k] = f.get(k) ?? '';
  return o;
}

function showFind(el, r) {
  el.hidden = false;
  if (!r.ok) {
    el.className = 'find-result bad';
    el.innerHTML = esc(r.error);
    return;
  }
  const keys = Object.keys(r.found);
  if (!keys.length) {
    el.className = 'find-result';
    el.innerHTML = 'ページは開けました。探す項目（電話・メールなど）がまだ入っていません。';
    return;
  }
  const allOk = keys.every((k) => r.found[k]);
  el.className = 'find-result ' + (allOk ? 'good' : 'bad');
  el.innerHTML =
    `<p>${allOk ? 'ページの中に、すべて見つかりました。念のため、ページを開いて窓口名も合っているか見てください。' : '見つからない項目があります。ページを開いて、目で確かめてください（画像になっている文字や、別のページに書かれていることもあります）。'}</p><ul>` +
    keys.map((k) => `<li class="${r.found[k] ? 'yes' : 'no'}">${r.found[k] ? '✓ 見つかった' : '✗ 見つからない'}：${FIELD_LABEL[k]}</li>`).join('') +
    '</ul>' +
    (r.finalUrl && r.finalUrl !== r.input ? `<p class="small">開いたページ：${esc(r.finalUrl)}</p>` : '');
}

async function doAction(action, { confirmText, done } = {}) {
  if (confirmText && !confirm(confirmText)) return null;
  const r = await api('/api/action', { key: detail.entity.key, action });
  if (!r.ok) return r;
  detail = { entity: r.entity, contacts: r.contacts, allowedTypes: r.allowedTypes, officialSite: r.officialSite, officialSiteIsCandidate: r.officialSiteIsCandidate };
  editing = null;
  renderDetail();
  toast(r.unchanged ? '変わったところはありませんでした。' : `${done || '保存しました'}。公開するまでサイトには出ません。`);
  await Promise.all([loadEntities().then(renderList), renderPending()]);
  return r;
}

// ---- まだ公開していない変更 ----

function describeChange(x) {
  if (x.change === 'added') return `新しく登録（${data.statusLabel[x.status] || x.status}）`;
  if (x.change === 'deleted') return '消した';
  const f = x.fields || {};
  if (f.status) {
    const [a, b] = f.status;
    const rest = Object.keys(f).filter((k) => !['status', 'verified_at', 'matched_at'].includes(k));
    return `${data.statusLabel[a] || a} → ${data.statusLabel[b] || b}${rest.length ? '・' + rest.map((k) => FIELD_LABEL[k] || k).join('・') + 'を直した' : ''}`;
  }
  if (Object.keys(f).length === 1 && f.verified_at) return `確認日を ${f.verified_at[1]} に`;
  return Object.keys(f)
    .map((k) => FIELD_LABEL[k] || k)
    .join('・') + 'を直した';
}

async function renderPending() {
  const p = await api('/api/pending');
  const box = $('#pending');
  if (!p.items.length) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  box.innerHTML = `<details>
    <summary><strong>まだ公開していない変更が ${p.items.length} 件あります</strong>（見る）</summary>
    <ul>${p.items
      .map((x) => `<li><a href="#key=${esc(x.id.replace(/-(general|feedback|assembly|department)(-\d+)?$/, ''))}" data-key="${esc(x.id.replace(/-(general|feedback|assembly|department)(-\d+)?$/, ''))}">${esc(x.entityName)}${x.prefName && x.prefName !== x.entityName ? `（${esc(x.prefName)}）` : ''}</a>：${esc(describeChange(x))}</li>`)
      .join('')}</ul>
  </details>
  <p class="howto">サイトに出すには、Claude に<strong>「連絡先の変更を公開して」</strong>と伝えてください。</p>`;
}

// ---- 操作の受けつけ ----

document.addEventListener('click', async (ev) => {
  const keyEl = ev.target.closest('[data-key]');
  if (keyEl) {
    ev.preventDefault();
    return openEntity(keyEl.dataset.key);
  }
  const add = ev.target.closest('[data-add]');
  if (add) {
    editing = { mode: 'add', type: add.dataset.add };
    renderDetail();
    return $('.cform input[name=department]')?.focus();
  }
  const btn = ev.target.closest('[data-act]');
  if (!btn) return;
  const card = btn.closest('.card');
  const form = btn.closest('.cform');
  const id = card?.dataset.id;
  const c = detail?.contacts.find((x) => x.id === id);
  switch (btn.dataset.act) {
    case 'edit':
      editing = { mode: 'edit', id };
      renderDetail();
      return $(`.cform[data-id="${CSS.escape(id)}"] input[name=department]`)?.focus();
    case 'cancel':
      editing = null;
      return renderDetail();
    case 'verify': {
      const r = await doAction(
        { kind: 'verify', id },
        {
          confirmText: `出典のページで、${c.phone ? '電話番号' : '連絡先'}と窓口名が合っていることを確かめましたか？\n\n「OK」を押すと、今日（${data.today}）の日付で「公式確認済み」になります。`,
          done: '「公式確認済み」にしました',
        },
      );
      if (r && !r.ok) alert('保存できませんでした：\n\n' + r.errors.join('\n'));
      return;
    }
    case 'review':
    case 'discontinued': {
      const r = await doAction(
        { kind: 'status', id, status: btn.dataset.act },
        {
          confirmText:
            btn.dataset.act === 'review'
              ? '「要再確認」にしますか？\n（サイトには前の確認日のまま出ます）'
              : '「廃止・変更」にしますか？\nこの窓口はサイトに出なくなります。',
          done: '確認状態を変えました',
        },
      );
      if (r && !r.ok) alert('保存できませんでした：\n\n' + r.errors.join('\n'));
      return;
    }
    case 'delete': {
      const r = await doAction(
        { kind: 'delete', id },
        { confirmText: `「${c.department}」を消しますか？\n\n廃止になった窓口なら「廃止・変更になった」を使ってください。消すのは、間違えて登録したときだけです。`, done: '消しました' },
      );
      if (r && !r.ok) alert('消せませんでした：\n\n' + r.errors.join('\n'));
      return;
    }
    case 'find': {
      const out = card.querySelector('.find-result');
      out.hidden = false;
      out.className = 'find-result';
      out.textContent = 'ページを開いて探しています…';
      const r = await api('/api/check', { key: detail.entity.key, input: c });
      return showFind(out, { ...r, input: c.source_url });
    }
    case 'form-open': {
      const u = form.elements.source_url.value.trim();
      if (!/^https?:\/\//.test(u)) return toast('先に出典ページのURLを入れてください');
      return window.open(u, '_blank', 'noopener');
    }
    case 'form-find': {
      const out = form.querySelector('.find-result');
      out.hidden = false;
      out.className = 'find-result';
      out.textContent = 'ページを開いて探しています…';
      const input = formInput(form);
      const r = await api('/api/check', { key: detail.entity.key, input });
      return showFind(out, { ...r, input: input.source_url });
    }
  }
});

document.addEventListener('submit', async (ev) => {
  const form = ev.target.closest('.cform');
  if (!form) return;
  ev.preventDefault();
  const input = formInput(form);
  const errBox = form.querySelector('.errors');
  const errs = [];
  if (!input.check) errs.push('「出典ページで確かめましたか？」のどちらかを選んでください');
  if (!input.department.trim()) errs.push('窓口名を入れてください');
  if (!input.source_url.trim() && input.check === 'checked') errs.push('出典ページのURLを入れてください');
  if (!errs.length) {
    const action = form.dataset.mode === 'edit' ? { kind: 'edit', id: form.dataset.id, input } : { kind: 'add', input };
    const r = await doAction(action, { done: form.dataset.mode === 'edit' ? '直しました' : '登録しました' });
    if (r?.ok) return;
    errs.push(...(r?.errors || ['保存できませんでした']));
  }
  errBox.hidden = false;
  errBox.innerHTML = '<p>保存できませんでした。次の点を直してください：</p><ul>' + errs.map((x) => `<li>${esc(x)}</li>`).join('') + '</ul>';
  errBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

$('#pref').addEventListener('change', renderList);
$('#filters').addEventListener('change', renderList);
// 候補から選んだとき（名前がそのまま一致したとき）はすぐ開く。途中までの名前は Enter で探す
$('#search').addEventListener('input', (ev) => {
  const e = data.entities.find((x) => label(x) === ev.target.value);
  if (e) openEntity(e.key);
});
$('#search').addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') showMatches(ev.target.value);
});

(async () => {
  await loadEntities();
  await renderPending();
  const key = /key=([\w-]+)/.exec(location.hash)?.[1];
  if (key) {
    const e = data.entities.find((x) => x.key === key);
    if (e) $('#pref').value = e.kind === 'agency' ? 'agencies' : e.pref_code;
    await openEntity(key, { scroll: false });
  }
})();

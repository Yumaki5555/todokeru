// 「何をしたいですか？」：目的を1つ押すと、その下に「こんな方法があります」を出す
// トップと「3分でわかる」の STEP 1 で同じ部品・同じデータ（content/threeMinutes.ts の PURPOSES）を使う。
// 選んだ目的はこのタブの間だけ覚える（戻る・3分ガイドへ移動しても選んだまま。目的の種類だけで、入力内容は含まない）
import { Fragment, useState } from 'react';
import { findGuide, guidePath } from '../content/guides';
import { METHODS, PURPOSES } from '../content/threeMinutes';
import { href } from '../router';
import type { IconName, PurposeWay, ThreeMinutePurpose } from '../types';
import { Icon } from './Icon';

const KEY = 'todokeru:purpose';

function loadPurpose(): string | null {
  try {
    const v = sessionStorage.getItem(KEY);
    return PURPOSES.some((p) => p.id === v) ? v : null;
  } catch {
    return null;
  }
}

/** 選んだ目的（もう一度押すと外れる） */
export function usePurpose(): [ThreeMinutePurpose | undefined, (id: string | null) => void] {
  const [id, setId] = useState<string | null>(loadPurpose);
  const set = (next: string | null) => {
    setId(next);
    try {
      if (next) sessionStorage.setItem(KEY, next);
      else sessionStorage.removeItem(KEY);
    } catch {
      // 覚えられなくても選ぶことはできる
    }
  };
  return [PURPOSES.find((p) => p.id === id), set];
}

export function PurposeFinder({ purpose, onChange }: { purpose: ThreeMinutePurpose | undefined; onChange: (id: string | null) => void }) {
  return (
    <>
      <ul className="purpose-pick">
        {PURPOSES.map((p) => {
          const on = purpose?.id === p.id;
          return (
            <li key={p.id}>
              <button type="button" aria-pressed={on} aria-controls="purpose-result" onClick={() => onChange(on ? null : p.id)}>
                <span className="purpose-icon" aria-hidden="true">
                  <Icon name={p.icon} />
                </span>
                <Breakable label={p.label} />
                {on && (
                  <span className="purpose-mark" aria-hidden="true">
                    <Icon name="check" />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="way-result" id="purpose-result" aria-live="polite">
        {purpose && (
          <>
            <p className="way-title">
              「{plain(purpose.label)}」なら、こんな方法があります
            </p>
            <ul className="way-list">
              {purpose.ways.map((w) => (
                <WayRow way={w} key={w.when} />
              ))}
            </ul>
            <p className="way-note">状況に合った方法を選びましょう。複数の方法を組み合わせることもできます。</p>
          </>
        )}
      </div>
    </>
  );
}

/** 補助の行動（届ける方法ではなく、届け先や資料を探す） */
const AUX: Record<'contacts' | 'official', { label: string; icon: IconName }> = {
  contacts: { label: '窓口を探す', icon: 'search' },
  official: { label: '公式サイトを探す', icon: 'search' },
};

function WayRow({ way }: { way: PurposeWay }) {
  const soon = way.to.some((t) => t !== 'contacts' && t !== 'official' && findGuide(t)?.status === 'coming');
  return (
    <li className="way-row">
      <span className="way-when">{way.when}</span>
      <span className="way-to">
        {way.to.map((t) => {
          if (t === 'contacts' || t === 'official') {
            return (
              <a className="way-chip is-aux" href={href('/contacts')} key={t}>
                <Icon name={AUX[t].icon} />
                {AUX[t].label}
              </a>
            );
          }
          const g = findGuide(t)!;
          const name = plain(METHODS.find((m) => m.slug === t)!.label);
          // 準備中のマニュアルは、使えるように見せない（押せない表示にする）
          if (g.status === 'coming') {
            return (
              <span className="way-chip is-coming" key={t}>
                {name}
                <span className="menu-soon">準備中</span>
              </span>
            );
          }
          return (
            <a className="way-chip" href={href(guidePath(t))} key={t}>
              <Icon name={g.icon} />
              {name}
            </a>
          );
        })}
      </span>
      {soon && <span className="way-soon-note">手続きは、請求先の公式サイトで確かめてください。</span>}
    </li>
  );
}

/** 「/」の位置だけで折り返す（短いラベルは単語の途中で切らない） */
export function Breakable({ label }: { label: string }) {
  return (
    <span className="breakable">
      {label.split('/').map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {part}
        </Fragment>
      ))}
    </span>
  );
}

export const plain = (label: string) => label.replace(/\//g, '');

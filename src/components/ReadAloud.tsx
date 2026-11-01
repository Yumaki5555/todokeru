// 大きな文字で読む：電話中に見る専用の画面（メニューや飾りを隠し、台本だけを読む順に大きく出す）
// 開いているかどうかは URL（#/guide/phone?view=read）で表すので、再読み込みしても、ほかのアプリから戻っても消えない。
// 文字の大きさは、最初は画面に収まるいちばん大きな文字にし、利用者が変えたらそれを覚えておく。
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CallTarget, ScriptPart } from '../types';
import { telHref } from '../lib/text';
import { Icon } from './Icon';

const SIZES = [16, 18, 20, 22, 24, 27, 30, 34, 38, 43, 48];
const SIZE_KEY = 'todokeru:read-size';

function savedSize(): number | null {
  try {
    const v = Number(window.localStorage.getItem(SIZE_KEY));
    return Number.isInteger(v) && v > 0 && v <= SIZES.length ? v - 1 : null;
  } catch {
    return null;
  }
}

function saveSize(i: number): void {
  try {
    window.localStorage.setItem(SIZE_KEY, String(i + 1));
  } catch {
    // 覚えておけなくても、この画面の中では使える
  }
}

/** 画面を開いている間は、画面が暗くならないようにする（対応している端末だけ） */
function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let alive = true;
    const request = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const l = await navigator.wakeLock.request('screen');
        if (alive) lock = l;
        else l.release().catch(() => undefined);
      } catch {
        // 省電力の設定などで使えないときは何もしない
      }
    };
    request();
    document.addEventListener('visibilitychange', request);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', request);
      lock?.release().catch(() => undefined);
    };
  }, [on]);
}

export function ReadAloud({
  open,
  parts,
  target,
  onClose,
  onMemo,
}: {
  open: boolean;
  parts: ScriptPart[];
  target: CallTarget | null;
  onClose: () => void;
  onMemo: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const [chosen, setChosen] = useState<number | null>(savedSize);
  const [fitted, setFitted] = useState(SIZES.length - 1);
  const size = chosen ?? fitted;
  const lines = parts.filter((p) => p.text.trim());
  const textKey = lines.map((p) => p.text).join('\n');

  // 文字の大きさを測る前に開いておく（閉じていると高さが測れない）
  useLayoutEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useWakeLock(open);

  // スクロールせずに読めるよう、画面に収まるいちばん大きな文字を選ぶ
  useLayoutEffect(() => {
    if (!open || chosen !== null) return;
    const fit = () => {
      const b = body.current;
      const l = list.current;
      if (!b || !l) return;
      let best = 0;
      for (let i = SIZES.length - 1; i >= 0; i--) {
        l.style.fontSize = SIZES[i] + 'px';
        if (b.scrollHeight <= b.clientHeight) {
          best = i;
          break;
        }
      }
      l.style.fontSize = SIZES[best] + 'px';
      setFitted(best);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [open, chosen, textKey]);

  const choose = (i: number) => {
    setChosen(i);
    saveSize(i);
  };

  return (
    <dialog
      ref={dialog}
      className="reader"
      aria-labelledby="reader-h"
      onCancel={(e) => {
        // Esc キーでも、戻るボタンと同じように閉じる（URL もそろえる）
        e.preventDefault();
        onClose();
      }}
    >
      {open && (
        <>
          <div className="reader-bar">
            <button type="button" className="reader-back" onClick={onClose}>
              <Icon name="arrow-left" />
              戻る
            </button>
            <h2 id="reader-h" className="sr-only">
              台本を大きな文字で読む
            </h2>
            <div className="reader-size" role="group" aria-label="文字の大きさ">
              <button type="button" onClick={() => choose(size - 1)} disabled={size === 0} aria-label="文字を小さく">
                A<span aria-hidden="true">−</span>
              </button>
              <button type="button" onClick={() => choose(size + 1)} disabled={size === SIZES.length - 1} aria-label="文字を大きく">
                A<span aria-hidden="true">＋</span>
              </button>
            </div>
          </div>
          <div className="reader-body" ref={body}>
            <ol className="reader-lines" ref={list} style={{ fontSize: SIZES[size] + 'px' }}>
              {lines.map((p, i) => (
                <li key={p.key}>
                  <span className="reader-no" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="reader-label">{p.label}</span>
                  <p className="reader-text">{p.text}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="reader-foot">
            {target?.phone && (
              <a className="act reader-call" href={telHref(target.phone)}>
                <Icon name="phone" />
                <span className="act-text">
                  <span className="act-label">{target.org}に電話をかける</span>
                  <span className="sr-only">：</span>
                  <b>{target.phone}</b>
                </span>
              </a>
            )}
            <button type="button" className="btn btn-secondary reader-memo" onClick={onMemo}>
              <Icon name="memo" />
              メモを書く
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}

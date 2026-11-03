// ページの中の移動メニュー（長いガイドのページ用。ほかのマニュアルでも使える形）
//   JumpNav：ページ上部のボタン列
//   JumpBar：スマホなど狭い画面で、上部のボタン列が見えなくなったときだけ画面の下に出る小さなメニュー
//            入力中（キーボードが出ているとき）は隠す。広い画面では CSS で出さない
import { useEffect, useState, type RefObject } from 'react';
import type { IconName } from '../types';
import { Icon } from './Icon';
import { JumpLink } from './Links';

export interface JumpItem {
  /** 移動先の id */
  id: string;
  /** 「いまここ」の印を付けるときに比べる id（移動先と違うときだけ） */
  area?: string;
  icon: IconName;
  label: string;
  /** まとまりの番号（あればアイコンの代わりに丸数字を出す） */
  no?: number;
}

/** ids のうち、画面の上から3割の線を最後に越えたもの（＝いま読んでいるところ）。並びはページの上から順 */
export function useScrollSpy(ids: string[]): string | null {
  const [current, setCurrent] = useState<string | null>(null);
  const key = ids.join(' ');
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const line = window.innerHeight * 0.3;
      let found: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) found = id;
      }
      setCurrent(found);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    document.addEventListener('toggle', onScroll, true);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('toggle', onScroll, true);
    };
    // ids の中身が変わったときだけ付け直す
  }, [key]);
  return current;
}

/** キーボードで文字を入れる欄か（ラジオ・チェック欄は除く） */
function isTyping(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  return el instanceof HTMLInputElement && !['radio', 'checkbox', 'button', 'submit', 'reset'].includes(el.type);
}

/** 下のメニューを出すか：上部のボタン列が画面の上に隠れていて、文字を入力中でないとき */
function useBarShown(topRef: RefObject<HTMLElement | null>): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let typing = isTyping(document.activeElement);
    let raf = 0;
    const check = () => {
      raf = 0;
      const r = topRef.current?.getBoundingClientRect();
      setShown(!typing && !!r && r.bottom < 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    const onFocusIn = (e: FocusEvent) => {
      typing = isTyping(e.target);
      check();
    };
    const onFocusOut = (e: FocusEvent) => {
      typing = isTyping(e.relatedTarget);
      check();
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [topRef]);
  return shown;
}

const isCurrent = (it: JumpItem, current: string | null) => !!current && (it.area ?? it.id) === current;

/** ページ上部の移動ボタン（アイコン＋ことば） */
export function JumpNav({
  path,
  items,
  current,
  navRef,
}: {
  path: string;
  items: JumpItem[];
  current: string | null;
  navRef: RefObject<HTMLElement | null>;
}) {
  return (
    <nav className="page-jump" aria-label="このページの移動" ref={navRef}>
      <ul>
        {items.map((it) => (
          <li key={it.label}>
            <JumpLink path={path} id={it.id} push current={isCurrent(it, current)}>
              <Icon name={it.icon} />
              {it.label}
            </JumpLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** 画面の下の小さな移動メニュー（狭い画面だけ。wide なら広い画面でも、画面下の中央に小さく出す） */
export function JumpBar({
  path,
  items,
  current,
  topRef,
  label = '画面下の移動メニュー',
  wide = false,
}: {
  path: string;
  items: JumpItem[];
  current: string | null;
  topRef: RefObject<HTMLElement | null>;
  label?: string;
  wide?: boolean;
}) {
  const shown = useBarShown(topRef);
  return (
    <nav className={'jump-bar' + (wide ? ' jump-bar-wide' : '')} aria-label={label} hidden={!shown}>
      <ul>
        {items.map((it) => (
          <li key={it.label}>
            <JumpLink path={path} id={it.id} push current={isCurrent(it, current)}>
              {it.no ? (
                <span className="jump-no" aria-hidden="true">
                  {it.no}
                </span>
              ) : (
                <Icon name={it.icon} />
              )}
              {it.label}
            </JumpLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

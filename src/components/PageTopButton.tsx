// 画面の右下に出る「ページ先頭へ戻る」ボタン：少し下へ読み進めると現れる
import { useEffect, useState } from 'react';
import { scrollToPageTop } from '../lib/dom';
import { Icon } from './Icon';

/** これより下へ進んだら出す（画面上の長さ・px） */
const SHOW_AFTER = 300;

export function PageTopButton() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const update = () => setShown(window.scrollY > SHOW_AFTER);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <button type="button" className={'page-top-btn' + (shown ? ' is-shown' : '')} onClick={scrollToPageTop}>
      <Icon name="arrow-up" />
      <span className="page-top-label">ページ先頭へ戻る</span>
    </button>
  );
}

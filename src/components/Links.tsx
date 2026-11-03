// リンクの部品：サイト内リンク・外部リンク・ページ内リンク・3つの「戻る」
import type { ReactNode } from 'react';
import { href, parseHash, pushHash, sectionHref } from '../router';
import { scrollToPageTop, scrollToSection } from '../lib/dom';
import { REPORT, SITE, reportPageChoice, reportUrl, type ReportPrefill } from '../site';
import { Icon } from './Icon';

const isExternal = (to: string) => /^https?:\/\//.test(to);

/** サイト内（#/…）または外部へのリンク。外部は同じタブで開く */
export function SmartLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  if (isExternal(to)) {
    return (
      <a className={className} href={to}>
        {children}
        <Icon name="external" className="icon-inline" />
        <span className="sr-only">（外部サイト）</span>
      </a>
    );
  }
  const [path, q] = to.split('?');
  return (
    <a className={className} href={href(path) + (q ? '?' + q : '')}>
      {children}
    </a>
  );
}

/** いま見ているページの URL・ページ名を書き込んだ報告フォームの URL */
function currentReportUrl(prefill?: ReportPrefill): string {
  const path = parseHash(window.location.hash).path;
  return reportUrl({ page: reportPageChoice(path), url: window.location.href, ...prefill });
}

/** 間違い・ご要望の報告フォーム（Google フォーム）へのリンク。新しいタブで開く。報告先が未設定なら何も出さない。
 *  見ていたページの URL とページ名は、押したときに書き込む。prefill：ほかに書き込んでおく値（窓口カードなら種類と窓口名） */
export function ReportLink({ prefill, className, children }: { prefill?: ReportPrefill; className?: string; children: ReactNode }) {
  if (!REPORT.formUrl) return null;
  return (
    <a
      className={className}
      href={currentReportUrl(prefill)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.currentTarget.href = currentReportUrl(prefill);
      }}
    >
      {children}
      <Icon name="external" className="icon-inline" />
      <span className="sr-only">（Google フォーム・新しいタブで開きます）</span>
    </a>
  );
}

/** ページの末尾の小さな案内「間違いを見つけた・改善してほしいところがある」＋報告ボタン */
export function ReportLine() {
  if (!REPORT.formUrl) return null;
  return (
    <p className="report-line">
      <span>間違いを見つけた・改善してほしいところがある</span>
      <ReportLink className="btn btn-secondary btn-small">間違い・ご要望を送る</ReportLink>
    </p>
  );
}

/** 同じページの中の見出しへ移動するリンク
 *  push：移動を履歴に残す（ブラウザの「戻る」で、押す前の位置へ戻れる）　current：いま見ている場所の印 */
export function JumpLink({
  path,
  id,
  className,
  push = false,
  current = false,
  children,
}: {
  path: string;
  id: string;
  className?: string;
  push?: boolean;
  current?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      className={className}
      href={sectionHref(path, id)}
      aria-current={current ? 'location' : undefined}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // 新しいタブで開く操作はそのまま
        e.preventDefault();
        scrollToSection(id);
        if (push) pushHash(sectionHref(path, id));
      }}
    >
      {children}
    </a>
  );
}

/** 「声を届ける。トップへ戻る」：このサイトのトップへ */
export function BackToSiteTop({ className }: { className?: string }) {
  return (
    <a className={'back-link ' + (className || '')} href={href('/')}>
      <Icon name="arrow-left" />
      {SITE.name}トップへ戻る
    </a>
  );
}

/** 「ページ先頭へ戻る」：いま見ているページの先頭へ */
export function BackToPageTop() {
  return (
    <button type="button" className="back-link" onClick={scrollToPageTop}>
      <Icon name="arrow-up" />
      ページ先頭へ戻る
    </button>
  );
}

/** 詳細ページの下に置く2つの戻る */
export function PageEndNav({ report = true }: { report?: boolean }) {
  return (
    <>
      {report && <ReportLine />}
      <nav className="page-end-nav" aria-label="ページの移動">
        <BackToPageTop />
        <BackToSiteTop />
      </nav>
    </>
  );
}

// 共通フッター：民間運営であること・最終更新日・関連リンク
import { href } from '../router';
import { REPORT, SITE, formatDate } from '../site';
import { ReportLink } from './Links';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer-in">
        <p className="footer-name">{SITE.name}</p>
        <p>このサイトは民間が運営する案内サイトです。国・自治体・議会の公式サイトではありません。連絡先や手続きは、必ず各機関の公式ページで確かめてください。</p>
        <p>最終更新日：{formatDate(SITE.updated)}</p>
        <ul className="footer-links">
          <li>
            <a href={href('/about')}>このサイトについて（出典・注意事項・免責事項）</a>
          </li>
          {REPORT.formUrl && (
            <li>
              <ReportLink>間違い・ご要望を送る</ReportLink>
            </li>
          )}
          <li>
            <a href={SITE.pubcome.url}>{SITE.pubcome.label}</a>
          </li>
          <li>
            <a href={SITE.shomei.url}>{SITE.shomei.label}</a>
          </li>
          <li>
            <a href={SITE.portal.url}>{SITE.portal.label}トップへ戻る</a>
          </li>
        </ul>
      </div>
    </footer>
  );
}

// 準備中のガイド（メール・郵送／パブコメ／請願・陳情／情報公開請求／署名）
// 同じ URL（#/guide/<slug>）のまま、あとで本文のページに差し替えられる。
import type { GuideMenuItem } from '../types';
import { href } from '../router';
import { guidePath } from '../content/guides';
import { Icon } from '../components/Icon';
import { PageEndNav } from '../components/Links';
import { PageHead } from '../components/PageHead';

export function ComingSoonPage({ guide }: { guide: GuideMenuItem }) {
  return (
    <div className="wrap page prose-page">
      <PageHead title={guide.title} sub={guide.summary}>
        <p>
          <span className="badge badge-muted">準備中</span>
        </p>
      </PageHead>

      <div className="notice" role="note">
        <Icon name="info" />
        <div>
          <p>このガイドは準備中です。内容を確かめながら、順に公開していきます。</p>
          <p>それまでの間、提出の方法や条件は、それぞれの機関の公式の案内で確かめてください。</p>
        </div>
      </div>

      {guide.meanwhile && guide.meanwhile.length > 0 && (
        <section className="section" aria-labelledby="first-h">
          <h2 id="first-h" className="section-title">先に知っておきたいこと</h2>
          <ul>
            {guide.meanwhile.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {guide.related && guide.related.length > 0 && (
        <section className="section" aria-labelledby="now-h">
          <h2 id="now-h" className="section-title">今すぐ使えるサイト</h2>
          <ul className="related-list">
            {guide.related.map((r) => (
              <li key={r.url}>
                <a href={r.url} className="related-card">
                  <b>
                    {r.label}
                    <Icon name="external" className="icon-inline" />
                    <span className="sr-only">（外部サイト）</span>
                  </b>
                  <span>{r.desc}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="section" aria-labelledby="plan-h">
        <h2 id="plan-h" className="section-title">このページで案内する予定の内容</h2>
        <ol className="plan-list">
          {guide.plannedTopics.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="mean-h">
        <h2 id="mean-h" className="section-title">いま使えるガイド</h2>
        <p className="soon-actions">
          <a className="btn btn-secondary" href={href(guidePath('phone'))}>
            <Icon name="phone" />
            はじめての行政電話ガイド
          </a>
          <a className="btn btn-secondary" href={href(guidePath('email'))}>
            <Icon name="mail" />
            メール・フォーム・郵送で届ける
          </a>
        </p>
      </section>

      <PageEndNav />
    </div>
  );
}

// トップページ
import { useEffect, useState } from 'react';
import { GUIDES, guidePath } from '../content/guides';
import { loadSummary } from '../data/loaders';
import { href } from '../router';
import { scrollToSection } from '../lib/dom';
import { SITE, formatDate } from '../site';
import type { DataSummary } from '../types';
import { Icon } from '../components/Icon';
import { BackToPageTop } from '../components/Links';
import { ThreeMinutes } from '../components/ThreeMinutes';

export function HomePage() {
  return (
    <>
      <div className="hero">
        <div className="wrap">
          <h1 className="hero-title" id="page-top" tabIndex={-1}>
            {SITE.name}
          </h1>
          <p className="hero-catch">{SITE.catchCopy}</p>
          <p className="hero-desc">{SITE.description}</p>
          <p className="hero-sub">{SITE.subCopy}</p>
          <div className="gates">
            <a
              className="gate-main"
              href={href('/', { s: 'sanpun' })}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                scrollToSection('sanpun');
              }}
            >
              <span className="gate-icon" aria-hidden="true">
                <Icon name="book" />
              </span>
              <span className="gate-text">
                <span className="gate-kicker">初めての方はこちら</span>
                <b>まず3分でわかる</b>
              </span>
              <span className="gate-go" aria-hidden="true">
                <Icon name="arrow-right" />
              </span>
            </a>
            <nav className="gate-quick" aria-label="すぐに使いたい方">
              <p className="gate-quick-title">すぐに使いたい方</p>
              <ul>
                <li>
                  <a href={href(guidePath('phone'))}>
                    <Icon name="phone" />
                    電話のかけ方
                  </a>
                </li>
                <li>
                  <a href={href('/contacts')}>
                    <Icon name="search" />
                    全国の窓口を探す
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <div className="wrap home-sections">
        <ThreeMinutes />
        <GuideMenu />
        <ContactsTeaser />
        <RelatedSites />
        <AboutBrief />
      </div>
    </>
  );
}

function GuideMenu() {
  return (
    <section className="section" id="methods" aria-labelledby="methods-h">
      <h2 id="methods-h" className="section-title">声を届ける方法を知る</h2>
      <ul className="menu-grid">
        {GUIDES.map((g) => (
          <li className={'menu-card' + (g.status === 'coming' ? ' is-coming' : '')} key={g.slug}>
            <span className="menu-icon" aria-hidden="true">
              <Icon name={g.icon} />
            </span>
            <div className="menu-body">
              <h3>
                <a href={href(guidePath(g.slug))} className="menu-link">
                  {g.title}
                </a>
                <span className={'badge ' + (g.status === 'published' ? 'badge-main' : 'badge-muted')}>
                  {g.status === 'published' ? '公開中' : '準備中'}
                </span>
              </h3>
              <p>{g.summary}</p>
              {g.related?.map((r) => (
                <p className="menu-related" key={r.url}>
                  今すぐ使える：
                  <a href={r.url}>
                    {r.label}
                    <Icon name="external" className="icon-inline" />
                    <span className="sr-only">（外部サイト）</span>
                  </a>
                </p>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ContactsTeaser() {
  const [summary, setSummary] = useState<DataSummary | null>(null);
  useEffect(() => {
    let alive = true;
    loadSummary()
      .then((s) => alive && setSummary(s))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return (
    <section className="section" id="contacts" aria-labelledby="contacts-h">
      <h2 id="contacts-h" className="section-title">全国の窓口を探す</h2>
      <div className="panel teaser">
        <p>国の機関、都道府県、市区町村、議会の窓口を探すページです。窓口の役割（代表窓口・広聴窓口・議会事務局）の違いも確かめられます。</p>
        {summary && (
          <p className="teaser-stats">
            登録：国の機関 {summary.entities.agencies.toLocaleString()}・都道府県 {summary.entities.prefectures}・市区町村{' '}
            {summary.entities.municipalities.toLocaleString()}
            <br />
            公式確認済みの窓口：{summary.contacts.verified.toLocaleString()}件
            {summary.contacts.verified === 0 && '（連絡先は今後、公式サイトをもとに順次掲載します）'}
          </p>
        )}
        <a className="btn btn-primary" href={href('/contacts')}>
          <Icon name="search" />
          窓口を探す
        </a>
      </div>
    </section>
  );
}

function RelatedSites() {
  const sites = [SITE.pubcome, SITE.shomei];
  return (
    <section className="section" id="related" aria-labelledby="related-h">
      <h2 id="related-h" className="section-title">関連サイト</h2>
      <ul className="related-list">
        {sites.map((s) => (
          <li key={s.url}>
            <a href={s.url} className="related-card">
              <b>
                {s.label}
                <Icon name="external" className="icon-inline" />
                <span className="sr-only">（外部サイト）</span>
              </b>
              <span>{s.desc}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AboutBrief() {
  return (
    <section className="section" id="about" aria-labelledby="about-h">
      <h2 id="about-h" className="section-title">このサイトについて</h2>
      <div className="panel">
        <ul className="plain-list">
          <li>
            <b>目的：</b>国・自治体・議会に疑問や意見を届けたい人が、自分に合った方法と窓口を見つけられるように案内します。特定の政治的な立場を支持・反対するサイトではありません。賛成・反対・質問・提案のどれにも使えます。
          </li>
          <li>
            <b>運営：</b>民間が運営しています。国・自治体・議会の公式サイトではありません。
          </li>
          <li>
            <b>出典：</b>自治体の一覧は総務省「全国地方公共団体コード」、国の機関は各機関の公式サイトによります。窓口の連絡先は、公式に公開されている情報だけを、出典と確認日をつけて掲載します。
          </li>
          <li>
            <b>注意：</b>連絡先や手続きは変わることがあります。必ず公式ページで確かめてください。このサイトで電話の発信・録音やメールの送信はしません。入力した内容も保存しません。
          </li>
          <li>
            <b>免責：</b>掲載内容の正確さには注意していますが、内容や、利用した結果について保証するものではありません。
          </li>
        </ul>
        <p>最終更新日：{formatDate(SITE.updated)}</p>
        <p>
          <a href={href('/about')}>出典・注意事項・免責事項を詳しく見る</a>
        </p>
      </div>
      <p className="home-end">
        <BackToPageTop />
      </p>
    </section>
  );
}

// トップページ：「方法を知る」→「窓口を探す」→「声を届ける」を、説明を読まなくてもわかるように図で見せる
import { GUIDES, guidePath } from '../content/guides';
import { href } from '../router';
import { scrollToSection } from '../lib/dom';
import { SITE } from '../site';
import type { IconName } from '../types';
import { Icon } from '../components/Icon';
import { BackToPageTop } from '../components/Links';
import { ThreeMinutes } from '../components/ThreeMinutes';

/** ヒーローの下に並べる「声を届けるまでの流れ」 */
const FLOW: { icon: IconName; label: string }[] = [
  { icon: 'book', label: '知る' },
  { icon: 'search', label: '調べる' },
  { icon: 'bulb', label: '考える' },
  { icon: 'send', label: '届ける' },
];

export function HomePage() {
  return (
    <>
      <div className="hero">
        <div className="wrap hero-in">
          <div className="hero-head">
            <h1 className="hero-title" id="page-top" tabIndex={-1}>
              {SITE.name}
            </h1>
            <p className="hero-catch">{SITE.catchCopy}</p>
          </div>
          <HeroArt />
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
            <b className="gate-text">まず3分でわかる</b>
            <span className="gate-go" aria-hidden="true">
              <Icon name="arrow-right" />
            </span>
          </a>
          <ol className="hero-flow" aria-label="声を届けるまでの流れ">
            {FLOW.map((f) => (
              <li key={f.label}>
                <span className="flow-icon" aria-hidden="true">
                  <Icon name={f.icon} />
                </span>
                {f.label}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="wrap home-sections">
        <GuideMenu />
        <ContactsCard />
        <ThreeMinutes />
        <RelatedSites />
        <AboutBrief />
      </div>
    </>
  );
}

/** 吹き出しのイラスト（飾り） */
function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 200 150" aria-hidden="true" focusable="false">
      <path
        className="art-main"
        d="M28 12h84a18 18 0 0 1 18 18v42a18 18 0 0 1-18 18H60l-24 20V90h-8a18 18 0 0 1-18-18V30a18 18 0 0 1 18-18z"
      />
      <path className="art-line" d="M34 40h70M34 60h46" />
      <path
        className="art-sub"
        d="M112 62h60a16 16 0 0 1 16 16v28a16 16 0 0 1-16 16h-6v18l-20-18h-34a16 16 0 0 1-16-16V78a16 16 0 0 1 16-16z"
      />
      <circle className="art-dot" cx="124" cy="92" r="5.5" />
      <circle className="art-dot" cx="142" cy="92" r="5.5" />
      <circle className="art-dot" cx="160" cy="92" r="5.5" />
      <path className="art-plane" d="M194 8 150 26l16 7 7 16z M194 8l-28 25" />
    </svg>
  );
}

function GuideMenu() {
  return (
    <section className="section" id="methods" aria-labelledby="methods-h">
      <h2 id="methods-h" className="section-title">
        声を届ける方法を知る
      </h2>
      <ul className="menu-grid">
        {GUIDES.map((g) => {
          const coming = g.status === 'coming';
          return (
            <li className={'menu-card' + (coming ? ' is-coming' : '')} key={g.slug}>
              <a className="menu-link" href={href(guidePath(g.slug))} aria-label={g.title + (coming ? '（準備中）' : '')}>
                <span className="menu-icon" aria-hidden="true">
                  <Icon name={g.icon} />
                </span>
                <span className="menu-name">{g.short}</span>
                {coming && <span className="menu-soon">準備中</span>}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** 窓口検索の3つの入り口（押すと、その探し方を選んだ状態で窓口検索が開く） */
const FINDER_WAYS: { tab: string; icon: IconName; label: string; sub: string }[] = [
  { tab: 'area', icon: 'map', label: '地域から探す', sub: '都道府県・市区町村・議会' },
  { tab: 'agency', icon: 'landmark', label: '国の機関から探す', sub: '府省庁・国会' },
  { tab: 'search', icon: 'search', label: '名前で検索', sub: '例：江東区、厚生労働省' },
];

function ContactsCard() {
  return (
    <section className="section finder-panel" id="contacts" aria-labelledby="contacts-h">
      <h2 id="contacts-h" className="finder-panel-title">
        <span className="finder-card-icon" aria-hidden="true">
          <Icon name="building" />
        </span>
        <a href={href('/contacts')}>全国の窓口を探す</a>
      </h2>
      <ul className="finder-ways">
        {FINDER_WAYS.map((w) => (
          <li key={w.tab}>
            <a href={href('/contacts', { tab: w.tab })}>
              <span className="finder-way-icon" aria-hidden="true">
                <Icon name={w.icon} />
              </span>
              <span className="finder-way-text">
                <b>{w.label}</b>
                <span>{w.sub}</span>
              </span>
              <Icon name="arrow-right" className="finder-way-go" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RelatedSites() {
  const sites = [
    { ...SITE.pubcome, icon: 'comment' as const },
    { ...SITE.shomei, icon: 'signature' as const },
  ];
  return (
    <section className="section" id="related" aria-labelledby="related-h">
      <h2 id="related-h" className="section-title">
        関連サイト
      </h2>
      <ul className="related-list">
        {sites.map((s) => (
          <li key={s.url}>
            <a href={s.url} className="related-card has-icon">
              <span className="related-icon" aria-hidden="true">
                <Icon name={s.icon} />
              </span>
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
    <section className="home-about" id="about" aria-label="このサイトについて">
      <p>
        <span className="badge badge-muted">民間運営</span>
        <a href={href('/about')}>このサイトについて</a>
      </p>
      <BackToPageTop />
    </section>
  );
}

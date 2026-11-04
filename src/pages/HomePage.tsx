// トップページ：題名 → 何をしたいですか？（目的 → こんな方法があります）→ すぐ使いたい方（＋AI活用ガイド）→ 3分でわかる（入り口）→ 声の届け方 → 関連サイト
// わからない人には目的からの道案内を、決まっている人には最短の入り口を
import { GUIDES, guidePath } from '../content/guides';
import { href } from '../router';
import { SITE } from '../site';
import type { IconName } from '../types';
import { Icon } from '../components/Icon';
import { BackToPageTop, ReportLine, SmartLink } from '../components/Links';
import { Breakable, PurposeFinder, usePurpose } from '../components/PurposeFinder';

export function HomePage() {
  const [purpose, setPurpose] = usePurpose();
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
          <p className="hero-lead">
            <span>疑問や意見を、適切な窓口へ。</span>
            <span>調べ方・考え方・書き方・届け方を案内します。</span>
          </p>
        </div>
      </div>

      <div className="wrap home-sections">
        <section className="section home-purpose" id="purpose" aria-labelledby="purpose-h">
          <h2 id="purpose-h" className="section-title">
            何をしたいですか？
          </h2>
          <PurposeFinder purpose={purpose} onChange={setPurpose} />
        </section>
        <QuickStart />
        <SanpunCard />
        <GuideMenu />
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

/** すぐ使いたい方：作る・探す・書くを始める場所へ直接（台本・文面の作成欄は各ページの最初にある） */
const QUICK: { to: string; icon: IconName; label: string }[] = [
  { to: '/guide/phone', icon: 'phone', label: '電話の台本を/作る' },
  { to: '/guide/email', icon: 'mail', label: 'メール・手紙を/作る' },
  { to: '/contacts', icon: 'building', label: '全国の窓口を/探す' },
  { to: '/guide/public-comment', icon: 'comment', label: 'パブコメを/書く' },
];

/** AI活用ガイド：各書き方ページの中にある「AIへの指示文」へ直接（このサイトの中でAIは動かない。上部メニューからもここへ移動する） */
const AI_ENTRIES: { to: string; label: string }[] = [
  { to: '/guide/public-comment?s=prompts', label: 'パブコメの指示文' },
  { to: '/guide/petition?s=prompts', label: '請願・陳情の指示文' },
  { to: '/guide/signature?s=prompts', label: '署名の指示文' },
];

function QuickStart() {
  return (
    <section className="section" id="quick" aria-labelledby="quick-h">
      <h2 id="quick-h" className="section-title">
        すぐ使いたい方
      </h2>
      <ul className="quick-grid">
        {QUICK.map((q) => (
          <li key={q.to}>
            <a className="quick-link" href={href(q.to)}>
              <span className="quick-icon" aria-hidden="true">
                <Icon name={q.icon} />
              </span>
              <b>
                <Breakable label={q.label} />
              </b>
            </a>
          </li>
        ))}
      </ul>
      <div className="ai-entry" id="ai" role="group" aria-labelledby="ai-entry-h">
        <p className="ai-entry-head" id="ai-entry-h">
          <Icon name="sparkle" />
          <b>AI活用ガイド</b>
        </p>
        <p>資料の理解・考えの整理・文章づくり・内容の確認にAIを活用できます。指示文をコピーして、ふだん使っているAIに貼り付けます。</p>
        <ul className="ai-entry-links">
          {AI_ENTRIES.map((a) => (
            <li key={a.to}>
              <SmartLink to={a.to}>
                {a.label}
                <Icon name="arrow-right" className="icon-inline" />
              </SmartLink>
            </li>
          ))}
        </ul>
        <p className="ai-entry-note">電話・メールで伝える内容は、台本・文面づくりの「もっと詳しく整理する」で、AIを使わずに整えられます。</p>
      </div>
    </section>
  );
}

/** 初めての方へ：3分ガイドへの入り口（1枚） */
function SanpunCard() {
  return (
    <section className="section" id="first" aria-label="初めての方へ">
      <a className="sanpun-card" href={href('/sanpun')}>
        <span className="sanpun-icon" aria-hidden="true">
          <Icon name="book" />
        </span>
        <span className="sanpun-text">
          <span className="sanpun-label">初めての方へ</span>
          <b>3分でわかる</b>
          <span>制度の仕組み・声の届け方・注意点を知る</span>
        </span>
        <Icon name="arrow-right" className="sanpun-go" />
      </a>
    </section>
  );
}

/** 声の届け方：6つのガイド（準備中は「準備中」と表示） */
function GuideMenu() {
  return (
    <section className="section" id="methods" aria-labelledby="methods-h">
      <h2 id="methods-h" className="section-title">
        声の届け方
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
    <>
    <ReportLine />
    <section className="home-about" id="about" aria-label="このサイトについて">
      <p>
        <span className="badge badge-muted">民間運営</span>
        <a href={href('/about')}>このサイトについて</a>
      </p>
      <BackToPageTop />
    </section>
    </>
  );
}

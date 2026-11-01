// このサイトについて（目的・運営・出典・利用上の注意・個人情報・免責事項・最終更新日）
import { useEffect, useState, type ReactNode } from 'react';
import type { DataSummary } from '../types';
import { loadSummary } from '../data/loaders';
import { href } from '../router';
import { guidePath } from '../content/guides';
import { SITE, SUPERVISION, formatDate } from '../site';
import { PageEndNav } from '../components/Links';
import { PageHead } from '../components/PageHead';
import { Toc } from '../components/Toc';

const PATH = '/about';
const SECTIONS = [
  { id: 'purpose', label: 'サイトの目的' },
  { id: 'operator', label: '運営について' },
  { id: 'sources', label: '情報の出典' },
  { id: 'caution', label: '利用上の注意' },
  { id: 'privacy', label: '個人情報とプライバシー' },
  { id: 'supervision', label: '電話ガイドの監修について' },
  { id: 'disclaimer', label: '免責事項' },
  { id: 'roadmap', label: '今後の予定' },
];

/** 窓口データの掲載状況（summary.json から実数を表示する） */
function ContactCoverage() {
  const [s, setS] = useState<DataSummary | null>(null);
  useEffect(() => {
    let alive = true;
    loadSummary().then(
      (v) => alive && setS(v),
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, []);
  if (!s?.coverage) return null;
  const c = s.coverage;
  return (
    <li>
      {`掲載状況（${formatDate(s.generated_at)}時点）：公式確認済みの窓口 ${s.contacts.verified.toLocaleString()}件。`}
      {`公式確認済みの連絡先がある機関・自治体は、都道府県 ${c.prefectures.with_verified}／${c.prefectures.total}、`}
      {`国の機関 ${c.agencies.with_verified}／${c.agencies.total}、`}
      {`市区町村 ${c.municipalities.with_verified.toLocaleString()}／${c.municipalities.total.toLocaleString()}です。`}
      市区町村は、都道府県ごとに順に調べて追加していきます。
    </li>
  );
}

function Sec({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="section about-sec" id={id} aria-labelledby={id + '-h'} tabIndex={-1}>
      <h2 id={id + '-h'} className="section-title">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function AboutPage() {
  return (
    <div className="wrap page">
      <PageHead title="このサイトについて" sub={`${SITE.name}の目的・出典・注意事項`}>
        <p className="muted">最終更新日：{formatDate(SITE.updated)}</p>
      </PageHead>
      <div className="doc-layout">
        <aside className="doc-aside">
          <Toc path={PATH} items={SECTIONS} className="toc-side" />
        </aside>
        <div className="doc-body">
          <Sec id="purpose" title="サイトの目的">
            <p>
              {SITE.name}
              は、国・自治体・議会に、自分の疑問や意見を届けたい人のための案内サイトです。電話、メール、パブコメ、請願・陳情などの方法と、適切な窓口の探し方を案内します。
            </p>
            <p>
              「日本を知る。」で地域や政策を知り、調べ、考えたあとの「声を届ける」一歩を支えることを目指しています。特定の政治的な立場を支持・反対するサイトではありません。賛成・反対・質問・提案のどれにも使えます。
            </p>
          </Sec>

          <Sec id="operator" title="運営について">
            <ul className="plain-list">
              <li>民間が運営する案内サイトです。</li>
              <li>国・自治体・議会の公式サイトではありません。各機関から委託や認定を受けたものでもありません。</li>
              <li>
                関連サイト：<a href={SITE.portal.url}>{SITE.portal.label}</a>（入口サイト）／
                <a href={SITE.pubcome.url}>{SITE.pubcome.label}</a>／<a href={SITE.shomei.url}>{SITE.shomei.label}</a>
              </li>
            </ul>
          </Sec>

          <Sec id="sources" title="情報の出典">
            <ul className="plain-list">
              <li>
                都道府県・市区町村の一覧：総務省「全国地方公共団体コード」（令和6年1月1日更新）。政令指定都市は市全体で1件とし、区は含みません。
              </li>
              <li>国の機関の一覧：各機関の公式サイト（2026年11月1日にトップページの表示を確認）。</li>
              <li>
                自治体の公式サイトの探し方：<a href={SITE.jlisMap.url}>{SITE.jlisMap.label}</a>（{SITE.jlisMap.desc}）。
              </li>
              <li>
                窓口の連絡先：国の機関・自治体・議会の公式サイトに公開されている情報だけを掲載し、窓口ごとに出典ページと最終確認日を表示します。確認できない連絡先や担当部署を推測して載せることはしません。
                <ul className="plain-list small sub-list">
                  <li>
                    掲載する前に、出典ページを開き直し、電話番号・メールアドレス・住所などが実際にそのページに書かれているかを照合しています。照合できなかった項目は載せません。
                  </li>
                  <li>自動で開けないページ（アクセス制限など）は、ブラウザで直接確かめ、その記録を残しています。</li>
                  <li>代表電話の番号を、広聴や議会事務局の番号として使い回すことはしません。職員個人や議員個人の連絡先は扱いません。</li>
                  <ContactCoverage />
                </ul>
              </li>
              <li>
                制度の説明：法令や各機関の公式の説明をもとに、わかりやすい言葉でまとめています。正式な内容は、各機関の公式ページで確かめてください。
              </li>
            </ul>
          </Sec>

          <Sec id="caution" title="利用上の注意">
            <ul className="plain-list">
              <li>連絡先・受付時間・手続きは変わることがあります。利用する前に、必ず各機関の公式ページで確かめてください。</li>
              <li>
                パブコメ・請願・情報公開請求などの正式な手続きは、それぞれの機関が定める方法・期限・書式に従ってください。このサイトの案内は、一般的な説明です。
              </li>
              <li>電話やメールでの一般的な意見の表明と、法律で決められた正式な手続き（審査請求など）は別のものです。</li>
              <li>窓口の業務を妨げる使い方（同じ用件で何度も連絡する、長時間にわたる通話、大勢で一斉に連絡するなど）は避けてください。</li>
              <li>個別の職員の私用の連絡先や、個別の議員の連絡先は掲載しません。</li>
              <li>各機関の公式サイトの利用条件を守ってご利用ください。</li>
            </ul>
          </Sec>

          <Sec id="privacy" title="個人情報とプライバシー">
            <ul className="plain-list">
              <li>会員登録はありません。</li>
              <li>アクセス解析や、外部のトラッキング（閲覧の追跡）は使っていません。</li>
              <li>検索欄やチェックリストに入力・選択した内容は、お使いのブラウザの中だけで使い、送信も保存もしません。</li>
              <li>
                このサイトから電話の発信・録音や、メールの送信はしません。電話番号やメールアドレスを押すと、お使いの端末の電話アプリ・メールアプリが開きます。
              </li>
            </ul>
          </Sec>

          <Sec id="supervision" title="電話ガイドの監修について">
            <p>
              「<a href={href(guidePath('phone'))}>はじめての行政電話ガイド</a>」は、
              <a href={SUPERVISION.xUrl}>
                {SUPERVISION.name}（X {SUPERVISION.xHandle}）
              </a>
              の投稿にある考え方を尊重して、当サイトが独自の文章でまとめたものです。元の投稿の文章や画像は転載していません。
            </p>
            <p>
              {SUPERVISION.status === 'confirmed'
                ? `このガイドは${SUPERVISION.name}の監修を受けています${SUPERVISION.confirmedAt ? `（監修の確認日：${formatDate(SUPERVISION.confirmedAt)}）` : ''}。`
                : SUPERVISION.status === 'pending'
                  ? `${SUPERVISION.name}による監修は、現在確認中です。`
                  : 'このガイドは監修を受けていません。'}
              監修は電話ガイドについてのものであり、このサイト全体の監修ではありません。
            </p>
          </Sec>

          <Sec id="disclaimer" title="免責事項">
            <ul className="plain-list">
              <li>掲載内容の正確さには注意していますが、その内容を保証するものではありません。</li>
              <li>このサイトの情報を利用したことによって生じた結果について、運営者は責任を負いかねます。</li>
              <li>意見の提出や手続きについて、受理・回答・採用などの法律上の効果や結果を保証するものではありません。</li>
              <li>リンク先の外部サイトの内容については、それぞれの運営者にお問い合わせください。</li>
            </ul>
          </Sec>

          <Sec id="roadmap" title="今後の予定">
            <ol className="plan-list">
              <li>全国の窓口データの整備（国の機関・都道府県・市区町村・議会の、代表・広聴・議会事務局の窓口）</li>
              <li>パブコメの書き方</li>
              <li>請願・陳情の書き方</li>
              <li>メール・郵送、情報公開請求、署名の方法など</li>
              <li>「日本を知る。」の各サイトとの連携（地域を選んだ状態で窓口を開くなど）</li>
            </ol>
            <p className="muted">予定は変わることがあります。</p>
          </Sec>
        </div>
      </div>

      <PageEndNav />
    </div>
  );
}

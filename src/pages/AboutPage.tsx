// このサイトについて（目的・運営・出典・利用上の注意・個人情報・免責事項・最終更新日）
import { useEffect, useState, type ReactNode } from 'react';
import type { DataSummary } from '../types';
import { loadSummary } from '../data/loaders';
import { href } from '../router';
import { guidePath } from '../content/guides';
import { REPORT, SITE, SUPERVISION, formatDate } from '../site';
import { PageEndNav, ReportLink } from '../components/Links';
import { PageHead } from '../components/PageHead';
import { Toc } from '../components/Toc';

const PATH = '/about';
const SECTIONS = [
  { id: 'purpose', label: 'サイトの目的' },
  { id: 'operator', label: '運営について' },
  { id: 'sources', label: '情報の出典' },
  { id: 'caution', label: '利用上の注意' },
  // 報告先が未設定のあいだは出さない
  ...(REPORT.formUrl ? [{ id: 'report', label: '間違いを見つけたら' }] : []),
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
      {`掲載状況（${formatDate(s.generated_at)}時点）：連絡先を掲載している機関・自治体は、都道府県 ${c.prefectures.with_shown}／${c.prefectures.total}、`}
      {`国の機関 ${c.agencies.with_shown}／${c.agencies.total}、`}
      {`市区町村 ${c.municipalities.with_shown.toLocaleString()}／${c.municipalities.total.toLocaleString()}です。`}
      {`窓口の数は、公式確認済み（出典の公式ページと照合済み）が ${s.contacts.verified.toLocaleString()}件です。`}
      {s.contacts.by_status.auto_matched > 0 && `このほか、「公式サイトと自動照合」の代表電話（出典ページとの照合の前）が ${s.contacts.by_status.auto_matched.toLocaleString()}件あります。`}
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
              は、国・自治体・議会に、自分の疑問や意見を届けたい人のための案内サイトです。電話、メール・手紙、パブコメ、請願・陳情、署名などの方法と、適切な窓口の探し方を案内します。
            </p>
            <p>
              「日本を知る。」で地域や政策を知り、調べ、考えたあとの「声を届ける」一歩を支えることを目指しています。特定の政治的な立場を支持・反対するサイトではありません。賛成・反対・質問・提案のどれにも使えます。
            </p>
          </Sec>

          <Sec id="operator" title="運営について">
            <ul className="plain-list">
              <li>民間が運営する案内サイトです。</li>
              <li>国・自治体・議会の公式サイトではありません。各機関から委託や認定を受けたものでもありません。</li>
              <li>紹介している外部のサービス（署名サイトや AI のサービスなど）の運営者とも関係はありません。</li>
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
                    連絡先は、AI とプログラムで公式サイトから集めています。掲載する前に、プログラムで出典ページを開き直し、電話番号・メールアドレス・住所などが実際にそのページに書かれているかを照合しています。照合できなかった項目は載せません。掲載したすべての窓口を、人が目で確かめたわけではありません。
                  </li>
                  <li>自動で取得できないページは、通常のブラウザで閲覧できる範囲で確認し、その記録を残しています。</li>
                  <li>
                    市区町村の代表電話の一部は、公式サイトに「市役所・役場の代表」と書かれた番号を、プログラムで拾ったものです。出典ページを開き直しての照合の前のため「公式サイトと自動照合」と表示し、最終確認日の代わりに照合した日を出します。
                  </li>
                  <li>
                    請願・陳情の届け先は、各議会の「請願・陳情」のページ（書き方・出し方の案内）に書かれた提出先です。そのページを出典にし、窓口検索では「請願・陳情の出し方」のボタンで開けるようにしています。見つかった議会の分だけ載せています。
                  </li>
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
              <li>
                AI への指示文を使うときは、名前・住所・電話番号などの個人情報を入れないでください。AI の答えには誤りがあることがあります。事実・数字・提出先は公式の資料で確かめ、何をどう届けるかは自分で決めてください。
              </li>
            </ul>
          </Sec>

          {REPORT.formUrl && (
            <Sec id="report" title="間違いを見つけたら">
              <p>連絡先・受付時間の誤り、切れたリンク、使いにくいところ、追加してほしい情報などに気づいたら、Google フォーム（新しいタブで開きます）で知らせてください。</p>
              <ul className="plain-list">
                <li>どのページ・どの窓口のことかと、気づいたことを書いてください。正しい情報が載っている公式ページの URL があれば、確かめるのが早くなります。</li>
                <li>匿名で送れます。名前や連絡先は、返信が必要なときだけ書いてください。</li>
                <li>報告をもとに公式ページで確かめてから直します。すべてのご要望への対応・返信はお約束できません。窓口の誤りは、窓口検索の各窓口の「誤りを報告」からも送れます。</li>
              </ul>
              <p>
                <ReportLink className="btn btn-secondary">間違い・ご要望を送る</ReportLink>
              </p>
            </Sec>
          )}

          <Sec id="privacy" title="個人情報とプライバシー">
            <ul className="plain-list">
              <li>会員登録はありません。</li>
              <li>アクセス解析や、外部のトラッキング（閲覧の追跡）は使っていません。</li>
              <li>
                このサイトは GitHub Pages（GitHub 社の公開サービス）で公開しています。GitHub は、セキュリティのために、訪問者の IP
                アドレス（インターネット上の住所にあたる番号）を記録・保存します。GitHub にサインインしているかどうかには関係ありません（
                <a href="https://docs.github.com/ja/pages/getting-started-with-github-pages/what-is-github-pages">GitHub Docs「GitHub Pages とは」</a>
                の「データ コレクション」）。
              </li>
              <li>
                台本・文面の入力欄、検索欄、チェックリストに入力・選択した内容は、送信しません。入力の途中で消えないよう、このタブを閉じるまで、お使いのブラウザの中にだけ一時的に残します（台本・文面は「入力を消す」でも消せます）。「大きな文字で読む」で選んだ文字の大きさは、次に使うときのためにブラウザに記録します。
              </li>
              <li>
                「日本を知る。」の別のサイトからリンクで来たときは、元のページへ戻るためのメモ（戻り先のURL・自治体コード・見ていた項目の名前）を、このタブの中に最長2時間だけ残します。送信はしません。戻るリンクや「×」を押す、タブを閉じる、期限が過ぎる、のいずれかで消えます。
              </li>
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

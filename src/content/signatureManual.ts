// 署名の方法（#/guide/signature）の文章と、AIへの指示文
// ページに出す言葉と指示文はこのファイルにまとめる（直すときはここだけ見ればよい）。
// 署名サイトと制度の説明は、次の公式の案内で確かめた（2026年11月4日）。
//   ・Voice（運営：一般社団法人Social Good）ヘルプ：署名は無料・アカウントなしで署名可・未ログインは確認メールのURLで完了。
//     本名でも仮名でも可。非公開を選んでも、発起人が管理する署名簿には名前が載る（署名簿：名前・メールの先頭3文字・署名日、住所を集める活動は都道府県・市区町村）。
//     取り消しは署名完了メールの専用リンク（ログインして署名した人はマイページ）。受付終了後はできないことがある。
//     エールは任意。寄付を募集している活動は、システム利用料25%・決済手数料3.6%・振込手数料550円を引いて発起人へ（2021年9月1日以降の活動）。
//     寄付を募集していない活動への寄付（拡散エール）は運営が受け取る（利用規約 第7条7項、2026/10/22改定版）。
//     2025年7月1日以降に作られた対象活動へのカード寄付は、寄付額とは別にシステム維持費110円が加わる。寄付は原則として返金なし。署名を取り消しても寄付は取り消されない。
//     発起人の受け取り：署名を提出先へ届ける（原則）→完了報告→入金依頼→本人確認。募集期間の終了から90日以内に申請しないと受け取れない（利用規約 第7条6項）。
//     AIフォーム：400文字以内→「AIで下書きを作る」→追加質問（最大4問・スキップ可）→「この文章で署名活動を始める」で登録・ログイン。
//     無料・未ログイン1日3回／ログイン1日5回。AIの文章がそのまま公開されることはない。署名簿はPDF・CSVで出力し、発起人が届ける。
//     署名が10名以上・エールがある活動などは、非公開・削除ができない。応援メッセージは公開を選んだときだけページに出る（発起人は読める）。
//     （Voiceのヘルプは 2026年8月27〜29日更新のものを確認）
//   ・Change.org（運営：Change.org, PBC）ヘルプ・プライバシーポリシー：賛同は無料・姓、名、メール。初めての賛同でアカウントが自動で作られ、確認メールのリンクで有効。
//     名前を表示しない賛同ができるが、氏名と都市名（または郵便番号）・賛同日は発信者に共有される。メールアドレスは共有されない（発信者が団体のときは提供を選ぶ画面が出る）。
//     取り消しは賛同時のメールのリンク（30日間）、過ぎたらヘルプへ問い合わせ。
//     プロモーション支援のお金は Change.org に支払われ、発信者には渡らない。払わなくても賛同は有効。プロモーション支援は1回払いで、
//     そのあと月額会員（継続課金）の案内が出ることがある。解約はアカウント設定（account_settings/contributions）から。発信者へ寄付する仕組みはない。
//     賛同時の所在地は IP アドレスから自動で入り、直せる。コメントは署名ページに出て、賛同者リストにも入る。
//     立ち上げは無料。「AIサポート機能」がタイトル・本文・画像の下書きを提案（AI機能だけの料金・回数の記載はない）。
//     賛同者リストは CSV（立ち上げから24時間後から、メールのURLは7日間有効）。提出は発信者が行う。「終了」はページが残り再開も可、削除はサポートへ依頼・復元不可。
//     （Change.orgのヘルプは 2026年3〜8月更新。日本語のプライバシーポリシーは 2020年8月6日発効のままだが、ヘルプと食い違いはない）
//   ・地方自治法 第74条・第74条の2・第74条の3、施行令 第92条、総務省「直接請求制度」：条例の制定改廃の請求は有権者の50分の1以上、
//     議会の解散・解職は原則3分の1以上。決められた様式の署名簿に有権者が自署し、署名収集者が直接署名させる。選挙管理委員会が審査する。電子で集める規定はない。
//   ・地方自治法 第124条・請願法 第2条：請願は議員の紹介が必要。署名簿を求める規定はない。
import type { IconName, PubcomFigItem, SignaturePrompt, SignaturePromptId, SignatureSite, SignatureStep } from '../types';
import { SITE } from '../site';

export const SIGNATURE_GUIDE = {
  title: '署名で、声を集める。',
  subtitle: '一人の声から、みんなの声へ。',
};

export const CHECKED_DATE = '2026年11月4日';

/** 外部サイト・サイト内のリンク先（外部はすべて公式のURL） */
export const LINKS = {
  shomei: SITE.shomei.url,
  voiceTop: 'https://voice.charity/',
  voiceStart: 'https://voice.charity/',
  changeStart: 'https://www.change.org/start-a-petition',
  petitionGuide: '/guide/petition',
};

/** 公式の案内（出典） */
export const OFFICIAL = {
  voiceSign: { label: 'Voice「署名の方法」', url: 'https://voice.charity/help/signing/how-to-sign' },
  voiceAi: { label: 'Voice「AIフォームで署名活動を作る方法」', url: 'https://voice.charity/help/start-a-petition/how-to-use-ai-form' },
  voiceStart: { label: 'Voice「署名活動の立ち上げ方」', url: 'https://voice.charity/help/start-a-petition/how-to-start-a-petition' },
  voiceShare: { label: 'Voice「署名時の情報の共有」', url: 'https://voice.charity/help/signing/signature-information-sharing' },
  voiceName: { label: 'Voice「本名・仮名と公開設定」', url: 'https://voice.charity/help/signing/real-name-or-alias' },
  voiceCancel: { label: 'Voice「署名の取り消し」', url: 'https://voice.charity/help/signing/cancel-signature' },
  voiceMail: { label: 'Voice「確認メールが届かない」', url: 'https://voice.charity/help/signing/confirmation-email-not-received' },
  voiceYell: { label: 'Voice「エールについて」', url: 'https://voice.charity/help/donations-yell/about-yell' },
  voiceReceive: { label: 'Voice「エールの受け取り」（手数料）', url: 'https://voice.charity/help/start-a-petition/receive-yell' },
  voiceSubmit: { label: 'Voice「署名簿のダウンロードと提出」', url: 'https://voice.charity/help/start-a-petition/download-and-submit-signatures' },
  voiceDonate: { label: 'Voice「エールをする方法」（システム維持費）', url: 'https://voice.charity/help/donations-yell/how-to-donate' },
  voicePublish: { label: 'Voice「公開・非公開・削除」', url: 'https://voice.charity/help/start-a-petition/publish-unpublish-delete' },
  voiceTos: { label: 'Voice「利用規約」', url: 'https://voice.charity/informations/tos' },
  changeSign: { label: 'Change.org「オンライン署名に賛同する方法」', url: 'https://help.change.org/ja_JP/getting-started/how-to-sign-a-petition' },
  changeConfirm: { label: 'Change.org「賛同の確認（メール認証）」', url: 'https://help.change.org/ja_JP/signing-supporting/confirming-your-signature' },
  changeStart: { label: 'Change.org「オンライン署名の始め方」', url: 'https://help.change.org/ja_JP/getting-started/how-to-start-a-petition' },
  changePrivacy: { label: 'Change.org「プライバシーとデータ保護」', url: 'https://help.change.org/ja_JP/legal-compliance/privacy-data-protection' },
  changeRemove: { label: 'Change.org「賛同の取り消し」', url: 'https://help.change.org/ja_JP/signing-supporting/removing-your-signature-from-a-petition' },
  changePromote: { label: 'Change.org「プロモーション支援について」', url: 'https://help.change.org/ja_JP/billing-membership/promoting-a-petition' },
  changeMember: { label: 'Change.org「月額会員プログラム」（解約）', url: 'https://help.change.org/ja_JP/billing-membership/changeorg-membership-program' },
  changeClose: { label: 'Change.org「成功宣言／終了と再開」', url: 'https://help.change.org/ja_JP/managing-your-petition/changing-petition-status-closing-declaring-victory-reopening' },
  changeDownload: { label: 'Change.org「賛同者リストのダウンロード」', url: 'https://help.change.org/ja_JP/managing-your-petition/download-your-signatures' },
  changeLegal: { label: 'Change.org「発信者の法的責任」', url: 'https://help.change.org/ja_JP/legal-compliance/legal-responsibilities-for-petition-starters' },
  changePolicy: { label: 'Change.org「プライバシーポリシー」', url: 'https://www.change.org/policies/privacy' },
  law: { label: '地方自治法 第74条・第124条（e-Gov法令検索）', url: 'https://laws.e-gov.go.jp/law/322AC0000000067' },
  soumu: { label: '総務省「直接請求制度」', url: 'https://www.soumu.go.jp/main_sosiki/jichi_gyousei/bunken/chokusetsu_seikyu.html' },
  seiganLaw: { label: '請願法（e-Gov法令検索）', url: 'https://laws.e-gov.go.jp/law/322AC0000000013' },
};

/** 最初に出す2つの入り口（それぞれ、やってみようの手順へ） */
export const ENTRY: { id: string; mark: string; icon: IconName; title: string; sub: string; flow: string[] }[] = [
  { id: 'join', mark: 'A', icon: 'heart', title: '署名に賛同する', sub: 'すでにある署名に参加したい', flow: ['探す', '確かめる', '署名する'] },
  { id: 'start', mark: 'B', icon: 'signature', title: '自分で署名を立ち上げる', sub: '署名を作って、賛同を集めたい', flow: ['整理', '署名文', '公開', '集める', '提出'] },
];

/** ページの4つの入り口 */
export const SIGNATURE_PARTS: { id: string; no: number; icon: IconName; title: string; sub: string }[] = [
  { id: 'sanpun', no: 1, icon: 'bulb', title: '3分でわかる', sub: '署名のしくみと注意点' },
  { id: 'try', no: 2, icon: 'route', title: 'やってみよう', sub: '賛同・立ち上げの手順' },
  { id: 'more', no: 3, icon: 'search', title: 'もっと詳しく', sub: 'ひな形・AI・サイトの違い' },
  { id: 'act', no: 4, icon: 'send', title: '署名する・公開する', sub: '最後の確認' },
];

// ---- ① 3分でわかる ----

export const WHAT_IS: {
  text: string;
  flow: PubcomFigItem[];
  points: { icon: IconName; text: string; link?: { label: string; to: string } }[];
} = {
  text: '署名は、同じ考えの人の声を集めて、行政機関や企業などに要望を届ける方法です。',
  flow: [
    { icon: 'bulb', label: '問題を知る' },
    { icon: 'heart', label: '賛同を集める' },
    { icon: 'send', label: '署名を提出する' },
    { icon: 'check', label: '回答を確かめる' },
  ],
  points: [
    { icon: 'check', text: 'VoiceもChange.orgも、署名は無料です。寄付や有料の拡散支援は任意で、しなくても署名は有効です。' },
    { icon: 'alert', text: '署名が集まっても、要望が実現するとは限りません。' },
    {
      icon: 'info',
      text: 'オンライン署名は、議会への請願・陳情や、法律にもとづく署名とは別のものです。提出先によっては、紙の署名や決まった様式が必要です。',
      link: { label: '違いを見る', to: 'kinds' },
    },
  ],
};

// ---- ② やってみよう ----

/** A 署名に賛同する */
export const JOIN_STEPS: SignatureStep[] = [
  {
    no: 1,
    icon: 'search',
    title: '署名を探す',
    text: '署名掲示板で、いま賛同を集めている署名を探せます。',
    links: [{ label: '署名を探す（署名掲示板）', icon: 'search', to: LINKS.shomei, primary: true }],
    notes: ['署名掲示板は、このサイトとは別のサイトです。'],
  },
  {
    no: 2,
    icon: 'clipboard',
    title: '内容を確かめる',
    text: '賛同するかどうかは、自分で決めます。次の5つを確かめましょう。',
    chips: ['何を求めている？', 'だれが始めた？', 'だれに出す？', '根拠や資料は？', 'いつまで募集？'],
    ai: { text: 'わかりにくい署名は、AIにかみくだいてもらえます。', prompt: 'understand' },
  },
  {
    no: 3,
    icon: 'signature',
    title: '署名する',
    text: '署名ページで、名前とメールアドレスを入れて送ります。確認メールのリンクを開くと完了するサイトもあります。',
    notes: [
      'Voice：アカウントがなくても署名できます。ログインしていないときは、確認メールのURLを開くと完了します。',
      'Change.org：初めて賛同すると、アカウントが自動で作られます。確認メールのリンクを押すと、賛同が有効になります。',
    ],
    links: [{ label: '名前の公開・サイトの違い', icon: 'scale', to: 'sites' }],
  },
  {
    no: 4,
    icon: 'check',
    title: '賛同したあと',
    text: '確認メールのリンクを開いたか、もう一度確かめます。広めたいときは、SNSなどで共有できます。',
    notes: ['署名のあとに、寄付や有料の支援の案内が出ることがあります。しなくても署名は有効なので、画面を閉じてかまいません。'],
  },
];

/** B 自分で署名を立ち上げる */
export const START_STEPS: SignatureStep[] = [
  {
    no: 1,
    icon: 'memo',
    title: '何を変えたいか考える',
    text: '次の4つを、短いメモにします。',
    parts: [
      { label: '何が問題？', sub: '困っていること' },
      { label: 'だれに求める？', sub: '市長・会社など' },
      { label: '何をしてほしい？', sub: '具体的な要望' },
      { label: 'なぜ必要？', sub: '理由・根拠' },
    ],
    ai: { text: 'メモをAIに渡すと、署名文の形に整えてくれます。', prompt: 'draft' },
  },
  {
    no: 2,
    icon: 'route',
    title: '署名サイトを選ぶ',
    text: 'Change.orgもVoiceも、無料で署名を立ち上げられます。どちらにも、AIが文章づくりを手伝う機能があります。',
    links: [
      { label: 'Change.orgで署名を始める', icon: 'signature', to: LINKS.changeStart },
      { label: 'VoiceのAIで署名文を作る', icon: 'sparkle', to: LINKS.voiceTop },
      { label: 'サイトの違いを見る', icon: 'scale', to: 'sites' },
    ],
    notes: ['並びは名前順です。このサイトは、どちらの運営者とも関係がありません。'],
  },
  {
    no: 3,
    icon: 'sparkle',
    title: 'VoiceのAIを使ってみよう',
    text: 'Voiceのサイトにある、無料のAI機能です。困っていることを短く書くだけで、タイトルや本文の下書きを作ります。',
    howto: [
      'Voiceのトップページを開き、「変えたいこと・困っていること」に入力する（400文字以内・短くてOK）',
      '「AIで下書きを作る」を押す',
      '追加の質問（4問まで）に、答えられる分だけ答える（飛ばしてもよい）',
      'タイトル・本文・訴え先の候補を読み、事実と違うところを直す',
      '「この文章で署名活動を始める」から登録・ログインして保存し、公開するかを決める',
    ],
    example: '〇〇市の公園の安全対策を改善してほしい',
    notes: [
      'AIフォームは無料です。使えるのは1日3回まで（ログインすると5回まで）です。',
      'AIの文章が、そのまま公開されることはありません。名前・数字・引用・提出先は、自分で確かめて直してから使います。',
    ],
    links: [
      { label: 'VoiceのAIで署名文を作る', icon: 'sparkle', to: LINKS.voiceTop, primary: true },
      { label: 'AIを使わずに作る（Voiceの案内）', icon: 'book', to: OFFICIAL.voiceStart.url },
      { label: 'Change.orgのAIサポート（公式の案内）', icon: 'book', to: OFFICIAL.changeStart.url },
    ],
    sources: [OFFICIAL.voiceAi],
  },
  {
    no: 4,
    icon: 'send',
    title: '公開して広める',
    text: '公開したら、URLを共有して賛同を呼びかけます。',
    flow: [
      { icon: 'clipboard', label: '公開前に確かめる' },
      { icon: 'chat', label: 'URLを共有する' },
      { icon: 'memo', label: '経過を報告する' },
      { icon: 'send', label: '提出して伝える' },
    ],
    links: [{ label: '公開前チェックへ', icon: 'check', to: 'check-start' }],
  },
];

// ---- ③ もっと詳しく ----

export const SIGNATURE_TEMPLATE = {
  title: '署名文のひな形',
  sections: [
    { head: 'タイトル', body: '〇〇の改善を求めます' },
    { head: '提出先', body: '〇〇市長・〇〇担当機関など' },
    { head: '現状と問題', body: '現在、〇〇について次のような課題があります。' },
    { head: '私たちが求めること', body: '〇〇を改善してください。' },
    { head: '理由・根拠', body: '確認できた資料や具体的な状況を書きます。' },
    { head: '署名のお願い', body: 'この要望に賛同していただける方は、署名へのご協力をお願いします。' },
  ],
  note: 'ひな形の内容は架空の例です。事実や根拠は、自分で確かめてから書きます。',
};

export const templateText = () => SIGNATURE_TEMPLATE.sections.map((s) => `【${s.head}】\n${s.body}`).join('\n\n');

export const SIGNATURE_PROMPTS: SignaturePrompt[] = [
  {
    id: 'understand',
    label: '署名の内容を理解したい',
    when: '賛同する前に、何を求める署名なのかを知りたいときに',
    text: `次の署名について、初めての人にもわかるように説明してください。

① 何を求めているか
② だれに求めているか
③ 主張の根拠は何か
④ 事実と意見の区別
⑤ 賛同する前に確認したいこと

URLを開けない場合は、そう伝えてください。わからないことは推測せず「不明」としてください。

【署名のURLか本文】
`,
  },
  {
    id: 'draft',
    label: '自分の署名文を作りたい',
    when: '言いたいことを、署名の文章にまとめたいときに',
    text: `私の考えを、オンライン署名の文章にしてください。

① 問題の背景
② 提出先
③ 具体的な要望
④ 理由と根拠
⑤ 賛同のお願い

簡潔で読みやすく、私の意図を変えずにまとめてください。数字や事実を創作しないでください。足りない情報は【要確認】と書いてください。

【私の考え】
`,
  },
  {
    id: 'research',
    label: '根拠や提出先を調べたい',
    when: '署名文の根拠や、出す相手が正しいかを確かめたいときに',
    text: `次の署名活動について、関連する法律、公式の統計、行政の資料、提出先の権限を調べてください。

一次資料のURLを示し、確認済みのことと未確認のことを分けてください。

【署名の内容】
`,
  },
  {
    id: 'review',
    label: '公開前に確認したい',
    when: '作った署名文を、公開する前に点検したいときに',
    text: `次の署名文を、第三者の立場から点検してください。

① 事実の誤り
② 根拠の不足
③ 提出先は適切か
④ 誤解を招く表現
⑤ 個人情報や名誉・プライバシーへの配慮
⑥ 要望の具体性

問題がある場合は、修正案を示してください。

【署名文】
`,
  },
];

export const DEFAULT_PROMPT: SignaturePromptId = 'understand';

export const findPrompt = (id: SignaturePromptId) => SIGNATURE_PROMPTS.find((p) => p.id === id) ?? SIGNATURE_PROMPTS[0];

export const PROMPT_LEAD = 'コピーした文章をChatGPTなどのAIに貼り付け、【 】の下に自分の内容を書き足して使います。';

export const PROMPT_NOTES = [
  'AIが作った文章は、別のAIでも点検します（④の指示文が使えます）。',
  '法律や数字は、役所の公式ページなどの一次資料で確かめます。',
  '賛同してくれた人の名前や署名簿は、AIに入れないようにします。',
];

/** 署名サイトの違い（同じ項目を同じ順に。並びは名前順） */
export const SITES: { title: string; lead: string; cards: SignatureSite[]; checked: string } = {
  title: '署名サイトの違い',
  lead: '公式の案内をもとに、同じ項目で並べました。並びは名前順です。このサイトは、どちらの運営者とも関係がありません。',
  cards: [
    {
      name: 'Change.org',
      url: 'https://www.change.org/',
      rows: [
        {
          label: '署名のしかた',
          text: '姓・名・メールを入れて賛同。所在地はIPアドレス（ネット上の住所）から自動で入り、直せます。初めてのときはアカウントが自動で作られ、確認メールのリンクで有効になります。',
        },
        {
          label: '名前・コメント',
          text: '名前を表示しない賛同もできます。その場合も、氏名と都市名（または郵便番号）・賛同日は発信者に伝わります。発信者が、提出先に名前とおおよその所在地を伝えることもあります。コメントは署名ページに出て、賛同者リストにも入ります。',
        },
        { label: 'メール', text: 'メールアドレスは発信者に共有されません（発信者が団体のときは、提供するかを選ぶ画面が出ます）。' },
        {
          label: '支援のお金',
          text: '有料の「プロモーション支援」（1回払い）のお金はChange.orgに支払われ、発信者には渡りません。そのあと毎月払いの「月額会員」の案内が出ることがあります（解約はアカウント設定から）。払わなくても賛同は有効です。',
        },
        { label: 'AIの手伝い', text: '「AIサポート機能」が、タイトル・本文・画像の下書きを提案します。自分で書くこともできます。' },
        { label: '署名簿', text: '賛同者リストを表のファイル（CSV）でダウンロードできます（立ち上げて24時間後から）。提出は発信者が行います。' },
        { label: 'やめるとき', text: '「終了」で受付を止められます（ページは残り、再開もできます）。削除はサポートへの依頼が必要で、元に戻せません。' },
        { label: '運営', text: 'Change.org, PBC（アメリカ）' },
      ],
    },
    {
      name: 'Voice',
      url: 'https://voice.charity/',
      rows: [
        { label: '署名のしかた', text: '名前とメールを入れて署名。アカウントがなくても署名でき、ログインしていないときは確認メールのURLを開くと完了します。' },
        {
          label: '名前・コメント',
          text: '名前を非公開にできます。非公開でも、発起人が管理する署名簿には名前が載ります（署名日なども。住所を集める活動では都道府県・市区町村も）。応援メッセージは、公開を選んだときだけページに出ます（発起人は読めます）。',
        },
        { label: 'メール', text: '署名簿に載るのは、メールアドレスの先頭3文字だけです。全体は発起人に渡りません。' },
        {
          label: '支援のお金',
          text: '「エール」（寄付）は任意です。寄付を募っている活動では、手数料（システム利用料25%など）を引いて発起人に届きます。寄付を募っていない活動への寄付は、Voiceの運営が受け取ります。カードで寄付すると、寄付額とは別に110円がかかる活動があります。寄付は原則として返金されません。',
        },
        { label: 'AIの手伝い', text: '「AIフォーム」が、タイトル・本文・訴え先などの下書きを作ります。無料で、1日3回まで（ログインすると5回まで）。' },
        { label: '署名簿', text: '発起人のマイページから、署名簿をPDFかCSVで出せます。提出は発起人が行います。' },
        { label: 'やめるとき', text: '非公開や削除ができます。ただし、署名が10人以上集まった活動や、寄付があった活動は、非公開・削除ができません。' },
        { label: '運営', text: '一般社団法人Social Good（日本）' },
      ],
    },
  ],
  checked: `${CHECKED_DATE}に、各サイトの公式ヘルプ・利用規約・プライバシーポリシーで確かめました。変わることがあるので、使う前に公式の案内も見てください。`,
};

/** オンライン署名・請願・法律にもとづく署名の違い */
export const KINDS: { title: string; cards: { icon: IconName; title: string; sub?: string; points: string[] }[]; links: { label: string; url: string }[] } = {
  title: '3つの「署名」の違い',
  cards: [
    {
      icon: 'signature',
      title: 'オンライン署名',
      sub: 'Voice・Change.orgなど',
      points: ['だれでも無料で始められ、賛同できる', '集めた署名は、発起人が自分で提出先に届ける', '扱いは提出先しだい。自筆の署名や決まった様式を求められることもある'],
    },
    {
      icon: 'petition',
      title: '請願・陳情',
      sub: '議会に出す',
      points: ['署名簿は必須ではない。署名を添えることもできる', '請願は議員の紹介が必要（陳情はいらない）', '議会で審査される（陳情の扱いは議会しだい）'],
    },
    {
      icon: 'scale',
      title: '法律にもとづく署名',
      sub: '直接請求',
      points: [
        '条例をつくる・変えることなどを求める、地方自治法の手続き',
        '有権者の50分の1以上（議会の解散などは原則3分の1以上）の署名が必要',
        '決められた署名簿に、有権者本人が自分で書く。選挙管理委員会が確かめる',
      ],
    },
  ],
  links: [OFFICIAL.soumu, OFFICIAL.law, OFFICIAL.seiganLaw],
};

export const FAQ: { q: string; a: string }[] = [
  {
    q: '署名にお金はかかる？',
    a: 'VoiceもChange.orgも、署名は無料です。Voiceの「エール」（寄付）や、Change.orgの「プロモーション支援」は任意で、しなくても署名は有効です。払うときは、画面に出る届け先と金額を確かめます。Change.orgの「月額会員」は毎月の支払いで、アカウント設定から解約できます。',
  },
  {
    q: '本名で署名しなければいけない？',
    a: 'どちらのサイトも、本名でなくても署名できると案内しています。ただし、提出先によっては、本名や住所のある署名を求められることがあります。',
  },
  {
    q: '名前は公開される？',
    a: '名前を公開しない設定にできます。ただし、公開しなくても発起人には伝わります。Voiceでは提出用の署名簿に名前が載り、Change.orgでは氏名と都市名などが発信者に伝わります。',
  },
  {
    q: 'メールが届かないときは？',
    a: '迷惑メールのフォルダと、入力したメールアドレスのまちがいを確かめます。Voiceは、同じ名前とメールアドレスでもう一度送ると確認メールが再送されます。携帯電話会社のメールは届きにくいことがあるので、別のアドレスを使う方法もあります。',
  },
  {
    q: '署名を取り消せる？',
    a: 'できます。Voiceは署名完了メールの専用リンクから（受付が終わったあとはできないことがあります）。Change.orgは賛同したときのメールのリンクから（30日間。過ぎたらヘルプに問い合わせ）。署名を取り消しても、済んだ寄付は取り消されません。',
  },
  { q: '署名が集まったら、必ず実現する？', a: 'いいえ。署名は「これだけの人が望んでいる」と伝えるものです。実現するかどうかは、提出先が判断します。' },
  {
    q: 'オンライン署名は、行政や議会に受け付けてもらえる？',
    a: '要望書や請願・陳情に、参考として添えることはできます。ただし、自筆の署名や決まった様式を求める提出先もあります。法律にもとづく署名（直接請求）は、本人が署名簿に自分で書く決まりなので、オンライン署名では代わりになりません。',
  },
  {
    q: 'AIが作った文章を、そのまま使っていい？',
    a: 'おすすめしません。事実・数字・提出先を自分で確かめて直します。VoiceもChange.orgも、AIの下書きを確かめて直すよう案内しています。',
  },
  {
    q: '紙の署名との違いは？',
    a: '紙の署名は、名前や住所を自分で書いてもらいます。提出先が自筆や決まった様式を求めるときや、法律にもとづく署名を集めるときは、紙の署名簿を使います。',
  },
];

/** このページの出典（すべて公式の案内） */
export const SOURCES = {
  checked: `確認日：${CHECKED_DATE}`,
  links: [
    OFFICIAL.voiceSign,
    OFFICIAL.voiceName,
    OFFICIAL.voiceShare,
    OFFICIAL.voiceCancel,
    OFFICIAL.voiceMail,
    OFFICIAL.voiceYell,
    OFFICIAL.voiceDonate,
    OFFICIAL.voiceReceive,
    OFFICIAL.voiceAi,
    OFFICIAL.voiceStart,
    OFFICIAL.voiceSubmit,
    OFFICIAL.voicePublish,
    OFFICIAL.voiceTos,
    OFFICIAL.changeSign,
    OFFICIAL.changeConfirm,
    OFFICIAL.changePrivacy,
    OFFICIAL.changeRemove,
    OFFICIAL.changePromote,
    OFFICIAL.changeMember,
    OFFICIAL.changeStart,
    OFFICIAL.changeDownload,
    OFFICIAL.changeClose,
    OFFICIAL.changeLegal,
    OFFICIAL.changePolicy,
    OFFICIAL.soumu,
    OFFICIAL.law,
    OFFICIAL.seiganLaw,
  ],
};

// ---- ④ 署名する・公開する ----

export const JOIN_CHECKLIST = ['内容と提出先を確かめた', '発起人を確かめた', '名前などがどこまで伝わるか確かめた', '寄付は任意だとわかった', '自分の意思で賛同する'];

export const JOIN_DONE = 'すべて確認できました。納得できたら、署名しましょう。';

export const START_CHECKLIST = [
  '要望が具体的になっている',
  '提出先が適切',
  '数字・法律・出典を確かめた',
  '個人情報や画像の権利を確かめた',
  '募集期限・寄付の設定を確かめた',
  '署名の提出方法を確かめた',
];

export const START_DONE = 'すべて確認できました。公開して、賛同を呼びかけましょう。';

export const AFTER_PUBLISH = [
  '賛同してくれた人に、進み具合や新しい情報を報告します。',
  '集まった署名は、サイトから署名簿（賛同者リスト）をダウンロードして、発起人が自分で提出先に届けます。',
  '届ける前に、提出先が受け付ける様式や受け取り方を確かめます。',
  '提出したことや、その後の回答・対応も、賛同した人に伝えます。',
  'Voiceで寄付（エール）を受け取るには、署名の提出・完了報告・本人確認などが必要です。募集が終わってから90日以内に入金を申請します。',
];

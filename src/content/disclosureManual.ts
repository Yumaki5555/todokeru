// 情報公開請求（#/guide/disclosure）の文章と、AIへの指示文
// ページに出す言葉と指示文はこのファイルにまとめる（直すときはここだけ見ればよい）。
// 用語：画面では原則「文書」。国の「行政文書」、東京都などの「公文書」は、法律名・正式な様式・説明の中でだけ使う。「非公開」ではなく「不開示」。
// 制度の説明は、次の公式資料で確かめた（2026年11月4日）。国のルールと自治体のルールを混ぜないこと。
//   ・行政機関情報公開法：第3条 何人も／第4条 請求書の記載・補正／第5条 不開示情報／第6条 部分開示／第8条 存否応答拒否
//     第9条第2項 全部を開示しないとき（存否の拒否・保有していないときを含む）は不開示決定／第10条 30日以内・30日以内の延長（補正の日数は数えない）
//     第11条 著しく大量のときの特例／第12条 移送／第13条 第三者の意見書／第14条 開示の実施・申出は通知から30日以内／第19条 審査会への諮問／第22条 情報の提供
//   ・同法施行令 第13条：請求手数料 1件300円（オンライン200円）、収入印紙。開示実施手数料は請求手数料の額に達するまで無料
//   ・行政不服審査法 第18条：知った日の翌日から3か月（知らなくても処分の翌日から1年）
//   ・独立行政法人等情報公開法 第3条（法人文書）／裁判所・衆議院・参議院は、それぞれの案内で独自の手続きを確認
//   ・東京都の案内：公文書／請求から14日以内／閲覧のみは無料、写しは費用（都の例としてだけ示す）
import type { GuidePart, PubcomFigItem } from '../types';

export const DISCLOSURE_GUIDE = {
  title: '情報公開請求',
  subtitle: '行政が持つ文書を、自分で確かめる。',
};

/** ページの4つの入り口 */
export const DISCLOSURE_PARTS: GuidePart[] = [
  { id: 'sanpun', no: 1, icon: 'bulb', title: '3分でわかる', sub: 'どんな制度で、何がわかるか', short: 'わかる' },
  { id: 'request', no: 2, icon: 'memo', title: '請求してみよう', sub: '文書を探す・書く・AIに頼む', short: '請求する' },
  { id: 'more', no: 3, icon: 'search', title: 'もっと詳しく', sub: '法律・費用・審査請求', short: '詳しく', optional: true },
  { id: 'submit', no: 4, icon: 'send', title: '提出する・結果を確認する', sub: '提出先・確認・結果', short: '提出・結果' },
];

const LAWS = {
  act: { label: '行政機関情報公開法（e-Gov法令検索）', url: 'https://laws.e-gov.go.jp/law/411AC0000000042' },
  order: { label: '同法の施行令（e-Gov法令検索）', url: 'https://laws.e-gov.go.jp/law/412CO0000000041' },
  corporate: { label: '独立行政法人等情報公開法（e-Gov法令検索）', url: 'https://laws.e-gov.go.jp/law/413AC0000000140' },
  appeal: { label: '行政不服審査法（e-Gov法令検索）', url: 'https://laws.e-gov.go.jp/law/426AC0000000068' },
};

/** 公式の案内 */
export const OFFICIAL = {
  windows: { label: '情報公開窓口一覧（e-Gov）', url: 'https://administrative-doc.e-gov.go.jp/contents/disclosure', desc: '国の行政機関の請求窓口（公式）' },
  procedure: { label: '情報公開手続の案内（e-Gov）', url: 'https://administrative-doc.e-gov.go.jp/contents/help/guide/disclosure-request.html', desc: '請求の流れとオンライン請求（公式）' },
  registry: { label: '行政文書ファイル管理簿の検索（e-Gov）', url: 'https://administrative-doc.e-gov.go.jp/' },
  registryHelp: { label: '検索のしかた（e-Gov）', url: 'https://administrative-doc.e-gov.go.jp/contents/help/guide/search.html' },
  corporateRegistry: { label: '法人文書ファイル管理簿（e-Gov）', url: 'https://administrative-doc.e-gov.go.jp/contents/corporate-document' },
  clb: { label: '情報公開制度の利用案内（内閣法制局の例）', url: 'https://www.clb.go.jp/contact/disclosure/guide/' },
  tokyo: { label: '公文書の開示請求の流れ（東京都の例）', url: 'https://www.soumu.metro.tokyo.lg.jp/01soumu-johokokaika/kaijiseikyu/kaiji-nagare' },
  ppc: { label: '個人情報保護法ガイドライン 行政機関等編（個人情報保護委員会）', url: 'https://www.ppc.go.jp/personalinfo/legal/guidelines_administrative/' },
  courts: { label: '司法行政文書開示手続（裁判所）', url: 'https://www.courts.go.jp/about/jouhoukoukai_kojinjouhouhogo/sihougyouseibunsyokaijitetuduki/index.html' },
  shugiin: { label: '情報公開（衆議院）', url: 'https://www.shugiin.go.jp/internet/itdb_annai.nsf/html/statics/osirase/jyouhoukoukai.htm' },
  sangiin: { label: '情報公開（参議院）', url: 'https://www.sangiin.go.jp/jpn/annai/johokoukai/seido.html' },
};

// ---- ① 3分でわかる ----

export const WHAT_IS = {
  title: '情報公開請求ってなに？',
  lead: '行政が持っている文書を、見せてもらうための制度です。',
  flow: [
    { icon: 'question', label: '知りたいことがある' },
    { icon: 'search', label: '文書を探す' },
    { icon: 'send', label: '開示を請求' },
    { icon: 'folder', label: '結果を受け取る' },
  ] as PubcomFigItem[],
};

/** 何がわかる？（doc は対象になりそうな文書の例。あるとは限らない） */
export const WHAT_YOU_LEARN: (PubcomFigItem & { doc: string })[] = [
  { icon: 'list', label: '予算・支出', sub: '事業にいくら使った？', doc: '例：予算書、支出の記録' },
  { icon: 'form', label: '契約', sub: 'どんな契約を結んだ？', doc: '例：契約書、仕様書' },
  { icon: 'clipboard', label: '許認可', sub: 'どんな書類で審査した？', doc: '例：申請書、審査の記録' },
  { icon: 'comment', label: '会議', sub: '何を話し合った？', doc: '例：会議の資料、議事録' },
  { icon: 'landmark', label: '政策', sub: 'どう決めた？', doc: '例：検討の資料、決裁の文書' },
];

export const WHAT_YOU_LEARN_NOTE = '「例」は、対象になりそうな文書です。実際にあるとは限りません。';

export const KNOW_POINTS: PubcomFigItem[] = [
  { icon: 'user', label: '原則、だれでも請求できる', sub: '国の法律では「何人も」。自治体は条例で確かめます。' },
  { icon: 'alert', label: '全部見られるとは限らない', sub: '個人情報などは、不開示になることがあります。' },
  { icon: 'print', label: '費用がかかることがある', sub: '手数料やコピー代です。額は請求先で確かめます。' },
];

/** 開いたときだけ見せる注意 */
export const KNOW_MORE = {
  title: 'ほかに知っておきたいこと',
  items: [
    { icon: 'folder', label: '文書がないこともある', sub: 'ないものは、見せてもらえません。' },
    { icon: 'question', label: '質問とは違う', sub: '説明を求めるのではなく、ある文書を見せてもらう手続きです。' },
    { icon: 'shield', label: '自分の個人情報は別の制度', sub: '自分の情報を見たいときは、個人情報の開示請求を使います。' },
  ] as PubcomFigItem[],
};

export const KNOW_SOURCES = [LAWS.act, OFFICIAL.ppc];

// ---- ② 請求してみよう ----

export type RequestStart = '' | 'known' | 'unknown';
export const REQUEST_STARTS: { id: Exclude<RequestStart, ''>; mark: string; label: string }[] = [
  { id: 'known', mark: 'A', label: '欲しい文書が決まっている' },
  { id: 'unknown', mark: 'B', label: '何を請求すればよいかわからない' },
];
export const REQUEST_START_RESULT = {
  known: 'STEP 2 の4つを確かめて、書き方へ進みましょう。',
  unknown: '大丈夫です。知りたいことをAIに伝えると、文書の候補を整理できます。候補は、公式の資料で確かめます。',
};

/** STEP 2 の4つの確認項目 */
export const FIND_POINTS: PubcomFigItem[] = [
  { icon: 'question', label: '何について？', sub: '例：外国語支援事業' },
  { icon: 'clock', label: 'いつの文書？', sub: '例：令和7年度' },
  { icon: 'building', label: 'どこの行政機関？', sub: '例：○○市' },
  { icon: 'form', label: 'どんな種類の文書？', sub: '例：委託契約書・仕様書' },
];
export const FIND_EXAMPLE = '○○市の令和7年度の外国語支援事業に関する委託契約書・仕様書';

export const FIND_MORE = {
  title: '文書名がわからないときは？',
  items: [
    '文書名がわからなくても、事業名・年度・内容から絞れます。',
    '国の文書は「行政文書ファイル管理簿」で探せます。',
    '自治体は「公文書目録」や公式サイトで探します。名前や公開の有無は、自治体ごとに違います。',
    'すでに公表されている資料や、担当部署からの任意の情報提供で手に入ることもあります。請求の前に確かめましょう。',
  ],
};

export const COMPARE = {
  weak: {
    title: '特定しにくい書き方',
    quote: '○○事業について全部公開してください。',
    points: ['どの文書か決めにくい', '期間がわからない', '範囲が広すぎる'],
  },
  strong: {
    title: '特定しやすい書き方',
    quote: '令和7年度○○事業について、市が保有する委託契約書および業務仕様書',
    points: ['事業名がある', '年度がある', '文書の種類がある'],
  },
  unsure: '文書名を断定できないときは、「○○事業の委託先の選び方がわかる文書」のように、内容で書きます。',
};

/** 請求文の基本ひな形（コピーできる） */
export const REQUEST_TEMPLATE = {
  title: '基本のひな形',
  parts: [
    { label: '【開示を請求する文書】', lines: ['対象：○○事業', '期間：令和○年度', '文書：○○に関する契約書・仕様書など、対象を特定できる文書'] },
    { label: '【希望する開示方法】', lines: ['閲覧または写しの交付（対応可能な方法を確認）'] },
  ],
  notes: [
    '実際の提出では、請求先の指定様式を優先します。国は「行政文書」、東京都などは「公文書」と呼ぶので、様式の言葉に合わせます。',
    '氏名・住所などは、公式の請求書に記入します。このサイトでは集めません。',
  ],
};
export const templateText = () => REQUEST_TEMPLATE.parts.map((p) => `${p.label}\n${p.lines.join('\n')}`).join('\n\n');

export type DisclosurePromptId = 'find' | 'write' | 'deep' | 'check' | 'recheck';

/** AIへの指示文。選択肢の並び順もこの順 */
export const DISCLOSURE_PROMPTS: { id: DisclosurePromptId; label: string; when: string; text: string }[] = [
  {
    id: 'find',
    label: '請求する文書を探したい',
    when: '何を請求すればよいかわからないときに',
    text: `次の疑問を調べるため、行政機関に情報公開請求する文書の候補を整理してください。

① 知りたいこと
② 文書を保有している可能性のある行政機関
③ 対象文書の種類・名称の候補
④ 対象年度・期間
⑤ 公開済み資料の探し方
⑥ 担当窓口に事前確認すること

存在を確認できない文書は「候補・未確認」としてください。
公式の出典URLを優先してください。
存在しない文書名や請求窓口を創作しないでください。

【調べたいこと】


【国・自治体名】

`,
  },
  {
    id: 'write',
    label: '請求文を作りたい',
    when: '知りたいことを、請求書に書く文章にしたいときに',
    text: `次の情報から、開示請求書の「請求する文書の名称または内容」欄に記入する文章を作成してください。
文書の呼び方は請求先で違います（例：国は「行政文書」、東京都は「公文書」）。提出先の呼び方に合わせてください。

① 対象事業
② 対象年度・期間
③ 求める文書
④ 文書の対象範囲

担当者が文書を特定しやすい、具体的で簡潔な文章にしてください。
存在が確認できない文書名を断定しないでください。
提出先の正式な様式に合うか確認すべき点も示してください。

【知りたいこと】


【対象機関・事業】


【期間】


【参考資料】

`,
  },
  {
    id: 'deep',
    label: 'もっと詳しく調べたい',
    when: '請求の前に、公開済みの資料や制度を調べたいときに',
    text: `次の情報公開請求について、請求前に詳しく調べてください。

① 公開済みの関連資料
② 行政文書ファイル管理簿・公文書目録の情報
③ 関連する法令・条例
④ 所管部署と文書の保有機関
⑤ 過去に公開された同種の文書
⑥ 追加請求すると役立つ文書
⑦ 請求範囲が広すぎないか

国の法律と自治体の条例を混同しないでください。
公式一次資料を優先し、名称・URL・確認日を示してください。
確認済み・推定・不明を区別してください。

【調べたい内容】


【請求先】

`,
  },
  {
    id: 'check',
    label: '提出前に確認したい',
    when: '提出する前に、抜けや誤りを点検したいときに',
    text: `次の情報公開請求案を点検してください。

① 提出先は適切か
② 求めるものが既存の文書か
③ 文書を特定できるか
④ 期間・年度が明確か
⑤ 対象が広すぎないか
⑥ 国の法律または自治体の条例に合っているか
⑦ 手数料・提出方法・指定様式を確認しているか
⑧ 個人情報の扱いに問題がないか

問題を「修正必須」「要確認」「改善案」に分けて示してください。
不明な制度や手数料を推測しないでください。

【提出先の公式案内】


【請求案】

`,
  },
  {
    id: 'recheck',
    label: '別のAIで再確認したい',
    when: '別のAIが作った案を、もう一度確かめたいときに',
    text: `別のAIが作成した情報公開請求案を、独立して検証してください。

文書名、法令、提出先、手数料、請求方法、対象期間、公開済み資料の有無を確認してください。
前のAIの判断を正しいと仮定せず、公式一次資料と照合してください。
結果は「確認済み」「誤りの疑い」「未確認」に区分し、根拠URLを示してください。

【前のAIによる請求案】


【請求先】


【公式資料】

`,
  },
];

export const DEFAULT_DISCLOSURE_PROMPT: DisclosurePromptId = 'find';

/** AIを使うときの注意（個人情報の注意は、指示文の枠の中に出る） */
export const AI_NOTES = ['AIの回答は、必ず公式資料で確かめます。', '2つ以上のAIを使っても、正しさは保証されません。', '実際の請求は、本人が公式の窓口で行います。'];

/** AIを使ったあと、続きへ戻る */
export const AI_RETURN = {
  text: 'AIの答えを確かめたら、続きへ',
  links: [
    { id: 'step2', label: 'STEP 2 に戻る' },
    { id: 'step3', label: 'STEP 3 に戻る' },
  ],
};

// ---- ③ もっと詳しく ----

export interface DisclosureTopic {
  id: string;
  icon: GuidePart['icon'];
  title: string;
  lead: string;
  rows: { label: string; text: string }[];
  links?: { label: string; url: string }[];
  prompt?: { text: string; id: DisclosurePromptId };
}

export const MORE_TOPICS: DisclosureTopic[] = [
  {
    id: 'more-law',
    icon: 'scale',
    title: '国の情報公開法と自治体の条例',
    lead: '請求先によって、法律やルールが違います。',
    rows: [
      { label: '国の行政機関', text: '行政機関情報公開法で決まっています。' },
      { label: '独立行政法人など', text: '別の法律（独立行政法人等情報公開法）が使われます。' },
      { label: '国会・裁判所', text: '行政機関情報公開法の対象外です。それぞれ別の手続きがあります。' },
      { label: '都道府県・市区町村', text: 'それぞれの条例などで決めています。請求できる人・費用・日数も違います。' },
    ],
    links: [LAWS.act, LAWS.corporate, OFFICIAL.courts, OFFICIAL.shugiin, OFFICIAL.sangiin],
  },
  {
    id: 'more-registry',
    icon: 'folder',
    title: '行政文書ファイル管理簿の探し方',
    lead: '国の機関が持つ文書ファイルの一覧です。e-Govで検索できます。',
    rows: [
      { label: 'ことばで探す', text: '事業名などをスペースで区切って入れます（60文字以内）。' },
      { label: '条件で絞る', text: '「条件検索」で、作成・取得の年度や、作成・取得者などを指定できます。' },
      { label: '請求に使う', text: '見つかったファイルの名前を、文書を特定する手がかりにします。' },
      { label: '載っていないとき', text: '検索の対象は保存期間1年以上のものです。載っていなくても、文書がないとは限りません。' },
      { label: '独立行政法人など', text: '「法人文書ファイル管理簿」で探します。' },
    ],
    links: [OFFICIAL.registry, OFFICIAL.registryHelp, OFFICIAL.corporateRegistry],
  },
  {
    id: 'more-notfound',
    icon: 'search',
    title: '文書が見つからないとき',
    lead: '文書名がわからなくても、請求はできます。',
    rows: [
      { label: '公開済みを探す', text: '公式サイトで、事業名と年度で探します。' },
      { label: '担当部署に尋ねる', text: '「○○の内容がわかる文書は、どんな名前ですか」と尋ねられます。国の法律は、文書の特定に役立つ情報を提供するよう定めています（第22条）。' },
      { label: '内容で書く', text: '国の法律は、文書の名称のほか、特定できる事項での請求を認めています（第4条）。' },
    ],
    prompt: { text: '文書の候補を整理する', id: 'find' },
  },
  {
    id: 'more-kinds',
    icon: 'list',
    title: '不開示・一部開示・文書不存在の違い',
    lead: '国の法律での整理です。自治体は条例で確かめます。',
    rows: [
      { label: '不開示になる情報', text: '特定の個人がわかる情報や、公開すると法人の正当な利益・国の安全・犯罪捜査・検討や事務の進め方に支障が出るおそれのある情報などです（第5条）。' },
      { label: '一部開示', text: '不開示の部分を容易に分けられるときは、残りを開示します（第6条）。' },
      { label: '文書不存在', text: '文書を持っていないときです。法律上は不開示決定の一つです（第9条第2項）。これだけで「文書を隠している」とは言えません。' },
      { label: '存否応答拒否', text: 'あるかどうかを答えるだけで不開示の情報がわかるときは、答えないで請求を拒否できます（第8条）。これも不開示決定の一つです。' },
    ],
    links: [LAWS.act],
  },
  {
    id: 'more-fee',
    icon: 'clock',
    title: '手数料・開示方法・決定までの期間',
    lead: 'まず国のルールです。自治体は額も日数も違います。',
    rows: [
      { label: '請求の手数料（国）', text: '文書1件につき300円です。オンライン請求は200円ですが、対応しているのは一部の機関です。原則、収入印紙で納めます。' },
      { label: '開示の手数料（国）', text: '閲覧やコピーの費用です。請求の手数料の額までは無料で、郵送は送料が別にかかります。' },
      { label: '開示の方法（国）', text: '閲覧または写しの交付などです。決定通知から30日以内に、希望の方法を申し出ます（第14条）。' },
      { label: '決定まで（国）', text: '請求から30日以内です。請求書を直す日数は数えません。30日まで延長されることがあり、文書が著しく大量なら、さらにかかることもあります（第10条・第11条）。' },
      { label: '自治体の例：東京都', text: '請求から14日以内に決定します（延長あり）。閲覧のみは無料で、写しには費用がかかります。' },
    ],
    links: [LAWS.act, LAWS.order, OFFICIAL.procedure, OFFICIAL.clb, OFFICIAL.tokyo],
  },
  {
    id: 'more-appeal',
    icon: 'form',
    title: '不開示決定への審査請求',
    lead: '決定に納得できないとき、見直しを求める手続きです。',
    rows: [
      { label: '出す先', text: '決定通知に書かれた案内で確かめます。' },
      { label: '期限', text: '行政不服審査法では、原則、決定を知った日の翌日から3か月です（第18条）。実際の期限は、決定通知と適用される法令で確かめます。' },
      { label: 'そのあと（国）', text: '原則、第三者の審査会（情報公開・個人情報保護審査会）に意見を求めたうえで判断されます（第19条）。' },
      { label: '裁判', text: '裁判で取り消しを求める方法もあります。決定通知の案内を確かめます。' },
    ],
    links: [LAWS.appeal, LAWS.act],
  },
  {
    id: 'more-use',
    icon: 'bulb',
    title: '開示資料を次の質問・パブコメ・請願などに活用する方法',
    lead: '受け取った文書は、次の一歩の材料になります。',
    rows: [
      { label: '質問する', text: '文書の名前とページを示すと、具体的に尋ねられます。' },
      { label: 'パブコメ・請願', text: '事実の根拠として、文書の名前・日付・機関を示します。' },
      { label: '保管する', text: '請求書の控え・決定通知・受け取った文書を、一緒に保管します。' },
      { label: '気をつける', text: '他の人の情報が含まれていたら、広めないようにします。' },
    ],
  },
];

// ---- ④ 提出する・結果を確認する ----

export type DisclosureWhere = '' | 'national' | 'pref' | 'muni';
export const WHERE_CHOICES: { id: Exclude<DisclosureWhere, ''>; icon: GuidePart['icon']; label: string }[] = [
  { id: 'national', icon: 'landmark', label: '国の行政機関' },
  { id: 'pref', icon: 'map', label: '都道府県' },
  { id: 'muni', icon: 'building', label: '市区町村' },
];

/** 提出先で東京都を選んだときだけ出す案内 */
export const TOKYO_LINK = { label: '公文書の開示請求の流れ（東京都）', url: OFFICIAL.tokyo.url };

export const WHERE_TEXT = {
  nationalOther: '国会・裁判所・独立行政法人などは、別の法律や手続きです。',
  localContact: '窓口検索に載っているのは、情報公開の担当部署を尋ねるための連絡先です。正式な請求の受付窓口ではありません（「確認済み」の表示も、連絡先についての確認です）。',
  localOfficial: (who: string) => `正式な請求先・提出方法は、${who}の公式サイトで確かめます。「情報公開 開示請求」で探せます。`,
  mail: 'メールアドレスが公開されていても、正式な請求をメールで受け付けるとは限りません。',
};

export const DISCLOSURE_CHECKLIST = [
  '請求先を確認した',
  '文書の対象と期間を明確にした',
  '公式の様式を確認した',
  '正式な提出方法を確認した',
  '手数料・交付費用を確認した',
  '必要な記載事項を確認した',
  '自分の請求内容を保存した',
];

export const AFTER_FLOW: PubcomFigItem[] = [
  { icon: 'send', label: '請求' },
  { icon: 'letter', label: '決定通知', sub: '開示・不開示など' },
  { icon: 'form', label: '開示方法の手続' },
  { icon: 'folder', label: '文書を受け取る' },
];

export const AFTER_FLOW_NOTE = '決定通知と文書の受け取りは、別の手続きのことがあります。通知の案内を確かめます。';

/** 決定の結果（基本の3種類） */
export const RESULTS: PubcomFigItem[] = [
  { icon: 'check', label: '全部開示', sub: '文書のすべてを見られます。' },
  { icon: 'list', label: '一部開示', sub: '一部を除いて、残りを見られます。' },
  { icon: 'cross', label: '不開示', sub: '文書を見られません。文書がない場合（文書不存在）や、あるかどうかを答えない場合（存否応答拒否）も含みます。' },
];

/** 3種類は国の法律での分け方 */
export const RESULT_SCOPE = '国の法律での分け方です。自治体では、呼び方や扱いが違うことがあります。';

export const RESULT_NOTE = '一部開示・不開示のときは、決定通知の理由と審査請求の案内を確かめます。期限も通知で確認します。';

/** 手続きの途中で起こること（結果ではない） */
export const DURING = {
  title: '途中で届くことがある通知',
  rows: [
    { label: '補正のお願い', text: '請求書に不備があると、直すよう求められることがあります。' },
    { label: '延長の通知', text: '決定まで時間がかかるとき、新しい期限と理由が知らされます。' },
    { label: '事案の移送', text: '別の機関が決定するほうがよいとき、そちらへ移されることがあります（第12条）。' },
    { label: '第三者への意見照会', text: '文書に会社など第三者の情報があると、その相手に意見を聞くことがあります（第13条）。' },
  ],
  note: '条文は国の法律です。自治体は条例で確かめます。',
};

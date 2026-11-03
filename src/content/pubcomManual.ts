// パブコメの書き方（#/guide/public-comment）の文章と、AIへの指示文
// ページに出す言葉と指示文はこのファイルにまとめる（直すときはここだけ見ればよい）。
// 制度の説明は、e-Gov「パブリック・コメント制度について」と行政手続法 第6章（第38条〜第45条）・第46条で確かめた（2026年11月3日）。
//   ・意見の数ではなく内容を考慮する（e-Gov）　・案の公示から30日以上（第39条）　・提出意見を十分に考慮（第42条）
//   ・結果と考え方を公示。意見は整理・要約して公示できる（第43条）　・自治体は第6章の対象外で、趣旨にのっとり措置に努める（第3条第3項・第46条）
import type { GuidePart, PromptId, PubcomAiStep, PubcomFigItem, PubcomPrompt, PubcomResearch, PubcomStep } from '../types';
import { SITE } from '../site';

export const PUBCOM_GUIDE = {
  title: 'パブコメの書き方',
  subtitle: '自分の意見を、伝わる形に。',
};

export const EGOV_PUBCOM = { label: 'e-Govパブリック・コメント', url: 'https://public-comment.e-gov.go.jp/', desc: '国の募集中の案件と結果（公式）' };

/** ページの4つの入り口 */
export const PUBCOM_PARTS: GuidePart[] = [
  { id: 'sanpun', no: 1, icon: 'bulb', title: '3分でわかる', sub: 'しくみと書き方の基本', short: 'わかる' },
  { id: 'ai', no: 2, icon: 'sparkle', title: 'AIを使ってみよう', sub: '目的別の指示文をコピー', short: 'AIを使う' },
  { id: 'research', no: 3, icon: 'search', title: 'もっと詳しく調べる', sub: '法律・統計・他の自治体', short: '調べる', optional: true },
  { id: 'submit', no: 4, icon: 'send', title: '提出する', sub: '確認・提出・結果', short: '提出する' },
];

// ---- ① 3分でわかる ----

export const WHAT_IS = {
  title: 'パブコメってなに？',
  lead: '国や自治体が制度やルールを決める前に、私たちが意見を届ける仕組みです。',
  flow: [
    { icon: 'comment', label: '案を公開', sub: '行政' },
    { icon: 'send', label: '意見を提出', sub: '住民など' },
    { icon: 'scale', label: '意見を検討', sub: '行政' },
    { icon: 'clipboard', label: '結果と考え方を公表', sub: '行政' },
  ] as PubcomFigItem[],
  facts: [
    { icon: 'scale', label: '多数決ではない', sub: '意見の数ではなく、内容が考慮されます。' },
    { icon: 'info', label: '採用されるとは限らない', sub: '具体的な意見でも、そのまま反映されるとは限りません。' },
    { icon: 'chat', label: '個別の返事は約束されていない', sub: '行政の考え方は、ふつう、まとめて公表されます。' },
    { icon: 'building', label: '国と自治体でルールが違う', sub: '国は行政手続法、自治体はそれぞれの条例などで決めています。' },
    { icon: 'user', label: '住民以外も出せることがある', sub: 'だれが出せるかは、募集要項で確かめます。' },
    { icon: 'alert', label: '募集の対象に沿って書く', sub: '対象と関係ない内容は、意見として扱われないことがあります。' },
  ] as PubcomFigItem[],
  sources: [
    { label: 'パブリック・コメント制度について（e-Gov）', url: 'https://public-comment.e-gov.go.jp/contents/about-public-comment/' },
    { label: '行政手続法 第6章（e-Gov法令検索）', url: 'https://laws.e-gov.go.jp/law/405AC0000000088' },
  ],
};

export const PUBCOM_STEPS: PubcomStep[] = [
  {
    no: 1,
    icon: 'user',
    title: '自分の立場を伝える',
    text: '住民・利用者・事業者など、どんな立場からの意見かを書きます。',
    examples: ['○○市在住で、近隣の生活環境への影響を心配しています。'],
    note: '立場は必須ではありません。募集要項や必要に応じて書きます。',
    ai: { text: 'あなたの状況から、立場を1文にまとめる', prompt: 'write' },
  },
  {
    no: 2,
    icon: 'search',
    title: '対象箇所を示す',
    text: 'どの条文・ページ・項目についての意見かを、具体的に書きます。',
    examples: ['第○条第○項の管理基準について'],
    ai: { text: '募集資料から、関係する条文やページを探す', prompt: 'understand' },
  },
  {
    no: 3,
    icon: 'check',
    title: '結論を最初に書く',
    text: '賛成・反対だけでなく、何を求めるのかをはっきり書きます。',
    examples: ['○○を削除してください。', '○○の基準を修正してください。', '○○の規定を追加してください。'],
    note: '結論が先にあると、求めている変更が伝わりやすくなります。',
    ai: { text: '考えを「〜してください」の形に整える', prompt: 'write' },
  },
  {
    no: 4,
    icon: 'scale',
    title: '理由・根拠・具体案を書く',
    text: 'なぜ変える必要があるのかを、次の材料で示します。',
    chips: ['法律・条例', '公的な統計', '他の自治体の制度', '現場の実情', '自分の経験', '具体的な修正案'],
    revision: {
      before: '管理者の連絡先を掲示する',
      after: '管理者の連絡先に加え、苦情受付後の対応時間を明記する',
      reason: '苦情への対応の目安が、住民にもわかるようにするためです。',
    },
    note: '実体験は根拠になりますが、一般的な事実のように言い切らないようにします。法令や数字は、公式の資料で確かめます。',
    ai: { text: '法律・統計・他の自治体の例を探す（公式資料で確かめる）', prompt: 'deep' },
  },
];

/** 意見の基本形（コピーできるひな形） */
export const OPINION_TEMPLATE = {
  title: '意見の基本形',
  parts: [
    { label: '【対象箇所】', text: '第○条第○項について' },
    { label: '【意見・結論】', text: '○○の基準を修正してください。' },
    { label: '【理由】', text: '○○という問題があるためです。' },
    { label: '【具体的な提案】', text: '現行案の○○を、△△に変更することを提案します。' },
  ],
  note: '必要に応じて、冒頭に立場を書きます。',
};

export const templateText = () => OPINION_TEMPLATE.parts.map((p) => `${p.label}\n${p.text}`).join('\n\n');

export const COMPARE = {
  title: '伝わりにくい意見と、検討しやすい意見',
  weak: {
    title: '伝わりにくい意見',
    quote: '民泊が増えるのは不安です。反対です。',
    points: ['どの規定が問題かわからない', '理由が具体的でない', '何を変えてほしいのかわからない'],
    note: '不安や反対の気持ちも、大切な声です。',
  },
  strong: {
    title: '検討しやすい意見',
    quote: '第○条の管理基準に、苦情受付後の対応時間を明記してください。迅速な対応を確保するためです。',
    points: ['対象がはっきりしている', '結論がある', '理由がある', '改善案が具体的'],
  },
  summary: '気持ちを、具体的な提案に。',
  formula: ['結論', '対象箇所', '根拠・理由', '具体的な提案'],
  formulaResult: '検討しやすい意見の基本形',
};

// ---- ② AIを使ってみよう ----

export const AI_STEPS: PubcomAiStep[] = [
  { no: 1, icon: 'book', title: '資料を読む', me: '気になる制度や募集案を選ぶ', ai: '難しい資料をわかりやすく要約する', prompt: 'understand' },
  { no: 2, icon: 'list', title: '問題点を整理する', me: '疑問・不安・改善したいことを考える', ai: '論点や対象の条文を整理する', prompt: 'understand' },
  { no: 3, icon: 'memo', title: '意見をまとめる', me: '結論と、何を求めるかを決める', ai: '考えをパブコメ用の文章に整える', prompt: 'write' },
  { no: 4, icon: 'search', title: '根拠を調べる', me: '必要な根拠や資料を判断する', ai: '法律・統計・他の自治体の例を調べる', prompt: 'deep' },
  { no: 5, icon: 'check', title: '提出前に確認する', me: '自分の意見になっているか確かめる', ai: '間違いや論理の弱いところを点検する', prompt: 'check' },
  { no: 6, icon: 'shield', title: '別のAIでも検証する', me: '複数の回答を比べる', ai: '別の視点から事実・法令・根拠を確かめる', prompt: 'recheck' },
];

export const AI_KEY = { strong: '意見を決めるのは、あなた。', rest: 'AIは調べる・整理する・確かめるための道具です。使わなくても意見は出せます。' };

/** AIへの指示文。選択肢の並び順もこの順 */
export const PROMPTS: PubcomPrompt[] = [
  {
    id: 'understand',
    label: '資料を理解したい',
    when: '募集資料が難しくて、何が変わるのかわからないときに',
    text: `次のパブリックコメントの募集資料を、初めて読む人にもわかるように説明してください。

① 何を変更するのか
② 現在の制度との違い
③ 生活への影響
④ 意見を出せる主な論点
⑤ 確認すべき資料や条文

難しい専門用語はやさしく説明してください。
資料に書かれていないことを事実として推測しないでください。
説明の根拠となるページ・条文を示してください。
確認できないことは「不明」としてください。

【資料URLまたは本文】
`,
  },
  {
    id: 'write',
    label: '自分の意見を文章にしたい',
    when: '言いたいことはあるのに、文章にまとめられないときに',
    text: `次の私の考えを、パブリックコメントとして伝わりやすい文章に整理してください。

① 私の立場（必要な場合）
② 対象箇所（条文・ページ・項目）
③ 結論（何を求めるか）
④ 理由と根拠
⑤ 具体的な修正・改善案

結論を先に書いてください。
私の意図を勝手に変更しないでください。
事実や数字を創作しないでください。
情報が足りない場合は質問してください。
感情的な表現を必要以上に強調せず、簡潔で具体的な文章にしてください。

【募集資料】

【私の考え】
`,
  },
  {
    id: 'deep',
    label: 'もっと深く調べたい',
    when: '法律・統計・他の自治体の例で、根拠を固めたいときに',
    text: `次のパブリックコメントについて、意見の根拠を詳しく調べてください。

① 関係する法律・条例・条文
② 現行制度と改正案の違い
③ 公的統計や客観的な根拠
④ 他自治体の制度や運用事例
⑤ 想定される反論や課題
⑥ 実現可能な具体的修正案

一次資料を優先してください。
資料名、発行元、発行年月、URL、該当箇所を示してください。
確認できた事実と推測を区別してください。
確認できない情報は「未確認」としてください。
現行規定と修正案を比較できる場合は、比較表を作成してください。

【募集資料】

【調べたいこと・私の意見】
`,
  },
  {
    id: 'check',
    label: '提出前に確認したい',
    when: '意見文ができて、出す前に点検したいときに',
    text: `次のパブリックコメント案を、提出前に厳しく点検してください。

① 募集対象の内容に沿っているか
② 対象条文・対象箇所が正しいか
③ 結論・理由・改善案が具体的か
④ 法律・条例・統計・数字・年度が正しいか
⑤ 出典が実在し、主張と一致するか
⑥ 論理の飛躍や断定しすぎた表現がないか
⑦ 募集要項の記載条件や文字数に適合しているか

問題点と修正案を整理してください。
私の主張を勝手に変更しないでください。
確認できない点は「要確認」としてください。

【募集要項】

【意見文】
`,
  },
  {
    id: 'recheck',
    label: '別のAIで再検証したい',
    when: '1つ目のAIが作った意見文や根拠を、別のAIで確かめたいときに',
    text: `あなたは、別のAIが作成・点検したパブリックコメント案を独立して検証する役割です。
元のAIの判断を正しいと仮定せず、批判的な視点から検証してください。

① 法律・条例・条文の解釈は正しいか
② 統計・数値・年度・単位は正確か
③ 出典URLと実際の記載内容は一致するか
④ 募集対象と意見の論点は一致しているか
⑤ 論理の飛躍や反証はないか
⑥ 提案は制度上・実務上実現可能か
⑦ より適切な修正案はあるか

検証結果を次の3区分に分けてください。
・確認済み
・誤りの疑い
・未確認

一次資料のURLと該当箇所を示してください。
根拠を確認できない場合は、正しいと判断しないでください。
前のAIの回答に迎合せず、独立して判断してください。

【募集資料】

【別のAIが作成した意見文・根拠】
`,
  },
];

export const DEFAULT_PROMPT: PromptId = 'understand';

export const findPrompt = (id: PromptId) => PROMPTS.find((p) => p.id === id) ?? PROMPTS[0];

/** 指示文の使い方（3こま） */
export const PASTE_STEPS = ['使いたいAI（ChatGPT・Claude・Gemini など）を開く', '入力欄に、コピーした指示文を貼り付ける', '【 】の下に、資料や自分の考えを書き足して送る'];

export const PASTE_NOTES = ['名前・住所・電話番号などの個人情報は、AIに入力しないようにしましょう。', 'URLを読めないAIもあります。そのときは資料の本文を貼り付けます。'];

// ---- ③ もっと詳しく調べる ----

export const RESEARCH: PubcomResearch[] = [
  {
    id: 'law',
    icon: 'book',
    title: '法律・条例を調べる',
    lead: '募集資料に出てくる法律や条例の、元の文章を確かめます。',
    listTitle: 'どこで調べる？',
    items: ['e-Gov法令検索（国の法律・政令・省令）', '国・自治体の公式サイト', '自治体の条例・規則（公式サイトの「例規集」）', '募集資料にのっている関連条文'],
    links: [{ label: 'e-Gov法令検索', url: 'https://laws.e-gov.go.jp/' }],
    notes: ['法律（国が決める）と条例（自治体が決める）を混同しないようにします。', 'いま施行されている制度と、改正案（これから変わる内容）を区別します。'],
    ai: { text: '関係する法律・条例・条文を探す', prompt: 'deep' },
  },
  {
    id: 'stats',
    icon: 'list',
    title: '公式の統計を調べる',
    lead: '数字で示すと、問題の大きさが伝わりやすくなります。',
    listTitle: 'どこで調べる？',
    items: ['e-Stat（政府統計の総合窓口）', '各省庁の統計', '自治体の公式統計'],
    links: [{ label: 'e-Stat（政府統計の総合窓口）', url: 'https://www.e-stat.go.jp/' }],
    notes: ['数字を使うときは、対象の年度・地域・単位（人・件・％など）・集計のしかたを確かめます。'],
    ai: { text: '使えそうな公的統計を探す', prompt: 'deep' },
  },
  {
    id: 'compare',
    icon: 'map',
    title: '他の自治体と比べる',
    lead: '同じテーマの制度を、ほかの自治体がどう決めているか調べます。',
    listTitle: '比べる項目の例',
    items: ['自治体名', '現行制度', '規制・基準の内容', '施行時期', '公式資料のURL'],
    notes: ['目的や前提が違う制度を、そのまま比べないようにします。'],
    ai: { text: '他の自治体の制度や運用の例を探す', prompt: 'deep' },
  },
  {
    id: 'revision',
    icon: 'form',
    title: '現行案と修正案を比べる',
    lead: 'どんな変更を求めているのかを、行政が理解しやすい形で示します。',
    listTitle: '書き方',
    items: ['現行案の文章をそのまま書く', '変えたい形（修正案）を書く', '変える理由を1〜2文で書く'],
    revision: { before: '○○とする。', after: '○○に加え、△△を義務付ける。', reason: '□□の問題に対応するため。' },
    ai: { text: '現行規定と修正案の比較表を作る', prompt: 'deep' },
  },
];

export const DOUBLE_CHECK = {
  title: 'AIの回答、もう一度チェック！',
  sub: '別のAIで、見落としや間違いを探そう。',
  flow: [
    { icon: 'sparkle', label: 'AI①', sub: '資料を読み、意見を整理する' },
    { icon: 'sparkle', label: 'AI②', sub: '別の視点から間違いを探す' },
    { icon: 'landmark', label: '公式資料', sub: '根拠を自分で確かめる' },
    { icon: 'send', label: '提出' },
  ] as PubcomFigItem[],
  risksTitle: 'AIは、こんな間違いをすることがある',
  risks: ['法律や統計を間違える', '実在しない資料やURLを示す', 'AIによって結論が違う', '同じ答えでも、正しいとは限らない'],
  tipsTitle: '確かめ方',
  tips: [
    'できれば別のAIサービスを使う（例：ChatGPT、Claude など。どれでも構いません）',
    '2つ目のAIには、元の結論を前提にせず検証させる',
    '出典が実在するか、中身が合っているかを公式サイトで確かめる',
  ],
  warning: 'AIが2つとも同じ回答でも、正しいとは限りません。最後は必ず公式資料と照合してください。',
};

// ---- ④ 提出する ----

export const PUBCOM_CHECKLIST = [
  '募集対象の案について書いている',
  '対象箇所を示した',
  '結論を明確にした',
  '理由と改善案を書いた',
  '数字・法律・出典を確認した',
  'AIの文章を自分で確認した',
  '提出期限・方法・必要事項を確認した',
];

export const CHECKLIST_DONE = 'すべて確認できました。募集要項に書かれた方法で提出しましょう。';

export const SUBMIT_FLOW: PubcomFigItem[] = [
  { icon: 'clipboard', label: '募集要項を確認' },
  { icon: 'memo', label: '意見文を完成' },
  { icon: 'send', label: '指定された方法で提出' },
  { icon: 'clock', label: '結果の公表を確認' },
];

export const SUBMIT_METHODS: PubcomFigItem[] = [
  { icon: 'form', label: '専用フォーム' },
  { icon: 'clipboard', label: '電子申請' },
  { icon: 'mail', label: 'メール' },
  { icon: 'letter', label: '郵送' },
  { icon: 'building', label: '持参' },
];

export const SUBMIT_NOTES = ['使える方法は案件ごとに違います。募集要項に書かれた方法で出します。', '名前・住所などを書くかどうかも、募集要項に従います。'];

export const FIND_CASES = {
  national: [EGOV_PUBCOM, SITE.pubcome],
  local: '自治体の案件は、その自治体の公式サイトの「パブリックコメント」「意見募集」のページで探します。',
};

export const RESULT_POINTS = [
  '寄せられた意見と、それに対する行政の考え方が、まとめて公表されます。',
  '国の案件は e-Gov で、自治体の案件はそれぞれの公式サイトで公表されます。',
  '公表まで、時間がかかることがあります。',
];

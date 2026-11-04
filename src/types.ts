// サイト全体で使うデータの形（型定義）
// 窓口データは public/data/ の JSON ファイルに置き、ここで決めた形にそろえる。

/**
 * 窓口の種類。最初の3種類が基本で、どの自治体にも欄を出す。
 * 請願・陳情の届け先（petition：都道府県・市区町村・国会）、警察・公安委員会（police：都道府県だけ）と教育委員会（education）は、連絡先を載せたところにだけ欄を出す。担当部署（department）は将来用
 */
export type ContactType = 'general' | 'feedback' | 'assembly' | 'petition' | 'police' | 'education' | 'department';

/** 窓口情報の確認状態 */
export type ContactStatus =
  | 'verified' // 公式確認済み（AI・プログラムで集め、research-merge が出典ページと照合。人が全件を見たわけではない）
  | 'unverified' // 未確認
  | 'review' // 要再確認
  | 'unavailable' // 公式連絡先が確認できない
  | 'discontinued' // 変更・廃止
  | 'auto_matched'; // 公式サイトと自動照合（代表電話だけ。出典ページとの照合の前）

/** 1つの窓口 */
export interface Contact {
  id: string; // 例：131083-general
  type: ContactType;
  department: string; // 窓口名（例：代表窓口、広聴課、議会事務局）
  phone: string | null;
  email: string | null;
  form_url: string | null; // 公式の問い合わせフォーム
  /**
   * 直接開くとエラーになるフォーム（役所のページから来た人だけに表示する仕組み）のとき、
   * 公式ページ（source_url）にある、フォームへのリンクの文字。ボタンは公式ページへ案内する
   */
  form_via_page?: string | null;
  postal_code: string | null; // 郵便番号（例：135-8383）
  postal_address: string | null;
  hours: string | null; // 受付時間
  source_url: string | null; // 公式出典URL
  verified_at: string | null; // 最終確認日（YYYY-MM-DD）
  matched_at?: string | null; // 公式サイトと自動照合した日（auto_matched のときだけ。research-merge で照合した確認日ではない）
  status: ContactStatus;
  note?: string | null;
}

/** 自治体（都道府県・市区町村）ごとの窓口のまとまり。自治体コード（6けた）が主キー */
export interface MunicipalityContacts {
  municipality_code: string;
  municipality_name: string;
  contacts: Contact[];
}

/** 国の機関ごとの窓口のまとまり。機関ID が主キー */
export interface AgencyContacts {
  agency_id: string;
  agency_name: string;
  contacts: Contact[];
}

/** 都道府県マスター */
export interface Prefecture {
  code: string; // 2けた（例：13）
  lg_code: string; // 全国地方公共団体コード6けた（例：130001）
  name: string;
  kana: string;
}

/** 市区町村マスター */
export interface Municipality {
  code: string; // 全国地方公共団体コード6けた（例：131083）
  name: string;
  kana: string;
  pref_code: string; // 2けた
  designated?: boolean; // 政令指定都市
}

/** 国の機関の分類 */
export type AgencyCategory = 'cabinet' | 'ministry' | 'agency' | 'diet';

/** 国の機関マスター */
export interface Agency {
  id: string;
  name: string;
  kana: string;
  category: AgencyCategory;
  position: string; // 位置づけ（例：内閣府の外局）
  roles: string; // 主な担当分野（例）
  official_url: string;
  url_checked_at: string; // 公式サイトの表示を確認した日
}

/** マスターファイルの共通の形（出典つき） */
export interface MasterFile<T> {
  source: string;
  source_url: string;
  checked_at: string;
  items: T[];
}

/** 件数のまとめ（scripts/build-summary.mjs で作る） */
export interface DataSummary {
  generated_at: string;
  entities: { agencies: number; prefectures: number; municipalities: number };
  contacts: { total: number; verified: number; by_status: Record<ContactStatus, number> };
  coverage: Record<'agencies' | 'prefectures' | 'municipalities', Coverage>;
  /** 都道府県（2けた）ごとの調査状況 */
  by_pref: Record<string, { pref: Coverage; municipalities: Coverage }>;
}

/** 機関・自治体の調査状況（total：全体、researched：窓口の記録あり、with_verified：公式確認済みの窓口が1つ以上、with_shown：画面に出す窓口（確認済み・要再確認・自動照合）が1つ以上） */
export interface Coverage {
  total: number;
  researched: number;
  with_verified: number;
  with_shown: number;
}

// ---- 解説コンテンツ ----

export type IconName =
  | 'phone'
  | 'mail'
  | 'comment'
  | 'petition'
  | 'folder'
  | 'signature'
  | 'search'
  | 'book'
  | 'route'
  | 'building'
  | 'assembly'
  | 'check'
  | 'copy'
  | 'arrow-up'
  | 'arrow-right'
  | 'arrow-left'
  | 'external'
  | 'info'
  | 'list'
  | 'chat'
  | 'bulb'
  | 'send'
  | 'map'
  | 'landmark'
  | 'clipboard'
  | 'memo'
  | 'heart'
  | 'alert'
  | 'cross'
  | 'scale'
  | 'question'
  | 'clock'
  | 'form'
  | 'letter'
  | 'print'
  | 'shield'
  | 'sparkle'
  | 'user';

export type GuideSlug = 'phone' | 'email' | 'public-comment' | 'petition' | 'disclosure' | 'signature';

/** 「声を届ける方法を知る」の各メニュー */
export interface GuideMenuItem {
  slug: GuideSlug;
  title: string;
  short: string; // トップのカードに出す短い名前
  summary: string;
  status: 'published' | 'coming';
  icon: IconName;
  roadmapStep: number; // 開発ロードマップ上の STEP
  plannedTopics: string[]; // 準備中ページで示す「予定している内容」
  meanwhile?: string[]; // 準備中ページで先に伝えておくこと（ほかの方法との違いなど）
  related?: RelatedLink[]; // すぐに使える既存サイト
}

export interface RelatedLink {
  label: string;
  url: string;
  desc: string;
}

/** 「まず3分でわかる」の1つのSTEP */
export interface ThreeMinuteStep {
  no: number;
  title: string;
  icon: IconName;
  text: string; // 原則1文
  /** STEP 1・2 の選択肢（目的を押すと、STEP 2 の向いている方法に印がつく） */
  choices?: 'purposes' | 'methods';
  /** 文章の代わりに見せる小さな図（アイコンの横並び・矢印でつないだ縦の流れ） */
  figure?: { kind: 'icons' | 'list'; items: FigureItem[] };
  /** 次に押すリンク */
  more?: { label: string; to: string }[];
  /** STEP 4：STEP 2 で印がついた方法の、準備を始めるボタンを出す */
  methodActions?: boolean;
}

/** 「何をしたい？」の1つ（トップと3分ガイドの STEP 1 で共通） */
export interface ThreeMinutePurpose {
  id: string;
  label: string; // 「/」の位置で折り返してよい（表示しない）
  icon: IconName;
  ways: PurposeWay[]; // こんな方法があります（場面 → 行き先）
}

/** 目的を選んだときに出す1行。to は届ける方法（同じ slug のガイド）か、補助の行動（窓口を探す・公式サイトを探す） */
export interface PurposeWay {
  when: string;
  to: (GuideSlug | 'contacts' | 'official')[];
}

/** 3分ガイドの最後「声を届ける前に知っておきたいこと」の1つ */
export interface BeforeYouSendItem {
  icon: IconName;
  text: string;
}

/** 届ける方法の1つ（カードの行き先は同じ slug のガイド） */
export interface ThreeMinuteMethod {
  slug: GuideSlug;
  label: string; // 「/」の位置で折り返してよい（表示しない）
  sub: string; // 何に向いているか（短く。「/」の扱いは label と同じ）
  action: string; // 準備を始めるボタンの名前（「/」の扱いは label と同じ）
  start: string; // 準備を始めるボタンの行き先
}

export interface FigureItem {
  icon?: IconName;
  label: string;
  sub?: string;
}

/** 電話マニュアルの台本 */
export interface Script {
  id: string;
  label: string;
  text: string;
  note?: string;
}

/** マニュアルの文面の見本（一通の完成例）。届け方などを切りかえて見せる1つ分 */
export interface ManualSample {
  id: string;
  label: string;
  /** 上から順に並べる部分。field：件名のように本文とは別の欄に入れる部分（コピーではラベルも付ける） */
  parts: { label: string; text: string; field?: boolean }[];
  notes?: string[];
}

export type ManualBlock =
  | { kind: 'p'; text: string }
  | { kind: 'list'; title?: string; tone?: 'do' | 'dont'; items: string[] }
  | { kind: 'scripts'; items: Script[] }
  | { kind: 'dialog'; title: string; lines: { who: 'me' | 'staff'; text: string }[] }
  | { kind: 'terms'; items: { term: string; desc: string }[] }
  | { kind: 'note'; text: string }
  /** section があれば、to のページの中のその見出しへ移動する（同じページの中のリンク） */
  | { kind: 'link'; label: string; to: string; section?: string }
  | { kind: 'sample'; title: string; items: ManualSample[] };

export interface ManualChapter {
  id: string;
  no: number;
  title: string;
  icon: IconName;
  lead: string;
  /** 目次に出す「こんなときに読む」の短い言葉 */
  purpose: string;
  blocks: ManualBlock[];
}

// ---- 台本を作る（電話ガイドの冒頭） ----

/** 電話の目的 */
export type CallPurpose = 'opinion' | 'question' | 'department';

/** 意見の向き（意見を伝えるときだけ） */
export type CallStance = 'concern' | 'review' | 'support';

/** 台本の部分（読む順） */
export type ScriptPartKey = 'greeting' | 'main' | 'record' | 'thanks';

export interface ScriptPart {
  key: ScriptPartKey;
  label: string;
  text: string;
  /** 利用者が書き直した文かどうか */
  edited: boolean;
}

/** 窓口検索から引き継いだ電話先（公式確認済み・要再確認・公式サイトと自動照合の窓口だけ） */
export interface CallTarget {
  contactId: string;
  org: string; // 機関・自治体の名前
  department: string; // 窓口名
  typeLabel: string; // 窓口の種類（代表窓口など）
  phone: string | null;
  email: string | null;
  formUrl: string | null;
  formViaPage?: string | null; // 公式ページのこの文字のリンクからフォームを開く（Contact.form_via_page）
  postalCode: string | null; // 郵便番号（例：135-8383）
  postalAddress: string | null;
  hours: string | null;
  sourceUrl: string;
  verifiedAt: string | null; // 最終確認日（自動照合の窓口は null）
  matchedAt?: string | null; // 公式サイトと自動照合した日
  status: 'verified' | 'review' | 'auto_matched';
}

/** 詳しい整理（台本作成画面のステップ②で任意入力） */
export interface DeepDiveDraft {
  facts: string;
  question: string;
  desired: string;
  source: string;
  points: string[];
  /** 最後に③の本題へ反映した文（本題を手で直したかを見分けるため） */
  applied?: string;
}

/** 台本づくりの入力（この端末のこのタブの中だけに一時保存する） */
export interface CallDraft {
  purpose: CallPurpose;
  stance: CallStance;
  topic: string; // 何について？
  detail: string; // 理由（意見を伝えるとき）
  ask: string; // 聞きたいこと（質問するとき）
  /** 記録をお願いするか（目的ごと。未設定は「意見なら入れる」） */
  record: Partial<Record<CallPurpose, boolean>>;
  /** 書き直した文（目的ごとに覚えておき、目的を戻すと元に戻る） */
  edits: Partial<Record<CallPurpose, Partial<Record<ScriptPartKey, string>>>>;
  target: CallTarget | null;
  deepDive?: DeepDiveDraft; // sessionStorage へ既存の方法で一時保存
  memo: { when: string; who: string; person: string; answer: string }; // person：対応した人
}

/** 文面の届け方（post：郵送の手紙） */
export type MailMethod = 'mail' | 'form' | 'post';

/** 返信の希望。unset（指定しない）のときは文に入れない */
export type MailReply = 'unset' | 'want' | 'none';

/** 文面の部分（件名と、本文の上から順）。date（日付）・address（住所つきの宛先）・sender（差出人）は手紙だけ、signature（署名）はメール・フォームだけ */
export type MailPartKey = 'subject' | 'date' | 'to' | 'address' | 'sender' | 'greeting' | 'main' | 'request' | 'closing' | 'signature';

export interface MailPart {
  key: MailPartKey;
  label: string;
  text: string;
  /** 利用者が書き直した文かどうか */
  edited: boolean;
}

/**
 * メールの文面づくりで、電話の台本と別に覚えるもの（この端末のこのタブの中だけに一時保存する）
 * 目的・何について・理由・詳しく整理・送り先は、電話の台本（CallDraft）と共通
 */
export interface MailDraft {
  method: MailMethod;
  name: string; // 名前（任意）
  area: string; // 住んでいる市区町村（任意）
  postal: string; // 手紙の差出人：郵便番号（任意）
  address: string; // 手紙の差出人：住所（任意）
  contact: string; // 手紙の差出人：電話番号かメールアドレス（任意）
  reply: MailReply;
  /** 書き直した文（目的ごと。電話の台本で直した文とは別） */
  edits: Partial<Record<CallPurpose, Partial<Record<MailPartKey, string>>>>;
  memo: { when: string; to: string; subject: string; receipt: string; answer: string }; // receipt：フォームの受付番号
}

/** 監修の確認状態 */
export type SupervisionStatus = 'confirmed' | 'pending' | 'none';

// ---- パブコメの書き方 ----
export type PromptId = 'understand' | 'write' | 'deep' | 'check' | 'recheck';

/** AIへの指示文（目的を選ぶと切りかわる） */
export interface PubcomPrompt {
  id: PromptId;
  label: string;
  /** どんなときに使うか（1行） */
  when: string;
  /** コピーする全文 */
  text: string;
}

/** 図の1こま（アイコン＋短い言葉） */
/** 書き方マニュアル（パブコメ・請願陳情・署名）の4つのまとまり
 *  short は画面下のメニューの短い名前。optional は「必要なときだけ」読めばよいまとまり */
export interface GuidePart {
  id: string;
  no: number;
  icon: IconName;
  title: string;
  sub: string;
  short: string;
  optional?: boolean;
}

export interface PubcomFigItem {
  icon: IconName;
  label: string;
  sub?: string;
}

/** 現行案と修正案の見比べ */
export interface PubcomRevision {
  before: string;
  after: string;
  reason: string;
}

/** 「AIでできること」の小さな案内（押すと、その指示文を選んだ状態にする） */
export interface PubcomAiTip {
  text: string;
  prompt: PromptId;
}

/** 書き方の4ステップ */
export interface PubcomStep {
  no: number;
  icon: IconName;
  title: string;
  text: string;
  examples?: string[];
  chips?: string[];
  revision?: PubcomRevision;
  note?: string;
  ai: PubcomAiTip;
}

/** AIはどこで使う？（あなたとAIの役割分担） */
export interface PubcomAiStep {
  no: number;
  icon: IconName;
  title: string;
  me: string;
  ai: string;
  prompt: PromptId;
}

/** もっと詳しく調べる（必要な人だけ開く） */
export interface PubcomResearch {
  id: string;
  icon: IconName;
  title: string;
  lead: string;
  listTitle: string;
  items: string[];
  links?: { label: string; url: string }[];
  revision?: PubcomRevision;
  notes?: string[];
  ai: PubcomAiTip;
}

// ---- 請願・陳情の書き方 ----
export type PetitionPromptId = 'choose' | 'organize' | 'draft' | 'research' | 'review';

/** AIへの指示文（請願・陳情） */
export interface PetitionPrompt {
  id: PetitionPromptId;
  label: string;
  when: string;
  text: string;
}

/** 見比べるカード（陳情と請願・出す先） */
export interface PetitionCard {
  icon: IconName;
  title: string;
  sub?: string;
  points: string[];
}

/** 3分でわかるの1ステップ（中身は、あるものだけ表示する） */
export interface PetitionStep {
  no: number;
  icon: IconName;
  title: string;
  text: string;
  cards?: PetitionCard[];
  /** 分かれ道（○○なら → △△） */
  branches?: { icon?: IconName; when: string; then: string }[];
  /** 番号つきの要素（件名・要望事項…） */
  parts?: { label: string; sub: string }[];
  chips?: string[];
  notes?: string[];
  /** 開くと読める補足 */
  more?: { title: string; items: string[]; links?: { label: string; url: string }[] };
  /** ページ内・サイト内へのボタン */
  links?: { label: string; icon: IconName; to: string; prompt?: PetitionPromptId }[];
  ai?: { text: string; prompt: PetitionPromptId };
}

// ---- 署名の方法 ----
export type SignaturePromptId = 'understand' | 'draft' | 'research' | 'review';

/** AIへの指示文（署名） */
export interface SignaturePrompt {
  id: SignaturePromptId;
  label: string;
  when: string;
  text: string;
}

/** 署名サイトを見比べるカード（同じ項目を同じ順に並べる） */
export interface SignatureSite {
  name: string;
  url: string;
  rows: { label: string; text: string }[];
}

/** やってみようの1ステップ（中身は、あるものだけ表示する） */
export interface SignatureStep {
  no: number;
  icon: IconName;
  title: string;
  text: string;
  chips?: string[];
  /** 番号つきの要素（何が問題？…） */
  parts?: { label: string; sub: string }[];
  /** 順番に行う操作 */
  howto?: string[];
  example?: string;
  flow?: PubcomFigItem[];
  notes?: string[];
  /** ページ内（#id）・サイト内（/…）・外部（https://…）へのボタン。primary：目立たせる */
  links?: { label: string; icon: IconName; to: string; primary?: boolean }[];
  ai?: { text: string; prompt: SignaturePromptId };
  sources?: { label: string; url: string }[];
}

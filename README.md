# 声を届ける。

**知ることから、行動へ。**
全国の行政機関・自治体・議会に、自分の疑問や意見を届けるための案内サイトです（「日本を知る。」の関連サイト）。
特定の政治的な立場を支持・反対するサイトではなく、賛成・反対・質問・提案のどれにも使える公共情報の案内として作っています。

- 公開先：https://yumaki5555.github.io/todokeru/ （リポジトリ [Yumaki5555/todokeru](https://github.com/Yumaki5555/todokeru)、2026-11-01 公開）
- 技術：React + TypeScript + Vite（バックエンドなし・会員登録なし・アクセス解析なし・外部トラッキングなし）
- 公開のしくみ：GitHub Pages（main ブランチの `docs` フォルダ）
- 開発の予定：[ROADMAP.md](ROADMAP.md)

## ページと URL

ページの切り替えは `#/` 方式です。# より後ろはサーバーに送られないので、どのページを直接開いても正しく表示されます（GitHub Pages ではサーバーの設定ができないため）。

| ページ | URL（公開先の後ろに付ける） | 状態 |
| --- | --- | --- |
| トップ | `#/` | 完成 |
| はじめての行政電話ガイド | `#/guide/phone` | 完成 |
| 全国の窓口を探す | `#/contacts` | 基本画面（連絡先は STEP 2 で掲載） |
| このサイトについて | `#/about` | 完成 |
| メール・郵送 | `#/guide/email` | 準備中 |
| パブコメの書き方 | `#/guide/public-comment` | 公開（文章と指示文は `src/content/pubcomManual.ts`） |
| 請願・陳情の書き方 | `#/guide/petition` | 公開（文章と指示文は `src/content/petitionManual.ts`） |
| 情報公開請求 | `#/guide/disclosure` | 準備中 |
| 署名の方法 | `#/guide/signature` | 準備中 |

- 窓口検索は URL で選んだ状態を表せます：`#/contacts?code=13`（東京都）、`#/contacts?code=131083`（江東区）、`#/contacts?tab=agency&id=mhlw`（厚生労働省）。入口サイトから地域を引き継ぐときにも使えます。
- ページの中の見出しは `?s=` で開けます：`#/guide/phone?s=ch3`（電話ガイドの第3章）、`#/?s=sanpun`（まず3分でわかる）。
- 準備中のガイドは、`src/content/guides.ts` の `status` を `'published'` にしてページを作れば、同じ URL のまま公開できます。

## 3つの「戻る」

| 表示 | 行き先 | 場所 |
| --- | --- | --- |
| 日本を知る。トップへ戻る | https://yumaki5555.github.io/（同じタブ） | すべてのページの最上部 |
| 声を届ける。トップへ戻る | このサイトのトップ（`#/`） | 詳細ページの上と下 |
| ページ先頭へ戻る | いま見ているページの先頭 | 詳細ページの下・トップの最後 |

## フォルダの構成

```text
届ける/
├── index.html              ページの入れ物
├── public/
│   ├── favicon.svg
│   └── data/               窓口検索のデータ（必要なときだけ読み込む）
│       ├── master/agencies.json        国の機関マスター
│       ├── master/prefectures.json     都道府県マスター
│       ├── master/municipalities.json  市区町村マスター
│       ├── contacts/agencies.json      国の機関の窓口データ
│       ├── contacts/01.json〜47.json    都道府県ごとの窓口データ（分割読み込み）
│       └── summary.json                件数のまとめ（登録数と確認済み窓口数）
├── scripts/
│   ├── build-master.mjs    自治体マスターを作る
│   ├── build-summary.mjs   件数のまとめを作る
│   └── clean-docs.mjs      ビルド前に docs の古いファイルを消す
├── src/
│   ├── main.tsx / App.tsx  起動とページの切り替え
│   ├── router.ts           #/ 方式のページ切り替え
│   ├── site.ts             サイト名・外部リンク・最終更新日・監修の状態
│   ├── types.ts            データの形（型定義）
│   ├── content/            文章のデータ（3分でわかる・メニュー・電話マニュアル・チェックリスト）
│   ├── data/               読み込み・点検（バリデーション）・検索・表示名
│   ├── components/         共通ヘッダー・フッター・ナビ・台本コピー・チェックリスト・目次・窓口の表示 など
│   ├── pages/              各ページ
│   ├── lib/                スクロール・コピー・文字の道具
│   └── styles/global.css   共通スタイル
├── tests/                  自動テスト
└── docs/                   公開用のファイル（npm run build で作る。手で直さない）
```

## 開発のしかた

Node.js（v20 以上）が必要です。

```bash
npm install
```

```bash
npm run dev
```

（画面を見ながら直す。表示された http://localhost:5173/ を開く）

```bash
npm test
```

（自動テスト。データの点検も含む）

```bash
npm run build
```

（`docs` に公開用のファイルを作る。型チェックも行う）

```bash
npm run preview
```

（`docs` の中身を http://localhost:4173/ で確認）

### Dropbox の中で作業するときの注意

- `node_modules` は Dropbox の同期から外してあります（NTFS の `com.dropbox.ignored` 印）。消して作り直したときは、`npm install` の前に次を実行して同じ印を付けてください。

```powershell
New-Item -ItemType Directory -Force node_modules | Out-Null; Set-Content -Path node_modules -Stream com.dropbox.ignored -Value 1
```

- Dropbox が `docs` を同期している最中は「フォルダごと削除」が失敗する（EPERM）ため、`npm run build` は `scripts/clean-docs.mjs` でフォルダを残したままファイルだけを消してから作り直します。それでも止まったときは、少し待ってもう一度実行してください。

## 窓口データの追加・更新（STEP 2 以降）

**全国調査は `research/` のしくみで進めます**（手順と進み具合は [research/README.md](research/README.md)）。
調査メモを `npm run research:merge -- <バッチID>` で出典ページと照合してから反映するので、下の手作業での追加は、1件だけ直すときなどに使います。

### 連絡先の管理画面（このパソコンの中だけ）

1件ずつ確かめたり、直したり、新しく登録したりするときは、管理画面を使います。

- 開き方：フォルダの **`連絡先の管理.bat` をダブルクリック**（または `npm run admin`）。ブラウザで http://localhost:4180 が開きます。終わるときは黒い画面を閉じます。
- できること：都道府県・市区町村・国の機関を選んで、登録済みの窓口を見る／出典ページを開く／「ページの中を自動で探す」（出典ページに番号などが書かれているか機械で探す）／「確認できた」（今日の日付で公式確認済みに）／内容を直す／新しく登録する／要再確認・廃止にする／間違えて登録した窓口を消す。
- 保存すると `public/data/contacts/<2けた>.json` を書きかえ、`research/changelog.jsonl` に `batch: "manual-admin"` の記録を足し、`summary.json` を作り直します。保存の前に、`npm run validate` と同じ点検（形・公式ドメインの出典・代表電話の流用）をします。
- **サイトに出るのは公開したあと**。画面の上の「まだ公開していない変更」に、最後の commit 以降に管理画面で変えたものが出ます。公開は下の「GitHub Pages への公開手順」と同じ（build → 変更したデータと docs を commit → push）。
- しくみ：`admin/server.mjs`（画面とファイルの読み書き）・`admin/core.ts`（組み立てと点検。テストは `tests/admin.test.ts`）・`admin/index.html`・`app.js`・`style.css`。`src/data/validate.ts` をそのまま使うため、Node は 23.6 以上（型の書かれたファイルを直接読めるもの）が必要です。

### 手作業でファイルに追加するとき

1. 公式サイトで窓口を確かめる（**公式に公開されている情報だけ**。推測した電話番号・メールアドレス・担当部署は書かない）。
2. その自治体の都道府県のファイル（例：江東区なら `public/data/contacts/13.json`）に追加する。都道府県庁の窓口は、都道府県の6けたコード（例：東京都 `130001`）で同じファイルに入れる。

```json
[
  {
    "municipality_code": "131083",
    "municipality_name": "江東区",
    "contacts": [
      {
        "id": "131083-general",
        "type": "general",
        "department": "代表窓口",
        "phone": null,
        "email": null,
        "form_url": null,
        "postal_code": null,
        "postal_address": null,
        "hours": null,
        "source_url": null,
        "verified_at": null,
        "status": "unverified"
      }
    ]
  }
]
```

（上は形の例で、調査結果ではありません）

| 項目 | 内容 |
| --- | --- |
| `type` | `general` 行政代表窓口／`feedback` 広聴・ご意見窓口／`assembly` 議会事務局／`petition` 請願・陳情の届け先（都道府県・市区町村・国会。出典は議会の請願・陳情のページで、画面では「請願・陳情の出し方」のボタンになる）／`police` 警察・公安委員会（都道府県のまとまりだけ。市区町村の結果にも出る）／`education` 教育委員会／`department` 担当部署（将来用）。請願・陳情の届け先・警察・教育委員会は、載せたところにだけ欄が出る |
| `status` | `verified` 公式確認済み／`unverified` 未確認／`review` 要再確認／`unavailable` 公式連絡先が確認できない／`discontinued` 変更・廃止 |
| `id` | 「自治体コード-種類」（例 `131083-feedback`）。国の機関は「機関ID-種類」（例 `mhlw-general`） |
| `source_url` / `verified_at` | 確認した公式ページと確認日。`verified`・`review`・`unavailable` では必須 |

3. 点検と件数の更新をする。

```bash
npm run validate
```

```bash
npm run data:summary
```

**画面に連絡先を出すのは `verified`（公式確認済み）と `review`（要再確認・注意書きつき）だけ**です。`unverified` は番号を入れても表示しません。点検に通らない窓口（出典なし・電話番号の形が違うなど）も表示しません。

### 自治体マスターの更新

市区町村の合併などで総務省「全国地方公共団体コード」が更新されたら、入口サイトの `data/municipalities.json` を更新したあと（入口サイトの README 参照）、次を実行します。既存の窓口データは上書きしません。

```bash
npm run data:master -- ../入口サイト/data/municipalities.json 2026-11-01
```

（最後の日付はマスターの確認日）

## 電話ガイドの監修表示

「はじめての行政電話ガイド」は、電突の牙さん（X [@MinNanoRamen21](https://x.com/MinNanoRamen21)）の投稿にある考え方を尊重して、独自の文章で構成しています（元投稿の文章・画像は転載していません）。
監修の表示は `src/site.ts` の `SUPERVISION` で切りかえます。表示はガイドの冒頭と末尾だけで、サイト全体の監修とは書きません。

| `status` | 表示 |
| --- | --- |
| `'pending'`（今の設定） | マニュアル監修：電突の牙さん［監修確認中］ |
| `'confirmed'` | マニュアル監修：電突の牙さん（`confirmedAt` に確認日を入れる） |
| `'none'` | 投稿の考え方を参考にした旨だけ（監修は受けていません） |

## GitHub Pages への公開手順

公開済みです（2026-11-01、リポジトリ `Yumaki5555/todokeru` → https://yumaki5555.github.io/todokeru/ ）。
**内容を直して公開し直すとき**は、次の4つを順に実行します。

```bash
npm run build
```

```bash
git add -A
```

```bash
git commit -m "変更内容"
```

```bash
git push
```

（GitHub Pages への反映には1分ほどかかります）

以下は、最初に公開したときの手順の記録です。ファイルの場所は相対パス（`./`）で作っているので、リポジトリ名が何であっても設定の変更はいりません。

1. GitHub で新しい公開リポジトリを作る（例：`Yumaki5555/todokeru`。README などは追加しない）。
2. このフォルダで公開用のファイルを作る。

```bash
npm run build
```

3. このフォルダを GitHub に送る（初回だけ。`todokeru` は作ったリポジトリ名に置きかえる）。

```bash
git init -b main
```

```bash
git add .
```

```bash
git commit -m "声を届ける。STEP 1"
```

```bash
git remote add origin https://github.com/Yumaki5555/todokeru.git
```

```bash
git push -u origin main
```

4. GitHub のリポジトリの Settings → Pages で、Source を「Deploy from a branch」、Branch を `main`・フォルダを `/docs` にして Save。
5. 1〜2分ほど待って `https://yumaki5555.github.io/<リポジトリ名>/` を開いて確認する。
6. 2回目からは、直したら `npm run build` → `git add .` → `git commit -m "変更内容"` → `git push`。

- 絶対パスで作りたいときだけ、`BASE_PATH=/todokeru/ npm run build` のようにベースパスを指定できます（通常は不要）。
- GitHub Pages は10分ほどキャッシュされることがあります。確認するときは URL の最後に `?nc=1` などを付けて開きます（`#/` より前に付ける：`.../todokeru/?nc=1#/guide/phone`）。
- 入口サイト（日本を知る。）の一覧に載せるのは別の作業です（入口サイトの `sites.js`）。

## 出典

- 都道府県・市区町村：総務省「全国地方公共団体コード」（令和6年1月1日更新）https://www.soumu.go.jp/denshijiti/code.html
- 国の機関：各機関の公式サイト（2026-11-01 にトップページの表示を確認）
- 自治体の公式サイトの探し方：地方公共団体情報システム機構（J-LIS）「全国自治体マップ検索」https://www.j-lis.go.jp/spd/map-search/cms_1069.html

## 別のサイトからの引き継ぎ

ほかの専門サイトから `#/contacts?code=221309&from=<戻り先URL>&item=<項目名>` の形でリンクすると、どのページでも上に「元のページへ戻る」帯が出ます（`src/lib/fromSite.ts`・`src/components/FromSiteBar.tsx`）。

- 戻れるサイトは `FROM_SITES` の一覧にあるものだけ。文言もここの固定文です。新しいサイトを足すときはここに書きます。
- 一時メモはこのタブの中だけで2時間。保存するのは戻り先URL・どのサイトか・自治体コード・項目名（60字まで）・時刻だけです。
- `code` は2けた・5けた・6けたを受け付けます（`src/lib/areaCode.ts`）。政令市の区は `public/data/master/wards.json`（元は総務省の一覧、`python scripts/build-wards.py <xlsx> <更新日>`）で親の市を引き、「○○市の問い合わせ先」と明示します。どこにも当たらないコードは推測せず、利用者に選んでもらいます。
- 窓口を表示できない自治体の公式サイトは `public/data/master/official-sites.json`（`python -I todokeru_tools/10_official_sites.py`。題名に自治体名があるものだけ）。なければ J-LIS のリンク集で案内します。

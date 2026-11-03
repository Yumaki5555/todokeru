# 窓口調査の記録と進め方

全国の窓口（行政代表・広聴・議会事務局）の公式連絡先を、小分けのバッチで調べて `public/data/contacts/` に反映する。
**どこまで終わったかは `progress.json` が正**（`pending` 未調査 → `merged` 照合して反映済み）。

## ファイル

| ファイル | 中身 |
|---|---|
| `progress.json` | 全84バッチの一覧と状態（第1段階 都道府県5／第2段階 国の機関1／第3段階 首都圏・大阪の市区町村12／第4段階 残り66）。反映済みのバッチには件数（result）が入る |
| `AGENT_BRIEF.md` | 調査を担当するエージェントへの手順書（公式一次資料だけ・推測禁止・出力の形） |
| `batches/<バッチ>.json` | 調査メモ（候補の連絡先と、ページ本文の書き写し evidence）。公開はしない |
| `verify/<バッチ>.json` | 照合の結果（項目ごとに出典ページで確認できたか） |
| `manual-checks.json` | 自動取得できない（403 など）ページを、ブラウザで直接確かめた記録。用途が違うと判断して掲載しない窓口（reject）もここ |
| `official-hosts.json` | go.jp・lg.jp 等以外で、公式ページからのリンクで公式と確かめたドメイン |
| `changelog.jsonl` | 公開データの変更履歴（追加・更新・要再確認）。1行1件 |

## 次のバッチの進め方

1. `progress.json` で `status: "pending"` のバッチを選ぶ（段階の番号が小さい順）。
2. 調査エージェント（1バッチ1体、20〜30自治体）に、`AGENT_BRIEF.md` を読ませて調べさせる。
   出力先は `research/batches/<バッチID>.json`。メインには件数とファイル名だけを返させる。
3. 照合だけ試す：`npm run research:merge -- <バッチID> --dry`（未確認になったものの理由が出る）
4. 403 などで開けないページは、ブラウザで確かめて `manual-checks.json` に記録する（確かめられなければ未確認のまま）。
5. 反映：`npm run research:merge -- <バッチID>`
   出典ページを開き直して照合 → `public/data/contacts/XX.json` に追記・更新 → `changelog.jsonl` → `progress.json` → `summary.json`。
6. `npm run validate`（データ点検）→ `npm test` → `npm run build`。

## 照合のきまり（scripts/research-merge.mjs）

- 出典は公式ドメインだけ。電話・メール・郵便番号・住所・受付時間は、出典ページの本文にあるものだけ残す。
- 代表電話と同じ番号を、同じページを出典に広聴・議会の番号にしていたら捨てる。
- 電話・メール・フォームのどれかが照合に通った窓口だけ `verified`。確認日は照合した日。
- 調査メモの `note` は公開しない（経過のメモが混ざるため）。

## 状況（2026-11-01）

- 第1段階（47都道府県）・第2段階（国の機関22）は反映済み。奈良県は公式サイトの証明書の期限切れで開けず、3窓口とも未確認。
- 第3段階（東京都・神奈川県・埼玉県・千葉県・大阪府の市区町村）から未着手。
- 2026-11-03：第3段階の残り（76バッチ・1,699市区町村）を AI なしの `todokeru_tools/08_make_batch.py <バッチID>` で調べ、`npm run research:merge` で照合・反映（全84バッチ merged）。公式確認 1,797件、見つからなかったものは未確認（auto_not_found＝「連絡先なし」にはしない）。教育委員会は見つかったときだけ書く。
  再調査は `python todokeru_tools/08_make_batch.py <バッチID>` → `npm run research:merge -- <バッチID> --dry` → 反映。
- 2026-11-03：第5段階「請願・陳情の届け先」。AI なしの `python todokeru_tools/09_petition_batch.py all`（元のバッチID を並べても可）が、議会のページ → 「請願」「陳情」へのリンク先とたどり、題名と本文で出し方の案内のページか確かめてから、議会事務局・議事課などと同じ行の番号を拾って `research/batches/petition-<元のバッチID>.json` を書く（progress.json に計画も足す）。
  照合・反映は他と同じ `npm run research:merge -- petition-<元のバッチID>`。見つからなかったものは載せない（未確認の欄も足さない）。衆議院・参議院は管理画面と同じ手順で登録（batch "manual-admin"）。

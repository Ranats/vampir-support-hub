# PV・収益化ロードマップ

## 現在地

2026年7月31日時点の段階は **未計測・未確認** です。独自ドメイン、canonical、
`robots.txt`、`sitemap.xml`、運営方針、任意の支援リンクは公開済みですが、
完了月のPV実績はまだありません。Cloudflare Web Analyticsの手動ビーコンは、公開
トップページと `/policy` だけに設置し、`/clan/*` は計測対象外としています。
広告タグとアフィリエイト追跡タグは設置していません。

PVを取得できるまでは「1万PV未満」とは判定しません。現在の表示や利用者データを
変えずに進められる準備として、段階定義と手入力の判定ツールをこの文書と
`scripts/traffic-phase.mjs` に固定します。

## 判定に使うPV

- 対象: `vampir.cilabworks.com` のインデックス可能な公開コンテンツのページ表示
- 現在の計測対象: `/` と `/policy` の初期ページ表示
- 除外: `/clan/*`、API、静的ファイル、旧ホスト
- 直近30日PV: 日々の傾向を見る参考値
- 確定月間PV: 毎月1日から末日までの値。段階変更の正式判定に使用
- 昇格: 上位段階の下限を2か月連続で満たしたとき
- 降格: 現段階の下限を3か月連続で下回ったとき。降格先は、その3か月すべてが
  収まる最高の段階（3か月の最大PVを分類した段階）

Cloudflareの `visits` はページビューと同義ではないため、PVとして代用しません。
将来の自動取得では、同じホスト・同じ期間のCloudflare画面とAPI結果を照合してから
採用する指標を固定します。

## 段階別ロードマップ

| 確定月間PV | この段階で行うこと | 次段階へ進む条件 |
| --- | --- | --- |
| 未計測 | Cloudflare Web Analyticsの本番受信を確認し、Search Consoleのドメイン所有権とサイトマップ送信を確認する。 | 完了月のPVを記録できること |
| 0〜9,999 | コンテンツ更新、検索流入、再訪率を優先する。Ko-fi・OFUSE以外の広告は置かない。月次PVを記録する。 | 10,000以上を2か月連続 |
| 10,000〜49,999 | スポンサー候補と掲載条件を整理し、媒体資料の素案を作る。広告は小規模な直接スポンサー枠を優先し、表示速度への影響を計測する。 | 50,000以上を2か月連続 |
| 50,000〜99,999 | スポンサー媒体資料を確定し、広告審査、`ads.txt`、同意管理、方針表示の要否を確認する。導入する場合は1枠から検証する。 | 100,000以上を2か月連続 |
| 100,000以上 | 直接スポンサー、広告ネットワーク、支援の構成を月次で比較する。収益、表示速度、離脱、利用者からの反応を見て枠数を管理する。 | 3か月連続で100,000未満なら再評価 |

PVだけで広告導入を自動決定しません。情報の正確性、表示速度、広告と通常コンテンツの
区別、対象地域の同意要件、スポンサーとの契約・請求条件を満たしてから公開します。

## 今すぐ完了できること

- この文書を収益化判断の正本にする
- Cloudflare Web Analyticsを公開2ルートだけに設置し、方針ページへ取り扱いを明記する
- 手入力した確定PVの段階、昇格、降格を同じ規則で判定する
- 秘密情報やPV履歴を公開サイト、D1、Git履歴に保存しない境界を固定する
- 将来の月次レポート出力先を `.traffic-reports/` としてGit対象外にする

## 利用者による設定・確認が必要なこと

1. 本番反映後、Cloudflare Web Analyticsで `/` と `/policy` の受信を確認する。
   `/clan/*` が記録されていないことも確認する。
2. Google Search Consoleでドメイン所有権を確認し、
   `https://vampir.cilabworks.com/sitemap.xml` を送信する。
3. 自動取得へ進む場合だけ、Cloudflareの読取専用トークンを秘密管理へ登録する。
   トークン、Account ID、Zone IDはチャット、Git、クライアントJS、Sitesの公開環境、
   D1へ保存しない。
4. 月次レポートや閾値到達通知の受取先を決める。公開GitHub ActionsのログやIssueには
   PV実績を出さず、ローカルタスクまたは非公開の運用先を使う。

## 手動判定

単月の現在地を確認します。

```sh
npm run traffic:phase -- \
  --pageviews 12345 \
  --period 2026-06 \
  --source "Cloudflare Web Analytics"
```

既存段階からの昇格・降格も判定する場合は、過去の確定月を追加します。

```sh
npm run traffic:phase -- \
  --pageviews 15000 \
  --period 2026-06 \
  --history 2026-05:12000 \
  --current-stage under-10k \
  --source "Cloudflare Web Analytics"
```

対象月と履歴には、実行時点のJSTですでに終了した月だけを指定できます。履歴は対象月
より前である必要があります。機械処理用には `--json` を追加します。PV履歴そのものは
コマンド出力を含めて `.traffic-reports/` などの非公開ローカル領域で管理します。

## 自動取得を追加する前の合格条件

- 読取専用トークンの権限と対象zoneが最小化されている
- 正確なPage Viewsフィールドを実APIスキーマで確認している
- 同一ホスト・同一期間のCloudflare画面とAPI値が一致する
- `/clan/*`、API、静的ファイル、旧ホスト、テストアクセスを除外できる
- 集計値と秘密情報が公開ログ、公開Issue、Git履歴に残らない
- 計測によるデータフローを公開前に `/policy` へ反映している

## 一次情報

- [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/about/)
- [Cloudflare Web Analyticsのデータと指標](https://developers.cloudflare.com/web-analytics/data-metrics/)
- [SPA計測の無効化](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/)
- [GraphQL Analytics API用トークン](https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-token-auth/)
- [Google AdSense参加要件](https://support.google.com/adsense/answer/9724?hl=ja)
- [GoogleのCMP要件](https://support.google.com/adsense/answer/13554020?hl=ja)

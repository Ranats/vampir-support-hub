import type { Metadata } from "next";
import Link from "next/link";
import CloudflareWebAnalytics from "../../CloudflareWebAnalytics";
import LanguagePreferenceRedirect from "../../LanguagePreferenceRedirect";
import LanguageSwitch from "../../LanguageSwitch";

const GITHUB_ISSUES_URL =
  "https://github.com/Ranats/vampir-support-hub/issues";
const DEVELOPER_X_URL = "https://x.com/Kokonoe_variant";

export const metadata: Metadata = {
  title: "運営・プライバシー方針｜VAMPIR 日課ナビ",
  description:
    "VAMPIR 日課ナビの運営方針、端末内データ、外部サービス、免責事項、お問い合わせ先をご案内します。",
  alternates: {
    canonical: "/policy",
    languages: { ja: "/policy", en: "/en/policy" },
  },
  openGraph: {
    type: "website",
    url: "/policy",
    locale: "ja_JP",
    title: "運営・プライバシー方針｜VAMPIR 日課ナビ",
    description:
      "VAMPIR 日課ナビの運営方針、端末内データ、外部サービス、免責事項、お問い合わせ先をご案内します。",
    images: [
      {
        url: "/og.png?v=20260730-2",
        width: 1200,
        height: 630,
        alt: "VAMPIR 日課ナビ — 次の出現と、今日やること。",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "運営・プライバシー方針｜VAMPIR 日課ナビ",
    description:
      "VAMPIR 日課ナビの運営方針、端末内データ、外部サービス、免責事項、お問い合わせ先をご案内します。",
    images: ["/og.png?v=20260730-2"],
  },
};

export default function PolicyPage() {
  return (
    <div className="policy-shell">
      <LanguagePreferenceRedirect page="policy" />
      <header className="policy-header">
        <Link className="brand" href="/" aria-label="VAMPIR 日課ナビへ戻る">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>
            <strong>VAMPIR</strong>
            <small>日課ナビ</small>
          </span>
        </Link>
        <div className="policy-header-actions">
          <LanguageSwitch locale="ja" page="policy" />
          <Link className="policy-back" href="/">
            <span className="policy-back-full">日課ナビへ戻る</span>
            <span className="policy-back-short">戻る</span>
          </Link>
        </div>
      </header>

      <main className="policy-main">
        <div className="policy-heading">
          <span className="eyebrow">SITE INFORMATION</span>
          <h1>運営・プライバシー方針</h1>
          <p>このサイトの扱う情報と、利用者データの取り扱いをまとめています。</p>
          <time dateTime="2026-08-14">最終更新：2026年8月14日</time>
        </div>

        <div className="policy-sections">
          <section className="policy-card">
            <h2>非公式ツールについて</h2>
            <p>
              VAMPIR 日課ナビは個人が運営する非公式のサポートツールです。
              NetmarbleおよびVAMPIRの運営・開発会社とは関係ありません。
            </p>
            <p>
              掲載時刻、回数、期限などは確認日を明示し、ゲーム内表示と公式告知を常に優先します。
              情報の完全性・正確性・継続提供を保証するものではありません。
            </p>
          </section>

          <section className="policy-card">
            <h2>端末内に保存するデータ</h2>
            <p>
              レベル、日課・週課・イベントミッションのチェック状況、自分で追加した項目、表示設定、出現通知対象、通知設定、言語設定、通知の重複防止記録、
              個人用クラン予定とそのタイムゾーン、クラン共有ポータルの閲覧・管理キーは、
              利用中のブラウザのローカルストレージに保存されます。
            </p>
            <ul>
              <li>ゲームアカウントへの接続や、ゲーム情報の自動取得は行いません。</li>
              <li>クラン共有ポータルでは、作成・変更時にクラン名、曜日・時刻、クラン予定のタイムゾーンを、閲覧・管理操作時に対応する秘密キーを認証のためAPIへ送信します。</li>
              <li>それ以外の端末内設定（レベル、日課・週課・イベントミッションのチェック状況、個人用リマインダー、通知設定など）は、運営者のサーバーへ送信しません。</li>
              <li>バックアップの書き出し・読み込みは、利用者が明示的に操作した場合だけ実行します。</li>
              <li>ブラウザのデータを削除すると、端末内の保存内容も失われる場合があります。</li>
            </ul>
          </section>

          <section className="policy-card">
            <h2>クラン共有ポータル</h2>
            <p>
              個人用クラン予定の曜日・時刻・タイムゾーンは、共有ポータル作成フォームの初期値として使用します。
              クランマスターが「共有ポータルを作成」を実行した場合だけ、その時点のクラン名、開催曜日・時刻、クラン予定のタイムゾーンをサーバーのデータベースへ保存します。
              個人用リマインダー、完了状況、レベル、通知設定、ゲームアカウント情報は共有しません。
            </p>
            <ul>
              <li>閲覧リンクと管理リンクは別々に発行し、秘密キーそのものはデータベースへ保存せず、照合用のハッシュだけを保存します。</li>
              <li>管理の秘密キーはポータル作成時に作成したブラウザへ保存し、閲覧・管理リンクを開いた場合はそのリンクの秘密キーを開いたブラウザへ保存します。</li>
              <li>管理リンクを持つ利用者は、予定変更、閲覧リンク再発行、ポータル削除ができます。</li>
              <li>タイムゾーンはユーザー入力のクラン予定だけに適用します。公式の出現・イベント予定と日次・週次リセットはJSTのままです。</li>
              <li>不正な大量作成を抑えるため、作成時のネットワークアドレスから一時的な照合キーを生成します。元のアドレスは保存せず、2時間を過ぎた照合記録は次のポータル作成時に削除します。</li>
              <li>ポータルの予定は、管理者が削除するまで保存します。</li>
            </ul>
          </section>

          <section className="policy-card">
            <h2>通知とPWA</h2>
            <p>
              通知権限は設定画面から利用者が操作した場合だけ要求します。
              現在の出現前通知はサイトが動作している間に限られ、サイトを閉じた後の定刻通知を保証しません。
              PWAを削除しても、ブラウザ側に保存データが残る場合があります。
            </p>
          </section>

          <section className="policy-card">
            <h2>アクセス解析・広告</h2>
            <p>
              日本語・英語の公開トップページと方針ページでは、Cloudflare Web Analyticsを使用しています。
              ページビュー、訪問、参照元、国、端末種別、ブラウザ、OS、ページ読み込み性能、
              Core Web Vitalsを集計し、計測に必要な情報をCloudflareへ送信します。
            </p>
            <p>
              Cloudflare Web Analyticsへ、ゲームアカウント、端末内の日課・週課・イベントミッションのチェック状況、レベル、通知設定、
              個人用クラン予定、クラン共有ポータルの閲覧・管理キーは送信しません。
              クラン共有ポータル（<code>/clan/*</code>、<code>/en/clan/*</code>）には解析タグを設置していません。
              現在、広告配信タグとアフィリエイト追跡タグは設置していません。
            </p>
            <p>
              将来、別の解析や広告を導入する場合は、導入前にこのページへ目的と取り扱いを追記します。
              スポンサーや広告を掲載する場合は、通常の案内と区別できるよう明示します。
            </p>
          </section>

          <section className="policy-card">
            <h2>外部サービスと支援</h2>
            <p>
              公式情報、参考記事、X、GitHub、Ko-fi、OFUSEへのリンクを掲載しています。
              移動後の情報や決済は各サービスの方針に従います。このサイト内には外部の決済画面や、
              支援先・外部リンク提供者による追跡スクリプトを埋め込みません。
            </p>
            <p>
              支援は任意で、支援の有無にかかわらず、すべての機能を無料で利用できます。
            </p>
          </section>

          <section className="policy-card" id="developer">
            <h2>開発者・更新情報</h2>
            <p>
              開発・運営：
              <a
                href={DEVELOPER_X_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="開発者X @Kokonoe_variantを新しいタブで開く"
              >
                @Kokonoe_variant
              </a>
              。更新情報の確認や連絡先として、こちらのXプロフィールをご案内しています。
            </p>
          </section>

          <section className="policy-card" id="contact">
            <h2>不具合・要望</h2>
            <p>
              不具合報告や改善要望は、公開の
              <a
                href={GITHUB_ISSUES_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Issuesを新しいタブで開く"
              >
                GitHub Issues
              </a>
              で受け付けています。ゲームアカウント、メールアドレスなどの個人情報や、クランポータルの管理リンクは投稿しないでください。
            </p>
          </section>
        </div>
      </main>

      <footer className="policy-footer">
        <Link href="/">VAMPIR 日課ナビへ戻る</Link>
      </footer>
      <CloudflareWebAnalytics />
    </div>
  );
}

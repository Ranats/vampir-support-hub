import type { Metadata } from "next";
import Link from "next/link";

const GITHUB_ISSUES_URL =
  "https://github.com/Ranats/vampir-support-hub/issues";
const DEVELOPER_X_URL = "https://x.com/Kokonoe_variant";

export const metadata: Metadata = {
  title: "運営・プライバシー方針｜VAMPIR 日課ナビ",
  description:
    "VAMPIR 日課ナビの運営方針、端末内データ、外部サービス、免責事項、お問い合わせ先をご案内します。",
  alternates: {
    canonical: "/policy",
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
      <header className="policy-header">
        <Link className="brand" href="/" aria-label="VAMPIR 日課ナビへ戻る">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>
            <strong>VAMPIR</strong>
            <small>日課ナビ</small>
          </span>
        </Link>
        <Link className="policy-back" href="/">日課ナビへ戻る</Link>
      </header>

      <main className="policy-main">
        <div className="policy-heading">
          <span className="eyebrow">SITE INFORMATION</span>
          <h1>運営・プライバシー方針</h1>
          <p>このサイトの扱う情報と、利用者データの取り扱いをまとめています。</p>
          <time dateTime="2026-07-30">最終更新：2026年7月30日</time>
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
              レベル、チェック状況、自分で追加した項目、表示設定、お気に入り、通知設定、通知の重複防止記録は、
              利用中のブラウザのローカルストレージに保存されます。
            </p>
            <ul>
              <li>ゲームアカウントへの接続や、ゲーム情報の自動取得は行いません。</li>
              <li>サイトのアプリケーションコードは、これらの設定を運営者のサーバーへ送信しません。</li>
              <li>バックアップの書き出し・読み込みは、利用者が明示的に操作した場合だけ実行します。</li>
              <li>ブラウザのデータを削除すると、端末内の保存内容も失われる場合があります。</li>
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
              現在、サイト独自のアクセス解析タグ、広告配信タグ、アフィリエイト追跡タグは設置していません。
              サイトの配信・セキュリティ維持のため、ホスティング事業者が通信情報を取り扱う場合があります。
            </p>
            <p>
              将来、解析や広告を導入する場合は、導入前にこのページへ目的と取り扱いを追記します。
              スポンサーや広告を掲載する場合は、通常の案内と区別できるよう明示します。
            </p>
          </section>

          <section className="policy-card">
            <h2>外部サービスと支援</h2>
            <p>
              公式情報、参考記事、X、GitHub、Ko-fi、OFUSEへのリンクを掲載しています。
              移動後の情報や決済は各サービスの方針に従います。このサイト内には外部の決済画面や追跡スクリプトを埋め込みません。
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
              で受け付けています。ゲームアカウント、メールアドレスなどの個人情報は投稿しないでください。
            </p>
          </section>
        </div>
      </main>

      <footer className="policy-footer">
        <Link href="/">VAMPIR 日課ナビへ戻る</Link>
      </footer>
    </div>
  );
}

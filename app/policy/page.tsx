import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "運営・プライバシー方針｜VAMPIR 日課ナビ",
  description: "VAMPIR 日課ナビが保存するデータ、クラン共有ポータル、通知、外部サービスについて説明します。",
};

export default function PolicyPage() {
  return (
    <main className="clan-portal-shell">
      <header className="clan-portal-topbar">
        <Link className="brand" href="/" aria-label="VAMPIR 日課ナビへ戻る">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span><strong>VAMPIR</strong><small>日課ナビ</small></span>
        </Link>
        <Link className="policy-back" href="/">日課ナビへ戻る</Link>
      </header>

      <div className="clan-portal-main policy-main">
        <div className="clan-portal-heading">
          <span className="eyebrow">POLICY</span>
          <h1>運営・プライバシー方針</h1>
          <p>端末内だけに保存する個人データと、利用者が明示的に共有するクラン予定を分けて扱います。</p>
          <time dateTime="2026-07-30">最終更新：2026年7月30日</time>
        </div>

        <div className="policy-sections">
          <section className="policy-card panel">
            <h2>非公式ツールについて</h2>
            <p>VAMPIR 日課ナビは個人が運営する非公式のサポートツールです。NetmarbleおよびVAMPIRの運営・開発会社とは関係ありません。</p>
            <p>掲載時刻、回数、期限などは確認日を明示し、ゲーム内表示と公式告知を常に優先します。</p>
          </section>

          <section className="policy-card panel">
            <h2>端末内に保存する個人データ</h2>
            <p>レベル、チェック状況、自分で追加した項目、表示設定、お気に入り、個人用クラン予定、通知設定は、利用中のブラウザのローカルストレージに保存します。</p>
            <ul>
              <li>これらの個人データは、クラン共有ポータルの作成・閲覧によってサーバーへ送信されません。</li>
              <li>ゲームアカウントへの接続や、ゲーム情報の自動取得は行いません。</li>
              <li>ブラウザのデータを削除すると、端末内の保存内容も失われる場合があります。</li>
            </ul>
          </section>

          <section className="policy-card panel">
            <h2>クラン共有ポータル</h2>
            <p>クランマスターが「共有ポータルを作成」を実行した場合だけ、クラン名とクランコンテンツの開催曜日・時刻をサーバーのデータベースへ保存します。</p>
            <ul>
              <li>完了状況、レベル、個人用リマインダー、通知権限、ゲームアカウント情報は共有しません。</li>
              <li>閲覧リンクと管理リンクは別々に発行し、秘密キーそのものはデータベースへ保存せず、照合用のハッシュだけを保存します。</li>
              <li>管理リンクを持つ利用者は、予定変更、閲覧リンク再発行、ポータル削除ができます。</li>
              <li>不正な大量作成を抑えるため、作成時のネットワークアドレスから一時的な照合キーを生成します。元のアドレスは保存せず、2時間を過ぎた照合記録は次のポータル作成時に削除します。</li>
              <li>ポータルの予定は、管理者が削除するまで保存します。</li>
            </ul>
          </section>

          <section className="policy-card panel">
            <h2>通知とPWA</h2>
            <p>通知権限は設定画面から利用者が操作した場合だけ要求します。現在の通知はサイトが動作している間に限られ、サイトを閉じた後の定刻通知を保証しません。</p>
          </section>

          <section className="policy-card panel">
            <h2>アクセス解析・広告・外部サービス</h2>
            <p>現在、サイト独自のアクセス解析タグ、広告配信タグ、アフィリエイト追跡タグは設置していません。イベント詳細、共有、支援などの外部リンクを選んだ場合は、移動先サービスの方針が適用されます。</p>
          </section>

          <section className="policy-card panel">
            <h2>問い合わせ</h2>
            <p>不具合・要望・データの扱いに関する連絡は、公開リポジトリの<a href="https://github.com/Ranats/vampir-support-hub/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a>で受け付けます。公開投稿に秘密の管理リンクや個人情報を書かないでください。</p>
          </section>
        </div>
      </div>
    </main>
  );
}

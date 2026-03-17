# あさタクシー 予約システム

LINE公式アカウントから利用可能な、介護タクシー専用の予約受付Webアプリケーションです。
Google Apps Script (GAS) 上で動作し、Googleカレンダーと連携して予約の空き状況管理と自動登録を行います。

## 特徴
- **リアルタイム空き状況確認**: Googleカレンダーの予定を読み取り、予約可能な枠（15分刻み）を自動表示します。
- **概算料金計算**: Google Maps API を使用し、出発地・目的地間の距離から自動的に運賃・介助料の見積もりを表示します。
- **個人情報保護**: 送信前に「個人情報の取り扱いについて」への同意を必須とする機能を備えています。
- **管理者通知**: 新規予約が入ると、管理者に詳細な内容がメール通知され、カレンダーに自動登録されます。

## システム構成
- **フロントエンド**: HTML5, CSS3, JavaScript (Vanilla JS)
- **バックエンド**: Google Apps Script (GAS)
- **外部連携**: Google Calendar API, Google Maps Directions API

## ファイル構成
- `reservation_form.html`: 予約フォームのメインUI
- `reservation_app.gs`: GAS側のバックエンド処理（カレンダー連携、料金計算など）
- `send_notification.gs`: メール通知・重複チェックロジック
- `calendar_integration.gs`: カレンダー登録用スクリプト

## セットアップ
1. Google Apps Script プロジェクトを作成します。
2. `reservation_app.gs` などの `.gs` ファイルをコードエディタに貼り付けます。
3. `reservation_form.html` をHTMLファイルとして追加します。
4. Google Maps API を有効化し、適切な権限を付与します。
5. Webアプリとしてデプロイし、公開URLを取得してLINEのリッチメニュー等に設定します。

## 開発・運営
あさタクシー
代表：平田隼己

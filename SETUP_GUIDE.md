# 勤務月報管理システム セットアップガイド

このガイドでは、勤務月報管理システムを Firebase にデプロイして運用開始するまでの手順を説明します。

## 前提条件

- Node.js 18 以上がインストールされていること
- npm がインストールされていること
- Google アカウント（Firebase用）
- Git がインストールされていること

## 1. リポジトリのクローン

```bash
git clone https://github.com/hn770123/apro-timecard-b3.git
cd apro-timecard-b3
```

## 2. 依存関係のインストール

```bash
npm install
```

## 3. Firebase プロジェクトの作成

### 3.1 Firebase Console でプロジェクトを作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `apro-timecard`）
4. Google Analytics は任意で有効化
5. プロジェクトの作成を完了

### 3.2 Firebase Authentication の設定

1. Firebase Console の左メニューから「Authentication」を選択
2. 「始める」をクリック
3. 「Sign-in method」タブを選択
4. 「メール/パスワード」を有効化
5. 保存

### 3.3 Cloud Firestore の設定

1. Firebase Console の左メニューから「Firestore Database」を選択
2. 「データベースの作成」をクリック
3. 本番モードを選択（セキュリティルールは後で設定）
4. ロケーションを選択（例: `asia-northeast1` - 東京）
5. 有効化

### 3.4 Firebase 設定情報の取得

1. Firebase Console のプロジェクト設定（歯車アイコン）を開く
2. 「全般」タブの「マイアプリ」セクションで、Webアプリを追加
3. アプリのニックネームを入力（例: `timecard-web`）
4. Firebase Hosting は後で設定するので、チェックなしで進める
5. 表示される Firebase SDK の設定情報をメモ

## 4. 環境変数の設定

`.env.local` ファイルをプロジェクトルートに作成し、Firebase 設定情報を記入：

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 5. Firestore セキュリティルールのデプロイ

### 5.1 Firebase CLI のインストール

```bash
npm install -g firebase-tools
```

### 5.2 Firebase にログイン

```bash
firebase login
```

### 5.3 Firebase プロジェクトの初期化

```bash
firebase use --add
```

作成したプロジェクトを選択し、エイリアスを設定（例: `default`）

`.firebaserc` ファイルを編集してプロジェクトIDを設定：

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

### 5.4 Firestore ルールのデプロイ

```bash
firebase deploy --only firestore:rules
```

## 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## 7. 初回ユーザーの作成と管理者権限の付与

### 7.1 ユーザーの作成

1. ログインページで新規ユーザーとして登録
2. メールアドレスとパスワードを設定

### 7.2 管理者権限の付与

Firebase Console で手動で権限を付与：

1. Firebase Console の「Firestore Database」を開く
2. `users` コレクションから作成したユーザーのドキュメントを開く
3. `roles` フィールドを編集
4. 配列に以下を追加：
   ```
   ["general", "approver", "admin"]
   ```
5. 保存

これで、全ての権限（一般、承認者、管理者）が付与されます。

## 8. 本番ビルドとデプロイ

### 8.1 本番ビルド

```bash
npm run build
```

### 8.2 Firebase Hosting の設定

`firebase.json` を確認（既に設定済み）：

```json
{
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 8.3 静的エクスポート

Next.js の設定を静的エクスポート用に更新（`next.config.js`）：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
```

### 8.4 エクスポートとデプロイ

```bash
# ビルドとエクスポート
npm run build

# Firebaseにデプロイ
firebase deploy --only hosting
```

デプロイ完了後、表示されるURLにアクセスしてアプリを確認できます。

## 9. ユーザー管理

### 新しいユーザーの追加

1. ログイン画面から新規登録
2. 管理者がユーザー管理画面で権限を付与

### 権限の種類

- **一般（general）**: 自分の勤務データの入力・編集
- **承認者（approver）**: 勤務データの承認・却下、承認取り消し
- **管理者（admin）**: ユーザー権限の管理

一人のユーザーに複数の権限を付与できます。

## 10. 運用

### 月次勤務データの入力

1. ダッシュボードから「新しい月の勤務データを作成」
2. 基本情報（氏名、所属、勤務パターン）を入力
3. 日次勤務データを入力
4. 保存
5. 入力完了後、「承認申請」をクリック

### 承認ワークフロー

1. 承認者は「承認管理」画面で承認待ちデータを確認
2. 詳細を確認後、承認または却下
3. 承認されたデータは編集不可（閲覧のみ）
4. 必要に応じて承認を取り消し可能

### データのエクスポート

1. 勤務データ画面で「集計」タブを表示
2. 「CSVエクスポート」ボタンをクリック
3. ダウンロードされたCSVファイルを利用

## トラブルシューティング

### ビルドエラーが発生する

- Node.js のバージョンを確認（18以上）
- `node_modules` を削除して再インストール
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### Firebase の接続エラー

- `.env.local` の設定を確認
- Firebase Console で API キーが有効か確認
- ブラウザのキャッシュをクリア

### 権限エラー

- Firestore のセキュリティルールが正しくデプロイされているか確認
- ユーザーの `roles` フィールドが正しく設定されているか確認

## サポート

問題が発生した場合は、GitHub Issues でご報告ください。

## ライセンス

ISC

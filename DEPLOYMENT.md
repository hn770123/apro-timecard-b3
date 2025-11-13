# デプロイメントガイド

## Firebase Hosting へのデプロイ

### 前提条件
- Firebase CLI がインストール済み
- Firebase プロジェクトが作成済み
- `.env.local` が正しく設定済み

### デプロイ手順

#### 1. 静的エクスポート用の設定

`next.config.js` を編集し、静的エクスポートを有効化：

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

#### 2. ビルドとエクスポート

```bash
npm run build
```

このコマンドで `out` ディレクトリに静的ファイルが生成されます。

#### 3. Firebase へデプロイ

```bash
# Firestore ルールとホスティングの両方をデプロイ
firebase deploy

# ホスティングのみデプロイ
firebase deploy --only hosting

# Firestore ルールのみデプロイ
firebase deploy --only firestore:rules
```

#### 4. デプロイの確認

デプロイ完了後、表示される URL にアクセスして動作を確認します。

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project-id/overview
Hosting URL: https://your-project-id.web.app
```

## 注意事項

### 環境変数について

- `.env.local` ファイルは Git にコミットされません
- デプロイ時は、ビルド前に環境変数が読み込まれます
- Firebase の設定情報は静的ファイルに含まれるため、セキュリティルールで保護が重要

### セキュリティ

- Firestore セキュリティルールを必ずデプロイしてください
- Firebase Console で Authentication の設定を確認してください
- 本番環境では、許可されたドメインのみを設定してください

### パフォーマンス最適化

1. **画像の最適化**
   - 静的エクスポートでは Next.js Image 最適化が無効
   - 必要に応じて画像を事前に最適化

2. **キャッシュ設定**
   - Firebase Hosting は自動的に適切なキャッシュヘッダーを設定
   - 必要に応じて `firebase.json` でカスタマイズ可能

3. **CDN 配信**
   - Firebase Hosting は自動的に CDN で配信

## トラブルシューティング

### デプロイエラー

```bash
# Firebase にログインし直す
firebase logout
firebase login

# プロジェクトを再設定
firebase use --add
```

### ビルドエラー

```bash
# キャッシュをクリア
rm -rf .next out

# 再ビルド
npm run build
```

### 環境変数が反映されない

1. `.env.local` の内容を確認
2. 変数名が `NEXT_PUBLIC_` で始まっているか確認
3. サーバーを再起動

```bash
# 開発サーバーの場合
npm run dev
```

## 継続的デプロイ（CI/CD）

### GitHub Actions の例

`.github/workflows/deploy.yml` を作成：

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
        run: npm run build
        
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
```

### GitHub Secrets の設定

GitHub リポジトリの Settings > Secrets and variables > Actions で以下を設定：

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT`（Firebase Console から取得）

## 本番環境の監視

### Firebase Console での監視

1. **Authentication**
   - ユーザー数の確認
   - ログイン状況の確認

2. **Firestore**
   - 読み取り/書き込み回数の確認
   - データ容量の確認

3. **Hosting**
   - トラフィックの確認
   - 転送量の確認

### エラー監視

Firebase には、エラー追跡のための Crashlytics や Performance Monitoring も利用可能です。

## 更新とロールバック

### 新バージョンのデプロイ

```bash
# コードを更新
git pull

# ビルドとデプロイ
npm run build
firebase deploy
```

### ロールバック

Firebase Console の Hosting ページから、以前のバージョンにロールバックできます。

1. Hosting を開く
2. リリース履歴を表示
3. 以前のバージョンを選択
4. 「ロールバック」をクリック

## カスタムドメインの設定

1. Firebase Console の Hosting を開く
2. 「カスタムドメインを追加」をクリック
3. ドメインを入力
4. DNS レコードを設定
5. SSL 証明書が自動的にプロビジョニングされます

## コスト管理

Firebase の無料枠：
- Firestore: 1日50,000回の読み取り、20,000回の書き込み、20,000回の削除
- Hosting: 10GB/月のストレージ、360MB/日の転送量
- Authentication: 無制限

大規模運用の場合は、Firebase Console でコストを監視してください。

# 勤務月報管理システム

Firebase向けの月次勤務時間の入力・承認・集計を行うWebアプリケーション

## 機能概要

### ユーザー認証
- Firebase Authenticationによるログイン認証
- 3つの権限レベル：
  - **一般ユーザー（入力者）**: 自分の勤務データの入力・編集
  - **承認者**: 勤務データの承認・却下、承認取り消し
  - **システム管理者**: ユーザー権限の管理
- 1人のユーザーに複数の権限を付与可能

### 月次勤務入力
#### 月次基本情報（前月からの引き継ぎ可能）
- 氏名
- 所属
- 勤務パターン（最大3つ、最低1つ必須）
  - 始業時刻・終業時刻
  - 休憩時間（最大3つ、最低0）
- 標準就労時間（デフォルト8時間）

#### 日次入力
- 勤務種類：
  - 出勤
  - 遅刻
  - 早退
  - 遅刻・早退（両方選択可）
  - 休日（法定）
  - 休日（法定外）
  - 出勤（リモート）
- 出勤時刻・退勤時刻
- 遅刻時間（自動計算、手動変更可）
- 早退時間（自動計算、手動変更可）
- 残業時間（自動計算、手動変更可）
  - 通常残業
  - 深夜早朝残業（22:00-5:00）
  - 法定休日残業
  - 法定外休日残業
- 休暇種類：
  - 有給休暇
  - 欠勤
  - 特別休暇
  - 慶弔休暇
- 補足欄（出勤以外の場合は入力必須アラート表示）
- 勤務パターンの日別選択

### 自動計算機能
- 遅刻時間：実際の出勤時刻が始業時刻より遅い場合に自動計算
- 早退時間：実際の退勤時刻が終業時刻より早い場合に自動計算
- 残業時間：標準就労時間を超えた分を自動計算
- 休日出勤時の標準就労時間は0として計算
- 残業時間の分類（通常、深夜早朝、法定休日、法定外休日）

### 承認ワークフロー
- 承認申請機能
- 承認者による承認・却下
- 承認後のデータロック（閲覧のみ可能）
- 承認取り消し機能（承認者権限）

### 集計・エクスポート
- 月間勤務データの集計表示
  - 総出勤日数
  - 総労働時間
  - 遅刻・早退時間
  - 残業時間（分類別）
  - 休暇日数（種類別）
- CSVエクスポート機能

## セットアップ

### 前提条件
- Node.js 18以上
- Firebase プロジェクト

### Firebase設定

1. Firebaseコンソールでプロジェクトを作成
2. Authentication を有効化（Email/Password認証）
3. Cloud Firestore を有効化
4. Firebase設定情報を取得

### 環境変数の設定

`.env.local`ファイルを作成し、Firebase設定を記入：

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### インストールと起動

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

### ビルドとデプロイ

```bash
# 本番ビルド
npm run build

# 本番サーバーの起動
npm start
```

## Firestoreデータ構造

### users コレクション
```typescript
{
  uid: string,              // Firebase Auth UID
  email: string,
  displayName: string,
  roles: UserRole[],        // ['general', 'approver', 'admin']
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### timecards コレクション
```typescript
{
  id: string,               // userId_YYYY_MM
  userId: string,
  year: number,
  month: number,
  employeeName: string,
  department: string,
  workPatterns: WorkPattern[],
  standardWorkHours: number,
  dailyWorks: DailyWork[],
  approvalStatus: string,   // 'draft' | 'pending' | 'approved' | 'rejected'
  approvalHistory: ApprovalHistory[],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Firestoreセキュリティルール（推奨）

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーコレクション
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      ('admin' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles);
    }
    
    // タイムカードコレクション
    match /timecards/{timecardId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && (
        // 自分のデータで承認前
        (request.resource.data.userId == request.auth.uid && 
         resource.data.approvalStatus in ['draft', 'rejected']) ||
        // 承認者権限
        ('approver' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles)
      );
    }
  }
}
```

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **認証**: Firebase Authentication
- **データベース**: Cloud Firestore
- **ホスティング**: Firebase Hosting（推奨）

## 画面構成

1. **ログイン画面** (`/login`)
2. **ダッシュボード** (`/dashboard`) - 月次データ一覧
3. **勤務入力画面** (`/timecards/[year]/[month]`) - 日次入力と集計
4. **承認管理画面** (`/approval`) - 承認者専用
5. **ユーザー管理画面** (`/admin`) - 管理者専用

## ライセンス

ISC

## 開発者向けメモ

- 承認済みデータは編集不可（閲覧のみ）
- 前月のデータは自動的に引き継がれる
- 時間計算はすべて分単位で行われる
- 深夜早朝時間帯は22:00-5:00として定義
- 休日出勤時は標準就労時間を0として残業計算を行う

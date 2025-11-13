/**
 * Firestore 初期化スクリプト
 * 
 * このスクリプトは、Firestoreに初期データを設定します。
 * 実行前に Firebase Admin SDK の設定が必要です。
 * 
 * 使い方:
 * 1. Firebase Console からサービスアカウントキーをダウンロード
 * 2. serviceAccountKey.json として保存
 * 3. node scripts/init-firestore.js を実行
 */

// このスクリプトは参考用です
// 実際の運用では、Firebase Admin SDK を使用して初期化を行ってください

console.log('Firestore初期化スクリプト（参考用）');
console.log('');
console.log('初回ユーザーの作成と管理者権限の付与手順:');
console.log('');
console.log('1. アプリにログインして新規ユーザーを作成');
console.log('2. Firebase Console を開く');
console.log('3. Firestore Database を選択');
console.log('4. users コレクションを開く');
console.log('5. 作成したユーザーのドキュメントを開く');
console.log('6. roles フィールドを編集');
console.log('7. 以下の配列を設定:');
console.log('   ["general", "approver", "admin"]');
console.log('8. 保存');
console.log('');
console.log('これで全ての権限が付与されます。');
console.log('');
console.log('Firebase Admin SDK を使用する場合の例:');
console.log('');
console.log('```javascript');
console.log('const admin = require("firebase-admin");');
console.log('const serviceAccount = require("./serviceAccountKey.json");');
console.log('');
console.log('admin.initializeApp({');
console.log('  credential: admin.credential.cert(serviceAccount)');
console.log('});');
console.log('');
console.log('const db = admin.firestore();');
console.log('');
console.log('async function setAdminRole(userId) {');
console.log('  await db.collection("users").doc(userId).update({');
console.log('    roles: ["general", "approver", "admin"],');
console.log('    updatedAt: admin.firestore.FieldValue.serverTimestamp()');
console.log('  });');
console.log('  console.log("管理者権限を設定しました");');
console.log('}');
console.log('');
console.log('// 使用例');
console.log('// setAdminRole("user-uid-here");');
console.log('```');

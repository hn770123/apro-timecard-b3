/**
 * ルートレイアウト
 * 全ページに共通するレイアウトと設定
 */

import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/hooks/useAuth';

export const metadata: Metadata = {
  title: '勤務月報管理システム',
  description: '月次勤務時間の入力・承認・集計を行うWebアプリケーション',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

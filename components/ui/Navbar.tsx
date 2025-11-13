/**
 * ナビゲーションバーコンポーネント
 * サイト全体のナビゲーションを提供
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { UserRole } from '@/types';

export default function Navbar() {
  const { user, signOut, hasRole } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="bg-primary-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold hover:text-primary-200 transition-colors">
              勤務月報管理
            </Link>
            {user && (
              <>
                <Link href="/timecards" className="hover:text-primary-200 transition-colors">
                  勤務入力
                </Link>
                {hasRole(UserRole.APPROVER) && (
                  <Link href="/approval" className="hover:text-primary-200 transition-colors">
                    承認管理
                  </Link>
                )}
                {hasRole(UserRole.ADMIN) && (
                  <Link href="/admin" className="hover:text-primary-200 transition-colors">
                    ユーザー管理
                  </Link>
                )}
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-primary-600 hover:bg-primary-500 px-4 py-2 rounded-lg transition-colors"
                >
                  ログアウト
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

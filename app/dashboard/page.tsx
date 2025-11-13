/**
 * ダッシュボードページ
 * ユーザーの月次勤務データ一覧と主要機能へのアクセスを提供
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserTimecards } from '@/lib/firebase/timecardService';
import { MonthlyTimecard, ApprovalStatus } from '@/types';
import Navbar from '@/components/ui/Navbar';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [timecards, setTimecards] = useState<MonthlyTimecard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadTimecards();
    }
  }, [user]);

  const loadTimecards = async () => {
    if (!user) return;
    
    try {
      const data = await getUserTimecards(user.uid);
      setTimecards(data);
    } catch (error) {
      console.error('Error loading timecards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.DRAFT:
        return <span className="badge badge-draft">下書き</span>;
      case ApprovalStatus.PENDING:
        return <span className="badge badge-pending">承認待ち</span>;
      case ApprovalStatus.APPROVED:
        return <span className="badge badge-approved">承認済み</span>;
      case ApprovalStatus.REJECTED:
        return <span className="badge badge-rejected">却下</span>;
      default:
        return <span className="badge badge-draft">不明</span>;
    }
  };

  const createNewTimecard = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    router.push(`/timecards/${year}/${month}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="mt-2 text-gray-600">月次勤務データの管理</p>
        </div>

        <div className="mb-6">
          <button
            onClick={createNewTimecard}
            className="btn-primary"
          >
            新しい月の勤務データを作成
          </button>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">月次勤務データ一覧</h2>
          
          {timecards.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>まだ勤務データがありません。</p>
              <p className="mt-2">「新しい月の勤務データを作成」ボタンから作成してください。</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>年月</th>
                    <th>氏名</th>
                    <th>所属</th>
                    <th>ステータス</th>
                    <th>最終更新</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timecards.map((timecard) => (
                    <tr key={timecard.id}>
                      <td className="font-medium">
                        {timecard.year}年{timecard.month}月
                      </td>
                      <td>{timecard.employeeName}</td>
                      <td>{timecard.department}</td>
                      <td>{getStatusBadge(timecard.approvalStatus)}</td>
                      <td>
                        {new Date(timecard.updatedAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td>
                        <Link
                          href={`/timecards/${timecard.year}/${timecard.month}`}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                        >
                          {timecard.approvalStatus === ApprovalStatus.APPROVED ? '詳細' : '編集'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

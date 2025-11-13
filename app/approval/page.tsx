/**
 * 承認管理ページ
 * 承認待ちの勤務データを確認し、承認/却下を行う
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getPendingTimecards,
  approveTimecard,
  rejectTimecard,
  cancelApproval,
  getMonthlyTimecard,
} from '@/lib/firebase/timecardService';
import { MonthlyTimecard, UserRole } from '@/types';
import Navbar from '@/components/ui/Navbar';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function ApprovalPage() {
  const { user, loading: authLoading, hasRole } = useAuth();
  const router = useRouter();
  const [timecards, setTimecards] = useState<MonthlyTimecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimecard, setSelectedTimecard] = useState<MonthlyTimecard | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !hasRole(UserRole.APPROVER))) {
      router.push('/dashboard');
    }
  }, [user, authLoading, hasRole, router]);

  useEffect(() => {
    if (user && hasRole(UserRole.APPROVER)) {
      loadTimecards();
    }
  }, [user, hasRole]);

  const loadTimecards = async () => {
    try {
      const data = await getPendingTimecards();
      setTimecards(data);
    } catch (error) {
      console.error('Error loading timecards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (timecard: MonthlyTimecard) => {
    if (!user) return;

    if (window.confirm('この勤務データを承認しますか？')) {
      setProcessing(true);
      try {
        await approveTimecard(
          timecard.userId,
          timecard.year,
          timecard.month,
          user.uid,
          user.displayName,
          comment || undefined
        );
        alert('承認しました。');
        setComment('');
        setSelectedTimecard(null);
        await loadTimecards();
      } catch (error) {
        console.error('Error approving timecard:', error);
        alert('承認に失敗しました。');
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleReject = async (timecard: MonthlyTimecard) => {
    if (!user) return;

    const rejectComment = window.prompt('却下理由を入力してください：', comment);
    if (!rejectComment) {
      alert('却下理由の入力が必要です。');
      return;
    }

    setProcessing(true);
    try {
      await rejectTimecard(
        timecard.userId,
        timecard.year,
        timecard.month,
        user.uid,
        user.displayName,
        rejectComment
      );
      alert('却下しました。');
      setComment('');
      setSelectedTimecard(null);
      await loadTimecards();
    } catch (error) {
      console.error('Error rejecting timecard:', error);
      alert('却下に失敗しました。');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelApproval = async (userId: string, year: number, month: number) => {
    if (!user) return;

    const cancelComment = window.prompt('承認取り消しの理由を入力してください（任意）：');
    
    if (window.confirm('承認を取り消しますか？')) {
      setProcessing(true);
      try {
        await cancelApproval(userId, year, month, user.uid, user.displayName, cancelComment || undefined);
        alert('承認を取り消しました。');
        await loadTimecards();
      } catch (error) {
        console.error('Error canceling approval:', error);
        alert('承認取り消しに失敗しました。');
      } finally {
        setProcessing(false);
      }
    }
  };

  const viewDetails = async (timecard: MonthlyTimecard) => {
    try {
      const fullData = await getMonthlyTimecard(timecard.userId, timecard.year, timecard.month);
      setSelectedTimecard(fullData);
    } catch (error) {
      console.error('Error loading timecard details:', error);
      alert('詳細の読み込みに失敗しました。');
    }
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
          <h1 className="text-3xl font-bold text-gray-900">承認管理</h1>
          <p className="mt-2 text-gray-600">承認待ちの勤務データを確認してください</p>
        </div>

        {timecards.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">承認待ちの勤務データはありません。</p>
          </div>
        ) : (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">承認待ちリスト</h2>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>年月</th>
                    <th>氏名</th>
                    <th>所属</th>
                    <th>申請日</th>
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
                      <td>
                        {new Date(timecard.updatedAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewDetails(timecard)}
                            className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                          >
                            詳細
                          </button>
                          <button
                            onClick={() => handleApprove(timecard)}
                            disabled={processing}
                            className="text-green-600 hover:text-green-800 font-medium text-sm disabled:opacity-50"
                          >
                            承認
                          </button>
                          <button
                            onClick={() => handleReject(timecard)}
                            disabled={processing}
                            className="text-red-600 hover:text-red-800 font-medium text-sm disabled:opacity-50"
                          >
                            却下
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 詳細モーダル */}
        {selectedTimecard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">
                  {selectedTimecard.year}年{selectedTimecard.month}月 勤務データ詳細
                </h2>
                <button
                  onClick={() => setSelectedTimecard(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">氏名</label>
                    <p className="mt-1 text-gray-900">{selectedTimecard.employeeName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">所属</label>
                    <p className="mt-1 text-gray-900">{selectedTimecard.department}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">標準就労時間</label>
                    <p className="mt-1 text-gray-900">{selectedTimecard.standardWorkHours}時間</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">勤務パターン数</label>
                    <p className="mt-1 text-gray-900">{selectedTimecard.workPatterns.length}個</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    コメント（任意）
                  </label>
                  <textarea
                    className="input-field"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="承認/却下時のコメントを入力..."
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    onClick={() => setSelectedTimecard(null)}
                    className="btn-secondary"
                  >
                    閉じる
                  </button>
                  <button
                    onClick={() => handleReject(selectedTimecard)}
                    disabled={processing}
                    className="btn-danger disabled:opacity-50"
                  >
                    却下
                  </button>
                  <button
                    onClick={() => handleApprove(selectedTimecard)}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
                  >
                    承認
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

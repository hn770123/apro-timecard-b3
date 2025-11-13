/**
 * 月次勤務入力・編集ページ
 * 日次勤務データの入力と月次データの管理を行う
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getMonthlyTimecard,
  createMonthlyTimecard,
  updateMonthlyTimecard,
  copyPreviousMonthData,
  submitForApproval,
} from '@/lib/firebase/timecardService';
import {
  MonthlyTimecard,
  WorkPattern,
  DailyWork,
  WorkType,
  LeaveType,
  ApprovalStatus,
} from '@/types';
import { calculateDailyWork } from '@/lib/utils/timeCalculations';
import Navbar from '@/components/ui/Navbar';
import WorkPatternForm from '@/components/timecard/WorkPatternForm';
import DailyWorkTable from '@/components/timecard/DailyWorkTable';
import MonthlySummaryView from '@/components/timecard/MonthlySummaryView';

interface PageProps {
  params: Promise<{ year: string; month: string }>;
}

export default function TimecardEditPage({ params }: PageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ year: number; month: number } | null>(null);
  const [timecard, setTimecard] = useState<MonthlyTimecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [department, setDepartment] = useState('');
  const [standardWorkHours, setStandardWorkHours] = useState(8);
  const [workPatterns, setWorkPatterns] = useState<WorkPattern[]>([]);
  const [dailyWorks, setDailyWorks] = useState<DailyWork[]>([]);
  const [activeTab, setActiveTab] = useState<'input' | 'summary'>('input');

  useEffect(() => {
    params.then(p => {
      setResolvedParams({ year: parseInt(p.year), month: parseInt(p.month) });
    });
  }, [params]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && resolvedParams) {
      loadTimecard();
    }
  }, [user, resolvedParams]);

  const loadTimecard = async () => {
    if (!user || !resolvedParams) return;

    try {
      let data = await getMonthlyTimecard(user.uid, resolvedParams.year, resolvedParams.month);

      if (!data) {
        // 新規作成：前月のデータをコピー
        const prevData = await copyPreviousMonthData(user.uid, resolvedParams.year, resolvedParams.month);
        
        setEmployeeName(prevData?.employeeName || user.displayName || '');
        setDepartment(prevData?.department || '');
        setStandardWorkHours(prevData?.standardWorkHours || 8);
        setWorkPatterns(prevData?.workPatterns || [getDefaultWorkPattern()]);
        setDailyWorks(generateMonthDays(resolvedParams.year, resolvedParams.month));
      } else {
        setTimecard(data);
        setEmployeeName(data.employeeName);
        setDepartment(data.department);
        setStandardWorkHours(data.standardWorkHours);
        setWorkPatterns(data.workPatterns.length > 0 ? data.workPatterns : [getDefaultWorkPattern()]);
        setDailyWorks(data.dailyWorks);
      }
    } catch (error) {
      console.error('Error loading timecard:', error);
      alert('勤務データの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultWorkPattern = (): WorkPattern => ({
    id: 'pattern1',
    name: 'パターン1',
    startTime: '09:00',
    endTime: '18:00',
    breakTimes: [{ startTime: '12:00', endTime: '13:00' }],
  });

  const generateMonthDays = (year: number, month: number): DailyWork[] => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: DailyWork[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date,
        workType: WorkType.ATTENDANCE,
        workPatternId: 'pattern1',
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        overtimeMinutes: 0,
        overtimeBreakdown: {
          regular: 0,
          lateNight: 0,
          legalHoliday: 0,
          nonLegalHoliday: 0,
        },
        leaveType: LeaveType.NONE,
        remarks: '',
      });
    }

    return days;
  };

  const handleSave = async () => {
    if (!user || !resolvedParams) return;

    if (!employeeName.trim()) {
      alert('氏名を入力してください。');
      return;
    }

    if (workPatterns.length === 0) {
      alert('勤務パターンを最低1つ登録してください。');
      return;
    }

    setSaving(true);

    try {
      const timecardData: Partial<MonthlyTimecard> = {
        employeeName,
        department,
        workPatterns,
        standardWorkHours,
        dailyWorks,
      };

      if (timecard) {
        await updateMonthlyTimecard(user.uid, resolvedParams.year, resolvedParams.month, timecardData);
      } else {
        await createMonthlyTimecard(user.uid, resolvedParams.year, resolvedParams.month, timecardData);
      }

      alert('保存しました。');
      await loadTimecard();
    } catch (error) {
      console.error('Error saving timecard:', error);
      alert('保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!user || !resolvedParams) return;

    if (!timecard) {
      alert('先に保存してください。');
      return;
    }

    if (window.confirm('承認申請を行いますか？申請後は編集できなくなります。')) {
      try {
        await submitForApproval(user.uid, resolvedParams.year, resolvedParams.month);
        alert('承認申請を送信しました。');
        router.push('/dashboard');
      } catch (error) {
        console.error('Error submitting for approval:', error);
        alert('承認申請に失敗しました。');
      }
    }
  };

  const handleDailyWorkChange = (index: number, updatedWork: Partial<DailyWork>) => {
    const newDailyWorks = [...dailyWorks];
    const currentWork = newDailyWorks[index];
    const pattern = workPatterns.find(p => p.id === (updatedWork.workPatternId || currentWork.workPatternId));

    if (pattern) {
      newDailyWorks[index] = calculateDailyWork(
        { ...currentWork, ...updatedWork },
        pattern,
        standardWorkHours
      );
    } else {
      newDailyWorks[index] = { ...currentWork, ...updatedWork };
    }

    setDailyWorks(newDailyWorks);
  };

  const isLocked = timecard?.approvalStatus === ApprovalStatus.APPROVED;

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

  if (!resolvedParams) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {resolvedParams.year}年{resolvedParams.month}月 勤務データ
            {isLocked && <span className="ml-3 badge badge-approved">承認済み（閲覧のみ）</span>}
          </h1>
        </div>

        {/* タブ */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('input')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'input'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              勤務入力
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summary'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              集計
            </button>
          </nav>
        </div>

        {activeTab === 'input' && (
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">基本情報</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    氏名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    disabled={isLocked}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    所属
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={isLocked}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    標準就労時間（時間）
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={standardWorkHours}
                    onChange={(e) => setStandardWorkHours(Number(e.target.value))}
                    disabled={isLocked}
                    min="0"
                    max="24"
                    step="0.5"
                  />
                </div>
              </div>
            </div>

            {/* 勤務パターン */}
            <WorkPatternForm
              patterns={workPatterns}
              onChange={setWorkPatterns}
              disabled={isLocked}
            />

            {/* 日次勤務入力 */}
            <DailyWorkTable
              dailyWorks={dailyWorks}
              workPatterns={workPatterns}
              onChange={handleDailyWorkChange}
              disabled={isLocked}
            />

            {/* 保存ボタン */}
            {!isLocked && (
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn-secondary"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                {timecard && timecard.approvalStatus === ApprovalStatus.DRAFT && (
                  <button
                    onClick={handleSubmitForApproval}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg"
                  >
                    承認申請
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <MonthlySummaryView
            dailyWorks={dailyWorks}
            standardWorkHours={standardWorkHours}
          />
        )}
      </div>
    </div>
  );
}

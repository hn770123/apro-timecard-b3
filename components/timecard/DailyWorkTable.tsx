/**
 * 日次勤務入力テーブルコンポーネント
 * 日ごとの勤務データを入力・表示する
 */

'use client';

import { DailyWork, WorkPattern, WorkType, LeaveType } from '@/types';

interface DailyWorkTableProps {
  dailyWorks: DailyWork[];
  workPatterns: WorkPattern[];
  onChange: (index: number, updates: Partial<DailyWork>) => void;
  disabled?: boolean;
}

export default function DailyWorkTable({
  dailyWorks,
  workPatterns,
  onChange,
  disabled,
}: DailyWorkTableProps) {
  const getWeekday = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return weekdays[date.getDay()];
  };

  const getWorkTypeLabel = (type: WorkType) => {
    switch (type) {
      case WorkType.ATTENDANCE:
        return '出勤';
      case WorkType.LATE:
        return '遅刻';
      case WorkType.EARLY_LEAVE:
        return '早退';
      case WorkType.LATE_AND_EARLY:
        return '遅刻・早退';
      case WorkType.LEGAL_HOLIDAY:
        return '休日（法定）';
      case WorkType.NON_LEGAL_HOLIDAY:
        return '休日（法定外）';
      case WorkType.REMOTE:
        return '出勤（リモート）';
      default:
        return type;
    }
  };

  const getLeaveTypeLabel = (type: LeaveType) => {
    switch (type) {
      case LeaveType.NONE:
        return 'なし';
      case LeaveType.PAID_LEAVE:
        return '有給休暇';
      case LeaveType.ABSENCE:
        return '欠勤';
      case LeaveType.SPECIAL_LEAVE:
        return '特別休暇';
      case LeaveType.CONGRATULATION:
        return '慶弔休暇';
      default:
        return type;
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${String(mins).padStart(2, '0')}`;
  };

  const needsRemarks = (work: DailyWork) => {
    return work.workType !== WorkType.ATTENDANCE && 
           work.workType !== WorkType.REMOTE && 
           !work.remarks;
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">日次勤務入力</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">曜日</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">勤務種類</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">パターン</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">出勤時刻</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">退勤時刻</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">遅刻</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">早退</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">残業</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">休暇種類</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">補足</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dailyWorks.map((work, index) => {
              const day = parseInt(work.date.split('-')[2]);
              const weekday = getWeekday(work.date);
              const isWeekend = weekday === '土' || weekday === '日';
              const showAlert = needsRemarks(work);

              return (
                <tr key={work.date} className={isWeekend ? 'bg-blue-50' : ''}>
                  <td className="px-3 py-2 whitespace-nowrap">{day}日</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={isWeekend ? 'text-red-600 font-medium' : ''}>
                      {weekday}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      value={work.workType}
                      onChange={(e) =>
                        onChange(index, { workType: e.target.value as WorkType })
                      }
                      disabled={disabled}
                    >
                      <option value={WorkType.ATTENDANCE}>出勤</option>
                      <option value={WorkType.LATE}>遅刻</option>
                      <option value={WorkType.EARLY_LEAVE}>早退</option>
                      <option value={WorkType.LATE_AND_EARLY}>遅刻・早退</option>
                      <option value={WorkType.LEGAL_HOLIDAY}>休日（法定）</option>
                      <option value={WorkType.NON_LEGAL_HOLIDAY}>休日（法定外）</option>
                      <option value={WorkType.REMOTE}>出勤（リモート）</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      value={work.workPatternId}
                      onChange={(e) => onChange(index, { workPatternId: e.target.value })}
                      disabled={disabled}
                    >
                      {workPatterns.map((pattern) => (
                        <option key={pattern.id} value={pattern.id}>
                          {pattern.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      value={work.actualStartTime || ''}
                      onChange={(e) =>
                        onChange(index, { actualStartTime: e.target.value })
                      }
                      disabled={disabled}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      value={work.actualEndTime || ''}
                      onChange={(e) =>
                        onChange(index, { actualEndTime: e.target.value })
                      }
                      disabled={disabled}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                      value={work.lateMinutes}
                      onChange={(e) =>
                        onChange(index, { lateMinutes: Number(e.target.value) })
                      }
                      disabled={disabled}
                      min="0"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                      value={work.earlyLeaveMinutes}
                      onChange={(e) =>
                        onChange(index, { earlyLeaveMinutes: Number(e.target.value) })
                      }
                      disabled={disabled}
                      min="0"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                      value={work.overtimeMinutes}
                      onChange={(e) =>
                        onChange(index, { overtimeMinutes: Number(e.target.value) })
                      }
                      disabled={disabled}
                      min="0"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      value={work.leaveType}
                      onChange={(e) =>
                        onChange(index, { leaveType: e.target.value as LeaveType })
                      }
                      disabled={disabled}
                    >
                      <option value={LeaveType.NONE}>なし</option>
                      <option value={LeaveType.PAID_LEAVE}>有給休暇</option>
                      <option value={LeaveType.ABSENCE}>欠勤</option>
                      <option value={LeaveType.SPECIAL_LEAVE}>特別休暇</option>
                      <option value={LeaveType.CONGRATULATION}>慶弔休暇</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <input
                        type="text"
                        className={`w-full border rounded px-2 py-1 text-sm ${
                          showAlert ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        value={work.remarks}
                        onChange={(e) => onChange(index, { remarks: e.target.value })}
                        disabled={disabled}
                        placeholder={showAlert ? '入力必須' : ''}
                      />
                      {showAlert && !disabled && (
                        <span className="absolute -top-2 -right-2 text-red-500 text-xs">
                          ⚠️
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>※ 遅刻、早退、残業時間は自動計算されますが、手動で変更することもできます。</p>
        <p>※ 出勤以外の勤務種類を選択した場合は、補足欄への入力が必要です。</p>
      </div>
    </div>
  );
}

/**
 * 月次集計表示コンポーネント
 * 月次勤務データの集計結果を表示
 */

'use client';

import { DailyWork, WorkType, LeaveType, MonthlySummary } from '@/types';

interface MonthlySummaryViewProps {
  dailyWorks: DailyWork[];
  standardWorkHours: number;
}

export default function MonthlySummaryView({
  dailyWorks,
  standardWorkHours,
}: MonthlySummaryViewProps) {
  const calculateSummary = (): MonthlySummary => {
    let totalWorkDays = 0;
    let totalWorkMinutes = 0;
    let totalLateMinutes = 0;
    let totalEarlyLeaveMinutes = 0;
    let totalOvertimeMinutes = 0;
    let totalRegularOvertime = 0;
    let totalLateNightOvertime = 0;
    let totalLegalHolidayOvertime = 0;
    let totalNonLegalHolidayOvertime = 0;
    let paidLeaveDays = 0;
    let absenceDays = 0;
    let specialLeaveDays = 0;
    let congratulationLeaveDays = 0;

    dailyWorks.forEach((work) => {
      // 出勤日数のカウント
      if (
        work.workType === WorkType.ATTENDANCE ||
        work.workType === WorkType.LATE ||
        work.workType === WorkType.EARLY_LEAVE ||
        work.workType === WorkType.LATE_AND_EARLY ||
        work.workType === WorkType.REMOTE
      ) {
        if (work.actualStartTime && work.actualEndTime) {
          totalWorkDays++;
        }
      }

      // 労働時間の計算
      if (work.actualStartTime && work.actualEndTime) {
        // 簡易的な労働時間計算（休憩時間は考慮済み）
        const standardMinutes = (work.workType === WorkType.LEGAL_HOLIDAY || 
                                 work.workType === WorkType.NON_LEGAL_HOLIDAY)
          ? 0
          : standardWorkHours * 60;
        
        // 仮の実労働時間（標準時間 + 残業時間 - 遅刻 - 早退）
        const workMinutes = standardMinutes + work.overtimeMinutes - work.lateMinutes - work.earlyLeaveMinutes;
        totalWorkMinutes += Math.max(0, workMinutes);
      }

      // 遅刻・早退の合計
      totalLateMinutes += work.lateMinutes;
      totalEarlyLeaveMinutes += work.earlyLeaveMinutes;

      // 残業時間の合計
      totalOvertimeMinutes += work.overtimeMinutes;
      totalRegularOvertime += work.overtimeBreakdown.regular;
      totalLateNightOvertime += work.overtimeBreakdown.lateNight;
      totalLegalHolidayOvertime += work.overtimeBreakdown.legalHoliday;
      totalNonLegalHolidayOvertime += work.overtimeBreakdown.nonLegalHoliday;

      // 休暇日数のカウント
      if (work.leaveType === LeaveType.PAID_LEAVE) paidLeaveDays++;
      if (work.leaveType === LeaveType.ABSENCE) absenceDays++;
      if (work.leaveType === LeaveType.SPECIAL_LEAVE) specialLeaveDays++;
      if (work.leaveType === LeaveType.CONGRATULATION) congratulationLeaveDays++;
    });

    return {
      totalWorkDays,
      totalWorkMinutes,
      totalLateMinutes,
      totalEarlyLeaveMinutes,
      totalOvertimeMinutes,
      overtimeBreakdown: {
        regular: totalRegularOvertime,
        lateNight: totalLateNightOvertime,
        legalHoliday: totalLegalHolidayOvertime,
        nonLegalHoliday: totalNonLegalHolidayOvertime,
      },
      paidLeaveDays,
      absenceDays,
      specialLeaveDays,
      congratulationLeaveDays,
    };
  };

  const formatMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}時間${mins}分`;
  };

  const summary = calculateSummary();

  const exportToCsv = () => {
    const headers = [
      '日付',
      '曜日',
      '勤務種類',
      '出勤時刻',
      '退勤時刻',
      '遅刻時間',
      '早退時間',
      '残業時間',
      '休暇種類',
      '補足',
    ].join(',');

    const rows = dailyWorks.map((work) => {
      const date = new Date(work.date);
      const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
      const weekday = weekdays[date.getDay()];

      return [
        work.date,
        weekday,
        work.workType,
        work.actualStartTime || '',
        work.actualEndTime || '',
        work.lateMinutes,
        work.earlyLeaveMinutes,
        work.overtimeMinutes,
        work.leaveType,
        `"${work.remarks.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `timecard_${dailyWorks[0]?.date.substring(0, 7)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">月次集計</h2>
          <button onClick={exportToCsv} className="btn-primary text-sm">
            CSVエクスポート
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 出勤関連 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">出勤情報</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">総出勤日数</span>
                <span className="text-sm font-semibold">{summary.totalWorkDays}日</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">総労働時間</span>
                <span className="text-sm font-semibold">
                  {formatMinutesToHours(summary.totalWorkMinutes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">遅刻時間</span>
                <span className="text-sm font-semibold text-orange-600">
                  {formatMinutesToHours(summary.totalLateMinutes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">早退時間</span>
                <span className="text-sm font-semibold text-orange-600">
                  {formatMinutesToHours(summary.totalEarlyLeaveMinutes)}
                </span>
              </div>
            </div>
          </div>

          {/* 残業関連 */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">残業情報</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">総残業時間</span>
                <span className="text-sm font-semibold">
                  {formatMinutesToHours(summary.totalOvertimeMinutes)}
                </span>
              </div>
              <div className="flex justify-between pl-2">
                <span className="text-xs text-gray-500">通常残業</span>
                <span className="text-xs">
                  {formatMinutesToHours(summary.overtimeBreakdown.regular)}
                </span>
              </div>
              <div className="flex justify-between pl-2">
                <span className="text-xs text-gray-500">深夜早朝</span>
                <span className="text-xs">
                  {formatMinutesToHours(summary.overtimeBreakdown.lateNight)}
                </span>
              </div>
              <div className="flex justify-between pl-2">
                <span className="text-xs text-gray-500">法定休日</span>
                <span className="text-xs">
                  {formatMinutesToHours(summary.overtimeBreakdown.legalHoliday)}
                </span>
              </div>
              <div className="flex justify-between pl-2">
                <span className="text-xs text-gray-500">法定外休日</span>
                <span className="text-xs">
                  {formatMinutesToHours(summary.overtimeBreakdown.nonLegalHoliday)}
                </span>
              </div>
            </div>
          </div>

          {/* 休暇関連 */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">休暇情報</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">有給休暇</span>
                <span className="text-sm font-semibold">{summary.paidLeaveDays}日</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">欠勤</span>
                <span className="text-sm font-semibold text-red-600">
                  {summary.absenceDays}日
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">特別休暇</span>
                <span className="text-sm font-semibold">{summary.specialLeaveDays}日</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">慶弔休暇</span>
                <span className="text-sm font-semibold">
                  {summary.congratulationLeaveDays}日
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 詳細テーブル */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">日別詳細</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  日付
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  勤務種類
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  出勤
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  退勤
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  遅刻
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  早退
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  残業
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  休暇
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailyWorks.map((work) => {
                const date = new Date(work.date);
                const day = date.getDate();
                const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
                const weekday = weekdays[date.getDay()];
                const isWeekend = weekday === '土' || weekday === '日';

                return (
                  <tr key={work.date} className={isWeekend ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {day}日 ({weekday})
                    </td>
                    <td className="px-4 py-2">{work.workType}</td>
                    <td className="px-4 py-2">{work.actualStartTime || '-'}</td>
                    <td className="px-4 py-2">{work.actualEndTime || '-'}</td>
                    <td className="px-4 py-2 text-right">
                      {work.lateMinutes > 0 ? `${work.lateMinutes}分` : '-'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {work.earlyLeaveMinutes > 0 ? `${work.earlyLeaveMinutes}分` : '-'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {work.overtimeMinutes > 0 ? `${work.overtimeMinutes}分` : '-'}
                    </td>
                    <td className="px-4 py-2">
                      {work.leaveType !== LeaveType.NONE ? work.leaveType : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * 時間計算ユーティリティ
 * 遅刻、早退、残業時間などの自動計算を行う
 */

import { WorkType, WorkPattern, DailyWork, OvertimeBreakdown } from '@/types';

/**
 * HH:mm形式の時刻を分に変換
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * 分をHH:mm形式の時刻に変換
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * 2つの時刻間の差分を分で計算
 */
export function calculateTimeDifference(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  
  // 終了時刻が開始時刻より小さい場合は翌日とみなす
  if (end < start) {
    end += 24 * 60;
  }
  
  return end - start;
}

/**
 * 休憩時間の合計を計算（分）
 */
export function calculateTotalBreakMinutes(pattern: WorkPattern): number {
  return pattern.breakTimes.reduce((total, breakTime) => {
    return total + calculateTimeDifference(breakTime.startTime, breakTime.endTime);
  }, 0);
}

/**
 * 遅刻時間を計算（分）
 */
export function calculateLateMinutes(
  workPattern: WorkPattern,
  actualStartTime: string | undefined,
  workType: WorkType
): number {
  // 休日の場合は遅刻なし
  if (workType === WorkType.LEGAL_HOLIDAY || workType === WorkType.NON_LEGAL_HOLIDAY) {
    return 0;
  }
  
  if (!actualStartTime) return 0;
  
  const scheduledStart = timeToMinutes(workPattern.startTime);
  const actualStart = timeToMinutes(actualStartTime);
  
  // 遅刻時間 = 実際の開始時刻 - 予定開始時刻（正の値のみ）
  return Math.max(0, actualStart - scheduledStart);
}

/**
 * 早退時間を計算（分）
 */
export function calculateEarlyLeaveMinutes(
  workPattern: WorkPattern,
  actualEndTime: string | undefined,
  workType: WorkType
): number {
  // 休日の場合は早退なし
  if (workType === WorkType.LEGAL_HOLIDAY || workType === WorkType.NON_LEGAL_HOLIDAY) {
    return 0;
  }
  
  if (!actualEndTime) return 0;
  
  const scheduledEnd = timeToMinutes(workPattern.endTime);
  const actualEnd = timeToMinutes(actualEndTime);
  
  // 早退時間 = 予定終了時刻 - 実際の終了時刻（正の値のみ）
  return Math.max(0, scheduledEnd - actualEnd);
}

/**
 * 実労働時間を計算（分、休憩時間を除く）
 */
export function calculateActualWorkMinutes(
  workPattern: WorkPattern,
  actualStartTime: string | undefined,
  actualEndTime: string | undefined
): number {
  if (!actualStartTime || !actualEndTime) return 0;
  
  const totalMinutes = calculateTimeDifference(actualStartTime, actualEndTime);
  const breakMinutes = calculateTotalBreakMinutes(workPattern);
  
  return Math.max(0, totalMinutes - breakMinutes);
}

/**
 * 標準就労時間を超えた分を残業時間として計算（分）
 */
export function calculateOvertimeMinutes(
  workPattern: WorkPattern,
  actualStartTime: string | undefined,
  actualEndTime: string | undefined,
  standardWorkHours: number,
  workType: WorkType
): number {
  // 休日の場合、標準就労時間は0
  const standardMinutes = (workType === WorkType.LEGAL_HOLIDAY || 
                           workType === WorkType.NON_LEGAL_HOLIDAY) 
    ? 0 
    : standardWorkHours * 60;
  
  const actualMinutes = calculateActualWorkMinutes(workPattern, actualStartTime, actualEndTime);
  
  return Math.max(0, actualMinutes - standardMinutes);
}

/**
 * 残業時間を分類（通常、深夜早朝、法定休日、法定外休日）
 */
export function calculateOvertimeBreakdown(
  workPattern: WorkPattern,
  actualStartTime: string | undefined,
  actualEndTime: string | undefined,
  standardWorkHours: number,
  workType: WorkType,
  date: string
): OvertimeBreakdown {
  const totalOvertime = calculateOvertimeMinutes(
    workPattern,
    actualStartTime,
    actualEndTime,
    standardWorkHours,
    workType
  );
  
  const breakdown: OvertimeBreakdown = {
    regular: 0,
    lateNight: 0,
    legalHoliday: 0,
    nonLegalHoliday: 0,
  };
  
  if (totalOvertime === 0) return breakdown;
  
  // 休日の場合
  if (workType === WorkType.LEGAL_HOLIDAY) {
    breakdown.legalHoliday = totalOvertime;
    return breakdown;
  }
  
  if (workType === WorkType.NON_LEGAL_HOLIDAY) {
    breakdown.nonLegalHoliday = totalOvertime;
    return breakdown;
  }
  
  // 深夜早朝（22:00-5:00）の時間を計算
  const lateNightStart = 22 * 60; // 22:00
  const lateNightEnd = 5 * 60;    // 5:00
  
  if (!actualStartTime || !actualEndTime) {
    breakdown.regular = totalOvertime;
    return breakdown;
  }
  
  const start = timeToMinutes(actualStartTime);
  let end = timeToMinutes(actualEndTime);
  if (end < start) end += 24 * 60;
  
  let lateNightMinutes = 0;
  
  // 簡易的な深夜時間計算（より正確な計算が必要な場合は拡張）
  if (end > lateNightStart) {
    const nightStart = Math.max(start, lateNightStart);
    const nightEnd = Math.min(end, 24 * 60);
    lateNightMinutes += Math.max(0, nightEnd - nightStart);
  }
  
  if (start < lateNightEnd || end > 24 * 60) {
    const morningStart = Math.max(0, start < lateNightEnd ? start : (end - 24 * 60));
    const morningEnd = Math.min(lateNightEnd, end < 24 * 60 ? end : (end - 24 * 60));
    lateNightMinutes += Math.max(0, morningEnd - morningStart);
  }
  
  // 休憩時間を考慮した深夜時間の補正（簡易版）
  const breakMinutes = calculateTotalBreakMinutes(workPattern);
  const breakRatio = breakMinutes / (end - start);
  lateNightMinutes = Math.round(lateNightMinutes * (1 - breakRatio));
  
  breakdown.lateNight = Math.min(lateNightMinutes, totalOvertime);
  breakdown.regular = totalOvertime - breakdown.lateNight;
  
  return breakdown;
}

/**
 * 日次勤務データの自動計算を実行
 */
export function calculateDailyWork(
  dailyWork: Partial<DailyWork>,
  workPattern: WorkPattern,
  standardWorkHours: number
): DailyWork {
  const workType = dailyWork.workType || WorkType.ATTENDANCE;
  const date = dailyWork.date || '';
  
  const lateMinutes = calculateLateMinutes(
    workPattern,
    dailyWork.actualStartTime,
    workType
  );
  
  const earlyLeaveMinutes = calculateEarlyLeaveMinutes(
    workPattern,
    dailyWork.actualEndTime,
    workType
  );
  
  const overtimeMinutes = calculateOvertimeMinutes(
    workPattern,
    dailyWork.actualStartTime,
    dailyWork.actualEndTime,
    standardWorkHours,
    workType
  );
  
  const overtimeBreakdown = calculateOvertimeBreakdown(
    workPattern,
    dailyWork.actualStartTime,
    dailyWork.actualEndTime,
    standardWorkHours,
    workType,
    date
  );
  
  return {
    date,
    workType,
    workPatternId: dailyWork.workPatternId || workPattern.id,
    actualStartTime: dailyWork.actualStartTime,
    actualEndTime: dailyWork.actualEndTime,
    lateMinutes: dailyWork.lateMinutes ?? lateMinutes,
    earlyLeaveMinutes: dailyWork.earlyLeaveMinutes ?? earlyLeaveMinutes,
    overtimeMinutes: dailyWork.overtimeMinutes ?? overtimeMinutes,
    overtimeBreakdown: dailyWork.overtimeBreakdown || overtimeBreakdown,
    leaveType: dailyWork.leaveType || 'none' as any,
    remarks: dailyWork.remarks || '',
  };
}

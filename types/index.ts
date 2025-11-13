/**
 * ユーザー権限の種類
 */
export enum UserRole {
  GENERAL = 'general',      // 一般ユーザー（入力者）
  APPROVER = 'approver',    // 承認者
  ADMIN = 'admin',          // システム管理者
}

/**
 * ユーザー情報
 */
export interface User {
  uid: string;              // Firebase Auth UID
  email: string;            // メールアドレス
  displayName: string;      // 表示名
  roles: UserRole[];        // ユーザー権限（複数可）
  createdAt: Date;          // 作成日時
  updatedAt: Date;          // 更新日時
}

/**
 * 勤務種類
 */
export enum WorkType {
  ATTENDANCE = 'attendance',                  // 出勤
  LATE = 'late',                             // 遅刻
  EARLY_LEAVE = 'early_leave',               // 早退
  LATE_AND_EARLY = 'late_and_early',         // 遅刻・早退
  LEGAL_HOLIDAY = 'legal_holiday',           // 休日（法定）
  NON_LEGAL_HOLIDAY = 'non_legal_holiday',   // 休日（法定外）
  REMOTE = 'remote',                         // 出勤（リモート）
}

/**
 * 休暇種類
 */
export enum LeaveType {
  NONE = 'none',                // なし
  PAID_LEAVE = 'paid_leave',    // 有給休暇
  ABSENCE = 'absence',          // 欠勤
  SPECIAL_LEAVE = 'special',    // 特別休暇
  CONGRATULATION = 'congratulation', // 慶弔休暇
}

/**
 * 休憩時間設定
 */
export interface BreakTime {
  startTime: string;  // HH:mm形式
  endTime: string;    // HH:mm形式
}

/**
 * 勤務パターン
 */
export interface WorkPattern {
  id: string;                   // パターンID
  name: string;                 // パターン名
  startTime: string;            // 始業時刻 HH:mm形式
  endTime: string;              // 終業時刻 HH:mm形式
  breakTimes: BreakTime[];      // 休憩時間（最大3つ）
}

/**
 * 残業時間の分類
 */
export interface OvertimeBreakdown {
  regular: number;              // 通常残業時間（分）
  lateNight: number;            // 深夜早朝残業時間（分）
  legalHoliday: number;         // 法定休日残業時間（分）
  nonLegalHoliday: number;      // 法定外休日残業時間（分）
}

/**
 * 日次勤務データ
 */
export interface DailyWork {
  date: string;                 // YYYY-MM-DD形式
  workType: WorkType;           // 勤務種類
  workPatternId: string;        // 使用する勤務パターンID
  actualStartTime?: string;     // 実際の出勤時刻 HH:mm形式
  actualEndTime?: string;       // 実際の退勤時刻 HH:mm形式
  lateMinutes: number;          // 遅刻時間（分）
  earlyLeaveMinutes: number;    // 早退時間（分）
  overtimeMinutes: number;      // 残業時間（分）
  overtimeBreakdown: OvertimeBreakdown; // 残業時間の分類
  leaveType: LeaveType;         // 休暇種類
  remarks: string;              // 補足欄
}

/**
 * 承認ステータス
 */
export enum ApprovalStatus {
  DRAFT = 'draft',              // 下書き
  PENDING = 'pending',          // 承認待ち
  APPROVED = 'approved',        // 承認済み
  REJECTED = 'rejected',        // 却下
}

/**
 * 承認履歴
 */
export interface ApprovalHistory {
  status: ApprovalStatus;       // ステータス
  approverUid?: string;         // 承認者UID
  approverName?: string;        // 承認者名
  timestamp: Date;              // 処理日時
  comment?: string;             // コメント
}

/**
 * 月次勤務データ
 */
export interface MonthlyTimecard {
  id: string;                   // ドキュメントID
  userId: string;               // ユーザーID
  year: number;                 // 年
  month: number;                // 月（1-12）
  employeeName: string;         // 氏名
  department: string;           // 所属
  workPatterns: WorkPattern[];  // 勤務パターン（最大3つ）
  standardWorkHours: number;    // 標準就労時間（時間単位、デフォルト8）
  dailyWorks: DailyWork[];      // 日次勤務データ
  approvalStatus: ApprovalStatus; // 承認ステータス
  approvalHistory: ApprovalHistory[]; // 承認履歴
  createdAt: Date;              // 作成日時
  updatedAt: Date;              // 更新日時
}

/**
 * 月次集計データ
 */
export interface MonthlySummary {
  totalWorkDays: number;              // 総出勤日数
  totalWorkMinutes: number;           // 総労働時間（分）
  totalLateMinutes: number;           // 総遅刻時間（分）
  totalEarlyLeaveMinutes: number;     // 総早退時間（分）
  totalOvertimeMinutes: number;       // 総残業時間（分）
  overtimeBreakdown: OvertimeBreakdown; // 残業時間分類の合計
  paidLeaveDays: number;              // 有給休暇日数
  absenceDays: number;                // 欠勤日数
  specialLeaveDays: number;           // 特別休暇日数
  congratulationLeaveDays: number;    // 慶弔休暇日数
}

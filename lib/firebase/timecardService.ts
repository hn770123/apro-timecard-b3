/**
 * タイムカードFirestoreサービス
 * 月次勤務データのCRUD操作を行う
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { MonthlyTimecard, ApprovalStatus, WorkPattern, DailyWork } from '@/types';

/**
 * 月次勤務データを作成
 */
export async function createMonthlyTimecard(
  userId: string,
  year: number,
  month: number,
  data: Partial<MonthlyTimecard>
): Promise<string> {
  const id = `${userId}_${year}_${String(month).padStart(2, '0')}`;
  const timecardRef = doc(db, 'timecards', id);

  const timecard: MonthlyTimecard = {
    id,
    userId,
    year,
    month,
    employeeName: data.employeeName || '',
    department: data.department || '',
    workPatterns: data.workPatterns || [],
    standardWorkHours: data.standardWorkHours || 8,
    dailyWorks: data.dailyWorks || [],
    approvalStatus: ApprovalStatus.DRAFT,
    approvalHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(timecardRef, {
    ...timecard,
    createdAt: Timestamp.fromDate(timecard.createdAt),
    updatedAt: Timestamp.fromDate(timecard.updatedAt),
  });

  return id;
}

/**
 * 月次勤務データを取得
 */
export async function getMonthlyTimecard(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyTimecard | null> {
  const id = `${userId}_${year}_${String(month).padStart(2, '0')}`;
  const timecardRef = doc(db, 'timecards', id);
  const timecardSnap = await getDoc(timecardRef);

  if (!timecardSnap.exists()) {
    return null;
  }

  const data = timecardSnap.data();
  return {
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    approvalHistory: data.approvalHistory?.map((h: any) => ({
      ...h,
      timestamp: h.timestamp?.toDate() || new Date(),
    })) || [],
  } as MonthlyTimecard;
}

/**
 * 月次勤務データを更新
 */
export async function updateMonthlyTimecard(
  userId: string,
  year: number,
  month: number,
  data: Partial<MonthlyTimecard>
): Promise<void> {
  const id = `${userId}_${year}_${String(month).padStart(2, '0')}`;
  const timecardRef = doc(db, 'timecards', id);

  await updateDoc(timecardRef, {
    ...data,
    updatedAt: Timestamp.fromDate(new Date()),
  });
}

/**
 * ユーザーのすべての月次勤務データを取得
 */
export async function getUserTimecards(userId: string): Promise<MonthlyTimecard[]> {
  const q = query(
    collection(db, 'timecards'),
    where('userId', '==', userId),
    orderBy('year', 'desc'),
    orderBy('month', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      approvalHistory: data.approvalHistory?.map((h: any) => ({
        ...h,
        timestamp: h.timestamp?.toDate() || new Date(),
      })) || [],
    } as MonthlyTimecard;
  });
}

/**
 * 承認待ちの月次勤務データを取得（承認者用）
 */
export async function getPendingTimecards(): Promise<MonthlyTimecard[]> {
  const q = query(
    collection(db, 'timecards'),
    where('approvalStatus', '==', ApprovalStatus.PENDING),
    orderBy('updatedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      approvalHistory: data.approvalHistory?.map((h: any) => ({
        ...h,
        timestamp: h.timestamp?.toDate() || new Date(),
      })) || [],
    } as MonthlyTimecard;
  });
}

/**
 * 前月のデータを取得して新しい月のベースデータを作成
 */
export async function copyPreviousMonthData(
  userId: string,
  year: number,
  month: number
): Promise<Partial<MonthlyTimecard> | null> {
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  const prevTimecard = await getMonthlyTimecard(userId, prevYear, prevMonth);
  if (!prevTimecard) {
    return null;
  }

  // 前月のデータから引き継ぐ項目
  return {
    employeeName: prevTimecard.employeeName,
    department: prevTimecard.department,
    workPatterns: prevTimecard.workPatterns,
    standardWorkHours: prevTimecard.standardWorkHours,
  };
}

/**
 * 承認申請を行う
 */
export async function submitForApproval(
  userId: string,
  year: number,
  month: number
): Promise<void> {
  const id = `${userId}_${year}_${String(month).padStart(2, '0')}`;
  const timecardRef = doc(db, 'timecards', id);

  await updateDoc(timecardRef, {
    approvalStatus: ApprovalStatus.PENDING,
    approvalHistory: [
      {
        status: ApprovalStatus.PENDING,
        timestamp: Timestamp.fromDate(new Date()),
      },
    ],
    updatedAt: Timestamp.fromDate(new Date()),
  });
}

/**
 * 承認を行う
 */
export async function approveTimecard(
  userId: string,
  year: number,
  month: number,
  approverUid: string,
  approverName: string,
  comment?: string
): Promise<void> {
  const id = `${userId}_${year}_${String(month).padStart(2, '0')}`;
  const timecardRef = doc(db, 'timecards', id);
  const timecard = await getMonthlyTimecard(userId, year, month);

  if (!timecard) {
    throw new Error('Timecard not found');
  }

  const newHistory = [
    ...timecard.approvalHistory,
    {
      status: ApprovalStatus.APPROVED,
      approverUid,
      approverName,
      timestamp: Timestamp.fromDate(new Date()),
      comment,
    },
  ];

  await updateDoc(timecardRef, {
    approvalStatus: ApprovalStatus.APPROVED,
    approvalHistory: newHistory,
    updatedAt: Timestamp.fromDate(new Date()),
  });
}

/**
 * 却下を行う
 */
export async function rejectTimecard(
  userId: string,
  year: number,
  month: number,
  approverUid: string,
  approverName: string,
  comment: string
): Promise<void> {
  const id = `${userId}_${year}_${String(month).padStart(2, '0')}`;
  const timecardRef = doc(db, 'timecards', id);
  const timecard = await getMonthlyTimecard(userId, year, month);

  if (!timecard) {
    throw new Error('Timecard not found');
  }

  const newHistory = [
    ...timecard.approvalHistory,
    {
      status: ApprovalStatus.REJECTED,
      approverUid,
      approverName,
      timestamp: Timestamp.fromDate(new Date()),
      comment,
    },
  ];

  await updateDoc(timecardRef, {
    approvalStatus: ApprovalStatus.REJECTED,
    approvalHistory: newHistory,
    updatedAt: Timestamp.fromDate(new Date()),
  });
}

/**
 * 承認を取り消す
 */
export async function cancelApproval(
  userId: string,
  year: number,
  month: number,
  approverUid: string,
  approverName: string,
  comment?: string
): Promise<void> {
  const id = `${userId}_${year}_${String(month).padStart(2, '0')}`;
  const timecardRef = doc(db, 'timecards', id);
  const timecard = await getMonthlyTimecard(userId, year, month);

  if (!timecard) {
    throw new Error('Timecard not found');
  }

  const newHistory = [
    ...timecard.approvalHistory,
    {
      status: ApprovalStatus.DRAFT,
      approverUid,
      approverName,
      timestamp: Timestamp.fromDate(new Date()),
      comment: comment || '承認取り消し',
    },
  ];

  await updateDoc(timecardRef, {
    approvalStatus: ApprovalStatus.DRAFT,
    approvalHistory: newHistory,
    updatedAt: Timestamp.fromDate(new Date()),
  });
}

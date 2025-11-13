/**
 * ユーザー管理ページ（管理者専用）
 * ユーザーの追加、権限の変更を行う
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User, UserRole } from '@/types';
import Navbar from '@/components/ui/Navbar';

export default function AdminPage() {
  const { user, loading: authLoading, hasRole } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || !hasRole(UserRole.ADMIN))) {
      router.push('/dashboard');
    }
  }, [user, authLoading, hasRole, router]);

  useEffect(() => {
    if (user && hasRole(UserRole.ADMIN)) {
      loadUsers();
    }
  }, [user, hasRole]);

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email,
          displayName: data.displayName,
          roles: data.roles || [UserRole.GENERAL],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as User;
      });
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('ユーザー一覧の読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setSelectedRoles([...userToEdit.roles]);
  };

  const handleRoleToggle = (role: UserRole) => {
    if (selectedRoles.includes(role)) {
      // 最低1つの権限は必要
      if (selectedRoles.length === 1) {
        alert('最低1つの権限が必要です。');
        return;
      }
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const saveUserRoles = async () => {
    if (!editingUser) return;

    try {
      const userRef = doc(db, 'users', editingUser.uid);
      await updateDoc(userRef, {
        roles: selectedRoles,
        updatedAt: new Date(),
      });

      alert('権限を更新しました。');
      setEditingUser(null);
      await loadUsers();
    } catch (error) {
      console.error('Error updating user roles:', error);
      alert('権限の更新に失敗しました。');
    }
  };

  const getRoleBadge = (roles: UserRole[]) => {
    return (
      <div className="flex flex-wrap gap-1">
        {roles.map((role) => {
          let badgeClass = 'badge badge-draft';
          let label = '';

          switch (role) {
            case UserRole.GENERAL:
              badgeClass = 'badge badge-draft';
              label = '一般';
              break;
            case UserRole.APPROVER:
              badgeClass = 'badge badge-pending';
              label = '承認者';
              break;
            case UserRole.ADMIN:
              badgeClass = 'badge badge-approved';
              label = '管理者';
              break;
          }

          return (
            <span key={role} className={badgeClass}>
              {label}
            </span>
          );
        })}
      </div>
    );
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
          <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
          <p className="mt-2 text-gray-600">ユーザーの権限を管理します</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">ユーザー一覧</h2>
          
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-sm mb-2">権限について</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>一般</strong>: 自分の勤務データの入力・編集が可能</li>
              <li>• <strong>承認者</strong>: 勤務データの承認・却下が可能（承認取り消しも可能）</li>
              <li>• <strong>管理者</strong>: ユーザー権限の管理が可能</li>
              <li>• 1人のユーザーに複数の権限を付与することができます</li>
            </ul>
          </div>

          {users.length === 0 ? (
            <p className="text-center py-12 text-gray-500">ユーザーが見つかりません。</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>表示名</th>
                    <th>メールアドレス</th>
                    <th>権限</th>
                    <th>最終更新</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.uid}>
                      <td className="font-medium">{u.displayName}</td>
                      <td>{u.email}</td>
                      <td>{getRoleBadge(u.roles)}</td>
                      <td>{new Date(u.updatedAt).toLocaleDateString('ja-JP')}</td>
                      <td>
                        <button
                          onClick={() => openEditModal(u)}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                        >
                          権限編集
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 権限編集モーダル */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">権限編集</h2>
                <p className="text-gray-600">
                  {editingUser.displayName} ({editingUser.email})
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(UserRole.GENERAL)}
                    onChange={() => handleRoleToggle(UserRole.GENERAL)}
                    className="w-5 h-5 text-primary-600"
                  />
                  <div>
                    <div className="font-medium">一般ユーザー</div>
                    <div className="text-sm text-gray-600">勤務データの入力・編集</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(UserRole.APPROVER)}
                    onChange={() => handleRoleToggle(UserRole.APPROVER)}
                    className="w-5 h-5 text-primary-600"
                  />
                  <div>
                    <div className="font-medium">承認者</div>
                    <div className="text-sm text-gray-600">勤務データの承認・却下</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(UserRole.ADMIN)}
                    onChange={() => handleRoleToggle(UserRole.ADMIN)}
                    className="w-5 h-5 text-primary-600"
                  />
                  <div>
                    <div className="font-medium">システム管理者</div>
                    <div className="text-sm text-gray-600">ユーザー権限の管理</div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setEditingUser(null)}
                  className="btn-secondary"
                >
                  キャンセル
                </button>
                <button onClick={saveUserRoles} className="btn-primary">
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

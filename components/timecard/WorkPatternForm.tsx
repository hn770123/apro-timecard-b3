/**
 * 勤務パターン設定フォームコンポーネント
 * 勤務パターンと休憩時間の登録・編集を行う
 */

'use client';

import { WorkPattern, BreakTime } from '@/types';

interface WorkPatternFormProps {
  patterns: WorkPattern[];
  onChange: (patterns: WorkPattern[]) => void;
  disabled?: boolean;
}

export default function WorkPatternForm({ patterns, onChange, disabled }: WorkPatternFormProps) {
  const addPattern = () => {
    if (patterns.length >= 3) {
      alert('勤務パターンは最大3つまでです。');
      return;
    }

    const newPattern: WorkPattern = {
      id: `pattern${patterns.length + 1}`,
      name: `パターン${patterns.length + 1}`,
      startTime: '09:00',
      endTime: '18:00',
      breakTimes: [],
    };

    onChange([...patterns, newPattern]);
  };

  const removePattern = (index: number) => {
    if (patterns.length === 1) {
      alert('勤務パターンは最低1つ必要です。');
      return;
    }
    const newPatterns = patterns.filter((_, i) => i !== index);
    onChange(newPatterns);
  };

  const updatePattern = (index: number, updates: Partial<WorkPattern>) => {
    const newPatterns = [...patterns];
    newPatterns[index] = { ...newPatterns[index], ...updates };
    onChange(newPatterns);
  };

  const addBreakTime = (patternIndex: number) => {
    const pattern = patterns[patternIndex];
    if (pattern.breakTimes.length >= 3) {
      alert('休憩時間は最大3つまでです。');
      return;
    }

    const newBreak: BreakTime = {
      startTime: '12:00',
      endTime: '13:00',
    };

    updatePattern(patternIndex, {
      breakTimes: [...pattern.breakTimes, newBreak],
    });
  };

  const removeBreakTime = (patternIndex: number, breakIndex: number) => {
    const pattern = patterns[patternIndex];
    const newBreakTimes = pattern.breakTimes.filter((_, i) => i !== breakIndex);
    updatePattern(patternIndex, { breakTimes: newBreakTimes });
  };

  const updateBreakTime = (
    patternIndex: number,
    breakIndex: number,
    updates: Partial<BreakTime>
  ) => {
    const pattern = patterns[patternIndex];
    const newBreakTimes = [...pattern.breakTimes];
    newBreakTimes[breakIndex] = { ...newBreakTimes[breakIndex], ...updates };
    updatePattern(patternIndex, { breakTimes: newBreakTimes });
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">勤務パターン設定</h2>
        {!disabled && patterns.length < 3 && (
          <button onClick={addPattern} className="btn-primary text-sm">
            + パターン追加
          </button>
        )}
      </div>

      <div className="space-y-6">
        {patterns.map((pattern, patternIndex) => (
          <div key={pattern.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    パターン名
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={pattern.name}
                    onChange={(e) => updatePattern(patternIndex, { name: e.target.value })}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    始業時刻
                  </label>
                  <input
                    type="time"
                    className="input-field"
                    value={pattern.startTime}
                    onChange={(e) => updatePattern(patternIndex, { startTime: e.target.value })}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    終業時刻
                  </label>
                  <input
                    type="time"
                    className="input-field"
                    value={pattern.endTime}
                    onChange={(e) => updatePattern(patternIndex, { endTime: e.target.value })}
                    disabled={disabled}
                  />
                </div>
              </div>
              {!disabled && patterns.length > 1 && (
                <button
                  onClick={() => removePattern(patternIndex)}
                  className="ml-4 text-red-600 hover:text-red-800"
                >
                  削除
                </button>
              )}
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  休憩時間
                </label>
                {!disabled && pattern.breakTimes.length < 3 && (
                  <button
                    onClick={() => addBreakTime(patternIndex)}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    + 休憩時間追加
                  </button>
                )}
              </div>

              {pattern.breakTimes.length === 0 ? (
                <p className="text-sm text-gray-500">休憩時間なし</p>
              ) : (
                <div className="space-y-2">
                  {pattern.breakTimes.map((breakTime, breakIndex) => (
                    <div key={breakIndex} className="flex items-center space-x-4">
                      <div className="flex-1">
                        <input
                          type="time"
                          className="input-field"
                          value={breakTime.startTime}
                          onChange={(e) =>
                            updateBreakTime(patternIndex, breakIndex, {
                              startTime: e.target.value,
                            })
                          }
                          disabled={disabled}
                        />
                      </div>
                      <span className="text-gray-500">〜</span>
                      <div className="flex-1">
                        <input
                          type="time"
                          className="input-field"
                          value={breakTime.endTime}
                          onChange={(e) =>
                            updateBreakTime(patternIndex, breakIndex, {
                              endTime: e.target.value,
                            })
                          }
                          disabled={disabled}
                        />
                      </div>
                      {!disabled && (
                        <button
                          onClick={() => removeBreakTime(patternIndex, breakIndex)}
                          className="text-red-600 hover:text-red-800"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

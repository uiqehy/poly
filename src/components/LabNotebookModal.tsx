import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';
import { ShapePair, ObservationRecord } from '../types';
import { X, ClipboardCheck, Award, CheckCircle2, BookOpen } from 'lucide-react';

interface LabNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  shapePair: ShapePair;
  pourCount: number;
  currentHeightRatio: number;
}

export const LabNotebookModal: React.FC<LabNotebookModalProps> = ({
  isOpen,
  onClose,
  shapePair,
  pourCount,
  currentHeightRatio,
}) => {
  const isCyl = shapePair === 'cylinder_cone';
  const shapeName = isCyl ? '원기둥과 원뿔' : '사각기둥과 사각뿔';
  const coneName = isCyl ? '원뿔' : '사각뿔';
  const prismName = isCyl ? '원기둥' : '사각기둥';

  const [studentName, setStudentName] = useState('수학탐구원');
  const [obs1, setObs1] = useState(pourCount >= 1 ? '1/3' : '');
  const [obs2, setObs2] = useState(pourCount >= 2 ? '2/3' : '');
  const [obs3, setObs3] = useState(pourCount >= 3 ? '3/3' : '');
  const [ratioAnswer, setRatioAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    // Check if student deduced 1/3 correctly
    const cleanRatio = ratioAnswer.trim().replace(/\s+/g, '');
    const isCorrect = cleanRatio === '1/3' || cleanRatio === '3분의1' || cleanRatio === '0.33';

    if (isCorrect) {
      sound.playChime(true);
      setIsSubmitted(true);
      setHasError(false);
      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    } else {
      setHasError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-lg w-full p-5 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 block">중학교 1학년 수학 탐구 활동지</span>
            <h3 className="text-base font-bold text-white tracking-tight">
              나의 부피 측정 및 관찰 보고서
            </h3>
          </div>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Student Info */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">탐구 대상 도형:</span>
              <span className="font-bold text-sky-400">{shapeName}</span>
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-slate-400">실험자:</span>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-0.5 w-24 text-center focus:outline-none focus:border-sky-500 font-semibold"
                />
              </div>
            </div>

            {/* Observation Table */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <span className="font-bold text-slate-200 block text-xs">
                [실험 1] 뿔 용기의 물을 기둥에 부을 때 차오른 높이 측정값
              </span>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">1회 부었을 때</span>
                  <div className="font-mono font-bold text-sm text-sky-400">
                    {pourCount >= 1 ? '1/3 지점' : `${(currentHeightRatio).toFixed(2)} 높이`}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">2회 부었을 때</span>
                  <div className="font-mono font-bold text-sm text-indigo-400">
                    {pourCount >= 2 ? '2/3 지점' : '-'}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">3회 부었을 때</span>
                  <div className="font-mono font-bold text-sm text-emerald-400">
                    {pourCount >= 3 ? '3/3 (가득)' : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Student Deduction Section */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/60 to-sky-950/60 border border-indigo-700/50 space-y-2.5">
              <span className="font-bold text-indigo-200 block text-xs">
                [실험 결론 도출] 관찰 결과를 바탕으로 빈칸을 채워보세요:
              </span>

              <div className="text-slate-200 text-xs leading-relaxed space-y-2">
                <p>
                  1. 밑면과 높이가 같은 {coneName}로 {prismName}을 가득 채우려면 총{' '}
                  <span className="font-bold text-amber-300">3번</span>을 부어야 한다.
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>2. 따라서 ({coneName}의 부피) = </span>
                  <input
                    type="text"
                    placeholder="예: 1/3"
                    value={ratioAnswer}
                    onChange={(e) => {
                      setRatioAnswer(e.target.value);
                      setHasError(false);
                    }}
                    required
                    className="w-16 bg-slate-900 border border-sky-400 text-amber-300 font-bold px-2 py-1 rounded text-center focus:outline-none focus:ring-1 focus:ring-sky-400"
                  />
                  <span> × ({prismName}의 부피) 이다.</span>
                </div>
              </div>

              {hasError && (
                <p className="text-rose-400 text-[11px]">
                  💡 힌트: 3번을 부어야 1개의 기둥이 찼으므로, 뿔 1개의 부피는 기둥의 몇 분의 몇일까요? (1/3)
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                닫기
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-lg shadow-sky-600/30 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>관찰 보고서 제출하기</span>
              </button>
            </div>
          </form>
        ) : (
          /* Submission Certificate Seal */
          <div className="text-center py-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Award className="w-8 h-8" />
            </div>

            <h4 className="text-base font-bold text-white mb-1">
              🎉 탐구 보고서 인증 완료!
            </h4>
            <p className="text-xs text-slate-300 mb-3">
              <span className="font-bold text-amber-400">{studentName}</span> 학생이 직접 실험을 통해
              <br />
              <span className="text-emerald-300 font-semibold">
                [뿔의 부피 = 1/3 × 기둥의 부피 = 1/3 × 밑넓이 × 높이]
              </span>
              <br />
              원리를 성공적으로 스스로 증명하고 발견했습니다!
            </p>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left text-xs text-slate-300 mb-4 font-mono leading-relaxed">
              <div className="text-sky-300 font-bold mb-1">💮 수학교사 확인 도장:</div>
              • 직접 부어보며 눈금선의 1/3 지점을 직접 검증함.
              <br />
              • 기둥 부피와 뿔 부피의 1:3 수학적 비례 관계 도출 완료.
            </div>

            <button
              onClick={onClose}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-lg"
            >
              실험실로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

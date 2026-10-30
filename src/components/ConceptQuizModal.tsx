import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';
import { X, CheckCircle2, AlertCircle, Award, ArrowRight } from 'lucide-react';

interface ConceptQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Question {
  id: number;
  question: string;
  hint: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: '밑면의 반지름과 높이가 서로 같은 원기둥과 원뿔이 있습니다. 원기둥의 부피가 90 cm³일 때, 원뿔의 부피는 몇 cm³일까요?',
    hint: '원뿔의 부피 = 1/3 × 원기둥의 부피',
    options: ['15 cm³', '30 cm³', '45 cm³', '180 cm³'],
    correctIndex: 1,
    explanation: '원뿔의 부피는 밑면과 높이가 같은 원기둥 부피의 1/3이므로, 90 × (1/3) = 30 cm³ 입니다.',
  },
  {
    id: 2,
    question: '밑넓이와 높이가 같은 사각뿔 용기에 모래를 담아 사각기둥 용기를 가득 채우려면 최소 몇 번 부어야 할까요?',
    hint: '사각뿔 1개의 부피는 사각기둥 부피의 1/3입니다.',
    options: ['2번', '3번', '4번', '6번'],
    correctIndex: 1,
    explanation: '뿔의 부피는 기둥 부피의 1/3이므로, 1/3 + 1/3 + 1/3 = 1, 즉 정확히 3번을 부어야 가득 찹니다.',
  },
  {
    id: 3,
    question: '밑면의 반지름이 3 cm이고 높이가 10 cm인 원뿔의 부피를 구하는 올바른 식과 값은?',
    hint: '원뿔의 부피 V = 1/3 × (밑넓이 πr²) × (높이 h)',
    options: [
      '1/3 × π × 3² × 10 = 30π cm³',
      'π × 3² × 10 = 90π cm³',
      '1/2 × π × 3² × 10 = 45π cm³',
      '1/3 × 2π × 3 × 10 = 20π cm³',
    ],
    correctIndex: 0,
    explanation: '원뿔의 부피 공식은 V = 1/3 × 밑넓이 × 높이 = 1/3 × (π × 3²) × 10 = 30π cm³ 입니다.',
  },
];

export const ConceptQuizModal: React.FC<ConceptQuizModalProps> = ({ isOpen, onClose }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  if (!isOpen) return null;

  const q = QUESTIONS[currentIdx];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    sound.playClick();
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === q.correctIndex) {
      sound.playChime(true);
      setScore((prev) => prev + 1);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  };

  const handleNext = () => {
    sound.playClick();
    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Completed all
      setCurrentIdx(QUESTIONS.length);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-5 text-white shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {currentIdx < QUESTIONS.length ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                중1 수학 개념 점검 ({currentIdx + 1}/{QUESTIONS.length})
              </span>
              <span className="text-xs text-slate-400">현재 점수: {score}점</span>
            </div>

            {/* Question */}
            <h3 className="text-base font-bold text-slate-100 leading-snug mb-2">
              Q{q.id}. {q.question}
            </h3>
            <p className="text-xs text-slate-400 mb-4 bg-slate-850 p-2 rounded-lg border border-slate-800">
              💡 힌트: {q.hint}
            </p>

            {/* Options */}
            <div className="space-y-2 mb-4">
              {q.options.map((opt, idx) => {
                let btnStyle = 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700';
                if (isAnswered) {
                  if (idx === q.correctIndex) {
                    btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                  } else if (idx === selectedOption) {
                    btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 line-through';
                  } else {
                    btnStyle = 'opacity-50 border-slate-800';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelect(idx)}
                    className={`w-full text-left text-sm p-3 rounded-xl border transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && idx === q.correctIndex && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {isAnswered && idx === selectedOption && idx !== q.correctIndex && (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation after answered */}
            {isAnswered && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs mb-4">
                <span className="font-bold text-amber-300 block mb-1">
                  {selectedOption === q.correctIndex ? '정답입니다! 🎉' : '아쉬워요! 다시 확인해 볼까요?'}
                </span>
                <p className="text-slate-300 leading-relaxed">{q.explanation}</p>
              </div>
            )}

            {/* Next Button */}
            {isAnswered && (
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95"
                >
                  <span>{currentIdx < QUESTIONS.length - 1 ? '다음 문제' : '결과 보기'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Result View */
          <div className="text-center py-4">
            <Award className="w-14 h-14 text-amber-400 mx-auto mb-3 animate-bounce" />
            <h3 className="text-lg font-bold text-white mb-1">개념 확인 완료!</h3>
            <p className="text-sm text-slate-300 mb-4">
              총 {QUESTIONS.length}문제 중 <span className="text-amber-400 font-bold">{score}</span>문제를 맞혔습니다.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 text-left mb-5 leading-relaxed">
              <span className="font-bold text-sky-300 block mb-1">핵심 요약 메모:</span>
              • 밑넓이와 높이가 같으면 모든 뿔의 부피는 기둥 부피의 1/3입니다.
              <br />
              • 기둥 = 3 × 뿔이므로 3번을 부어야 가득 채울 수 있습니다.
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={handleRestart}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold px-4 py-2 rounded-xl transition"
              >
                다시 풀기
              </button>
              <button
                onClick={onClose}
                className="bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
              >
                3D 실험실로 돌아가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

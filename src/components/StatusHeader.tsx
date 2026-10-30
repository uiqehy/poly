import React from 'react';
import { ShapePair, ExperimentStage } from '../types';
import { Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

interface StatusHeaderProps {
  shapePair: ShapePair;
  stage: ExperimentStage;
  pourCount: number;
  onReset: () => void;
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({
  shapePair,
  stage,
  pourCount,
  onReset,
}) => {
  const isCyl = shapePair === 'cylinder_cone';
  const shapeName = isCyl ? '원기둥과 원뿔' : '사각기둥과 사각뿔';
  const coneName = isCyl ? '원뿔' : '사각뿔';
  const prismName = isCyl ? '원기둥' : '사각기둥';

  // Educational status messages based on stage
  let statusBadge = '실험 준비';
  let messageTitle = `${shapeName}의 부피 관계 탐구`;
  let messageDesc = `밑면의 넓이와 높이가 서로 같은 ${prismName}과 ${coneName} 용기입니다.`;
  let badgeColor = 'bg-slate-700 text-slate-200 border-slate-600';

  if (stage === 'fill_cone') {
    statusBadge = '1단계: 뿔 용기 채우기';
    messageTitle = `${coneName}에 내용물을 채우는 중...`;
    messageDesc = `기준이 되는 ${coneName} 용기에 물(또는 모래)을 가득 채웁니다.`;
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  } else if (stage === 'cone_filled') {
    statusBadge = '1단계 완료';
    messageTitle = `${coneName} 용기가 가득 찼습니다!`;
    messageDesc = `이제 [기둥에 붓기] 버튼을 눌러 ${prismName}으로 물을 옮겨 담아보세요.`;
    badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
  } else if (stage === 'pouring_1' || stage === 'pouring_2' || stage === 'pouring_3') {
    const stepNum = stage === 'pouring_1' ? 1 : stage === 'pouring_2' ? 2 : 3;
    statusBadge = `2단계: ${stepNum}회차 붓는 중`;
    messageTitle = `${coneName}의 내용물을 ${prismName}으로 천천히 붓습니다...`;
    messageDesc = `${prismName}의 수면이 차오르는 높이를 눈금선에서 확인하세요.`;
    badgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
  } else if (stage === 'completed_1') {
    statusBadge = '3단계 핵심 발견: 1/3 도달!';
    messageTitle = `정확히 높이의 1/3 지점까지 찼습니다!`;
    messageDesc = `따라서 [${coneName}의 부피 = 1/3 × ${prismName}의 부피] 공식이 성립합니다!`;
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  } else if (stage === 'completed_2') {
    statusBadge = '확장 실험: 2회차 완료';
    messageTitle = `정확히 높이의 2/3 지점까지 찼습니다!`;
    messageDesc = `뿔 2개 분량이 기둥의 2/3를 차지합니다. 한 번 더 부으면 어떻게 될까요?`;
    badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
  } else if (stage === 'completed_3') {
    statusBadge = '실험 완료: 3회 만에 가득 참!';
    messageTitle = `기둥이 빈틈없이 완전히 찼습니다! (3/3)`;
    messageDesc = `뿔 3개 = 기둥 1개! 뿔의 부피는 기둥 부피의 정확히 3분의 1입니다.`;
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  }

  return (
    <header className="absolute top-3 inset-x-3 md:inset-x-6 z-20 pointer-events-none flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
      {/* Title & Status Capsule */}
      <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 md:px-5 shadow-2xl max-w-xl">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
            중1 수학 입체도형
          </span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
            {statusBadge}
          </span>
          {pourCount > 0 && (
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800">
              누적 채움: {pourCount}/3
            </span>
          )}
        </div>

        <h1 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
          {messageTitle}
          {stage.startsWith('completed') && (
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
          )}
        </h1>
        <p className="text-xs md:text-sm text-slate-300 mt-0.5 leading-relaxed">
          {messageDesc}
        </p>
      </div>

      {/* Quick Visual Progress Stepper */}
      <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
            stage === 'ready' || stage === 'fill_cone' || stage === 'cone_filled'
              ? 'bg-blue-600/30 text-blue-300 font-semibold'
              : 'text-slate-400'
          }`}>
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
            <span>뿔 채우기</span>
          </div>

          <span className="text-slate-600 text-xs">→</span>

          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
            stage.startsWith('pouring')
              ? 'bg-amber-600/30 text-amber-300 font-semibold'
              : 'text-slate-400'
          }`}>
            <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
            <span>기둥에 붓기</span>
          </div>

          <span className="text-slate-600 text-xs">→</span>

          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
            stage.startsWith('completed')
              ? 'bg-emerald-600/30 text-emerald-300 font-semibold'
              : 'text-slate-400'
          }`}>
            <CheckCircle2 className={`w-4 h-4 ${stage.startsWith('completed') ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>1/3 확인</span>
          </div>
        </div>

        {stage !== 'ready' && (
          <button
            onClick={onReset}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            title="처음부터 다시하기"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};

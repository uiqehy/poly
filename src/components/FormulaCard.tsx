import React, { useState } from 'react';
import { ShapePair } from '../types';
import { Calculator, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface FormulaCardProps {
  shapePair: ShapePair;
  pourCount: number;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({ shapePair, pourCount }) => {
  const isCyl = shapePair === 'cylinder_cone';
  const [isExpanded, setIsExpanded] = useState(false);

  // Interactive slider parameters for live calculation
  const [dimension, setDimension] = useState(6); // radius for cyl, side for prism (cm)
  const [height, setHeight] = useState(12);     // height h (cm)

  // Calculations
  const baseArea = isCyl
    ? Math.PI * dimension * dimension
    : dimension * dimension;

  const prismVolume = baseArea * height;
  const coneVolume = prismVolume / 3;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 text-white shadow-xl transition-all">
      {/* Header & Core Formula */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold tracking-tight text-slate-100">
            핵심 부피 공식 정리 (중학교 1학년)
          </h2>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 transition"
        >
          {isExpanded ? (
            <>
              <span>수치 계산기 접기</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>수치 계산기 열기</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Main Formula Highlight Box */}
      <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-800/40">
        <div className="text-center">
          <div className="text-xs font-semibold text-sky-300 mb-1">
            모든 기둥과 뿔의 공통 관계
          </div>
          <div className="text-sm md:text-base font-extrabold text-amber-300 tracking-wide font-mono">
            뿔의 부피 = <span className="text-white bg-sky-600/40 px-1.5 py-0.5 rounded border border-sky-500/50">1/3</span> × (기둥의 부피) = <span className="text-white bg-sky-600/40 px-1.5 py-0.5 rounded border border-sky-500/50">1/3</span> × (밑넓이 S) × (높이 h)
          </div>
        </div>

        {/* Detailed shape-specific formula */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-sky-800/30 text-xs">
          <div className={`p-2 rounded-lg border ${isCyl ? 'bg-sky-900/40 border-sky-500/50 text-sky-100' : 'bg-slate-800/40 border-slate-700/40 text-slate-400'}`}>
            <span className="font-semibold block mb-0.5 text-sky-300">
              ① 원기둥과 원뿔 (밑면 반지름 r, 높이 h)
            </span>
            <div className="font-mono text-slate-200">
              • 원기둥 부피: <span className="text-white font-bold">V = πr²h</span>
              <br />
              • 원뿔 부피: <span className="text-amber-300 font-bold">V = 1/3 πr²h</span>
            </div>
          </div>

          <div className={`p-2 rounded-lg border ${!isCyl ? 'bg-sky-900/40 border-sky-500/50 text-sky-100' : 'bg-slate-800/40 border-slate-700/40 text-slate-400'}`}>
            <span className="font-semibold block mb-0.5 text-sky-300">
              ② 사각기둥과 사각뿔 (밑면 한 변 a, 높이 h)
            </span>
            <div className="font-mono text-slate-200">
              • 사각기둥 부피: <span className="text-white font-bold">V = a²h</span>
              <br />
              • 사각뿔 부피: <span className="text-amber-300 font-bold">V = 1/3 a²h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Numerical Calculator (Collapsible) */}
      {isExpanded && (
        <div className="mt-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Calculator className="w-3.5 h-3.5" />
            <span>직접 수치를 넣어서 부피 1/3 관계 확인하기</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>{isCyl ? '밑면 반지름 (r)' : '밑면 한 변 (a)'}</span>
                <span className="font-mono font-bold text-sky-400">{dimension} cm</span>
              </div>
              <input
                type="range"
                min="3"
                max="12"
                step="1"
                value={dimension}
                onChange={(e) => setDimension(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>높이 (h)</span>
                <span className="font-mono font-bold text-sky-400">{height} cm</span>
              </div>
              <input
                type="range"
                min="6"
                max="24"
                step="1"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/60 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">기둥의 부피 (V_기둥)</span>
              <span className="font-mono font-bold text-white text-sm">
                {prismVolume.toFixed(1)} cm³
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">뿔의 부피 (V_뿔)</span>
              <span className="font-mono font-bold text-amber-300 text-sm">
                {coneVolume.toFixed(1)} cm³
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">비율 (V_뿔 ÷ V_기둥)</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {(coneVolume / prismVolume).toFixed(3)} (= 1/3)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Classroom Experiment Note */}
      <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
        <span>
          💡 교과서 원리: 밑넓이와 높이가 같으면 모든 뿔은 해당 기둥 부피의 정확히 1/3입니다.
        </span>
        {pourCount > 0 && (
          <span className="text-sky-300 font-semibold font-mono">
            현재 관찰: {pourCount}/3 채움 완료
          </span>
        )}
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { ShapePair, LiquidType, ExperimentStage, ControlMode } from '../types';
import { sound } from '../utils/audio';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Droplet,
  Layers,
  HelpCircle,
  Download,
  FastForward,
  PlusCircle,
  ClipboardCheck,
  Hand,
  SlidersHorizontal,
} from 'lucide-react';

interface ControlPanelProps {
  shapePair: ShapePair;
  liquidType: LiquidType;
  stage: ExperimentStage;
  controlMode: ControlMode;
  manualTilt: number; // 0 to 1
  animSpeed: number;
  pourCount: number;
  coneRemainingPct: number;
  cylinderFillRatio: number;
  onSelectShapePair: (pair: ShapePair) => void;
  onSelectLiquid: (type: LiquidType) => void;
  onSelectMode: (mode: ControlMode) => void;
  onManualTiltChange: (val: number) => void;
  onSetAnimSpeed: (speed: number) => void;
  onStartFullExperiment: () => void;
  onFillCone: () => void;
  onReset: () => void;
  onOpenQuiz: () => void;
  onOpenLabNote: () => void;
  onOpenExport: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  shapePair,
  liquidType,
  stage,
  controlMode,
  manualTilt,
  animSpeed,
  pourCount,
  coneRemainingPct,
  cylinderFillRatio,
  onSelectShapePair,
  onSelectLiquid,
  onSelectMode,
  onManualTiltChange,
  onSetAnimSpeed,
  onStartFullExperiment,
  onFillCone,
  onReset,
  onOpenQuiz,
  onOpenLabNote,
  onOpenExport,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isHoldingPour, setIsHoldingPour] = useState(false);
  const holdIntervalRef = useRef<number | null>(null);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  const isBusyAuto = controlMode === 'auto' && (stage === 'fill_cone' || stage.startsWith('pouring'));

  // Handle "Hold to Pour" button
  useEffect(() => {
    if (isHoldingPour) {
      holdIntervalRef.current = window.setInterval(() => {
        onManualTiltChange(Math.min(1.0, manualTilt + 0.04));
      }, 30);
    } else {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
      }
    }
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, [isHoldingPour, manualTilt, onManualTiltChange]);

  const tiltDegrees = Math.round(manualTilt * 105);

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-3 pointer-events-none transition-transform duration-300">
      {/* Collapse Toggle Button */}
      <div className="flex justify-center mb-1.5 pointer-events-auto">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 px-3.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95"
        >
          {isCollapsed ? (
            <>
              <span>▴ 조작 패널 열기</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>▾ 조작 패널 숨기기 (3D 전체 감상)</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="pointer-events-auto bg-slate-900/95 border border-slate-700/90 rounded-2xl p-3 md:p-4 shadow-2xl backdrop-blur-lg flex flex-col gap-2.5">
          {/* Top Bar: Mode Switcher (직접 실험하기 vs 자동 시연), Shape, Liquid, Utilities */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  sound.playClick();
                  onSelectMode('manual');
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  controlMode === 'manual'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="학생이 직접 슬라이더와 버튼으로 용기를 기울여 붓는 실험 모드"
              >
                <Hand className="w-3.5 h-3.5" />
                <span>🖐️ 직접 실험하기 (추천)</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onSelectMode('auto');
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  controlMode === 'auto'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="원클릭으로 물이 붓는 과정을 자동 관찰하는 모드"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>자동 시연</span>
              </button>
            </div>

            {/* Shape Pair Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                disabled={isBusyAuto}
                onClick={() => {
                  sound.playClick();
                  onSelectShapePair('cylinder_cone');
                }}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
                  shapePair === 'cylinder_cone'
                    ? 'bg-sky-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ① 원기둥 & 원뿔
              </button>

              <button
                disabled={isBusyAuto}
                onClick={() => {
                  sound.playClick();
                  onSelectShapePair('prism_pyramid');
                }}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
                  shapePair === 'prism_pyramid'
                    ? 'bg-sky-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ② 사각기둥 & 사각뿔
              </button>
            </div>

            {/* Liquid Selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                disabled={isBusyAuto}
                onClick={() => {
                  sound.playClick();
                  onSelectLiquid('water');
                }}
                className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition ${
                  liquidType === 'water' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Droplet className="w-3.5 h-3.5 text-sky-300" />
                <span>물</span>
              </button>

              <button
                disabled={isBusyAuto}
                onClick={() => {
                  sound.playClick();
                  onSelectLiquid('sand');
                }}
                className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition ${
                  liquidType === 'sand' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span>모래</span>
              </button>
            </div>

            {/* Utility Buttons: Sound, Lab Note, Quiz, Export */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={toggleMute}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
                title={isMuted ? '음소거 해제' : '음소거'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenLabNote();
                }}
                className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition flex items-center gap-1"
                title="학생 탐구 활동지 작성"
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>탐구 활동지</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenQuiz();
                }}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition flex items-center gap-1"
                title="개념 퀴즈 풀기"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden sm:inline">퀴즈</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenExport();
                }}
                className="text-xs font-semibold px-2 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 transition flex items-center gap-1"
                title="단일 index.html 파일 다운로드"
              >
                <Download className="w-3.5 h-3.5 text-emerald-300" />
              </button>
            </div>
          </div>

          {/* MAIN INTERACTIVE CONTROL SECTION */}
          {controlMode === 'manual' ? (
            /* Hands-On Lab Mode Controls */
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Step 1: Fill Cone */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onFillCone();
                    }}
                    className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md transition active:scale-95 ${
                      stage === 'ready' || stage === 'completed_1' || stage === 'completed_2'
                        ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white hover:from-blue-500 hover:to-sky-500 ring-2 ring-sky-400/40 animate-pulse'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Droplet className="w-4 h-4 text-sky-300" />
                    <span>
                      {pourCount === 0
                        ? '1. 뿔에 물 가득 채우기'
                        : `${pourCount + 1}회차 뿔에 물 채우기`}
                    </span>
                  </button>

                  <span className="text-slate-400 text-[11px] font-mono">
                    뿔 잔여량: <strong className="text-sky-300">{coneRemainingPct}%</strong>
                  </span>
                </div>

                {/* Live Cylinder Reading */}
                <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 font-mono text-[11px] flex items-center gap-2">
                  <span>기둥 수면 높이:</span>
                  <span className="text-emerald-400 font-bold text-xs">
                    {(cylinderFillRatio * 100).toFixed(0)}%
                  </span>
                  <span className="text-slate-500">
                    ({cylinderFillRatio >= 0.31 && cylinderFillRatio <= 0.35 ? '★ 1/3 도달!' :
                      cylinderFillRatio >= 0.64 && cylinderFillRatio <= 0.68 ? '★ 2/3 도달!' :
                      cylinderFillRatio >= 0.95 ? '★ 3/3 가득 참!' : '눈금선 관찰 중'})
                  </span>
                </div>
              </div>

              {/* Step 2: Physical Tilting Slider & Hold to Pour Button */}
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-8 flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1 font-semibold text-amber-300">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>2. 뿔 용기 기울이기 조절 (직접 드래그해서 물 쏟기)</span>
                    </span>
                    <span className="font-mono font-bold text-sky-400">
                      기울기: {tiltDegrees}° {tiltDegrees > 25 && coneRemainingPct > 0 ? '💧 콸콸 쏟아지는 중!' : ''}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={manualTilt}
                    onChange={(e) => onManualTiltChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono px-0.5">
                    <span>0° (세워둠)</span>
                    <span>25° (물 흐르기 시작)</span>
                    <span>70° (강한 물줄기)</span>
                    <span>105° (완전히 다 쏟음)</span>
                  </div>
                </div>

                <div className="md:col-span-4 flex items-center gap-2">
                  {/* Hold to Pour button */}
                  <button
                    onMouseDown={() => setIsHoldingPour(true)}
                    onMouseUp={() => setIsHoldingPour(false)}
                    onTouchStart={() => setIsHoldingPour(true)}
                    onTouchEnd={() => setIsHoldingPour(false)}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-lg transition select-none text-center"
                    title="누르고 있는 동안 물을 계속 기울여 붓습니다"
                  >
                    <span>🖐️ 꾹 눌러서 붓기</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      onManualTiltChange(0);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    title="용기 똑바로 세우기"
                  >
                    <span>세우기</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      onReset();
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                    title="처음부터 다시하기"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Auto Demonstration Mode Controls */
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                {stage === 'ready' && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onStartFullExperiment();
                    }}
                    className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-98"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>자동 실험 시작: 뿔에 채우고 기둥에 붓기</span>
                  </button>
                )}

                {isBusyAuto && (
                  <div className="flex-1 bg-slate-800 text-slate-300 font-semibold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-slate-700">
                    <span className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    <span>실험이 진행 중입니다... (눈금선을 관찰하세요)</span>
                  </div>
                )}

                {(stage === 'completed_1' || stage === 'completed_2') && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onFillCone();
                    }}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-98"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>
                      다음 회차 붓기 ({pourCount + 1}회차 → {pourCount + 1}/3 채우기)
                    </span>
                  </button>
                )}

                {stage === 'completed_3' && (
                  <div className="flex-1 bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 font-bold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2">
                    <span>🎉 3회 만에 기둥이 정확히 꽉 찼습니다! (100%)</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={isBusyAuto}
                  onClick={() => {
                    sound.playClick();
                    onReset();
                  }}
                  className="text-xs font-semibold px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>리셋</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

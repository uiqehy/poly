import { useState } from 'react';
import { ThreeCanvas } from './components/ThreeCanvas';
import { StatusHeader } from './components/StatusHeader';
import { ControlPanel } from './components/ControlPanel';
import { FormulaCard } from './components/FormulaCard';
import { ConceptQuizModal } from './components/ConceptQuizModal';
import { LabNotebookModal } from './components/LabNotebookModal';
import { ExportModal } from './components/ExportModal';
import { ShapePair, LiquidType, ExperimentStage, ControlMode } from './types';
import { sound } from './utils/audio';
import { Compass, BookOpen, ClipboardCheck } from 'lucide-react';

export default function App() {
  const [shapePair, setShapePair] = useState<ShapePair>('cylinder_cone');
  const [liquidType, setLiquidType] = useState<LiquidType>('water');
  const [stage, setStage] = useState<ExperimentStage>('ready');
  const [controlMode, setControlMode] = useState<ControlMode>('manual'); // Default to direct hands-on lab!
  const [manualTilt, setManualTilt] = useState<number>(0);
  const [animSpeed, setAnimSpeed] = useState<number>(1.2);
  const [pourCount, setPourCount] = useState<number>(0);

  // Live stats from manual hands-on experiment
  const [coneRemainingPct, setConeRemainingPct] = useState<number>(0);
  const [cylinderFillRatio, setCylinderFillRatio] = useState<number>(0);

  // Modals
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isLabNoteOpen, setIsLabNoteOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showFormulaDrawer, setShowFormulaDrawer] = useState(false);

  // Auto chaining flag for auto demo
  const [isAutoChaining, setIsAutoChaining] = useState(false);

  const handleStageChange = (nextStage: ExperimentStage) => {
    setStage(nextStage);

    if (nextStage === 'cone_filled') {
      setConeRemainingPct(100);
      if (isAutoChaining) {
        setTimeout(() => {
          if (pourCount === 0) setStage('pouring_1');
          else if (pourCount === 1) setStage('pouring_2');
          else if (pourCount === 2) setStage('pouring_3');
        }, 500);
      }
    } else if (nextStage === 'completed_1') {
      setPourCount(1);
      setIsAutoChaining(false);
      // Prompt user to record in lab note
    } else if (nextStage === 'completed_2') {
      setPourCount(2);
      setIsAutoChaining(false);
    } else if (nextStage === 'completed_3') {
      setPourCount(3);
      setIsAutoChaining(false);
    }
  };

  const handleStartFullExperiment = () => {
    setIsAutoChaining(true);
    setStage('fill_cone');
  };

  const handleFillCone = () => {
    setManualTilt(0);
    setStage('fill_cone');
  };

  const handleReset = () => {
    setStage('ready');
    setPourCount(0);
    setManualTilt(0);
    setConeRemainingPct(0);
    setCylinderFillRatio(0);
    setIsAutoChaining(false);
  };

  const handleSelectShapePair = (pair: ShapePair) => {
    if (pair !== shapePair) {
      setShapePair(pair);
      handleReset();
    }
  };

  const handleSelectLiquid = (type: LiquidType) => {
    setLiquidType(type);
  };

  const handleManualStats = (conePct: number, cylRatio: number) => {
    setConeRemainingPct(conePct);
    setCylinderFillRatio(cylRatio);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. Main 3D WebGL Canvas with Physical Fluid Particles and Local Clipping */}
      <ThreeCanvas
        shapePair={shapePair}
        liquidType={liquidType}
        stage={stage}
        controlMode={controlMode}
        manualTilt={manualTilt}
        animSpeed={animSpeed}
        onStageChange={handleStageChange}
        pourCount={pourCount}
        onUpdateManualStats={handleManualStats}
      />

      {/* 2. Top Educational Progress & Status Banner */}
      <StatusHeader
        shapePair={shapePair}
        stage={stage}
        pourCount={pourCount}
        onReset={handleReset}
      />

      {/* 3. Floating Quick Action Badges (Bottom-Right) */}
      <div className="absolute right-4 bottom-32 md:bottom-28 z-20 pointer-events-none flex flex-col items-end gap-2">
        <button
          onClick={() => {
            sound.playClick();
            setIsLabNoteOpen(true);
          }}
          className="pointer-events-auto bg-amber-500/90 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition active:scale-95 animate-bounce"
        >
          <ClipboardCheck className="w-4 h-4 text-slate-950" />
          <span>탐구 활동지 작성 ({pourCount > 0 ? `${pourCount}/3 기록` : '열기'})</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setShowFormulaDrawer(!showFormulaDrawer);
          }}
          className="pointer-events-auto bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition active:scale-95"
        >
          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
          <span>{showFormulaDrawer ? '공식 카드 닫기' : '부피 공식 보기'}</span>
        </button>

        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800 text-[11px] text-slate-400 shadow-md">
          <Compass className="w-3 h-3 text-slate-400" />
          <span>마우스 좌클릭: 3D 회전 | 휠: 줌</span>
        </div>
      </div>

      {/* 4. Formula Card Popover / Drawer */}
      {showFormulaDrawer && (
        <div className="absolute right-4 bottom-48 z-30 w-full max-w-sm sm:max-w-md animate-in slide-in-from-bottom-4 duration-200">
          <FormulaCard shapePair={shapePair} pourCount={pourCount} />
        </div>
      )}

      {/* 5. Ergonomic Collapsible Bottom Control Dock */}
      <ControlPanel
        shapePair={shapePair}
        liquidType={liquidType}
        stage={stage}
        controlMode={controlMode}
        manualTilt={manualTilt}
        animSpeed={animSpeed}
        pourCount={pourCount}
        coneRemainingPct={coneRemainingPct}
        cylinderFillRatio={cylinderFillRatio}
        onSelectShapePair={handleSelectShapePair}
        onSelectLiquid={handleSelectLiquid}
        onSelectMode={(mode) => {
          setControlMode(mode);
          setManualTilt(0);
        }}
        onManualTiltChange={setManualTilt}
        onSetAnimSpeed={setAnimSpeed}
        onStartFullExperiment={handleStartFullExperiment}
        onFillCone={handleFillCone}
        onReset={handleReset}
        onOpenQuiz={() => setIsQuizOpen(true)}
        onOpenLabNote={() => setIsLabNoteOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* 6. Middle School Student Observation Worksheet */}
      <LabNotebookModal
        isOpen={isLabNoteOpen}
        onClose={() => setIsLabNoteOpen(false)}
        shapePair={shapePair}
        pourCount={pourCount}
        currentHeightRatio={cylinderFillRatio}
      />

      {/* 7. Concept Quiz Modal */}
      <ConceptQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
      />

      {/* 8. Standalone index.html Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </main>
  );
}

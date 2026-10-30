import React, { useState } from 'react';
import { generateStandaloneHtml } from '../utils/exportHtml';
import { sound } from '../utils/audio';
import { X, Download, Copy, Check, FileCode } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const htmlContent = generateStandaloneHtml();

  const handleDownload = () => {
    sound.playClick();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '기둥과_뿔의_부피실험_단일파일.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    sound.playClick();
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-5 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <FileCode className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">
            단일 HTML 파일 (index.html) 내보내기
          </h3>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          요청하신 대로 별도의 서버나 빌드 도구 없이 브라우저에서 더블 클릭만으로 바로 열 수 있는 완성된
          <span className="text-emerald-300 font-semibold"> 하나의 `index.html` 파일</span>입니다.
          Three.js와 모든 3D 애니메이션, UI 스크립트가 온전히 포함되어 있습니다.
        </p>

        {/* Code Preview Box */}
        <div className="relative mb-4">
          <div className="max-h-56 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-400 leading-relaxed">
            <pre>{htmlContent.slice(0, 1500)}...</pre>
          </div>
          <span className="absolute bottom-2 right-2 text-[10px] bg-slate-800/90 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
            총 {htmlContent.length.toLocaleString()} 자 (완전 자립형 HTML)
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleCopy}
            className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '복사 완료!' : '전체 코드 복사'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="text-xs font-bold px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-lg shadow-emerald-700/30 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>index.html 파일 다운로드 (.html)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

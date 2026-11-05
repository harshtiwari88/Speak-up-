import React from 'react';
import { AndroidStatusBar } from './AndroidStatusBar';
import { AndroidBottomNav, TabType } from './AndroidBottomNav';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  streakDays: number;
  isFrameMode: boolean;
  onToggleFrameMode: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeTab,
  onTabChange,
  streakDays,
  isFrameMode,
  onToggleFrameMode,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 md:p-4 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Outer Phone Shell */}
      <div
        className={`relative flex flex-col bg-slate-900 overflow-hidden transition-all duration-300 ${
          isFrameMode
            ? 'w-full max-w-[440px] h-[92vh] max-h-[920px] rounded-[44px] border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_35px_rgba(99,102,241,0.15)] ring-1 ring-slate-700/50'
            : 'w-full max-w-4xl min-h-screen md:min-h-[90vh] md:rounded-3xl md:border md:border-slate-800 md:shadow-2xl'
        }`}
      >
        {/* Android Status Bar */}
        <AndroidStatusBar
          streakDays={streakDays}
          isFrameMode={isFrameMode}
          onToggleFrameMode={onToggleFrameMode}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col bg-slate-900/90">
          {children}
        </main>

        {/* Android Bottom Navigation */}
        <AndroidBottomNav activeTab={activeTab} onTabChange={onTabChange} />

        {/* Android Home Gesture Pill */}
        <div className="w-full bg-slate-950 flex items-center justify-center pb-1.5 pt-0.5">
          <div className="w-32 h-1 bg-slate-600/60 rounded-full hover:bg-slate-400 transition-colors"></div>
        </div>
      </div>
    </div>
  );
};

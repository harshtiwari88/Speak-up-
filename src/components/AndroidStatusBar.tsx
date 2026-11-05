import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Smartphone, Monitor, Download, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playChime } from '../utils/audio';

interface AndroidStatusBarProps {
  streakDays: number;
  isFrameMode: boolean;
  onToggleFrameMode: () => void;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({
  streakDays,
  isFrameMode,
  onToggleFrameMode,
}) => {
  const [timeStr, setTimeStr] = useState('09:41');
  const { isInstallable, isInstalled, install } = usePWAInstall();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleInstall = async () => {
    playChime('tap');
    if (isInstallable) {
      const res = await install();
      if (res) playChime('streak');
    }
  };

  return (
    <div className="w-full bg-slate-950/80 backdrop-blur-md text-xs text-slate-300 font-medium px-4 py-2 flex items-center justify-between border-b border-slate-800/60 select-none z-30">
      {/* Left side: Time and Flame Streak */}
      <div className="flex items-center gap-2.5">
        <span className="font-semibold tracking-tight text-white">{timeStr}</span>
        <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-semibold">
          <span>🔥</span>
          <span>{streakDays}d Streak</span>
        </div>

        {/* PWA Direct Download Quick Pill if installable */}
        {isInstallable && !isInstalled && (
          <button
            onClick={handleInstall}
            className="flex items-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all animate-pulse"
            title="Download TalkFlow PWA directly to device"
          >
            <Download size={10} />
            <span>Install</span>
          </button>
        )}
      </div>

      {/* Middle: Android Camera Notch pill */}
      <div className="w-16 h-3 bg-black/90 rounded-full flex items-center justify-center border border-slate-800/80 shadow-inner">
        <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center">
          <div className="w-0.5 h-0.5 rounded-full bg-indigo-500/80"></div>
        </div>
      </div>

      {/* Right side: 5G, Wifi, Battery and View Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 tracking-wider">5G</span>
        <Wifi size={13} className="text-slate-300" />
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400">94%</span>
          <BatteryMedium size={14} className="text-emerald-400" />
        </div>
        <button
          onClick={onToggleFrameMode}
          title={isFrameMode ? 'Switch to Full Screen View' : 'Switch to Android Device Frame'}
          className="ml-1 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
        >
          {isFrameMode ? <Monitor size={12} /> : <Smartphone size={12} />}
        </button>
      </div>
    </div>
  );
};

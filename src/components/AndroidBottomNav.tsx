import React from 'react';
import { Home, MessageSquare, Mic, Theater, User } from 'lucide-react';
import { playChime } from '../utils/audio';

export type TabType = 'home' | 'chat' | 'pronounce' | 'simulations' | 'profile';

interface AndroidBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Coach', icon: Home },
    { id: 'chat' as TabType, label: 'AI Talk', icon: MessageSquare, badge: 'Live' },
    { id: 'pronounce' as TabType, label: 'Voice Lab', icon: Mic },
    { id: 'simulations' as TabType, label: 'Scenarios', icon: Theater },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
  ];

  const handleSelect = (tab: TabType) => {
    playChime('tap');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
    onTabChange(tab);
  };

  return (
    <nav className="w-full bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 pt-1 pb-3 flex items-center justify-around z-30 select-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => handleSelect(tab.id)}
            className="flex flex-col items-center justify-center py-1 px-3 relative group transition-all duration-200"
          >
            {/* Material You Pill Indicator behind active icon */}
            <div
              className={`flex items-center justify-center w-14 h-8 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon size={19} className={isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
            </div>

            {/* Label */}
            <span
              className={`text-[11px] font-medium tracking-tight mt-0.5 transition-colors ${
                isActive ? 'text-indigo-300 font-bold' : 'text-slate-400'
              }`}
            >
              {tab.label}
            </span>

            {/* Optional badge */}
            {tab.badge && !isActive && (
              <span className="absolute top-1 right-2.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, Info, Sparkles, X, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playChime } from '../utils/audio';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    playChime('tap');
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      setIsInstalling(true);
      const success = await install();
      setIsInstalling(false);
      if (success) {
        playChime('streak');
      }
    } else {
      // In desktop preview, show informative instructions
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/40 rounded-3xl p-4 shadow-lg">
        {/* Glow circle */}
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shrink-0">
            <Smartphone size={22} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/90 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={10} /> Direct PWA Download
              </span>
              {isInstalled && (
                <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-0.5">
                  <CheckCircle size={11} /> Installed
                </span>
              )}
            </div>

            <h3 className="text-sm font-bold text-white mt-1">
              Download TalkFlow to Your Phone
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Install the full standalone Android PWA app for one-tap home screen access and offline vocabulary review.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60">
                ⚡ Works Offline
              </span>
              <span className="text-[10px] bg-slate-800/80 text-emerald-300 px-2 py-0.5 rounded-md border border-slate-700/60">
                🎙️ Instant Voice
              </span>
              <span className="text-[10px] bg-slate-800/80 text-indigo-300 px-2 py-0.5 rounded-md border border-slate-700/60">
                🇮🇳 Hinglish Coach
              </span>
            </div>

            {/* Direct Action Button */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/30"
              >
                <Download size={14} className={isInstalling ? 'animate-bounce' : ''} />
                <span>
                  {isInstalled
                    ? 'App Installed (Open Fullscreen)'
                    : isInstallable
                    ? 'Download / Install App'
                    : 'Download to Home Screen'}
                </span>
              </button>

              <button
                onClick={() => setShowIOSModal(true)}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-2 p-1"
              >
                Install Guide
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Install Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
                  <Smartphone size={16} />
                </div>
                <h3 className="text-sm font-bold text-white">How to Install TalkFlow</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 space-y-1">
                <span className="font-bold text-emerald-400 block text-xs">
                  🤖 Android (Chrome / Brave / Samsung Internet):
                </span>
                <p>
                  1. Tap the <strong>"Download / Install App"</strong> button above, or open the browser menu (⋮).<br />
                  2. Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.<br />
                  3. TalkFlow will download as a standalone Android app with the official app icon!
                </p>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 space-y-1">
                <span className="font-bold text-indigo-400 block text-xs">
                  🍎 iPhone / iPad (Safari):
                </span>
                <p>
                  1. Tap the <strong>Share</strong> icon <Share size={11} className="inline mx-0.5 text-indigo-300" /> at the bottom of Safari.<br />
                  2. Scroll down and tap <strong>"Add to Home Screen"</strong>.<br />
                  3. Tap <strong>Add</strong> in the top-right corner.
                </p>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 space-y-1">
                <span className="font-bold text-amber-400 block text-xs">
                  💻 Desktop (Chrome / Edge):
                </span>
                <p>
                  Click the install icon in your browser URL bar (near the bookmark star) to run TalkFlow as a desktop app.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

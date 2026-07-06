import React, { useState } from 'react';
import { Smartphone, Monitor, ShieldCheck } from 'lucide-react';

interface DeviceFrameProps {
  children: React.ReactNode;
  activeDevice: 'ios' | 'android' | 'responsive';
  setActiveDevice: (device: 'ios' | 'android' | 'responsive') => void;
}

export default function DeviceFrame({ children, activeDevice, setActiveDevice }: DeviceFrameProps) {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Device Switcher Header - High Density (Compact, fine borders, grid-aligned) */}
      <div className="w-full max-w-7xl flex flex-wrap justify-between items-center gap-2 mb-3 pb-2 border-b border-gray-200/60 dark:border-zinc-900">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-1.5 font-display">
              VocalGuard Core <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.2 rounded font-semibold">SIV v3.2</span>
            </h1>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
              Nhận dạng người thực bằng học sâu & Tường lửa sinh trắc học thời gian thực
            </p>
          </div>
        </div>

        {/* Controls - Compact, thin border */}
        <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-zinc-900 p-1 rounded-lg border border-gray-200/50 dark:border-zinc-800/80">
          <button
            id="btn-ios-device"
            onClick={() => setActiveDevice('ios')}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
              activeDevice === 'ios'
                ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            iOS
          </button>
          <button
            id="btn-android-device"
            onClick={() => setActiveDevice('android')}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
              activeDevice === 'android'
                ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            Android
          </button>
          <button
            id="btn-responsive-device"
            onClick={() => setActiveDevice('responsive')}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
              activeDevice === 'responsive'
                ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
            }`}
          >
            <Monitor className="w-3 h-3" />
            Full Screen Console
          </button>
        </div>
      </div>

      {/* Frame Rendering - Adjusted for sleek borders and dark high-density backdrop */}
      {activeDevice === 'ios' && (
        <div className="relative mx-auto border-[10px] border-zinc-900 rounded-[38px] shadow-xl h-[780px] w-[360px] bg-zinc-950 flex flex-col overflow-hidden transition-all duration-300 select-none">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-50 flex items-center justify-between px-3">
            <span className="w-1 h-1 bg-sky-500 rounded-full animate-pulse"></span>
            <div className="w-2.5 h-2.5 border border-zinc-900 rounded-full flex items-center justify-center">
              <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>
            </div>
          </div>
          {/* Speaker ear slit */}
          <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-zinc-900 rounded-full z-50"></div>
          
          {/* iOS Status Bar */}
          <div className="h-10 bg-gray-50 dark:bg-zinc-950 flex justify-between items-end px-5 pb-1 text-[10px] font-mono font-semibold text-gray-800 dark:text-zinc-400 z-40">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <span>5G</span>
              <div className="w-4 h-2 border border-gray-400 dark:border-zinc-700 rounded-sm p-0.5 flex items-center">
                <div className="w-full h-full bg-emerald-500 rounded-xs"></div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-zinc-950 relative scrollbar-none">
            {children}
          </div>

          {/* iOS Home Indicator */}
          <div className="h-4 bg-gray-50 dark:bg-zinc-950 flex items-center justify-center pb-1 z-40">
            <div className="w-24 h-0.5 bg-gray-400 dark:bg-zinc-800 rounded-full"></div>
          </div>
        </div>
      )}

      {activeDevice === 'android' && (
        <div className="relative mx-auto border-[8px] border-zinc-800 rounded-[32px] shadow-xl h-[780px] w-[360px] bg-zinc-950 flex flex-col overflow-hidden transition-all duration-300 select-none">
          {/* Punch Hole Camera */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-50 flex items-center justify-center">
            <div className="w-1 h-1 bg-indigo-900 rounded-full"></div>
          </div>

          {/* Android Status Bar */}
          <div className="h-9 bg-zinc-50 dark:bg-zinc-950 flex justify-between items-center px-5 text-[10px] font-mono font-medium text-zinc-600 dark:text-zinc-400 z-40">
            <span>09:41</span>
            <div className="flex items-center gap-1">
              <span>LTE</span>
              <span className="text-[9px]">▲ 82%</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 relative scrollbar-none">
            {children}
          </div>

          {/* Android Nav Bar */}
          <div className="h-10 bg-zinc-50 dark:bg-zinc-950 flex justify-around items-center px-12 z-40">
            <div className="w-3 h-3 border-2 border-zinc-400 dark:border-zinc-700 rounded-sm"></div>
            <div className="w-3.5 h-3.5 border-2 border-zinc-400 dark:border-zinc-700 rounded-full"></div>
            <div className="w-3 h-3 border-b-2 border-l-2 border-zinc-400 dark:border-zinc-700 rotate-45 transform translate-x-0.5"></div>
          </div>
        </div>
      )}

      {activeDevice === 'responsive' && (
        <div className="w-full max-w-7xl bg-white dark:bg-zinc-950 border border-gray-200/60 dark:border-zinc-900 rounded-2xl shadow-lg overflow-hidden min-h-[720px] flex flex-col transition-all duration-300">
          {children}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import {
  Satellite,
  Layers,
  LayoutDashboard,
  Database,
  CheckCircle2,
  CalendarRange,
  UploadCloud,
  GitCompare,
  BarChart3,
  FileText,
} from 'lucide-react';
import { TabType } from '../types';

interface HeaderProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  unit: 'ha' | 'km2';
  onToggleUnit: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  unit,
  onToggleUnit,
}) => {
  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'dataset', label: 'Dataset', icon: <Database className="w-4 h-4" /> },
    { id: 'model-evaluation', label: 'Model Evaluation', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'temporal-analysis', label: 'Temporal Analysis', icon: <CalendarRange className="w-4 h-4" /> },
    { id: 'user-analysis', label: 'User Analysis', icon: <UploadCloud className="w-4 h-4" /> },
    { id: 'change-detection', label: 'Change Detection', icon: <GitCompare className="w-4 h-4" /> },
    { id: 'statistics', label: 'Statistics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'report', label: 'Report', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header
      id="app-header"
      className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 md:p-5 backdrop-blur-xl shadow-xl flex flex-col gap-4"
    >
      {/* Top Row: Title, Academic Subtitle, Informational Badges, and Unit Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
                GeoEcoAI
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-medium">
                Final Year Engineering Project
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Deep Learning-Based Multi-Temporal Remote Sensing Analysis
            </p>
          </div>
        </div>

        {/* Academic Context Badges & Unit Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
            <span className="text-slate-400 font-medium">Dataset:</span>
            <span className="font-semibold text-cyan-400">SECOND Benchmark</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
            <span className="text-slate-400 font-medium">Comparison:</span>
            <span className="font-semibold text-amber-400">T1 (Earlier) vs T2 (Later)</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
            <span className="text-slate-400 font-medium">Model:</span>
            <span className="font-semibold text-emerald-400">ResNet-50 + U-Net</span>
          </div>

          <button
            id="header-unit-toggle"
            onClick={onToggleUnit}
            title="Toggle unit between Hectares and Square Kilometers"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unit: <strong className="text-emerald-400 uppercase">{unit === 'ha' ? 'ha' : 'km²'}</strong></span>
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <nav
        id="main-navigation-tabs"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 pt-2 border-t border-slate-800/80 scrollbar-none"
        aria-label="Project Navigation"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/40 border border-cyan-500/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-950 border border-slate-800/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};


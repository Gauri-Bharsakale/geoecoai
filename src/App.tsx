import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScenarioDataset, TabType, UserAnalysisResult } from './types';
import { SCENARIOS } from './data/scenarios';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { DatasetTab } from './components/DatasetTab';
import { ModelEvaluationTab } from './components/ModelEvaluationTab';
import { TemporalAnalysisTab } from './components/TemporalAnalysisTab';
import { UserTemporalAnalysisTab } from './components/UserTemporalAnalysisTab';
import { ChangeDetectionTab } from './components/ChangeDetectionTab';
import { StatisticsTab } from './components/StatisticsTab';
import { ReportTab } from './components/ReportTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [currentScenario, setCurrentScenario] = useState<ScenarioDataset>(SCENARIOS[0]);
  const [unit, setUnit] = useState<'ha' | 'km2'>('ha');
  const [userResult, setUserResult] = useState<UserAnalysisResult | null>(null);

  const toggleUnit = () => {
    setUnit((prev) => (prev === 'ha' ? 'km2' : 'ha'));
  };

  return (
    <div
      id="geoecoai-app-root"
      className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5 md:p-6 lg:p-8 flex flex-col gap-5 antialiased font-sans selection:bg-cyan-500 selection:text-white"
    >
      {/* 1. Header & Tab Navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unit={unit}
        onToggleUnit={toggleUnit}
      />

      {/* 2. Main Tab Content Area */}
      <main id="main-tab-container" className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <DashboardTab
                currentScenario={currentScenario}
                onNavigateTab={setActiveTab}
                onRunAnalysis={() => setActiveTab('temporal-analysis')}
              />
            </motion.div>
          )}

          {activeTab === 'dataset' && (
            <motion.div
              key="dataset"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <DatasetTab
                currentScenario={currentScenario}
                onSelectScenario={setCurrentScenario}
                onNavigateTab={setActiveTab}
              />
            </motion.div>
          )}

          {activeTab === 'model-evaluation' && (
            <motion.div
              key="model-evaluation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <ModelEvaluationTab
                currentScenario={currentScenario}
                onNavigateTab={setActiveTab}
              />
            </motion.div>
          )}

          {activeTab === 'temporal-analysis' && (
            <motion.div
              key="temporal-analysis"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <TemporalAnalysisTab
                currentScenario={currentScenario}
                onSelectScenario={setCurrentScenario}
                onNavigateTab={setActiveTab}
              />
            </motion.div>
          )}

          {activeTab === 'user-analysis' && (
            <motion.div
              key="user-analysis"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <UserTemporalAnalysisTab
                onNavigateToTab={setActiveTab}
                userResult={userResult}
                onSetUserResult={setUserResult}
              />
            </motion.div>
          )}

          {activeTab === 'change-detection' && (
            <motion.div
              key="change-detection"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <ChangeDetectionTab
                currentScenario={currentScenario}
                unit={unit}
                onNavigateTab={setActiveTab}
              />
            </motion.div>
          )}

          {activeTab === 'statistics' && (
            <motion.div
              key="statistics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <StatisticsTab
                currentScenario={currentScenario}
                unit={unit}
                onNavigateTab={setActiveTab}
              />
            </motion.div>
          )}

          {activeTab === 'report' && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <ReportTab
                currentScenario={currentScenario}
                unit={unit}
                userResult={userResult}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
        <p>
          GeoEcoAI &middot; Deep Learning-Based Multi-Temporal Remote Sensing Analysis &middot; ResNet-50 + U-Net &middot; SECOND Benchmark (Yang et al.)
        </p>
      </footer>
    </div>
  );
}

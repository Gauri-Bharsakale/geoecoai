import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { SCENARIOS } from './src/data/scenarios';
import { calculateScenarioEvaluation } from './src/utils/evaluationMetrics';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-evaluation-metrics-plugin',
        configureServer(server) {
          server.middlewares.use('/api/evaluate-metrics', (req, res) => {
            try {
              const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
              const scenarioId = url.searchParams.get('scenarioId') || 'second-scene-0412';
              const scenario = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];

              const evaluation = calculateScenarioEvaluation(scenario);

              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.statusCode = 200;
              res.end(JSON.stringify(evaluation));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message || 'Calculation error' }));
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

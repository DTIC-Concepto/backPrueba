// scripts/coverage-to-prometheus.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Lee la variable de entorno con la URL del Pushgateway
const PUSHGATEWAY_URL = http://192.168.1.22:9091/metrics/job/nestjs_pipeline;

if (!PUSHGATEWAY_URL) {
  console.error('Error: Debes definir la variable PUSHGATEWAY_URL');
  process.exit(1);
}

// Ruta al archivo coverage-summary.json generado por Jest
const coverageFile = path.join(__dirname, '../coverage/coverage-summary.json');

if (!fs.existsSync(coverageFile)) {
  console.error(`Error: No se encontró el archivo de cobertura en ${coverageFile}`);
  process.exit(1);
}

// Lee y parsea el JSON
const raw = fs.readFileSync(coverageFile, 'utf-8');
const coverage = JSON.parse(raw);

if (!coverage.total) {
  console.error('Error: coverage.total no existe en el JSON de cobertura');
  process.exit(1);
}

// Prepara métricas en formato Prometheus
const metrics = [];
metrics.push(`jest_coverage_lines ${coverage.total.lines.pct}`);
metrics.push(`jest_coverage_statements ${coverage.total.statements.pct}`);
metrics.push(`jest_coverage_functions ${coverage.total.functions.pct}`);
metrics.push(`jest_coverage_branches ${coverage.total.branches.pct}`);

const payload = metrics.join('\n');

// Envía las métricas al Pushgateway
axios
  .post(PUSHGATEWAY_URL, payload, {
    headers: { 'Content-Type': 'text/plain' },
  })
  .then(() => {
    console.log('✅ Métricas enviadas correctamente al Pushgateway');
    console.log(payload);
  })
  .catch((err) => {
    console.error('❌ Error enviando métricas al Pushgateway:', err.message);
    process.exit(1);
  });

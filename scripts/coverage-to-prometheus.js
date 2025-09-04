const fs = require('fs');
const axios = require('axios');

const PUSHGATEWAY_URL = 'http://192.168.1.22:9091/metrics/job/nestjs_pipeline';

let coverage;
try {
  coverage = JSON.parse(fs.readFileSync('./coverage/coverage-summary.json', 'utf-8'));
} catch (err) {
  console.error('Error leyendo coverage-summary.json. ¿Existe y tiene datos?');
  process.exit(0); // ⚠️ exit 0 para que no rompa la pipeline
}

if (!coverage.total) {
  console.warn('coverage.total no existe, métricas no serán enviadas.');
  process.exit(0); // ⚠️ exit 0 para que no rompa la pipeline
}

const metrics = [];
metrics.push(`# TYPE jest_coverage_lines gauge`);
metrics.push(`jest_coverage_lines ${coverage.total.lines.pct}`);
metrics.push(`# TYPE jest_coverage_statements gauge`);
metrics.push(`jest_coverage_statements ${coverage.total.statements.pct}`);
metrics.push(`# TYPE jest_coverage_branches gauge`);
metrics.push(`jest_coverage_branches ${coverage.total.branches.pct}`);
metrics.push(`# TYPE jest_coverage_functions gauge`);
metrics.push(`jest_coverage_functions ${coverage.total.functions.pct}`);

axios.post(pushgatewayUrl, metrics.join('\n'))
  .then(() => console.log('Metrics pushed to Prometheus'))
  .catch(err => {
    console.error('Failed to push metrics', err);
    process.exit(1);
  });

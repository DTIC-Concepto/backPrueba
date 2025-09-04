const fs = require('fs');
const axios = require('axios');

const pushgatewayUrl = process.env.PUSHGATEWAY_URL;
const coverage = JSON.parse(fs.readFileSync('./coverage/coverage-summary.json', 'utf-8'));

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

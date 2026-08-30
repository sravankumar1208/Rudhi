/**
 * Rudhi Baseline Load Test Suite
 * 
 * Specification:
 * - Virtual Users (Concurrent Workers): 100
 * - Duration: 60 Seconds (1 Minute)
 * - Target: https://rudhi.vercel.app (or process.env.TARGET_URL)
 * - Measures: Requests Per Second (RPS), Min/Avg/Max Response Times, P90/P95 Latency
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

const TARGET_URL = process.env.TARGET_URL || 'https://rudhi.vercel.app';
const CONCURRENT_USERS = parseInt(process.env.VUSERS || '100', 10);
const DURATION_SECONDS = parseInt(process.env.DURATION || '60', 10);

const parsedUrl = new URL(TARGET_URL);
const httpModule = parsedUrl.protocol === 'https:' ? https : http;

let isRunning = true;
let totalRequests = 0;
let successRequests = 0;
let failedRequests = 0;
const latencies = [];

/**
 * Execute a single HTTP request and record latency
 */
function sendRequest() {
  return new Promise((resolve) => {
    const start = performance.now();
    
    const req = httpModule.request(TARGET_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Rudhi-LoadTest-Bot/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Connection': 'keep-alive',
      },
      timeout: 10000,
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const duration = Math.round(performance.now() - start);
        totalRequests++;
        if (res.statusCode >= 200 && res.statusCode < 400) {
          successRequests++;
        } else {
          failedRequests++;
        }
        latencies.push(duration);
        resolve();
      });
    });

    req.on('error', (err) => {
      const duration = Math.round(performance.now() - start);
      totalRequests++;
      failedRequests++;
      latencies.push(duration);
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      const duration = Math.round(performance.now() - start);
      totalRequests++;
      failedRequests++;
      latencies.push(duration);
      resolve();
    });

    req.end();
  });
}

/**
 * Worker loop for a single Virtual User
 */
async function virtualUserWorker(userId) {
  while (isRunning) {
    await sendRequest();
  }
}

/**
 * Calculate Percentile (e.g. 90th, 95th)
 */
function getPercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

/**
 * Main Load Test Runner
 */
async function runBaselineLoadTest() {
  console.log('===========================================================');
  console.log('       RUDHI BASELINE LOAD TEST EXECUTION');
  console.log('===========================================================');
  console.log(` Target URL:        ${TARGET_URL}`);
  console.log(` Virtual Users:     ${CONCURRENT_USERS}`);
  console.log(` Test Duration:     ${DURATION_SECONDS} Seconds`);
  console.log('-----------------------------------------------------------');
  console.log(' Warm-up complete. Starting load test run...\n');

  const startTime = Date.now();

  // Stop test after duration expires
  setTimeout(() => {
    isRunning = false;
  }, DURATION_SECONDS * 1000);

  // Launch 100 concurrent virtual user worker loops
  const workers = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    workers.push(virtualUserWorker(i + 1));
  }

  // Progress ticker every 5 seconds
  const ticker = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const currentRps = (totalRequests / Math.max(1, elapsed)).toFixed(1);
    console.log(`[Progress] Elapsed: ${elapsed}s / ${DURATION_SECONDS}s | Requests: ${totalRequests} | Current RPS: ${currentRps} req/sec`);
  }, 5000);

  // Await completion of all workers
  await Promise.all(workers);
  clearInterval(ticker);

  const actualDurationMs = Date.now() - startTime;
  const actualDurationSec = actualDurationMs / 1000;

  // Calculate Metrics
  const rps = (totalRequests / actualDurationSec).toFixed(2);
  const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
  const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
  const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const p90Latency = getPercentile(latencies, 90);
  const p95Latency = getPercentile(latencies, 95);
  const successRate = totalRequests > 0 ? ((successRequests / totalRequests) * 100).toFixed(2) : '0.00';

  console.log('\n===========================================================');
  console.log('               LOAD TEST RESULTS SUMMARY');
  console.log('===========================================================');
  console.log(` Target Endpoint:         ${TARGET_URL}`);
  console.log(` Total Execution Time:    ${actualDurationSec.toFixed(2)}s`);
  console.log(` Concurrent Users:        ${CONCURRENT_USERS} VUsers`);
  console.log('-----------------------------------------------------------');
  console.log(` Total Requests Sent:     ${totalRequests.toLocaleString()}`);
  console.log(` Successful Requests:     ${successRequests.toLocaleString()} (${successRate}%)`);
  console.log(` Failed / Timed Out:      ${failedRequests.toLocaleString()}`);
  console.log('-----------------------------------------------------------');
  console.log(` Requests Per Second:     ${rps} req/sec`);
  console.log('-----------------------------------------------------------');
  console.log(' Response Time Latency (ms):');
  console.log(`  • Minimum (Fastest):    ${minLatency} ms`);
  console.log(`  • Average:              ${avgLatency} ms`);
  console.log(`  • Maximum (Slowest):    ${maxLatency} ms`);
  console.log(`  • 90th Percentile (p90): ${p90Latency} ms`);
  console.log(`  • 95th Percentile (p95): ${p95Latency} ms`);
  console.log('===========================================================\n');

  // Save report artifact
  const reportData = {
    targetUrl: TARGET_URL,
    vusers: CONCURRENT_USERS,
    durationSeconds: DURATION_SECONDS,
    actualDurationSeconds: parseFloat(actualDurationSec.toFixed(2)),
    totalRequests,
    successRequests,
    failedRequests,
    successRatePercent: parseFloat(successRate),
    requestsPerSecond: parseFloat(rps),
    latencyMs: {
      min: minLatency,
      avg: avgLatency,
      max: maxLatency,
      p90: p90Latency,
      p95: p95Latency,
    },
    timestamp: new Date().toISOString(),
  };

  const outputDir = path.join(__dirname);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const reportPath = path.join(outputDir, 'baseline-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`Report JSON saved to: ${reportPath}`);
}

if (require.main === module) {
  runBaselineLoadTest();
}

module.exports = { runBaselineLoadTest };

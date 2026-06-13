/**
 * Deep response-shape validator
 * Checks each endpoint response matches what the frontend pages expect
 */
const axios = require('axios');
const BASE = 'http://localhost:8080/api';

async function login() {
  const { data } = await axios.post(`${BASE}/auth/login`, { loginId: 'admin', password: 'admin123' });
  axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
}

function check(label, obj, requiredKeys) {
  const missing = requiredKeys.filter(k => !(k in obj));
  if (missing.length) {
    console.error(`  ✗ [${label}] Missing keys: ${missing.join(', ')}`);
    return false;
  }
  console.log(`  ✔ [${label}] OK — keys: ${requiredKeys.join(', ')}`);
  return true;
}

async function run() {
  await login();
  console.log('\n=== Deep Shape Validation ===\n');
  let failures = 0;

  // 1. DEMAND FORECAST
  try {
    const { data } = await axios.get(`${BASE}/analytics/demand-forecasts`);
    console.log('\n[Demand Forecast]');
    if (data.length > 0) {
      const ok = check('demand item', data[0], ['productId','productName','predictedDemand','trendDirection','trendPercentage','confidencePercentage','dailyAvgSales','monthlyAvgSales','forecastDate']);
      if (!ok) failures++;
    } else console.log('  (empty array — no data)');
  } catch(e) { console.error(`  ERROR: ${e.message}`); failures++; }

  // 2. PROCUREMENT
  try {
    const { data } = await axios.get(`${BASE}/analytics/procurement-recommendations`);
    console.log('\n[Smart Procurement]');
    if (data.length > 0) {
      const ok = check('procurement item', data[0], ['recommendationId','productName','currentStock','averageDailyUsage','daysUntilStockout','recommendedQuantity','urgencyLevel','preferredVendor','reason']);
      if (!ok) failures++;
    } else console.log('  (empty array)');
  } catch(e) { console.error(`  ERROR: ${e.message}`); failures++; }

  // 3. MFG PRIORITY
  try {
    const { data } = await axios.get(`${BASE}/analytics/manufacturing-priority`);
    console.log('\n[Manufacturing Priority]');
    if (data.length > 0) {
      const ok = check('priority item', data[0], ['rank','orderId','orderRef','productName','quantity','priorityScore','priorityLevel','urgencyScore','orderValue','customerImportance','componentAvailability']);
      if (!ok) failures++;
    } else console.log('  (empty — no confirmed MOs exist yet, OK)');
  } catch(e) { console.error(`  ERROR: ${e.message}`); failures++; }

  // 4. AUTO MFG RULES
  try {
    const { data } = await axios.get(`${BASE}/analytics/auto-manufacturing/rules`);
    console.log('\n[Auto Manufacturing Rules]');
    if (data.length > 0) {
      const ok = check('rule item', data[0], ['ruleId','productName','currentStock','triggerStockLevel','manufacturingQuantity','isActive']);
      if (!ok) failures++;
    } else console.log('  (empty array)');
  } catch(e) { console.error(`  ERROR: ${e.message}`); failures++; }

  // 5. SHORTAGE ALERTS
  try {
    const { data } = await axios.get(`${BASE}/analytics/shortage-alerts`);
    console.log('\n[Shortage Alerts]');
    if (data.length > 0) {
      const ok = check('alert item', data[0], ['alertId','moRef','componentName','requiredQuantity','availableQuantity','shortageQuantity','severity','canBlockProduction']);
      if (!ok) failures++;
    } else console.log('  (empty — no MO component shortages, OK)');
  } catch(e) { console.error(`  ERROR: ${e.message}`); failures++; }

  // 6. HEATMAP
  try {
    const { data } = await axios.get(`${BASE}/analytics/inventory-heatmap`);
    console.log('\n[Inventory Heat Map]');
    const ok1 = check('heatmap root', data, ['heatMap','categorySummary','totalProducts']);
    if (!ok1) failures++;
    if (data.heatMap?.length > 0) {
      const ok2 = check('heatmap item', data.heatMap[0], ['productId','productName','onHand','stockValue','heatLevel','intensity']);
      if (!ok2) failures++;
    }
    if (data.categorySummary?.length > 0) {
      const ok3 = check('category item', data.categorySummary[0], ['category','totalStock','productCount']);
      if (!ok3) failures++;
    }
  } catch(e) { console.error(`  ERROR: ${e.message}`); failures++; }

  // 7. DEAD STOCK
  try {
    const { data } = await axios.get(`${BASE}/analytics/dead-stock`);
    console.log('\n[Dead Stock]');
    if (data.length > 0) {
      const ok = check('dead stock item', data[0], ['alertId','productName','daysSinceLastSale','inventoryValue','currentOnHandQty','recommendedAction']);
      if (!ok) failures++;
    } else console.log('  (empty — all products have recent sales, OK)');
  } catch(e) { console.error(`  ERROR: ${e.message}`); failures++; }

  // 8. RANKINGS
  try {
    const { data } = await axios.get(`${BASE}/analytics/rankings`);
    console.log('\n[Rankings]');
    const ok1 = check('rankings root', data, ['topCustomers','topProducts','totalRevenue']);
    if (!ok1) failures++;
    if (data.topCustomers?.length > 0) {
      const ok2 = check('customer ranking', data.topCustomers[0], ['rank','customerId','customerName','totalRevenue','orderCount','revenueShare','tier']);
      if (!ok2) failures++;
    }
    if (data.topProducts?.length > 0) {
      const ok3 = check('product ranking', data.topProducts[0], ['rank','productId','productName','totalRevenue','totalQtySold','revenueShare','currentStock']);
      if (!ok3) failures++;
    }
  } catch(e) { console.error(`  ERROR: ${e.message}`); failures++; }

  // 9. HEALTH SCORE
  try {
    const { data } = await axios.get(`${BASE}/analytics/health-score`);
    console.log('\n[Business Health Score]');
    const ok = check('health root', data, ['overallScore','healthStatus','scoreDate','components','recommendations']);
    if (!ok) failures++;
    console.log(`     Score: ${data.overallScore}/100, Status: ${data.healthStatus}`);
    console.log(`     Components: ${JSON.stringify(data.components)}`);
  } catch(e) { console.error(`  ERROR: ${e.message}`); failures++; }

  // 10. PROFIT LEAKS
  try {
    const { data } = await axios.get(`${BASE}/analytics/profit-leaks`);
    console.log('\n[Profit Leaks]');
    const ok1 = check('leaks root', data, ['totalLeaks','totalMonthlyImpact','leaks','byType']);
    if (!ok1) failures++;
    if (data.leaks?.length > 0) {
      const ok2 = check('leak item', data.leaks[0], ['leakId','leakType','description','estimatedMonthlyImpact','recommendedAction']);
      if (!ok2) failures++;
    }
    console.log(`     Total leaks: ${data.totalLeaks}, Monthly impact: ₹${data.totalMonthlyImpact}`);
  } catch(e) { console.error(`  ERROR: ${e.message}`); failures++; }

  // 11. ERP STORIES
  try {
    const genRes = await axios.post(`${BASE}/analytics/stories/generate`, { periodType: 'DAILY' });
    const { data } = await axios.get(`${BASE}/analytics/stories`);
    console.log('\n[ERP Story]');
    if (data.length > 0) {
      const ok = check('story item', data[0], ['id','periodType','storyDate','storyContent','revenue','ordersReceived','revenueChange']);
      if (!ok) failures++;
      console.log(`     Story preview: "${data[0].storyContent?.slice(0,80)}..."`);
    }
  } catch(e) { console.error(`  ERROR: ${e.message}`); failures++; }

  // 12. SIMULATIONS
  try {
    const simRes = await axios.post(`${BASE}/analytics/simulations`, { scenarioType: 'PRICE_CHANGE', parameters: { percentChange: 20 } });
    const { data } = await axios.get(`${BASE}/analytics/simulations`);
    console.log('\n[Business Simulator]');
    if (data.length > 0) {
      const ok = check('simulation item', data[0], ['id','name','scenarioType','description','projectedRevenue','projectedCosts','projectedProfit','estimatedImpact','aiInsights']);
      if (!ok) failures++;
    }
    const simOk = check('run result', simRes.data, ['id','name','scenarioType','projectedRevenue','projectedCosts','projectedProfit','estimatedImpact','aiInsights']);
    if (!simOk) failures++;
  } catch(e) { console.error(`  ERROR: ${e.message}`); failures++; }

  // 13. CHATBOT
  try {
    const { data } = await axios.post(`${BASE}/analytics/chat`, { question: 'How many products do we have?' });
    console.log('\n[AI Chatbot]');
    const ok = check('chat response', data, ['question','answer','queryType','timestamp']);
    if (!ok) failures++;
    console.log(`     Q: ${data.question}`);
    console.log(`     A: ${data.answer?.slice(0,120)}`);
  } catch(e) { console.error(`  ERROR: ${e.message}`); failures++; }

  // CHAT HISTORY
  try {
    const { data } = await axios.get(`${BASE}/analytics/chat/history`);
    console.log('\n[Chat History]');
    if (data.length > 0) {
      const ok = check('history item', data[0], ['question','answer']);
      if (!ok) failures++;
    }
    console.log(`     ${data.length} messages in history`);
  } catch(e) { console.error(`  ERROR: ${e.message}`); failures++; }

  console.log(`\n\n=== RESULT: ${failures === 0 ? '✅ ALL SHAPES VALID' : `❌ ${failures} FAILURES FOUND`} ===\n`);
  return failures;
}

run().then(f => process.exit(f > 0 ? 1 : 0)).catch(e => { console.error(e.message); process.exit(1); });

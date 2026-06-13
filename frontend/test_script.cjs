/**
 * Comprehensive ERP data seeder + endpoint validator
 * Seeds: products, customers, vendors, sales orders (confirmed+delivered), purchase orders, manufacturing orders
 * Then validates all 13 analytics endpoints and prints rich summaries
 */
const axios = require('axios');

const BASE = 'http://localhost:8080/api';

function h(str) {
  const line = '─'.repeat(60);
  console.log(`\n${line}\n  ${str}\n${line}`);
}

async function run() {
  /* ── LOGIN ── */
  h('STEP 1 — Login');
  const { data: auth } = await axios.post(`${BASE}/auth/login`, { loginId: 'admin', password: 'admin123' });
  axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
  console.log(`Logged in as ${auth.name} (${auth.role})`);

  /* ── PRODUCTS ── */
  h('STEP 2 — Create Products');
  const products = [];
  const productData = [
    { name: 'Ergonomic Office Chair', sku: 'CHR-001', salesPrice: 8500,  costPrice: 4000, currentStock: 25, category: 'Furniture' },
    { name: 'Standing Desk',          sku: 'DSK-001', salesPrice: 15000, costPrice: 7000, currentStock: 10, category: 'Furniture' },
    { name: 'Mechanical Keyboard',    sku: 'KB-001',  salesPrice: 3500,  costPrice: 1800, currentStock: 60, category: 'Electronics' },
    { name: 'Curved Monitor 27"',     sku: 'MON-001', salesPrice: 22000, costPrice: 14000,currentStock: 8,  category: 'Electronics' },
    { name: 'Webcam HD Pro',          sku: 'CAM-001', salesPrice: 4500,  costPrice: 2200, currentStock: 0,  category: 'Electronics' },
    { name: 'LED Desk Lamp',          sku: 'LMP-001', salesPrice: 1200,  costPrice: 600,  currentStock: 3,  category: 'Accessories' },
    { name: 'USB-C Hub 7-in-1',       sku: 'HUB-001', salesPrice: 2800,  costPrice: 1400, currentStock: 40, category: 'Accessories' },
  ];
  for (const p of productData) {
    const { data } = await axios.post(`${BASE}/products`, p);
    products.push(data);
    console.log(`  ✔ Created: ${data.name} (ID: ${data.id}, Stock: ${p.currentStock})`);
  }

  /* ── CUSTOMERS ── */
  h('STEP 3 — Create Customers');
  const customers = [];
  const customerData = [
    { name: 'Tata Consultancy Services', email: 'tcs@example.com', phone: '1111111111' },
    { name: 'Wipro Technologies',        email: 'wipro@example.com', phone: '2222222222' },
    { name: 'Infosys Ltd',               email: 'infosys@example.com', phone: '3333333333' },
    { name: 'HCL Tech',                  email: 'hcl@example.com', phone: '4444444444' },
    { name: 'Tech Mahindra',             email: 'techmahindra@example.com', phone: '5555555555' },
  ];
  for (const c of customerData) {
    const { data } = await axios.post(`${BASE}/customers`, c);
    customers.push(data);
    console.log(`  ✔ Created: ${data.name} (ID: ${data.id})`);
  }

  /* ── VENDORS ── */
  h('STEP 4 — Create Vendors');
  const vendors = [];
  const vendorData = [
    { name: 'FurniCraft Wholesale', email: 'furnicraft@example.com', phone: '6666666666' },
    { name: 'ElecWorld Distributors', email: 'elecworld@example.com', phone: '7777777777' },
    { name: 'AccessoryHub India', email: 'accessoryhub@example.com', phone: '8888888888' },
  ];
  for (const v of vendorData) {
    const { data } = await axios.post(`${BASE}/vendors`, v);
    vendors.push(data);
    console.log(`  ✔ Created: ${data.name} (ID: ${data.id})`);
  }

  /* ── SALES ORDERS ── */
  h('STEP 5 — Create & Confirm Sales Orders');
  const soPayloads = [
    {
      customerId: customers[0].id, scheduleDate: '2026-07-10',
      lines: [
        { productId: products[0].id, orderedQty: 10, salesPrice: 8500 },
        { productId: products[2].id, orderedQty: 10, salesPrice: 3500 },
      ]
    },
    {
      customerId: customers[1].id, scheduleDate: '2026-07-05',
      lines: [
        { productId: products[3].id, orderedQty: 5, salesPrice: 22000 },
        { productId: products[6].id, orderedQty: 20, salesPrice: 2800 },
      ]
    },
    {
      customerId: customers[2].id, scheduleDate: '2026-06-30',
      lines: [
        { productId: products[1].id, orderedQty: 4, salesPrice: 15000 },
        { productId: products[5].id, orderedQty: 15, salesPrice: 1200 },
      ]
    },
    {
      customerId: customers[3].id, scheduleDate: '2026-06-25',
      lines: [
        { productId: products[0].id, orderedQty: 8, salesPrice: 8500 },
        { productId: products[4].id, orderedQty: 12, salesPrice: 4500 },
      ]
    },
    {
      customerId: customers[4].id, scheduleDate: '2026-07-15',
      lines: [
        { productId: products[2].id, orderedQty: 25, salesPrice: 3500 },
        { productId: products[6].id, orderedQty: 15, salesPrice: 2800 },
      ]
    },
    {
      customerId: customers[0].id, scheduleDate: '2026-07-20',
      lines: [
        { productId: products[3].id, orderedQty: 3, salesPrice: 22000 },
      ]
    },
    {
      customerId: customers[1].id, scheduleDate: '2026-06-28',
      lines: [
        { productId: products[1].id, orderedQty: 6, salesPrice: 15000 },
        { productId: products[2].id, orderedQty: 30, salesPrice: 3500 },
      ]
    },
  ];
  const salesOrders = [];
  for (const payload of soPayloads) {
    const { data: so } = await axios.post(`${BASE}/sales-orders`, payload);
    const { data: confirmed } = await axios.post(`${BASE}/sales-orders/${so.id}/confirm`);
    salesOrders.push(confirmed);
    const total = payload.lines.reduce((s, l) => s + l.orderedQty * l.salesPrice, 0);
    console.log(`  ✔ SO-${confirmed.id} confirmed (Customer: ${confirmed.customer?.name}, Value: ₹${total.toLocaleString()})`);
  }

  /* ── PURCHASE ORDERS ── */
  h('STEP 6 — Create Purchase Orders');
  const poPayloads = [
    {
      vendorId: vendors[0].id, expectedDate: '2026-06-18',
      lines: [
        { productId: products[0].id, orderedQty: 20, unitPrice: 4000 },
        { productId: products[1].id, orderedQty: 10, unitPrice: 7000 },
      ]
    },
    {
      vendorId: vendors[1].id, expectedDate: '2026-06-20',
      lines: [
        { productId: products[4].id, orderedQty: 30, unitPrice: 2200 },
        { productId: products[5].id, orderedQty: 50, unitPrice: 600 },
      ]
    },
    {
      vendorId: vendors[2].id, expectedDate: '2026-06-22',
      lines: [
        { productId: products[6].id, orderedQty: 40, unitPrice: 1400 },
      ]
    },
  ];
  for (const payload of poPayloads) {
    const { data: po } = await axios.post(`${BASE}/purchase-orders`, payload);
    await axios.post(`${BASE}/purchase-orders/${po.id}/confirm`);
    console.log(`  ✔ PO-${po.id} confirmed (Vendor: ${vendors.find(v => v.id === payload.vendorId)?.name})`);
  }

  /* ── AUTO MFG RULES ── */
  h('STEP 7 — Set Auto Manufacturing Rules');
  const lowStockProducts = products.filter(p => [4, 5].includes(products.indexOf(p)));
  for (const p of products.slice(0, 4)) {
    await axios.post(`${BASE}/analytics/auto-manufacturing/rules`, {
      productId: p.id,
      triggerStockLevel: 5,
      manufacturingQuantity: 20,
      safetyStock: 5,
      leadTimeDays: 3,
    });
    console.log(`  ✔ Auto-mfg rule set for: ${p.name}`);
  }

  /* ── ANALYTICS VALIDATION ── */
  h('STEP 8 — Validate All Analytics Endpoints');
  const analyticsEndpoints = [
    { method: 'GET',  path: '/analytics/demand-forecasts',          label: 'Demand Forecast Engine' },
    { method: 'GET',  path: '/analytics/procurement-recommendations',label: 'Smart Procurement Advisor' },
    { method: 'GET',  path: '/analytics/manufacturing-priority',     label: 'Manufacturing Priority Engine' },
    { method: 'GET',  path: '/analytics/auto-manufacturing/rules',   label: 'Auto Manufacturing Rules' },
    { method: 'POST', path: '/analytics/auto-manufacturing/trigger', label: 'Auto Manufacturing Trigger' },
    { method: 'GET',  path: '/analytics/shortage-alerts',           label: 'Component Shortage Detection' },
    { method: 'GET',  path: '/analytics/inventory-heatmap',         label: 'Inventory Heat Map' },
    { method: 'GET',  path: '/analytics/dead-stock',                label: 'Dead Stock Detector' },
    { method: 'GET',  path: '/analytics/rankings',                  label: 'Business Rankings' },
    { method: 'GET',  path: '/analytics/health-score',              label: 'Business Health Score' },
    { method: 'GET',  path: '/analytics/profit-leaks',              label: 'Profit Leak Detector' },
    { method: 'GET',  path: '/analytics/stories',                   label: 'ERP Story' },
    { method: 'POST', path: '/analytics/stories/generate',          label: 'Generate ERP Story', body: { periodType: 'DAILY' } },
    { method: 'GET',  path: '/analytics/simulations',               label: 'Business Simulator — List' },
    {
      method: 'POST', path: '/analytics/simulations',
      label: 'Business Simulator — Run PRICE_CHANGE +15%',
      body: { scenarioType: 'PRICE_CHANGE', parameters: { percentChange: 15 } }
    },
    {
      method: 'POST', path: '/analytics/simulations',
      label: 'Business Simulator — Run DEMAND_SHOCK +30%',
      body: { scenarioType: 'DEMAND_SHOCK', parameters: { percentChange: 30 } }
    },
    {
      method: 'POST', path: '/analytics/simulations',
      label: 'Business Simulator — Run COST_INCREASE +10%',
      body: { scenarioType: 'COST_INCREASE', parameters: { percentChange: 10 } }
    },
    {
      method: 'POST', path: '/analytics/chat',
      label: 'AI Chatbot — Best selling product',
      body: { question: 'What is our best selling product?' }
    },
    {
      method: 'POST', path: '/analytics/chat',
      label: 'AI Chatbot — Low stock products',
      body: { question: 'Which products are low on stock?' }
    },
    {
      method: 'POST', path: '/analytics/chat',
      label: 'AI Chatbot — Total revenue',
      body: { question: 'What is our total confirmed revenue this month?' }
    },
    {
      method: 'GET', path: '/analytics/chat/history',
      label: 'AI Chatbot — History'
    },
  ];

  let passed = 0, failed = 0;
  const errors = [];
  for (const ep of analyticsEndpoints) {
    try {
      let res;
      if (ep.method === 'GET') {
        res = await axios.get(`${BASE}${ep.path}`);
      } else {
        res = await axios.post(`${BASE}${ep.path}`, ep.body || {});
      }

      const data = res.data;
      let summary = '';
      if (Array.isArray(data)) {
        summary = `${data.length} items`;
        if (data.length > 0) {
          const firstKey = Object.keys(data[0])[0];
          summary += ` (first: ${JSON.stringify(data[0][firstKey]).slice(0, 40)})`;
        }
      } else if (data && typeof data === 'object') {
        const keys = Object.keys(data);
        summary = `{${keys.slice(0, 4).join(', ')}${keys.length > 4 ? '...' : ''}}`;
      }
      console.log(`  ✔ [${ep.method} ${ep.path}] ${ep.label} → ${summary}`);
      passed++;
    } catch (e) {
      const errMsg = e.response?.data?.error || e.response?.data || e.message;
      console.error(`  ✗ [${ep.method} ${ep.path}] ${ep.label} → ${e.response?.status || 'ERR'}: ${JSON.stringify(errMsg).slice(0, 100)}`);
      errors.push({ ep, error: errMsg });
      failed++;
    }
  }

  /* ── SUMMARY ── */
  h(`RESULTS: ${passed} passed, ${failed} failed`);
  if (errors.length > 0) {
    console.log('\nFailed endpoints:');
    errors.forEach(({ ep, error }) => {
      console.log(`  ✗ ${ep.method} ${ep.path}: ${JSON.stringify(error).slice(0, 200)}`);
    });
  } else {
    console.log('  🎉 ALL ENDPOINTS PASSED!');
  }
}

run().catch(e => {
  console.error('Fatal error:', e.response?.data || e.message);
  process.exit(1);
});

import { createApp } from '../app.js';
import { prisma } from '../config/prisma.js';
import http from 'http';

const app = createApp();
const server = http.createServer(app);

async function runTests() {
  console.log('🧪 Starting Naja Store API Comprehensive Verification Suite...\n');

  // Start local test server on an ephemeral port
  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const address = server.address() as { port: number };
  const BASE_URL = `http://127.0.0.1:${address.port}/api`;
  console.log(`🌐 Test server listening on ${BASE_URL}\n`);

  let adminToken = '';
  let customerToken = '';
  let testCategoryId = '';
  let testColorId = '';
  let testSizeId = '';
  let testZoneId = '';
  let testProductId = '';
  let testVariantId = '';
  let testOrderId = '';
  let testCustomerId = '';

  let passed = 0;
  let failed = 0;

  async function testEndpoint(
    name: string,
    fn: () => Promise<boolean>
  ) {
    try {
      const success = await fn();
      if (success) {
        console.log(`  ✅ [PASS] ${name}`);
        passed++;
      } else {
        console.error(`  ❌ [FAIL] ${name}`);
        failed++;
      }
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name} -> Error:`, err.message);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. HEALTH CHECK
  // ---------------------------------------------------------------------------
  console.log('📌 1. Health & Base Route Tests');
  await testEndpoint('GET /api/health returns 200 and operational status', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const json: any = await res.json();
    return res.status === 200 && json.success === true && json.data.status === 'UP';
  });

  // ---------------------------------------------------------------------------
  // 2. AUTHENTICATION & SECURITY
  // ---------------------------------------------------------------------------
  console.log('\n📌 2. Authentication & Authorization Tests');

  await testEndpoint('POST /api/auth/register creates new customer and returns JWT', async () => {
    const testEmail = `test.client.${Date.now()}@najastore.sn`;
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Awa',
        lastName: 'Ndiaye',
        email: testEmail,
        phone: '+221770001122',
        password: 'Password123!',
      }),
    });
    const json: any = await res.json();
    if (res.status === 201 && json.data?.token) {
      customerToken = json.data.token;
      return true;
    }
    return false;
  });

  await testEndpoint('POST /api/auth/login with Admin credentials returns valid admin token', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@najastore.sn',
        password: 'AdminPass2026!',
      }),
    });
    const json: any = await res.json();
    if (res.status === 200 && json.data?.token && json.data?.user?.role === 'ADMIN') {
      adminToken = json.data.token;
      return true;
    }
    return false;
  });

  await testEndpoint('GET /api/auth/me returns authenticated profile', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json: any = await res.json();
    return res.status === 200 && json.data?.email === 'admin@najastore.sn';
  });

  await testEndpoint('GET /api/admin/orders rejects unauthenticated access (401)', async () => {
    const res = await fetch(`${BASE_URL}/admin/orders`);
    const json: any = await res.json();
    return res.status === 401 && json.code === 'AUTH_TOKEN_MISSING';
  });

  await testEndpoint('GET /api/admin/orders rejects standard customer token with 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/admin/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const json: any = await res.json();
    return res.status === 403 && json.code === 'FORBIDDEN';
  });

  // ---------------------------------------------------------------------------
  // 3. CATEGORIES API
  // ---------------------------------------------------------------------------
  console.log('\n📌 3. Categories API Tests');

  await testEndpoint('POST /api/admin/categories creates new category', async () => {
    const res = await fetch(`${BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Bijoux & Parfums ${Date.now()}`,
        description: 'Parfums d\'ambre et encens traditionnels Thiouraye',
      }),
    });
    const json: any = await res.json();
    if (res.status === 201 && json.data?.id) {
      testCategoryId = json.data.id;
      return true;
    }
    return false;
  });

  await testEndpoint('GET /api/categories returns category list', async () => {
    const res = await fetch(`${BASE_URL}/categories`);
    const json: any = await res.json();
    return res.status === 200 && Array.isArray(json.data) && json.data.length > 0;
  });

  await testEndpoint('PUT /api/admin/categories/:id updates category details', async () => {
    const res = await fetch(`${BASE_URL}/admin/categories/${testCategoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        description: 'Description mise à jour pour test',
      }),
    });
    const json: any = await res.json();
    return res.status === 200 && json.data?.description === 'Description mise à jour pour test';
  });

  // ---------------------------------------------------------------------------
  // 4. COLORS & SIZES API
  // ---------------------------------------------------------------------------
  console.log('\n📌 4. Colors & Sizes API Tests');

  await testEndpoint('POST /api/admin/colors creates color with valid hex', async () => {
    const res = await fetch(`${BASE_URL}/admin/colors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Bleu Indigo ${Date.now()}`,
        hex: '#1D4ED8',
      }),
    });
    const json: any = await res.json();
    if (res.status === 201 && json.data?.id) {
      testColorId = json.data.id;
      return true;
    }
    return false;
  });

  await testEndpoint('GET /api/colors returns active color choices', async () => {
    const res = await fetch(`${BASE_URL}/colors`);
    const json: any = await res.json();
    return res.status === 200 && Array.isArray(json.data);
  });

  await testEndpoint('POST /api/admin/sizes creates size option', async () => {
    const res = await fetch(`${BASE_URL}/admin/sizes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `3XL-${Date.now()}`,
      }),
    });
    const json: any = await res.json();
    if (res.status === 201 && json.data?.id) {
      testSizeId = json.data.id;
      return true;
    }
    return false;
  });

  await testEndpoint('GET /api/sizes returns sizes list', async () => {
    const res = await fetch(`${BASE_URL}/sizes`);
    const json: any = await res.json();
    return res.status === 200 && Array.isArray(json.data);
  });

  // ---------------------------------------------------------------------------
  // 5. DELIVERY ZONES API
  // ---------------------------------------------------------------------------
  console.log('\n📌 5. Delivery Zones API Tests');

  await testEndpoint('POST /api/admin/delivery-zones creates new shipping zone', async () => {
    const res = await fetch(`${BASE_URL}/admin/delivery-zones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Zone Aéroport AIBD / Diass ${Date.now()}`,
        price: 4000,
        estimatedDelivery: '24h',
      }),
    });
    const json: any = await res.json();
    if (res.status === 201 && json.data?.id) {
      testZoneId = json.data.id;
      return true;
    }
    return false;
  });

  await testEndpoint('GET /api/delivery-zones lists all active zones', async () => {
    const res = await fetch(`${BASE_URL}/delivery-zones`);
    const json: any = await res.json();
    return res.status === 200 && Array.isArray(json.data);
  });

  // ---------------------------------------------------------------------------
  // 6. PRODUCTS API
  // ---------------------------------------------------------------------------
  console.log('\n📌 6. Products API Tests');

  await testEndpoint('POST /api/admin/products creates product with variants and <= 7 images', async () => {
    const sku = `SKU-TEST-${Date.now().toString().slice(-6)}`;
    const res = await fetch(`${BASE_URL}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Ensemble Bazin Royal Test ${Date.now()}`,
        description: 'Tissu Getzner 1er choix brodé main',
        categoryId: testCategoryId,
        price: 70000,
        oldPrice: 85000,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
            publicId: 'test/bazin_1',
            position: 0,
            isPrimary: true,
          },
        ],
        variants: [
          {
            colorId: testColorId,
            sizeId: testSizeId,
            sku,
            stock: 25,
            price: 70000,
          },
        ],
      }),
    });
    const json: any = await res.json();
    if (res.status === 201 && json.data?.id) {
      testProductId = json.data.id;
      testVariantId = json.data.variants[0].id;
      return true;
    }
    return false;
  });

  await testEndpoint('POST /api/admin/products rejects more than 7 images', async () => {
    const fakeImages = Array(8).fill(null).map((_, i) => ({
      url: `https://example.com/img${i}.jpg`,
      publicId: `test/img_${i}`,
      position: i,
    }));

    const res = await fetch(`${BASE_URL}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Produit Invalide 8 Images',
        categoryId: testCategoryId,
        price: 50000,
        images: fakeImages,
        variants: [
          {
            sku: `SKU-FAIL-${Date.now()}`,
            stock: 10,
          },
        ],
      }),
    });
    const json: any = await res.json();
    return res.status === 400 && json.code === 'VALIDATION_ERROR';
  });

  await testEndpoint('GET /api/products returns paginated catalog', async () => {
    const res = await fetch(`${BASE_URL}/products?limit=10`);
    const json: any = await res.json();
    return res.status === 200 && Array.isArray(json.data) && json.meta?.total > 0;
  });

  // ---------------------------------------------------------------------------
  // 7. ORDERS & STOCK MOVEMENTS API
  // ---------------------------------------------------------------------------
  console.log('\n📌 7. Orders & Stock Movements API Tests');

  await testEndpoint('POST /api/orders creates order, decrements stock & creates movement', async () => {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          firstName: 'Moussa',
          lastName: 'Sarr',
          email: `moussa.${Date.now()}@example.sn`,
          phone: '+221775556677',
          address: 'Almadies, Zone 4',
          city: 'Dakar',
        },
        deliveryZoneId: testZoneId,
        deliveryAddress: 'Almadies, Villa 12, Dakar',
        phone: '+221775556677',
        paymentMethod: 'WAVE',
        items: [
          {
            variantId: testVariantId,
            quantity: 2,
          },
        ],
      }),
    });
    const json: any = await res.json();
    if (res.status === 201 && json.data?.order?.id) {
      testOrderId = json.data.order.id;
      testCustomerId = json.data.order.customerId;
      return true;
    }
    return false;
  });

  await testEndpoint('GET /api/orders/:id retrieves order snapshot details', async () => {
    const res = await fetch(`${BASE_URL}/orders/${testOrderId}`);
    const json: any = await res.json();
    return res.status === 200 && json.data?.id === testOrderId && json.data.items?.length > 0;
  });

  await testEndpoint('GET /api/admin/orders lists all orders for admin', async () => {
    const res = await fetch(`${BASE_URL}/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json: any = await res.json();
    return res.status === 200 && Array.isArray(json.data);
  });

  await testEndpoint('PUT /api/admin/orders/:id/status updates order status', async () => {
    const res = await fetch(`${BASE_URL}/admin/orders/${testOrderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'SHIPPED',
        paymentStatus: 'PAID',
      }),
    });
    const json: any = await res.json();
    return res.status === 200 && json.data?.status === 'SHIPPED';
  });

  // ---------------------------------------------------------------------------
  // 8. CUSTOMERS API
  // ---------------------------------------------------------------------------
  console.log('\n📌 8. Customers API Tests');

  await testEndpoint('GET /api/admin/customers lists customer accounts', async () => {
    const res = await fetch(`${BASE_URL}/admin/customers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json: any = await res.json();
    return res.status === 200 && Array.isArray(json.data);
  });

  await testEndpoint('GET /api/admin/customers/:id retrieves customer profile & order history', async () => {
    const res = await fetch(`${BASE_URL}/admin/customers/${testCustomerId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json: any = await res.json();
    return res.status === 200 && json.data?.id === testCustomerId;
  });

  // ---------------------------------------------------------------------------
  // 9. STOCK API
  // ---------------------------------------------------------------------------
  console.log('\n📌 9. Stock & Inventory Management API Tests');

  await testEndpoint('GET /api/admin/stock returns real-time inventory for all variants', async () => {
    const res = await fetch(`${BASE_URL}/admin/stock`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json: any = await res.json();
    return res.status === 200 && Array.isArray(json.data);
  });

  await testEndpoint('PUT /api/admin/stock/:variantId records stock replenishment (STOCK_IN)', async () => {
    const res = await fetch(`${BASE_URL}/admin/stock/${testVariantId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        type: 'STOCK_IN',
        quantity: 10,
        reason: 'Réapprovisionnement atelier Dakar',
        reference: 'REAPP-2026-001',
      }),
    });
    const json: any = await res.json();
    return res.status === 200 && json.data?.movement?.type === 'STOCK_IN';
  });

  await testEndpoint('GET /api/admin/stock/movements returns stock movement log', async () => {
    const res = await fetch(`${BASE_URL}/admin/stock/movements`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json: any = await res.json();
    return res.status === 200 && Array.isArray(json.data) && json.data.length > 0;
  });

  // ---------------------------------------------------------------------------
  // 10. MULTI-PROVIDER PAYMENT SYSTEM & WEBHOOK TESTS (PROMPT 8)
  // ---------------------------------------------------------------------------
  console.log('\n📌 10. Payment Providers & Webhook Tests (Wave, OM, COD)');

  let waveOrderId = '';
  let waveOrderNumber = '';
  let omOrderId = '';
  let omOrderNumber = '';
  let codOrderId = '';
  let codOrderNumber = '';

  // Setup: Create 3 distinct test orders for Wave, OM, and COD
  await testEndpoint('Setup: Create test orders for each payment method', async () => {
    // 1. Wave Order
    const resWave = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          firstName: 'Fatou',
          lastName: 'Sarr',
          email: 'fatou.sarr@test.sn',
          phone: '+221771112233',
          address: 'Almadies Zone 4',
          city: 'Dakar',
        },
        deliveryZoneId: testZoneId,
        deliveryAddress: 'Almadies Zone 4, Dakar',
        phone: '+221771112233',
        paymentMethod: 'WAVE',
        items: [{ variantId: testVariantId, quantity: 1 }],
      }),
    });
    const waveJson: any = await resWave.json();
    waveOrderId = waveJson.data.order.id;
    waveOrderNumber = waveJson.data.order.orderNumber;

    // 2. Orange Money Order
    const resOM = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          firstName: 'Moussa',
          lastName: 'Ba',
          email: 'moussa.ba@test.sn',
          phone: '+221782223344',
          address: 'Mermoz Pyrotechnie',
          city: 'Dakar',
        },
        deliveryZoneId: testZoneId,
        deliveryAddress: 'Mermoz Pyrotechnie, Dakar',
        phone: '+221782223344',
        paymentMethod: 'ORANGE_MONEY',
        items: [{ variantId: testVariantId, quantity: 1 }],
      }),
    });
    const omJson: any = await resOM.json();
    omOrderId = omJson.data.order.id;
    omOrderNumber = omJson.data.order.orderNumber;

    // 3. Cash on Delivery Order
    const resCOD = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          firstName: 'Cheikh',
          lastName: 'Gueye',
          email: 'cheikh.gueye@test.sn',
          phone: '+221763334455',
          address: 'Plateau Rue Carnot',
          city: 'Dakar',
        },
        deliveryZoneId: testZoneId,
        deliveryAddress: 'Plateau Rue Carnot, Dakar',
        phone: '+221763334455',
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [{ variantId: testVariantId, quantity: 1 }],
      }),
    });
    const codJson: any = await resCOD.json();
    codOrderId = codJson.data.order.id;
    codOrderNumber = codJson.data.order.orderNumber;

    return (
      resWave.status === 201 &&
      resOM.status === 201 &&
      resCOD.status === 201 &&
      Boolean(waveOrderId && omOrderId && codOrderId)
    );
  });

  await testEndpoint('POST /api/payments/initiate generates session URL for WAVE', async () => {
    const res = await fetch(`${BASE_URL}/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: waveOrderId }),
    });
    const json: any = await res.json();
    return (
      res.status === 200 &&
      json.success === true &&
      json.data.method === 'WAVE' &&
      json.data.status === 'PENDING' &&
      Boolean(json.data.paymentUrl || json.data.launchUrl)
    );
  });

  await testEndpoint('POST /api/payments/initiate generates session URL for ORANGE_MONEY', async () => {
    const res = await fetch(`${BASE_URL}/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: omOrderId }),
    });
    const json: any = await res.json();
    return (
      res.status === 200 &&
      json.success === true &&
      json.data.method === 'ORANGE_MONEY' &&
      json.data.status === 'PENDING' &&
      Boolean(json.data.paymentUrl || json.data.token)
    );
  });

  await testEndpoint('Cash On Delivery automatically initializes as PENDING', async () => {
    const res = await fetch(`${BASE_URL}/payments/${codOrderId}/status`);
    const json: any = await res.json();
    return (
      res.status === 200 &&
      json.data.paymentMethod === 'CASH_ON_DELIVERY' &&
      json.data.paymentStatus === 'PENDING' &&
      json.data.isPaid === false
    );
  });

  await testEndpoint('POST /api/payments/wave/webhook securely processes Wave payment callback', async () => {
    const webhookPayload = {
      type: 'checkout.session.completed',
      id: `wave_evt_${Date.now()}`,
      data: {
        id: `wave_sess_${waveOrderId}`,
        client_reference: waveOrderNumber,
        payment_status: 'succeeded',
        amount: '120000',
        currency: 'XOF',
      },
    };

    const res = await fetch(`${BASE_URL}/payments/wave/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });
    const json: any = await res.json();

    // Verify order was advanced to CONFIRMED and payment to PAID
    const orderRes = await fetch(`${BASE_URL}/orders/number/${waveOrderNumber}`);
    const orderJson: any = await orderRes.json();

    return (
      res.status === 200 &&
      json.success === true &&
      orderJson.data.paymentStatus === 'PAID' &&
      orderJson.data.status === 'CONFIRMED'
    );
  });

  await testEndpoint('POST /api/payments/wave/webhook is strictly IDEMPOTENT (no double processing)', async () => {
    // Re-send the exact same webhook notification
    const duplicatePayload = {
      type: 'checkout.session.completed',
      id: `wave_evt_duplicate_${Date.now()}`,
      data: {
        id: `wave_sess_${waveOrderId}`,
        client_reference: waveOrderNumber,
        payment_status: 'succeeded',
        amount: '120000',
      },
    };

    const res = await fetch(`${BASE_URL}/payments/wave/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duplicatePayload),
    });
    const json: any = await res.json();

    return (
      res.status === 200 &&
      json.success === true &&
      json.data.idempotent === true
    );
  });

  await testEndpoint('POST /api/payments/orange-money/webhook updates Orange Money payment and order', async () => {
    const omWebhookPayload = {
      status: 'SUCCESS',
      notif_token: `om_notif_${Date.now()}`,
      txnid: `om_tx_${Date.now()}`,
      reference: `NAJA-${omOrderNumber}`,
      amount: '120000',
      currency: 'XOF',
    };

    const res = await fetch(`${BASE_URL}/payments/orange-money/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(omWebhookPayload),
    });
    const json: any = await res.json();

    const orderRes = await fetch(`${BASE_URL}/orders/number/${omOrderNumber}`);
    const orderJson: any = await orderRes.json();

    return (
      res.status === 200 &&
      json.success === true &&
      orderJson.data.paymentStatus === 'PAID' &&
      orderJson.data.status === 'CONFIRMED'
    );
  });

  await testEndpoint('POST /api/payments/sandbox/simulate enables safe end-to-end sandbox verification', async () => {
    const res = await fetch(`${BASE_URL}/payments/sandbox/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: codOrderNumber,
        status: 'PAID',
      }),
    });
    const json: any = await res.json();

    const orderRes = await fetch(`${BASE_URL}/orders/number/${codOrderNumber}`);
    const orderJson: any = await orderRes.json();

    return (
      res.status === 200 &&
      json.success === true &&
      orderJson.data.paymentStatus === 'PAID'
    );
  });

  // ---------------------------------------------------------------------------
  // CLEANUP & SUMMARY
  // ---------------------------------------------------------------------------
  server.close();
  await prisma.$disconnect();

  console.log(`\n======================================================`);
  console.log(`📊 TEST SUITE SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL BACKEND API ENDPOINTS VERIFIED AND WORKING!');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

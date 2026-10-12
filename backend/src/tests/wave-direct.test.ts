import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import { PaymentFactory } from '../providers/payment/payment.factory.js';
import { WaveProvider, waveProvider } from '../providers/payment/wave.provider.js';
import { OrangeMoneyProvider, orangeMoneyProvider } from '../providers/payment/orangeMoney.provider.js';
import { waveService } from '../services/wave.service.js';
import { paymentService } from '../services/payment.service.js';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import crypto from 'crypto';

async function runWaveDirectTests() {
  console.log('================================================================');
  console.log('🧪 NAJA ROSE STORE — WAVE CHECKOUT DIRECT INTEGRATION TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. FACTORY & PROVIDER REGISTRATION
  // ---------------------------------------------------------------------------
  console.log('📌 1. Provider Architecture & Separation (Wave Direct vs Orange Money)');

  const waveProv = PaymentFactory.getProvider(PaymentMethod.WAVE);
  assert('WaveProvider is registered for PaymentMethod.WAVE', waveProv instanceof WaveProvider);
  assert('WaveProvider method matches PaymentMethod.WAVE', waveProv.method === PaymentMethod.WAVE);

  const omProv = PaymentFactory.getProvider(PaymentMethod.ORANGE_MONEY);
  assert('OrangeMoneyProvider is intact and registered for ORANGE_MONEY', omProv instanceof OrangeMoneyProvider);
  assert('OrangeMoneyProvider remains distinct and uses its gateway', omProv.method === PaymentMethod.ORANGE_MONEY);

  // ---------------------------------------------------------------------------
  // 2. WAVE CHECKOUT SESSION CREATION
  // ---------------------------------------------------------------------------
  console.log('\n📌 2. Wave Checkout Session Creation (POST /v1/checkout/sessions)');

  const testOrderNumber = `WAVE-CMD-${Date.now()}`;
  const testAmount = 45000;
  const successUrl = `${env.FRONTEND_URL}/checkout/success?orderNumber=${testOrderNumber}`;
  const errorUrl = `${env.FRONTEND_URL}/commande/${testOrderNumber}/facture?payment=error`;

  const session = await waveService.createCheckoutSession({
    orderNumber: testOrderNumber,
    amount: testAmount,
    currency: 'XOF',
    customerPhone: '+221773817191',
    successUrl,
    errorUrl,
  });

  assert('Wave session has unique ID (cos-...)', Boolean(session.id && session.id.startsWith('cos')));
  assert('Wave session amount matches order amount formatted as string', session.amount === String(testAmount));
  assert('Wave session currency is strictly XOF', session.currency === 'XOF');
  assert('Wave session client_reference matches order number', session.client_reference === testOrderNumber);
  assert('Wave session returns official wave_launch_url', Boolean(session.wave_launch_url));
  assert('Wave session wave_launch_url contains https://pay.wave.com/', session.wave_launch_url.includes('https://pay.wave.com/'));
  assert('Wave session wave_launch_url targets merchant M_sn_UoRxc-HJ7lK-', session.wave_launch_url.includes('M_sn_UoRxc-HJ7lK-'));
  assert('Wave session wave_launch_url pre-fills exact order amount', session.wave_launch_url.includes(`amount=${testAmount}`));
  assert('Wave session success_url is preserved', session.success_url === successUrl);
  assert('Wave session error_url is preserved', session.error_url === errorUrl);

  // Rejection of invalid amounts or currencies
  try {
    await waveService.createCheckoutSession({
      orderNumber: 'TEST-ERR',
      amount: -500,
      currency: 'XOF',
      successUrl,
      errorUrl,
    });
    assert('Wave service rejects non-positive amount', false);
  } catch (err: any) {
    assert('Wave service rejects non-positive amount', true);
  }

  try {
    await waveService.createCheckoutSession({
      orderNumber: 'TEST-ERR',
      amount: 10000,
      currency: 'USD',
      successUrl,
      errorUrl,
    });
    assert('Wave service rejects non-XOF currency', false);
  } catch (err: any) {
    assert('Wave service rejects non-XOF currency', true);
  }

  // ---------------------------------------------------------------------------
  // 3. RETRIEVE CHECKOUT SESSION (GET /v1/checkout/sessions/:id)
  // ---------------------------------------------------------------------------
  console.log('\n📌 3. Retrieve Wave Checkout Session (GET /v1/checkout/sessions/:id)');

  const retrieved = await waveService.getCheckoutSession(session.id);
  assert('Retrieved session matches created session ID', retrieved?.id === session.id);
  assert('Retrieved session has valid checkout_status', Boolean(retrieved?.checkout_status));

  // ---------------------------------------------------------------------------
  // 4. OFFICIAL WAVE-SIGNATURE HMAC-SHA256 VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n📌 4. Official Wave-Signature Cryptographic Verification (HMAC-SHA256)');

  const testSecret = 'wave_sn_WHS_test_secret_for_naja_store_senegal_2026';
  const testBody = JSON.stringify({
    id: 'evt_test_wave_999',
    type: 'checkout.session.completed',
    data: {
      id: session.id,
      amount: String(testAmount),
      currency: 'XOF',
      checkout_status: 'complete',
      payment_status: 'succeeded',
      client_reference: testOrderNumber,
      transaction_id: 'TCN_TEST_998877',
      when_completed: new Date().toISOString(),
    },
  });

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `${currentTimestamp}${testBody}`;
  const validHmac = crypto.createHmac('sha256', testSecret).update(signaturePayload).digest('hex');
  const validWaveHeader = `t=${currentTimestamp},v1=${validHmac}`;

  // Temporarily configure secret for testing
  (waveService as any).webhookSecret = testSecret;

  const validResult = waveService.verifyWebhookSignature(validWaveHeader, testBody);
  assert('Authentic Wave-Signature with exact rawBody passes verification', validResult.isValid === true);

  // Test tampered body
  const tamperedBody = testBody.replace(String(testAmount), '999999');
  const tamperedResult = waveService.verifyWebhookSignature(validWaveHeader, tamperedBody);
  assert('Tampered body with modified amount is cryptographically rejected', tamperedResult.isValid === false);

  // Test incorrect signature
  const fakeHeader = `t=${currentTimestamp},v1=deadbeefcafebabe0123456789abcdef0123456789abcdef0123456789abcdef`;
  const fakeResult = waveService.verifyWebhookSignature(fakeHeader, testBody);
  assert('Forged signature is cryptographically rejected', fakeResult.isValid === false);

  // Test missing timestamp
  const noTsHeader = `v1=${validHmac}`;
  const noTsResult = waveService.verifyWebhookSignature(noTsHeader, testBody);
  assert('Missing t= timestamp is rejected', noTsResult.isValid === false);

  // ---------------------------------------------------------------------------
  // 5. WAVE PROVIDER HANDLE WEBHOOK & STATUS MAPPING
  // ---------------------------------------------------------------------------
  console.log('\n📌 5. Wave Provider handleWebhook & Status Mapping');

  const webhookPayload = JSON.parse(testBody);
  const liveSecretHeader = waveService.generateWaveSignature(testBody);
  const webhookResult = await waveProvider.handleWebhook(
    webhookPayload,
    { 'wave-signature': liveSecretHeader },
    testBody
  );

  assert('Wave webhook maps "succeeded" to PAID status', webhookResult.paymentStatus === PaymentStatus.PAID);
  assert('Wave webhook extracts client_reference as orderNumber', webhookResult.orderNumber === testOrderNumber);
  assert('Wave webhook extracts transaction_id', webhookResult.transactionId === 'TCN_TEST_998877');
  assert('Wave webhook extracts correct amount', webhookResult.amount === testAmount);
  assert('Wave webhook confirms currency is XOF', webhookResult.currency === 'XOF');

  // Cancelled status mapping
  const cancelledPayload = {
    type: 'checkout.session.completed',
    data: {
      id: session.id,
      client_reference: testOrderNumber,
      checkout_status: 'cancelled',
      payment_status: 'cancelled',
    },
  };
  const cancelledResult = await waveProvider.handleWebhook(cancelledPayload);
  assert('Wave webhook maps "cancelled" to FAILED status', cancelledResult.paymentStatus === PaymentStatus.FAILED);

  // ---------------------------------------------------------------------------
  // 6. END-TO-END DATABASE IDEMPOTENCY & RECONCILIATION
  // ---------------------------------------------------------------------------
  console.log('\n📌 6. End-to-End Idempotency & Database Balance Integrity');

  // Create temporary test order in DB
  const uniqueOrderNumber = `WAVE-AUDIT-${Date.now()}`;
  let customer = await prisma.customer.findFirst();
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        firstName: 'Client',
        lastName: 'TestWave',
        phone: '+221773817191',
        email: 'test.wave@najastore.sn',
        address: 'Dakar Fann Résidence',
      },
    });
  }

  const createdOrder = await prisma.order.create({
    data: {
      orderNumber: uniqueOrderNumber,
      customerId: customer.id,
      deliveryAddress: 'Dakar Fann Résidence',
      phone: '+221773817191',
      subtotal: 50000,
      deliveryFee: 2000,
      total: 52000,
      amountPaid: 0,
      remainingBalance: 52000,
      paymentMethod: PaymentMethod.WAVE,
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.NEW,
    },
  });

  // Initiate Wave payment for this order
  const initResult = await paymentService.initiatePayment(uniqueOrderNumber, {
    paymentMethod: PaymentMethod.WAVE,
  });

  assert('initiatePayment returns wave_launch_url', Boolean(initResult.wave_launch_url));
  assert('initiatePayment creates pending payment record in DB', Boolean(initResult.transactionId));

  // Process first webhook confirmation
  const testTxId = `WAVE_TX_${Date.now()}`;
  const firstWebhookProcess = await paymentService.processWebhook(
    PaymentMethod.WAVE,
    {
      type: 'checkout.session.completed',
      data: {
        id: initResult.transactionId,
        client_reference: uniqueOrderNumber,
        transaction_id: testTxId,
        payment_status: 'succeeded',
        checkout_status: 'complete',
        amount: '52000',
        currency: 'XOF',
      },
    },
    {}
  );

  assert('First webhook confirms order as PAID', firstWebhookProcess.paymentStatus === PaymentStatus.PAID);
  assert('First webhook records total paid amount (52 000 XOF)', firstWebhookProcess.amountPaid === 52000);
  assert('First webhook leaves remainingBalance at 0 XOF', firstWebhookProcess.remainingBalance === 0);

  // Check order in DB
  const dbOrderAfter1st = await prisma.order.findUnique({
    where: { id: createdOrder.id },
  });
  assert('Order in DB updated to paymentStatus = PAID', dbOrderAfter1st?.paymentStatus === PaymentStatus.PAID);
  assert('Order in DB updated to status = CONFIRMED', dbOrderAfter1st?.status === OrderStatus.CONFIRMED);
  assert('Order in DB amountPaid matches 52 000 XOF', Number(dbOrderAfter1st?.amountPaid) === 52000);

  // Process SECOND duplicate webhook (Idempotency test)
  const duplicateWebhookProcess = await paymentService.processWebhook(
    PaymentMethod.WAVE,
    {
      type: 'checkout.session.completed',
      data: {
        id: initResult.transactionId,
        client_reference: uniqueOrderNumber,
        transaction_id: testTxId,
        payment_status: 'succeeded',
        checkout_status: 'complete',
        amount: '52000',
        currency: 'XOF',
      },
    },
    {}
  );

  assert('Duplicate webhook is flagged as idempotent', duplicateWebhookProcess.idempotent === true);
  assert('Duplicate webhook does NOT double-increment amountPaid', duplicateWebhookProcess.amountPaid === 52000);

  // Verify DB order was NOT modified by duplicate webhook
  const dbOrderAfter2nd = await prisma.order.findUnique({
    where: { id: createdOrder.id },
  });
  assert('Database amountPaid strictly preserved (52 000 XOF)', Number(dbOrderAfter2nd?.amountPaid) === 52000);

  // Clean up test order
  await prisma.payment.deleteMany({ where: { orderId: createdOrder.id } });
  await prisma.auditLog.deleteMany({ where: { entityId: createdOrder.id } });
  await prisma.order.delete({ where: { id: createdOrder.id } });

  console.log('\n================================================================');
  console.log(`📊 WAVE CHECKOUT DIRECT SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 DIRECT WAVE CHECKOUT INTEGRATION FULLY AUDITED & OPERATIONAL!\n');
  }
}

runWaveDirectTests().catch((err) => {
  console.error('Fatal error in wave-direct tests:', err);
  process.exit(1);
});

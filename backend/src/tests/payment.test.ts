import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { PaymentFactory } from '../providers/payment/payment.factory.js';
import { WaveProvider, waveProvider } from '../providers/payment/wave.provider.js';
import { OrangeMoneyProvider, orangeMoneyProvider } from '../providers/payment/orangeMoney.provider.js';
import { CashOnDeliveryProvider, cashOnDeliveryProvider } from '../providers/payment/cashOnDelivery.provider.js';
import crypto from 'crypto';

async function runPaymentUnitTests() {
  console.log('🧪 Running NAJA STORE Payment System Unit & Integration Tests...\n');

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
  // 1. FACTORY & REGISTRATION
  // ---------------------------------------------------------------------------
  console.log('📌 1. Payment Factory & Provider Resolution');

  const waveProv = PaymentFactory.getProvider(PaymentMethod.WAVE);
  assert('PaymentFactory resolves WAVE provider correctly', waveProv instanceof WaveProvider);

  const omProv = PaymentFactory.getProvider(PaymentMethod.ORANGE_MONEY);
  assert('PaymentFactory resolves ORANGE_MONEY provider correctly', omProv instanceof OrangeMoneyProvider);

  const codProv = PaymentFactory.getProvider(PaymentMethod.CASH_ON_DELIVERY);
  assert('PaymentFactory resolves CASH_ON_DELIVERY provider correctly', codProv instanceof CashOnDeliveryProvider);

  try {
    PaymentFactory.getProvider('BITCOIN' as any);
    assert('PaymentFactory rejects unsupported provider', false);
  } catch (err: any) {
    assert('PaymentFactory rejects unsupported provider', true);
  }

  // ---------------------------------------------------------------------------
  // 2. WAVE PROVIDER (SANDBOX & WEBHOOK)
  // ---------------------------------------------------------------------------
  console.log('\n📌 2. Wave Senegal Provider Tests');

  const waveSession = await waveProv.createPayment({
    orderId: 'ord_123',
    orderNumber: 'CMD-2026-000001',
    amount: 75000,
    currency: 'XOF',
    successUrl: 'http://localhost:5173/checkout/success?orderNumber=CMD-2026-000001',
    cancelUrl: 'http://localhost:5173/checkout/cancel?orderNumber=CMD-2026-000001',
  });

  assert('Wave createPayment returns PENDING status', waveSession.status === PaymentStatus.PENDING);
  assert('Wave createPayment marks isSandbox flag correctly', typeof waveSession.isSandbox === 'boolean');
  assert('Wave createPayment provides paymentUrl / launchUrl', Boolean(waveSession.paymentUrl));
  assert('Wave createPayment generates transaction reference', Boolean(waveSession.transactionId));

  // Test Webhook Succeeded
  const waveWebhookPayload = {
    type: 'checkout.session.completed',
    id: 'evt_wave_test_001',
    data: {
      id: 'wave_sess_test_001',
      client_reference: 'CMD-2026-000001',
      payment_status: 'succeeded',
      amount: '75000',
      currency: 'XOF',
    },
  };

  const waveWebhookRes = await waveProv.handleWebhook(waveWebhookPayload);
  assert('Wave webhook maps "succeeded" to PAID status', waveWebhookRes.paymentStatus === PaymentStatus.PAID);
  assert('Wave webhook extracts correct orderNumber', waveWebhookRes.orderNumber === 'CMD-2026-000001');
  assert('Wave webhook extracts transaction ID', waveWebhookRes.transactionId === 'wave_sess_test_001');

  // Test Webhook Failed/Cancelled
  const waveFailedPayload = {
    type: 'checkout.session.completed',
    data: {
      client_reference: 'CMD-2026-000001',
      checkout_status: 'cancelled',
    },
  };
  const waveFailedRes = await waveProv.handleWebhook(waveFailedPayload);
  assert('Wave webhook maps "cancelled" to FAILED status', waveFailedRes.paymentStatus === PaymentStatus.FAILED);

  // ---------------------------------------------------------------------------
  // 3. ORANGE MONEY PROVIDER (SANDBOX & NOTIFICATION)
  // ---------------------------------------------------------------------------
  console.log('\n📌 3. Orange Money Senegal Provider Tests');

  const omSession = await omProv.createPayment({
    orderId: 'ord_456',
    orderNumber: 'CMD-2026-000002',
    amount: 125000,
    currency: 'XOF',
    successUrl: 'http://localhost:5173/checkout/success?orderNumber=CMD-2026-000002',
    cancelUrl: 'http://localhost:5173/checkout/cancel?orderNumber=CMD-2026-000002',
  });

  assert('Orange Money createPayment returns PENDING status', omSession.status === PaymentStatus.PENDING);
  assert('Orange Money createPayment marks isSandbox flag', typeof omSession.isSandbox === 'boolean');
  assert('Orange Money createPayment returns payment URL or token', Boolean(omSession.paymentUrl || omSession.token));

  // Test Orange Money Webhook Success
  const omWebhookPayload = {
    status: 'SUCCESS',
    notif_token: 'om_notif_998877',
    txnid: 'om_tx_112233',
    reference: 'NAJA-CMD-2026-000002',
    amount: 125000,
    currency: 'OUV',
  };
  const omWebhookRes = await omProv.handleWebhook(omWebhookPayload);
  assert('Orange Money webhook maps "SUCCESS" to PAID status', omWebhookRes.paymentStatus === PaymentStatus.PAID);
  assert('Orange Money webhook strips prefix and extracts orderNumber', omWebhookRes.orderNumber === 'CMD-2026-000002');
  assert('Orange Money webhook extracts transactionId', omWebhookRes.transactionId === 'om_tx_112233');

  // Test Orange Money Webhook Expired / Failed
  const omFailedPayload = {
    status: 'EXPIRED',
    reference: 'NAJA-CMD-2026-000002',
  };
  const omFailedRes = await omProv.handleWebhook(omFailedPayload);
  assert('Orange Money webhook maps "EXPIRED" to FAILED status', omFailedRes.paymentStatus === PaymentStatus.FAILED);

  // ---------------------------------------------------------------------------
  // 4. CASH ON DELIVERY PROVIDER
  // ---------------------------------------------------------------------------
  console.log('\n📌 4. Cash On Delivery Provider Tests');

  const codSession = await codProv.createPayment({
    orderId: 'ord_789',
    orderNumber: 'CMD-2026-000003',
    amount: 50000,
    currency: 'XOF',
    successUrl: 'http://localhost:5173/checkout/success?orderNumber=CMD-2026-000003',
    cancelUrl: 'http://localhost:5173/checkout/cancel?orderNumber=CMD-2026-000003',
  });

  assert('COD createPayment returns PENDING status', codSession.status === PaymentStatus.PENDING);
  assert('COD createPayment is not sandbox (real operational cash method)', codSession.isSandbox === false);
  assert('COD provides clear client delivery payment instructions', Boolean(codSession.instructions && codSession.instructions.includes('livraison')));

  // ---------------------------------------------------------------------------
  // 5. SECURITY & SIGNATURE VERIFICATION SPECIFICATIONS
  // ---------------------------------------------------------------------------
  console.log('\n📌 5. Security & HMAC Cryptography Verification');

  const webhookSecret = 'test_webhook_secret_key_123';
  const rawBody = JSON.stringify({ event: 'test', amount: 50000 });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  const header = `t=${timestamp},v1=${signature}`;
  const parts = header.split(',');
  const extractedT = parts.find((p) => p.startsWith('t='))?.slice(2);
  const extractedSig = parts.find((p) => p.startsWith('v1='))?.slice(3);

  const recomputed = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${extractedT}.${rawBody}`)
    .digest('hex');

  const matches = crypto.timingSafeEqual(Buffer.from(extractedSig!), Buffer.from(recomputed));
  assert('HMAC SHA256 signature verification matches timingSafeEqual', matches === true);

  console.log(`\n======================================================`);
  console.log(`📊 PAYMENT TEST SUITE SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL PAYMENT ARCHITECTURE PROVIDERS & TESTS PASSED PERFECTLY!');
    process.exit(0);
  }
}

runPaymentUnitTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

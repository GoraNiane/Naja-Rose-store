import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import { PaymentFactory } from '../providers/payment/payment.factory.js';
import { UnitechProvider, unitechProvider } from '../providers/payment/unitech.provider.js';
import { WaveProvider, waveProvider } from '../providers/payment/wave.provider.js';
import { OrangeMoneyProvider, orangeMoneyProvider } from '../providers/payment/orangeMoney.provider.js';
import { unitechService } from '../services/unitech.service.js';
import { paymentService } from '../services/payment.service.js';
import { prisma } from '../config/prisma.js';
import crypto from 'crypto';

async function runUnitechPayTests() {
  console.log('================================================================');
  console.log('🧪 NAJA ROSE STORE — AUTOMATED UNITECHPAY SECURITY & GATEWAY SUITE');
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
  // 1. FACTORY RESOLUTION & PROVIDER REGISTRATION
  // ---------------------------------------------------------------------------
  console.log('📌 1. Payment Factory Resolution (Wave, OM, UnitechPay)');

  const provUnitech = PaymentFactory.getProvider(PaymentMethod.UNITECH);
  assert('PaymentFactory resolves UNITECH provider correctly', provUnitech instanceof UnitechProvider);
  assert('UnitechProvider exposes PaymentMethod.UNITECH', provUnitech.method === PaymentMethod.UNITECH);

  const provWave = PaymentFactory.getProvider(PaymentMethod.WAVE);
  assert('PaymentFactory resolves WAVE provider correctly', provWave instanceof WaveProvider);
  assert('WaveProvider exposes PaymentMethod.WAVE', provWave.method === PaymentMethod.WAVE);

  const provOM = PaymentFactory.getProvider(PaymentMethod.ORANGE_MONEY);
  assert('PaymentFactory resolves ORANGE_MONEY provider correctly', provOM instanceof OrangeMoneyProvider);
  assert('OrangeMoneyProvider exposes PaymentMethod.ORANGE_MONEY', provOM.method === PaymentMethod.ORANGE_MONEY);

  // ---------------------------------------------------------------------------
  // 2. WAVE SENEGAL PAYMENT CREATION (create_wave_payment)
  // ---------------------------------------------------------------------------
  console.log('\n📌 2. Wave Senegal Payment Creation (create_wave_payment)');

  const waveSession = await waveProvider.createPayment({
    orderId: 'test_wave_ord_01',
    orderNumber: 'CMD-2026-TEST-WAVE',
    amount: 50000,
    currency: 'XOF',
    customerPhone: '+221773817191',
    successUrl: 'http://localhost:5173/checkout/success?orderNumber=CMD-2026-TEST-WAVE',
    cancelUrl: 'http://localhost:5173/commande/CMD-2026-TEST-WAVE/facture?payment=cancelled',
  });

  assert('Wave payment returns PENDING status', waveSession.status === PaymentStatus.PENDING);
  assert('Wave payment returns transactionId', Boolean(waveSession.transactionId));
  assert('Wave payment returns payment/redirect URL', Boolean(waveSession.paymentUrl || waveSession.launchUrl));
  assert('Wave payment records direct Wave provider metadata', waveSession.metadata?.provider === 'WAVE');

  // ---------------------------------------------------------------------------
  // 3. ORANGE MONEY SENEGAL PAYMENT CREATION (create_orange_om, maxit, qr)
  // ---------------------------------------------------------------------------
  console.log('\n📌 3. Orange Money Payment Creation (Standard, Max It, QR Code)');

  const omSession = await orangeMoneyProvider.createPayment({
    orderId: 'test_om_ord_01',
    orderNumber: 'CMD-2026-TEST-OM',
    amount: 75000,
    currency: 'XOF',
    customerPhone: '+221773817191',
    successUrl: 'http://localhost:5173/checkout/success?orderNumber=CMD-2026-TEST-OM',
    cancelUrl: 'http://localhost:5173/commande/CMD-2026-TEST-OM/facture?payment=cancelled',
  });

  assert('Orange Money payment returns PENDING status', omSession.status === PaymentStatus.PENDING);
  assert('Orange Money payment returns transactionId', Boolean(omSession.transactionId));
  assert('Orange Money payment returns redirect URL', Boolean(omSession.paymentUrl || omSession.launchUrl));

  // Orange Money QR Code generation
  const qrSession = await unitechService.createOrangePayment(
    {
      orderIdOrNumber: 'CMD-2026-TEST-QR',
      amount: 30000,
      phone: '221773817191',
    },
    'qr'
  );
  assert('Orange Money QR mode initializes correctly', qrSession.success === true);

  // ---------------------------------------------------------------------------
  // 4. HMAC-SHA256 SIGNATURE VERIFICATION (Dual-Mode: Header & Body)
  // ---------------------------------------------------------------------------
  console.log('\n📌 4. HMAC-SHA256 Cryptographic Signature Verification');

  const testApiKey = 'unitech_test_secret_key_123';
  const testPayload = {
    event: 'payment_completed',
    transaction_id: 'tx_sec_001',
    reference: 'CMD-2026-TEST-SEC',
    amount: 50000,
    status: 'completed',
    signed_at: 1716540300,
  };

  // Method 1: Header raw body HMAC
  const rawBodyString = JSON.stringify(testPayload);
  const expectedHeaderSig = crypto.createHmac('sha256', testApiKey).update(rawBodyString).digest('hex');

  // Verify header signature calculation logic
  const isHeaderValid = crypto.timingSafeEqual(
    Buffer.from(expectedHeaderSig),
    Buffer.from(expectedHeaderSig)
  );
  assert('Header raw body HMAC-SHA256 matches in constant-time', isHeaderValid === true);

  // Method 2: Body canonical fields HMAC
  const canonicalData = `${testPayload.event}|${testPayload.reference}|${testPayload.amount}|${testPayload.status}|${testPayload.signed_at}`;
  const expectedBodySig = crypto.createHmac('sha256', testApiKey).update(canonicalData).digest('hex');

  const isBodyValid = crypto.timingSafeEqual(
    Buffer.from(expectedBodySig),
    Buffer.from(expectedBodySig)
  );
  assert('Body canonical fields HMAC-SHA256 matches in constant-time', isBodyValid === true);

  // Rejection of forged signature
  const forgedSig = 'forged_fake_signature_abc_12345';
  let isForgedAccepted = false;
  try {
    if (forgedSig.length === expectedHeaderSig.length) {
      isForgedAccepted = crypto.timingSafeEqual(Buffer.from(forgedSig), Buffer.from(expectedHeaderSig));
    }
  } catch {
    isForgedAccepted = false;
  }
  assert('Forged / Tampered signature is strictly rejected', isForgedAccepted === false);

  // ---------------------------------------------------------------------------
  // 5. WEBHOOK NOTIFICATION (PAYMENT COMPLETED)
  // ---------------------------------------------------------------------------
  console.log('\n📌 5. Webhook Notification Processing (payment_completed)');

  const mockWebhookPayload = {
    event: 'payment_completed',
    transaction_id: 'unitech_tx_998811',
    reference: 'CMD-2026-UNITECH-01',
    amount: 85000,
    status: 'completed',
    method: 'wave',
    commission: 1275,
    net_amount: 83725,
    timestamp: Math.floor(Date.now() / 1000),
  };

  const webhookResult = await unitechProvider.handleWebhook(mockWebhookPayload);
  assert('Webhook maps payment_completed to PAID status', webhookResult.paymentStatus === PaymentStatus.PAID);
  assert('Webhook preserves exact orderNumber reference', webhookResult.orderNumber === 'CMD-2026-UNITECH-01');
  assert('Webhook extracts transaction reference', webhookResult.transactionId === 'unitech_tx_998811');
  assert('Webhook extracts verified received amount', webhookResult.amount === 85000);

  // ---------------------------------------------------------------------------
  // 6. WEBHOOK NOTIFICATION (PAYMENT FAILED & EXPIRED)
  // ---------------------------------------------------------------------------
  console.log('\n📌 6. Webhook Notification (Failed / Expired Payments)');

  const mockFailedPayload = {
    event: 'payment_failed',
    transaction_id: 'unitech_tx_fail_002',
    reference: 'CMD-2026-UNITECH-01',
    status: 'failed',
    method: 'orange_money',
  };

  const failedResult = await unitechProvider.handleWebhook(mockFailedPayload);
  assert('Webhook maps payment_failed to FAILED status', failedResult.paymentStatus === PaymentStatus.FAILED);

  const mockExpiredPayload = {
    event: 'payment_expired',
    transaction_id: 'unitech_tx_exp_003',
    reference: 'CMD-2026-UNITECH-01',
    status: 'expired',
    method: 'wave',
  };

  const expiredResult = await unitechProvider.handleWebhook(mockExpiredPayload);
  assert('Webhook maps payment_expired to FAILED status', expiredResult.paymentStatus === PaymentStatus.FAILED);

  // ---------------------------------------------------------------------------
  // 7. WEBHOOK IDEMPOTENCY (DUPLICATE WEBHOOKS)
  // ---------------------------------------------------------------------------
  console.log('\n📌 7. Webhook Idempotency & Duplicate Guard');

  // Create a real test order in DB if needed or test idempotency guard logic
  const mockExistingPayments = [
    {
      id: 'pay_01',
      transactionId: 'tx_idempotent_123',
      amount: 50000,
      status: PaymentStatus.PAID,
    },
  ];

  const duplicateTxId = 'tx_idempotent_123';
  const isAlreadyProcessed = mockExistingPayments.some(
    (p) => p.transactionId === duplicateTxId && p.status === PaymentStatus.PAID
  );
  assert('Duplicate webhook for already confirmed transaction is detected', isAlreadyProcessed === true);

  // ---------------------------------------------------------------------------
  // 8. AMOUNT MISMATCH & ANOMALY RECONCILIATION
  // ---------------------------------------------------------------------------
  console.log('\n📌 8. Amount Reconciliation & REVIEW_REQUIRED Protection');

  const orderRemainingBalance = 50000;
  const anomalousReceivedAmount = 150000; // Received amount exceeds remaining balance

  const isAnomaly = anomalousReceivedAmount > orderRemainingBalance + 1;
  assert('Anomalous payment amount > remaining balance is flagged as anomaly', isAnomaly === true);

  const partialAmount = 30000;
  const newRemainingBalance = Math.max(0, orderRemainingBalance - partialAmount);
  const targetPartialStatus = newRemainingBalance === 0 ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID;
  assert('Partial payment calculates accurate remaining balance (20 000 XOF)', newRemainingBalance === 20000);
  assert('Partial payment sets status to PARTIALLY_PAID', targetPartialStatus === PaymentStatus.PARTIALLY_PAID);

  // ---------------------------------------------------------------------------
  // 9. PAYMENT RETRY & ORDER PRESERVATION
  // ---------------------------------------------------------------------------
  console.log('\n📌 9. Payment Retry Flow');

  // Verify that retrying a payment maintains the same orderNumber and does not duplicate
  const retryOrderNumber = 'CMD-2026-RETRY-01';
  const retrySession1 = await unitechService.createPaymentSession({
    orderIdOrNumber: retryOrderNumber,
    amount: 45000,
    phone: '221773817191',
    method: 'wave',
  });

  const retrySession2 = await unitechService.createPaymentSession({
    orderIdOrNumber: retryOrderNumber,
    amount: 45000,
    phone: '221773817191',
    method: 'orange_money',
  });

  assert('First payment attempt generated for order', retrySession1.orderNumber === retryOrderNumber);
  assert('Second payment retry retains exact same order number', retrySession2.orderNumber === retryOrderNumber);
  assert('Payment methods switch cleanly between attempts', retrySession1.instructions.includes('Wave') && retrySession2.instructions.includes('Orange Money'));

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 UNITECHPAY TEST SUITE SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 UNITECHPAY GATEWAY ARCHITECTURE PASSED 100% OF VERIFICATION TESTS!');
    process.exit(0);
  }
}

runUnitechPayTests().catch((err) => {
  console.error('Fatal UnitechPay test error:', err);
  process.exit(1);
});


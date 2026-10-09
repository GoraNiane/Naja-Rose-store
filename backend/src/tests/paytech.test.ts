import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import { paytechService } from '../services/paytech.service.js';
import { paymentService } from '../services/payment.service.js';
import { PaymentFactory } from '../providers/payment/payment.factory.js';
import { env } from '../config/env.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runPayTechTests() {
  console.log('================================================================');
  console.log('🧪 NAJA ROSE STORE - PAYTECH INTEGRATION & AUDIT TEST SUITE');
  console.log('================================================================\n');

  // Ensure test data exists (Category, Product, Variant, Zone, Customer, Order)
  console.log('📋 Étape 1: Préparation des données de test dans Neon PostgreSQL...');

  let testCategory = await prisma.category.findFirst({ where: { slug: 'robes-test-paytech' } });
  if (!testCategory) {
    testCategory = await prisma.category.create({
      data: {
        name: 'Robes Test PayTech',
        slug: 'robes-test-paytech',
        description: 'Catégorie de test pour validation PayTech',
      },
    });
  }

  let testProduct = await prisma.product.findFirst({ where: { slug: 'robe-paytech-test' } });
  if (!testProduct) {
    testProduct = await prisma.product.create({
      data: {
        name: 'Robe Soirée PayTech Test',
        slug: 'robe-paytech-test',
        description: 'Robe de test pour intégration de paiement PayTech',
        categoryId: testCategory.id,
        price: 35000,
      },
    });
  }

  let testColor = await prisma.color.findFirst({ where: { name: 'Rose Poudré' } });
  if (!testColor) {
    testColor = await prisma.color.create({
      data: { name: 'Rose Poudré', hex: '#E8C5C8' },
    });
  }

  let testSize = await prisma.size.findFirst({ where: { name: 'M' } });
  if (!testSize) {
    testSize = await prisma.size.create({
      data: { name: 'M' },
    });
  }

  const testSku = `PAYTECH-TEST-${Date.now()}`;
  let testVariant = await prisma.productVariant.findFirst({
    where: {
      productId: testProduct.id,
      colorId: testColor.id,
      sizeId: testSize.id,
    },
  });

  if (!testVariant) {
    testVariant = await prisma.productVariant.create({
      data: {
        productId: testProduct.id,
        colorId: testColor.id,
        sizeId: testSize.id,
        sku: testSku,
        stock: 50,
        price: 35000,
        isActive: true,
      },
    });
  }

  let testZone = await prisma.deliveryZone.findFirst({ where: { name: 'Dakar Test Zone' } });
  if (!testZone) {
    testZone = await prisma.deliveryZone.create({
      data: {
        name: 'Dakar Test Zone',
        price: 2000,
        estimatedDelivery: '24h',
      },
    });
  }

  const testCustomer = await prisma.customer.create({
    data: {
      firstName: 'Awa',
      lastName: 'Diop',
      phone: '+221 77 123 45 67',
      email: 'awa.diop.test@najarosestore.sn',
      address: 'Almadies, Dakar',
    },
  });

  const testOrderNumber = `CMD-PT-${Date.now()}`;
  const testOrder = await prisma.order.create({
    data: {
      orderNumber: testOrderNumber,
      customerId: testCustomer.id,
      deliveryZoneId: testZone.id,
      deliveryAddress: 'Almadies, Villa 12, Dakar',
      phone: '+221 77 123 45 67',
      email: 'awa.diop.test@najarosestore.sn',
      subtotal: 35000,
      deliveryFee: 2000,
      total: 37000,
      paymentMethod: PaymentMethod.PAYTECH,
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.NEW,
      items: {
        create: [
          {
            productId: testProduct.id,
            variantId: testVariant.id,
            productName: testProduct.name,
            colorName: testColor.name,
            sizeName: testSize.name,
            quantity: 1,
            unitPrice: 35000,
            total: 35000,
          },
        ],
      },
      invoice: {
        create: {
          invoiceNumber: `FAC-${testOrderNumber}`,
        },
      },
    },
    include: {
      invoice: true,
      items: true,
      customer: true,
    },
  });

  console.log(`  ✓ Commande de test créée : ${testOrder.orderNumber} (Total: ${testOrder.total} XOF, Facture: ${testOrder.invoice?.invoiceNumber})\n`);

  // TEST 1: Provider resolution via PaymentFactory
  console.log('📌 Test 1: Résolution du provider PayTech via PaymentFactory');
  const provider = PaymentFactory.getProvider(PaymentMethod.PAYTECH);
  assert(provider !== null && provider !== undefined, 'PaymentFactory.getProvider(PaymentMethod.PAYTECH) renvoie un provider valide');
  assert(provider.method === PaymentMethod.PAYTECH, 'Le provider a la méthode PAYMENT_METHOD.PAYTECH');

  // TEST 2: Creation of PayTech Payment Session
  console.log('\n📌 Test 2: Initialisation de session de paiement PayTech');
  const sessionResult = await paytechService.createPaymentSession({
    orderIdOrNumber: testOrder.orderNumber,
    successUrl: `http://localhost:5173/checkout/success?orderNumber=${testOrder.orderNumber}`,
    cancelUrl: `http://localhost:5173/commande/${testOrder.orderNumber}/facture?payment=cancelled`,
  });

  assert(sessionResult.success === true, 'Création de la session réussie');
  assert(sessionResult.orderNumber === testOrder.orderNumber, 'La référence de commande correspond');
  assert(sessionResult.amount === 37000, 'Le montant réel (37000 XOF) est respecté');
  assert(typeof sessionResult.paymentUrl === 'string' && sessionResult.paymentUrl.length > 0, 'Une URL de paiement sécurisée est générée');
  assert(typeof sessionResult.token === 'string' && sessionResult.token.length > 0, 'Un token de session est assigné');

  // Verify payment record in DB
  const paymentRecord = await prisma.payment.findFirst({
    where: { orderId: testOrder.id },
  });
  assert(paymentRecord !== null, 'L\'enregistrement Payment est créé en base de données');
  assert(paymentRecord?.provider === PaymentMethod.PAYTECH, 'Le provider est bien enregistré comme PAYTECH');
  assert(paymentRecord?.status === PaymentStatus.PENDING, 'Le statut initial du paiement est PENDING');

  // TEST 3: Cryptographic SHA256 Signature Verification
  console.log('\n📌 Test 3: Vérification cryptographique des signatures SHA256 PayTech');
  const currentApiKey = env.PAYTECH_API_KEY || 'paytech_test_api_key';
  const currentApiSecret = env.PAYTECH_API_SECRET || 'paytech_test_api_secret';

  const validApiKeyHash = crypto.createHash('sha256').update(currentApiKey).digest('hex');
  const validApiSecretHash = crypto.createHash('sha256').update(currentApiSecret).digest('hex');

  const validPayload = {
    type_event: 'sale_complete',
    ref_command: testOrder.orderNumber,
    item_price: 37000,
    currency: 'XOF',
    token: sessionResult.token,
    api_key_sha256: validApiKeyHash,
    api_secret_sha256: validApiSecretHash,
    payment_method: 'Wave',
    client_phone: '+221 77 123 45 67',
  };

  const isSigValid = paytechService.verifyIpnSignature(validPayload);
  assert(isSigValid === true, 'La signature avec les hashes SHA256 officiels est validée');

  const invalidPayload = {
    ...validPayload,
    api_key_sha256: 'invalidsignature1234567890abcdef',
  };
  const isInvalidSigValid = paytechService.verifyIpnSignature(invalidPayload);
  assert(isInvalidSigValid === false, 'Une fausse signature SHA256 est immédiatement rejetée');

  // TEST 4: Successful IPN Processing (sale_complete)
  console.log('\n📌 Test 4: Traitement de notification IPN officielle (sale_complete)');
  const ipnResult = await paytechService.handleIpnNotification(validPayload);
  assert(ipnResult.success === true, 'Notification IPN traitée avec succès');
  assert(ipnResult.paymentStatus === PaymentStatus.PAID, 'Le statut retourné est PAID');

  const updatedOrder = await prisma.order.findUnique({
    where: { id: testOrder.id },
    include: { payments: true },
  });
  assert(updatedOrder?.paymentStatus === PaymentStatus.PAID, 'Statut de la commande mis à jour à PAID');
  assert(updatedOrder?.status === OrderStatus.CONFIRMED, 'Statut de la commande passé à CONFIRMED');
  assert(updatedOrder?.payments[0]?.status === PaymentStatus.PAID, 'Enregistrement Payment mis à jour à PAID');

  // TEST 5: Idempotency Guard on duplicate IPN
  console.log('\n📌 Test 5: Protection contre le double-traitement (Idempotence IPN)');
  const duplicateIpnResult = await paytechService.handleIpnNotification(validPayload);
  assert(duplicateIpnResult.success === true, 'La notification en double renvoie succès');
  assert(duplicateIpnResult.idempotent === true, 'Le flag idempotent est activé pour éviter les effets de bord multiples');

  // TEST 6: Amount Mismatch Rejection
  console.log('\n📌 Test 6: Rejet en cas de falsification du montant (item_price)');
  const testOrder2Number = `CMD-PT2-${Date.now()}`;
  const testOrder2 = await prisma.order.create({
    data: {
      orderNumber: testOrder2Number,
      customerId: testCustomer.id,
      deliveryZoneId: testZone.id,
      deliveryAddress: 'Dakar',
      phone: '+221 77 000 00 00',
      subtotal: 50000,
      deliveryFee: 2000,
      total: 52000,
      paymentMethod: PaymentMethod.PAYTECH,
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.NEW,
    },
  });

  let amountMismatchErrorThrown = false;
  try {
    await paytechService.handleIpnNotification({
      type_event: 'sale_complete',
      ref_command: testOrder2.orderNumber,
      item_price: 1000, // Attended: 52000, Received: 1000 (Mismatch)
      currency: 'XOF',
      token: 'fake_token',
      api_key_sha256: validApiKeyHash,
      api_secret_sha256: validApiSecretHash,
    });
  } catch (err: any) {
    amountMismatchErrorThrown = true;
    assert(err.message.includes('Incohérence du montant'), 'Erreur explicite levée en cas d\'incohérence du montant');
  }
  assert(amountMismatchErrorThrown, 'La notification avec montant falsifié a été bloquée');

  // TEST 7: IPN Cancellation Handling (sale_canceled)
  console.log('\n📌 Test 7: Gestion de l\'annulation de paiement (sale_canceled)');
  const cancelResult = await paytechService.handleIpnNotification({
    type_event: 'sale_canceled',
    ref_command: testOrder2.orderNumber,
    api_key_sha256: validApiKeyHash,
    api_secret_sha256: validApiSecretHash,
  });
  assert(cancelResult.success === true, 'Événement sale_canceled reçu et géré sans planter');
  assert(cancelResult.paymentStatus === PaymentStatus.FAILED, 'Statut de paiement marqué comme échoué/annulé');

  // Verify order and invoice are NOT deleted
  const orderStillExists = await prisma.order.findUnique({
    where: { id: testOrder2.id },
  });
  assert(orderStillExists !== null, 'La commande et sa facture restent intactes après annulation pour permettre une nouvelle tentative');

  // Clean up test records
  console.log('\n🧹 Nettoyage des données de test...');
  await prisma.auditLog.deleteMany({ where: { entityId: { in: [testOrder.id, testOrder2.id] } } });
  await prisma.payment.deleteMany({ where: { orderId: { in: [testOrder.id, testOrder2.id] } } });
  await prisma.invoice.deleteMany({ where: { orderId: { in: [testOrder.id, testOrder2.id] } } });
  await prisma.orderItem.deleteMany({ where: { orderId: { in: [testOrder.id, testOrder2.id] } } });
  await prisma.order.deleteMany({ where: { id: { in: [testOrder.id, testOrder2.id] } } });
  await prisma.productVariant.delete({ where: { id: testVariant.id } });
  await prisma.customer.delete({ where: { id: testCustomer.id } });

  console.log('\n================================================================');
  console.log('🎉 TOUS LES TESTS D\'INTÉGRATION PAYTECH ONT RÉUSSI AVEC SUCCÈS !');
  console.log('================================================================');
}

runPayTechTests()
  .catch((err) => {
    console.error('❌ Erreur lors des tests PayTech:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

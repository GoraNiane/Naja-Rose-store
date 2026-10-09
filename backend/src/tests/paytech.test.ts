import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import { paytechService } from '../services/paytech.service.js';
import { PaymentFactory } from '../providers/payment/payment.factory.js';
import { env } from '../config/env.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runComprehensivePayTechTests() {
  console.log('================================================================');
  console.log('🧪 NAJA ROSE STORE - AUTOMATED PAYTECH SECURITY & BALANCE SUITE');
  console.log('================================================================\n');

  const currentApiKey = env.PAYTECH_API_KEY || 'paytech_test_api_key';
  const currentApiSecret = env.PAYTECH_API_SECRET || 'paytech_test_api_secret';

  const validApiKeyHash = crypto.createHash('sha256').update(currentApiKey).digest('hex');
  const validApiSecretHash = crypto.createHash('sha256').update(currentApiSecret).digest('hex');

  // Setup seed dependencies
  console.log('📋 Étape 1: Initialisation des modèles en base Neon PostgreSQL...');

  let testCategory = await prisma.category.findFirst({ where: { slug: 'collection-test' } });
  if (!testCategory) {
    testCategory = await prisma.category.create({
      data: {
        name: 'Collection Test',
        slug: 'collection-test',
      },
    });
  }

  let testProduct = await prisma.product.findFirst({ where: { slug: 'robe-soiree-test' } });
  if (!testProduct) {
    testProduct = await prisma.product.create({
      data: {
        name: 'Robe Soirée Test',
        slug: 'robe-soiree-test',
        categoryId: testCategory.id,
        price: 40000,
      },
    });
  }

  let testColor = await prisma.color.findFirst({ where: { name: 'Noir Ébène' } });
  if (!testColor) {
    testColor = await prisma.color.create({
      data: { name: 'Noir Ébène', hex: '#111111' },
    });
  }

  let testSize = await prisma.size.findFirst({ where: { name: 'L' } });
  if (!testSize) {
    testSize = await prisma.size.create({
      data: { name: 'L' },
    });
  }

  let testVariant = await prisma.productVariant.findFirst({
    where: { productId: testProduct.id, colorId: testColor.id, sizeId: testSize.id },
  });

  if (!testVariant) {
    testVariant = await prisma.productVariant.create({
      data: {
        productId: testProduct.id,
        colorId: testColor.id,
        sizeId: testSize.id,
        sku: `ROBE-TEST-${Date.now()}`,
        stock: 100,
        price: 40000,
        isActive: true,
      },
    });
  }

  let testZone = await prisma.deliveryZone.findFirst({ where: { name: 'Dakar Express' } });
  if (!testZone) {
    testZone = await prisma.deliveryZone.create({
      data: {
        name: 'Dakar Express',
        price: 3000,
        estimatedDelivery: '24h',
      },
    });
  }

  const testCustomer = await prisma.customer.create({
    data: {
      firstName: 'Fatou',
      lastName: 'Sow',
      phone: '+221 77 987 65 43',
      email: `fatou.test.${Date.now()}@najarosestore.sn`,
      address: 'Fann Résidence, Dakar',
    },
  });

  console.log('  ✓ Modèles de base prêts pour les tests.\n');

  // TEST 1: PAIEMENT COMPLET (PAID)
  console.log('📌 Test 1: Paiement intégral d\'une commande (PAID)');
  const order1Number = `CMD-TEST-FULL-${Date.now()}`;
  const order1 = await prisma.order.create({
    data: {
      orderNumber: order1Number,
      customerId: testCustomer.id,
      deliveryZoneId: testZone.id,
      deliveryAddress: 'Fann Résidence',
      phone: '+221 77 987 65 43',
      subtotal: 40000,
      deliveryFee: 3000,
      total: 43000,
      amountPaid: 0,
      remainingBalance: 43000,
      paymentMethod: PaymentMethod.PAYTECH,
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.NEW,
      invoice: {
        create: { invoiceNumber: `FAC-${order1Number}` },
      },
    },
  });

  const session1 = await paytechService.createPaymentSession({
    orderIdOrNumber: order1.orderNumber,
  });
  assert(session1.success === true, 'Session PayTech créée avec succès');

  const ipnFullPayload = {
    type_event: 'sale_complete',
    ref_command: `${order1.orderNumber}_12345`,
    item_price: 43000,
    currency: 'XOF',
    token: session1.token || `token_full_${Date.now()}`,
    api_key_sha256: validApiKeyHash,
    api_secret_sha256: validApiSecretHash,
    payment_method: 'Carte Bancaire',
    client_phone: '+221 77 987 65 43',
  };

  const ipn1Result = await paytechService.handleIpnNotification(ipnFullPayload);
  assert(ipn1Result.success === true, 'Notification IPN pour paiement complet traitée');
  assert(ipn1Result.paymentStatus === PaymentStatus.PAID, 'Statut du paiement mis à PAID');
  assert(ipn1Result.amountPaid === 43000, 'Montant payé = 43000 FCFA');
  assert(ipn1Result.remainingBalance === 0, 'Solde restant = 0 FCFA');

  const verifiedOrder1 = await prisma.order.findUnique({ where: { id: order1.id } });
  assert(verifiedOrder1?.paymentStatus === PaymentStatus.PAID, 'Order.paymentStatus est PAID');
  assert(Number(verifiedOrder1?.amountPaid) === 43000, 'Order.amountPaid est 43000');
  assert(Number(verifiedOrder1?.remainingBalance) === 0, 'Order.remainingBalance est 0');
  assert(verifiedOrder1?.status === OrderStatus.CONFIRMED, 'Order.status est CONFIRMED');

  // TEST 2: IDEMPOTENCE (DOUBLON IPN / NOTIFICATION REÇUE PLUSIEURS FOIS)
  console.log('\n📌 Test 2: Protection contre le double-traitement IPN (Idempotence)');
  const duplicateIpnResult = await paytechService.handleIpnNotification(ipnFullPayload);
  assert(duplicateIpnResult.success === true, 'Deuxième appel IPN traité sans erreur');
  assert(duplicateIpnResult.idempotent === true, 'Flag idempotent actif');

  const verifiedOrder1AfterDup = await prisma.order.findUnique({ where: { id: order1.id } });
  assert(Number(verifiedOrder1AfterDup?.amountPaid) === 43000, 'Le montant payé n\'a pas été comptabilisé 2 fois');
  assert(Number(verifiedOrder1AfterDup?.remainingBalance) === 0, 'Le solde restant reste exactement 0');

  // TEST 3: PAIEMENT PARTIEL (PARTIALLY_PAID) SUIVI DU SOLDE
  console.log('\n📌 Test 3: Gestion des paiements partiels et calcul dynamique du solde restant');
  const order2Number = `CMD-TEST-PARTIAL-${Date.now()}`;
  const order2 = await prisma.order.create({
    data: {
      orderNumber: order2Number,
      customerId: testCustomer.id,
      deliveryZoneId: testZone.id,
      deliveryAddress: 'Fann Résidence',
      phone: '+221 77 987 65 43',
      subtotal: 80000,
      deliveryFee: 3000,
      total: 83000,
      amountPaid: 0,
      remainingBalance: 83000,
      paymentMethod: PaymentMethod.PAYTECH,
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.NEW,
    },
  });

  // Premier versement partiel de 30 000 FCFA
  const partialIpn1 = {
    type_event: 'sale_complete',
    ref_command: `${order2.orderNumber}_part1`,
    item_price: 30000,
    currency: 'XOF',
    token: `token_part_1_${Date.now()}`,
    api_key_sha256: validApiKeyHash,
    api_secret_sha256: validApiSecretHash,
    payment_method: 'Wave',
  };

  const partial1Result = await paytechService.handleIpnNotification(partialIpn1);
  assert(partial1Result.success === true, 'IPN du premier acompte reçue');
  assert(partial1Result.paymentStatus === PaymentStatus.PARTIALLY_PAID, 'Statut de paiement passé à PARTIALLY_PAID');
  assert(partial1Result.amountPaid === 30000, 'Montant payé = 30000 FCFA');
  assert(partial1Result.remainingBalance === 53000, 'Solde restant = 53000 FCFA');

  // Deuxième versement soldant la commande (53 000 FCFA)
  const partialIpn2 = {
    type_event: 'sale_complete',
    ref_command: `${order2.orderNumber}_part2`,
    item_price: 53000,
    currency: 'XOF',
    token: `token_part_2_${Date.now()}`,
    api_key_sha256: validApiKeyHash,
    api_secret_sha256: validApiSecretHash,
    payment_method: 'Carte Bancaire',
  };

  const partial2Result = await paytechService.handleIpnNotification(partialIpn2);
  assert(partial2Result.success === true, 'IPN du solde reçue');
  assert(partial2Result.paymentStatus === PaymentStatus.PAID, 'Statut final mis à jour à PAID');
  assert(partial2Result.amountPaid === 83000, 'Total payé cumulé = 83000 FCFA');
  assert(partial2Result.remainingBalance === 0, 'Solde restant nul');

  // TEST 4: NOTIFICATION FALSIFIÉE (SIGNATURE SHA256 ERRONÉE)
  console.log('\n📌 Test 4: Rejet strict des notifications avec signature falsifiée');
  const fakeSigPayload = {
    type_event: 'sale_complete',
    ref_command: order2.orderNumber,
    item_price: 50000,
    token: 'hacker_token',
    api_key_sha256: 'tampered_hash_key',
    api_secret_sha256: validApiSecretHash,
  };

  let fakeSigBlocked = false;
  try {
    await paytechService.handleIpnNotification(fakeSigPayload);
  } catch (err: any) {
    fakeSigBlocked = true;
    assert(err.message.includes('Signature'), 'Exception 401 levée lors du mismatch SHA256');
  }
  assert(fakeSigBlocked, 'La tentative d\'injection avec fausse signature a été immédiatement rejetée');

  // TEST 5: MONTANT INCOHÉRENT / SUPÉRIEUR AU SOLDE (REVIEW_REQUIRED)
  console.log('\n📌 Test 5: Détection d\'anomalie de montant et passage en REVIEW_REQUIRED');
  const order3Number = `CMD-TEST-ANOMALY-${Date.now()}`;
  const order3 = await prisma.order.create({
    data: {
      orderNumber: order3Number,
      customerId: testCustomer.id,
      deliveryZoneId: testZone.id,
      deliveryAddress: 'Fann Résidence',
      phone: '+221 77 987 65 43',
      subtotal: 20000,
      deliveryFee: 3000,
      total: 23000,
      amountPaid: 0,
      remainingBalance: 23000,
      paymentMethod: PaymentMethod.PAYTECH,
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.NEW,
    },
  });

  // Envoi d'un montant excessif de 999 000 FCFA sur une facture de 23 000 FCFA
  const anomalyIpnPayload = {
    type_event: 'sale_complete',
    ref_command: order3.orderNumber,
    item_price: 999000,
    currency: 'XOF',
    token: `token_anomaly_${Date.now()}`,
    api_key_sha256: validApiKeyHash,
    api_secret_sha256: validApiSecretHash,
  };

  const anomalyResult = await paytechService.handleIpnNotification(anomalyIpnPayload);
  assert(anomalyResult.reviewRequired === true, 'Le flag reviewRequired a été activé');
  assert(anomalyResult.paymentStatus === PaymentStatus.REVIEW_REQUIRED, 'Statut de la commande passé à REVIEW_REQUIRED');

  const order3Verified = await prisma.order.findUnique({ where: { id: order3.id } });
  assert(order3Verified?.paymentStatus === PaymentStatus.REVIEW_REQUIRED, 'La commande est isolée en REVIEW_REQUIRED sans être validée aveuglément');

  // Vérification de la création de la notification et de l'audit log
  const auditLogAnomaly = await prisma.auditLog.findFirst({
    where: { entityId: order3.id, action: 'PAYMENT_ANOMALY_REVIEW_REQUIRED' },
  });
  assert(auditLogAnomaly !== null, 'Une entrée AuditLog d\'anomalie a été créée pour l\'administrateur');

  // TEST 6: PAIEMENT ANNULÉ (sale_canceled)
  console.log('\n📌 Test 6: Annulation de paiement (sale_canceled)');
  const order4Number = `CMD-TEST-CANCEL-${Date.now()}`;
  const order4 = await prisma.order.create({
    data: {
      orderNumber: order4Number,
      customerId: testCustomer.id,
      deliveryZoneId: testZone.id,
      deliveryAddress: 'Fann Résidence',
      phone: '+221 77 987 65 43',
      subtotal: 15000,
      deliveryFee: 2000,
      total: 17000,
      paymentMethod: PaymentMethod.PAYTECH,
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.NEW,
    },
  });

  const cancelResult = await paytechService.handleIpnNotification({
    type_event: 'sale_canceled',
    ref_command: order4.orderNumber,
    api_key_sha256: validApiKeyHash,
    api_secret_sha256: validApiSecretHash,
  });

  assert(cancelResult.success === true, 'Événement sale_canceled traité');
  assert(cancelResult.paymentStatus === PaymentStatus.CANCELLED, 'Statut mis à jour vers CANCELLED');

  const order4Verified = await prisma.order.findUnique({ where: { id: order4.id } });
  assert(order4Verified?.paymentStatus === PaymentStatus.CANCELLED, 'Order.paymentStatus est CANCELLED');
  assert(order4Verified !== null, 'La commande existe toujours pour permettre une nouvelle tentative client');

  // NETTOYAGE
  console.log('\n🧹 Nettoyage des données de test de la base Neon...');
  const testOrderIds = [order1.id, order2.id, order3.id, order4.id];
  await prisma.notification.deleteMany({ where: { type: 'PAYMENT_REVIEW_REQUIRED' } });
  await prisma.auditLog.deleteMany({ where: { entityId: { in: testOrderIds } } });
  await prisma.payment.deleteMany({ where: { orderId: { in: testOrderIds } } });
  await prisma.invoice.deleteMany({ where: { orderId: { in: testOrderIds } } });
  await prisma.order.deleteMany({ where: { id: { in: testOrderIds } } });
  await prisma.customer.delete({ where: { id: testCustomer.id } });

  console.log('\n================================================================');
  console.log('🎉 TOUS LES 6 TESTS SÉCURITÉ & SOLDE PAYTECH ONT RÉUSSI À 100% !');
  console.log('================================================================\n');
}

runComprehensivePayTechTests()
  .catch((err) => {
    console.error('❌ Échec des tests:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

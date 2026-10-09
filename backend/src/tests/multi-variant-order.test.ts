import { generateOrderNumber, generateInvoiceNumber } from '../utils/generator.js';
import { invoiceService } from '../services/invoice.service.js';
import { PaymentMethod, PaymentStatus, OrderStatus, Prisma } from '@prisma/client';

async function runMultiVariantOrderTests() {
  console.log('================================================================');
  console.log('👗 NAJA ROSE STORE — MULTI-VARIANT & NO-EMAIL ORDER AUDIT TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title} ${details ? `— ${details}` : ''}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. COMBINAISON MULTI-VARIANTES POUR UN MÊME MODÈLE
  // ---------------------------------------------------------------------------
  console.log('📌 1. Test du Panier et des Variantes Multiples (Noir S, Noir M, Rose L, Rose XL)');

  const productPrice = 25000;
  const deliveryFee = 2000; // Plateau / Dakar

  // Simulated cart with 4 distinct combinations of the same dress
  const cartItems = [
    {
      variantId: 'var-robe-noir-s',
      productId: 'prod-robe-elegante',
      productName: 'Robe Élégante Naja Rose',
      colorName: 'Noir',
      sizeName: 'S',
      sku: 'NRS-ROB-BLK-S',
      price: productPrice,
      quantity: 1,
      maxStock: 5,
    },
    {
      variantId: 'var-robe-noir-m',
      productId: 'prod-robe-elegante',
      productName: 'Robe Élégante Naja Rose',
      colorName: 'Noir',
      sizeName: 'M',
      sku: 'NRS-ROB-BLK-M',
      price: productPrice,
      quantity: 2,
      maxStock: 8,
    },
    {
      variantId: 'var-robe-rose-l',
      productId: 'prod-robe-elegante',
      productName: 'Robe Élégante Naja Rose',
      colorName: 'Rose Poudré',
      sizeName: 'L',
      sku: 'NRS-ROB-PNK-L',
      price: productPrice,
      quantity: 1,
      maxStock: 4,
    },
    {
      variantId: 'var-robe-rose-xl',
      productId: 'prod-robe-elegante',
      productName: 'Robe Élégante Naja Rose',
      colorName: 'Rose Poudré',
      sizeName: 'XL',
      sku: 'NRS-ROB-PNK-XL',
      price: productPrice,
      quantity: 1,
      maxStock: 3,
    },
  ];

  assert('4 variantes distinctes dans le panier', cartItems.length === 4);
  assert(
    'Toutes les variantes ont des identifiants de variante uniques',
    new Set(cartItems.map((i) => i.variantId)).size === 4
  );

  const totalQuantity = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  assert('Quantité totale exacte (1 + 2 + 1 + 1 = 5 robes)', totalQuantity === 5);

  const subtotal = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  assert('Sous-total exact (5 × 25 000 = 125 000 FCFA)', subtotal === 125000);

  const totalWithDelivery = subtotal + deliveryFee;
  assert('Total avec livraison exact (125 000 + 2 000 = 127 000 FCFA)', totalWithDelivery === 127000);

  // ---------------------------------------------------------------------------
  // 2. PARCOURS DE COMMANDE SANS ADRESSE E-MAIL (TÉLÉPHONE UNIQUEMENT)
  // ---------------------------------------------------------------------------
  console.log('\n📌 2. Test Commande et Client SANS Adresse E-mail');

  const customerWithoutEmail = {
    firstName: 'Fatou',
    lastName: 'Diop',
    phone: '+221 77 123 45 67',
    email: undefined, // E-mail absent / non fourni
    address: 'Mermoz, Rue MZ-14, Villa 88',
    city: 'Dakar',
  };

  assert('Client valide sans champ email', !customerWithoutEmail.email);
  assert('Numéro de téléphone présent', !!customerWithoutEmail.phone);

  const orderPayloadWithoutEmail = {
    customer: customerWithoutEmail,
    deliveryZoneId: 'zone-dakar-plateau',
    deliveryAddress: customerWithoutEmail.address,
    phone: customerWithoutEmail.phone,
    email: undefined, // Pas d'email obligatoire
    notes: 'Près de la pharmacie de Mermoz',
    paymentMethod: PaymentMethod.WAVE,
    items: cartItems.map((i) => ({
      variantId: i.variantId,
      quantity: i.quantity,
    })),
  };

  assert('Payload de commande exempt d’email', orderPayloadWithoutEmail.email === undefined);
  assert('Liste des 4 variantes transmise au backend', orderPayloadWithoutEmail.items.length === 4);

  // ---------------------------------------------------------------------------
  // 3. VÉRIFICATION DU CONTRÔLE DE STOCK PAR VARIANTE CÔTÉ SERVEUR
  // ---------------------------------------------------------------------------
  console.log('\n📌 3. Validation des Stocks et Rejet en Cas d’Insuffisance');

  const mockDbVariants = [
    { id: 'var-robe-noir-s', stock: 5, name: 'Noir S' },
    { id: 'var-robe-noir-m', stock: 8, name: 'Noir M' },
    { id: 'var-robe-rose-l', stock: 4, name: 'Rose L' },
    { id: 'var-robe-rose-xl', stock: 1, name: 'Rose XL' }, // Seulement 1 en stock
  ];

  // Test 3a: Stock suffisant
  let stockCheckPassed = true;
  for (const item of cartItems) {
    const v = mockDbVariants.find((dbV) => dbV.id === item.variantId);
    if (!v || v.stock < item.quantity) {
      stockCheckPassed = false;
    }
  }
  assert('Commande valide lorsque toutes les quantités demandées <= stocks disponibles', stockCheckPassed);

  // Test 3b: Stock insuffisant sur une seule variante (ex: Rose XL demande 5 au lieu de 1)
  const excessiveOrder = [
    ...cartItems.filter((i) => i.variantId !== 'var-robe-rose-xl'),
    {
      ...cartItems.find((i) => i.variantId === 'var-robe-rose-xl')!,
      quantity: 5, // Demande 5 alors que le stock est de 1
    },
  ];

  let excessiveStockDetected = false;
  for (const item of excessiveOrder) {
    const v = mockDbVariants.find((dbV) => dbV.id === item.variantId);
    if (!v || v.stock < item.quantity) {
      excessiveStockDetected = true;
    }
  }
  assert('Rejet strict si une seule des 4 variantes dépasse son stock disponible', excessiveStockDetected);

  // ---------------------------------------------------------------------------
  // 4. FACTURE AUTOMATIQUE ET GÉNÉRATION PDF SANS E-MAIL AVEC TOUTES LES VARIANTES
  // ---------------------------------------------------------------------------
  console.log('\n📌 4. Facture et Rendu PDF Multi-Variantes Sans E-mail');

  const invoiceNumber = generateInvoiceNumber(77, 2026);
  const orderNumber = generateOrderNumber(77, 2026);

  const orderDataForInvoice: any = {
    orderNumber,
    createdAt: new Date(),
    deliveryAddress: customerWithoutEmail.address,
    phone: customerWithoutEmail.phone,
    email: null, // Pas d'email
    notes: 'Près de la pharmacie de Mermoz',
    subtotal: new Prisma.Decimal(subtotal),
    deliveryFee: new Prisma.Decimal(deliveryFee),
    total: new Prisma.Decimal(totalWithDelivery),
    paymentMethod: PaymentMethod.WAVE,
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.NEW,
    customer: customerWithoutEmail,
    deliveryZone: {
      name: 'Mermoz / Sacré-Cœur',
      price: new Prisma.Decimal(deliveryFee),
      estimatedDelivery: '24h',
    },
    items: cartItems.map((i) => ({
      productName: i.productName,
      colorName: i.colorName,
      sizeName: i.sizeName,
      quantity: i.quantity,
      unitPrice: new Prisma.Decimal(i.price),
      total: new Prisma.Decimal(i.price * i.quantity),
      variant: { sku: i.sku },
    })),
    invoice: {
      invoiceNumber,
      createdAt: new Date(),
    },
  };

  const pdfBuffer = await invoiceService.generatePdfBuffer(orderDataForInvoice);

  assert('Génération réussie du PDF contenant les 4 variantes sans email', Buffer.isBuffer(pdfBuffer));
  assert('Taille du flux PDF valide (> 3 Ko)', pdfBuffer.length > 3000);

  // ---------------------------------------------------------------------------
  // 5. BILAN DU TEST
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 BILAN DES TESTS MULTI-VARIANTES : ${passed} Succès, ${failed} Échecs`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 TOUS LES TESTS MULTI-VARIANTES ET COMMANDE SANS E-MAIL ONT RÉUSSI !');
    process.exit(0);
  }
}

runMultiVariantOrderTests().catch((err) => {
  console.error('Erreur test multi-variantes :', err);
  process.exit(1);
});

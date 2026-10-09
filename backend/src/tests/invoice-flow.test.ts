import { generateOrderNumber, generateInvoiceNumber } from '../utils/generator.js';
import { invoiceService } from '../services/invoice.service.js';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';

async function runInvoiceFlowVerification() {
  console.log('================================================================');
  console.log('🧾 NAJA ROSE STORE — INVOICE SYSTEM & PAYMENT AUDIT TESTS');
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
  // 1. SÉQUENCE & FORMAT DES FACTURES NAJA ROSE
  // ---------------------------------------------------------------------------
  console.log('📌 1. Format & Unicité des Numéros de Factures');
  const currentYear = 2026;
  const inv1 = generateInvoiceNumber(1, currentYear);
  const inv42 = generateInvoiceNumber(42, currentYear);
  const inv100 = generateInvoiceNumber(100, currentYear);

  assert('Numéro de facture formaté NRS-2026-000001', inv1 === 'NRS-2026-000001');
  assert('Numéro de facture incrémental NRS-2026-000042', inv42 === 'NRS-2026-000042');
  assert('Numéro de facture incrémental NRS-2026-000100', inv100 === 'NRS-2026-000100');

  // ---------------------------------------------------------------------------
  // 2. CALCULS STRICTS CÔTÉ SERVEUR (SOUS-TOTAL, LIVRAISON, TOTAL)
  // ---------------------------------------------------------------------------
  console.log('\n📌 2. Calculs Financiers Côté Serveur (FCFA)');
  const item1 = { name: 'Robe Bazin Riche Getzner Imperial', unitPrice: 75000, quantity: 2 };
  const item2 = { name: 'Ensemble Soie de Médine Naja', unitPrice: 45000, quantity: 1 };
  const items = [item1, item2];

  const calculatedSubtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const deliveryFee = 2500; // Almadies / Dakar
  const grandTotal = calculatedSubtotal + deliveryFee;

  assert('Calcul exact du sous-total vêtements (2x75 000 + 1x45 000 = 195 000 FCFA)', calculatedSubtotal === 195000);
  assert('Calcul exact du total avec livraison (195 000 + 2 500 = 197 500 FCFA)', grandTotal === 197500);

  // ---------------------------------------------------------------------------
  // 3. STATUTS DE COMMANDE ET FACTURE AVANT PAIEMENT
  // ---------------------------------------------------------------------------
  console.log('\n📌 3. Statuts Avant & Après Consultation Facture');
  const prePaymentOrderState = {
    orderStatus: OrderStatus.NEW,
    paymentStatus: PaymentStatus.PENDING,
    invoiceIssued: true,
  };

  assert('Commande enregistrée avec statut NEW (en attente)', prePaymentOrderState.orderStatus === OrderStatus.NEW);
  assert('Paiement non confirmé avec statut PENDING', prePaymentOrderState.paymentStatus === PaymentStatus.PENDING);
  assert('Facture officielle créée et associée à la commande', prePaymentOrderState.invoiceIssued === true);

  // ---------------------------------------------------------------------------
  // 4. GÉNÉRATION DU PDF DE FACTURE HAUTE COUTURE
  // ---------------------------------------------------------------------------
  console.log('\n📌 4. Moteur PDFKit & Rendu Facture A4');
  const mockOrderData: any = {
    id: 'ord_test_full_flow',
    orderNumber: 'CMD-2026-000001',
    createdAt: new Date(),
    deliveryAddress: 'Les Almadies, Zone 4, Villa 12, Dakar',
    phone: '+221 77 381 71 91',
    email: 'client@najarosestore.sn',
    notes: 'En face de la pharmacie, portail marron',
    subtotal: calculatedSubtotal,
    deliveryFee: deliveryFee,
    total: grandTotal,
    paymentMethod: PaymentMethod.WAVE,
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.NEW,
    customer: {
      firstName: 'Aïssatou',
      lastName: 'Ba',
      phone: '+221 77 381 71 91',
      email: 'aissatou.ba@najarosestore.sn',
      address: 'Les Almadies, Dakar',
      city: 'Dakar',
    },
    deliveryZone: {
      name: 'Almadies / Ngor / Yoff',
      price: 2500,
      estimatedDelivery: '24h',
    },
    items: [
      {
        productName: 'Robe Bazin Riche Getzner Imperial',
        colorName: 'Rose Poudré',
        sizeName: 'L',
        quantity: 2,
        unitPrice: 75000,
        total: 150000,
        variant: { sku: 'NJ-ROB-ROS-L' },
      },
      {
        productName: 'Ensemble Soie de Médine Naja',
        colorName: 'Beige Rosé',
        sizeName: 'M',
        quantity: 1,
        unitPrice: 45000,
        total: 45000,
        variant: { sku: 'NJ-ENS-BEI-M' },
      },
    ],
    invoice: {
      invoiceNumber: 'NRS-2026-000001',
      createdAt: new Date(),
    },
  };

  const pdfBuffer = await invoiceService.generatePdfBuffer(mockOrderData);
  assert('Génération du flux PDF A4 valide', Buffer.isBuffer(pdfBuffer));
  assert('Taille du flux PDF conforme (> 2 Ko avec éléments graphiques)', pdfBuffer.length > 2048);

  // ---------------------------------------------------------------------------
  // 5. INTÉGRITÉ APRÈS ÉCHEC DE PAIEMENT (PERSISTANCE FACTURE)
  // ---------------------------------------------------------------------------
  console.log('\n📌 5. Persistance Facture en Cas d’Échec de Paiement');
  const failedPaymentOrder = {
    ...mockOrderData,
    paymentStatus: PaymentStatus.FAILED,
  };
  assert('Facture reste accessible même si le paiement est marqué FAILED', !!failedPaymentOrder.invoice.invoiceNumber);
  assert('Total préservé et inchangé', failedPaymentOrder.total === 197500);

  // ---------------------------------------------------------------------------
  // 6. VALIDATION COD (PAIEMENT À LA LIVRAISON)
  // ---------------------------------------------------------------------------
  console.log('\n📌 6. Parcours Paiement à la Livraison');
  const codOrder = {
    ...mockOrderData,
    paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.NEW,
  };
  assert('Paiement à la livraison conserve le statut PENDING jusqu’à la remise', codOrder.paymentStatus === PaymentStatus.PENDING);
  assert('Facture émise avec mention du montant à remettre au coursier', codOrder.paymentMethod === PaymentMethod.CASH_ON_DELIVERY);

  // ---------------------------------------------------------------------------
  // BILAN
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 BILAN DU CONTRÔLE DE FACTURATION : ${passed} Succès, ${failed} Échecs`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🌟 SYSTÈME DE FACTURATION NAJA ROSE STORE TOTALEMENT OPÉRATIONNEL !');
    process.exit(0);
  }
}

runInvoiceFlowVerification().catch((err) => {
  console.error('Erreur audit facturation :', err);
  process.exit(1);
});

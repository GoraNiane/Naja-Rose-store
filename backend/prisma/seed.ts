import { PrismaClient, Role, PaymentMethod, OrderStatus, PaymentStatus, StockMovementType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Naja Rose Store Database Seeding...');

  // 1. Clean existing records (in reverse dependency order)
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.size.deleteMany();
  await prisma.color.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing tables.');

  // 2. Create Users (Admin & Customer)
  const hashedAdminPassword = await bcrypt.hash('AdminPass2026!', 10);
  const hashedCustomerPassword = await bcrypt.hash('CustomerPass2026!', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@najarosestore.sn',
      password: hashedAdminPassword,
      role: Role.ADMIN,
      firstName: 'Directrice',
      lastName: 'Naja Rose',
      phone: '+221773817191'
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: 'fatou.diop@example.sn',
      password: hashedCustomerPassword,
      role: Role.CUSTOMER,
      firstName: 'Fatou',
      lastName: 'Diop',
      phone: '+221776543210',
    },
  });

  const customerProfile = await prisma.customer.create({
    data: {
      userId: customerUser.id,
      firstName: 'Fatou',
      lastName: 'Diop',
      email: 'fatou.diop@example.sn',
      phone: '+221776543210',
      address: 'Almadies Zone 4, Résidence Naja',
      city: 'Dakar',
    },
  });

  console.log('👤 Created Users & Customer profiles.');

  // 3. Create Colors (Pastels, Rose, Neutrals & Classics)
  const colors = await Promise.all([
    prisma.color.create({ data: { name: 'Rose Poudré', hex: '#F5DCD8' } }),
    prisma.color.create({ data: { name: 'Vieux Rose', hex: '#8B3A4A' } }),
    prisma.color.create({ data: { name: 'Noir Élégance', hex: '#1A1816' } }),
    prisma.color.create({ data: { name: 'Blanc Crème', hex: '#FAF5F4' } }),
    prisma.color.create({ data: { name: 'Beige Nude', hex: '#E6D7CD' } }),
    prisma.color.create({ data: { name: 'Terracotta', hex: '#9A3412' } }),
  ]);

  // 4. Create Sizes
  const sizes = await Promise.all([
    prisma.size.create({ data: { name: 'XS' } }),
    prisma.size.create({ data: { name: 'S' } }),
    prisma.size.create({ data: { name: 'M' } }),
    prisma.size.create({ data: { name: 'L' } }),
    prisma.size.create({ data: { name: 'XL' } }),
    prisma.size.create({ data: { name: 'Taille Unique' } }),
  ]);

  console.log('🎨 Created Colors & Sizes.');

  // 5. Create Delivery Zones
  const zones = await Promise.all([
    prisma.deliveryZone.create({
      data: {
        name: 'Dakar Plateau / Centre-Ville / Médina',
        price: 2000,
        estimatedDelivery: '24h',
      },
    }),
    prisma.deliveryZone.create({
      data: {
        name: 'Almadies / Ngor / Ouakam / Yoff',
        price: 2000,
        estimatedDelivery: '24h',
      },
    }),
    prisma.deliveryZone.create({
      data: {
        name: 'Mermoz / Sacré-Cœur / Point E / Fann',
        price: 2000,
        estimatedDelivery: '24h',
      },
    }),
    prisma.deliveryZone.create({
      data: {
        name: 'Pikine / Guédiawaye (Banlieue)',
        price: 2500,
        estimatedDelivery: '24h - 48h',
      },
    }),
    prisma.deliveryZone.create({
      data: {
        name: 'Rufisque / Bargny / Diamniadio',
        price: 3000,
        estimatedDelivery: '48h',
      },
    }),
    prisma.deliveryZone.create({
      data: {
        name: 'Régions (Thiès, Mbour, Saint-Louis, Touba)',
        price: 5000,
        estimatedDelivery: '48h - 72h',
      },
    }),
  ]);

  console.log('🚚 Created Delivery Zones.');

  // 6. Create Categories from the Reference Design
  const catTops = await prisma.category.create({
    data: {
      name: 'Tops & T-shirts',
      slug: 'tops-t-shirts',
      description: 'Hauts élégants, blouses fluides et chemises chic.',
      imageUrl:
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
    },
  });

  const catRobes = await prisma.category.create({
    data: {
      name: 'Robes',
      slug: 'robes',
      description: 'Robes de soirée, robes d’été et robes élégantes de cocktail.',
      imageUrl:
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
    },
  });

  const catEnsembles = await prisma.category.create({
    data: {
      name: 'Ensembles',
      slug: 'ensembles',
      description: 'Tailleurs pantalon, ensembles tailleurs et coordinations modernes.',
      imageUrl:
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
    },
  });

  const catPantalons = await prisma.category.create({
    data: {
      name: 'Pantalons',
      slug: 'pantalons',
      description: 'Pantalons palazzo, pantalons taille haute et coupes fluides.',
      imageUrl:
        'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=600&q=80',
    },
  });

  const catVestes = await prisma.category.create({
    data: {
      name: 'Vestes & Manteaux',
      slug: 'vestes-manteaux',
      description: 'Blazers cintrés, vestes structurées et manteaux légers.',
      imageUrl:
        'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80',
    },
  });

  const catJupes = await prisma.category.create({
    data: {
      name: 'Jupes',
      slug: 'jupes',
      description: 'Jupes plissées midi, jupes longues fluides et jupes crayon.',
      imageUrl:
        'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80',
    },
  });

  console.log('📂 Created 6 Core Categories.');

  // 7. Create Products from Reference Design
  const productsData = [
    {
      name: 'Chemise oversize',
      slug: 'chemise-oversize',
      description:
        'Chemise oversize en popeline fluide de coton premium. Coupe décontractée et ultra élégante, idéale portée rentrée dans un pantalon taille haute ou nouée à la taille.',
      categoryId: catTops.id,
      price: 25000,
      oldPrice: 30000,
      images: [
        'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Robe élégante',
      slug: 'robe-elegante',
      description:
        'Robe mi-longue ceinturée noire chic. Tissu stretch infroissable qui épouse parfaitement la silhouette pour vos événements et rendez-vous professionnels.',
      categoryId: catRobes.id,
      price: 32000,
      oldPrice: null,
      images: [
        'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Ensemble tailleur',
      slug: 'ensemble-tailleur',
      price: 45000,
      oldPrice: 55000,
      description:
        'Ensemble tailleur veste & pantalon beige sable. Veste cintrée à double boutonnage et pantalon droit flatteur.',
      categoryId: catEnsembles.id,
      images: [
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Blouse chic',
      slug: 'blouse-chic',
      price: 22000,
      oldPrice: null,
      description:
        'Blouse blanche vaporeuse avec manches bouffantes romantiques et finitions coutures délicates.',
      categoryId: catTops.id,
      images: [
        'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Robe longue',
      slug: 'robe-longue',
      price: 35000,
      oldPrice: 42000,
      description:
        'Robe longue fluide en satin rose poudré avec encolure cache-cœur et ceinture amovible assortie.',
      categoryId: catRobes.id,
      images: [
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Veste blazer rose poudré',
      slug: 'veste-blazer-rose-poudre',
      price: 48000,
      oldPrice: null,
      description:
        'Veste blazer structurée rose pastel avec doublure satinée. La pièce maîtresse de la collection Naja Rose.',
      categoryId: catVestes.id,
      images: [
        'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Pantalon palazzo chic',
      slug: 'pantalon-palazzo-chic',
      price: 24000,
      oldPrice: 28000,
      description:
        'Pantalon fluide taille haute à jambes évasées. Confort d’exception et tombé impeccable.',
      categoryId: catPantalons.id,
      images: [
        'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Jupe plissée fluide',
      slug: 'jupe-plissee-fluide',
      price: 28000,
      oldPrice: null,
      description:
        'Jupe midi plissée rose poudré avec taille élastiquée scintillante. Légère, féminine et élégante.',
      categoryId: catJupes.id,
      images: [
        'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80',
      ],
    },
  ];

  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        categoryId: p.categoryId,
        price: p.price,
        oldPrice: p.oldPrice,
        isActive: true,
      },
    });

    // Create Images
    for (let i = 0; i < p.images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: p.images[i],
          publicId: `${p.slug}-${i}`,
          isPrimary: i === 0,
          position: i,
        },
      });
    }

    // Create Variants (Sizes S, M, L)
    const selectedSizes = sizes.slice(1, 4); // S, M, L
    for (let s = 0; s < selectedSizes.length; s++) {
      const color = colors[s % colors.length];
      const size = selectedSizes[s];
      const cleanSlug = p.slug.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase();
      const sku = `NR-${cleanSlug}-${size.name}-${s + 1}`;

      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          colorId: color.id,
          sizeId: size.id,
          sku,
          stock: 10 + s * 5,
          price: null,
          isActive: true,
        },
      });

      await prisma.stockMovement.create({
        data: {
          variantId: variant.id,
          type: StockMovementType.STOCK_IN,
          quantity: 10 + s * 5,
          reason: 'Stock initial atelier Naja Rose Dakar',
          reference: 'INIT-2026',
        },
      });
    }
  }

  console.log('👗 Created 8 Products with Variants, Stock & Images.');

  // 8. Create Initial Demonstration Order
  const demoOrder = await prisma.order.create({
    data: {
      orderNumber: 'CMD-2026-000001',
      customerId: customerProfile.id,
      deliveryZoneId: zones[1].id, // Almadies
      deliveryAddress: 'Almadies Zone 4, Résidence Naja',
      phone: '+221776543210',
      email: 'fatou.diop@example.sn',
      notes: 'Livraison souhaitée avant 18h',
      subtotal: 57000,
      deliveryFee: 2000,
      total: 59000,
      paymentMethod: PaymentMethod.WAVE,
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.CONFIRMED,
      items: {
        create: [
          {
            productName: 'Chemise oversize',
            colorName: 'Rose Poudré',
            sizeName: 'M',
            quantity: 1,
            unitPrice: 25000,
            total: 25000,
          },
          {
            productName: 'Robe élégante',
            colorName: 'Noir Élégance',
            sizeName: 'M',
            quantity: 1,
            unitPrice: 32000,
            total: 32000,
          },
        ],
      },
      payments: {
        create: {
          provider: PaymentMethod.WAVE,
          amount: 59000,
          status: PaymentStatus.PAID,
          transactionId: 'wave_tx_demo_001',
          metadata: {
            mode: 'SANDBOX',
            note: 'Paiement Wave de démonstration',
          },
        },
      },
      invoice: {
        create: {
          invoiceNumber: 'FAC-2026-000001',
        },
      },
    },
  });

  console.log('🧾 Created Demonstration Order & Invoice.');
  console.log('✨ Naja Rose Store Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

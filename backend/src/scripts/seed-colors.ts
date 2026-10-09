import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EXPANDED_COLORS = [
  { name: 'Rose Poudré', hex: '#F5DCD8' },
  { name: 'Vieux Rose', hex: '#8B3A4A' },
  { name: 'Rose Bonbon', hex: '#F472B6' },
  { name: 'Rose Fuchsia', hex: '#D946EF' },
  { name: 'Beige Nude', hex: '#E6D7CD' },
  { name: 'Beige Rosé', hex: '#E8CFCF' },
  { name: 'Blanc Crème', hex: '#FAF5F4' },
  { name: 'Blanc Pur', hex: '#FFFFFF' },
  { name: 'Noir Élégance', hex: '#1A1816' },
  { name: 'Noir Ébène', hex: '#111827' },
  { name: 'Terracotta', hex: '#9A3412' },
  { name: 'Bordeaux Royal', hex: '#7F1D1D' },
  { name: 'Pourpre / Prune', hex: '#581C87' },
  { name: 'Doré / Or Impérial', hex: '#D97706' },
  { name: 'Argenté / Gris Perle', hex: '#94A3B8' },
  { name: 'Gris Anthracite', hex: '#334155' },
  { name: 'Vert Émeraude', hex: '#059669' },
  { name: 'Vert Sauge', hex: '#84A98C' },
  { name: 'Vert Bazin / Bouteille', hex: '#166534' },
  { name: 'Bleu Nuit / Marine', hex: '#1E1B4B' },
  { name: 'Bleu Ciel / Pastel', hex: '#7DD3FC' },
  { name: 'Bleu Roi / Cobalt', hex: '#1D4ED8' },
  { name: 'Jaune Moutarde / Safran', hex: '#CA8A04' },
  { name: 'Jaune Soleil', hex: '#FACC15' },
  { name: 'Corail', hex: '#FB7185' },
  { name: 'Saumon', hex: '#FDA4AF' },
  { name: 'Lilas / Lavande', hex: '#C084FC' },
  { name: 'Marron Chocolat', hex: '#451A03' },
  { name: 'Camel / Caramel', hex: '#B45309' },
  { name: 'Turquoise', hex: '#0D9488' },
  { name: 'Kaki', hex: '#52525B' },
  { name: 'Rouge Passion', hex: '#DC2626' },
  { name: 'Orange Sanguine', hex: '#EA580C' },
];

async function seedColors() {
  console.log('🎨 Seeding expanded color palette for Naja Rose Store...');

  let added = 0;
  let existing = 0;

  for (const c of EXPANDED_COLORS) {
    const found = await prisma.color.findUnique({
      where: { name: c.name },
    });

    if (!found) {
      await prisma.color.create({
        data: {
          name: c.name,
          hex: c.hex,
        },
      });
      added++;
      console.log(`  ➕ Ajouté: ${c.name} (${c.hex})`);
    } else {
      existing++;
    }
  }

  console.log(`\n✨ Palette mise à jour avec succès : ${added} couleurs ajoutées, ${existing} déjà existantes.`);
}

seedColors()
  .catch((err) => {
    console.error('Erreur lors du seeding des couleurs :', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

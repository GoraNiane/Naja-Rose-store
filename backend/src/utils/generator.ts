export function generateOrderNumber(sequence = 1, year = new Date().getFullYear()): string {
  const padded = String(sequence).padStart(6, '0');
  return `CMD-${year}-${padded}`;
}

export function generateInvoiceNumber(sequence = 1, year = new Date().getFullYear()): string {
  const padded = String(sequence).padStart(6, '0');
  return `NRS-${year}-${padded}`;
}

export function generateSKU(productCode: string, colorCode = 'DEF', sizeCode = 'STD'): string {
  const cleanProd = productCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const cleanCol = colorCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
  const cleanSz = sizeCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
  return `NJ-${cleanProd}-${cleanCol}-${cleanSz}`;
}

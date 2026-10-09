import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/order.service';
import { formatCFA, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import {
  FileText,
  Download,
  Search,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  MapPin,
  User,
  AlertTriangle,
} from 'lucide-react';

export function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-invoices', search, paymentStatus, page],
    queryFn: () =>
      orderService.getInvoices({
        search: search.trim() || undefined,
        paymentStatus: paymentStatus || undefined,
        page,
        limit: 15,
      }),
  });

  const invoices = response?.data || [];
  const meta = response?.meta || { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900">
            Gestion des Factures & Rapprochement des Paiements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Recherchez, vérifiez les montants payés, les soldes restants et téléchargez les factures officielles.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="N° Facture, N° Commande, Client..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="text-xs text-slate-800 bg-transparent focus:outline-none placeholder-slate-400 w-44 sm:w-60"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="">Tous les statuts</option>
              <option value="PAID">Payées</option>
              <option value="PARTIALLY_PAID">Partiellement payées</option>
              <option value="REVIEW_REQUIRED">Vérification requise</option>
              <option value="PENDING">En attente</option>
              <option value="FAILED">Échouées</option>
              <option value="CANCELLED">Annulées</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">Aucune facture trouvée</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || paymentStatus
                ? 'Aucune facture ne correspond à vos critères de recherche ou de filtre.'
                : 'Les factures générées apparaîtront ici lors des confirmations de commandes.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-5">Numéro Facture</th>
                  <th className="py-4 px-5">Commande & Client</th>
                  <th className="py-4 px-5">Montants & Solde</th>
                  <th className="py-4 px-5">Moyen de Paiement</th>
                  <th className="py-4 px-5">Statut Paiement</th>
                  <th className="py-4 px-5">Date d'Émission</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoices.map((inv: any) => {
                  const order = inv.order;
                  const total = Math.round(Number(order?.total || 0));
                  const amountPaid = Math.round(
                    Number(order?.amountPaid !== undefined ? order.amountPaid : (order?.paymentStatus === 'PAID' ? total : 0))
                  );
                  const remainingBalance = Math.max(
                    0,
                    Math.round(
                      Number(order?.remainingBalance !== undefined ? order.remainingBalance : (order?.paymentStatus === 'PAID' ? 0 : total))
                    )
                  );
                  const isPaid = order?.paymentStatus === 'PAID' || remainingBalance === 0;
                  const isPartiallyPaid = order?.paymentStatus === 'PARTIALLY_PAID';
                  const isReviewRequired = order?.paymentStatus === 'REVIEW_REQUIRED';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Numéro Facture */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#8B3A4A] shrink-0" />
                          <div>
                            <span className="font-mono font-bold text-slate-900 block">
                              {inv.invoiceNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {inv.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Commande & Client */}
                      <td className="py-4 px-5">
                        <p className="font-mono font-bold text-slate-800">
                          {order?.orderNumber || '-'}
                        </p>
                        <p className="text-slate-600 text-[11px]">
                          {order?.customer?.firstName} {order?.customer?.lastName} • {order?.phone}
                        </p>
                        <span className="text-[10px] text-amber-800 font-medium">
                          Zone : {order?.deliveryZone?.name || 'Dakar'}
                        </span>
                      </td>

                      {/* Montants & Solde */}
                      <td className="py-4 px-5">
                        <p className="font-display font-black text-slate-950 text-xs font-mono">
                          Total : {formatCFA(total)}
                        </p>
                        <p className="text-[11px] text-emerald-700 font-semibold font-mono">
                          Payé : {formatCFA(amountPaid)}
                        </p>
                        {remainingBalance > 0 && (
                          <p className="text-[11px] text-[#8B3A4A] font-bold font-mono">
                            Solde : {formatCFA(remainingBalance)}
                          </p>
                        )}
                      </td>

                      {/* Moyen de Paiement */}
                      <td className="py-4 px-5">
                        <span className="font-medium text-slate-800 text-[11px] block">
                          {order?.paymentMethod === 'PAYTECH'
                            ? 'Carte Bancaire'
                            : order?.paymentMethod === 'WAVE'
                            ? 'Wave Sénégal'
                            : order?.paymentMethod === 'ORANGE_MONEY'
                            ? 'Orange Money'
                            : 'Paiement Livraison'}
                        </span>
                      </td>

                      {/* Statut Paiement */}
                      <td className="py-4 px-5">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Payée
                          </span>
                        ) : isPartiallyPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Partiel ({formatCFA(amountPaid)})
                          </span>
                        ) : isReviewRequired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-orange-600" /> Vérif. Requise
                          </span>
                        ) : order?.paymentStatus === 'FAILED' || order?.paymentStatus === 'CANCELLED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3" /> {order?.paymentStatus}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" /> En attente
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-5 text-slate-500 whitespace-nowrap">
                        {formatDate(inv.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Modal Detail */}
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Consulter le détail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Download PDF */}
                          <button
                            type="button"
                            onClick={() =>
                              orderService.downloadInvoicePdf(
                                order?.orderNumber || order?.id,
                                inv.invoiceNumber
                              )
                            }
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#8B3A4A] hover:bg-[#FAF2F0] transition-colors cursor-pointer"
                            title="Télécharger PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Client Invoice View */}
                          <a
                            href={`/commande/${order?.orderNumber}/facture`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Voir page facture client"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {meta.page} sur {meta.totalPages} ({meta.total} factures)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage(page + 1)}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF2F0] text-[#8B3A4A] flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">
                    Facture {selectedInvoice.invoiceNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Émise le {formatDate(selectedInvoice.createdAt)} • Commande {selectedInvoice.order?.orderNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Client and Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#8B3A4A]" /> Client
                </p>
                <p className="font-semibold text-slate-800">
                  {selectedInvoice.order?.customer?.firstName} {selectedInvoice.order?.customer?.lastName}
                </p>
                <p className="text-slate-500">{selectedInvoice.order?.phone}</p>
                {selectedInvoice.order?.email && <p className="text-slate-500">{selectedInvoice.order?.email}</p>}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#8B3A4A]" /> Livraison
                </p>
                <p className="font-semibold text-slate-800">
                  Zone : {selectedInvoice.order?.deliveryZone?.name || 'Dakar'}
                </p>
                <p className="text-slate-600">{selectedInvoice.order?.deliveryAddress}</p>
                {selectedInvoice.order?.notes && (
                  <p className="text-[11px] text-[#8B3A4A] italic">{selectedInvoice.order?.notes}</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Articles Facturés ({selectedInvoice.order?.items?.length || 0})
              </p>
              <div className="rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden text-xs">
                {selectedInvoice.order?.items?.map((item: any) => (
                  <div key={item.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{item.productName}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.colorName && `Couleur : ${item.colorName} • `}
                        {item.sizeName && `Taille : ${item.sizeName} • `}
                        Qté : {item.quantity} x {formatCFA(item.unitPrice)}
                      </p>
                    </div>
                    <span className="font-bold font-mono text-slate-900">{formatCFA(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Balance Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total articles :</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatCFA(selectedInvoice.order?.subtotal || 0)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Frais de livraison :</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatCFA(selectedInvoice.order?.deliveryFee || 0)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-sm text-slate-900">
                <span>TOTAL FACTURÉ :</span>
                <span className="font-black text-lg text-[#8B3A4A]">
                  {formatCFA(selectedInvoice.order?.total || 0)}
                </span>
              </div>
              {selectedInvoice.order?.amountPaid !== undefined && (
                <div className="pt-2 border-t border-dashed border-slate-200 space-y-1">
                  <div className="flex justify-between text-emerald-800 font-semibold">
                    <span>Total paiements confirmés :</span>
                    <span>{formatCFA(selectedInvoice.order.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-[#8B3A4A] font-bold">
                    <span>Solde restant :</span>
                    <span>{formatCFA(selectedInvoice.order.remainingBalance || 0)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>
                Fermer
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={() =>
                  orderService.downloadInvoicePdf(
                    selectedInvoice.order?.orderNumber || selectedInvoice.order?.id,
                    selectedInvoice.invoiceNumber
                  )
                }
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Télécharger la Facture PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

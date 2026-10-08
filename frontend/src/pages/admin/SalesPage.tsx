import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/analytics.service';
import { formatCFA, formatDate } from '../../lib/utils';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import {
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  CreditCard,
  Truck,
  ExternalLink,
  ShoppingBag,
} from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: '30days', label: '30 derniers jours' },
  { value: 'today', label: "Aujourd'hui" },
  { value: '7days', label: '7 derniers jours' },
  { value: 'this_month', label: 'Ce mois' },
  { value: 'last_month', label: 'Mois précédent' },
  { value: 'all', label: 'Tout l’historique' },
];

export function SalesPage() {
  const [period, setPeriod] = useState('30days');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-sales', period, paymentMethod, status, search, page],
    queryFn: () =>
      analyticsService.getSalesLog({
        period,
        paymentMethod: paymentMethod || undefined,
        status: status || undefined,
        search: search || undefined,
        page,
        limit: 15,
      }),
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const sales = response?.data || [];
  const meta = response?.meta || { total: 0, page: 1, totalPages: 1 };
  const summary = response?.meta?.summary || { totalRevenue: 0, totalSubtotal: 0, totalDeliveryFees: 0 };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9E2DF] pb-6">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-serif italic font-bold text-[#171717]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Journal des Ventes & Transactions
          </h1>
          <p className="text-xs text-[#77706D] mt-1">
            Consultez le détail des commandes facturées, les modes de paiement et la répartition des recettes.
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-[#F7EEEE] border border-[#E8CFCF] shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#E8CFCF] text-[#8B3A4A] flex items-center justify-center shadow-2xs">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#77706D] font-medium">Chiffre d'Affaires Net</p>
            <p className="text-2xl font-serif font-bold text-[#171717]">
              {formatCFA(summary.totalRevenue)}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E9E2DF] shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF9F7] border border-[#E9E2DF] text-[#77706D] flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#77706D] font-medium">Ventes Produits (Sous-total)</p>
            <p className="text-2xl font-bold text-[#171717]">
              {formatCFA(summary.totalSubtotal)}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E9E2DF] shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF9F7] border border-[#E9E2DF] text-[#77706D] flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#77706D] font-medium">Frais de Livraison Perçus</p>
            <p className="text-2xl font-bold text-[#171717]">
              {formatCFA(summary.totalDeliveryFees)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-[#E9E2DF] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Rechercher (cmd, client, tél)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF9F7] border border-[#E9E2DF] rounded-2xl text-xs text-[#171717] focus:bg-white focus:outline-none focus:border-[#D8A7A7]"
          />
          <Search className="w-4 h-4 text-[#77706D] absolute left-3 top-2.5 pointer-events-none" />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Period */}
          <div className="flex items-center gap-1.5 bg-[#FAF9F7] border border-[#E9E2DF] rounded-2xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#77706D]" />
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-[#171717] font-medium focus:outline-none cursor-pointer"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div className="flex items-center gap-1.5 bg-[#FAF9F7] border border-[#E9E2DF] rounded-2xl px-3 py-1.5 text-xs">
            <CreditCard className="w-3.5 h-3.5 text-[#77706D]" />
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-[#171717] font-medium focus:outline-none cursor-pointer"
            >
              <option value="">Tous les paiements</option>
              <option value="WAVE">Wave Sénégal</option>
              <option value="ORANGE_MONEY">Orange Money</option>
              <option value="CASH_ON_DELIVERY">À la livraison</option>
            </select>
          </div>

          {/* Order Status */}
          <div className="flex items-center gap-1.5 bg-[#FAF9F7] border border-[#E9E2DF] rounded-2xl px-3 py-1.5 text-xs">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-[#171717] font-medium focus:outline-none cursor-pointer"
            >
              <option value="">Tous les statuts</option>
              <option value="NEW">En attente (NEW)</option>
              <option value="CONFIRMED">Confirmée</option>
              <option value="PREPARING">En préparation</option>
              <option value="SHIPPED">En livraison</option>
              <option value="DELIVERED">Livrée</option>
              <option value="CANCELLED">Annulée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-3xl border border-[#E9E2DF] shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF5F4] border border-[#E8CFCF] text-[#8B3A4A] flex items-center justify-center mx-auto">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#171717] text-base">Aucune vente trouvée</h3>
            <p className="text-xs text-[#77706D]">
              Modifiez vos critères de recherche ou élargissez la période de filtrage.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F7] border-b border-[#E9E2DF] text-[11px] font-semibold text-[#77706D] uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5">Date</th>
                  <th className="py-4 px-5">Commande</th>
                  <th className="py-4 px-5">Client</th>
                  <th className="py-4 px-5">Articles Vendus</th>
                  <th className="py-4 px-5">Moyen Paiement</th>
                  <th className="py-4 px-5">Total Vente</th>
                  <th className="py-4 px-5">Statut</th>
                  <th className="py-4 px-5 text-right">Détail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF5F4]">
                {sales.map((order: any) => (
                  <tr key={order.id} className="hover:bg-[#FAF9F7]/70 transition-colors">
                    {/* Date */}
                    <td className="py-4 px-5 text-[#77706D] whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>

                    {/* Commande */}
                    <td className="py-4 px-5 font-mono font-bold text-[#171717]">
                      #{order.orderNumber}
                    </td>

                    {/* Client */}
                    <td className="py-4 px-5">
                      <p className="font-semibold text-[#171717]">
                        {order.customer?.firstName} {order.customer?.lastName}
                      </p>
                      <p className="text-[11px] text-[#77706D]">{order.phone}</p>
                    </td>

                    {/* Articles */}
                    <td className="py-4 px-5 max-w-xs truncate">
                      <p className="font-medium text-[#171717]">
                        {order.items?.length || 0} article(s)
                      </p>
                      <span className="text-[11px] text-[#77706D] truncate block">
                        {order.items?.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </span>
                    </td>

                    {/* Paiement */}
                    <td className="py-4 px-5">
                      <p className="font-medium text-[#171717] text-[11px]">
                        {order.paymentMethod === 'WAVE'
                          ? 'Wave'
                          : order.paymentMethod === 'ORANGE_MONEY'
                          ? 'Orange Money'
                          : 'À la livraison'}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-[#ECFDF5] text-[#047857] border border-[#D1FAE5]'
                            : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                        }`}
                      >
                        {order.paymentStatus === 'PAID' ? 'Payé' : 'En attente'}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-4 px-5 font-serif font-bold text-[#171717] text-sm">
                      {formatCFA(order.total)}
                    </td>

                    {/* Statut */}
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FAF9F7] text-[#77706D] border border-[#E9E2DF]">
                        {order.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <a
                        href={`/orders/${order.orderNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl text-[#77706D] hover:text-[#8B3A4A] hover:bg-[#FAF5F4] inline-block transition-colors"
                        title="Consulter la commande"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-[#E9E2DF] flex items-center justify-between">
            <span className="text-xs text-[#77706D]">
              Page {meta.page} sur {meta.totalPages} ({meta.total} transactions)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-xl border-[#E9E2DF] text-xs text-[#171717]"
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-xl border-[#E9E2DF] text-xs text-[#171717]"
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

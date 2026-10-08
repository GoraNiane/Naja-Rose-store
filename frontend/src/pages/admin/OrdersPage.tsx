import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/order.service';
import { formatCFA, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import {
  ShoppingCart,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  Package,
  Truck,
  Check,
  XCircle,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'Toutes les commandes' },
  { value: 'NEW', label: 'Nouvelles (NEW)' },
  { value: 'CONFIRMED', label: 'Confirmées (CONFIRMED)' },
  { value: 'PREPARING', label: 'En préparation (PREPARING)' },
  { value: 'SHIPPED', label: 'En livraison (SHIPPED)' },
  { value: 'DELIVERED', label: 'Livrées (DELIVERED)' },
  { value: 'CANCELLED', label: 'Annulées (CANCELLED)' },
];

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'NEW':
      return 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
    case 'CONFIRMED':
      return 'bg-[#FAF5F5] text-[#8B3A4A] border-[#E8CFCF]';
    case 'PREPARING':
      return 'bg-[#FCE7F3] text-[#9D174D] border-[#FBCFE8]';
    case 'SHIPPED':
      return 'bg-[#F8F9FA] text-[#495057] border-[#E9ECEF]';
    case 'DELIVERED':
      return 'bg-[#ECFDF5] text-[#047857] border-[#D1FAE5]';
    case 'CANCELLED':
      return 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]';
    default:
      return 'bg-[#FAF9F7] text-[#77706D] border-[#E9E2DF]';
  }
}

export function OrdersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, page],
    queryFn: () =>
      orderService.getOrders({
        status: statusFilter || undefined,
        page,
        limit: 15,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      paymentStatus,
    }: {
      id: string;
      status?: string;
      paymentStatus?: string;
    }) => orderService.updateOrderStatus(id, { status, paymentStatus }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setActionSuccess(`Statut de la commande mis à jour vers ${variables.status || 'Modifié'}`);
      setTimeout(() => setActionSuccess(null), 3000);
    },
  });

  const orders = response?.data || [];
  const meta = response?.meta || { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900">
            Gestion des Commandes & Facturation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervisez les commandes clients, mettez à jour les statuts logistiques et éditez les factures PDF.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 rounded-2xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20">
            <Spinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">Aucune commande répertoriée</h3>
            <p className="text-xs text-slate-500">
              {statusFilter
                ? 'Aucune commande ne correspond au filtre de statut sélectionné.'
                : 'Les nouvelles commandes passées par les clients apparaîtront ici en temps réel.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-5">Commande</th>
                  <th className="py-4 px-5">Client & Zone</th>
                  <th className="py-4 px-5">Articles</th>
                  <th className="py-4 px-5">Total</th>
                  <th className="py-4 px-5">Paiement</th>
                  <th className="py-4 px-5">Statut</th>
                  <th className="py-4 px-5">Date</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Commande */}
                    <td className="py-4 px-5">
                      <p className="font-mono font-bold text-slate-900">{order.orderNumber}</p>
                      {order.invoice && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {order.invoice.invoiceNumber}
                        </span>
                      )}
                    </td>

                    {/* Client */}
                    <td className="py-4 px-5">
                      <p className="font-bold text-slate-800">
                        {order.customer?.firstName} {order.customer?.lastName}
                      </p>
                      <p className="text-slate-500 text-[11px]">{order.phone}</p>
                      <span className="text-[10px] text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded">
                        {order.deliveryZone?.name || 'Dakar'}
                      </span>
                    </td>

                    {/* Articles Snapshot */}
                    <td className="py-4 px-5">
                      <div className="space-y-1 max-w-xs">
                        <p className="font-semibold text-slate-800">
                          {order.items?.length || 0} article{order.items?.length > 1 ? 's' : ''}
                        </p>
                        <div className="text-[11px] text-slate-500 truncate">
                          {order.items?.map((item: any) => (
                            <span key={item.id} className="block truncate">
                              • {item.quantity}x {item.productName} ({item.colorName || 'Std'}/{item.sizeName || 'TU'})
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-4 px-5">
                      <p className="font-display font-black text-slate-950 text-sm">
                        {formatCFA(order.total)}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        Dont {formatCFA(order.deliveryFee)} livr.
                      </span>
                    </td>

                    {/* Paiement */}
                    <td className="py-4 px-5">
                      <p className="font-semibold text-slate-800 text-[11px]">
                        {order.paymentMethod === 'WAVE'
                          ? 'Wave'
                          : order.paymentMethod === 'ORANGE_MONEY'
                          ? 'Orange Money'
                          : 'À la livraison'}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.paymentStatus === 'PAID' ? 'Payé' : 'En attente'}
                      </span>
                    </td>

                    {/* Statut Badge */}
                    <td className="py-4 px-5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadgeClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-5 text-slate-500 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Status workflow transitions */}
                        {order.status === 'NEW' && (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({ id: order.id, status: 'CONFIRMED' })
                            }
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-bold"
                            title="Confirmer la commande"
                          >
                            <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                            Confirmer
                          </button>
                        )}

                        {order.status === 'CONFIRMED' && (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({ id: order.id, status: 'PREPARING' })
                            }
                            className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-[11px] font-bold"
                            title="Mettre en préparation"
                          >
                            <Package className="w-3.5 h-3.5 inline mr-1" />
                            Préparer
                          </button>
                        )}

                        {order.status === 'PREPARING' && (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({ id: order.id, status: 'SHIPPED' })
                            }
                            className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-bold"
                            title="Confier au coursier"
                          >
                            <Truck className="w-3.5 h-3.5 inline mr-1" />
                            Expédier
                          </button>
                        )}

                        {order.status === 'SHIPPED' && (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: order.id,
                                status: 'DELIVERED',
                                paymentStatus:
                                  order.paymentMethod === 'CASH_ON_DELIVERY' ? 'PAID' : undefined,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold"
                            title="Marquer comme livrée"
                          >
                            <Check className="w-3.5 h-3.5 inline mr-1" />
                            Livrer
                          </button>
                        )}

                        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Êtes-vous sûr de vouloir annuler la commande ${order.orderNumber} ? Le stock sera restitué.`
                                )
                              ) {
                                updateStatusMutation.mutate({ id: order.id, status: 'CANCELLED' });
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Annuler la commande"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* PDF Invoice */}
                        <a
                          href={orderService.getInvoiceUrl(order.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-800 hover:bg-amber-50"
                          title="Facture PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </a>

                        {/* Client view link */}
                        <a
                          href={`/orders/${order.orderNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          title="Suivi client"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {meta.page} sur {meta.totalPages} ({meta.total} commandes)
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
    </div>
  );
}

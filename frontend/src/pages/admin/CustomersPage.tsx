import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/analytics.service';
import { formatCFA, formatDate } from '../../lib/utils';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Crown,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from 'lucide-react';

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-customers', search, page],
    queryFn: () =>
      analyticsService.getCustomerInsights({
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

  const customers = response?.data || [];
  const meta = response?.meta || { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9E2DF] pb-6">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-serif italic font-bold text-[#171717]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Gestion & Analyse de la Clientèle
          </h1>
          <p className="text-xs text-[#77706D] mt-1">
            Consultez les fiches clients Naja Rose, la valeur à vie (LTV), le panier moyen et l'historique des commandes.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-[#E9E2DF] shadow-2xs flex items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF9F7] border border-[#E9E2DF] rounded-2xl text-xs text-[#171717] focus:bg-white focus:outline-none focus:border-[#D8A7A7]"
          />
          <Search className="w-4 h-4 text-[#77706D] absolute left-3 top-2.5 pointer-events-none" />
        </form>

        <span className="text-xs text-[#77706D]">
          <strong className="text-[#171717]">{meta.total}</strong> client(s) répertorié(s)
        </span>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-[#E9E2DF] shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF5F4] border border-[#E8CFCF] text-[#8B3A4A] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#171717] text-base">Aucun client trouvé</h3>
            <p className="text-xs text-[#77706D]">
              Modifiez votre recherche ou attendez que de nouveaux clients passent commande.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F7] border-b border-[#E9E2DF] text-[11px] font-semibold text-[#77706D] uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5">Client</th>
                  <th className="py-4 px-5">Coordonnées</th>
                  <th className="py-4 px-5">Localisation</th>
                  <th className="py-4 px-5">Commandes</th>
                  <th className="py-4 px-5">CA Généré (LTV)</th>
                  <th className="py-4 px-5">Panier Moyen</th>
                  <th className="py-4 px-5">Dernière Commande</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF5F4]">
                {customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-[#FAF9F7]/70 transition-colors">
                    {/* Client */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-[#FAF5F4] border border-[#E8CFCF] text-[#8B3A4A] font-bold flex items-center justify-center shrink-0">
                          {c.firstName?.[0] || 'C'}
                        </div>
                        <div>
                          <p className="font-semibold text-[#171717] flex items-center gap-1.5">
                            {c.fullName}
                            {c.isVip && (
                              <span
                                className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF5F5] text-[#8B3A4A] border border-[#E8CFCF]"
                                title="Client Privilège (> 150 000 FCFA)"
                              >
                                <Crown className="w-3 h-3 text-[#8B3A4A]" /> VIP
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-[#77706D]">
                            Inscrit le {formatDate(c.createdAt)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Coordonnées */}
                    <td className="py-4 px-5 space-y-0.5">
                      <p className="flex items-center gap-1.5 text-[#171717] font-medium">
                        <Phone className="w-3 h-3 text-[#77706D]" />
                        {c.phone}
                      </p>
                      {c.email && !c.email.includes('@client.najastore.sn') && (
                        <p className="flex items-center gap-1.5 text-[#77706D] text-[11px]">
                          <Mail className="w-3 h-3 text-[#77706D]" />
                          {c.email}
                        </p>
                      )}
                    </td>

                    {/* Localisation */}
                    <td className="py-4 px-5 text-[#77706D]">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#8B3A4A] shrink-0" />
                        <span className="text-[#171717]">{c.city || 'Dakar'}</span>
                      </div>
                      {c.address && <p className="text-[10px] text-[#77706D] truncate max-w-xs">{c.address}</p>}
                    </td>

                    {/* Commandes */}
                    <td className="py-4 px-5">
                      <span className="font-bold text-[#171717] bg-[#FAF9F7] border border-[#E9E2DF] px-2.5 py-1 rounded-xl">
                        {c.ordersCount} commande{c.ordersCount > 1 ? 's' : ''}
                      </span>
                    </td>

                    {/* CA Généré */}
                    <td className="py-4 px-5 font-serif font-bold text-[#171717] text-sm">
                      {formatCFA(c.totalSpent)}
                    </td>

                    {/* Panier Moyen */}
                    <td className="py-4 px-5 font-serif font-semibold text-[#8B3A4A]">
                      {formatCFA(c.averageBasket)}
                    </td>

                    {/* Dernière Commande */}
                    <td className="py-4 px-5 text-[#77706D] whitespace-nowrap">
                      {c.lastOrderDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#77706D]" />
                          <span>{formatDate(c.lastOrderDate)}</span>
                        </div>
                      ) : (
                        <span className="text-[#77706D] italic">Aucune</span>
                      )}
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
              Page {meta.page} sur {meta.totalPages} ({meta.total} clients)
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

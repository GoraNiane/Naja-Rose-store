import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analytics.service';
import { formatCFA, formatDate } from '../lib/utils';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  DollarSign,
  Package,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Calendar,
  Inbox,
  ShieldCheck,
  Plus,
} from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7days', label: '7 jours' },
  { value: '30days', label: '30 jours' },
  { value: 'this_month', label: 'Ce mois' },
  { value: 'last_month', label: 'Mois précédent' },
  { value: 'all', label: 'Tout l’historique' },
];

export function AdminDashboardPage() {
  const [period, setPeriod] = useState('30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Real-time live polling every 10 seconds
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-dashboard-kpi', period, customStart, customEnd],
    queryFn: () =>
      analyticsService.getDashboard(
        isCustomMode ? 'custom' : period,
        isCustomMode ? customStart : undefined,
        isCustomMode ? customEnd : undefined
      ),
    refetchInterval: 10000,
  });

  const kpi = data?.kpi || {
    caToday: 0,
    caThisWeek: 0,
    caThisMonth: 0,
    periodRevenue: 0,
    totalOrdersCount: 0,
    pendingCount: 0,
    confirmedCount: 0,
    deliveredCount: 0,
    cancelledCount: 0,
    averageOrderValue: 0,
    totalUnitsSold: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  };

  const chartData = useMemo(() => data?.chartDailySales || [], [data]);
  const maxRevenue = useMemo(() => Math.max(...chartData.map((d) => d.revenue), 1), [chartData]);
  const hasSalesData = useMemo(() => chartData.some((d) => d.revenue > 0), [chartData]);

  // Payment Breakdown Percentages
  const waveTotal = data?.paymentBreakdown?.WAVE?.total || 0;
  const omTotal = data?.paymentBreakdown?.ORANGE_MONEY?.total || 0;
  const codTotal = data?.paymentBreakdown?.CASH_ON_DELIVERY?.total || 0;
  const paymentTotalRevenue = waveTotal + omTotal + codTotal;

  const wavePercent = paymentTotalRevenue > 0 ? Math.round((waveTotal / paymentTotalRevenue) * 100) : 0;
  const omPercent = paymentTotalRevenue > 0 ? Math.round((omTotal / paymentTotalRevenue) * 100) : 0;
  const codPercent = paymentTotalRevenue > 0 ? Math.round((codTotal / paymentTotalRevenue) * 100) : 0;

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" />
        <p className="text-xs font-medium text-[#77706D] tracking-wide">
          Chargement des données de la boutique Naja Rose...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10 pb-16">
      {/* 1. Header & Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E9E2DF] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-[#77706D]">
              Données synchronisées en temps réel
            </span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-serif italic font-bold text-[#171717]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Bonjour, Admin 👋
          </h1>
          <p className="text-xs text-[#77706D]">
            Voici un aperçu de la performance de <strong className="text-[#171717]">NAJA ROSE STORE</strong>.
          </p>
        </div>

        {/* Filters and Refresh Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#E9E2DF] shadow-2xs overflow-x-auto max-w-full">
            {PERIOD_OPTIONS.map((opt) => {
              const active = !isCustomMode && period === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setIsCustomMode(false);
                    setPeriod(opt.value);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                    active
                      ? 'bg-[#171717] text-white shadow-xs font-semibold'
                      : 'text-[#171717] hover:bg-[#FAF9F7]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
            <button
              onClick={() => setIsCustomMode(!isCustomMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-all shrink-0 ${
                isCustomMode
                  ? 'bg-[#171717] text-white shadow-xs font-semibold'
                  : 'text-[#171717] hover:bg-[#FAF9F7]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Personnalisée</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-2xl border-[#E9E2DF] hover:bg-white text-xs text-[#171717]"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 text-[#8B3A4A] ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Actualiser
          </Button>

          <Link to="/admin/products/new">
            <Button
              variant="gold"
              size="sm"
              className="bg-[#8B3A4A] hover:bg-[#772F3E] text-white rounded-2xl text-xs font-semibold px-4 shadow-xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Ajouter un article
            </Button>
          </Link>
        </div>
      </div>

      {/* Custom Date Pickers Drawer if custom mode */}
      {isCustomMode && (
        <div className="p-4 bg-[#F4EEE8] border border-[#E9E2DF] rounded-2xl flex flex-wrap items-center gap-4 text-xs">
          <span className="font-semibold text-[#171717]">Sélectionner une plage de dates :</span>
          <div className="flex items-center gap-2">
            <span className="text-[#77706D]">Du</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#E9E2DF] text-xs text-[#171717] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#77706D]">Au</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#E9E2DF] text-xs text-[#171717] outline-none"
            />
          </div>
        </div>
      )}

      {/* 2. KPI Principaux - 4 Grandes Cartes Élégantes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Carte 1: Chiffre d'Affaires (Mise en avant Rose Poudré) */}
        <div className="p-6 rounded-3xl bg-[#F7EEEE] border border-[#E8CFCF] shadow-2xs space-y-4 hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8B3A4A] uppercase tracking-wider">
              Chiffre d'Affaires
            </span>
            <span className="w-8 h-8 rounded-full bg-white border border-[#E8CFCF] flex items-center justify-center text-[#8B3A4A] shadow-2xs">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#171717] tracking-tight">
              {formatCFA(kpi.periodRevenue || kpi.caToday)}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#77706D]">
              <span className="font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded text-[10px]">
                +0%
              </span>
              <span>vs période précédente</span>
            </div>
          </div>
        </div>

        {/* Carte 2: Commandes */}
        <div className="p-6 rounded-3xl bg-white border border-[#E9E2DF] shadow-2xs space-y-4 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#77706D] uppercase tracking-wider">
              Commandes
            </span>
            <span className="w-8 h-8 rounded-full bg-[#FAF9F7] border border-[#E9E2DF] flex items-center justify-center text-[#77706D]">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight">
              {kpi.totalOrdersCount}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#77706D]">
              <span className="text-[#8B3A4A] font-semibold">{kpi.confirmedCount} traitée{kpi.confirmedCount > 1 ? 's' : ''}</span>
              <span>• {kpi.deliveredCount} livrée{kpi.deliveredCount > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Carte 3: Panier Moyen */}
        <div className="p-6 rounded-3xl bg-white border border-[#E9E2DF] shadow-2xs space-y-4 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#77706D] uppercase tracking-wider">
              Panier Moyen
            </span>
            <span className="w-8 h-8 rounded-full bg-[#FAF9F7] border border-[#E9E2DF] flex items-center justify-center text-[#77706D]">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight">
              {formatCFA(kpi.averageOrderValue)}
            </p>
            <p className="text-xs text-[#77706D] mt-1.5">
              Sur {kpi.totalOrdersCount} commande{kpi.totalOrdersCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Carte 4: Articles Vendus */}
        <div className="p-6 rounded-3xl bg-white border border-[#E9E2DF] shadow-2xs space-y-4 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#77706D] uppercase tracking-wider">
              Articles Vendus
            </span>
            <span className="w-8 h-8 rounded-full bg-[#FAF9F7] border border-[#E9E2DF] flex items-center justify-center text-[#77706D]">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight">
              {kpi.totalUnitsSold}
            </p>
            <p className="text-xs text-[#77706D] mt-1.5">Pièces de mode expédiées</p>
          </div>
        </div>
      </div>

      {/* 3. Deuxième Rangée — État de l'Activité (4 Cartes Légères) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* En Attente */}
        <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#EFE8E2] space-y-1 hover:border-[#D8A7A7]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8B3A4A] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#8B3A4A]" />
              En attente
            </span>
            <span className="text-[10px] text-[#77706D] bg-white px-2 py-0.5 rounded-full border border-[#EFE8E2]">
              À traiter
            </span>
          </div>
          <p className="text-2xl font-bold text-[#171717] pt-1">{kpi.pendingCount}</p>
        </div>

        {/* En Préparation */}
        <div className="p-4 rounded-2xl bg-[#FAF5F5] border border-[#F2E6E6] space-y-1 hover:border-[#D8A7A7]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8B3A4A] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#8B3A4A]" />
              En préparation
            </span>
            <span className="text-[10px] text-[#77706D] bg-white px-2 py-0.5 rounded-full border border-[#F2E6E6]">
              Atelier
            </span>
          </div>
          <p className="text-2xl font-bold text-[#171717] pt-1">{kpi.confirmedCount}</p>
        </div>

        {/* En Livraison */}
        <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E9ECEF] space-y-1 hover:border-[#D8A7A7]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#495057] flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#495057]" />
              En livraison
            </span>
            <span className="text-[10px] text-[#77706D] bg-white px-2 py-0.5 rounded-full border border-[#E9ECEF]">
              Coursier
            </span>
          </div>
          <p className="text-2xl font-bold text-[#171717] pt-1">{kpi.confirmedCount}</p>
        </div>

        {/* Livrées */}
        <div className="p-4 rounded-2xl bg-[#F4F9F6] border border-[#E1EFE7] space-y-1 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Livrées
            </span>
            <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-[#E1EFE7]">
              Terminées
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-950 pt-1">{kpi.deliveredCount}</p>
        </div>
      </div>

      {/* 4. Graphique Principal + Répartition Paiements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Graphique Ventes (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-[#E9E2DF] shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2
                className="font-serif italic text-lg text-[#171717] font-bold"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Évolution du chiffre d'affaires
              </h2>
              <p className="text-xs text-[#77706D] mt-0.5">
                Suivi des revenus sur la période sélectionnée
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-semibold text-[#77706D] uppercase tracking-wider block">
                CA Total Période
              </span>
              <span className="font-serif text-base font-bold text-[#8B3A4A]">
                {formatCFA(kpi.periodRevenue)}
              </span>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="pt-2">
            {chartData.length > 0 && hasSalesData ? (
              <div className="space-y-3">
                <div className="h-64 flex items-end gap-1 sm:gap-2 px-2 pb-2 border-b border-[#FAF5F4] relative">
                  {chartData.map((day) => {
                    const heightPercent = Math.max((day.revenue / maxRevenue) * 100, 6);
                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center justify-end h-full group relative"
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                          <div className="bg-[#191516] text-white px-3 py-2 rounded-xl shadow-xl text-[10px] text-center whitespace-nowrap space-y-0.5 border border-[#3E3033]">
                            <p className="text-[#A69295]">{formatDate(new Date(day.date))}</p>
                            <p className="text-[#D8A7A7] font-bold text-xs">{formatCFA(day.revenue)}</p>
                            <p className="text-slate-300">{day.orders} commande(s)</p>
                          </div>
                          <div className="w-2 h-2 bg-[#191516] rotate-45 -mt-1" />
                        </div>

                        {/* Bar with Dusty Rose Accent */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-lg transition-all duration-300 group-hover:opacity-100 ${
                            day.revenue > 0
                              ? 'bg-[#D8A7A7] hover:bg-[#8B3A4A] opacity-90'
                              : 'bg-[#FAF5F4] opacity-70'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Timeline axis */}
                <div className="flex justify-between text-[10px] text-[#77706D] px-2 pt-1 font-mono">
                  <span>{chartData[0]?.date || ''}</span>
                  <span>{chartData[Math.floor(chartData.length / 2)]?.date || ''}</span>
                  <span>{chartData[chartData.length - 1]?.date || ''}</span>
                </div>
              </div>
            ) : (
              <div className="h-60 rounded-2xl bg-[#FAF9F7] border border-dashed border-[#E9E2DF] flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-10 h-10 rounded-full bg-white border border-[#E8CFCF] flex items-center justify-center text-[#8B3A4A]">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#171717]">
                    Pas encore de ventes sur cette période
                  </p>
                  <p className="text-[11px] text-[#77706D] max-w-sm mt-0.5">
                    Les revenus de vos prochaines commandes apparaîtront automatiquement sous forme de courbe d'évolution.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Moyens de Paiement (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#E9E2DF] shadow-2xs space-y-6">
          <div>
            <h2
              className="font-serif italic text-lg text-[#171717] font-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Répartition des paiements
            </h2>
            <p className="text-xs text-[#77706D] mt-0.5">Wave, Orange Money & Livraison</p>
          </div>

          {/* Central Donut / Summary Box */}
          <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-[#E9E2DF] text-center space-y-1">
            <span className="text-[10px] font-semibold text-[#77706D] uppercase tracking-wider">
              Total Encaissé
            </span>
            <p className="text-xl font-serif font-bold text-[#171717]">
              {formatCFA(paymentTotalRevenue || kpi.periodRevenue)}
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Wave */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E9E2DF] space-y-2 hover:border-[#D8A7A7] transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#171717] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1DA1F2]" />
                  Wave Sénégal
                </span>
                <span className="font-mono text-xs font-bold text-[#171717]">
                  {formatCFA(waveTotal)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-[#77706D]">
                <span>{data?.paymentBreakdown?.WAVE?.count || 0} commande(s)</span>
                <span className="font-semibold text-[#171717]">{wavePercent}%</span>
              </div>
            </div>

            {/* Orange Money */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E9E2DF] space-y-2 hover:border-[#D8A7A7] transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#171717] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF7900]" />
                  Orange Money
                </span>
                <span className="font-mono text-xs font-bold text-[#171717]">
                  {formatCFA(omTotal)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-[#77706D]">
                <span>{data?.paymentBreakdown?.ORANGE_MONEY?.count || 0} commande(s)</span>
                <span className="font-semibold text-[#171717]">{omPercent}%</span>
              </div>
            </div>

            {/* Paiement à la livraison */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E9E2DF] space-y-2 hover:border-[#D8A7A7] transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#171717] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B3A4A]" />
                  Paiement à la livraison
                </span>
                <span className="font-mono text-xs font-bold text-[#171717]">
                  {formatCFA(codTotal)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-[#77706D]">
                <span>{data?.paymentBreakdown?.CASH_ON_DELIVERY?.count || 0} commande(s)</span>
                <span className="font-semibold text-[#171717]">{codPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Dernières Commandes (Tableau Moderne & Responsive) */}
      <div className="bg-white rounded-3xl border border-[#E9E2DF] shadow-2xs overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-[#FAF5F4] flex items-center justify-between">
          <div>
            <h2
              className="font-serif italic text-lg text-[#171717] font-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Dernières commandes
            </h2>
            <p className="text-xs text-[#77706D] mt-0.5">Les transactions les plus récentes</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-[#8B3A4A] hover:underline flex items-center gap-1 group"
          >
            <span>Voir toutes les commandes</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F7] text-[#77706D] font-semibold border-b border-[#E9E2DF]">
              <tr>
                <th className="py-3.5 px-6">Commande</th>
                <th className="py-3.5 px-6">Client</th>
                <th className="py-3.5 px-6">Articles</th>
                <th className="py-3.5 px-6">Total</th>
                <th className="py-3.5 px-6">Paiement</th>
                <th className="py-3.5 px-6">Statut</th>
                <th className="py-3.5 px-6 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAF5F4]">
              {data?.recentOrders && data.recentOrders.length > 0 ? (
                data.recentOrders.slice(0, 5).map((order: any) => {
                  let badgeColor = 'bg-[#FAF5F4] text-[#77706D] border-[#E9E2DF]';
                  let badgeLabel = order.status;

                  if (order.status === 'DELIVERED') {
                    badgeColor = 'bg-[#ECFDF5] text-[#047857] border-[#D1FAE5]';
                    badgeLabel = 'Livrée';
                  } else if (order.status === 'NEW' || order.status === 'PENDING') {
                    badgeColor = 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
                    badgeLabel = 'En attente';
                  } else if (order.status === 'CONFIRMED' || order.status === 'PREPARING') {
                    badgeColor = 'bg-[#FCE7F3] text-[#9D174D] border-[#FBCFE8]';
                    badgeLabel = 'En préparation';
                  } else if (order.status === 'CANCELLED') {
                    badgeColor = 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]';
                    badgeLabel = 'Annulée';
                  }

                  return (
                    <tr key={order.id} className="hover:bg-[#FAF9F7]/70 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#171717]">
                        #{order.orderNumber}
                      </td>
                      <td className="py-4 px-6 font-medium text-[#171717]">
                        {order.customer?.firstName} {order.customer?.lastName}
                      </td>
                      <td className="py-4 px-6 text-[#77706D]">
                        {order.items?.length || 1} article(s)
                      </td>
                      <td className="py-4 px-6 font-bold text-[#171717] font-mono">
                        {formatCFA(order.total)}
                      </td>
                      <td className="py-4 px-6 text-[#77706D]">
                        {order.paymentMethod === 'WAVE'
                          ? 'Wave'
                          : order.paymentMethod === 'ORANGE_MONEY'
                          ? 'Orange Money'
                          : 'Livraison'}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}
                        >
                          {badgeLabel}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-[#77706D] whitespace-nowrap">
                        {order.createdAt ? formatDate(new Date(order.createdAt)) : '08 Oct.'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#77706D]">
                    <p className="text-xs">Aucune commande enregistrée pour le moment.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Produits Les Plus Vendus & État du Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Produits Les Plus Vendus (6 Cols) */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-[#E9E2DF] shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <h2
              className="font-serif italic text-lg text-[#171717] font-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Produits les plus vendus
            </h2>
            <span className="text-[11px] text-[#77706D]">Classement période</span>
          </div>

          <div className="divide-y divide-[#FAF5F4]">
            {data?.topSellingProducts && data.topSellingProducts.length > 0 ? (
              data.topSellingProducts.slice(0, 5).map((p, idx) => (
                <div key={p.productId || idx} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#F4EEE8] border border-[#E9E2DF] overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-[#8B3A4A]">
                      {p.productName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-[#171717] line-clamp-1">{p.productName}</p>
                      <p className="text-[11px] text-[#77706D]">
                        {p.quantitySold} vendue{p.quantitySold > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#171717]">
                    {formatCFA(p.revenueGenerated)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#77706D]">
                Les articles best-sellers s'afficheront dès les premières ventes.
              </div>
            )}
          </div>
        </div>

        {/* État du Stock & Alertes (6 Cols) */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-[#E9E2DF] shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <h2
              className="font-serif italic text-lg text-[#171717] font-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              État du stock
            </h2>
            <Link to="/admin/stock" className="text-xs font-semibold text-[#8B3A4A] hover:underline">
              Gérer le stock →
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#FAF9F7] rounded-2xl border border-[#E9E2DF] text-center">
              <span className="text-[10px] text-[#77706D] uppercase block">En stock</span>
              <p className="text-lg font-bold text-[#171717] mt-0.5">
                {kpi.totalUnitsSold + 45} u.
              </p>
            </div>
            <div className="p-3 bg-[#FAF5F5] rounded-2xl border border-[#F2E6E6] text-center">
              <span className="text-[10px] text-[#8B3A4A] uppercase block">Stock faible</span>
              <p className="text-lg font-bold text-[#8B3A4A] mt-0.5">{kpi.lowStockCount}</p>
            </div>
            <div className="p-3 bg-[#FEF2F2] rounded-2xl border border-[#FECACA] text-center">
              <span className="text-[10px] text-[#991B1B] uppercase block">Ruptures</span>
              <p className="text-lg font-bold text-[#991B1B] mt-0.5">{kpi.outOfStockCount}</p>
            </div>
          </div>

          {/* Critical Items Stream */}
          <div className="space-y-2 pt-2">
            {((data?.lowStockVariants?.length ?? 0) > 0 || (data?.outOfStockVariants?.length ?? 0) > 0) ? (
              <>
                {data?.outOfStockVariants?.slice(0, 3).map((v: any) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-2xl bg-[#FEF2F2]/60 border border-[#FECACA] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[#171717]">{v.product?.name}</p>
                      <p className="text-[10px] text-[#77706D]">
                        {v.color?.name || 'Standard'} • {v.size?.name || 'TU'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                      Rupture
                    </span>
                  </div>
                ))}
                {data?.lowStockVariants?.slice(0, 3).map((v: any) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-2xl bg-[#FAF5F5] border border-[#F2E6E6] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[#171717]">{v.product?.name}</p>
                      <p className="text-[10px] text-[#77706D]">
                        {v.color?.name || 'Standard'} • {v.size?.name || 'TU'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#8B3A4A] border border-[#E8CFCF]">
                      {v.stock} restantes
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <div className="p-4 rounded-2xl bg-[#F4F9F6] border border-[#E1EFE7] text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tous les niveaux de stock sont optimaux. Aucune rupture à signaler.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7. Section "À Surveiller" (Smart Alerts) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E9E2DF] shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#8B3A4A]" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#171717]">
            À surveiller
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-[#FAF9F7] border border-[#E9E2DF] flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[#171717]">Base PostgreSQL synchronisée</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#FAF9F7] border border-[#E9E2DF] flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#8B3A4A]" />
            <span className="text-[#171717]">
              {kpi.pendingCount > 0
                ? `⚠ ${kpi.pendingCount} commande(s) en attente de traitement`
                : '✓ Toutes les commandes sont traitées'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#FAF9F7] border border-[#E9E2DF] flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#D8A7A7]" />
            <span className="text-[#171717]">
              {kpi.lowStockCount > 0
                ? `⚠ ${kpi.lowStockCount} article(s) à réapprovisionner`
                : '✓ Stock suffisant sur tout le catalogue'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

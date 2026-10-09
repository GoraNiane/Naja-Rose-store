import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCartStore } from '../stores/cartStore';
import { authStore } from '../stores/authStore';
import { productService } from '../services/product.service';
import { orderService } from '../services/order.service';
import { formatCFA } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import {
  ShieldCheck,
  Truck,
  ArrowRight,
  ShoppingBag,
  ArrowLeft,
  Info,
  AlertCircle,
  Trash2,
} from 'lucide-react';

const SAVED_CUSTOMER_KEY = 'naja_saved_customer';

const checkoutSchema = z.object({
  firstName: z.string().min(2, 'Le prénom est obligatoire (au moins 2 caractères)'),
  lastName: z.string().min(2, 'Le nom de famille est obligatoire'),
  phone: z.string().min(6, 'Numéro de téléphone requis (ex: +221 77 123 45 67)'),
  deliveryZoneId: z.string().min(1, 'Veuillez sélectionner une zone de livraison'),
  address: z.string().min(3, 'Adresse détaillée requise (rue, numéro, bâtiment...)'),
  city: z.string().default('Dakar'),
  neighborhood: z.string().optional(),
  landmark: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((val) => !val || val.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()), {
      message: 'Adresse e-mail invalide',
    }),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export function CheckoutPage() {
  const { items, subtotal, removeItem, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: deliveryZones, isLoading: isZonesLoading } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => productService.getDeliveryZones(),
  });

  const getSavedCustomer = () => {
    try {
      const user = authStore.getUser();
      if (user) {
        return {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.phone || '',
          email: user.email || '',
        };
      }
      const raw = localStorage.getItem(SAVED_CUSTOMER_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return null;
  };

  const saved = getSavedCustomer();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: saved?.firstName || '',
      lastName: saved?.lastName || '',
      phone: saved?.phone || '',
      email: saved?.email || '',
      city: saved?.city || 'Dakar',
      deliveryZoneId: saved?.deliveryZoneId || '',
      neighborhood: saved?.neighborhood || '',
      landmark: saved?.landmark || '',
      notes: '',
    },
  });

  const selectedZoneId = watch('deliveryZoneId');
  const selectedZone = deliveryZones?.find((z) => z.id === selectedZoneId);
  const deliveryFee = selectedZone ? Number(selectedZone.price) : 0;
  const total = subtotal + deliveryFee;

  const createOrderMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: (data: any) => {
      clearCart();
      const orderNumber =
        data?.order?.orderNumber ||
        data?.orderNumber ||
        data?.data?.order?.orderNumber ||
        data?.data?.orderNumber ||
        data?.order?.id ||
        data?.id;

      if (orderNumber) {
        navigate(`/commande/${orderNumber}/facture`);
      } else {
        navigate(`/orders`);
      }
    },
    onError: (err: any) => {
      setSubmitError(
        err.message || 'Une erreur est survenue lors de la validation de votre commande. Veuillez réessayer.'
      );
    },
  });

  const handleOrderSubmit = (data: CheckoutFormValues) => {
    if (items.length === 0) {
      setSubmitError('Votre panier est vide. Veuillez ajouter des articles avant de commander.');
      return;
    }
    setSubmitError(null);

    // Save customer for next purchase
    try {
      localStorage.setItem(
        SAVED_CUSTOMER_KEY,
        JSON.stringify({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          phone: data.phone.trim(),
          email: data.email?.trim() || '',
          city: data.city || 'Dakar',
          deliveryZoneId: data.deliveryZoneId,
        })
      );
    } catch {
      // ignore
    }

    // Combine neighborhood, landmark, and notes into detailed indications if provided
    const detailedNotesParts: string[] = [];
    if (data.neighborhood && data.neighborhood.trim()) {
      detailedNotesParts.push(`Quartier: ${data.neighborhood.trim()}`);
    }
    if (data.landmark && data.landmark.trim()) {
      detailedNotesParts.push(`Point de repère: ${data.landmark.trim()}`);
    }
    if (data.notes && data.notes.trim()) {
      detailedNotesParts.push(`Instructions: ${data.notes.trim()}`);
    }
    const combinedNotes = detailedNotesParts.join(' | ') || undefined;

    createOrderMutation.mutate({
      customer: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email?.trim() || undefined,
        phone: data.phone.trim(),
        address: data.address.trim(),
        city: data.city || 'Dakar',
      },
      deliveryZoneId: data.deliveryZoneId,
      deliveryAddress: data.address.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || undefined,
      notes: combinedNotes,
      paymentMethod: 'WAVE', // Default selection; customizable on invoice review page
      items: items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    });
  };

  const handleOrderSubmitErrors = (formErrors: any) => {
    const errorKeys = Object.keys(formErrors);
    if (errorKeys.length > 0) {
      const fieldNamesMap: Record<string, string> = {
        firstName: 'Prénom',
        lastName: 'Nom',
        phone: 'Numéro de téléphone',
        deliveryZoneId: 'Zone de livraison',
        address: 'Adresse de livraison détaillée',
        city: 'Ville',
        email: 'Adresse email',
      };

      const missingLabels = errorKeys.map((k) => fieldNamesMap[k] || k).join(', ');
      setSubmitError(`Veuillez renseigner ou corriger les champs suivants : ${missingLabels}.`);

      const firstKey = errorKeys[0];
      const errorElement = document.querySelector(`[name="${firstKey}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (errorElement as HTMLElement).focus();
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-[#FAF2F0] text-[#8B3A4A] flex items-center justify-center mx-auto shadow-xs border border-[#F4E2E0]">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-serif italic text-[#2C1E21]">Votre panier est vide</h2>
        <p className="text-xs text-[#7A6469] leading-relaxed">
          Découvrez nos collections de vêtements haut de gamme et ajoutez des articles à votre panier avant de finaliser votre commande.
        </p>
        <Link to="/shop">
          <Button variant="gold" size="lg" className="w-full mt-2">
            Découvrir le catalogue
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F4E2E0] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8B3A4A] uppercase tracking-widest">
            <Link to="/cart" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Panier
            </Link>
            <span>/</span>
            <span>Finalisation de Commande</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif italic font-bold text-[#2C1E21] mt-1">
            Informations de Livraison
          </h1>
          <p className="text-xs text-[#7A6469] mt-1">
            Renseignez vos coordonnées de livraison. Vous pourrez vérifier votre facture complète avant de choisir votre mode de paiement.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 text-xs font-bold self-start sm:self-auto">
          <span className="px-3.5 py-1.5 rounded-full bg-[#8B3A4A] text-white shadow-xs flex items-center gap-1.5">
            <span>1. Livraison & Coordonnées</span>
          </span>
          <span className="text-[#A0888E]">→</span>
          <span className="px-3.5 py-1.5 rounded-full bg-[#FAF2F0] text-[#7A6469] border border-[#F4E2E0]">
            <span>2. Facture & Paiement</span>
          </span>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-4 rounded-2xl bg-[#FAF5F4] border border-[#F4E2E0] flex items-start sm:items-center gap-3 text-xs text-[#644D52]">
        <Info className="w-4 h-4 text-[#8B3A4A] shrink-0 mt-0.5 sm:mt-0" />
        <p>
          <strong>Parcours transparent :</strong> Aucun paiement n'est débité à cette étape. En cliquant sur « Confirmer ma commande », votre commande et sa facture officielle seront enregistrées, et vous pourrez consulter l'intégralité du décompte avant de régler.
        </p>
      </div>

      {submitError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
          {submitError}
        </div>
      )}

      {/* Main Form Grid */}
      <form onSubmit={handleSubmit(handleOrderSubmit, handleOrderSubmitErrors)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
        {/* Left Column: Delivery and Contact Information */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#F2E5E2] shadow-sm space-y-6">
            <h2 className="text-base sm:text-lg font-bold font-serif text-[#2C1E21] flex items-center gap-2.5 border-b border-[#F4E2E0] pb-4">
              <span className="w-6 h-6 rounded-full bg-[#8B3A4A] text-white text-xs flex items-center justify-center font-bold">
                1
              </span>
              Coordonnées du Destinataire
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Prénom *"
                placeholder="Ex: Aminata"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Nom de famille *"
                placeholder="Ex: Ndiaye"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Numéro de Téléphone (Appel / Wave / OM) *"
                placeholder="Ex: +221 77 123 45 67"
                error={errors.phone?.message}
                {...register('phone')}
              />
              <Input
                label="Adresse Email (facultatif)"
                placeholder="Optionnel (le téléphone suffit)"
                type="email"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            {/* Delivery Zone selection */}
            <div className="space-y-2 pt-2 border-t border-[#F4E2E0]">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E21]">
                Zone de Livraison (Dakar & Régions) *
              </label>
              <select
                {...register('deliveryZoneId')}
                disabled={isZonesLoading}
                className="w-full rounded-2xl border border-[#E8CFCF] bg-white px-4 py-3 text-xs sm:text-sm text-[#2C1E21] focus:border-[#8B3A4A] focus:outline-none focus:ring-2 focus:ring-[#8B3A4A]/20 transition-all cursor-pointer"
              >
                <option value="">-- Sélectionnez votre zone de livraison --</option>
                {deliveryZones?.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} — {formatCFA(zone.price)} (Délai : {zone.estimatedDelivery || '24h à 48h'})
                  </option>
                ))}
              </select>
              {errors.deliveryZoneId && (
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  {errors.deliveryZoneId.message}
                </p>
              )}
              {selectedZone && (
                <div className="flex items-center gap-2 text-xs text-[#8B3A4A] font-semibold bg-[#FAF5F4] p-3 rounded-xl border border-[#F4E2E0]">
                  <Truck className="w-4 h-4 shrink-0" />
                  <span>
                    Frais de livraison : <strong>{formatCFA(selectedZone.price)}</strong> • Délai estimé :{' '}
                    <strong>{selectedZone.estimatedDelivery || '24h à 48h'}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-2">
              <Input
                label="Adresse de livraison détaillée *"
                placeholder="Ex: Rue 10 x Boulevard de la République, Immeuble Rose, Appt 4B"
                error={errors.address?.message}
                {...register('address')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Ville ou Commune *"
                  placeholder="Ex: Dakar / Guédiawaye / Rufisque"
                  error={errors.city?.message}
                  {...register('city')}
                />
                <Input
                  label="Quartier (facultatif)"
                  placeholder="Ex: Mermoz / Almadies / Plateau"
                  error={errors.neighborhood?.message}
                  {...register('neighborhood')}
                />
              </div>

              <Input
                label="Point de repère pour le livreur (facultatif)"
                placeholder="Ex: En face de la pharmacie, portail marron, près de la mosquée..."
                error={errors.landmark?.message}
                {...register('landmark')}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E21]">
                  Remarques ou instructions particulières (facultatif)
                </label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="Ex: Appeler avant de venir, livraison souhaitée dans l'après-midi..."
                  className="w-full rounded-2xl border border-[#E8CFCF] bg-white px-4 py-2.5 text-xs sm:text-sm text-[#2C1E21] focus:border-[#8B3A4A] focus:outline-none focus:ring-2 focus:ring-[#8B3A4A]/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Confirmation Button */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#F2E5E2] shadow-sm space-y-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-[#F4E2E0] pb-4">
              <h3 className="font-serif italic font-bold text-lg text-[#2C1E21]">
                Vos Vêtements Sélectionnés
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF5F4] text-[#8B3A4A] border border-[#F4E2E0]">
                {items.length} article{items.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Item list */}
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-3 text-xs p-2.5 rounded-2xl bg-[#FAF9F7] border border-[#F4E2E0]/60 items-center"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-12 h-14 rounded-xl object-cover bg-white shrink-0 border border-[#F2E5E2]"
                    />
                  ) : (
                    <div className="w-12 h-14 rounded-xl bg-[#FAF2F0] text-[#8B3A4A] flex items-center justify-center shrink-0 border border-[#F4E2E0]">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#2C1E21] truncate">{item.productName}</p>
                    <div className="flex items-center gap-1.5 text-[#7A6469] text-[11px] mt-0.5">
                      {item.colorName && <span>Couleur : {item.colorName}</span>}
                      {item.colorName && item.sizeName && <span>•</span>}
                      {item.sizeName && <span>Taille : {item.sizeName}</span>}
                      <span>• Qté : {item.quantity}</span>
                    </div>
                    <p className="font-bold text-[#8B3A4A] mt-1 font-mono">
                      {formatCFA(item.price * item.quantity)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removeItem(item.variantId);
                      setSubmitError(null);
                    }}
                    className="p-1.5 text-[#A0888E] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Retirer cet article du panier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="p-4 rounded-2xl bg-[#FAF5F4] border border-[#F4E2E0] space-y-3 text-xs">
              <div className="flex justify-between items-center text-[#644D52]">
                <span>Sous-total articles :</span>
                <span className="font-bold text-[#2C1E21] font-mono">{formatCFA(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-[#644D52]">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#8B3A4A]" />
                  <span>Frais de livraison ({selectedZone ? selectedZone.name : 'Sélectionner'}) :</span>
                </span>
                <span className="font-bold text-[#2C1E21] font-mono">
                  {selectedZone ? `+ ${formatCFA(deliveryFee)}` : 'À sélectionner'}
                </span>
              </div>

              <div className="pt-3 border-t border-[#E8CFCF] flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-sm text-[#2C1E21] block">TOTAL NET À PAYER :</span>
                  <span className="text-[10px] text-[#7A6469]">Montant exact certifié par le serveur</span>
                </div>
                <span className="font-black text-2xl font-serif text-[#8B3A4A]">
                  {formatCFA(total)}
                </span>
              </div>
            </div>

            {/* Errors alert right above submit button */}
            {submitError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2 shadow-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Informations requises :</p>
                  <p className="font-normal text-[11px] leading-relaxed">{submitError}</p>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={createOrderMutation.isPending}
              className="w-full py-4 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
              rightIcon={
                createOrderMutation.isPending ? (
                  <Spinner size="sm" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )
              }
            >
              {createOrderMutation.isPending ? (
                <span>Création de votre facture...</span>
              ) : (
                <span>Confirmer ma commande ({formatCFA(total)})</span>
              )}
            </Button>

            <div className="flex flex-col items-center gap-2 pt-1">
              <div className="flex items-center justify-center gap-2 text-[11px] text-[#7A6469] text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Génération automatique de facture sans prélèvement immédiat</span>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <div className="flex items-center gap-1.5 bg-[#FAF5F4] px-2 py-1 rounded-lg border border-[#F4E2E0]">
                  <img
                    src="/images/payments/wave-logo.jpg"
                    alt="Wave"
                    className="w-4 h-4 rounded-full object-cover shadow-2xs"
                  />
                  <span className="text-[10px] font-bold text-[#2C1E21]">Wave</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#FAF5F4] px-2 py-1 rounded-lg border border-[#F4E2E0]">
                  <img
                    src="/images/payments/orange-money-logo.jpg"
                    alt="Orange Money"
                    className="w-4 h-4 rounded object-contain shadow-2xs"
                  />
                  <span className="text-[10px] font-bold text-[#2C1E21]">Orange Money</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#FAF5F4] px-2 py-1 rounded-lg border border-[#F4E2E0]">
                  <span className="text-xs">💳</span>
                  <span className="text-[10px] font-bold text-[#8B3A4A]">PayTech SN</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

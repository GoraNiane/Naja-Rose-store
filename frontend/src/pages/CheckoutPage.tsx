import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCartStore } from '../stores/cartStore';
import { productService } from '../services/product.service';
import { orderService } from '../services/order.service';
import { formatCFA } from '../lib/utils';
import { PAYMENT_METHODS } from '../lib/constants';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ShieldCheck, Truck, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { InvoicePreview, type InvoiceData } from '../components/common/InvoicePreview';

const checkoutSchema = z.object({
  firstName: z.string().min(2, 'Le prénom est obligatoire'),
  lastName: z.string().min(2, 'Le nom est obligatoire'),
  email: z.string().email('Adresse email valide requise').optional().or(z.literal('')),
  phone: z.string().min(8, 'Numéro de téléphone requis (ex: +221 77 000 00 00)'),
  address: z.string().min(4, 'Adresse détaillée de livraison requise'),
  city: z.string().default('Dakar'),
  deliveryZoneId: z.string().min(1, 'Veuillez sélectionner une zone de livraison'),
  paymentMethod: z.enum(['WAVE', 'ORANGE_MONEY', 'CASH_ON_DELIVERY']),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'FORM' | 'INVOICE_PREVIEW'>('FORM');
  const [formData, setFormData] = useState<CheckoutFormValues | null>(null);

  const { data: deliveryZones, isLoading: isZonesLoading } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => productService.getDeliveryZones(),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      city: 'Dakar',
      paymentMethod: 'WAVE',
      deliveryZoneId: '',
      email: '',
      notes: '',
    },
  });

  const selectedZoneId = watch('deliveryZoneId');
  const selectedPaymentMethod = watch('paymentMethod');
  const selectedZone = deliveryZones?.find((z) => z.id === selectedZoneId);
  const deliveryFee = selectedZone ? Number(selectedZone.price) : 0;
  const total = subtotal + deliveryFee;

  const createOrderMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: (data: any) => {
      clearCart();
      const order = data.order;
      const paymentData = data.payment;

      // Handle Wave or Orange Money gateway redirect
      const redirectUrl =
        paymentData?.paymentUrl || paymentData?.launchUrl || paymentData?.wave_launch_url;

      if (redirectUrl) {
        if (redirectUrl.includes(window.location.host) || redirectUrl.startsWith('/')) {
          const path = redirectUrl.replace(window.location.origin, '');
          navigate(path);
        } else {
          window.location.href = redirectUrl;
        }
      } else {
        navigate(`/checkout/success?orderNumber=${order.orderNumber}`);
      }
    },
    onError: (err: any) => {
      setSubmitError(err.message || 'Échec de la validation de commande');
    },
  });

  // Step 1: Validates form and opens the Proforma Invoice Review step
  const handleFormSubmit = (data: CheckoutFormValues) => {
    if (items.length === 0) {
      setSubmitError('Votre panier est vide');
      return;
    }
    setSubmitError(null);
    setFormData(data);
    setCurrentStep('INVOICE_PREVIEW');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2: Confirms Proforma Invoice and proceeds to Payment
  const handleConfirmAndPay = () => {
    if (!formData || items.length === 0) return;

    createOrderMutation.mutate({
      customer: {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email?.trim() || undefined,
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city || 'Dakar',
      },
      deliveryZoneId: formData.deliveryZoneId,
      deliveryAddress: formData.address.trim(),
      phone: formData.phone.trim(),
      email: formData.email?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      paymentMethod: formData.paymentMethod,
      items: items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    });
  };

  if (items.length === 0 && currentStep === 'FORM') {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Votre panier est vide</h2>
        <p className="text-xs text-slate-500">Ajoutez des articles avant de finaliser votre commande.</p>
        <Button variant="gold" onClick={() => navigate('/shop')}>
          Retourner au catalogue
        </Button>
      </div>
    );
  }

  // Generate Proforma Invoice Preview Object
  const proformaInvoiceData: InvoiceData = {
    invoiceNumber: `FAC-PROFORMA-${Date.now().toString().slice(-6)}`,
    orderNumber: `CMD-PROFORMA`,
    createdAt: new Date().toISOString(),
    customer: {
      firstName: formData?.firstName || '',
      lastName: formData?.lastName || '',
      phone: formData?.phone || '',
      email: formData?.email || null,
      address: formData?.address || '',
      city: formData?.city || 'Dakar',
    },
    deliveryZoneName: selectedZone?.name || 'Dakar & Régions',
    deliveryAddress: formData?.address || '',
    notes: formData?.notes || null,
    paymentMethod: formData?.paymentMethod || 'WAVE',
    subtotal,
    deliveryFee,
    total,
    items: items.map((i) => ({
      productName: i.productName,
      imageUrl: i.imageUrl,
      colorName: i.colorName,
      sizeName: i.sizeName,
      quantity: i.quantity,
      unitPrice: i.price,
      total: i.price * i.quantity,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Checkout Breadcrumb Steps */}
      <div className="flex items-center justify-between border-b border-[#F4E2E0] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif italic font-bold text-[#2C1E21]">
            {currentStep === 'FORM' ? 'Finalisation de votre Commande' : 'Visualisation & Validation de la Facture'}
          </h1>
          <p className="text-xs text-[#7A6469] mt-1">
            {currentStep === 'FORM'
              ? 'Renseignez vos coordonnées de livraison au Sénégal'
              : 'Vérifiez les détails de votre facture avant de procéder au paiement'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold">
          <span
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
              currentStep === 'FORM'
                ? 'bg-[#8B3A4A] text-white shadow-xs'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {currentStep === 'INVOICE_PREVIEW' ? <CheckCircle2 className="w-3.5 h-3.5" /> : '1.'}
            <span>1. Livraison & Coordonnées</span>
          </span>
          <span className="text-[#A0888E]">→</span>
          <span
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
              currentStep === 'INVOICE_PREVIEW'
                ? 'bg-[#8B3A4A] text-white shadow-xs'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>2. Facture & Règlement</span>
          </span>
        </div>
      </div>

      {currentStep === 'INVOICE_PREVIEW' ? (
        /* STEP 2: PROFORMA INVOICE PREVIEW BEFORE PAYMENT */
        <div className="space-y-6 max-w-4xl mx-auto">
          {submitError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
              {submitError}
            </div>
          )}

          <InvoicePreview
            invoice={proformaInvoiceData}
            isProforma={true}
            onProceedPayment={handleConfirmAndPay}
            onBackToEdit={() => setCurrentStep('FORM')}
            isSubmitting={createOrderMutation.isPending}
          />
        </div>
      ) : (
        /* STEP 1: DELIVERY FORM & CART SUMMARY */
        <form onSubmit={handleSubmit(handleFormSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Customer and Delivery form */}
        <div className="lg:col-span-7 space-y-8">
          {/* Contact and address */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">
                1
              </span>
              Informations Client & Adresse de Livraison
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Prénom *"
                placeholder="Ex: Fatou"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Nom *"
                placeholder="Ex: Diop"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Téléphone (Wave / OM) *"
                placeholder="Ex: +221 77 123 45 67"
                error={errors.phone?.message}
                {...register('phone')}
              />
              <Input
                label="Email (facultatif)"
                placeholder="Ex: fatou.diop@gmail.com"
                type="email"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            {/* Delivery Zone selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Zone de Livraison (Dakar & Régions) *
              </label>
              <select
                {...register('deliveryZoneId')}
                disabled={isZonesLoading}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">-- Sélectionnez votre zone de livraison --</option>
                {deliveryZones?.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} — {formatCFA(zone.price)} ({zone.estimatedDelivery || '24h'})
                  </option>
                ))}
              </select>
              {errors.deliveryZoneId && (
                <p className="text-xs text-rose-600 font-medium">
                  {errors.deliveryZoneId.message}
                </p>
              )}
            </div>

            <Input
              label="Adresse de livraison détaillée *"
              placeholder="Ex: Cité Keur Gorgui, Rue KG-14, Immeuble A, 2ème étage"
              error={errors.address?.message}
              {...register('address')}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Indication complémentaire / Repères pour le livreur (facultatif)
              </label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Ex: En face de la pharmacie, portail noir, appeler à l'arrivée..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              Mode de Paiement Sécurisé
            </h2>

            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = selectedPaymentMethod === method.id;
                return (
                  <label
                    key={method.id}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/40 shadow-sm'
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      value={method.id}
                      {...register('paymentMethod')}
                      className="mt-1 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{method.icon}</span>
                        <span className="font-bold text-sm text-slate-900">{method.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${method.badgeColor}`}>
                          {method.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{method.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 sticky top-28">
            <h3 className="font-display font-bold text-lg text-slate-900 border-b border-slate-100 pb-4">
              Récapitulatif de votre Panier
            </h3>

            {/* Item list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-3 text-xs">
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-12 h-14 rounded-lg object-cover bg-slate-50 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 line-clamp-1">{item.productName}</p>
                    <p className="text-slate-500 text-[11px]">
                      Qté: {item.quantity} {item.sizeName && `• ${item.sizeName}`}
                    </p>
                    <p className="font-bold text-amber-800 mt-0.5">
                      {formatCFA(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculation & Totals */}
            <div className="pt-4 border-t border-slate-100 space-y-3 text-xs bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium">Sous-total produits</span>
                <span className="font-bold text-slate-900 font-mono">{formatCFA(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-1.5 font-medium">
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  <span>+ Frais de livraison ({selectedZone ? selectedZone.name : 'Choisir une zone'})</span>
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {selectedZone ? `+ ${formatCFA(deliveryFee)}` : 'À sélectionner'}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200/80 flex justify-between items-baseline">
                <div>
                  <span className="font-black text-sm text-slate-900 block">= TOTAL À PAYER</span>
                  <span className="text-[10px] text-slate-400">Total garanti calculé par le serveur</span>
                </div>
                <span className="font-black text-2xl font-display text-slate-950">
                  {formatCFA(total)}
                </span>
              </div>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {submitError}
              </div>
            )}

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full font-bold shadow-md hover:shadow-lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Étape 2 : Voir & Valider ma Facture ({formatCFA(total)})
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Paiement sécurisé et garanti conforme marché sénégalais</span>
            </div>
          </div>
        </div>
      </form>
      )}
    </div>
  );
}

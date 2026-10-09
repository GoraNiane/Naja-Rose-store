import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { paymentService } from '../services/payment.service';
import { formatCFA } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Lock,
  Smartphone,
  QrCode,
  ExternalLink,
  PhoneCall,
  Sparkles,
} from 'lucide-react';

export function PaymentRedirectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const method = (searchParams.get('method') || 'PAYTECH') as 'PAYTECH' | 'WAVE' | 'ORANGE_MONEY';
  const orderId = searchParams.get('orderId') || '';
  const orderNumber = searchParams.get('orderNumber') || '';
  const amount = Number(searchParams.get('amount') || 0);
  const phone = searchParams.get('phone') || '';
  const txId = searchParams.get('txId') || searchParams.get('token') || '';
  const isSandbox = searchParams.get('sandbox') === 'true';

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoRedirected, setAutoRedirected] = useState(false);

  const isWave = method === 'WAVE';
  const isOM = method === 'ORANGE_MONEY';
  const isPayTech = method === 'PAYTECH';

  // Check if current user is on mobile
  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

  // Construct Wave mobile deep-link with registered phone, amount and order reference
  const cleanPhone = phone.replace(/\s+/g, '');
  const waveDeepLink = `wave://send?phone=${encodeURIComponent(cleanPhone)}&amount=${amount}&memo=${encodeURIComponent(orderNumber)}`;
  const waveWebCheckout = `https://pay.wave.com/`;

  // On Mobile: Attempt automatic redirection to the Wave app once upon entry
  useEffect(() => {
    if (isWave && isMobile && !autoRedirected) {
      setAutoRedirected(true);
      const timer = setTimeout(() => {
        try {
          window.location.href = waveDeepLink;
        } catch {
          // Fallback to web link if scheme handler isn't registered
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isWave, isMobile, autoRedirected, waveDeepLink]);

  const handleOpenWaveApp = () => {
    try {
      window.location.href = waveDeepLink;
      // Also provide web fallback after brief delay if app doesn't take over
      setTimeout(() => {
        window.open(waveWebCheckout, '_blank');
      }, 1500);
    } catch {
      window.open(waveWebCheckout, '_blank');
    }
  };

  const handleOpenOrangeMoney = () => {
    window.location.href = 'tel:*144*391%23';
  };

  const handleConfirmPayment = async (status: 'PAID' | 'FAILED' = 'PAID') => {
    try {
      setIsProcessing(true);
      setErrorMsg(null);
      await paymentService.simulateSandbox(orderNumber || orderId, status);

      if (status === 'PAID') {
        navigate(`/checkout/success?orderNumber=${orderNumber}`);
      } else {
        setErrorMsg('Le paiement a été marqué comme annulé ou échoué.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la confirmation du paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12 bg-[#FAF7F5]">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#F4E2E0] shadow-2xl overflow-hidden">
        {/* Top Notification Badge */}
        <div className="bg-[#8B3A4A] text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#FAF2F0]" />
          <span>PAIEMENT SÉCURISÉ — NAJA ROSE STORE</span>
        </div>

        {/* Header Visual Banner */}
        <div
          className={`p-6 sm:p-8 text-white relative overflow-hidden ${
            isWave
              ? 'bg-gradient-to-br from-[#0099FF] via-[#0080FF] to-[#0055CC]'
              : isOM
              ? 'bg-gradient-to-br from-[#FF6600] via-[#E65C00] to-[#1E1E1E]'
              : 'bg-gradient-to-br from-[#8B3A4A] via-[#A84B5E] to-[#2C1E21]'
          }`}
        >
          {/* Subtle background wave circles */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest font-black opacity-90 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Passerelle Officielle Mobile
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight">
                {isWave ? 'Wave Sénégal' : isOM ? 'Orange Money' : 'PayTech Sénégal'}
              </h1>
              {cleanPhone && (
                <p className="text-xs opacity-95 flex items-center gap-1 pt-0.5">
                  <Smartphone className="w-3.5 h-3.5" /> Numéro : <strong>{cleanPhone}</strong>
                </p>
              )}
            </div>

            <div className="w-16 h-16 rounded-2xl bg-white p-1 flex items-center justify-center shadow-lg shrink-0 border border-white/30">
              {isWave ? (
                <img
                  src="/images/payments/wave-logo.jpg"
                  alt="Wave Sénégal"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : isOM ? (
                <img
                  src="/images/payments/orange-money-logo.jpg"
                  alt="Orange Money"
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-[#8B3A4A] flex items-center justify-center text-2xl">
                  💳
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/20 flex justify-between items-baseline relative z-10">
            <div>
              <span className="text-xs opacity-80 block">Montant exact à payer</span>
              <p className="text-2xl sm:text-3xl font-black font-mono">{formatCFA(amount)}</p>
            </div>
            <div className="text-right">
              <span className="text-xs opacity-80 block">Commande</span>
              <p className="font-mono font-bold text-sm bg-white/20 px-2.5 py-1 rounded-lg">
                {orderNumber || orderId}
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* WAVE SPECIFIC UI & ACTIONS */}
          {isWave && (
            <div className="space-y-5">
              {/* Primary Mobile App Opener Button */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleOpenWaveApp}
                  className="w-full py-4 px-6 rounded-2xl bg-[#0099FF] hover:bg-[#0080FF] active:scale-[0.99] text-white font-black text-sm sm:text-base shadow-lg shadow-sky-500/25 flex items-center justify-center gap-3 transition-all cursor-pointer"
                >
                  <img
                    src="/images/payments/wave-logo.jpg"
                    alt="Wave"
                    className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-xs"
                  />
                  <span>Ouvrir l'application Wave</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-center text-slate-500">
                  Validez la transaction de <strong>{formatCFA(amount)}</strong> directement avec votre code PIN Wave.
                </p>
              </div>

              {/* QR Code / Desktop Helper */}
              <div className="p-4 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white border border-[#7DD3FC] flex items-center justify-center shrink-0 p-1.5 shadow-2xs">
                  <QrCode className="w-full h-full text-[#0284C7]" />
                </div>
                <div className="text-xs text-[#0369A1] space-y-1">
                  <p className="font-bold">Vous êtes sur ordinateur ?</p>
                  <p className="text-[11px] text-[#075985] leading-relaxed">
                    Ouvrez l'application <strong>Wave</strong> sur votre téléphone ({cleanPhone || 'mobile'}) et scannez ce code ou saisissez le montant de <strong>{formatCFA(amount)}</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ORANGE MONEY SPECIFIC UI */}
          {isOM && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] space-y-3">
                <div className="flex items-center gap-2 font-bold text-orange-950 text-xs">
                  <PhoneCall className="w-4 h-4 text-orange-600" />
                  <span>Procédure de paiement Orange Money Sénégal</span>
                </div>
                <div className="text-xs text-orange-900 space-y-1.5">
                  <p>
                    1. Composez le <strong className="text-sm font-mono text-orange-600">#144#391#</strong> sur votre téléphone pour générer votre code d'autorisation OTP.
                  </p>
                  <p>
                    2. Ou validez directement dans l'application <strong>Orange Max it</strong>.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenOrangeMoney}
                  className="w-full border-orange-300 text-orange-800 hover:bg-orange-100"
                >
                  <PhoneCall className="w-3.5 h-3.5 mr-1.5" /> Composer #144#391#
                </Button>
              </div>
            </div>
          )}

          {/* PAYTECH SPECIFIC UI */}
          {isPayTech && (
            <div className="p-4 rounded-2xl bg-[#FAF2F0] border border-[#F4E2E0] text-xs text-[#644D52] space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#2C1E21]">
                <Lock className="w-4 h-4 text-[#8B3A4A]" />
                <span>Passerelle PayTech Multi-Opérateurs</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Règlement certifié par PayTech Sénégal via Wave, Orange Money, Free Money ou Carte Bancaire.
              </p>
            </div>
          )}

          {/* Session details */}
          {txId && (
            <p className="text-[10px] font-mono text-slate-400 text-center">
              Session ID : {txId} {isSandbox ? '• (Mode Test / Simulation)' : ''}
            </p>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Confirmation & Completion CTA */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <Button
              variant="gold"
              size="lg"
              className="w-full justify-center py-4 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all"
              disabled={isProcessing}
              onClick={() => handleConfirmPayment('PAID')}
              leftIcon={isProcessing ? <Spinner size="sm" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            >
              {isProcessing
                ? 'Vérification de votre paiement...'
                : `J'ai validé le paiement (${formatCFA(amount)})`}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center text-rose-600 hover:bg-rose-50 border-rose-200"
              disabled={isProcessing}
              onClick={() => handleConfirmPayment('FAILED')}
              leftIcon={<XCircle className="w-3.5 h-3.5" />}
            >
              Annuler la transaction
            </Button>
          </div>

          {/* Footer Back */}
          <div className="pt-2 text-center">
            <Link
              to={`/commande/${orderNumber || orderId}/facture`}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retourner à la facture de commande</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { paymentService } from '../services/payment.service';
import { formatCFA } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import {
  ShieldAlert,
  Smartphone,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Lock,
} from 'lucide-react';

export function PaymentRedirectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const method = (searchParams.get('method') || 'WAVE') as 'WAVE' | 'ORANGE_MONEY';
  const orderId = searchParams.get('orderId') || '';
  const orderNumber = searchParams.get('orderNumber') || '';
  const amount = Number(searchParams.get('amount') || 0);
  const txId = searchParams.get('txId') || '';
  const isSandbox = searchParams.get('sandbox') === 'true';

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSimulatePayment = async (status: 'PAID' | 'FAILED') => {
    try {
      setIsProcessing(true);
      setErrorMsg(null);
      await paymentService.simulateSandbox(orderNumber || orderId, status);

      if (status === 'PAID') {
        navigate(`/checkout/success?orderNumber=${orderNumber}`);
      } else {
        setErrorMsg('Le paiement a été simulé comme échoué ou annulé.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors du traitement de la notification');
    } finally {
      setIsProcessing(false);
    }
  };

  const isWave = method === 'WAVE';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        {/* Sandbox Warning Banner */}
        {isSandbox && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-950" />
            <span>MODE TEST / SANDBOX ACTIF — AUCUN DÉBIT RÉEL</span>
          </div>
        )}

        {/* Provider Header Banner */}
        <div
          className={`p-6 sm:p-8 text-white ${
            isWave
              ? 'bg-gradient-to-r from-sky-500 to-blue-600'
              : 'bg-gradient-to-r from-amber-600 to-orange-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest font-black opacity-80">
                Passerelle Sécurisée
              </span>
              <h1 className="text-2xl font-black font-display tracking-tight flex items-center gap-2">
                {isWave ? 'Wave Sénégal' : 'Orange Money WebPay'}
              </h1>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Smartphone className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/20 flex justify-between items-baseline">
            <div>
              <span className="text-xs opacity-80">Montant à régler</span>
              <p className="text-2xl font-black">{formatCFA(amount)}</p>
            </div>
            <div className="text-right">
              <span className="text-xs opacity-80">Réf. Commande</span>
              <p className="font-mono font-bold text-sm">{orderNumber || orderId}</p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Instructions Box */}
          <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-600 space-y-2 border border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Instructions de paiement ({method})</span>
            </div>
            {isWave ? (
              <p>
                Dans un environnement réel, l'application Wave s'ouvre automatiquement ou affiche un QR code sécurisé.
                Validez la transaction avec votre code PIN Wave.
              </p>
            ) : (
              <p>
                Dans un environnement réel, composez le <strong>#144#391#</strong> pour obtenir votre code d'autorisation
                ou validez la notification push dans l'application <strong>Orange Max it</strong>.
              </p>
            )}
            {txId && (
              <p className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-200">
                Session ID : {txId}
              </p>
            )}
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons for Sandbox Testing */}
          {isSandbox ? (
            <div className="space-y-3 pt-2">
              <Button
                variant={isWave ? 'primary' : 'gold'}
                size="lg"
                className="w-full justify-center"
                disabled={isProcessing}
                onClick={() => handleSimulatePayment('PAID')}
                leftIcon={isProcessing ? <Spinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
              >
                {isProcessing ? 'Confirmation en cours...' : 'Simuler Validation du Paiement (Succès)'}
              </Button>

              <Button
                variant="outline"
                size="md"
                className="w-full justify-center text-rose-600 hover:bg-rose-50"
                disabled={isProcessing}
                onClick={() => handleSimulatePayment('FAILED')}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Simuler un Échec / Annulation
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <Spinner size="lg" />
              <p className="text-xs text-slate-500">
                Redirection automatique vers le serveur de paiement sécurisé...
              </p>
            </div>
          )}

          {/* Footer Back */}
          <div className="pt-4 text-center">
            <Link
              to="/checkout"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Annuler et retourner au récapitulatif</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export function PwaInstallBanner() {
  const { isInstallable, isIOS, installApp, dismissPrompt } = usePwaInstall();
  const [showIosModal, setShowIosModal] = useState(false);

  if (!isInstallable) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosModal(true);
    } else {
      await installApp();
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-24 sm:max-w-md z-30 pointer-events-auto"
        >
          <div className="bg-[#2C1E21] text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-3 backdrop-blur-md">
            {/* App Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B3A4A] to-[#54202B] border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
              <span className="font-serif italic font-bold text-white text-sm">NR</span>
            </div>

            {/* Information */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-white leading-tight flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#E7A8B4]" />
                Application Naja Rose
              </h4>
              <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                Installez pour une expérience ultra rapide & fluide
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="bg-gradient-to-r from-[#8B3A4A] to-[#A04557] hover:from-[#722E3C] hover:to-[#8B3A4A] text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Installer</span>
              </button>
              <button
                onClick={dismissPrompt}
                className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* iOS Safari Instructions Modal */}
      <AnimatePresence>
        {showIosModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#F2E5E2] space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FAF0EE] text-[#8B3A4A] flex items-center justify-center mx-auto">
                <Smartphone className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-serif italic font-bold text-lg text-[#2C1E21]">
                  Installer sur votre iPhone
                </h3>
                <p className="text-xs text-[#644D52] mt-1">
                  Suivez ces 2 étapes simples sur Safari pour installer l'application Naja Rose Store :
                </p>
              </div>

              <div className="bg-[#FAF5F4] p-3.5 rounded-2xl space-y-2.5 text-left text-xs text-[#382B2F]">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#8B3A4A] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    1
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span>Appuyez sur le bouton</span>
                    <strong className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-md border border-[#E0D0CE]">
                      <Share className="w-3.5 h-3.5 text-[#8B3A4A]" /> Partager
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#8B3A4A] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    2
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span>Faites défiler et sélectionnez</span>
                    <strong className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-md border border-[#E0D0CE]">
                      <PlusSquare className="w-3.5 h-3.5 text-[#8B3A4A]" /> Sur l'écran d'accueil
                    </strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowIosModal(false);
                  dismissPrompt();
                }}
                className="w-full py-2.5 bg-[#8B3A4A] hover:bg-[#722E3C] text-white text-xs font-bold rounded-xl transition-all active:scale-98"
              >
                C'est compris !
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

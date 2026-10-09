import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const handleWhatsAppRedirect = (customMsg?: string) => {
    const text = customMsg || message || "Bonjour Naja Rose Store, j'aimerais avoir des informations sur vos articles.";
    const url = `https://wa.me/221773817191?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-80 sm:w-88 bg-white rounded-3xl shadow-luxury-hover border border-[#F2E5E2] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-[#8B3A4A] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-serif text-lg italic">
                  NR
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">Service Client Naja Rose</h4>
                  <p className="text-[11px] text-white/80">En ligne • Réponse rapide sur WhatsApp</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 text-white/90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 bg-[#FAF5F4] space-y-3 text-xs text-[#382B2F]">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-2xs border border-[#F0E4E2]">
                <p>
                  Bonjour ! 👋 Bienvenue chez <strong>Naja Rose Store</strong>. Comment pouvons-nous vous aider aujourd'hui ?
                </p>
              </div>

              {/* Quick Prompt suggestions */}
              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => handleWhatsAppRedirect("Bonjour, j'aimerais savoir si l'ensemble 3 pièces est disponible en taille M.")}
                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-[#FAF0EE] border border-[#EFE5E3] text-[11px] text-[#644D52] transition-colors"
                >
                  💬 Disponibilité des ensembles & tailles
                </button>
                <button
                  onClick={() => handleWhatsAppRedirect("Bonjour, quels sont les délais et tarifs de livraison sur Dakar ?")}
                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-[#FAF0EE] border border-[#EFE5E3] text-[11px] text-[#644D52] transition-colors"
                >
                  🚚 Informations sur la livraison à Dakar
                </button>
              </div>
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-white border-t border-[#F2E5E2] flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleWhatsAppRedirect();
                }}
                placeholder="Écrivez votre message..."
                className="flex-1 bg-[#FAF5F4] border border-[#F2E5E2] rounded-full px-3.5 py-2 text-xs focus:outline-none focus:border-[#8B3A4A]"
              />
              <button
                onClick={() => handleWhatsAppRedirect()}
                className="w-8 h-8 rounded-full bg-[#8B3A4A] text-white flex items-center justify-center hover:bg-[#722E3C] transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Pink Circular Button (Exact from Screenshot) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Discussion et support"
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#E7A8B4] hover:bg-[#D48B99] text-white shadow-lg flex items-center justify-center transition-colors focus:outline-none"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6 fill-current" />
        )}
      </motion.button>
    </div>
  );
}

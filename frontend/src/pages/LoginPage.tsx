import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (emailToUse: string, passToUse: string) => {
    if (!emailToUse.trim()) {
      setError('Veuillez renseigner votre adresse email');
      return;
    }
    if (!passToUse || passToUse.trim().length === 0) {
      setError('Veuillez renseigner le mot de passe');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let res;
      try {
        res = await authService.login({
          email: emailToUse.trim(),
          password: passToUse.trim(),
        });
      } catch {
        // Fallback to admin-login password endpoint
        res = await authService.adminLogin(passToUse.trim());
      }

      if (res && res.user) {
        if (res.user.role !== 'ADMIN') {
          setError("Accès refusé : Ce compte n'a pas les privilèges administrateur");
          return;
        }
        setAuth(res.user, res.token);
        const destination = (location.state as any)?.from?.pathname || '/admin/dashboard';
        navigate(destination, { replace: true });
      } else {
        setError('Identifiants incorrects');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Identifiants administrateur incorrects ou serveur indisponible'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12 bg-[#FAF5F4]/50">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-[#F4E2E0] shadow-xl space-y-6">
        {/* Top Branding & Title */}
        <div className="text-center space-y-3">
          <BrandLogo size="sm" />
          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5F4] border border-[#F4E2E0] text-[11px] font-semibold text-[#8B3A4A] mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8B3A4A]" />
              <span>Espace Administrateur Naja Rose</span>
            </div>
            <h1
              className="text-2xl font-serif italic text-[#2C1E21]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Connexion Sécurisée
            </h1>
            <p className="text-xs text-[#644D52] mt-1">
              Entrez vos identifiants administrateur pour gérer votre boutique
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Admin Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-[#2C1E21] uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8B3A4A]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email"
                required
                className="w-full pl-10 pr-4 py-3 bg-[#FAF5F4]/40 hover:bg-[#FAF5F4]/70 focus:bg-white border border-[#F4E2E0] focus:border-[#8B3A4A] rounded-2xl text-sm text-[#2C1E21] font-medium outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-[#2C1E21] uppercase tracking-wider">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8B3A4A]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
                className="w-full pl-10 pr-11 py-3 bg-[#FAF5F4]/40 hover:bg-[#FAF5F4]/70 focus:bg-white border border-[#F4E2E0] focus:border-[#8B3A4A] rounded-2xl text-sm text-[#2C1E21] font-medium outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A0888E] hover:text-[#8B3A4A] transition-colors"
                title={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full bg-[#8B3A4A] hover:bg-[#772F3E] text-white rounded-full py-3.5 text-sm font-semibold shadow-md transition-all mt-2"
            isLoading={loading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Se Connecter
          </Button>
        </form>
      </div>
    </div>
  );
}

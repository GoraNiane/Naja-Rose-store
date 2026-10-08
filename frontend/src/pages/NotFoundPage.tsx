import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-4">
      <span className="text-6xl font-black font-display text-amber-600">404</span>
      <h1 className="text-2xl font-bold font-display text-slate-900">Page Introuvable</h1>
      <p className="text-xs text-slate-500 max-w-sm">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link to="/" className="pt-2">
        <Button variant="gold" leftIcon={<Home className="w-4 h-4" />}>
          Retour à l'accueil
        </Button>
      </Link>
    </div>
  );
}

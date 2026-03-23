import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Shield, ChevronDown, ChevronUp, Cookie } from 'lucide-react';
import {
  hasConsented,
  acceptAllCookies,
  rejectOptionalCookies,
  setCookieConsent,
  COOKIE_CATALOG,
} from '@/lib/cookies';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: false,
    marketing: false,
    functional: true,
  });

  useEffect(() => {
    if (!hasConsented()) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  const handleAcceptAll = () => {
    acceptAllCookies();
    setVisible(false);
  };

  const handleRejectOptional = () => {
    rejectOptionalCookies();
    setVisible(false);
  };

  const handleSavePreferences = () => {
    setCookieConsent(preferences);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-3 sm:p-4 animate-fade-in">
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card shadow-2xl">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                Política de Cookies e Privacidade
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Utilizamos cookies para garantir o funcionamento do sistema e melhorar sua experiência,
                em conformidade com a{' '}
                <strong>LGPD (Lei 13.709/2018)</strong>. Você pode personalizar suas preferências abaixo.
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-3 text-xs mb-4">
            <Link to="/politica-privacidade" className="text-primary hover:underline flex items-center gap-1">
              <Shield className="h-3 w-3" /> Política de Privacidade
            </Link>
            <Link to="/politica-cookies" className="text-primary hover:underline">
              Política de Cookies
            </Link>
            <Link to="/termos-uso" className="text-primary hover:underline">
              Termos de Uso
            </Link>
          </div>

          {/* Expandable Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showDetails ? 'Ocultar detalhes' : 'Personalizar cookies'}
          </button>

          {showDetails && (
            <div className="space-y-3 mb-4 border rounded-lg p-3 bg-muted/30">
              {COOKIE_CATALOG.map((cat) => (
                <div key={cat.category} className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{cat.name}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{cat.description}</p>
                  </div>
                  <Switch
                    checked={cat.required || preferences[cat.category as keyof typeof preferences] || false}
                    disabled={cat.required}
                    onCheckedChange={(checked) => {
                      if (!cat.required) {
                        setPreferences((prev) => ({
                          ...prev,
                          [cat.category]: checked,
                        }));
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleAcceptAll} size="sm" className="flex-1">
              Aceitar Todos
            </Button>
            {showDetails ? (
              <Button onClick={handleSavePreferences} variant="secondary" size="sm" className="flex-1">
                Salvar Preferências
              </Button>
            ) : (
              <Button onClick={handleRejectOptional} variant="outline" size="sm" className="flex-1">
                Apenas Essenciais
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

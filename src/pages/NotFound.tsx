import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="text-8xl font-extrabold text-gradient-brand mb-4">404</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Página não encontrada</h1>
        <p className="text-muted-foreground mb-8">
          A página <code className="bg-muted px-2 py-0.5 rounded text-sm">{location.pathname}</code> não existe ou foi removida.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button asChild className="gap-2">
            <Link to="/dashboard">
              <Home className="h-4 w-4" />
              Ir ao Dashboard
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;

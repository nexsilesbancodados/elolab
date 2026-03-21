import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { ReactNode, useState } from "react";

interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  content: ReactNode;
  isOptional?: boolean;
}

interface OnboardingWizardSaasProps {
  steps: WizardStep[];
  onComplete: () => void;
  onSkip?: () => void;
  logo?: ReactNode;
  title?: string;
  variant?: "default" | "fullscreen" | "modal" | "sidebar";
  showProgress?: boolean;
  allowSkip?: boolean;
}

export function OnboardingWizardSaas({
  steps,
  onComplete,
  onSkip,
  logo,
  title = "Configure sua conta",
  variant = "default",
  showProgress = true,
  allowSkip = true,
}: OnboardingWizardSaasProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const isFullscreen = variant === "fullscreen";

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-background" : ""} flex flex-col`}>
      {/* Header */}
      <div className={`${isFullscreen ? "px-8 py-6" : "px-6 py-4"} border-b border-border`}>
        <div className="flex items-center justify-between max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-3">
            {logo}
            <span className="text-sm font-semibold">{title}</span>
          </div>
          {allowSkip && onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground">
              Pular configuração
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      {showProgress && (
        <div className="px-8 pt-6 max-w-3xl mx-auto w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">
              Passo {currentStep + 1} de {steps.length}
            </span>
            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />

          {/* Step indicators */}
          <div className="flex gap-2 mt-4">
            {steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => i <= Math.max(...completedSteps, currentStep) ? setCurrentStep(i) : null}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  i === currentStep
                    ? "bg-primary/10 text-primary"
                    : completedSteps.has(i)
                    ? "bg-success/10 text-success"
                    : "text-muted-foreground"
                }`}
              >
                {completedSteps.has(i) ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-8 max-w-3xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-6">
              {step.icon && <div className="mb-4">{step.icon}</div>}
              <h2 className="text-2xl font-bold font-display">{step.title}</h2>
              {step.description && (
                <p className="text-muted-foreground mt-2">{step.description}</p>
              )}
            </div>

            {step.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 border-t border-border">
        <div className="flex items-center justify-between max-w-3xl mx-auto w-full">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>

          <div className="flex gap-2">
            {step.isOptional && (
              <Button variant="ghost" onClick={handleNext}>
                Pular
              </Button>
            )}
            <Button onClick={handleNext} className="gap-2 group">
              {isLastStep ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Concluir
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { RippleButton } from "@/components/ui/multi-type-ripple-buttons";

const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export interface PricingCardProps {
  planName: string;
  description: string;
  price: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  buttonVariant?: 'primary' | 'secondary';
  onButtonClick?: () => void;
}

export const PricingCard = ({
  planName, description, price, features, buttonText, isPopular = false, buttonVariant = 'primary', onButtonClick
}: PricingCardProps) => (
  <div className={`bg-card border rounded-2xl shadow-md flex-1 max-w-xs px-7 py-8 flex flex-col transition-shadow duration-300 hover:shadow-xl
    ${isPopular ? 'scale-105 relative ring-2 ring-[hsl(168,76%,36%)]/20 border-[hsl(168,76%,36%)]/30 shadow-xl' : 'border-border'}`}>
    {isPopular && (
      <div className="absolute -top-4 right-4 px-3 py-1 text-[12px] font-semibold rounded-full bg-[hsl(168,76%,36%)] text-white">
        Mais Popular
      </div>
    )}
    <div className="mb-3">
      <h2 className="text-4xl md:text-5xl font-extralight tracking-tight text-foreground">{planName}</h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
    <div className="my-6 flex items-baseline gap-2">
      <span className="text-sm text-muted-foreground">R$</span>
      <span className="text-5xl font-extralight text-foreground">{price}</span>
      <span className="text-sm text-muted-foreground">/mês</span>
    </div>
    <div className="w-full mb-5 h-px bg-border" />
    <ul className="flex flex-col gap-2 text-sm text-foreground/90 mb-6">
      {features.map((feature, i) => (
        <li key={i} className="flex items-center gap-2">
          <CheckIcon className="text-[hsl(168,76%,36%)] w-4 h-4 shrink-0" /> {feature}
        </li>
      ))}
    </ul>
    <RippleButton
      className={`mt-auto w-full py-2.5 rounded-xl font-semibold text-sm transition
        ${buttonVariant === 'primary'
          ? 'bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white'
          : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border'}`}
      onClick={onButtonClick}
    >
      {buttonText}
    </RippleButton>
  </div>
);

interface ModernPricingSectionProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  plans: PricingCardProps[];
  showAnimatedBackground?: boolean;
}

export const ModernPricingSection = ({ title, subtitle, plans }: ModernPricingSectionProps) => (
  <div className="relative w-full overflow-hidden bg-gradient-to-br from-background via-[hsl(168,76%,97%)] to-background">
    <div className="w-full flex flex-col items-center justify-center px-4 py-28">
      <div className="w-full max-w-5xl mx-auto text-center mb-14">
        <h2 className="text-4xl md:text-5xl font-extralight leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-[hsl(168,76%,36%)] to-primary">
          {title}
        </h2>
        <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8 md:gap-6 justify-center items-center w-full max-w-4xl">
        {plans.map((plan) => <PricingCard key={plan.planName} {...plan} />)}
      </div>
    </div>
  </div>
);

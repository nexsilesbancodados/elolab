import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatCPF, formatPhone, formatCEP, formatCNPJ } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type MaskType = "cpf" | "cnpj" | "phone" | "cep" | "currency";

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: MaskType;
  value: string;
  onChange: (value: string) => void;
}

const formatters: Record<MaskType, (value: string) => string> = {
  cpf: formatCPF,
  cnpj: formatCNPJ,
  phone: formatPhone,
  cep: formatCEP,
  currency: (value: string) => {
    const digits = value.replace(/\D/g, '');
    const number = parseFloat(digits) / 100;
    if (isNaN(number)) return '';
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  },
};

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value, onChange, className, ...props }, ref) => {
    const formatter = formatters[mask];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const formattedValue = formatter(rawValue);
      onChange(formattedValue);
    };

    return (
      <Input
        ref={ref}
        value={value}
        onChange={handleChange}
        className={cn(className)}
        {...props}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput };

import * as React from "react";
import { cn } from "@/lib/utils";

interface AccessibleLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  optional?: boolean;
  description?: string;
}

export const AccessibleLabel = React.forwardRef<HTMLLabelElement, AccessibleLabelProps>(
  ({ className, children, required, optional, description, ...props }, ref) => {
    const id = React.useId();
    const descriptionId = description ? `${id}-description` : undefined;

    return (
      <div className="space-y-1">
        <label
          ref={ref}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            className
          )}
          aria-describedby={descriptionId}
          {...props}
        >
          {children}
          {required && (
            <span className="text-destructive ml-1" aria-label="campo obrigatório">
              *
            </span>
          )}
          {optional && (
            <span className="text-muted-foreground ml-1 text-xs font-normal">
              (opcional)
            </span>
          )}
        </label>
        {description && (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    );
  }
);

AccessibleLabel.displayName = "AccessibleLabel";

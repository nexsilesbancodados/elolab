import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * Button component with built-in loading state
 * Shows a spinner and optional loading text when isLoading is true
 */
const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, children, isLoading, loadingText, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(className)}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);
LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };

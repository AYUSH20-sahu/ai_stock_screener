import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'border border-cyan-300/20 bg-[linear-gradient(135deg,_rgba(34,211,238,0.98),_rgba(59,130,246,0.95))] text-slate-950 shadow-[0_18px_40px_-18px_rgba(34,211,238,0.7)] hover:brightness-110 hover:shadow-[0_22px_46px_-16px_rgba(34,211,238,0.85)]',
                outline: 'border border-white/10 bg-white/[0.03] text-slate-100 backdrop-blur-xl hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 px-3',
                lg: 'h-11 px-6',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const buttonClassName = cn(buttonVariants({ variant, size, className }));

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
            className: cn(buttonClassName, (children as React.ReactElement<{ className?: string }>).props.className),
            ...props,
        });
    }

    return (
        <button ref={ref} className={buttonClassName} {...props}>
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export { Button, buttonVariants };

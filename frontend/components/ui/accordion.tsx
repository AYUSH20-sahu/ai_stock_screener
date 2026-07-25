"use client";

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccordionContextValue = {
    openValue: string | null;
    toggleValue: (value: string) => void;
};

const AccordionContext = React.createContext<AccordionContextValue>({
    openValue: null,
    toggleValue: () => undefined,
});

type AccordionProps = React.HTMLAttributes<HTMLDivElement> & {
    type?: 'single';
    collapsible?: boolean;
    children: React.ReactNode;
};

function Accordion({ className, children, ...props }: AccordionProps) {
    const [openValue, setOpenValue] = React.useState<string | null>(null);

    const toggleValue = React.useCallback((value: string) => {
        setOpenValue((current) => (current === value ? null : value));
    }, []);

    return (
        <AccordionContext.Provider value={{ openValue, toggleValue }}>
            <div className={cn('w-full', className)} {...props}>
                {children}
            </div>
        </AccordionContext.Provider>
    );
}

type AccordionItemProps = React.HTMLAttributes<HTMLDivElement> & {
    value: string;
};

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(({ className, children, value, ...props }, ref) => {
    const childElements = React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<{ value?: string }>, { value });
        }
        return child;
    });

    return (
        <div ref={ref} className={cn('border-b border-slate-800', className)} {...props}>
            {childElements}
        </div>
    );
});
AccordionItem.displayName = 'AccordionItem';

type AccordionTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value?: string;
};

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(({ className, children, value, ...props }, ref) => {
    const { openValue, toggleValue } = React.useContext(AccordionContext);
    const isOpen = value != null && openValue === value;

    return (
        <button
            ref={ref}
            type="button"
            className={cn('flex w-full flex-1 items-center justify-between py-4 text-left text-sm font-medium text-slate-100 transition-all hover:text-white', className)}
            onClick={() => value != null && toggleValue(value)}
            {...props}
        >
            <span>{children}</span>
            <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} />
        </button>
    );
});
AccordionTrigger.displayName = 'AccordionTrigger';

type AccordionContentProps = React.HTMLAttributes<HTMLDivElement> & {
    value?: string;
};

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(({ className, children, value, ...props }, ref) => {
    const { openValue } = React.useContext(AccordionContext);
    if (value == null || openValue !== value) return null;

    return (
        <div ref={ref} className={cn('overflow-hidden text-sm text-slate-400', className)} {...props}>
            <div className="pb-4 pt-0">{children}</div>
        </div>
    );
});
AccordionContent.displayName = 'AccordionContent';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };

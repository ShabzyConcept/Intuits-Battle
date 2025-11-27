"use client";

import { useToast, Toast as ToastType } from "@/hooks/use-toast";
import { Toast as UIToast, ToastTitle, ToastDescription, ToastClose, ToastProvider, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant, action, ...props }: ToastType) => {
        let variantClass = "";
        switch (variant) {
          case "success":
            variantClass = "bg-green-500 text-white";
            break;
          case "error":
            variantClass = "bg-red-500 text-white";
            break;
          case "info":
          default:
            variantClass = "bg-blue-500 text-white";
        }

        return (
          <UIToast key={id} {...props} className={`${variantClass} p-4 rounded shadow flex justify-between items-start`}>
            <div className="flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
              {action && <div className="mt-2">{action}</div>}
            </div>
            <ToastClose />
          </UIToast>
        );
      })}

      <ToastViewport className="fixed top-4 right-4 flex flex-col gap-2 z-99999" />
    </ToastProvider>
  );
}

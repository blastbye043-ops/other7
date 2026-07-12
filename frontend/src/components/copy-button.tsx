import { useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  label?: string;
  successMessage?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary";
  iconOnly?: boolean;
  className?: string;
}

export const CopyButton = memo(function CopyButton({
  text,
  label = "Copy",
  successMessage = "Copied to clipboard!",
  size = "sm",
  variant = "outline",
  iconOnly = false,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (copied) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!success) throw new Error("execCommand failed");
      }

      setCopied(true);
      toast.success(successMessage);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy. Please copy manually.");
    }
  }, [text, successMessage, copied]);

  const button = (
    <motion.div
      whileTap={{ scale: 0.93 }}
      transition={{ duration: 0.1 }}
      className="inline-flex"
    >
      <Button
        variant={copied ? "secondary" : variant}
        size={size}
        onClick={handleCopy}
        aria-label={copied ? `${label} — Copied!` : label}
        aria-pressed={copied}
        className={cn(
          "gap-1.5 transition-all duration-200 rounded-lg",
          copied && "border-green-500/50 text-green-500",
          className,
        )}
        data-testid="button-copy"
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-green-500" />
              {!iconOnly && <span className="text-green-500">Copied</span>}
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              {!iconOnly && <span>{label}</span>}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );

  if (iconOnly) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="top">
          <p>{copied ? "Copied!" : label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <>
      {button}
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {copied ? successMessage : ""}
      </span>
    </>
  );
});

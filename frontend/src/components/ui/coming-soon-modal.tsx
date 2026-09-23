"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Sparkles, X } from "lucide-react";

interface ComingSoonContextType {
  showComingSoon: (featureName: string) => void;
}

const ComingSoonContext = React.createContext<ComingSoonContextType>({
  showComingSoon: () => {},
});

export function useComingSoon() {
  return React.useContext(ComingSoonContext);
}

export function ComingSoonProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [feature, setFeature] = React.useState("");

  const showComingSoon = (featureName: string) => {
    setFeature(featureName);
    setIsOpen(true);
  };

  return (
    <ComingSoonContext.Provider value={{ showComingSoon }}>
      {children}
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm p-6 bg-surface border border-subtle rounded-2xl shadow-xl z-50 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <Dialog.Title className="text-lg font-semibold text-ink">
              {feature || "Feature"}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-ink-muted mt-2 mb-6">
              This module is currently scheduled for the upcoming phase and will be available soon.
            </Dialog.Description>
            <div className="flex justify-center">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 rounded-full text-sm font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-colors"
              >
                Got it
              </button>
            </div>
            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 p-1 text-ink-muted hover:text-ink rounded-lg"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </ComingSoonContext.Provider>
  );
}

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
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm p-6 bg-white dark:bg-[#0F1538] border border-[#E4E8F5] dark:border-[#232C63] rounded-2xl shadow-xl z-50 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#F3F5FC] dark:bg-[#1A2255] flex items-center justify-center text-[#0D2185] dark:text-[#4C66F5] mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <Dialog.Title className="text-lg font-semibold text-[#0E1330] dark:text-[#EAEDFB]">
              {feature || "Feature"}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-[#6B7194] dark:text-[#8C95C6] mt-2 mb-6">
              This module is currently scheduled for the upcoming phase and will be available soon.
            </Dialog.Description>
            <div className="flex justify-center">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 rounded-full text-sm font-medium bg-[#0D2185] hover:bg-[#0A1A6B] dark:bg-[#4C66F5] dark:hover:bg-[#6178F7] text-white transition-colors"
              >
                Got it
              </button>
            </div>
            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 p-1 text-[#6B7194] hover:text-[#0E1330] dark:hover:text-white rounded-lg"
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

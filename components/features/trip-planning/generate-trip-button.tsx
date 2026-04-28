"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface GenerateTripButtonProps {
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function GenerateTripButton({
  isLoading = false,
  disabled = false,
  onClick,
}: GenerateTripButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <style>{`
        @keyframes flowingArrow {
          0% { transform: translateX(-4px); opacity: 0.6; }
          50% { opacity: 1; }
          100% { transform: translateX(4px); opacity: 0.6; }
        }
        .flowing-arrow { animation: flowingArrow 1.2s ease-in-out infinite; }
      `}</style>

      <Button
        type="submit"
        size="lg"
        disabled={disabled || isLoading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        className="w-full rounded-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold text-base shadow-lg transition-all duration-300 py-6"
      >
        {isLoading ? (
          <>
            <span className="inline-block animate-spin">◐</span>
            <span className="ml-2">Generating your perfect trip...</span>
          </>
        ) : (
          <>
            <span>Generate My Trip</span>
            <ArrowRight
              className={`ml-3 size-5 transition-all duration-300 ${
                isHovered ? "flowing-arrow" : ""
              }`}
            />
          </>
        )}
      </Button>
    </>
  );
}

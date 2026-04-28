"use client";

import { useState } from "react";

export function AutoNomadLogo({ className = "size-8" }: { className?: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <style>{`
        @keyframes compassRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(90deg); }
        }
        .compass-rotate {
          transform-origin: center;
          animation: compassRotate 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
      
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} transition-transform duration-300 ${isHovered ? "compass-rotate" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-hidden="true"
      >
        {/* Outer compass ring - Primary color (Nomad blue) */}
        <circle cx="20" cy="20" r="18" stroke="hsl(255 100% 50%)" strokeWidth="1.5" opacity="0.7" />
        
        {/* Inner compass ring - Black (Auto) */}
        <circle cx="20" cy="20" r="14" stroke="black" strokeWidth="1.2" opacity="0.8" />
        
        {/* Compass needle pointing North - Black (inner) */}
        <path d="M20 5 L22 12 L18 12 Z" fill="black" />
        
        {/* Compass needle pointing East - Primary color (outer) */}
        <path d="M35 20 L28 22 L28 18 Z" fill="hsl(255 100% 50%)" opacity="0.8" />
        
        {/* Center circle - Black with primary accent ring */}
        <circle cx="20" cy="20" r="4" fill="black" />
        <circle cx="20" cy="20" r="4" stroke="hsl(255 100% 50%)" strokeWidth="1.5" opacity="0.6" fill="none" />
        
        {/* Cardinal direction markers */}
        {/* North marker - black */}
        <line x1="20" y1="6" x2="20" y2="7.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* East marker - primary */}
        <line x1="34" y1="20" x2="32.5" y2="20" stroke="hsl(255 100% 50%)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        
        {/* South marker - black */}
        <line x1="20" y1="34" x2="20" y2="32.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        
        {/* West marker - primary */}
        <line x1="6" y1="20" x2="7.5" y2="20" stroke="hsl(255 100% 50%)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        
        {/* Subtle diagonal accents for elegance */}
        <line x1="27" y1="13" x2="28.5" y2="11.5" stroke="hsl(255 100% 50%)" strokeWidth="0.8" opacity="0.4" />
        <line x1="13" y1="27" x2="11.5" y2="28.5" stroke="black" strokeWidth="0.8" opacity="0.4" />
      </svg>
    </>
  );
}

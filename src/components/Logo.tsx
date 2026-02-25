import React from 'react';

export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f2fe" />
            <stop offset="100%" stopColor="#4facfe" />
          </linearGradient>
          <linearGradient id="logo-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4facfe" />
            <stop offset="100%" stopColor="#00f2fe" />
          </linearGradient>
        </defs>
        {/* Stylized S */}
        <path
          d="M30 30 C 30 10, 70 10, 70 30 C 70 45, 30 55, 30 70 C 30 90, 70 90, 70 70"
          fill="none"
          stroke="url(#logo-gradient)"
          strokeWidth="12"
          strokeLinecap="round"
          className="drop-shadow-lg"
        />
        {/* Circuit Dots */}
        <circle cx="30" cy="30" r="4" fill="#00f2fe" />
        <circle cx="70" cy="70" r="4" fill="#4facfe" />
        <circle cx="50" cy="50" r="3" fill="#fff" className="animate-pulse" />
        
        {/* Decorative lines */}
        <path d="M70 30 L 85 30" stroke="#00f2fe" strokeWidth="2" strokeDasharray="4 2" />
        <path d="M30 70 L 15 70" stroke="#4facfe" strokeWidth="2" strokeDasharray="4 2" />
      </svg>
    </div>
  );
}

"use client";

import * as React from "react";

interface WelcomeBannerProps {
  name: string;
  role?: string;
  dateStr?: string;
  subtitle?: string;
}

export function WelcomeBanner({
  name,
  role = "student",
  dateStr,
  subtitle = "Always stay updated in your student portal",
}: WelcomeBannerProps) {
  const firstName = name.split(" ")[0] || name;

  const displayDate =
    dateStr ||
    new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date());

  return (
    <div className="relative w-full rounded-[24px] banner-gradient p-8 text-white overflow-hidden shadow-lg mb-8 mt-1 sm:mt-2">
      {/* Decorative background glow rings */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-blue-200 mb-2">
            {displayDate}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Welcome back, {firstName}!
          </h1>
          <p className="text-sm sm:text-base text-blue-100/90 font-normal">
            {subtitle}
          </p>
        </div>

        {/* 3D Academic Motif illustration matching reference */}
        <div className="hidden sm:flex items-center justify-center flex-shrink-0 pr-4">
          <div className="relative w-48 h-32 flex items-center justify-center">
            {/* 3D stylized Graduation Cap & Academic Scroll inline graphic */}
            <svg
              viewBox="0 0 200 130"
              className="w-full h-full drop-shadow-2xl"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="capGrad" x1="20" y1="20" x2="180" y2="90" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3B497E" />
                  <stop offset="0.5" stopColor="#1E284F" />
                  <stop offset="1" stopColor="#0B1333" />
                </linearGradient>
                <linearGradient id="tasselGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#FDB022" />
                  <stop offset="1" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id="scrollGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#FFF9E6" />
                  <stop offset="1" stopColor="#F5E4B5" />
                </linearGradient>
                <linearGradient id="ribbonGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#F04438" />
                  <stop offset="1" stopColor="#B42318" />
                </linearGradient>
              </defs>

              {/* Backing glow circle */}
              <circle cx="100" cy="65" r="45" fill="rgba(255,255,255,0.06)" />
              <circle cx="140" cy="35" r="6" fill="#38BDF8" opacity="0.8" />
              <circle cx="45" cy="85" r="4" fill="#F472B6" opacity="0.8" />
              <circle cx="160" cy="75" r="5" fill="#34D399" opacity="0.8" />

              {/* Scroll at bottom */}
              <g transform="translate(60, 75) rotate(-8)">
                <rect x="0" y="0" width="80" height="22" rx="11" fill="url(#scrollGrad)" />
                <rect x="34" y="-2" width="12" height="26" rx="4" fill="url(#ribbonGrad)" />
                <path d="M40 22 L36 34 L40 31 L44 34 Z" fill="url(#ribbonGrad)" />
              </g>

              {/* 3D Mortarboard Cap */}
              <path
                d="M100 20 L165 42 L100 64 L35 42 Z"
                fill="url(#capGrad)"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.5"
              />
              {/* Cap under-rim */}
              <path
                d="M60 52 C60 70 140 70 140 52 L140 60 C140 76 60 76 60 60 Z"
                fill="#0F172A"
                opacity="0.9"
              />
              {/* Tassel button */}
              <circle cx="100" cy="42" r="4" fill="url(#tasselGrad)" />
              {/* Tassel cord */}
              <path
                d="M100 42 C120 46 142 55 145 68"
                stroke="url(#tasselGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M143 68 L147 82 L141 82 Z"
                fill="url(#tasselGrad)"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

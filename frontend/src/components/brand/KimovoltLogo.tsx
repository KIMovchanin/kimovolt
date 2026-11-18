import React from 'react';

interface LogoProps {
  size?: number;
  decorative?: boolean;
}

/**
 * Original KIMOVOLT LAB vector mark:
 * Combines the letter K vertical copper bus spine, a 45° routed PCB signal trace,
 * and a schematic diode/LED bar geometry inside the lower leg.
 */
export const KimovoltLogo: React.FC<LogoProps> = ({ size = 34, decorative = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    aria-hidden={decorative ? true : undefined}
    role={decorative ? undefined : 'img'}
  >
    {!decorative && <title>KIMOVOLT LAB</title>}
    <rect
      x="1.25"
      y="1.25"
      width="37.5"
      height="37.5"
      rx="6"
      fill="var(--elevated)"
      stroke="var(--border-strong)"
      strokeWidth="1.25"
    />
    {/* K vertical copper spine with solder pads */}
    <path d="M11.5 9V31" stroke="var(--copper)" strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="11.5" cy="9" r="2.4" fill="var(--bg)" stroke="var(--copper)" strokeWidth="1.9" />
    <circle cx="11.5" cy="31" r="2.4" fill="var(--bg)" stroke="var(--copper)" strokeWidth="1.9" />
    {/* Upper 45-degree PCB signal trace + via terminal */}
    <path
      d="M11.5 20H18.5L27 11.5"
      stroke="var(--cyan)"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="28.5" cy="10" r="2.4" fill="var(--cyan)" />
    {/* Lower K leg embedding schematic diode triangle + cathode bar */}
    <path d="M17.5 20L22.5 25" stroke="var(--copper)" strokeWidth="2.3" strokeLinecap="round" />
    <polygon points="21,22 26.5,27 23.5,29.5" fill="var(--copper)" />
    <path d="M23.5 31L29.5 25" stroke="var(--text)" strokeWidth="2.1" strokeLinecap="round" />
    <path d="M26.5 28L30 31.5" stroke="var(--copper)" strokeWidth="2.3" strokeLinecap="round" />
  </svg>
);

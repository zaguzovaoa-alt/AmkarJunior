import React from "react";

interface AmkarLogoProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const AmkarLogo: React.FC<AmkarLogoProps> = ({
  className = "",
  width = "100%",
  height = "100%",
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 150 260"
      width={width}
      height={height}
      className={className}
      fill="none"
    >
      <g
        stroke="#E31E24"
        strokeWidth="12"
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        {/* Left Side */}
        <path d="M67 10 L67 145 L43 229" />
        <path d="M51 50 L51 145 L31 215" />
        <path d="M35 80 L35 145 L19 201" />

        {/* Right Side */}
        <path d="M83 10 L83 145 L107 229" />
        <path d="M99 50 L99 145 L119 215" />
        <path d="M115 80 L115 145 L131 201" />

        {/* Horizontal Crossbar */}
        <path d="M62 138 L88 138" strokeWidth="10" />
      </g>

      {/* Bottom Pentagon */}
      <polygon points="75,238 85,248 81,259 69,259 65,248" fill="#E31E24" />
    </svg>
  );
};

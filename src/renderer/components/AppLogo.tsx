interface AppLogoProps {
  className?: string;
  size?: number;
}

export function AppLogo({ className = '', size = 16 }: AppLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M 128 24 L 232 128 L 128 232 L 24 128 Z" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="butt" 
        strokeLinejoin="miter"
      />
      <path 
        d="M 128 24 L 80 96 L 128 168 L 176 96 Z" 
        fill="currentColor" 
        fillOpacity="0.2"
        stroke="currentColor" 
        strokeOpacity="0.6"
        strokeWidth="2" 
        strokeLinecap="butt" 
        strokeLinejoin="miter"
      />
      <path 
        d="M 128 24 L 24 128 L 80 96 Z" 
        fill="currentColor" 
        fillOpacity="0.3"
        stroke="currentColor" 
        strokeOpacity="0.5"
        strokeWidth="2" 
        strokeLinecap="butt" 
        strokeLinejoin="miter"
      />
      <path 
        d="M 128 24 L 176 96 L 232 128 Z" 
        fill="currentColor" 
        fillOpacity="0.25"
        stroke="currentColor" 
        strokeOpacity="0.5"
        strokeWidth="2" 
        strokeLinecap="butt" 
        strokeLinejoin="miter"
      />
      <path 
        d="M 80 96 L 24 128 L 128 232 L 128 168 Z" 
        fill="currentColor" 
        fillOpacity="0.25"
        stroke="currentColor" 
        strokeOpacity="0.5"
        strokeWidth="2" 
        strokeLinecap="butt" 
        strokeLinejoin="miter"
      />
      <path 
        d="M 176 96 L 128 168 L 128 232 L 232 128 Z" 
        fill="currentColor" 
        fillOpacity="0.3"
        stroke="currentColor" 
        strokeOpacity="0.5"
        strokeWidth="2" 
        strokeLinecap="butt" 
        strokeLinejoin="miter"
      />
    </svg>
  );
}


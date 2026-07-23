interface LogoProps {
  size?: number;
}

export function Logo({ size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="30 60 240 240"
      className="shrink-0"
    >
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g>
        <polygon points="150,180 150,110 200,130" fill="#1a5b9c"/>
        <polygon points="150,180 200,130 200,230" fill="#0e3061"/>
        <polygon points="150,180 200,230 100,230" fill="#cc6600"/>
        <polygon points="150,180 100,230 100,130" fill="#d48806"/>
        <polygon points="150,180 100,130 150,110" fill="#287bc7"/>
        <polygon points="150,110 150,60 235,95" fill="#348fe0"/>
        <polygon points="150,110 235,95 200,130" fill="#1e5494"/>
        <polygon points="200,130 235,95 270,180" fill="#143d73"/>
        <polygon points="200,130 270,180 200,230" fill="#082142"/>
        <polygon points="200,230 270,180 235,265" fill="#8a4400"/>
        <polygon points="200,230 235,265 150,300" fill="#b55500"/>
        <polygon points="200,230 150,300 100,230" fill="#e67700"/>
        <polygon points="100,230 150,300 65,265" fill="#f29511"/>
        <polygon points="100,230 65,265 30,180" fill="#e38305"/>
        <polygon points="100,230 30,180 100,130" fill="#ab6b18"/>
        <polygon points="100,130 30,180 65,95" fill="#366699"/>
        <polygon points="100,130 65,95 150,60" fill="#489bf2"/>
        <polygon points="100,130 150,60 150,110" fill="#55a8ff"/>
        <polyline points="100,130 125,120 140,140 160,90 185,110" fill="none" stroke="#88ccff" strokeWidth="2" filter="url(#glow)" opacity="0.8"/>
        <polyline points="160,90 200,115 220,150" fill="none" stroke="#bbddff" strokeWidth="1.5" filter="url(#glow)" opacity="0.6"/>
        <polyline points="100,230 120,260 160,225 180,270 215,240" fill="none" stroke="#ffe066" strokeWidth="2" filter="url(#glow)" opacity="0.9"/>
        <polyline points="160,225 190,195 240,210" fill="none" stroke="#ffcc00" strokeWidth="1.5" filter="url(#glow)" opacity="0.7"/>
      </g>
    </svg>
  );
}

interface LogoWithTextProps {
  size?: number;
}

export function LogoWithText({ size = 28 }: LogoWithTextProps) {
  return (
    <div className="flex items-center gap-3">
      <Logo size={size} />
      <span
        className="font-bold text-c-text-primary"
        style={{ fontSize: `calc(${size}px * 0.85)`, letterSpacing: "-0.02em" }}
      >
        TradingAgents
      </span>
    </div>
  );
}

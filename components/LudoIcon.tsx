interface Props {
  size?: number
  className?: string
}

export default function LudoIcon({ size = 32, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Board background */}
      <rect width="32" height="32" rx="4" fill="#fff7ed" stroke="#d97706" strokeWidth="0.8"/>

      {/* Red quadrant — top-left */}
      <rect x="1" y="1" width="12" height="12" rx="1.5" fill="#ef4444"/>
      <circle cx="4.5" cy="4.5" r="2" fill="white" fillOpacity="0.75"/>
      <circle cx="9.5" cy="4.5" r="2" fill="white" fillOpacity="0.75"/>
      <circle cx="4.5" cy="9.5" r="2" fill="white" fillOpacity="0.75"/>
      <circle cx="9.5" cy="9.5" r="2" fill="white" fillOpacity="0.75"/>

      {/* Blue quadrant — top-right */}
      <rect x="19" y="1" width="12" height="12" rx="1.5" fill="#3b82f6"/>
      <circle cx="22.5" cy="4.5" r="2" fill="white" fillOpacity="0.75"/>
      <circle cx="27.5" cy="4.5" r="2" fill="white" fillOpacity="0.75"/>
      <circle cx="22.5" cy="9.5" r="2" fill="white" fillOpacity="0.75"/>
      <circle cx="27.5" cy="9.5" r="2" fill="white" fillOpacity="0.75"/>

      {/* Yellow quadrant — bottom-left */}
      <rect x="1" y="19" width="12" height="12" rx="1.5" fill="#eab308"/>
      <circle cx="4.5" cy="22.5" r="2" fill="white" fillOpacity="0.75"/>
      <circle cx="9.5" cy="22.5" r="2" fill="white" fillOpacity="0.75"/>
      <circle cx="4.5" cy="27.5" r="2" fill="white" fillOpacity="0.75"/>
      <circle cx="9.5" cy="27.5" r="2" fill="white" fillOpacity="0.75"/>

      {/* Green quadrant — bottom-right */}
      <rect x="19" y="19" width="12" height="12" rx="1.5" fill="#22c55e"/>
      <circle cx="22.5" cy="22.5" r="2" fill="white" fillOpacity="0.75"/>
      <circle cx="27.5" cy="22.5" r="2" fill="white" fillOpacity="0.75"/>
      <circle cx="22.5" cy="27.5" r="2" fill="white" fillOpacity="0.75"/>
      <circle cx="27.5" cy="27.5" r="2" fill="white" fillOpacity="0.75"/>

      {/* White cross paths */}
      <rect x="13" y="1"  width="6" height="30" fill="white"/>
      <rect x="1"  y="13" width="30" height="6" fill="white"/>

      {/* Center star — 4 triangles */}
      <polygon points="13,13 19,13 16,16" fill="#ef4444"/>
      <polygon points="19,13 19,19 16,16" fill="#3b82f6"/>
      <polygon points="19,19 13,19 16,16" fill="#22c55e"/>
      <polygon points="13,19 13,13 16,16" fill="#eab308"/>
    </svg>
  )
}

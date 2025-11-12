const BridgeIcon = () => {
  return (
    <svg 
      width="32" 
      height="32" 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M4 24H28L24 16L20 12L16 8L12 12L8 16L4 24Z" 
        fill="#78716C" 
        stroke="#57534E" 
        strokeWidth="1"
      />
      <circle cx="4" cy="24" r="2" fill="#EF4444" />
      <circle cx="28" cy="24" r="2" fill="#EF4444" />
      <path 
        d="M8 16V24M12 12V24M16 8V24M20 12V24M24 16V24" 
        stroke="#8B4513" 
        strokeWidth="1.5"
      />
    </svg>
  )
}

export default BridgeIcon

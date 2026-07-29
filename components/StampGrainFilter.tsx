export function StampGrainFilter() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false">
      <filter id="stamp-grain" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.75"
          numOctaves={3}
          seed={2}
          result="noise"
        />
        <feColorMatrix type="saturate" values="0" in="noise" result="monoNoise" />
        <feComponentTransfer in="monoNoise" result="thresholdNoise">
          <feFuncA type="discrete" tableValues="0 0 1 1 1 0 1 0 1 1" />
        </feComponentTransfer>
        <feBlend in="SourceGraphic" in2="thresholdNoise" mode="multiply" />
      </filter>
    </svg>
  );
}

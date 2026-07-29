export const STAMP_COLORS = ["#c62828", "#1a1a1a", "#2e7d32"] as const;

export type StampColor = (typeof STAMP_COLORS)[number];

export const STAMP_MASK_PATH = "/assets/stamp-mask.png";

export type StampInstance = {
  id: string;
  color: StampColor;
  rotation: number;
  scale: number;
  opacity: number;
};

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function pickStampColor(): StampColor {
  return STAMP_COLORS[Math.floor(Math.random() * STAMP_COLORS.length)];
}

export function createStampInstance(): StampInstance {
  return {
    id: crypto.randomUUID(),
    color: pickStampColor(),
    rotation: randomBetween(-28, 28),
    scale: randomBetween(0.96, 1.04),
    opacity: randomBetween(0.78, 0.92),
  };
}

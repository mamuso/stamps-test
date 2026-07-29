import type { CSSProperties } from "react";

import type { StampInstance } from "@/lib/stamp";
import { STAMP_MASK_PATH } from "@/lib/stamp";

type StampProps = {
  stamp: StampInstance;
};

export function Stamp({ stamp }: StampProps) {
  return (
    <div
      className="stamp"
      style={
        {
          "--stamp-color": stamp.color,
          "--stamp-rotation": `${stamp.rotation}deg`,
          "--stamp-scale": stamp.scale,
          "--stamp-opacity": stamp.opacity,
          "--stamp-mask": `url("${STAMP_MASK_PATH}")`,
        } as CSSProperties
      }
    />
  );
}

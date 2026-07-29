"use client";

import { useCallback, useEffect, useState } from "react";

import { Stamp } from "@/components/Stamp";
import { StampGrainFilter } from "@/components/StampGrainFilter";
import { createStampInstance, type StampInstance } from "@/lib/stamp";

export function StampCanvas() {
  const [stamps, setStamps] = useState<StampInstance[]>([]);

  useEffect(() => {
    setStamps([createStampInstance()]);
  }, []);

  const addStamp = useCallback(() => {
    setStamps((current) => [...current, createStampInstance()]);
  }, []);

  return (
  <>
      <StampGrainFilter />
      <div
        className="stamp-canvas"
        onClick={addStamp}
        aria-label="Stamp canvas. Click to add a stamp."
      >
        {stamps.map((stamp) => <Stamp key={stamp.id} stamp={stamp} />)}
      </div>
      <p className="stamp-hint">Click anywhere to stamp · colors rotate randomly</p>
    </>
  );
}

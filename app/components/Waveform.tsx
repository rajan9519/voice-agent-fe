"use client";

interface WaveformProps {
  active: boolean;
  bars?: number;
}

export default function Waveform({ active, bars = 24 }: WaveformProps) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {Array.from({ length: bars }).map((_, i) => {
        const duration = 0.6 + Math.random() * 0.8;
        const delay = Math.random() * 0.6;
        const height = active ? 20 + Math.random() * 24 : 4;

        return (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: 2.5,
              height: active ? undefined : 4,
              minHeight: 4,
              maxHeight: 40,
              backgroundColor: active ? "#3D6B4F" : "#C5BFB0",
              ...(active
                ? {
                    height: height,
                    animation: `waveform ${duration}s ease-in-out infinite`,
                    animationDelay: `${delay}s`,
                  }
                : {}),
            }}
          />
        );
      })}
    </div>
  );
}

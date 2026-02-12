"use client";

type SparklineProps = {
  data: number[];
  color?: string;
};

export default function Sparkline({
  data,
  color = "#F97316", // orange-500
}: SparklineProps) {
  if (!data || data.length === 0) return null;

  const width = 100;
  const height = 30;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y =
        height -
        ((value - min) / (max - min || 1)) * (height - padding * 2) -
        padding;
      return `${x},${y}`;
    })
    .join(" ");

  const lastPoint = points.split(" ").pop()?.split(",");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-8">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {lastPoint && (
        <circle
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          r="1.8"
          fill={color}
        />
      )}
    </svg>
  );
}

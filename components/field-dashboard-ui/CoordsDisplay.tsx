"use client";

import type { SelectedField } from "@/lib/types";

interface CoordsDisplayProps {
  selectedField: SelectedField | null;
}

export default function CoordsDisplay({ selectedField }: CoordsDisplayProps) {
  return (
    <div className="coords-display">
      {selectedField ? (
        <>📍 Field: {selectedField.properties.name || selectedField.id.slice(0, 8)}</>
      ) : (
        <>📍 Select a field</>
      )}

      <style jsx>{`
        .coords-display {
          position: absolute;
          top: 16px;
          left: 70px;
          height: 44px;
          background: rgba(10, 22, 40, 0.95);
          color: #fff;
          padding: 0 16px;
          border-radius: 8px;
          font-size: 13px;
          z-index: 100;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import type { LayerKey, SourceKey } from "@/lib/types";
import { SOURCE_NAMES } from "@/lib/types";
import { INDEX_COLOR_RAMPS } from "@/lib/constants";
import { getVegetationLabel } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                               SOURCE DROPDOWN                               */
/* -------------------------------------------------------------------------- */

interface MapSourceDropdownProps {
  selectedSource: SourceKey;
  onSourceChange: (source: SourceKey) => void;
}

export function MapSourceDropdown({
  selectedSource,
  onSourceChange,
}: MapSourceDropdownProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="pill-wrapper">
      <button ref={btnRef} type="button" onClick={() => setOpen(v => !v)}>
        {SOURCE_NAMES[selectedSource]} ▾
      </button>

      {open &&
        ReactDOM.createPortal(
          <ul ref={menuRef} className="pill-menu">
            {Object.entries(SOURCE_NAMES).map(([key, label]) => (
              <li
                key={key}
                onClick={() => {
                  onSourceChange(key as SourceKey);
                  setOpen(false);
                }}
              >
                {label}
              </li>
            ))}
          </ul>,
          document.body
        )}

      <PillStyles />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               LAYER DROPDOWN                                */
/* -------------------------------------------------------------------------- */

interface MapLayerDropdownProps {
  selectedLayer: LayerKey;
  onLayerChange: (layer: LayerKey) => void;
  onLoadTodaysImage: () => void;
}

export function MapLayerDropdown({
  selectedLayer,
  onLayerChange,
  onLoadTodaysImage,
}: MapLayerDropdownProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);

  const layers: LayerKey[] = [
    "todays_image",
    "ndvi",
    "ndwi",
    "ndre",
    "savi",
    "evi",
    "gndvi",
    "sipi",
    "ndmi",
  ];

  const layerLabelMap: Record<LayerKey, string> = {
    ndvi: "NDVI (Vegetation Health)",
    ndre: "NDRE (Crop Nitrogen)",
    evi: "EVI (Canopy Density)",
    savi: "SAVI (Soil Adjusted)",
    ndwi: "NDWI (Surface Water)",
    ndmi: "NDMI (Water Stress)",
    gndvi: "GNDVI (Nitrogen / Chlorophyll)",
    sipi: "SIPI (Plant Stress)",
    todays_image: "Today's Image",
  };

  function handleLayerSelect(layer: LayerKey) {
    if (layer === "todays_image") {
      onLoadTodaysImage();
    } else {
      onLayerChange(layer);
    }
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="pill-wrapper">
      <button ref={btnRef} type="button" onClick={() => setOpen(v => !v)}>
        {layerLabelMap[selectedLayer]} ▾
      </button>

      {open &&
        ReactDOM.createPortal(
          <ul ref={menuRef} className="pill-menu">
            {layers.map(layer => (
              <li key={layer} onClick={() => handleLayerSelect(layer)}>
                {layerLabelMap[layer]}
              </li>
            ))}
          </ul>,
          document.body
        )}

      <PillStyles />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   LEGEND                                    */
/* -------------------------------------------------------------------------- */

export function MapLegend({ selectedLayer }: { selectedLayer: LayerKey }) {
  // DEFAULT STATE: OPEN (true) - Legend displays automatically
  const [open, setOpen] = useState(true);
  
  if (selectedLayer === "todays_image") return null;

  const ramp = INDEX_COLOR_RAMPS[selectedLayer];
  if (!ramp || ramp.length === 0) return null;

  return (
    // LEFT SIDEBAR CONTAINER: full height with smooth animation
    <div 
      className="absolute left-4 top-4 bottom-[80px] z-50 w-[260px] overflow-y-auto rounded-xl p-0"
      style={{
        animation: "legendFadeIn 0.3s ease-in",
      }}
    >
      {/* LEGEND CARD: white background, shadow, rounded corners on RIGHT only */}
      <div 
        className="bg-white/20 backdrop-blur-md text-white rounded-xl shadow-lg p-4 border border-white/30 h-full flex flex-col"
        style={{
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
          transition: "all 0.2s ease",
        }}
      >
        {/* HEADER WITH TOGGLE BUTTON */}
        <button 
          className="flex items-center justify-between w-full font-semibold text-left text-white hover:text-gray-100 transition-colors flex-shrink-0"
          onClick={() => setOpen(!open)}
          style={{ outline: "none" }}
        >
          <span className="text-sm font-bold">Index Legend</span>
          <span className="text-lg">{open ? '▲' : '▼'}</span>
        </button>

        {/* LEGEND CONTENT: scrollable when open */}
        {open && (
          <div 
            className="overflow-y-auto space-y-2 border-t border-white/30 pt-3 mt-3 flex-1"
            style={{
              animation: "contentFadeIn 0.3s ease-in",
            }}
          >
            {ramp.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block w-4 h-4 rounded flex-shrink-0"
                  style={{ 
                    backgroundColor: item.color,
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                  }}
                />
                <div className="flex-1">
                  <span className="text-white font-medium">
                    {item.min.toFixed(2)} - {item.max.toFixed(2)}
                  </span>
                  {(item.label || getVegetationLabel((item.min + item.max) / 2, selectedLayer).label) && (
                    <span className="block text-white/80 text-xs mt-0.5">
                      {item.label || getVegetationLabel((item.min + item.max) / 2, selectedLayer).label}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SMOOTH FADE-IN AND SLIDE-IN ANIMATIONS */}
      <style jsx>{`
        @keyframes legendFadeIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes contentFadeIn {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 600px;
          }
        }

        :global(.map-legend-sidebar) {
          user-select: none;
        }

        /* Mobile responsiveness: hidden on very small screens */
        @media (max-width: 480px) {
          :global(.map-legend-sidebar) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               SHARED STYLES                                 */
/* -------------------------------------------------------------------------- */

function PillStyles() {
  return (
    <style jsx>{`
      .pill-wrapper {
        position: relative;
        display: inline-block;
      }
      .pill-menu {
        position: absolute;
        background: #fff;
        border: 1px solid #000;
        border-radius: 8px;
        padding: 6px;
        z-index: 2000;
      }
      .pill-menu li {
        cursor: pointer;
        padding: 6px;
      }
      .pill-menu li:hover {
        background: #f3f4f6;
      }
    `}</style>
  );
}

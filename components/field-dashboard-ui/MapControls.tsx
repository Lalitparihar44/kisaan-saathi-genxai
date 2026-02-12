"use client";

import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import type { LayerKey, SourceKey } from "@/lib/types";
import { SOURCE_NAMES } from "@/lib/types";
import { INDEX_COLOR_RAMPS } from "@/lib/constants";

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
    "ndvi",
    "ndre",
    "evi",
    "savi",
    "ndwi",
    "ndmi",
    "gndvi",
    "sipi",
    "todays_image",
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
  const [open, setOpen] = useState(false);
  
  if (selectedLayer === "todays_image") return null;

  const ramp = INDEX_COLOR_RAMPS[selectedLayer];
  if (!ramp || ramp.length === 0) return null;

  return (
    <div className="map-controls-legend p-2 text-white">
      <button 
        className="flex items-center justify-between w-full font-semibold text-left"
        onClick={() => setOpen(!open)}
      >
        Index legend
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="max-h-[20vh] overflow-y-auto space-y-1 border-t border-white/30 pt-2 mt-2 container">
          {ramp.map((item, idx) => (
            <div key={idx} className="row items-center text-xs my-2">
              <span
                className="inline-block w-4 h-5 rounded-circle col-1 p-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-center col-4 p-0 px-1">
                {item.min.toFixed(2)} - {item.max.toFixed(2)}
              </span>
              {item.label && <span className="col-7 text-left p-0 px-1">{item.label}</span>}
            </div>
          ))}
        </div>
      )}
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

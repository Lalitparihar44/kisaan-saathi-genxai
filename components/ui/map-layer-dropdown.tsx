'use client';

import React, { useState } from 'react';
import { LayerKey, LAYER_NAMES } from '@/lib/types';

interface MapLayerDropdownProps {
  selectedLayer: LayerKey;
  onLayerChange: (layer: LayerKey) => void;
  layers?: Record<LayerKey, string>;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  onClick?: () => void;
}

const MapLayerDropdown: React.FC<MapLayerDropdownProps> = ({
  selectedLayer,
  onLayerChange,
  layers,
  dropdownOpen,
  setDropdownOpen,
  onClick,
}) => {
  const layersToUse = layers || LAYER_NAMES;
  const layerKeys = Object.keys(layersToUse) as LayerKey[];
  
  return (
    <div
      className="btn-group ml-2 my-2"
      style={{ position: "relative" }}
    >
      <button
        type="button"
        className="btn dropdown-toggle relative my-2"
        onClick={() => {  setDropdownOpen(!dropdownOpen); onClick?.();}}
        aria-expanded={dropdownOpen}
        style={{ backgroundColor: "#10B981", color: "white" }}
      >
        {LAYER_NAMES[selectedLayer]}
      </button>
      <ul
        className={`dropdown-menu ${dropdownOpen ? "show" : ""}`}
        style={{
          position: "absolute",
          top: "100%",
          left: "0",
          zIndex: 1000,
          display: dropdownOpen ? "block" : "none",
          maxHeight: "200px",
          overflowY: "auto",
          width: "250px",
          padding: "8px",
        }}
      >
        {layerKeys.map((layerKey) => (
          <li key={layerKey}>
            <a
              className="dropdown-item"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onLayerChange(layerKey);
                setDropdownOpen(false);
              }}
            >
              {layersToUse[layerKey]}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MapLayerDropdown;
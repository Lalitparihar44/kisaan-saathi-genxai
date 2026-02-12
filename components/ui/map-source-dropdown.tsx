'use client';

import React, { useState } from 'react';
import { SourceKey, SOURCE_NAMES } from '@/lib/types';

interface MapSourceDropdownProps {
  selectedSource: SourceKey;
  onSourceChange: (source: SourceKey) => void;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  onClick?: () => void;
}

const MapSourceDropdown: React.FC<MapSourceDropdownProps> = ({
  selectedSource,
  onSourceChange,
  dropdownOpen,
  setDropdownOpen,
  onClick,
}) => {
  return (
    <div
      className="btn-group ml-2 my-2"
      style={{ position: "relative" }}
    >
      <button
        type="button"
        className="btn dropdown-toggle relative my-2"
        onClick={() => {setDropdownOpen(!dropdownOpen); onClick?.();}}
        aria-expanded={dropdownOpen}
        style={{ backgroundColor: "#10B981", color: "white" }}
      >
        {SOURCE_NAMES[selectedSource]}
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
        {Object.entries(SOURCE_NAMES).map(([key, label]) => (
          <li key={key}>
            <a
              className="dropdown-item"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSourceChange(key as SourceKey);
                setDropdownOpen(false);
              }}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MapSourceDropdown;
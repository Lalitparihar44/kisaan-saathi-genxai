import React, { useState } from "react";


interface MapSearchProps {
  onSearch: (query: string) => void;
  onCurrentLocation?: (coords: [number, number]) => void;
}

const MapSearch: React.FC<MapSearchProps> = ({ onSearch, onCurrentLocation }) => {
    const handleCurrentLocation = () => {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { longitude, latitude } = pos.coords;
          if (onCurrentLocation) onCurrentLocation([longitude, latitude]);
        },
        (err) => {
          alert("Unable to retrieve your location.");
        }
      );
    };
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
        console.log("MapSearch submitting query:", query);
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        type="text"
        placeholder="Search for a place..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ padding: 6, borderRadius: 4, boxShadow: "0 2px 6px rgba(0,0,0,0.25)", border: "1px solid #ccc", minWidth: 200 }}
      />
      <button type="submit" style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "#1976d2", color: "white" }}>
        Go
      </button>
      <button
        type="button"
        onClick={handleCurrentLocation}
        style={{ padding: "8px 12px", borderRadius: 4, border: "none", background: "#10b981", color: "white", marginLeft: 4, display: "flex", alignItems: "center", justifyContent: "center" }}
        title="Go to my current location"
      >
        {/* GPS/Crosshair icon */}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
          <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </button>
    </form>
  );
};

export default MapSearch;

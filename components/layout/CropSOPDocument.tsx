'use client';

type CropSopProps = {
  crop: {
    season?: string;
    crop_name: string;
    crop_cycle?: string;
    irrigation_type?: string;
    system?: string;

    climate?: string;
    soil?: string;

    propagation?: string;
    land_preparation?: string;

    sowing_or_planting?: string;
    spacing?: string;

    irrigation?: string;
    fertilizer?: string;

    weeding?: string;
    interculture_support?: string;

    pest_management?: string;
    harvest?: string;
  };
};

export default function CropSopDocument({ crop }: CropSopProps) {
  return (
    <div className="crop-sop">
      {/* Document Header */}
      <div className="doc-header">
        <h1>Standard Operating Procedure</h1>
        <h2>{crop.crop_name || '—'}</h2>
        <p>Comprehensive Cultivation Guide</p>
      </div>

      {/* Season Section */}
      <div className="season-section">
        <div className="season-header">
          <h3>
            <span className="season-label">{crop.season || '—'}</span> Season
            Cultivation
          </h3>
          <div className="season-info">
            <div className="season-info-item">
              <span>📅 Crop Cycle: {crop.crop_cycle || '—'}</span>
            </div>
            <div className="season-info-item">
              <span>💧 Irrigation: {crop.irrigation_type || '—'}</span>
            </div>
            <div className="season-info-item">
              <span>☀️ System: {crop.system || 'Open Field'}</span>
            </div>
            <div className="season-info-item">
              <span>📄 Version: v1.0</span>
            </div>
          </div>
        </div>

        {/* Section 1: Climate & Soil */}
        <div className="section">
          <div className="section-title">1. Climate & Soil Requirements</div>
          <div className="section-content">
            <div className="field">
              <span className="field-label">Climate: </span>
              <span className="field-value">{crop.climate || '—'}</span>
            </div>
            <div className="field">
              <span className="field-label">Soil: </span>
              <span className="field-value">{crop.soil || '—'}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Land Preparation & Propagation */}
        <div className="section">
          <div className="section-title">2. Land Preparation & Propagation</div>
          <div className="section-content">
            <div className="field">
              <span className="field-label">Propagation Method: </span>
              <span className="field-value">{crop.propagation || '—'}</span>
            </div>
            <div className="field">
              <span className="field-label">Land Preparation: </span>
              <span className="field-value">
                {crop.land_preparation || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Sowing & Spacing */}
        <div className="section">
          <div className="section-title">3. Sowing & Spacing</div>
          <div className="section-content">
            <div className="field">
              <span className="field-label">Sowing/Planting: </span>
              <span className="field-value">
                {crop.sowing_or_planting || '—'}
              </span>
            </div>
            <div className="field">
              <span className="field-label">Spacing: </span>
              <span className="field-value">{crop.spacing || '—'}</span>
            </div>
          </div>
        </div>

        {/* Section 4: Irrigation & Fertilizer */}
        <div className="section">
          <div className="section-title">
            4. Irrigation & Fertilizer Management
          </div>
          <div className="section-content">
            <div className="field">
              <span className="field-label">Irrigation: </span>
              <span className="field-value">{crop.irrigation || '—'}</span>
            </div>
            <div className="field">
              <span className="field-label">Fertilizer: </span>
              <span className="field-value">{crop.fertilizer || '—'}</span>
            </div>
          </div>
        </div>

        {/* Section 5: Crop Maintenance */}
        <div className="section">
          <div className="section-title">5. Crop Maintenance</div>
          <div className="section-content">
            <div className="field">
              <span className="field-label">Weeding: </span>
              <span className="field-value">{crop.weeding || '—'}</span>
            </div>
            <div className="field">
              <span className="field-label">Interculture Support: </span>
              <span className="field-value">
                {crop.interculture_support || ' '}
              </span>
            </div>
          </div>
        </div>

        {/* Section 6: Pest Management */}
        <div className="section">
          <div className="section-title">6. Pest Management</div>
          <div className="section-content">
            <span className="field-value">{crop.pest_management || '—'}</span>
          </div>
        </div>

        {/* Section 7: Harvesting */}
        <div className="section">
          <div className="section-title">7. Harvesting</div>
          <div className="section-content">
            <span className="field-value">{crop.harvest || '—'}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="season-divider" />

      {/* Footer */}
      <div className="doc-footer">
        <p>
          This document contains comprehensive cultivation guidelines for all
          seasons
        </p>
        <p>Last Updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}

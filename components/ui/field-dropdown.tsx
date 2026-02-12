"use client";

import React from "react";
import { FieldFeature } from "@/lib/types";
import { fetchFieldById } from "@/lib/api";

interface SelectedField {
  id?: string;
  properties?: {
    name?: string;
  };
}

interface FormData {
  name: string;
  crop_name: string;
  notes: string;
  sowing_date: string;
}

interface FieldDropdownProps {
  fields: FieldFeature[];
  selectedField: SelectedField | null;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  handleSidebarFieldSelect: (field: FieldFeature) => void;
  setForm: (form: FormData) => void;
  setEditFieldId: (id: string | null) => void;
  setShowFieldModal: (show: boolean) => void;
  handleDeleteField: (id: string, event: React.MouseEvent) => void;
  onClick?: () => void;
}

const FieldDropdown: React.FC<FieldDropdownProps> = ({
  fields,
  selectedField,
  dropdownOpen,
  setDropdownOpen,
  handleSidebarFieldSelect,
  setForm,
  setEditFieldId,
  setShowFieldModal,
  handleDeleteField,
  onClick,
}) => {
  return (
    <div className="btn-group ml-2 my-2" style={{ position: "relative" }}>
      <button
        type="button"
        className="btn dropdown-toggle relative my-2"
        onClick={() => {setDropdownOpen(!dropdownOpen); onClick?.();}}
        aria-expanded={dropdownOpen}
        style={{ backgroundColor: "#10B981", color: "white" }}
      >
        {selectedField?.properties?.name || `Select Field`}
        {fields.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full px-1 min-w-[18px] h-[18px] flex items-center justify-center">
            {fields.length}
          </span>
        )}
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
        }}
      >
        {fields.length === 0 ? (
          <li>
            <a className="dropdown-item" href="#">
              Draw a polygon on the map to add a field
            </a>
          </li>
        ) : (
          fields.map((field) => {
            const fieldId = field.properties?.id;
            const isActive = selectedField?.id === fieldId?.toString();
            return (
              <li key={fieldId || Math.random()}>
                <div
                  className={`dropdown-item bg-none`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    cursor: "pointer",
                    padding: "2% 5%",
                    color: "black",
                    width: "100%",
                    textAlign: "left",
                    backgroundColor: isActive ? "#dadadaff" : "transparent",
                  }}
                  onClick={(e) => {
                    // Only handle click if not clicking on action buttons
                    if (!(e.target as HTMLElement).closest(".action-btn")) {
                      handleSidebarFieldSelect(field);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSidebarFieldSelect(field);
                    }
                  }}
                  tabIndex={0}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      className="fw-medium"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 110,
                        fontWeight: 500,
                      }}
                      title={field.properties?.name || `Field ${fieldId}`}
                    >
                      {field.properties?.name
                        ? field.properties.name.length > 16
                          ? `${field.properties.name.slice(0, 12)}...`
                          : field.properties.name
                        : `Field ${fieldId}`}
                    </div>
                    <div className="text-muted small" style={{ fontSize: 12 }}>
                      {field.properties?.area
                        ? `${Number(field.properties.area).toFixed(2)} ha`
                        : "Area N/A"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    <button
                      className="btn btn-sm btn-outline-primary ms-2 action-btn"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const data = await fetchFieldById(fieldId?.toString() || "");
                          setForm({
                            name: data.name || "",
                            crop_name: data.crop_name || "",
                            notes: data.notes || "",
                            sowing_date: data.sowing_date
                              ? data.sowing_date.slice(0, 10)
                              : ""
                          });
                        } catch {
                          setForm({
                            name: field.properties?.name || "",
                            crop_name: field.properties?.crop_name || "",
                            notes: field.properties?.notes || "",
                            sowing_date: field.properties?.sowing_date || ""
                          });
                        }
                        setEditFieldId(fieldId?.toString() || null);
                        setShowFieldModal(true);
                      }}
                      title="Edit field"
                      disabled={isActive}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger ms-2 action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteField(fieldId?.toString() || "", e);
                      }}
                      title="Delete field"
                      disabled={isActive}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};

export default FieldDropdown;

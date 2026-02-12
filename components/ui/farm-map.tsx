'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import MapSearch from '../../components/MapSearch';
import { FieldFeature, SelectedField, LayerKey, HoverInfo } from '@/lib/types';
import FieldDropdown from './field-dropdown';
import MapLayerDropdown from './map-layer-dropdown';
import MapSourceDropdown from './map-source-dropdown';
import {
  Timeline,
  HoverTooltip,
  LoadingOverlay,
  CoordsDisplay,
  MapLegend,
} from '@/components/field-dashboard-ui';
import { geocodePlace } from '@/lib/geocode';
import { TIMELINE_DATES } from '@/lib/constants';
import {
  deleteField,
  updateField,
  fetchScenes,
  SatelliteScene,
  createField,
  calculateIndices,
  selectDefaultField,
  fetchCommodities,
} from '@/lib/api';
import { useMap } from '@/hooks/useMap';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { LAYER_NAMES } from '@/lib/types';
import { toast } from 'react-toastify';
import { Textarea } from './textarea';
import * as turf from '@turf/turf';
import mapboxgl from 'mapbox-gl';

interface FarmMapProps {
  title: string;
  initialLayer?: LayerKey;
  healthCard?: boolean;
  showZoomControls?: boolean;
  showLegend?: boolean;
  onMapReady?: (map: mapboxgl.Map) => void;
  onFieldSelect?: (field: SelectedField | null) => void;
}

// Simple modal component
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.3)',
        zIndex: 100001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 10,
          padding: 16,
          minWidth: 300,
          maxWidth: '95vw',
          boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

const FarmMap: React.FC<FarmMapProps> = ({
  title,
  initialLayer = 'ndvi',
  healthCard = false,
  showZoomControls = true,
  showLegend = true,
  onMapReady,
  onFieldSelect: onFieldSelectProp,
}) => {
  const hasFittedRef = useRef(false);

  // Modal state for new field
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [pendingGeometry, setPendingGeometry] = useState<
    GeoJSON.Polygon | GeoJSON.MultiPolygon | null
  >(null);
  const [form, setForm] = useState({
    name: '',
    crop_name: '',
    notes: '',
    sowing_date: '',
  });
  const [saving, setSaving] = useState(false);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<LayerKey>(initialLayer);
  const [selectedField, setSelectedField] = useState<SelectedField | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    TIMELINE_DATES[TIMELINE_DATES.length - 1],
  );
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false);
  const [fields, setFields] = useState<FieldFeature[]>([]);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [layerDropdownOpen, setLayerDropdownOpen] = useState(false);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [availableDates, setAvailableDates] =
    useState<string[]>(TIMELINE_DATES);
  const [calendarDates, setCalendarDates] = useState<string[]>([]);
  const [nextImageDate, setNextImageDate] = useState<string | null>(null);
  const [isLoadingScenes, setIsLoadingScenes] = useState(false);
  const [editFieldId, setEditFieldId] = useState<string | null>(null);
  const [showDrawInstruction, setShowDrawInstruction] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
  const [commodities, setCommodities] = useState<any[]>(['aak']);
  const [cropDropdownOpen, setCropDropdownOpen] = useState(false);
  const MIN_ZOOM = 4;
  const MAX_ZOOM = 12;
  const ZOOM_STEP = 0.25;
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);

  // State for print/PDF mode map snapshot
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // =======================
  // Measure Distance State
  // =======================
  const [isMeasuring, setIsMeasuring] = useState(false);
  const measurePointsRef = useRef<number[][]>([]);
  const measurePopupRef = useRef<mapboxgl.Popup | null>(null);
  // =======================
  // Map Scale (EOS-style)
  // =======================
  const scaleRef = useRef<HTMLDivElement | null>(null);

  // =======================
  // Measure Distance Logic
  // =======================
  const clearMeasure = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (map.getLayer('measure-line')) map.removeLayer('measure-line');
    if (map.getSource('measure-line')) map.removeSource('measure-line');

    measurePointsRef.current = [];
    measurePopupRef.current?.remove();
    measurePopupRef.current = null;
  }, []);

  const drawMeasureLine = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const coords = measurePointsRef.current;
    if (coords.length < 2) return;

    const line = turf.lineString(coords);
    const distanceKm = turf.length(line, { units: 'kilometers' });

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
      properties: {},
    };

    if (map.getSource('measure-line')) {
      (map.getSource('measure-line') as mapboxgl.GeoJSONSource).setData(
        geojson,
      );
    } else {
      map.addSource('measure-line', {
        type: 'geojson',
        data: geojson,
      });

      map.addLayer({
        id: 'measure-line',
        type: 'line',
        source: 'measure-line',
        paint: {
          'line-color': '#00E5FF',
          'line-width': 3,
        },
      });
    }

    const last = coords[coords.length - 1];

    measurePopupRef.current?.remove();
    measurePopupRef.current = new mapboxgl.Popup({ closeButton: false })
      .setLngLat(last as [number, number])
      .setHTML(
        `
      <div style="font-size:12px">
        <b>Total distance</b><br/>
        ${
          distanceKm < 1
            ? `${(distanceKm * 1000).toFixed(1)} m`
            : `${distanceKm.toFixed(2)} km`
        }
      </div>
    `,
      )
      .addTo(map);
  }, []);

  useEffect(() => {
    if (!selectedField) {
      setAvailableDates(TIMELINE_DATES);
      setNextImageDate(null);
      return;
    }

    const loadScenes = async () => {
      setIsLoadingScenes(true);
      try {
        const response = await fetchScenes({
          fieldId: selectedField.id,
          maxCloudCover: 50,
          fromDate: '2022-01-01', // full history
        });

        const allDates = response.scenes.map((s: SatelliteScene) => s.date);

        // FULL calendar
        setCalendarDates(allDates);

        // LAST N for timeline
        const recentDates = allDates.slice(-8);
        setAvailableDates(recentDates);

        // auto select latest
        setSelectedDate(recentDates[recentDates.length - 1] ?? null);
      } catch (err) {
        console.error('Failed to fetch scenes', err);
      } finally {
        setIsLoadingScenes(false);
      }
    };

    loadScenes();
  }, [selectedField?.id]);

  useEffect(() => {
    if (!scaleRef.current) return;

    let map: mapboxgl.Map | null = null;

    const attach = () => {
      if (!mapRef.current || !scaleRef.current) return;

      map = mapRef.current;
      const scaleEl = scaleRef.current;

      const updateScale = () => {
        const canvas = map!.getCanvas();
        const widthPx = 100; // EOS reference width
        const y = canvas.clientHeight / 2;

        const left = map!.unproject([0, y]);
        const right = map!.unproject([widthPx, y]);

        const meters =
          turf.distance([left.lng, left.lat], [right.lng, right.lat], {
            units: 'kilometers',
          }) * 1000;

        if (meters >= 1000) {
          scaleEl.innerText = `${(meters / 1000).toFixed(1)} km`;
        } else if (meters >= 100) {
          scaleEl.innerText = `${Math.round(meters / 10) * 10} m`;
        } else {
          scaleEl.innerText = `${Math.round(meters)} m`;
        }
      };

      updateScale();
      map.on('zoom', updateScale);
      map.on('move', updateScale);

      return () => {
        map?.off('zoom', updateScale);
        map?.off('move', updateScale);
      };
    };

    // Wait until useMap() initializes Mapbox
    const interval = setInterval(() => {
      if (mapRef.current) {
        clearInterval(interval);
        attach();
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is outside any dropdown and close only the open ones
      const clickedInsideDropdown = target.closest(
        '.dropdown, [class*="dropdown"]',
      );

      if (!clickedInsideDropdown) {
        if (cropDropdownOpen) setCropDropdownOpen(false);
        if (dropdownOpen) setDropdownOpen(false);
        if (layerDropdownOpen) setLayerDropdownOpen(false);
        if (sourceDropdownOpen) setSourceDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [cropDropdownOpen, dropdownOpen, layerDropdownOpen, sourceDropdownOpen]);

  const handleFieldSelect = useCallback(async (field: SelectedField | null) => {
    setSelectedField(field);
    if (field?.id) {
      await selectDefaultField(field.id);
    }
    if (!field) setHoverInfo(null);
  }, []);

  // Separate effect to notify parent when selectedField changes
  useEffect(() => {
    if (onFieldSelectProp) {
      onFieldSelectProp(selectedField);
    }
  }, [selectedField, onFieldSelectProp]);

  const handleFieldsLoad = useCallback((loadedFields: FieldFeature[]) => {
    setFields(loadedFields);
    const selected = loadedFields.find((f) => f.properties.is_selected);
    if (selected) {
      const selectedFieldData: SelectedField = {
        id: selected.properties.id,
        properties: selected.properties,
        geometry: selected.geometry,
      };
      handleFieldSelect(selectedFieldData);
      handleSidebarFieldSelect(selected);
    }
  }, []);

  const handleLoadingChange = useCallback((isLoading: boolean) => {
    setIsLoadingHeatmap(isLoading);
  }, []);

  const handleHoverChange = useCallback((info: HoverInfo | null) => {
    setHoverInfo(info);
  }, []);

  const zoomAroundPolygon = (delta: number) => {
    if (!mapRef.current || !selectedField?.geometry) return;

    const center = turf.center(selectedField.geometry).geometry.coordinates as [
      number,
      number,
    ];

    mapRef.current.easeTo({
      center,
      zoom: mapRef.current.getZoom() + delta,
      duration: 300,
    });
  };

  const {
    mapRef,
    zoomToField,
    renderHeatmap,
    renderTodaysImage,
    deleteFieldFromMap,
    reloadFields,
  } = useMap({
    containerRef: mapContainer,
    selectedLayer,
    selectedDate,
    onFieldSelect: handleFieldSelect,
    onFieldsLoad: handleFieldsLoad,
    onLoadingChange: handleLoadingChange,
    onHoverChange: handleHoverChange,
    onDrawPolygon: async (geometry) => {
      setPendingGeometry(geometry);
      if (geometry) {
        console.log(
          'Fetching commodities for geometry',
          geometry.coordinates[0][0],
        );
        const data = await fetchCommodities(geometry.coordinates[0][0]);
        if (data.length) {
          setCommodities(data);
        }
      }
      setEditFieldId(null);
      setShowDrawInstruction(false);
      setForm({
        name: '',
        crop_name: '',
        notes: '',
        sowing_date: '',
      });
      setShowFieldModal(true);
    },
  });

  // ✅ Notify parent when Mapbox map is ready (for print / PDF snapshot)
  useEffect(() => {
    if (!onMapReady) return;
    if (!mapRef.current) return;
    const map = mapRef.current;

    // ✅ Wait for ALL tiles + raster layers
    map.once('idle', () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          onMapReady(map);
        }, 300);
      });
    });
  }, [onMapReady]);

  useEffect(() => {
    if (!healthCard) return;
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Disable all interactions to prevent re-render during capture
    map.boxZoom.disable();
    map.doubleClickZoom.disable();
    map.dragPan.disable();
    map.dragRotate.disable();
    map.keyboard.disable();
    map.scrollZoom.disable();
    map.touchZoomRotate.disable();
  }, [healthCard]);

  useEffect(() => {
    if (!healthCard) return;
    if (!mapRef.current) return;
    if (!selectedField?.geometry) return;
    if (hasFittedRef.current) return;

    try {
      const map = mapRef.current;
      const geometry = selectedField.geometry;

      // ✅ robust for Polygon & MultiPolygon
      const bbox = turf.bbox(geometry);
      const center = turf.center(geometry).geometry.coordinates as [
        number,
        number,
      ];

      // ✅ smooth + stable focus
      map.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        {
          padding: 60, // IMPORTANT: stability
          duration: 400, // smooth (no jump)
          maxZoom: 17,
        },
      );

      // ✅ lock zoom origin to polygon center
      map.easeTo({
        center,
        duration: 0,
      });

      hasFittedRef.current = true;
    } catch (err) {
      console.error('Health card fitBounds failed', err);
    }
  }, [healthCard, selectedField?.id]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!isMeasuring) return;

      measurePointsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      drawMeasureLine();
    };

    if (isMeasuring) {
      map.getCanvas().style.cursor = 'crosshair';
      map.on('click', handleClick);
    }

    return () => {
      map.getCanvas().style.cursor = '';
      map.off('click', handleClick);
    };
  }, [isMeasuring, drawMeasureLine]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  // Handler to activate draw mode
  const handleCreatePolygon = () => {
    setDropdownOpen(false);
    setLayerDropdownOpen(false);
    setSourceDropdownOpen(false);
    if (!mapRef.current) return;
    // Find the MapboxDraw control
    const controls = (mapRef.current as any)._controls || [];
    const drawControl = controls.find(
      (ctrl: any) => ctrl instanceof MapboxDraw,
    );
    if (drawControl) {
      drawControl.changeMode('draw_polygon');
      setShowDrawInstruction(true);
      // Hide instruction after 3 seconds
      setTimeout(() => {
        setShowDrawInstruction(false);
      }, 3000);
    }
  };

  function focusPolygon(
    map: mapboxgl.Map,
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  ) {
    const bbox = turf.bbox(geometry);
    const center = turf.center(geometry).geometry.coordinates as [
      number,
      number,
    ];

    map.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      {
        padding: 60,
        duration: 500,
        maxZoom: 17,
      },
    );

    // 🔒 lock zoom center to polygon
    map.easeTo({
      center,
      duration: 0,
    });
  }

  // Handler for modal form submit
  async function handleFieldSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    let res;
    try {
      if (editFieldId) {
        // Edit mode
        res = await updateField(editFieldId, {
          ...form,
          sowing_date: form.sowing_date,
        });
      } else {
        // Create mode
        if (!pendingGeometry) return;
        res = await createField({
          ...form,
          sowing_date: form.sowing_date,
          geom: pendingGeometry,
        });
        const field = res.data;
        // Calculate indices
        await calculateIndices(field.id, null, null);
      }
      setShowFieldModal(false);
      setPendingGeometry(null);
      setEditFieldId(null);
      setForm({
        name: '',
        crop_name: '',
        notes: '',
        sowing_date: '',
      });
      if (res.success) {
        await reloadFields();
        toast.success(res.message || 'Field saved successfully');
      } else {
        toast.success(res.message || 'Failed to save field');
      }
    } catch (err) {
      console.error('Field submit error:', err);
      toast.error('Failed to save field: ' + (err as any).message);
    } finally {
      setSaving(false);
    }
  }

  // Search handler for MapSearch
  async function handleSearch(query: string) {
    if (!mapRef.current) return;
    setDropdownOpen(false);
    setSourceDropdownOpen(false);
    setLayerDropdownOpen(false);
    // Check if query is a lat,lng pair (lat first, then lng)
    const coordMatch = query
      .trim()
      .match(/^(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (
        !isNaN(lat) &&
        !isNaN(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
      ) {
        // Mapbox expects [lng, lat] order
        mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
        return;
      } else {
        console.warn('[SEARCH DEBUG] Invalid lat/lng values:', lat, lng);
      }
    }
    // Otherwise, use geocoding
    const result = await geocodePlace(query);
    if (result) {
      mapRef.current.flyTo({ center: result.center, zoom: 15 });
    } else {
      alert('Place not found');
    }
  }

  function handleCurrentLocation(coords: [number, number]) {
    if (!mapRef.current) return;
    setDropdownOpen(false);
    setSourceDropdownOpen(false);
    setLayerDropdownOpen(false);
    mapRef.current.flyTo({ center: coords, zoom: 18 });
  }

  const handleSidebarFieldSelect = useCallback(
    async (field: FieldFeature) => {
      const selectedFieldData: SelectedField = {
        id: field.properties.id,
        properties: field.properties,
        geometry: field.geometry,
      };
      handleFieldSelect(selectedFieldData);
      zoomToField(field);
      if (mapRef.current) {
        if (selectedLayer === 'todays_image') {
          renderTodaysImage(mapRef.current, selectedFieldData);
        } else {
          await renderHeatmap(
            mapRef.current,
            selectedFieldData,
            selectedDate,
            selectedLayer,
            true, // ✅ no zoom jump
          );
        }
      }
      setDropdownOpen(false);
      setSourceDropdownOpen(false);
      setLayerDropdownOpen(false);
    },
    [zoomToField, handleFieldSelect, renderHeatmap],
  );

  const handleDeleteField = useCallback(
    async (fieldId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setFieldToDelete(fieldId);
      setShowDeleteModal(true);
    },
    [],
  );

  const confirmDelete = async () => {
    if (!fieldToDelete) return;
    try {
      const success = await deleteField(fieldToDelete);
      if (success) {
        setFields((prev) =>
          prev.filter((f) => f.properties.id !== fieldToDelete),
        );
        if (selectedField?.id === fieldToDelete) handleFieldSelect(null);
        deleteFieldFromMap(fieldToDelete);
      }
    } catch (error) {
      console.error('Failed to delete field:', error);
      toast.error('Failed to delete field. Please try again.');
    } finally {
      setShowDeleteModal(false);
      setFieldToDelete(null);
    }
  };

  const toggleFullscreen = async () => {
    if (!fullscreenRef.current) return;

    if (!document.fullscreenElement) {
      await fullscreenRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleLayerChange = useCallback((layer: LayerKey) => {
    setSelectedLayer(layer);
  }, []);

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  return (
    <div ref={fullscreenRef} className="flex flex-col h-full">
      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setFieldToDelete(null);
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h3 style={{ fontWeight: 600, marginBottom: 12, color: '#dc2626' }}>
            Delete Field
          </h3>
          <p style={{ marginBottom: 20, color: '#6b7280' }}>
            Are you sure you want to delete this field? This action cannot be
            undone.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setFieldToDelete(null);
              }}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: 6,
                padding: '8px 20px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              style={{
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 20px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showFieldModal}
        onClose={() => {
          setShowFieldModal(false);
          setPendingGeometry(null);
          setEditFieldId(null);
          setShowDrawInstruction(false);
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => {
            setShowFieldModal(false);
            setPendingGeometry(null);
            setEditFieldId(null);
            setShowDrawInstruction(false);
          }}
          aria-label="Close modal"
          className="absolute right-3 top-3 h-9 w-9 rounded-full
                    bg-gray-100 text-gray-600 hover:bg-gray-200
                    focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          ✕
        </button>

        {/* Centered form container */}
        <form onSubmit={handleFieldSubmit} className="max-w-md mx-auto">
          <h3 className="text-lg font-dark fs-800 mb-4 text-center">
            Enter Field Details
          </h3>

          {/* Farm name */}
          <div className="mb-3">
            <label className="block">
              Farm name
              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full mt-1 rounded border border-gray-300 p-2"
              />
            </label>
          </div>

          {/* Crop Name */}
          <div className="mb-3">
            <label className="block mb-1">Crop Name</label>
            <div className="dropdown w-full rounded border border-gray-300">
              <button
                className="btn bg-white text-dark dropdown-toggle w-full text-left d-flex justify-content-between align-items-center"
                type="button"
                onClick={() => setCropDropdownOpen(!cropDropdownOpen)}
                style={{ padding: '8px 12px' }}
              >
                {form.crop_name || 'Select a crop'}
              </button>
              {cropDropdownOpen && (
                <ul
                  className="dropdown-menu show "
                  style={{
                    maxHeight: '150px',
                    overflowY: 'auto',
                    minWidth: '100%',
                  }}
                >
                  {commodities.map((commodity, index) => (
                    <li key={`${commodity}-${index}`}>
                      <a
                        className="dropdown-item"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setForm((f) => ({ ...f, crop_name: commodity }));
                          setCropDropdownOpen(false);
                        }}
                      >
                        {commodity}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Sowing Date */}
          <div className="mb-3">
            <label className="block">
              Sowing Date
              <input
                required
                type="date"
                value={form.sowing_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sowing_date: e.target.value }))
                }
                className="w-full mt-1 rounded border border-gray-300 p-2"
              />
            </label>
          </div>

          {/* notes */}
          <div className="mb-3">
            <label className="block">
              Notes
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                className="w-full mt-1 rounded border border-gray-300 p-2"
              />
            </label>
          </div>

          {/* Save button centered */}
          <button
            type="submit"
            disabled={saving}
            className="block mx-auto w-100 rounded bg-emerald-600 px-6 py-2
                      font-semibold text-white hover:bg-emerald-700
                      disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </Modal>

      {/* Top control bar above the map */}
      {!healthCard && (
        <div
          className="w-full flex flex-col sm:flex-row sm:flex-wrap items-center justify-between px-2 sm:px-3 py-1 bg-white rounded-t-2xl shadow"
          style={{ height: 'auto', minHeight: '10%' }}
        >
          <div className="flex flex-col sm:flex-row flex-wrap items-center w-full sm:w-auto">
            <h2 className="text-sm sm:text-lg md:text-xl font-bold text-gray-800 mb-1 sm:mb-0 mr-0 sm:mr-2">
              {title}
            </h2>
            {title == 'My Farm' && (
              <>
                <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto mt-1 sm:mt-0">
                  <MapSearch
                    onSearch={handleSearch}
                    onCurrentLocation={handleCurrentLocation}
                  />
                  <button
                    type="button"
                    className="btn btn-success mt-1 sm:mt-0 sm:ml-2 w-full sm:w-auto"
                    style={{
                      backgroundColor: '#10B981',
                      color: 'white',
                      padding: '6px 16px',
                      borderRadius: 6,
                      fontWeight: 600,
                      border: 'none',
                    }}
                    onClick={handleCreatePolygon}
                  >
                    Create new field
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-row flex-wrap items-center justify-center sm:justify-end w-full sm:w-auto mt-2 sm:mt-0">
            <FieldDropdown
              fields={fields}
              selectedField={selectedField}
              dropdownOpen={dropdownOpen}
              setDropdownOpen={setDropdownOpen}
              handleSidebarFieldSelect={handleSidebarFieldSelect}
              setForm={(formData) => setForm(formData as any)}
              setEditFieldId={setEditFieldId}
              setShowFieldModal={setShowFieldModal}
              handleDeleteField={handleDeleteField}
              onClick={() => {
                setLayerDropdownOpen(false);
                setSourceDropdownOpen(false);
              }}
            />
            <MapLayerDropdown
              selectedLayer={selectedLayer}
              dropdownOpen={layerDropdownOpen}
              setDropdownOpen={setLayerDropdownOpen}
              onLayerChange={handleLayerChange}
              layers={
                title === 'Soil Map'
                  ? ({ savi: 'SAVI – Soil Adjusted Vegetation' } as Record<
                      LayerKey,
                      string
                    >)
                  : LAYER_NAMES
              }
              onClick={() => {
                setDropdownOpen(false);
                setSourceDropdownOpen(false);
              }}
            />
            <div className="hidden sm:block">
              <MapSourceDropdown
                selectedSource={'sentinel2'}
                dropdownOpen={sourceDropdownOpen}
                setDropdownOpen={setSourceDropdownOpen}
                onSourceChange={() => {}}
                onClick={() => {
                  setLayerDropdownOpen(false);
                  setDropdownOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
      {showDrawInstruction && (
        <div className="text-center py-2 text-sm text-gray-600 bg-blue-50">
          Draw a polygon on the map to add a field
        </div>
      )}
      <div className="flex-1 min-h-0">
        <div ref={mapWrapperRef} className="dashboard-container p-0 h-full">
          <div className="map-container h-full" ref={mapContainer} />

          {!healthCard && (
            <div
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 3000,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                width: 44,
              }}
            >
              {/* MAP SCALE (EOS STYLE) */}
              <div
                ref={scaleRef}
                style={{
                  alignSelf: 'flex-end',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                20 m
              </div>

              {/* MEASURE DISTANCE BUTTON */}
              <button
                onClick={() => {
                  setIsMeasuring((v) => {
                    if (v) clearMeasure();
                    return !v;
                  });
                  setDropdownOpen(false);
                  setLayerDropdownOpen(false);
                  setSourceDropdownOpen(false);
                }}
                title="Measure distance"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: isMeasuring
                    ? 'rgba(0, 229, 255, 0.95)'
                    : 'rgba(10,22,40,0.95)',
                  color: isMeasuring ? '#003344' : '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
                }}
              >
                📏
              </button>

              {/* FULLSCREEN BUTTON */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: 'rgba(10,22,40,0.95)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
                }}
              >
                {isFullscreen ? '❐' : '⛶'}
              </button>

              {/* ZOOM CONTROLS */}
              <div
                style={{
                  background: 'rgba(10, 22, 40, 0.95)',
                  borderRadius: 10,
                  padding: '10px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
                }}
              >
                {/* MEASURE DISTANCE BUTTON */}
                <button
                  onClick={() => zoomAroundPolygon(+0.5)}
                  className="zoom-btn-big"
                  style={{ color: 'white' }}
                >
                  +
                </button>

                <button
                  onClick={() => zoomAroundPolygon(-0.5)}
                  className="zoom-btn-big"
                  style={{ color: 'white' }}
                >
                  −
                </button>
              </div>
            </div>
          )}

          {/* Map legend in the left bottom corner */}
          {showLegend && !healthCard && (
            <MapLegend selectedLayer={selectedLayer} />
          )}

          {selectedField && (
            <HoverTooltip hoverInfo={hoverInfo} selectedLayer={selectedLayer} />
          )}

          <LoadingOverlay isLoading={isLoadingHeatmap} />

          <style jsx>{`
            .dashboard-container {
              position: relative;
              padding: 0 4px;
              width: 100%;
              height: 100%;
              overflow: hidden;
              background: #0a0a0a;
              box-sizing: border-box;
            }
            @media (min-width: 480px) {
              .dashboard-container {
                padding: 0 8px;
              }
            }
            @media (min-width: 640px) {
              .dashboard-container {
                padding: 0 24px;
              }
            }
            .map-container {
              width: 100%;
              height: 100%;
              overflow: hidden;
              background: #0a0a0a;
              box-sizing: border-box;
            }
            :global(.mapboxgl-ctrl-logo),
            :global(.mapboxgl-ctrl-attrib) {
              display: none !important;
            }
            :global(::-webkit-scrollbar) {
              width: 6px;
            }
            :global(::-webkit-scrollbar-track) {
              background: rgba(0, 0, 0, 0.2);
            }
            :global(::-webkit-scrollbar-thumb) {
              background: rgba(255, 255, 255, 0.2);
              border-radius: 3px;
            }
            :global(::-webkit-scrollbar-thumb:hover) {
              background: rgba(255, 255, 255, 0.3);
            }
          `}</style>
        </div>
      </div>
      {!healthCard && (
        <Timeline
          dates={availableDates}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          isLoading={isLoadingScenes}
          calendarDates={calendarDates}
        />
      )}
    </div>
  );
};

export default FarmMap;

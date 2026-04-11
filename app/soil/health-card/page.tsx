"use client";
export const dynamic = "force-dynamic";
import React, { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer, Loader2, Download } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { fetchSoilData, fetchFertilizerRecommendation, fetchSoilByDate, predictSoil } from "@/lib/soil";  // issue ot found
import { fetchFieldById } from "@/lib/api";
import FarmMap from "@/components/ui/farm-map";
import { useSearchParams } from "next/navigation";
import * as turf from "@turf/turf";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// --- Colors & Styles ---
const C = {
  BORDER: "border-[#1b5e20]", 
  SIDEBAR_BG: "bg-[#AED581]", 
  HEADER_GREEN: "bg-[#2E7D32]", 
  HEADER_YELLOW: "bg-[#FFC107]", 
  TABLE_HEADER_GREEN: "bg-[#8BC34A]", 
  COL_BROWN: "bg-[#D7CCC8]", 
  COL_YELLOW: "bg-[#F0F4C3]", 
  COL_GREEN_1: "bg-[#DCEDC8]", 
  COL_GREEN_2: "bg-[#F1F8E9]", 
};

// --- Interfaces ---
interface HealthCardData {
  cardNo: string; farmerNameSidebar: string; validFrom: string; validTo: string;
  name: string; address: string; village: string; subDistrict: string; district: string; pin: string; aadhaar: string; mobile: string;
  sampleNo: string; sampleDate: string; surveyNo: string; khasraNo: string; farmSize: string; gpsLat: string; gpsLong: string; irrigationType: string;
  testResults: any[]; secondaryRecs: any[]; generalRecs: any; fertilizerRecs: any[]; forecast: any[]; tempAdvisories: any[]; moistureAdvisories: any[]; soilDepthLayers: any[]; moistureDepthLayers: any[];
  stateName: string;
}

// --- Initial Data ---
const INITIAL_DATA: HealthCardData = {
  cardNo: "", farmerNameSidebar: "", validFrom: "", validTo: "",
  name: "", address: "", village: "", subDistrict: "", district: "", pin: "", aadhaar: "", mobile: "",
  sampleNo: "", sampleDate: "", surveyNo: "", khasraNo: "", farmSize: "", gpsLat: "", gpsLong: "", irrigationType: "",
  stateName: "Maharashtra",
  testResults: [
    { id: 1, parameter: "pH", value: "", unit: "", rating: "" },
    { id: 2, parameter: "EC", value: "", unit: "dS/m", rating: "" },
    { id: 3, parameter: "Organic Carbon (OC)", value: "", unit: "%", rating: "" },
    { id: 4, parameter: "Available Nitrogen (N)", value: "", unit: "kg/ha", rating: "" },
    { id: 5, parameter: "Available Phosphorus (P)", value: "", unit: "kg/ha", rating: "" },
    { id: 6, parameter: "Available Potassium (K)", value: "", unit: "kg/ha", rating: "" },
    { id: 7, parameter: "Available Sulphur (S)", value: "", unit: "ppm", rating: "" },
    { id: 8, parameter: "Available Zinc (Zn)", value: "", unit: "ppm", rating: "" },
    { id: 9, parameter: "Available Boron (B)", value: "", unit: "ppm", rating: "" },
    { id: 10, parameter: "Available Iron (Fe)", value: "", unit: "ppm", rating: "" },
    { id: 11, parameter: "Available Manganese (Mn)", value: "", unit: "ppm", rating: "" },
    { id: 12, parameter: "Available Copper (Cu)", value: "", unit: "ppm", rating: "" },
  ],
  secondaryRecs: [
    { id: 1, parameter: "Sulphur (S)", recommendation: "" },
    { id: 2, parameter: "Zinc (Zn)", recommendation: "" },
    { id: 3, parameter: "Boron (B)", recommendation: "" },
    { id: 4, parameter: "Iron (Fe)", recommendation: "" },
    { id: 5, parameter: "Manganese (Mn)", recommendation: "" },
    { id: 6, parameter: "Copper (Cu)", recommendation: "" },
  ],
  generalRecs: { manure: "", biofertiliser: "", lime: "" },
  fertilizerRecs: Array(6).fill(null).map((_, i) => ({ id: i + 1, crop: "", refYield: "", combo1: "", combo2: "" })),
  forecast: [],
  soilDepthLayers: [],
  moistureDepthLayers: [],
  tempAdvisories: [],
  moistureAdvisories: [],
};

const chartOptions = {
  responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
  plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(17, 24, 39, 0.95)', padding: 6, titleFont: { size: 10, weight: 'bold' as const }, bodyFont: { size: 9 }, displayColors: false } },
  layout: { padding: { left: 0, right: 10, top: 5, bottom: 0 } },
  scales: { x: { grid: { display: false }, ticks: { font: { size: 8, weight: 'bold' as const }, color: '#1f2937' } }, y: { beginAtZero: false, grid: { color: '#e5e7eb', lineWidth: 1 }, ticks: { font: { size: 8, weight: 'bold' as const }, color: '#1f2937', maxTicksLimit: 5 } } },
  elements: { line: { tension: 0.4 }, point: { radius: 3, borderWidth: 1, hitRadius: 30 } }
};

const ACRES_PER_SQM = 1 / 4046.8564224;

function buildReferenceNumber(prefix: string, fieldId: string | null, rawDate: string) {
  const normalizedFieldId = (fieldId || "FIELD").replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  const normalizedDate = rawDate.replace(/[^0-9]/g, "");
  return `${prefix}-${normalizedFieldId}-${normalizedDate}`;
}

function getFieldAreaInAcres(fieldGeometry: any, fallbackArea?: unknown) {
  if (fieldGeometry) {
    const areaSqm = turf.area(fieldGeometry as any);
    if (Number.isFinite(areaSqm) && areaSqm > 0) {
      return areaSqm * ACRES_PER_SQM;
    }
  }

  const fallback = Number(fallbackArea);
  if (Number.isFinite(fallback) && fallback > 0) {
    return fallback * 2.471053814671653;
  }

  return null;
}

function displayValue(val: any) {
  const resolved = val && typeof val === "object" ? val.value : val;
  return resolved !== null && resolved !== undefined && resolved !== "" ? resolved : "N/A";
}

function safeValue(val: any) {
  return val !== null && val !== undefined && val !== "" ? val : "";
}

function toNumericValue(val: any): number | null {
  const raw = val && typeof val === "object" ? val.value : val;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function getRating(param: string, value: number | null) {
  if (value === null || value === undefined) return "N/A";

  switch (param) {
    case "pH":
      if (value < 6.5) return "Acidic";
      if (value <= 7.5) return "Neutral";
      return "Alkaline";
    case "EC":
      if (value < 0.8) return "Normal";
      if (value <= 2) return "Slightly Saline";
      return "High";
    case "OC":
      if (value < 0.5) return "Low";
      if (value <= 0.75) return "Medium";
      return "High";
    case "N":
      if (value < 280) return "Low";
      if (value <= 560) return "Medium";
      return "High";
    case "P":
      if (value < 10) return "Low";
      if (value <= 25) return "Medium";
      return "High";
    case "K":
      if (value < 110) return "Low";
      if (value <= 280) return "Medium";
      return "High";
    case "S":
    case "Zn":
    case "Fe":
    case "Cu":
    case "Mn":
    case "B":
      return value < 1 ? "Deficient" : "Sufficient";
    default:
      return "Normal";
  }
}


export default function SoilHealthCardPage() {
  const [data, setData] = useState<HealthCardData>(INITIAL_DATA);
  const [soil, setSoil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  const [currentFarmMapImg, setCurrentFarmMapImg] = useState<string | null>(null);
  const [saviMapImg, setSaviMapImg] = useState<string | null>(null);
 
  const searchParams = useSearchParams();
  const sampleDate = searchParams.get("sampleDate");
  // ✅ FIX 2: Prevent multiple captures
  const hasCapturedCurrentFarmRef = useRef(false);
  const hasCapturedSaviRef = useRef(false);

  const parseFlexibleDate = (rawDate?: string | null): Date | null => {
    if (!rawDate) return null;

    const direct = new Date(rawDate);
    if (!Number.isNaN(direct.getTime())) return direct;

    const normalized = rawDate.trim().replace(/\./g, "-").replace(/\//g, "-");
    const parts = normalized.split("-");
    if (parts.length === 3) {
      const [a, b, c] = parts.map((p) => Number(p));
      // dd-mm-yyyy
      if (a > 0 && a <= 31 && b > 0 && b <= 12 && c >= 1900) {
        const d = new Date(c, b - 1, a);
        if (!Number.isNaN(d.getTime())) return d;
      }
      // yyyy-mm-dd
      if (a >= 1900 && b > 0 && b <= 12 && c > 0 && c <= 31) {
        const d = new Date(a, b - 1, c);
        if (!Number.isNaN(d.getTime())) return d;
      }
    }

    return null;
  };

  const formatShortDate = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yy = String(date.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  };

  const getValidityFromSampleDate = (rawDate?: string | null) => {
    const parsed = parseFlexibleDate(rawDate);
    if (!parsed) return { from: "", to: "" };

    const toDate = new Date(parsed);
    toDate.setFullYear(toDate.getFullYear() + 1);

    return {
      from: formatShortDate(parsed),
      to: formatShortDate(toDate),
    };
  };

  const validityDisplay = getValidityFromSampleDate(
    data.sampleDate || sampleDate || new Date().toISOString().slice(0, 10),
  );

  useEffect(() => {
    console.log("SOIL FULL:", soil);
    console.log("FARMER NAME:", soil?.farmer_name);
    console.log("MOBILE:", soil?.mobile_number);
  }, [soil]);

  const captureMapWithRetry = (
    map: any,
    setImage: (value: string) => void,
    capturedRef: React.MutableRefObject<boolean>,
  ) => {
    let attempts = 0;
    const maxAttempts = 10;

    const tryCapture = () => {
      if (capturedRef.current) return;
      attempts += 1;

      try {
        const canvas = map.getCanvas();
        const dataUrl = canvas.toDataURL("image/png", 1.0);
        if (dataUrl && dataUrl.length > 10000) {
          capturedRef.current = true;
          setImage(dataUrl);
          return;
        }
      } catch (err) {
        console.error("Map capture retry failed", err);
      }

      if (attempts < maxAttempts) {
        setTimeout(tryCapture, 400);
      }
    };

    // Single entry point — idle fires first, setTimeout is a fallback only
    let idleFired = false;
    map.once("idle", () => {
      idleFired = true;
      setTimeout(tryCapture, 250);
    });
    setTimeout(() => {
      if (!idleFired) tryCapture();
    }, 800);
  };

  useEffect(() => {
  // 🔁 Field changed → reset map capture
    setCurrentFarmMapImg(null);
    setSaviMapImg(null);

    hasCapturedCurrentFarmRef.current = false;
    hasCapturedSaviRef.current = false;
  }, [
    data.gpsLat,
    data.gpsLong
  ]);

  useEffect(() => {
    // Inject html2pdf script dynamically — guard against double-inject (React strict mode)
    const SCRIPT_ID = "html2pdf-script";
    let script: HTMLScriptElement | null = null;
    if (!document.getElementById(SCRIPT_ID)) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.async = true;
      document.body.appendChild(script);
    }

    const fetchData = async () => {
      try {
       const loggedInUserName =
         typeof window !== "undefined" ? localStorage.getItem("userName") || "" : "";
       const loggedInUserPhone =
         typeof window !== "undefined" ? localStorage.getItem("userPhone") || "" : "";
       const snapshotRaw = typeof window !== "undefined"
         ? localStorage.getItem("soilHealthCardSnapshot")
         : null;
       const snapshot = snapshotRaw ? JSON.parse(snapshotRaw) : null;
       const selectedFieldId = snapshot?.selectedFieldId || (typeof window !== "undefined"
         ? localStorage.getItem("selectedFieldId")
         : null);
       const snapshotSampleDate = snapshot?.sampleDate || sampleDate || "";

       // STEP 1: Get current overview (lat/lon + fallback source)
const overview = await fetchSoilData();

const normalizedOverview =
  overview?.data && typeof overview.data === "object"
    ? overview.data
    : overview;

    let soilJson = snapshot?.soilData || overview;
    let predictionRes: any = null;
    let fieldMeta: any = snapshot?.fieldData || null;

    if (!fieldMeta && selectedFieldId) {
      try {
        fieldMeta = await fetchFieldById(selectedFieldId);
      } catch (fieldErr) {
        console.error("Failed to fetch field metadata for health card", fieldErr);
      }
    }

    const normalizedField =
      fieldMeta?.data && typeof fieldMeta.data === "object"
        ? fieldMeta.data
        : fieldMeta;
    const fieldRecord =
      normalizedField?.data && typeof normalizedField.data === "object"
        ? normalizedField.data
        : normalizedField;
    const fieldGeometry =
      fieldRecord?.geometry ??
      fieldRecord?.geom ??
      normalizedField?.geometry ??
      normalizedField?.geom;
    const fieldProperties =
      fieldRecord?.properties ??
      normalizedField?.properties ??
      fieldRecord ??
      normalizedField ??
      {};
    const farmAreaAcres = getFieldAreaInAcres(fieldGeometry, fieldProperties?.area);

    // STEP 2: Predict first, then refresh overview and render from refreshed overview.
    // If a snapshot from the Soil page exists, keep it as the source of truth.
    if (sampleDate && !snapshot?.soilData) {
      try {
        predictionRes = await predictSoil({
          lat: Number(normalizedOverview?.lat),
          lon: Number(normalizedOverview?.lon),
          sample_date: sampleDate,
        });
        soilJson = await fetchSoilData();
      } catch (predictErr) {
        console.error("predictSoil or overview refresh failed, using legacy date report", predictErr);
        soilJson = await fetchSoilByDate({
          lat: Number(normalizedOverview?.lat),
          lon: Number(normalizedOverview?.lon),
          sample_date: sampleDate,
        });
      }
    }

    // STEP 3: Normalize final response
    const response =
      soilJson?.data && typeof soilJson.data === "object"
        ? soilJson.data
        : soilJson;
    const base = response?.data ?? response ?? {};
    const soilRecord = base;
    const properties = soilRecord?.properties ?? {};
    const predictions = base?.predictions ?? {};
    const farmer =
      soilRecord?.farmer ||
      soilRecord?.farmerDetails ||
      soilRecord?.user ||
      {};
    const field = base?.field ?? base?.fieldDetails ?? {};

    setSoil(soilRecord);
    console.log("FULL SOIL:", soilRecord);
    console.log("FARMER:", soilRecord?.farmer);

    let predictionBlock = base?.prediction || base?.data?.prediction || {};

    if (!predictionBlock?.predictions && base?.nutrients) {
      const snapshotNutrients = base.nutrients;
      predictionBlock = {
        predictions: {
          N: { value: snapshotNutrients?.N },
          P: { value: snapshotNutrients?.P },
          K: { value: snapshotNutrients?.K },
          OC: { value: snapshotNutrients?.OC },
          S: { value: snapshotNutrients?.S },
          Zn: { value: snapshotNutrients?.Zn },
          B: { value: snapshotNutrients?.B },
          Fe: { value: snapshotNutrients?.Fe },
          Mn: { value: snapshotNutrients?.Mn },
          Cu: { value: snapshotNutrients?.Cu },
          pH: { value: snapshotNutrients?.pH },
          EC: { value: snapshotNutrients?.EC },
        },
        stats: base.stats || {},
        forecast7d: base.forecast7d || [],
        soilLayers: base.soilLayers || [],
        moistureLayers: base.moistureLayers || [],
        tempInsight: base.tempInsight,
        moistInsight: base.moistInsight,
        tempActions: base.tempActions || [],
        moistActions: base.moistActions || [],
      };
    }

    if (!predictionBlock?.predictions && base?.predictions) {
      predictionBlock = {
        predictions: base.predictions,
        stats: predictionBlock?.stats || base.stats || {},
        forecast7d: predictionBlock?.forecast7d?.length ? predictionBlock.forecast7d : (base.forecast7d || base.forecast || []),
        soilLayers: predictionBlock?.soilLayers?.length ? predictionBlock.soilLayers : (base.soilLayers || []),
        moistureLayers: predictionBlock?.moistureLayers?.length ? predictionBlock.moistureLayers : (base.moistureLayers || []),
        tempInsight: predictionBlock?.tempInsight ?? base.tempInsight,
        moistInsight: predictionBlock?.moistInsight ?? base.moistInsight,
        tempActions: predictionBlock?.tempActions?.length ? predictionBlock.tempActions : (base.tempActions || []),
        moistActions: predictionBlock?.moistActions?.length ? predictionBlock.moistActions : (base.moistActions || []),
      };
    }

    if (!predictionBlock?.predictions && predictionRes?.predictions) {
      predictionBlock = {
        predictions: predictionRes.predictions,
        stats: predictionBlock?.stats || predictionRes.stats || predictionRes.data?.stats || {},
        forecast7d: predictionBlock?.forecast7d?.length ? predictionBlock.forecast7d : (predictionRes.forecast7d || predictionRes.data?.forecast7d || []),
        soilLayers: predictionBlock?.soilLayers?.length ? predictionBlock.soilLayers : (predictionRes.soilLayers || predictionRes.data?.soilLayers || []),
        moistureLayers: predictionBlock?.moistureLayers?.length ? predictionBlock.moistureLayers : (predictionRes.moistureLayers || predictionRes.data?.moistureLayers || []),
        tempInsight: predictionBlock?.tempInsight ?? predictionRes.tempInsight ?? predictionRes.data?.tempInsight,
        moistInsight: predictionBlock?.moistInsight ?? predictionRes.moistInsight ?? predictionRes.data?.moistInsight,
        tempActions: predictionBlock?.tempActions?.length ? predictionBlock.tempActions : (predictionRes.tempActions || predictionRes.data?.tempActions || []),
        moistActions: predictionBlock?.moistActions?.length ? predictionBlock.moistActions : (predictionRes.moistActions || predictionRes.data?.moistActions || []),
      };
    }

    if (predictionRes?.properties) {
      base.properties = {
        ...(base.properties || {}),
        ...predictionRes.properties,
      };
    }

    const mergedProperties = base?.properties ?? properties;

    const sourceSampleDate =
      base?.sample_date ||
      base?.sampleDate ||
      snapshotSampleDate ||
      sampleDate ||
      new Date().toISOString().slice(0, 10);
    const cardGeneratedDate = new Date().toISOString().slice(0, 10);
    const generatedCardNo =
      base?.cardNo ??
      base?.card_no ??
      base?.soil_health_card_no ??
      buildReferenceNumber("SHC", selectedFieldId, sourceSampleDate);
    const generatedSampleNo =
      base?.sampleNo ??
      base?.sample_no ??
      buildReferenceNumber("SS", selectedFieldId, sourceSampleDate);
    const cardNumberSuffix =
      String(generatedCardNo || "").split("-").pop() || "";
    const cardSuffixDigits = cardNumberSuffix.replace(/[^0-9]/g, "");
    const generatedSampleFromCard = cardSuffixDigits
      ? `SS-${cardSuffixDigits}`
      : generatedSampleNo;
    const irrigationType =
      fieldProperties?.irrigation ||
      snapshot?.fieldData?.properties?.irrigation ||
      snapshot?.fieldData?.irrigation ||
      base?.irrigationType ||
      base?.irrigation ||
      "";
    const farmSizeDisplay =
      farmAreaAcres != null
        ? `${farmAreaAcres.toFixed(2)} ac`
        : snapshot?.farmSize
          ? String(snapshot.farmSize)
          : snapshot?.fieldData?.properties?.area != null
            ? `${Number(snapshot.fieldData.properties.area).toFixed(2)} ha`
            : base?.farmSize ||
              base?.farm_size ||
              "";

            console.log("SOIL API RESPONSE:", base);

            const farmerName = safeValue(
              soilRecord?.farmer_name ??
              soilRecord?.farmerName ??
              fieldProperties?.farmer_name ??
              fieldProperties?.farmerName ??
              fieldProperties?.owner_name ??
              fieldProperties?.ownerName ??
              farmer?.name ??
              farmer?.full_name ??
              loggedInUserName,
            );
            const mobile = safeValue(
              soilRecord?.mobile_number ??
              soilRecord?.mobile ??
              soilRecord?.phone_no ??
              fieldProperties?.mobile_number ??
              fieldProperties?.mobile ??
              fieldProperties?.phone_no ??
              fieldProperties?.phone ??
              farmer?.phone_no ??
              farmer?.phone ??
              farmer?.mobile ??
              loggedInUserPhone,
            );
            const village = safeValue(
              farmer?.village ??
              soilRecord?.village ??
              field?.village ??
              fieldProperties?.village ??
              fieldProperties?.village,
            );
            const district = safeValue(
              farmer?.district ??
              soilRecord?.district ??
              field?.district ??
              fieldProperties?.district ??
              fieldProperties?.district,
            );
            const address = safeValue(
              farmer?.address ??
              soilRecord?.farmer_address ??
              fieldProperties?.address ??
              fieldProperties?.farmer_address ??
              soilRecord?.address,
            );
            const farmerDetails = {
              name: farmerName,
              village,
              district,
              subDistrict: safeValue(
                farmer?.subDistrict ??
                soilRecord?.subDistrict ??
                field?.subDistrict,
              ),
              pin: safeValue(
                farmer?.pin ??
                soilRecord?.pincode ??
                soilRecord?.pin,
              ),
              aadhaar: safeValue(farmer?.aadhaar),
              mobile,
              address,
            };

            const sampleDetails = {
              sampleNumber:
                base?.sampleNumber ??
                base?.sample_no ??
                generatedSampleFromCard,
              date: cardGeneratedDate,
              lat: field?.lat ?? base?.lat ?? "",
              lon: field?.lon ?? base?.lon ?? "",
              farmSize: (field?.area ?? farmSizeDisplay) || "",
              irrigation: base?.irrigation ?? base?.irrigationType ?? "",
            };

            const fieldDetails = {
              village: base?.village ?? farmerDetails.village,
              state: base?.state ?? data.stateName,
              subDistrict: base?.subDistrict ?? farmerDetails.subDistrict,
              district: base?.district ?? farmerDetails.district,
              pin: base?.pincode ?? farmerDetails.pin,
              gpsLat: sampleDetails.lat !== "" ? String(sampleDetails.lat) : "",
              gpsLong: sampleDetails.lon !== "" ? String(sampleDetails.lon) : "",
            };


        // ===== MAP ALL 12 NUTRIENTS FOR HEALTH CARD =====
        const nutrientValues = predictionBlock?.predictions ?? predictions ?? {};
        const nutrientStats = predictionBlock?.stats ?? {};

        const backendMicroTable = predictionBlock?.microTable ?? [];
        
        // =====================
        // STEP 2: Extract N, P, K for fertilizer recommendation
        // =====================
        const getValue = (key: string) => {
          return (
            mergedProperties?.[key] ??
            mergedProperties?.[key.toLowerCase()] ??
            mergedProperties?.[key.toUpperCase()] ??
            nutrientValues?.[key]?.value ??
            nutrientValues?.[key.toLowerCase()]?.value ??
            nutrientValues?.[key.toUpperCase()]?.value ??
            null
          );
        };

        const nutrients = {
          pH: getValue("ph") ?? getValue("pH"),
          EC: getValue("ec") ?? getValue("EC"),
          OC: getValue("oc") ?? getValue("OC"),
          N: getValue("nitrogen") ?? getValue("N"),
          P: getValue("phosphorus") ?? getValue("P"),
          K: getValue("potassium") ?? getValue("K"),
          S: getValue("sulfur") ?? getValue("S"),
          Zn: getValue("zinc") ?? getValue("Zn"),
          B: getValue("boron") ?? getValue("B"),
          Fe: getValue("iron") ?? getValue("Fe"),
          Mn: getValue("manganese") ?? getValue("Mn"),
          Cu: getValue("copper") ?? getValue("Cu"),
        };

        const ec = soilRecord?.properties?.ec ?? soilRecord?.ec ?? null;
        const oc = soilRecord?.properties?.oc ?? soilRecord?.oc ?? null;
        const ecResolved = ec && typeof ec === "object" ? ec?.value ?? null : ec;
        const ocResolved = oc && typeof oc === "object" ? oc?.value ?? null : oc;

        const ecValue =
          typeof nutrients.EC === "object"
            ? (nutrients.EC as any)?.value ?? null
            : nutrients.EC;
        const finalEcValue = ecResolved !== null && ecResolved !== undefined ? ecResolved : ecValue;
        const finalOcValue = ocResolved !== null && ocResolved !== undefined ? ocResolved : nutrients.OC;

        const soilN = toNumericValue(nutrients.N) ?? 0;
        const soilP = toNumericValue(nutrients.P) ?? 0;
        const soilK = toNumericValue(nutrients.K) ?? 0;

        const adaptedTestResults = [
          {
            id: 1,
            parameter: "pH",
            value: displayValue(nutrients.pH),
            unit: "",
            rating: getRating("pH", toNumericValue(nutrients.pH)),
          },
          {
            id: 2,
            parameter: "EC",
            value: finalEcValue !== null && finalEcValue !== undefined ? finalEcValue : "N/A",
            unit: "dS/m",
            rating: getRating("EC", toNumericValue(finalEcValue)),
          },
          {
            id: 3,
            parameter: "Organic Carbon (OC)",
            value: finalOcValue !== null && finalOcValue !== undefined ? finalOcValue : "N/A",
            unit: "%",
            rating: getRating("OC", toNumericValue(finalOcValue)),
          },
          {
            id: 4,
            parameter: "Available Nitrogen (N)",
            value: displayValue(nutrients.N),
            unit: "kg/ha",
            rating: getRating("N", toNumericValue(nutrients.N)),
          },
          {
            id: 5,
            parameter: "Available Phosphorus (P)",
            value: displayValue(nutrients.P),
            unit: "kg/ha",
            rating: getRating("P", toNumericValue(nutrients.P)),
          },
          {
            id: 6,
            parameter: "Available Potassium (K)",
            value: displayValue(nutrients.K),
            unit: "kg/ha",
            rating: getRating("K", toNumericValue(nutrients.K)),
          },
          {
            id: 7,
            parameter: "Available Sulphur (S)",
            value: displayValue(nutrients.S),
            unit: "ppm",
            rating: getRating("S", toNumericValue(nutrients.S)),
          },
          {
            id: 8,
            parameter: "Available Zinc (Zn)",
            value: displayValue(nutrients.Zn),
            unit: "ppm",
            rating: getRating("Zn", toNumericValue(nutrients.Zn)),
          },
          {
            id: 9,
            parameter: "Available Boron (B)",
            value: displayValue(nutrients.B),
            unit: "ppm",
            rating: getRating("B", toNumericValue(nutrients.B)),
          },
          {
            id: 10,
            parameter: "Available Iron (Fe)",
            value: displayValue(nutrients.Fe),
            unit: "ppm",
            rating: getRating("Fe", toNumericValue(nutrients.Fe)),
          },
          {
            id: 11,
            parameter: "Available Manganese (Mn)",
            value: displayValue(nutrients.Mn),
            unit: "ppm",
            rating: getRating("Mn", toNumericValue(nutrients.Mn)),
          },
          {
            id: 12,
            parameter: "Available Copper (Cu)",
            value: displayValue(nutrients.Cu),
            unit: "ppm",
            rating: getRating("Cu", toNumericValue(nutrients.Cu)),
          },
        ];

        const adaptedSecondaryRecs = backendMicroTable.length
          ? backendMicroTable.map((row: any, i: number) => ({
              id: i + 1,
              parameter: row.parameter,
              recommendation: row.recommendation || "",
            }))
          : INITIAL_DATA.secondaryRecs; // fallback

        // =====================
        // STEP 3: Call Fertilizer Recommendation API
        // =====================
        const overviewFertilizer = base?.fertilizerRecommendation;
        let fertilizerResponse = overviewFertilizer ?? null;

        if (!fertilizerResponse) {
          try {
            fertilizerResponse = await fetchFertilizerRecommendation({
              N: soilN,
              P: soilP,
              K: soilK,
              OC: toNumericValue(nutrients.OC) ?? 0,
            });
          } catch (err) {
            console.error("Fertilizer recommendation failed", err);
          }
        }
        console.log("FERTILIZER RESPONSE:", fertilizerResponse);


        // 🔁 ADAPTER: backend → health card format
        const adaptedHealthCardData: Partial<HealthCardData> = {
          gpsLat: fieldDetails.gpsLat,
          gpsLong: fieldDetails.gpsLong,
          sampleDate:
            base?.sample_date ||
            base?.sampleDate ||
            snapshotSampleDate ||
            sampleDate ||
            "",

          forecast: predictionBlock?.forecast7d?.map((d: any) => ({
            day: d.day,
            temp: d.temperature,
            moisture: d.moisture,
          })) ?? [],

          soilDepthLayers: predictionBlock?.soilLayers?.map((l: any, i: number) => ({
            id: i + 1,
            label: l.depth,
            unit: "cm",
            value: l.value,
            color: l.color ?? "#9ca3af",
          })) ?? [],

          moistureDepthLayers: predictionBlock?.moistureLayers?.map((l: any, i: number) => ({
            id: i + 1,
            label: l.depth,
            value: l.value,
            unit: "%",
            color: l.color ?? "#9ca3af",
          })) ?? [],

          tempAdvisories: predictionBlock?.tempInsight
            ? [{
                id: 1,
                range: predictionBlock?.tempInsight?.range,
                unit: "°C",
                message: predictionBlock?.tempInsight?.message,
              }]
            : [],

          moistureAdvisories: predictionBlock?.moistInsight
            ? [{
                id: 1,
                range: predictionBlock?.moistInsight?.range,
                unit: "%",
                message: predictionBlock?.moistInsight?.message,
              }]
            : [],
        };

        const validity = getValidityFromSampleDate(sourceSampleDate);

        setData(prev => ({
          ...prev,
          validFrom: validity.from,
          validTo: validity.to,
          // =====================
          // Farmer auto-fill
          // =====================
          name: farmerDetails.name,
          farmerNameSidebar: farmerDetails.name,
          address: farmerDetails.address,
          mobile: farmerDetails.mobile,
          aadhaar: farmerDetails.aadhaar,
          cardNo: generatedCardNo,
          sampleNo: String(sampleDetails.sampleNumber || generatedSampleFromCard || generatedSampleNo || "Auto-generated"),

          // =====================
          // Field auto-fill
          // =====================
          village: fieldDetails.village,
          stateName: fieldDetails.state,
          subDistrict: fieldDetails.subDistrict,
          district: fieldDetails.district,
          pin: fieldDetails.pin,

          gpsLat: fieldDetails.gpsLat,
          gpsLong: fieldDetails.gpsLong,

          ...adaptedHealthCardData,
          sampleDate: String(adaptedHealthCardData.sampleDate || sourceSampleDate || ""),
          farmSize: String(sampleDetails.farmSize || farmSizeDisplay || ""),
          irrigationType: String(sampleDetails.irrigation || irrigationType || ""),
          testResults: adaptedTestResults,

          secondaryRecs: adaptedSecondaryRecs,

          // =====================
          // STEP 4: Auto-fill Fertilizer Recommendation Table
          // =====================
          fertilizerRecs: (() => {
            if (!fertilizerResponse) return prev.fertilizerRecs;

            const safe = (val: any) =>
              val !== null && val !== undefined && val !== "" ? val : "—";

            const formatCombination = (value: any) => {
              if (Array.isArray(value)) {
                const formatted = value
                  .map((f: any) => {
                    if (!f) return "";
                    if (typeof f === "string") return f;
                    if (f.fertilizer && f.doseKgHa != null) {
                      return `${f.fertilizer} (${f.doseKgHa} kg/ha)`;
                    }
                    if (f.fertilizer) return String(f.fertilizer);
                    return "";
                  })
                  .filter(Boolean)
                  .join(", ");
                return safe(formatted);
              }
              return safe(value);
            };

            const rows = Array.isArray(fertilizerResponse)
              ? fertilizerResponse
              : [fertilizerResponse];

            const mappedRows = rows
              .filter(Boolean)
              .map((responseRow: any, index: number) => {
                const rec = responseRow?.recommendations || responseRow;

                const soilConditioner = safe(
                  rec?.soilConditioner ??
                    rec?.soil_conditioner ??
                    rec?.fym,
                );

                const fert1 = formatCombination(
                  rec?.fertilizerCombination1 ??
                    rec?.fertilizer1 ??
                    rec?.combination_1,
                );

                const fert2 = formatCombination(
                  rec?.fertilizerCombination2 ??
                    rec?.fertilizer2 ??
                    rec?.combination_2,
                );

                let combo1Display = fert1;
                let combo2Display = fert2;

                if (fert1 !== "—" && fert1 === fert2) {
                  const parts = fert1
                    .split(",")
                    .map((p: string) => p.trim())
                    .filter(Boolean);

                  if (parts.length > 1) {
                    const splitAt = Math.ceil(parts.length / 2);
                    combo1Display = parts.slice(0, splitAt).join(", ");
                    combo2Display = parts.slice(splitAt).join(", ") || "—";
                  } else {
                    combo2Display = "—";
                  }
                }

                return {
                  id: index + 1,
                  crop: safe(rec?.crop ?? base?.crop),
                  // Keep existing table shape; use this column to show soil conditioner.
                  refYield: soilConditioner,
                  combo1: combo1Display,
                  combo2: combo2Display,
                };
              });

            return mappedRows.length
              ? [...mappedRows, ...prev.fertilizerRecs.slice(mappedRows.length)]
              : prev.fertilizerRecs;
          })(),
        }));

      } catch (e) {
        console.error("Health-card backend fetch failed", e);
        setFetchError("Failed to load soil health card data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      if (script && script.parentNode) script.parentNode.removeChild(script);
    }
  }, [sampleDate]);

  // --- Print Handler ---
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Soil_Health_Card_${data.cardNo || "Report"}`,
  });

  const waitForSnapshots = async () => {
    const maxAttempts = 18;
    for (let i = 0; i < maxAttempts; i++) {
      if (currentFarmMapImg && saviMapImg) return true;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    return false;
  };

  const waitForSnapshotImagesToDecode = async () => {
    if (!componentRef.current) return;
    const imgs = Array.from(
      componentRef.current.querySelectorAll('img[data-map-snapshot="true"]'),
    ) as HTMLImageElement[];

    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      }),
    );
  };

  // --- Download Handler (Direct PDF) ---
  const handleDownload = async () => {
    const ready = await waitForSnapshots();

    if (
      typeof window !== "undefined" &&
      (window as any).html2pdf &&
      componentRef.current
    ) {
      setIsDownloading(true);
      requestAnimationFrame(async () => {
        requestAnimationFrame(async () => {
          const element = componentRef.current;
          if (ready) {
            await waitForSnapshotImagesToDecode();
          }

          const opt = {
            margin: 0,
            filename: `Soil_Health_Card_${data.cardNo || "Report"}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            pagebreak: { mode: ["css", "legacy"] },
            html2canvas: {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: "#ffffff", // 🔑 important
              scrollX: 0,
              scrollY: 0,
              onclone: (clonedDoc: Document) => {
                const clonedRoot = clonedDoc.querySelector(".hc-shell") as HTMLElement | null;
                if (clonedRoot) {
                  clonedRoot.style.width = "297mm";
                  clonedRoot.style.maxWidth = "297mm";
                  clonedRoot.style.boxSizing = "border-box";
                  clonedRoot.style.height = "auto";
                  clonedRoot.style.overflow = "visible";
                }

                const clonedPages = clonedDoc.querySelectorAll(".hc-page");
                clonedPages.forEach((page) => {
                  const pageEl = page as HTMLElement;
                  pageEl.style.width = "297mm";
                  pageEl.style.height = "210mm";
                  pageEl.style.overflow = "hidden";
                  pageEl.style.boxSizing = "border-box";
                });
              },
            },
            jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
          };

          (window as any)
            .html2pdf()
            .set(opt)
            .from(element)
            .save()
            .finally(() => setIsDownloading(false));
        });
      });
    }
  };
  const handleChange = (path: string, value: string) => { setData((prev) => { const newData = { ...prev }; const keys = path.split("."); let current: any = newData; for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]]; current[keys[keys.length - 1]] = value; return newData; }); };
  const handleArrayChange = (arrayName: "testResults" | "secondaryRecs" | "fertilizerRecs", index: number, field: string, value: string) => { setData((prev) => { const newArray = [...prev[arrayName]]; // @ts-ignore
      newArray[index] = { ...newArray[index], [field]: value }; return { ...prev, [arrayName]: newArray }; }); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-green-700" /></div>;
  if (fetchError) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <p className="text-red-600 font-semibold text-sm">{fetchError}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-green-700 text-white rounded text-sm font-bold hover:bg-green-800">Retry</button>
    </div>
  );
  if (!soil) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-sm">No soil data available.</p>
    </div>
  );

  return (
    <div className="h-screen w-full overflow-auto bg-gradient-to-br from-slate-100 via-emerald-50 to-cyan-50 p-4 md:p-8 text-black">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          html, body {
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .print-break-after { break-after: page; page-break-after: always; }
          .print-break-before { break-before: page; page-break-before: always; }
          .no-print { display: none !important; }
          .print-block { display: block !important; }
          .leaflet-control-container { display: none !important; }
          .health-card-map-wrapper { pointer-events: none !important; }
        }
        .form-input {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          padding: 0 4px;
          font-size: 9px;
          font-weight: 800;
          line-height: 1.35;
          letter-spacing: 0.01em;
          color: #020617;
          font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          outline: none;
        }
        .hc-page input:disabled,
        .hc-page textarea:disabled {
          opacity: 1;
          -webkit-text-fill-color: currentColor;
          cursor: default;
        }
        .card-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          color: #030712;
        }
        .card-table td, .card-table th {
          border: 1px solid #1b5e20;
          padding: 0;
          vertical-align: middle;
          font-size: 9px;
        }
        .card-table th {
          font-weight: 800;
          letter-spacing: 0.01em;
          font-size: 9.5px;
          color: #020617;
        }
        .card-table td {
          font-weight: 700;
          color: #0b1220;
        }
        .table-soft td {
          font-weight: 600 !important;
          color: #0f172a;
        }
        .table-soft .form-input {
          font-weight: 650;
          color: #0f172a;
        }
        .value-soft {
          font-weight: 600 !important;
          color: #111827;
        }
        .b-r { border-right: 1px solid #1b5e20; }
        .b-b { border-bottom: 1px solid #1b5e20; }
        textarea.form-input {
          resize: none;
          overflow: hidden;
          line-height: 1.15;
          display: block;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .table-soft td,
        .table-soft th,
        .table-soft .form-input {
          letter-spacing: 0;
        }

        /* ===============================
          HEALTH CARD MAP OVERRIDES ONLY
          =============================== */
        .health-card-map-wrapper .absolute.top-3.left-3 {
          display: none !important;
        }
        /* Hide any floating control bar inside map */
        .health-card-map-wrapper [class*="absolute"][class*="z-10"] {
          display: none !important;
        }
        /* Keep leaflet tiles + canvas visible */
        .health-card-map-wrapper .leaflet-pane,
        .health-card-map-wrapper .leaflet-map-pane,
        .health-card-map-wrapper canvas,
        .health-card-map-wrapper img {
          display: block !important;
        }
        /* Disable map interactions only inside health card */
        .health-card-map-wrapper .leaflet-control-container {
          display: none !important;
        }
        .health-card-map-wrapper {
          pointer-events: none;
        }

        .hc-shell {
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
        }

        .hc-page {
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #14532d;
        }

        .hc-ribbon {
          background: linear-gradient(90deg, #065f46 0%, #047857 100%);
          color: #ecfdf5;
          letter-spacing: 0.03em;
          font-weight: 800;
          font-size: 10px;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255,255,255,0.25);
          box-shadow: 0 4px 12px rgba(4, 120, 87, 0.25);
        }

        .hc-title {
          color: #0f172a;
          font-weight: 900;
          letter-spacing: -0.02em;
        }
      `}</style>

      {/* Control Bar - Dropdown Removed */}
      <div className="max-w-[297mm] mx-auto mb-6 flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-xl border border-emerald-100 gap-4 no-print">
        <div>
        <h1 className="text-2xl hc-title">Soil Health Card & Analytics</h1>
        <p className="text-xs text-slate-500 font-medium">Government of India Standard Format</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            {/* Print Button */}
            <button 
                onClick={() => handlePrint && handlePrint()} 
                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2.5 rounded shadow-sm text-sm font-bold transition-colors"
            >
                <Printer className="w-4 h-4" /> Print
            </button>
            
            {/* Download Button */}
            <button 
                onClick={handleDownload} 
                disabled={isDownloading}
                className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded shadow-sm text-sm font-bold transition-colors"
            >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />} 
                {isDownloading ? "Generating..." : "Download PDF"}
            </button>
        </div>
      </div>

      {/* --- PRINTABLE CANVAS --- */}
      <div className="w-full flex justify-center">
        
        <div ref={componentRef} className="hc-shell text-black box-border flex flex-col items-center print-block print:w-full rounded-2xl overflow-hidden print:rounded-none">
          
          {/* ================= PAGE 1 ================= */}
          <div className="hc-page w-[297mm] h-[210mm] p-[5mm] bg-white print-break-after shadow-xl print:shadow-none relative box-border flex flex-col overflow-hidden">
            <div className="absolute top-[3mm] right-[5mm] no-print">
              <span className="hc-ribbon">Soil Health Card</span>
            </div>
            
            {/* 1. TOP SECTION (57% Height) */}
            <div className="flex w-full h-[57%] border-b border-[#1b5e20]">
                
                {/* COL 1: Sidebar (22%) */}
                <div className={`w-[22%] h-full flex flex-col b-r ${C.SIDEBAR_BG}`}>
                    <div className="flex-1 p-2 flex flex-col items-center justify-start pt-3">
                        <div className="flex items-center gap-2 mb-2 w-full">
                            <img src="/images/gov-logo.png" className="h-9 w-auto object-contain"/>
                            <div className="text-[8px] font-bold leading-tight">Department of Agriculture & Cooperation<br/>Ministry of Agriculture & Farmers Welfare<br/>Government of India</div>
                        </div>
                        <div className="flex items-center gap-2 mb-3 w-full">
                             <img src="/images/directorate-logo.png" className="h-9 w-auto object-contain"/>
                             {/* UPDATED: Editable State Name Input */}
                            <div className="text-[8px] font-bold leading-tight">
                              Directorate of Agriculture<br/>
                              Government of <input 
                                className="bg-transparent outline-none w-16 p-0 m-0 font-bold placeholder-black/50" 
                                value={data.stateName} 
                                onChange={(e) => handleChange("stateName", e.target.value)}
                                readOnly
                                disabled
                                placeholder="State"
                              />
                            </div>
                        </div>
                        <div className="flex-1 flex justify-center items-center">
                            <img src="/images/soil-health-logo.png" className="w-20 h-auto object-contain drop-shadow-sm"/>
                        </div>
                    </div>
                    {/* Bottom Fields */}
                    <div className="p-2 space-y-1.5 pb-3 text-[8px]">
                         <div className="flex flex-col">
                             <label className="font-bold text-green-900 leading-none mb-0.5">Soil Health Card No:</label>
                             <div className="b-b border-green-900"><input className="form-input h-3 text-left font-bold" value={data.cardNo} onChange={e=>handleChange("cardNo",e.target.value)} readOnly disabled/></div>
                         </div>
                         <div className="flex flex-col">
                             <label className="font-bold text-green-900 leading-none mb-0.5">Name of Farmer:</label>
                             <div className="b-b border-green-900"><input className="form-input h-3 text-left font-bold" value={data.farmerNameSidebar} onChange={e=>handleChange("farmerNameSidebar",e.target.value)} readOnly disabled/></div>
                         </div>
                         <div className="flex items-end font-bold text-green-900 gap-1">
                             <span className="w-10">Validity</span>
                             <span className="mr-1">From</span>
                           <input className="b-b border-green-900 w-14 text-center bg-transparent text-[8px] font-bold" value={data.validFrom || validityDisplay.from} onChange={e=>handleChange("validFrom",e.target.value)} readOnly disabled/>
                             <span className="mx-1">To</span>
                           <input className="b-b border-green-900 w-14 text-center bg-transparent text-[8px] font-bold" value={data.validTo || validityDisplay.to} onChange={e=>handleChange("validTo",e.target.value)} readOnly disabled/>
                         </div>
                    </div>
                </div>

                {/* COL 2: Middle (38%) */}
                <div className="w-[38%] h-full flex flex-col b-r">
                    <div className={`${C.HEADER_GREEN} text-white text-center font-bold text-[9px] py-0.5 b-b`}>SOIL HEALTH CARD</div>
                    <div className={`${C.HEADER_YELLOW} text-center font-bold text-[8px] b-b py-0.5`}>Farmer's Details</div>
                    <table className="card-table">
                        <tbody>
                            {[
                                {l:"Name",k:"name"},{l:"Address",k:"address"},{l:"Village",k:"village"},
                                {l:"Sub-District",k:"subDistrict"},{l:"District",k:"district"},{l:"PIN",k:"pin"},
                                {l:"Aadhaar Number",k:"aadhaar"},{l:"Mobile Number",k:"mobile"}
                            ].map(row=>(
                                <tr key={row.k} className="h-[17px]">
                                    <td className="w-[35%] bg-white px-1 font-bold text-[8px]">{row.l}</td>
                                <td className="bg-white"><input className="form-input value-soft" value={(data as any)[row.k]} onChange={e=>handleChange(row.k,e.target.value)} readOnly disabled/></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex flex-col flex-1 border-t border-[#1b5e20]">
                         <div className={`${C.HEADER_YELLOW} text-center font-bold text-[8px] b-b py-0.5`}>Soil Sample Details</div>
                         <table className="card-table h-full">
                            <tbody>
                                {[
                                    {l:"Soil Sample Number",k:"sampleNo"},{l:"Sample Collected on",k:"sampleDate"},
                                {l:"Survey No.",k:"surveyNo"},{l:"Khasra No. / Dag No.",k:"khasraNo"}
                                ].map(row=>(
                                    <tr key={row.k} className="h-[17px]">
                                        <td className="w-[45%] bg-white px-1 font-bold text-[8px]">{row.l}</td>
                                <td className="bg-white" colSpan={4}><input className="form-input" value={(data as any)[row.k]} onChange={e=>handleChange(row.k,e.target.value)} readOnly disabled/></td>
                                    </tr>
                                ))}
                              <tr className="h-[17px]">
                                <td className="w-[45%] bg-white px-1 font-bold text-[8px]">Farm Size</td>
                                <td className="bg-white px-1 text-[8px] font-bold" colSpan={4}>
                                  <div className="form-input flex items-center">{data.farmSize}</div>
                                </td>
                              </tr>
                                <tr className="h-[22px]">
                                    <td className="w-[45%] bg-white px-1 font-bold text-[8px]">Geo Position (GPS)</td>
                                  <td className="px-1 bg-white w-[7%] text-[8px] font-bold border-r-0 align-middle whitespace-nowrap">Lat:</td>
                                <td className="bg-white border-l-0 border-r-0 align-middle"><input className="form-input text-[8px] leading-none" value={data.gpsLat} onChange={e=>handleChange("gpsLat",e.target.value)} readOnly disabled/></td>
                                  <td className="px-1 bg-white w-[7%] text-[8px] font-bold border-r-0 border-l-0 align-middle whitespace-nowrap">Long:</td>
                                <td className="bg-white border-l-0 align-middle"><input className="form-input text-[8px] leading-none" value={data.gpsLong} onChange={e=>handleChange("gpsLong",e.target.value)} readOnly disabled/></td>
                                </tr>
                                <tr className="h-[17px]">
                                    <td className="w-[45%] bg-white px-1 font-bold text-[8px]">Irrigated / Rainfed</td>
                                <td className="bg-white px-1 text-[8px] font-bold" colSpan={4}>
                                  <div className="form-input flex items-center">{data.irrigationType}</div>
                                </td>
                                </tr>
                            </tbody>
                         </table>
                    </div>
                </div>

                {/* COL 3: Right (40%) */}
                <div className="w-[40%] h-full flex flex-col">
                    <div className="flex h-[24px] b-b">
                        <div className={`w-[30%] px-1 text-[8px] font-bold b-r flex items-center leading-tight ${C.SIDEBAR_BG}`}>Name of Laboratory</div>
                    <div className={`flex-1 px-2 text-[8px] font-bold flex items-center leading-tight ${C.SIDEBAR_BG}`}>Kisaan Saathi Digital Lab</div>
                    </div>
                    <div className={`${C.TABLE_HEADER_GREEN} text-center font-bold text-[9px] b-b py-0.5`}>SOIL TEST RESULTS</div>
                    <div className="flex-1">
                        <table className="card-table table-soft h-full text-[8px]">
                            <thead className={C.TABLE_HEADER_GREEN}>
                                <tr className="h-[22px]">
                                    <th className="w-8">S.No.</th>
                                    <th className="text-left px-1">Parameter</th>
                                    <th className="w-12">Test Value</th>
                                    <th className="w-10">Unit</th>
                                  <th className="w-14">Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.testResults.map((item) => (
                                    <tr key={item.id} className="h-[18px]">
                                        <td className="text-center bg-white">{item.id}</td>
                                        <td className="px-1 font-medium bg-white whitespace-nowrap">{item.parameter}</td>
                                    <td className="bg-white"><input className="form-input text-center" value={item.value} onChange={(e)=>handleArrayChange("testResults", item.id-1, "value", e.target.value)} readOnly disabled/></td>
                                        <td className="text-center text-[7px] bg-white">{item.unit}</td>
                                    <td className="bg-white"><input className="form-input text-center text-[7px] tracking-normal whitespace-nowrap" value={item.rating} onChange={(e)=>handleArrayChange("testResults", item.id-1, "rating", e.target.value)} readOnly disabled/></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 2. BOTTOM SECTION (43% Height) */}
            <div className="flex w-full h-[43%]">
                
                {/* COL 1: Recommendations (30%) */}
                <div className="w-[30%] h-full flex flex-col b-r">
                    <div className="flex-1 flex flex-col">
                        <div className="bg-[#00897b] text-white font-bold text-[8px] text-center py-0.5 b-b">Secondary & Micro Nutrients Recommendations</div>
                        <table className="card-table h-full">
                            <thead className={`${C.HEADER_YELLOW} text-[7px]`}>
                                <tr className="h-[20px]">
                                    <th className="w-8 text-center">Sl. No.</th>
                                    <th className="text-center">Parameter</th>
                                    <th className="text-center leading-tight px-1">Recommendations for Soil Applications</th>
                                </tr>
                            </thead>
                            <tbody className="text-[8px]">
                                {data.secondaryRecs.map((row, i) => (
                                    <tr key={row.id}>
                                        <td className="text-center bg-white">{row.id}</td>
                                        <td className="px-1 bg-white font-medium">{row.parameter}</td>
                                    <td className="bg-white"><input className="form-input" value={row.recommendation} onChange={(e)=>handleArrayChange("secondaryRecs", i, "recommendation", e.target.value)} readOnly disabled/></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* General Recs */}
                    <div className="h-auto border-t border-[#1b5e20] flex flex-col">
                        <div className={`${C.HEADER_YELLOW} text-black font-bold text-[8px] text-center py-0.5 b-b`}>General Recommendations</div>
                        <table className="card-table text-[8px]">
                            <tbody>
                                {[
                                    {id:1, l:"Organic Manure", k:"manure"}, {id:2, l:"Biofertiliser", k:"biofertiliser"}, {id:3, l:"Lime / Gypsum", k:"lime"}
                                ].map((row, i)=>(
                                    <tr key={row.id} className="h-[18px]">
                                        <td className="w-8 text-center bg-white">{row.id}</td>
                                        <td className="w-[40%] px-1 font-medium bg-white">{row.l}</td>
                                    <td className="bg-white"><input className="form-input" value={(data.generalRecs as any)[row.k]} onChange={(e)=>handleChange(`generalRecs.${row.k}`, e.target.value)} readOnly disabled/></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer Logo Area */}
                    <div className="h-10 border-t border-[#1b5e20] flex justify-between items-center px-1 bg-white mt-auto">
                        <div className="text-[6px] font-bold text-center leading-tight w-[30%]">International<br/>Year of Soils<br/>2015</div>
                        <div className="flex justify-center flex-1"><img src="/images/soil-health-logo.png" className="h-7 w-auto mix-blend-multiply" /></div>
                        <div className="text-[6px] font-bold text-center leading-tight w-[30%]">Healthy Soils<br/>for<br/>a Healthy Life</div>
                    </div>
                </div>

                {/* COL 2: Fertilizer Recs (70%) */}
                <div className="w-[70%] h-full flex flex-col">
                    <div className="bg-[#43a047] text-white text-center font-bold text-[9px] py-0.5 b-b">
                        Fertilizer Recommendations for Reference Yield (with Organic Manure)
                    </div>
                    <table className="card-table table-soft text-[8px] h-full">
                        <thead>
                            <tr className={`h-[28px] ${C.COL_BROWN}`}>
                                <th className={`w-8 ${C.COL_BROWN}`}>Sl. No.</th>
                                <th className={`w-[20%] ${C.COL_BROWN}`}>Crop & Variety</th>
                                <th className={`w-[15%] ${C.COL_YELLOW}`}>Reference Yield</th>
                                <th className={`w-[30%] ${C.COL_GREEN_1}`}>Fertilizer Combination-1 for N P K</th>
                                <th className={`w-[30%] ${C.COL_GREEN_2}`}>Fertilizer Combination-2 for N P K</th>
                            </tr>
                        </thead>
                        <tbody>
                             {data.fertilizerRecs.map((row, i) => (
                                <tr key={row.id}>
                                    <td className={`text-center font-bold ${C.COL_BROWN}`}>{row.id}</td>
                                <td className={`${C.COL_BROWN}`}><textarea className="form-input pt-2 text-center" rows={2} value={row.crop} onChange={(e)=>handleArrayChange("fertilizerRecs", i, "crop", e.target.value)} readOnly disabled/></td>
                                <td className={`${C.COL_YELLOW}`}><textarea className="form-input pt-2 text-center" rows={2} value={row.refYield} onChange={(e)=>handleArrayChange("fertilizerRecs", i, "refYield", e.target.value)} readOnly disabled/></td>
                                <td className={`${C.COL_GREEN_1}`}><textarea className="form-input pt-2" rows={2} value={row.combo1} onChange={(e)=>handleArrayChange("fertilizerRecs", i, "combo1", e.target.value)} readOnly disabled/></td>
                                <td className={`${C.COL_GREEN_2}`}><textarea className="form-input pt-2" rows={2} value={row.combo2} onChange={(e)=>handleArrayChange("fertilizerRecs", i, "combo2", e.target.value)} readOnly disabled/></td>
                                </tr>
                             ))}
                        </tbody>
                    </table>
                </div>

            </div>
          </div>

          {/* ================= PAGE 2 (Analytics) ================= */}
          <div className="hc-page w-[297mm] h-[210mm] p-[5mm] pt-4 bg-white shadow-xl print:shadow-none relative box-border flex flex-col overflow-hidden print-break-before">
            <div className="absolute top-[3mm] right-[5mm] no-print">
              <span className="hc-ribbon">Farm Analytics</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border border-slate-300 rounded-xl p-2 h-44 bg-slate-50 overflow-hidden shadow-md">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Current Farm</span>
                <div className="health-card-map-wrapper mt-1 h-[145px] rounded overflow-hidden border border-gray-200">

                  {/* IMAGE FOR PRINT / PDF */}
                  {currentFarmMapImg && (
                    <img
                      src={currentFarmMapImg}
                      data-map-snapshot="true"
                      className="w-full h-full object-cover block"
                    />
                  )}

                  {/* LIVE MAP FOR SCREEN */}
                  <div className={`h-full ${currentFarmMapImg ? 'hidden' : ''}`}>
                    <FarmMap
                    key={`current-${data.gpsLat}-${data.gpsLong}`}
                      title="Current Farm"
                      healthCard={true}
                      showZoomControls={true}
                      showLegend={false}
                      onMapReady={(map) => {
                        if (hasCapturedCurrentFarmRef.current) return;
                        captureMapWithRetry(
                          map,
                          setCurrentFarmMapImg,
                          hasCapturedCurrentFarmRef,
                        );
                      }}
                    />
                  </div>
                </div>
                <div className="mt-1 text-center">
                  <span className="text-gray-400 font-mono text-[10px]">
                    Lat: {data.gpsLat} | Long: {data.gpsLong}
                  </span>
                </div>
              </div>

              <div className="border border-emerald-300 rounded-xl p-2 h-44 bg-emerald-50 overflow-hidden shadow-md">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                  Soil Saathi - Soil Map
                </span>
                <div className="health-card-map-wrapper mt-1 h-[145px] rounded overflow-hidden border border-emerald-200">

                  {saviMapImg && (
                    <img
                      src={saviMapImg}
                      data-map-snapshot="true"
                      className="w-full h-full object-cover block"
                    />
                  )}

                  <div className={`h-full ${saviMapImg ? 'hidden' : ''}`}>
                    <FarmMap
                    key={`savi-${data.gpsLat}-${data.gpsLong}`}
                      title="Soil Saathi - Soil Map"
                      initialLayer="savi"
                      healthCard={true}
                      showZoomControls={false}
                      showLegend={false}
                      onMapReady={(map) => {
                        if (hasCapturedSaviRef.current) return;
                        captureMapWithRetry(map, setSaviMapImg, hasCapturedSaviRef);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-white rounded-xl border border-gray-200 mb-4 shadow-md overflow-hidden">
              <div className="flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/30">
                <h4 className="text-[10px] font-bold text-slate-800 mb-4 uppercase tracking-wide">Soil Depth Profile</h4>
                <div className="flex items-center justify-center w-full gap-3">
                  <div className="flex flex-col justify-between py-3" style={{ height: '220px' }}>
                    {(data.moistureDepthLayers ?? []).map((layer, i) => (
                      <div key={`moist-${layer.id}-${i}`} className="text-right leading-tight">
                        <div className="text-[9px] font-bold text-blue-700 font-mono">
                          {layer.value ?? "--"}%
                        </div>
                        <div className="text-[8px] text-gray-500 font-mono">{layer.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ width: '120px', height: '220px' }} className="flex-shrink-0 relative">
                    <img src="/images/soil.png" alt="Soil Layer Profile" className="w-full h-full object-contain mix-blend-multiply" onError={(e) => { e.currentTarget.style.display='none'; }}/>
                  </div>

                  <div className="flex flex-col justify-between py-3" style={{ height: '220px' }}>
                    {(data.soilDepthLayers ?? []).map((layer, i) => (
                     <div key={`${layer.id}-${i}`} className="text-left leading-tight">
                        <div
                          className="w-2 h-2 rounded-full border border-gray-300 shadow-sm mb-1"
                          style={{ backgroundColor: layer.color }}
                        />
                        <div className="text-[9px] font-bold text-orange-700 font-mono">
                          {layer.value ?? "--"}°C
                        </div>
                        <div className="text-[8px] text-gray-500 font-mono">{layer.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col p-3 border-b md:border-b-0 md:border-r border-gray-200 bg-orange-50/30">
                <h4 className="text-[10px] font-bold text-gray-800 mb-1 text-center uppercase tracking-wide">7-Day Soil Temperature</h4>
                <div className="relative h-60 w-full pt-2">
                  <Line data={{labels: data.forecast.map((d) => d.day), datasets: [{label: 'Soil Temperature', data: data.forecast.map((d) => d.temp), borderColor: "#ea580c", backgroundColor: "rgba(234, 88, 12, 0.2)", fill: true, pointBackgroundColor: "#fff", pointBorderColor: "#ea580c", borderWidth: 2, tension: 0.4}],}} options={{...chartOptions, scales: {
                    x: {title: { display: true, text: 'Date', font: { size: 9, weight: 'bold' } }, grid: { display: false }, ticks: { font: { size: 8 }, color: '#374151' }}, 
                    y: {title: { display: false, font: { size: 9, weight: 'bold' } }, grid: { color: '#f3f4f6' }, ticks: { font: { size: 8 }, color: '#374151' }}
                  } }} />
                </div>
              </div>
              <div className="flex flex-col p-3 bg-blue-50/30">
                <h4 className="text-[10px] font-bold text-gray-800 mb-1 text-center uppercase tracking-wide">7-Day Soil Moisture</h4>
                <div className="relative h-60 w-full pt-2">
                  <Line data={{labels: data.forecast.map((d) => d.day), datasets: [{label: 'Soil Moisture', data: data.forecast.map((d) => d.moisture), borderColor: "#0284c7", backgroundColor: "rgba(2, 132, 199, 0.2)", fill: true, pointBackgroundColor: "#fff", pointBorderColor: "#0284c7", borderWidth: 2, tension: 0.4}],}} options={{...chartOptions, scales: {
                    x: {title: { display: true, text: 'Date', font: { size: 9, weight: 'bold' } }, grid: { display: false }, ticks: { font: { size: 8 }, color: '#374151' }}, 
                    y: {title: { display: false, font: { size: 9, weight: 'bold' } }, grid: { color: '#f3f4f6' }, ticks: { font: { size: 8 }, color: '#374151' }}
                  } }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[10px] mb-4">
              <div className="border border-orange-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-orange-100 px-2 py-1 font-bold text-orange-900">Temp Advisory</div>
                    {data.tempAdvisories.map(row=>(<div key={row.id} className="flex justify-between px-2 py-1 border-b border-gray-100 last:border-0"><span className="text-gray-600">{row.message}</span></div>))}
                </div>
              <div className="border border-blue-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-blue-100 px-2 py-1 font-bold text-blue-900">Moisture Advisory</div>
                    {data.moistureAdvisories.map(row=>(<div key={row.id} className="flex justify-between px-2 py-1 border-b border-gray-100 last:border-0"><span className="text-gray-600">{row.message}</span></div>))}
                </div>
            </div>

            <div className="mt-auto w-full text-center pb-8">
              <h5 className="font-semibold text-[#000000] text-[10px] uppercase mb-1">DISCLAIMER : STCR formulae and other related information for generation of Soil Health Cards have been referenced from Indian Council of Agricultural Research.</h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

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
import { fetchSoilData, fetchFertilizerRecommendation } from "@/lib/soil";
import FarmMap from "@/components/ui/farm-map";

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
  testResults: any[]; secondaryRecs: any[]; generalRecs: any; fertilizerRecs: any[]; forecast: any[]; tempAdvisories: any[]; moistureAdvisories: any[]; soilDepthLayers: any[]; 
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

export default function SoilHealthCardPage() {
  const [data, setData] = useState<HealthCardData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  const [currentFarmMapImg, setCurrentFarmMapImg] = useState<string | null>(null);
  const [saviMapImg, setSaviMapImg] = useState<string | null>(null);

  // ✅ FIX 2: Prevent multiple captures
  const hasCapturedCurrentFarmRef = useRef(false);
  const hasCapturedSaviRef = useRef(false);

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
    // Inject html2pdf script dynamically for Direct Download functionality
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.async = true;
    document.body.appendChild(script);

    const fetchData = async () => {
      try {
        const soilJson = await fetchSoilData();

        const normalized =
          soilJson?.data && typeof soilJson.data === "object"
            ? soilJson.data
            : soilJson;

            console.log("SOIL API RESPONSE:", normalized);
            console.log("CHECK USER:", normalized?.user);
            console.log("CHECK FARMER:", normalized?.farmer);
            console.log("CHECK PHONE KEYS:", {
              phone_no: normalized?.phone_no,
              mobile: normalized?.mobile,
              user_phone: normalized?.user?.phone_no,
              farmer_phone: normalized?.farmer?.phone_no,
            });
            // Farmer data comes from `user`
            const farmerDetails = {
              name: normalized?.farmer_name ?? "",
              address:
                normalized?.farmer_address ??
                normalized?.farmer?.address ??
                "",

              mobile: normalized?.mobile_number ?? "",
              aadhaar: "",
            };

            // Field data comes from `field`
            const fieldDetails = {
              village: normalized?.village ?? "",
              state: normalized?.state ?? data.stateName,
              subDistrict: normalized?.subDistrict ?? "",
              district: normalized?.district ?? "",
              pin: normalized?.pincode ?? "",
              gpsLat: normalized?.lat
                ? String(normalized.lat)
                : "",
              gpsLong: normalized?.lon
                ? String(normalized.lon)
                : "",
            };


        // ===== MAP ALL 12 NUTRIENTS FOR HEALTH CARD =====
        const nutrientValues = normalized?.prediction?.predictions ?? {};
        const nutrientStats = normalized?.prediction?.stats ?? {};

        const backendMicroTable = normalized?.prediction?.microTable ?? [];
        
        // =====================
        // STEP 2: Extract N, P, K for fertilizer recommendation
        // =====================
        const soilN = Number(nutrientValues?.N?.value ?? 0);
        const soilP = Number(nutrientValues?.P?.value ?? 0);
        const soilK = Number(nutrientValues?.K?.value ?? 0);

        const adaptedTestResults = [
          {
            id: 1,
            parameter: "pH",
            value: nutrientValues?.pH?.value ?? "",
            unit: "",
            rating: nutrientStats?.pH?.label ?? "",
          },
          {
            id: 2,
            parameter: "EC",
            value: nutrientValues?.EC?.value ?? "",
            unit: "dS/m",
            rating: nutrientStats?.EC?.label ?? "",
          },
          {
            id: 3,
            parameter: "Organic Carbon (OC)",
            value: nutrientValues?.OC?.value ?? "",
            unit: "%",
            rating: nutrientStats?.OC?.label ?? "",
          },
          {
            id: 4,
            parameter: "Available Nitrogen (N)",
            value: nutrientValues?.N?.value ?? "",
            unit: "kg/ha",
            rating: nutrientStats?.N?.label ?? "",
          },
          {
            id: 5,
            parameter: "Available Phosphorus (P)",
            value: nutrientValues?.P?.value ?? "",
            unit: "kg/ha",
            rating: nutrientStats?.P?.label ?? "",
          },
          {
            id: 6,
            parameter: "Available Potassium (K)",
            value: nutrientValues?.K?.value ?? "",
            unit: "kg/ha",
            rating: nutrientStats?.K?.label ?? "",
          },
          {
            id: 7,
            parameter: "Available Sulphur (S)",
            value: nutrientValues?.S?.value ?? "",
            unit: "ppm",
            rating: nutrientStats?.S?.label ?? "",
          },
          {
            id: 8,
            parameter: "Available Zinc (Zn)",
            value: nutrientValues?.Zn?.value ?? "",
            unit: "ppm",
            rating: nutrientStats?.Zn?.label ?? "",
          },
          {
            id: 9,
            parameter: "Available Boron (B)",
            value: nutrientValues?.B?.value ?? "",
            unit: "ppm",
            rating: nutrientStats?.B?.label ?? "",
          },
          {
            id: 10,
            parameter: "Available Iron (Fe)",
            value: nutrientValues?.Fe?.value ?? "",
            unit: "ppm",
            rating: nutrientStats?.Fe?.label ?? "",
          },
          {
            id: 11,
            parameter: "Available Manganese (Mn)",
            value: nutrientValues?.Mn?.value ?? "",
            unit: "ppm",
            rating: nutrientStats?.Mn?.label ?? "",
          },
          {
            id: 12,
            parameter: "Available Copper (Cu)",
            value: nutrientValues?.Cu?.value ?? "",
            unit: "ppm",
            rating: nutrientStats?.Cu?.label ?? "",
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
        let fertilizerResponse = null;

        try {
          fertilizerResponse = await fetchFertilizerRecommendation({
            N: soilN,
            P: soilP,
            K: soilK,
            OC: Number(nutrientValues?.OC?.value ?? 0),
          });
        } catch (err) {
          console.error("Fertilizer recommendation failed", err);
        }


        // 🔁 ADAPTER: backend → health card format
        const adaptedHealthCardData: Partial<HealthCardData> = {
          gpsLat: fieldDetails.gpsLat,
          gpsLong: fieldDetails.gpsLong,

          forecast: normalized?.prediction?.forecast7d?.map((d: any) => ({
            day: d.day,
            temp: d.temperature,
            moisture: d.moisture,
          })) ?? [],

          soilDepthLayers: normalized?.prediction?.soilLayers?.map((l: any, i: number) => ({
            id: i + 1,
            label: l.depth,
            unit: "cm",
            color: l.color ?? "#9ca3af",
          })) ?? [],

          tempAdvisories: normalized?.prediction?.tempInsight
            ? [{
                id: 1,
                range: normalized.prediction.tempInsight.range,
                unit: "°C",
                message: normalized.prediction.tempInsight.message,
              }]
            : [],

          moistureAdvisories: normalized?.prediction?.moistInsight
            ? [{
                id: 1,
                range: normalized.prediction.moistInsight.range,
                unit: "%",
                message: normalized.prediction.moistInsight.message,
              }]
            : [],
        };

        setData(prev => ({
          ...prev,
          // =====================
          // Farmer auto-fill
          // =====================
          name: farmerDetails.name,
          farmerNameSidebar: farmerDetails.name,
          address: farmerDetails.address,
          mobile: farmerDetails.mobile,
          aadhaar: farmerDetails.aadhaar,

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
          testResults: adaptedTestResults,

          secondaryRecs: adaptedSecondaryRecs,

          // =====================
          // STEP 4: Auto-fill Fertilizer Recommendation Table
          // =====================
          fertilizerRecs: fertilizerResponse
            ? [{
                id: 1,

                // crop comes from soil API (not fertilizer API)
                crop: normalized?.crop ?? "",

                // backend does not provide refYield
                refYield: "",

                // backend keys
                combo1: Array.isArray(fertilizerResponse.combination_1)
  ? fertilizerResponse.combination_1
      .map(
        (f: any) => `${f.fertilizer} (${f.doseKgHa} kg/ha)`
      )
      .join(", ")
  : "",

combo2: Array.isArray(fertilizerResponse.combination_2)
  ? fertilizerResponse.combination_2
      .map(
        (f: any) => `${f.fertilizer} (${f.doseKgHa} kg/ha)`
      )
      .join(", ")
  : "",

              },
              ...prev.fertilizerRecs.slice(1),
            ]
            : prev.fertilizerRecs,
        }));

      } catch (e) {
        console.error("Health-card backend fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    }
  }, []);

  // --- Print Handler ---
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Soil_Health_Card_${data.cardNo || "Report"}`,
  });

  // --- Download Handler (Direct PDF) ---
  const handleDownload = () => {
    if (!currentFarmMapImg || !saviMapImg) {
      alert("Maps are still loading. Please wait 1–2 seconds and try again.");
      return;
    }

    if (
      typeof window !== "undefined" &&
      (window as any).html2pdf &&
      componentRef.current
    ) {
      setIsDownloading(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const element = componentRef.current;

          const opt = {
            margin: 0,
            filename: `Soil_Health_Card_${data.cardNo || "Report"}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: "#ffffff", // 🔑 important
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

  return (
    <div className="h-screen w-full overflow-auto bg-gray-100 p-4 md:p-8 text-black">
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
        .form-input { width: 100%; height: 100%; background: transparent; border: none; padding: 0 4px; font-size: 8px; font-weight: 600; outline: none; }
        .card-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .card-table td, .card-table th { border: 1px solid #1b5e20; padding: 0; vertical-align: middle; }
        .b-r { border-right: 1px solid #1b5e20; }
        .b-b { border-bottom: 1px solid #1b5e20; }
        textarea.form-input { resize: none; overflow: hidden; line-height: 1.1; display: flex; align-items: center; justify-content: center; }

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
      `}</style>

      {/* Control Bar - Dropdown Removed */}
      <div className="max-w-[297mm] mx-auto mb-6 flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded shadow-sm border border-gray-300 gap-4 no-print">
        <div>
            <h1 className="text-xl font-bold text-gray-800">Soil Health Card & Analytics</h1>
            <p className="text-xs text-gray-500">Government of India Standard Format</p>
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
        
        <div ref={componentRef} className="bg-white text-black box-border flex flex-col items-center print-block print:w-full">
          
          {/* ================= PAGE 1 ================= */}
          <div className="w-[297mm] h-[210mm] p-[5mm] bg-white print-break-after shadow-xl print:shadow-none relative box-border flex flex-col border border-[#1b5e20] overflow-hidden">
            
            {/* 1. TOP SECTION (57% Height) */}
            <div className="flex w-full h-[57%] border-b border-[#1b5e20]">
                
                {/* COL 1: Sidebar (22%) */}
                <div className={`w-[22%] h-full flex flex-col b-r ${C.SIDEBAR_BG}`}>
                    <div className="flex-1 p-2 flex flex-col items-center justify-start pt-3">
                        <div className="flex items-center gap-2 mb-2 w-full">
                            <img src="/images/gov-logo.png" className="h-9 w-auto object-contain"/>
                            <div className="text-[7px] font-bold leading-tight">Department of Agriculture & Cooperation<br/>Ministry of Agriculture & Farmers Welfare<br/>Government of India</div>
                        </div>
                        <div className="flex items-center gap-2 mb-3 w-full">
                             <img src="/images/directorate-logo.png" className="h-9 w-auto object-contain"/>
                             {/* UPDATED: Editable State Name Input */}
                            <div className="text-[7px] font-bold leading-tight">
                              Directorate of Agriculture<br/>
                              Government of <input 
                                className="bg-transparent outline-none w-16 p-0 m-0 font-bold placeholder-black/50" 
                                value={data.stateName} 
                                onChange={(e) => handleChange("stateName", e.target.value)}
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
                             <div className="b-b border-green-900"><input className="form-input h-3 text-left font-bold" value={data.cardNo} onChange={e=>handleChange("cardNo",e.target.value)}/></div>
                         </div>
                         <div className="flex flex-col">
                             <label className="font-bold text-green-900 leading-none mb-0.5">Name of Farmer:</label>
                             <div className="b-b border-green-900"><input className="form-input h-3 text-left font-bold" value={data.farmerNameSidebar} onChange={e=>handleChange("farmerNameSidebar",e.target.value)}/></div>
                         </div>
                         <div className="flex items-end font-bold text-green-900 gap-1">
                             <span className="w-10">Validity</span>
                             <span className="mr-1">From</span>
                             <input className="b-b border-green-900 w-8 text-center bg-transparent" value={data.validFrom} onChange={e=>handleChange("validFrom",e.target.value)}/>
                             <span className="mx-1">To</span>
                             <input className="b-b border-green-900 w-8 text-center bg-transparent" value={data.validTo} onChange={e=>handleChange("validTo",e.target.value)}/>
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
                                    <td className="bg-white"><input className="form-input" value={(data as any)[row.k]} onChange={e=>handleChange(row.k,e.target.value)}/></td>
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
                                    {l:"Survey No.",k:"surveyNo"},{l:"Khasra No. / Dag No.",k:"khasraNo"},{l:"Farm Size",k:"farmSize"}
                                ].map(row=>(
                                    <tr key={row.k} className="h-[17px]">
                                        <td className="w-[45%] bg-white px-1 font-bold text-[8px]">{row.l}</td>
                                        <td className="bg-white" colSpan={3}><input className="form-input" value={(data as any)[row.k]} onChange={e=>handleChange(row.k,e.target.value)}/></td>
                                    </tr>
                                ))}
                                <tr className="h-[17px]">
                                    <td className="w-[45%] bg-white px-1 font-bold text-[8px]">Geo Position (GPS)</td>
                                    <td className="px-1 bg-white w-[10%] text-[8px] font-bold border-r-0">Lat:</td>
                                    <td className="bg-white border-l-0 border-r-0"><input className="form-input" value={data.gpsLat} onChange={e=>handleChange("gpsLat",e.target.value)}/></td>
                                    <td className="px-1 bg-white w-[10%] text-[8px] font-bold border-r-0 border-l-0">Long:</td>
                                    <td className="bg-white border-l-0"><input className="form-input" value={data.gpsLong} onChange={e=>handleChange("gpsLong",e.target.value)}/></td>
                                </tr>
                                <tr className="h-[17px]">
                                    <td className="w-[45%] bg-white px-1 font-bold text-[8px]">Irrigated / Rainfed</td>
                                    <td className="bg-white" colSpan={4}><input className="form-input" value={data.irrigationType} onChange={e=>handleChange("irrigationType",e.target.value)}/></td>
                                </tr>
                            </tbody>
                         </table>
                    </div>
                </div>

                {/* COL 3: Right (40%) */}
                <div className="w-[40%] h-full flex flex-col">
                    <div className="flex h-[24px] b-b">
                        <div className={`w-[30%] px-1 text-[8px] font-bold b-r flex items-center leading-tight ${C.SIDEBAR_BG}`}>Name of Laboratory</div>
                        <div className={`flex-1 ${C.SIDEBAR_BG}`}><input className="form-input font-bold" placeholder="Central Lab"/></div>
                    </div>
                    <div className={`${C.TABLE_HEADER_GREEN} text-center font-bold text-[9px] b-b py-0.5`}>SOIL TEST RESULTS</div>
                    <div className="flex-1">
                        <table className="card-table h-full text-[8px]">
                            <thead className={C.TABLE_HEADER_GREEN}>
                                <tr className="h-[22px]">
                                    <th className="w-8">S.No.</th>
                                    <th className="text-left px-1">Parameter</th>
                                    <th className="w-12">Test Value</th>
                                    <th className="w-10">Unit</th>
                                    <th className="w-12">Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.testResults.map((item) => (
                                    <tr key={item.id} className="h-[18px]">
                                        <td className="text-center bg-white">{item.id}</td>
                                        <td className="px-1 font-medium bg-white whitespace-nowrap">{item.parameter}</td>
                                        <td className="bg-white"><input className="form-input text-center" value={item.value} onChange={(e)=>handleArrayChange("testResults", item.id-1, "value", e.target.value)}/></td>
                                        <td className="text-center text-[7px] bg-white">{item.unit}</td>
                                        <td className="bg-white"><input className="form-input text-center" value={item.rating} onChange={(e)=>handleArrayChange("testResults", item.id-1, "rating", e.target.value)}/></td>
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
                                        <td className="bg-white"><input className="form-input" value={row.recommendation} onChange={(e)=>handleArrayChange("secondaryRecs", i, "recommendation", e.target.value)}/></td>
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
                                        <td className="bg-white"><input className="form-input" value={(data.generalRecs as any)[row.k]} onChange={(e)=>handleChange(`generalRecs.${row.k}`, e.target.value)}/></td>
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
                    <table className="card-table text-[8px] h-full">
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
                                    <td className={`${C.COL_BROWN}`}><textarea className="form-input pt-2 text-center" rows={2} value={row.crop} onChange={(e)=>handleArrayChange("fertilizerRecs", i, "crop", e.target.value)}/></td>
                                    <td className={`${C.COL_YELLOW}`}><textarea className="form-input pt-2 text-center" rows={2} value={row.refYield} onChange={(e)=>handleArrayChange("fertilizerRecs", i, "refYield", e.target.value)}/></td>
                                    <td className={`${C.COL_GREEN_1}`}><textarea className="form-input pt-2" rows={2} value={row.combo1} onChange={(e)=>handleArrayChange("fertilizerRecs", i, "combo1", e.target.value)}/></td>
                                    <td className={`${C.COL_GREEN_2}`}><textarea className="form-input pt-2" rows={2} value={row.combo2} onChange={(e)=>handleArrayChange("fertilizerRecs", i, "combo2", e.target.value)}/></td>
                                </tr>
                             ))}
                        </tbody>
                    </table>
                </div>

            </div>
          </div>

          {/* ================= PAGE 2 (Analytics) ================= */}
          <div className="w-[297mm] h-[210mm] p-[5mm] pt-4 bg-white shadow-xl print:shadow-none relative box-border flex flex-col overflow-hidden print-break-before">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border border-gray-300 rounded p-2 h-40 bg-gray-50 overflow-hidden">
                <span className="text-xs font-bold text-gray-400">Current Farm</span>
                <div className="health-card-map-wrapper mt-1 h-[115px] rounded overflow-hidden border border-gray-200">

                  {/* IMAGE FOR PRINT / PDF */}
                  {currentFarmMapImg && (
                    <img
                      src={currentFarmMapImg}
                      className={`w-full h-full object-cover ${isDownloading ? 'block' : 'hidden print:block'}`}
                    />
                  )}

                  {/* LIVE MAP FOR SCREEN */}
                  <div className={`h-full ${isDownloading ? 'hidden' : 'print:hidden'}`}>
                    <FarmMap
                    key={`current-${data.gpsLat}-${data.gpsLong}`}
                      title="Current Farm"
                      healthCard={true}
                      showZoomControls={true}
                      showLegend={false}
                      onMapReady={(map) => {
                        if (hasCapturedCurrentFarmRef.current) return;
                        const captureMap = () => {
                          if (hasCapturedCurrentFarmRef.current) return;

                          try {
                            const canvas = map.getCanvas();
                            const dataUrl = canvas.toDataURL("image/png", 1.0);
                            // ✅ Safety check: ensure image is valid
                            if (dataUrl && dataUrl.length > 10000) {
                              setCurrentFarmMapImg(dataUrl);
                              hasCapturedCurrentFarmRef.current = true;
                            }
                          } catch (err) {
                            console.error("Current Farm map capture failed", err);
                          }
                        };
                        const triggerCapture = () => {
                          setTimeout(captureMap, 400);
                        };

                        // Capture on first load
                        map.once("load", triggerCapture);

                        // Capture again when fully settled
                        map.once("idle", triggerCapture);

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

              <div className="border border-gray-300 rounded p-2 h-40 bg-emerald-50 overflow-hidden">
                <span className="text-xs font-bold text-emerald-600">
                  Soil Saathi – SAVI Map
                </span>
                <div className="health-card-map-wrapper mt-1 h-[115px] rounded overflow-hidden border border-emerald-200">

                  {saviMapImg && (
                    <img
                      src={saviMapImg}
                      className={`w-full h-full object-cover ${isDownloading ? 'block' : 'hidden print:block'}`}
                    />
                  )}

                  <div className={`h-full ${isDownloading ? 'hidden' : 'print:hidden'}`}>
                    <FarmMap
                    key={`savi-${data.gpsLat}-${data.gpsLong}`}
                      title="Soil Saathi – SAVI Map"
                      initialLayer="savi"
                      healthCard={true}
                      showZoomControls={false}
                      showLegend={false}
                      onMapReady={(map) => {
                        if (hasCapturedSaviRef.current) return;
                        const captureMap = () => {
                          if (hasCapturedSaviRef.current) return;

                          try {
                            const canvas = map.getCanvas();
                            const dataUrl = canvas.toDataURL("image/png", 1.0);

                            if (dataUrl && dataUrl.length > 10000 && !dataUrl.endsWith("AAAA")) {
                              setSaviMapImg(dataUrl);
                              hasCapturedSaviRef.current = true;
                            }
                          } catch (err) {
                            console.error("SAVI map capture failed", err);
                          }
                        };
                        const triggerCapture = () => {
                          setTimeout(captureMap, 400);
                        };

                        // Capture on first load
                        map.once("load", triggerCapture);

                        // Capture again when fully settled
                        map.once("idle", triggerCapture);

                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-white rounded-lg border border-gray-200 mb-4 shadow-sm overflow-hidden">
              <div className="flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/30">
                <h4 className="text-[10px] font-bold text-gray-800 mb-4 uppercase tracking-wide">Soil Depth Profile</h4>
                <div className="flex items-center justify-center w-full gap-6 pl-2">
                  <div style={{ width: '120px', height: '220px' }} className="flex-shrink-0 relative">
                    <img src="/images/soil.png" alt="Soil Layer Profile" className="w-full h-full object-contain mix-blend-multiply" onError={(e) => { e.currentTarget.style.display='none'; }}/>
                  </div>
                  <div className="flex flex-col justify-between py-4" style={{ height: '220px' }}>
                    {data.soilDepthLayers.map((layer) => (
                      <div key={layer.id} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border border-gray-300 shadow-sm"
                          style={{ backgroundColor: layer.color }}
                        />
                        <span className="text-[10px] font-bold text-gray-700 font-mono">
                          {layer.label}{" "}
                          <span className="text-gray-500 font-normal">{layer.unit}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col p-3 border-b md:border-b-0 md:border-r border-gray-200">
                <h4 className="text-[10px] font-bold text-gray-800 mb-1 text-center uppercase tracking-wide">7-Day Soil Temperature</h4>
                <div className="relative h-60 w-full pt-2">
                  <Line data={{labels: data.forecast.map((d) => d.day), datasets: [{label: 'Soil Temperature', data: data.forecast.map((d) => d.temp), borderColor: "#ea580c", backgroundColor: "rgba(234, 88, 12, 0.2)", fill: true, pointBackgroundColor: "#fff", pointBorderColor: "#ea580c", borderWidth: 2, tension: 0.4}],}} options={{...chartOptions, scales: {
                    x: {title: { display: true, text: 'Date', font: { size: 9, weight: 'bold' } }, grid: { display: false }, ticks: { font: { size: 8 }, color: '#374151' }}, 
                    y: {title: { display: false, font: { size: 9, weight: 'bold' } }, grid: { color: '#f3f4f6' }, ticks: { font: { size: 8 }, color: '#374151' }}
                  } }} />
                </div>
              </div>
              <div className="flex flex-col p-3">
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
                <div className="border border-orange-200 rounded">
                    <div className="bg-orange-100 px-2 py-1 font-bold text-orange-900">Temp Advisory</div>
                    {data.tempAdvisories.map(row=>(<div key={row.id} className="flex justify-between px-2 py-1 border-b border-gray-100 last:border-0"><span className="text-gray-600">{row.message}</span></div>))}
                </div>
                <div className="border border-blue-200 rounded">
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
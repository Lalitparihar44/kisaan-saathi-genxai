'use client';
import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

import {
  BookOpen,
  FileText,
  GraduationCap,
  ImageIcon,
  ArrowRight,
  ThermometerSun,
  Sprout,
  AlertTriangle,
  Droplets,
  CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import FarmMap from '@/components/ui/farm-map';
import { fetchSoilData, fetchFertilizerRecommendation } from '@/lib/soil';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
);

// ===== Weather UI Helper =====
function getWeatherUI(temperature: number, moisture: number) {
  if (temperature <= 12) {
    return {
      bg: 'from-cyan-100 to-blue-200',
      icon: '❄️',
    };
  }

  if (moisture >= 70) {
    return {
      bg: 'from-slate-700 to-slate-900',
      icon: '🌧',
    };
  }

  if (moisture >= 60) {
    return {
      bg: 'from-slate-300 to-slate-400',
      icon: '☁️',
    };
  }

  if (temperature >= 32) {
    return {
      bg: 'from-yellow-300 to-orange-400',
      icon: '☀️',
    };
  }

  return {
    bg: 'from-sky-100 to-sky-200',
    icon: '🌤',
  };
}

// ===== Action Card Component =====
function ActionCard({
  step,
  color,
  title,
  desc,
  cta,
}: {
  step: string;
  color: string;
  title: string;
  desc: string;
  cta: string;
}) {
  const styles: any = {
    red: {
      box: 'bg-red-50 border-red-100',
      title: 'text-red-900',
      btn: 'bg-red-100 text-red-700 hover:bg-red-200',
    },
    yellow: {
      box: 'bg-yellow-50 border-yellow-100',
      title: 'text-yellow-900',
      btn: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    },
    blue: {
      box: 'bg-blue-50 border-blue-100',
      title: 'text-blue-900',
      btn: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    },
    green: {
      box: 'bg-green-50 border-green-100',
      title: 'text-green-900',
      btn: 'bg-green-100 text-green-700 hover:bg-green-200',
    },
  };
  
  const s = styles[color] || styles.blue;

  return (
    <div className={`p-3 rounded-lg border ${s.box} flex flex-col gap-2 h-full`}>
      <div className="flex justify-between items-start">
        <span className="font-bold text-[10px] uppercase tracking-wider opacity-60">
          Step {step}
        </span>
      </div>
      <div>
        <div className={`font-bold text-xs leading-tight ${s.title}`}>
          {title}
        </div>
        <div className="text-[10px] text-gray-600 mt-1 leading-snug">
          {desc}
        </div>
      </div>
      <button
        className={`mt-auto w-full h-[28px] rounded text-[10px] font-bold ${s.btn} transition-colors`}
      >
        {cta}
      </button>
    </div>
  );
}

function InputRow({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_2fr_auto] items-center gap-4 mb-4">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <input
        type="number"
        value={value}
        disabled
        readOnly
        className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
      />

      <span className="text-sm text-gray-500">{unit}</span>
    </div>
  );
}

// 1. NEW COMPONENT: SVG Donut Chart
const DonutChart = ({
  bars,
  size = 80,
  strokeWidth = 8,
  centerLabel = '',
}: {
  bars: { label: string; val: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  // Check if there is data to display
  const totalVal = bars.reduce((acc: number, bar: any) => acc + bar.val, 0);
  const isEmpty = totalVal === 0;
  const [hovered, setHovered] = useState<{
    label: string;
    val: number;
    color: string;
  } | null>(null);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 transition-all duration-500"
      >
        {/* Background Circle (Empty State) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isEmpty ? '#f1f5f9' : 'transparent'}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Data Segments */}
        {!isEmpty &&
          bars.map((bar: any, index: number) => {
            const strokeDasharray = `${
              (bar.val / 100) * circumference
            } ${circumference}`;
            const strokeDashoffset = -(
              (accumulatedPercent / 100) *
              circumference
            );
            accumulatedPercent += bar.val;

            // Convert bg-color class (e.g. bg-green-500) to text-color for SVG stroke
            const colorClass = bar.color.replace('bg-', 'text-');

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={bar.color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={'transition-all duration-700 ease-out'}
                onMouseEnter={() => setHovered(bar)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
      </svg>
      {/* Optional Center Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {hovered ? (
          <div className="px-2 py-1 rounded bg-black text-white text-[10px] font-semibold shadow">
            {hovered.label} – {hovered.val}%
          </div>
        ) : (
          <span className="text-[10px] text-black font-medium">
            {isEmpty ? 'No Data' : centerLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default function SoilPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---------- Fertilizer state ---------- */
  const [stateValue, setStateValue] = useState('');
  const [districtValue, setDistrictValue] = useState('');
  const [crop, setCrop] = useState('');
  const [N, setN] = useState('');
  const [P, setP] = useState('');
  const [K, setK] = useState('');
  const [OC, setOC] = useState('');
  const [fertilizer, setFertilizer] = useState<any>(null);
  const [loadingFert, setLoadingFert] = useState(false);

  // New State for Nutrient Tabs
  const [nutrientTab, setNutrientTab] = useState<'macro' | 'micro' | 'prop'>(
    'macro',
  );
  const [loadingSoil, setLoadingSoil] = useState(true);

  // ===== DONUT HELPERS (BACKEND → UI) =====
  const macroBars = (level?: string) => [
    { label: 'High', val: level === 'High' ? 100 : 0, color: '#22c55e' },
    { label: 'Medium', val: level === 'Medium' ? 100 : 0, color: '#facc15' },
    { label: 'Low', val: level === 'Low' ? 100 : 0, color: '#ef4444' },
  ];

  const microBars = (level?: string) => [
    {
      label: 'Sufficient',
      val: level === 'Sufficient' ? 100 : 0,
      color: '#22c55e',
    },
    {
      label: 'Deficient',
      val: level === 'Deficient' ? 100 : 0,
      color: '#ef4444',
    },
  ];

  const phBars = (level?: string) => [
    {
      label: 'Alkaline',
      val: level === 'Alkaline' ? 100 : 0,
      color: '#9333ea',
    },
    { label: 'Neutral', val: level === 'Neutral' ? 100 : 0, color: '#22c55e' },
    { label: 'Acidic', val: level === 'Acidic' ? 100 : 0, color: '#facc15' },
  ];

  const ecBars = (level?: string) => [
    {
      label: 'Non-Saline',
      val: level === 'Non-saline' ? 100 : 0,
      color: '#3b82f6',
    },
    { label: 'Saline', val: level === 'Saline' ? 100 : 0, color: '#f97316' },
  ];

  /* ---------- VALIDATION ---------- */
  const isFormValid = !!N && !!P && !!K && !!OC && !loadingFert;

  useEffect(() => {
    const token = globalThis.window
      ? localStorage.getItem('accessToken')
      : null;
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  /* ---------- Load soil + states (with robust fallback) ---------- */
  useEffect(() => {
    async function loadInitialData() {
      console.log('BACKEND URL =', process.env.NEXT_PUBLIC_BACKEND_URL);
      setLoadingSoil(true);

      // 1. Fetch Soil Data
      try {
        const soilJson = await fetchSoilData();
        console.log('Soil API data:', soilJson);

        // 🔥 BACKEND COMPATIBILITY LAYER
        const normalizedSoilData =
          soilJson?.data && typeof soilJson.data === 'object'
            ? soilJson.data
            : soilJson;
        console.log('Normalized Soil Data:', normalizedSoilData);
        // 🔁 ADAPTER: backend ML response → soil UI format
        const rawStats = normalizedSoilData?.prediction?.stats ?? {};

        // 🔥 STEP 2: EXTRACT & FORCE NUMERIC NUTRIENT VALUES
const rawPredictions =
  normalizedSoilData?.prediction?.predictions ?? {};

const nutrients = {
  N: rawPredictions.N?.value != null ? Number(rawPredictions.N.value) : null,
  P: rawPredictions.P?.value != null ? Number(rawPredictions.P.value) : null,
  K: rawPredictions.K?.value != null ? Number(rawPredictions.K.value) : null,
  OC: rawPredictions.OC?.value != null ? Number(rawPredictions.OC.value) : null,

  S: rawPredictions.S?.value != null ? Number(rawPredictions.S.value) : null,
  Zn: rawPredictions.Zn?.value != null ? Number(rawPredictions.Zn.value) : null,
  Fe: rawPredictions.Fe?.value != null ? Number(rawPredictions.Fe.value) : null,
  Mn: rawPredictions.Mn?.value != null ? Number(rawPredictions.Mn.value) : null,
  Cu: rawPredictions.Cu?.value != null ? Number(rawPredictions.Cu.value) : null,

  pH: rawPredictions.pH?.value != null ? Number(rawPredictions.pH.value) : null,
  EC: rawPredictions.EC?.value != null ? Number(rawPredictions.EC.value) : null,
};

        console.log('RAW STATS FROM BACKEND:', rawStats);
        const normalizeStatus = (s?: string) => {
  if (!s) return undefined;

  const v = s.toLowerCase();

  if (v === 'low') return 'Low';
  if (v === 'medium') return 'Medium';
  if (v === 'high') return 'High';

  if (v === 'deficient') return 'Deficient';
  if (v === 'sufficient') return 'Sufficient';

  if (v === 'normal') return 'Non-saline';
  if (v === 'saline') return 'Saline';

  if (v === 'acidic') return 'Acidic';
  if (v === 'neutral') return 'Neutral';
  if (v === 'alkaline') return 'Alkaline';

  return s; // safe fallback
};
// ✅ For Macronutrients & Organic Carbon (N, P, K, OC)
const normalizeMacroStatus = (s?: string) => {
  if (!s) return undefined;

  const v = s.toLowerCase();

  if (v === 'low' || v === 'deficient') return 'Low';
  if (v === 'medium' || v === 'sufficient') return 'Medium';
  if (v === 'high') return 'High';

  return undefined;
};

// ✅ For Micronutrients ONLY (S, Zn, Fe, Mn, Cu, B)
const normalizeMicroStatus = (s?: string) => {
  if (!s) return undefined;

  const v = s.toLowerCase();

  if (v === 'deficient') return 'Deficient';
  if (v === 'sufficient') return 'Sufficient';

  return undefined;
};


        const adaptedSoilData = {
          soilScore: '--',
          nutrients,

          stats: {
            // 🔹 MACRO + OC
            N:  { label: normalizeMacroStatus(rawStats?.N?.label) },
            P:  { label: normalizeMacroStatus(rawStats?.P?.label) },
            K:  { label: normalizeMacroStatus(rawStats?.K?.label) },
            OC: { label: normalizeMacroStatus(rawStats?.OC?.label) },

            // 🔹 MICRO
            S:  { label: normalizeMicroStatus(rawStats?.S?.label) },
            Zn: { label: normalizeMicroStatus(rawStats?.Zn?.label) },
            Fe: { label: normalizeMicroStatus(rawStats?.Fe?.label) },
            Mn: { label: normalizeMicroStatus(rawStats?.Mn?.label) },
            Cu: { label: normalizeMicroStatus(rawStats?.Cu?.label) },
            B:  { label: normalizeMicroStatus(rawStats?.B?.label) },

            // 🔹 PROPERTIES (keep old normalizer)
            pH: { label: normalizeStatus(rawStats?.pH?.label) },
            EC: { label: normalizeStatus(rawStats?.EC?.label) },
          },


          forecast7d: normalizedSoilData?.prediction?.forecast7d ?? [],

          soilLayers: normalizedSoilData?.prediction?.soilLayers ?? [],
          moistureLayers: normalizedSoilData?.prediction?.moistureLayers ?? [],

          tempInsight: normalizedSoilData?.prediction?.tempInsight,
          moistInsight: normalizedSoilData?.prediction?.moistInsight,

          tempActions: normalizedSoilData?.prediction?.tempActions ?? [],
          moistActions: normalizedSoilData?.prediction?.moistActions ?? [],
        };

        setData(adaptedSoilData);
        setStateValue(normalizedSoilData?.state || '');
        setDistrictValue(normalizedSoilData?.district || '');
        setCrop(normalizedSoilData?.crop || '');
        setLoadingSoil(false);
        console.log('✅ ADAPTED DATA FOR UI:', adaptedSoilData);

        // Populate inputs if available
        if (normalizedSoilData?.prediction?.predictions) {
          const n = normalizedSoilData.prediction.predictions;
          const safe = (v?: number, d = 2) =>
            typeof v === 'number' && !Number.isNaN(v)
              ? v.toFixed(d)
              : '';

          setN(safe(n.N?.value, 0));
          setP(safe(n.P?.value, 0));
          setK(safe(n.K?.value, 0));
          setOC(safe(n.OC?.value, 2));
        }
      } catch (e: any) {
        console.error('Soil API failed FULL ERROR:', e);

        // If token expired or unauthorized → redirect to login
        if (
          e?.response?.status === 401 ||
          e?.message?.toLowerCase().includes('token')
        ) {
          router.push('/login');
          return;
        }

        setError('Unable to fetch soil data from backend');
      }
    }

    loadInitialData();
  }, []);

  /* ---------- Fertilizer API (FULLY BACKEND DRIVEN) ---------- */
  async function getRecommendation() {
    setLoadingFert(true);
    setFertilizer(null);
    setError(null);

    try {
      const payload = {
        N: Number(N),
        P: Number(P),
        K: Number(K),
        OC: Number(OC),
      };

      console.log('Sending payload to backend:', payload);

      const result = await fetchFertilizerRecommendation(payload);

      console.log('Backend fertilizer response:', result);

      const adaptedFertilizer = result
        ? {
            crop: crop || result.crop || '',
            soilConditioner: result.fym || '—',
            combo1: Array.isArray(result.combination_1)
              ? result.combination_1
              : [],
            combo2: Array.isArray(result.combination_2)
              ? result.combination_2
              : [],
          }
        : null;

      setFertilizer(adaptedFertilizer);
    } catch (error) {
      console.error('Fertilizer API failed:', error);
      // Strictly backend driven: We display an error instead of using mock data
      setError(
        'Unable to fetch fertilizer recommendation. Please check your connection or inputs.',
      );
    } finally {
      setLoadingFert(false);
    }
  }

  // --- SINGLE SOURCE OF TRUTH FOR RENDER ---
  // If data is null (initial load) or API failed (caught in useEffect), we rely on fallback
  const activeData = data;
  if (loadingSoil) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Fetching soil data from backend...
      </div>
    );
  }

  if (!activeData && error) {
    return (
      <div className="h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }
  // API data processing

  // ✅ SHARED soil gradient palette (USED IN MULTIPLE PLACES)
  const soilGradients = [
    'from-[#7b5a3a] to-[#6a4a2f]',
    'from-[#6a4a2f] to-[#5a3a25]',
    'from-[#5a3a25] to-[#4a2f1f]',
    'from-[#4a2f1f] to-[#3a2416]',
  ];
  const DEPTH_ROW_HEIGHT = 72;
  const SOIL_TOP_OFFSET = 32;   // grass height
  const SOIL_BOTTOM_OFFSET = 24; // base soil

  function SoilLayerStack({ layers }: { layers: any[] }) {
    return (
      <div className="relative w-[140px]">
        {/* Grass / Surface */}
        <div className="h-6 rounded-t-full bg-gradient-to-b from-green-400 to-green-700 shadow-sm" />

        {/* Soil Column */}
        <div className="overflow-hidden rounded-b-2xl shadow-lg border border-[#4a2f1f]">
          {layers.map((layer, i) => (
            <div
              key={i}
              style={{ height: DEPTH_ROW_HEIGHT }}
              className={`
              flex items-center justify-center
              text-white font-semibold text-sm
              bg-gradient-to-b ${soilGradients[i]}
              border-b border-black/10
              relative
            `}
            >
              {/* subtle highlight */}
              <div className="absolute inset-0 bg-white/5 pointer-events-none" />

              {layer.value}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function DepthRowAligned({ label, value, status, color }: any) {
    const badgeMap: any = {
      yellow: 'bg-yellow-100 text-yellow-700',
      green: 'bg-green-100 text-green-700',
      blue: 'bg-blue-100 text-blue-700',
      red: 'bg-red-100 text-red-700',
    };

    return (
      <div className="w-full flex items-center justify-between">
        {/* Temperature */}
        <div className="text-sm font-bold text-gray-900">{value}</div>

        {/* Status */}
        <div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeMap[color]}`}
          >
            {status}
          </span>
        </div>
      </div>
    );
  }

  // =========================================================
  //  NEW NUTRIENT SECTION HELPER FUNCTIONS & DATA
  // =========================================================

  // Fallback data is now FALLBACK_SOIL_DATA
  // ... inside SoilPage function ...

  // 2. UPDATED ROW COMPONENT (Handles both List and Grid layouts with Donut)
  const NutrientGroupRow = ({
    label,
    myValue,
    unit,
    bars,
    isGrid = false,
  }: {
    label: string;
    myValue: any;
    unit: string;
    bars: { label: string; val: number; color: string }[];
    isGrid?: boolean;
  }) => {
    const hasValue = typeof myValue === 'number';

    // --- GRID LAYOUT (Used for Micronutrients) ---
    if (isGrid) {
      return (
        <div className="bg-white border border-slate-100 rounded-xl p-2 flex flex-col items-center justify-between shadow-sm hover:shadow-md transition-shadow h-full">
          {/* Compact Header */}
          <div className="w-full flex justify-between items-center mb-1">
            <div className="font-bold text-slate-700 text-xs flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  hasValue ? 'bg-green-500' : 'bg-slate-300'
                }`}
              ></span>
              {label}
            </div>
          </div>

          {/* Compact Middle Section: Donut + Value */}
          <div className="flex flex-col items-center justify-center flex-1 -mt-1">
            {/* Reduced Donut Size: 90 -> 55 */}
            <DonutChart
              bars={bars}
              size={90}
              strokeWidth={9}
              centerLabel={label}
            />

            <div className="text-center mt-1">
              <div className="text-sm font-normal text-slate-800 leading-tight">
                {hasValue ? myValue : '--'}
                <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                  {unit}
                </span>
              </div>
            </div>
          </div>

          {/* Compact Legend (Flex Row instead of Grid) */}
          <div className="w-full flex justify-center gap-3 mt-1 pt-1.5 border-t border-slate-50">
            {bars.map((bar, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: bar.color }}
                ></span>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-slate-400 font-medium uppercase">
                    {bar.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // --- ROW LAYOUT (Used for Macro / Properties) ---
    return (
      <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-xl mb-3 last:mb-0">
        {/* Left: Info */}
        <div className="flex flex-col min-w-[120px]">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2 h-2 rounded-full ${
                hasValue ? 'bg-green-500' : 'bg-slate-300'
              }`}
            ></span>
            <span className="font-bold text-slate-700">{label}</span>
          </div>
          <div className="text-sm font-normal text-slate-800">
            {hasValue ? myValue : '--'}
            <span className="text-sm text-black font-normal ml-1">{unit}</span>
          </div>
        </div>

        {/* Middle: Legend */}
        <div className="flex-1 px-4 flex flex-col justify-center gap-1">
          {bars.map((bar, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: bar.color }}
                ></div>
                <span className="text-slate-500 font-medium">{bar.label}</span>
              </div>              
            </div>
          ))}
        </div>

        {/* Right: Donut */}
        <div className="pl-2 border-l border-slate-200">
          <DonutChart
            bars={bars}
            size={100}
            strokeWidth={9}
            centerLabel={label}
          />
        </div>
      </div>
    );
  };

  return (
    // ADDED: h-screen and overflow-y-auto to enable scrolling
    <div className="p-4 sm:p-5 h-full bg-[#f3f7f6] min-w-0">
      {/* ================= MITHU TOP STRIP ================= */}
      <div className="bg-white px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between border-b gap-3 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 flex items-center justify-center">
                    <Image
                      src="/images/soil-mithu.png"
                      alt="MarketSaathi"
                      width={64}
                      height={64}
                      className="object-contain"
                      priority
                    />
                  </div>
          <div>
            <div className="font-extrabold text-green-800 text-lg sm:text-xl">Soil Saathi</div>
            <div className="text-xs text-gray-500">
              Mithu — your soil co-pilot
            </div>
          </div>
        </div>
      </div>

      {/* ================= FIELD MAP (Full Width) ================= */}
      <div className="w-full my-4 h-100 rounded-lg overflow-hidden shadow-lg border border-slate-200">
        <FarmMap title="Soil Map" initialLayer="savi" />
      </div>

      {/* ================= MAIN CONTENT GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-[500px_1fr] gap-4 items-stretch">
        {/* LEFT COLUMN: Score Card & Nutrients */}
        <div className="flex flex-col gap-4 h-full">
          {/* 1. SOIL SCORE CARD (Top) */}
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm font-semibold mb-2">Soil Score Card</div>
            <div className="bg-green-50 rounded p-3 text-center">
              <div className="text-xs text-gray-500">Overall Soil Score</div>
              <div className="text-3xl font-bold text-green-700">
                {activeData?.soilScore ?? '--'}
              </div>
              <button
                onClick={() => router.push('/soil/health-card')}
                className="flex items-center justify-center gap-2 w-full bg-green-700 hover:bg-green-800 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-sm"
              >
                <FileText className="w-3 h-3" /> Get Soil Health Card
              </button>
            </div>
          </div>

          {/* 2. KEY SOIL NUTRIENTS (Fills Remaining Height using flex-1) */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden flex-1">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 pointer-events-none"></div>

            {/* TITLE & TABS */}
            <div className="mb-5 relative z-10">
              <div className="text-base font-bold text-center text-slate-800 mb-4">
                Key Soil Nutrients{' '}
                <span className="text-slate-400 font-normal text-sm">
                  (Overview)
                </span>
              </div>

              <div className="flex justify-center">
                <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100 inline-flex gap-1 shadow-sm">
                  {['macro', 'micro', 'prop'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setNutrientTab(t as any)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                        nutrientTab === t
                          ? 'bg-green-600 text-white shadow-md'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                      }`}
                    >
                      {t === 'macro'
                        ? 'Macronutrients'
                        : t === 'micro'
                        ? 'Micronutrients'
                        : 'Properties'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 relative z-10 pb-2">
              {/* CONTAINER: SWITCHES BETWEEN LIST AND GRID */}
              <div
                className={
                  nutrientTab === 'micro'
                    ? 'grid grid-cols-2 gap-3'
                    : 'flex flex-col gap-3'
                }
              >
                {(() => {
                  const vals = activeData?.nutrients ?? {};
                  const stats = activeData?.stats ?? {};

                  if (!vals || !stats) {
                    return (
                      <div className="text-center text-gray-400 text-sm m-auto">
                        Nutrient data not available
                      </div>
                    );
                  }

                  if (nutrientTab === 'macro') {
                    return (
                      <>
                        <NutrientGroupRow
                          label="Nitrogen (N)"
                          myValue={vals.N}
                          unit="kg/ha"
                          bars={macroBars(stats?.N?.label)}
                        />

                        <NutrientGroupRow
                          label="Phosphorus (P)"
                          myValue={vals.P}
                          unit="kg/ha"
                          bars={macroBars(stats?.P?.label)}
                        />

                        <NutrientGroupRow
                          label="Potassium (K)"
                          myValue={vals.K}
                          unit="kg/ha"
                          bars={macroBars(stats?.K?.label)}
                        />
                      </>
                    );
                  }

                  if (nutrientTab === 'micro') {
                    return [
                      { k: 'S', l: 'Sulfur' },
                      { k: 'Zn', l: 'Zinc' },
                      { k: 'B', l: 'Boron' },
                      { k: 'Fe', l: 'Iron' },
                      { k: 'Mn', l: 'Manganese' },
                      { k: 'Cu', l: 'Copper' },
                    ].map((item) => (
                      <NutrientGroupRow
                        key={item.k}
                        label={item.l}
                        myValue={vals[item.k]}
                        unit="mg/kg"
                        isGrid
                        bars={microBars(stats?.[item.k]?.label)}
                      />
                    ));
                  }

                  if (nutrientTab === 'prop') {
                    return (
                      <>
                        <NutrientGroupRow
                          label="Organic Carbon (OC)"
                          myValue={vals.OC}
                          unit="%"
                          bars={macroBars(stats?.OC?.label)}
                        />

                        <NutrientGroupRow
                          label="pH Level"
                          myValue={vals.pH}
                          unit=""
                          bars={phBars(stats?.pH?.label)}
                        />

                        <NutrientGroupRow
                          label="Elec. Conductivity"
                          myValue={vals.EC}
                          unit="dS/m"
                          bars={ecBars(stats?.EC?.label)}
                        />
                      </>
                    );
                  }
                })()}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium">
              * Distribution data based on regional sampling
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Forecast & Insights */}
        <div className="flex flex-col gap-4 h-full">
          {/* ================= SECTION A : 7-DAY FORECAST ================= */}
          <div className="bg-white rounded-lg p-3.5 shadow">
            <div className="text-sm font-semibold mb-4">7-day Forecast</div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {Array.isArray(activeData?.forecast7d) &&
                activeData.forecast7d.map((d: any, i: number) => {
                  const weather = getWeatherUI(d.temperature, d.moisture);
                  return (
                    <div
                      key={i}
                      className={`
                        relative flex flex-col items-center justify-between
                        rounded-xl p-3
                        bg-gradient-to-b ${weather.bg}
                        border border-white/60
                        shadow-sm
                        min-h-[120px]
                        text-center
                      `}
                    >
                      {/* Weather Icon */}
                      <div className="absolute top-2 right-2 text-lg opacity-80">
                        {weather.icon}
                      </div>

                      {/* Day */}
                      <div className="text-xs font-semibold text-slate-600">
                        {d.day ?? 'Today'}
                      </div>

                      {/* Temperature */}
                      <div className="text-2xl font-bold text-slate-900 leading-none">
                        {d.temperature}°
                      </div>

                      {/* Moisture */}
                      <div className="text-xs text-slate-700">
                        {d.moisture}% Moist
                      </div>

                      {/* Status */}
                      <div className="text-[11px] font-medium text-slate-800">
                        {d.status}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* ================= SECTION B : SOIL INSIGHTS (CORRECTED) ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
            {/* TEMPERATURE PANEL */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 pt-4 px-3 pb-3 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3 mt-1">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <ThermometerSun className="w-4 h-4 text-green-700" />
                </div>
                <h3 className="font-bold text-green-900 text-sm">
                  Real-Time Soil Temperature
                </h3>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-xs text-green-800 mb-4 flex items-start gap-2">
                <Sprout className="w-4 h-6 flex-shrink-0 mt-0.5" />
                <span>
                  <span className="font-bold">Advisory:</span>{' '}
                  {activeData?.tempInsight?.message ||
                    'No temperature insight available'}
                </span>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  DIAGNOSTIC VIEW
                </div>

                {/*  Left: Depth Labels - 4 items, centered with equal spacing */}
                <div
                  className="grid grid-cols-[80px_1fr_80px]"
                  style={{ minHeight: `${DEPTH_ROW_HEIGHT * 4}px` }}
                >
                  {/* LEFT: DEPTH LABELS */}
                  <div className="grid grid-rows-4 text-right pr-2" style={{ marginTop: `${SOIL_TOP_OFFSET}px` }}>
                    {activeData?.soilLayers?.map((l: any, i: number) => (
                      <div
                        key={i}
                        style={{ height: `${DEPTH_ROW_HEIGHT}px` }}
                        className="flex items-center justify-end text-sm text-gray-800 font-medium"
                      >
                        {l.depth}
                      </div>
                    ))}
                  </div>

                  {/* CENTER: SOIL IMAGE */}
                  <div className="relative flex justify-center">
                    <img
                      src="/images/soil.png"
                      className="absolute top-0 object-contain"
                      style={{ height: `${SOIL_TOP_OFFSET + DEPTH_ROW_HEIGHT * 5 + SOIL_BOTTOM_OFFSET}px`, }}
                    />
                  </div>

                  {/* RIGHT: TEMPERATURE VALUES */}
                  <div className="grid grid-rows-4 pl-2" style={{ marginTop: `${SOIL_TOP_OFFSET}px` }}>
                    {activeData?.soilLayers?.map((l: any, i: number) => (
                      <div
                        key={i}
                        style={{ height: `${DEPTH_ROW_HEIGHT}px`}}
                        className="flex items-center font-bold text-gray-800"
                      >
                        {l.value}°C
                      </div>
                    ))}
                  </div>
                </div>               
              </div>

              {/* Action Plan */}
              <div className="mt-auto pt-4 border-t border-dashed border-gray-200">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-red-400" /> Action Plan
                  Required
                </div>
                <div className="grid grid-cols-2 gap-3 items-stretch">
                  {Array.isArray(activeData?.tempActions) &&
                    activeData.tempActions.map((action: any, i: number) => (
                      <ActionCard
                        key={i}
                        step={action.step}
                        color={action.color}
                        title={action.title}
                        desc={action.description}
                        cta={action.cta}
                      />
                    ))}
                </div>
              </div>
            </div>

            {/* MOISTURE PANEL */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 pt-4 px-3 pb-3 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3 mt-1">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Droplets className="w-4 h-4 text-blue-700" />
                </div>
                <h3 className="font-bold text-blue-900 text-sm">
                  Real-Time Soil Moisture
                </h3>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-800 mb-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-6 flex-shrink-0 mt-0.5" />
                <span>
                  <span className="font-bold">Advisory:</span>{' '}
                  {activeData?.moistInsight?.message ||
                    'No moisture insight available'}
                </span>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  DIAGNOSTIC VIEW
                </div>
                {/* Responsive container, h-80 for matching height */}
                {/* LEFT: Depth Labels - 4 items, centered with equal spacing */}
                <div
                  className="grid grid-cols-[80px_1fr_80px]"
                  style={{ height: `${SOIL_TOP_OFFSET + DEPTH_ROW_HEIGHT * 4 + SOIL_BOTTOM_OFFSET}px` }}
                >
                  {/* LEFT: DEPTH LABELS */}
                  <div className="grid grid-rows-4 text-right pr-2" style={{ marginTop: `${SOIL_TOP_OFFSET}px` }}>
                    {activeData?.moistureLayers?.map((l: any, i: number) => (
                      <div
                        key={i}
                        style={{ height: DEPTH_ROW_HEIGHT }}
                        className="flex items-center justify-end text-sm text-gray-500 font-medium"
                      >
                        {l.depth}
                      </div>
                    ))}
                  </div>

                  {/* CENTER: SOIL IMAGE */}
                  <div className="relative flex justify-center">
                    <img
                      src="/images/soil.png"
                      className="absolute top-0 object-contain"
                      style={{ height: `${SOIL_TOP_OFFSET + DEPTH_ROW_HEIGHT * 5 + SOIL_BOTTOM_OFFSET}px`, }}
                    />
                  </div>

                  {/* RIGHT: MOISTURE VALUES */}
                  <div className="grid grid-rows-4 pl-2" style={{ marginTop: `${SOIL_TOP_OFFSET}px` }}>
                    {activeData?.moistureLayers?.map((l: any, i: number) => (
                      <div
                        key={i}
                        style={{ height: DEPTH_ROW_HEIGHT }}
                        className="flex items-center justify-end text-sm text-gray-500 font-medium"
                      >
                        <DepthRowAligned
                          value={<span className="font-bold">{l.value}%</span>}
                          status={l.status}
                          color={l.color}
                        />
                      </div>
                    ))}
                  </div>
                </div>       
              </div>

              {/* Action Plan */}
              <div className="mt-auto pt-4 border-t border-dashed border-gray-200">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-400" /> Scheduled
                  Actions
                </div>
                <div className="grid grid-cols-2 gap-3 items-stretch">
                  {Array.isArray(activeData?.moistActions) &&
                    activeData.moistActions.map((action: any, i: number) => (
                      <ActionCard
                        key={i}
                        step={action.step}
                        color={action.color}
                        title={action.title}
                        desc={action.description}
                        cta={action.cta}
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= GOVERNMENT HEADER ================= */}
      <div className="bg-green-50 rounded-xl p-6 shadow border border-green-200 mt-6">
        {/* GOV HEADER */}
        <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center mt-8">
          <div className="flex gap-4">
            <img src="/images/gov-logo.png" className="h-14" />
            <div>
              <div className="font-bold text-sm">Government of India</div>
              <div className="text-xs">
                Ministry of Agriculture and Farmers Welfare{' '}
                <p>Department of Agriculture and Farmers Welfare</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <img src="/images/soil-health-logo.png" className="h-12" />
            <div>
              <div className="font-bold">Soil Health Card</div>
              <div className="text-xs text-gray-500">
                Healthy Earth, Greener Farm
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-700 text-white px-6 py-3 font-semibold text-lg">
          Fertilizer Recommendation
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          {/* ✅ FIX #2: RESTORED INPUT WRAPPER */}
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <select
              className="w-full border rounded px-3 py-2 mb-3"
              value={stateValue}
              onChange={(e) => setStateValue(e.target.value)}
            >
              <option value="">Select State</option>
              <option key={stateValue} value={stateValue}>
                {stateValue}
              </option>
            </select>

            <select
              className="w-full border rounded px-3 py-2 mb-3"
              value={districtValue}
              onChange={(e) => setDistrictValue(e.target.value)}
              disabled={!stateValue}
            >
              <option value="">Select District</option>
              <option key={districtValue} value={districtValue}>
                {districtValue}
              </option>
            </select>

            <select
              className="w-full border rounded px-3 py-2 mb-3"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              disabled={!stateValue || !districtValue}
            >
              <option value="">Select Crop</option>
              <option key={crop} value={crop}>
                {crop}
              </option>
            </select>

            <h3 className="text-lg font-semibold mb-4">
              Enter Parameter Values
            </h3>

            <InputRow
              label="Nitrogen (N)"
              value={N}
              onChange={() => {}}
              unit="kg/ha"
            />

            <InputRow
              label="Phosphorus (P)"
              value={P}
              onChange={() => {}}
              unit="kg/ha"
            />

            <InputRow
              label="Potassium (K)"
              value={K}
              onChange={() => {}}
              unit="kg/ha"
            />

            <InputRow
              label="Organic Carbon (OC)"
              value={OC}
              onChange={() => {}}
              unit="%"
            />

            <button
              onClick={getRecommendation}
              disabled={!isFormValid}
              className={`px-4 py-2 border rounded w-full ${
                isFormValid
                  ? 'bg-green-700 text-white'
                  : 'bg-green-700 cursor-not-allowed'
              }`}
            >
              {loadingFert ? 'Loading...' : 'Get Recommendations'}
            </button>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-lg p-4 border shadow-sm overflow-x-auto">
            <div className="px-4 py-2 border-b bg-green-50 font-semibold text-green-800">
              Recommendation
            </div>
            <table className="w-full border text-sm min-w-[600px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Crop</th>
                  <th className="p-2 border">Soil Conditioner</th>
                  <th className="p-2 border">Fertilizer Combination 1</th>
                  <th className="p-2 border">Fertilizer Combination 2</th>
                </tr>
              </thead>
              <tbody>
                {fertilizer ? (
                  <tr>
                    <td className="p-2 border">{crop || fertilizer.crop}</td>
                    <td className="p-2 border">{fertilizer.soilConditioner}</td>
                    <td className="p-2 border">
                      {fertilizer.combo1?.map(
                        (
                          c: { fertilizer: string; doseKgHa: number },
                          i: number,
                        ) => (
                          <div key={i}>
                            {c.fertilizer} ({c.doseKgHa} kg/ha)
                          </div>
                        ),
                      )}
                    </td>
                    <td className="p-2 border">
                      {fertilizer.combo2?.map(
                        (
                          c: { fertilizer: string; doseKgHa: number },
                          i: number,
                        ) => (
                          <div key={i}>
                            {c.fertilizer} ({c.doseKgHa} kg/ha)
                          </div>
                        ),
                      )}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-gray-400">
                      Click "Get Recommendations" to view fertilizer advice
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= RESOURCES ================= */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'Knowledge Material',
              desc: 'Explore guides, manuals, and videos to help you adopt sustainable, chemical-free farming practices.',
              icon: BookOpen,
            },
            {
              title: 'Guidelines',
              desc: 'Access policy documents and instructions to support smooth and effective execution of the mission.',
              icon: FileText,
            },
            {
              title: 'Study Material',
              desc: 'Download study materials that simplify natural farming methods for easy understanding and implementation.',
              icon: GraduationCap,
            },
            {
              title: 'Gallery',
              desc: '1 crore farmers to be trained and made aware of NF practices, with the help of 2 Krishi Sakhis per cluster.',
              icon: ImageIcon,
            },
          ].map((r) => (
            <div
              key={r.title}
              className="bg-white rounded-2xl p-6 shadow flex justify-between items-start"
            >
              <div className="flex gap-4">
                <r.icon className="text-green-700 w-10 h-10" />
                <div>
                  <div className="font-bold">{r.title}</div>
                  <div className="text-sm text-gray-500">{r.desc}</div>
                </div>
              </div>
              <ArrowRight className="text-gray-300" />
            </div>
          ))}
        </div>
        <section className="mt-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 text-left">
              Sources & References
            </h2>

            <div className="text-sm text-gray-600 leading-relaxed text-left space-y-3">
              <p>
                This Soil Health analysis and fertilizer recommendation system is
                developed in alignment with officially published Government of India
                guidelines and Indian Council of Agricultural Research (ICAR)
                methodologies. The nutrient classification and advisory logic follow the
                Soil Health Card (SHC) framework and the Soil Test Crop Response (STCR)
                approach used in government soil advisory systems.
              </p>

              <p className="font-medium text-gray-700">
                Official Government & Research Sources:
              </p>

              <ul className="list-disc list-inside space-y-1">
                <li>
                  Indian Council of Agricultural Research (ICAR) – STCR methodology and
                  soil fertility standards (
                  <a
                    href="https://www.icar.org.in/content/soil-test-crop-response-stcr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline"
                  >
                    STCR documentation
                  </a>
                  )
                </li>

                <li>
                  Ministry of Agriculture & Farmers Welfare (MoA&amp;FW) – Soil Health
                  Card programme guidelines (
                  <a
                    href="https://soilhealth.dac.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline"
                  >
                    SHC portal
                  </a>
                  )
                </li>

                <li>
                  National Informatics Centre (NIC) – Soil Health Card digital systems
                </li>

                <li>
                  Department of Fertilizers (FCO) – Fertilizer standards and regulations (
                  <a
                    href="https://fert.nic.in/fertilizer-control-order"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline"
                  >
                    Fertilizer Control Order
                  </a>
                  )
                </li>
              </ul>

              <p className="mt-3 text-xs text-gray-500 italic">
                Disclaimer: The recommendations generated are indicative and advisory in
                nature. They are derived from standard government-defined nutrient
                ranges, satellite-based indicators, and agronomic models. Final fertilizer
                application decisions should be validated through local soil testing
                laboratories or agricultural extension officers.
              </p>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
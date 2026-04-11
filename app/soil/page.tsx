'use client';
import React, { useEffect, useRef, useState } from 'react';
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
import { fetchFieldById } from '@/lib/api';
import {
  fetchSoilData,
  fetchFertilizerRecommendation,
  fetchSoilByDate,
  predictSoil,
  predictSoilByFieldId,
} from '@/lib/soil';

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
      {/*
      <button
        className={`mt-auto w-full h-[28px] rounded text-[10px] font-bold ${s.btn} transition-colors`}
      >
        {cta}
      </button>
      */}
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

const LEVEL_STYLE = {
  Low: { badge: 'bg-red-100 text-red-700', pointer: '15%' },
  Sufficient: { badge: 'bg-yellow-100 text-yellow-700', pointer: '50%' },
  High: { badge: 'bg-green-100 text-green-700', pointer: '85%' },
} as const;

type NutrientLevel = keyof typeof LEVEL_STYLE;

const RANGE_SOURCE_URL =
  'https://iiss.res.in/old/eMagazine/v4i1/12.pdf';

const NUTRIENT_RANGES: Record<string, { lowMax: number; sufficientMax: number }> = {
  N: { lowMax: 280, sufficientMax: 560 },
  P: { lowMax: 10, sufficientMax: 25 },
  K: { lowMax: 120, sufficientMax: 280 },
  OC: { lowMax: 0.5, sufficientMax: 0.75 },
  S: { lowMax: 10, sufficientMax: Number.POSITIVE_INFINITY },
  Zn: { lowMax: 0.6, sufficientMax: Number.POSITIVE_INFINITY },
  B: { lowMax: 0.5, sufficientMax: Number.POSITIVE_INFINITY },
  Fe: { lowMax: 4.5, sufficientMax: Number.POSITIVE_INFINITY },
  Mn: { lowMax: 2, sufficientMax: Number.POSITIVE_INFINITY },
  Cu: { lowMax: 0.2, sufficientMax: Number.POSITIVE_INFINITY },
  pH: { lowMax: 6.5, sufficientMax: 7.0 },
  EC: { lowMax: 2.0, sufficientMax: 4.0 },
};

const NUTRIENT_RANGE_TEXT: Record<
  string,
  {
    low: string;
    medium: string;
    high: string;
    middleLabel?: string;
    highLabel?: string;
  }
> = {
  N: { low: '< 280', medium: '280 - 560', high: '> 560' },
  P: { low: '< 10', medium: '10 - 25', high: '> 25' },
  K: { low: '< 120', medium: '120 - 280', high: '> 280' },
  OC: { low: '< 0.50', medium: '0.50 - 0.75', high: '> 0.75' },
  pH: {
    low: '< 6.5 (Acidic)',
    medium: '6.5 - 7.0 (Neutral)',
    high: '> 7.0 (Alkaline)',
  },
  EC: {
    low: '< 2.0 (Normal)',
    medium: '2.0 - 4.0 (Moderate)',
    high: '> 4.0 (Saline)',
    middleLabel: 'MEDIUM',
    highLabel: 'HIGH',
  },
  S: {
    low: '< 10 (Deficient)',
    medium: '> 10 (Sufficient)',
    high: '',
    middleLabel: 'SUFFICIENT',
    highLabel: '-',
  },
  Zn: {
    low: '< 0.6 (Deficient)',
    medium: '> 0.6 (Sufficient)',
    high: '',
    middleLabel: 'SUFFICIENT',
    highLabel: '-',
  },
  Cu: {
    low: '< 0.2 (Deficient)',
    medium: '> 0.2 (Sufficient)',
    high: '',
    middleLabel: 'SUFFICIENT',
    highLabel: '-',
  },
  Fe: {
    low: '< 4.5 (Deficient)',
    medium: '> 4.5 (Sufficient)',
    high: '',
    middleLabel: 'SUFFICIENT',
    highLabel: '-',
  },
  Mn: {
    low: '< 2.0 (Deficient)',
    medium: '> 2.0 (Sufficient)',
    high: '',
    middleLabel: 'SUFFICIENT',
    highLabel: '-',
  },
  B: {
    low: '< 0.5 (Deficient)',
    medium: '> 0.5 (Sufficient)',
    high: '',
    middleLabel: 'SUFFICIENT',
    highLabel: '-',
  },
};

function getLevelFromValue(key: string, value: unknown): NutrientLevel | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  const range = NUTRIENT_RANGES[key];
  if (!range) return null;
  if (value < range.lowMax) return 'Low';
  if (value <= range.sufficientMax) return 'Sufficient';
  return 'High';
}

const SOIL_CACHE_NAMESPACE = 'soil-page-realtime-cache:v1';

function formatCacheCoordinate(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(6);
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(6) : value.trim();
  }
  return '';
}

function getSoilCacheStorageKey(fieldId: string, lat: unknown, lon: unknown) {
  return `${SOIL_CACHE_NAMESPACE}:${fieldId}:${formatCacheCoordinate(lat)}:${formatCacheCoordinate(lon)}`;
}

function getCachedSoilResponse(fieldId: string) {
  if (typeof window === 'undefined' || !fieldId) return null;

  try {
    const cachedKey = localStorage.getItem(`${SOIL_CACHE_NAMESPACE}:index:${fieldId}`);
    if (!cachedKey) return null;

    const raw = localStorage.getItem(cachedKey);
    if (!raw) return null;

    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to read soil cache', error);
    return null;
  }
}

function setCachedSoilResponse(fieldId: string, soilJson: any) {
  if (typeof window === 'undefined' || !fieldId) return;

  try {
    const response = soilJson?.data || soilJson;
    const cacheKey = getSoilCacheStorageKey(fieldId, response?.lat, response?.lon);
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        fieldId,
        lat: response?.lat ?? null,
        lon: response?.lon ?? null,
        soilJson,
      }),
    );
    localStorage.setItem(`${SOIL_CACHE_NAMESPACE}:index:${fieldId}`, cacheKey);
  } catch (error) {
    console.error('Failed to save soil cache', error);
  }
}



export default function SoilPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [soil, setSoil] = useState<any>(null);
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
  const [fieldData, setFieldData] = useState<any>(null);

  // New State for Nutrient Tabs
  const [nutrientTab, setNutrientTab] = useState<'macro' | 'micro' | 'prop'>(
    'macro',
  );
  const [loadingSoil, setLoadingSoil] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const lastMapSelectionRef = useRef<string | null>(null);
  const lastFetchedFieldIdRef = useRef<string | null>(null);
  const lastPredictedFieldIdRef = useRef<string | null>(null);
  const cachedFieldIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedFieldId = localStorage.getItem('selectedFieldId');

      if (storedFieldId) {
        setSelectedFieldId(storedFieldId);
        console.log('Loaded fieldId from localStorage:', storedFieldId);

        const cached = getCachedSoilResponse(storedFieldId);
        if (cached?.soilJson) {
          cachedFieldIdRef.current = storedFieldId;
          applySoilOverviewResponse(cached.soilJson);
          setError(null);
          setHasError(false);
          setLoadingSoil(false);
        }
      }
    }
  }, []);

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

const [sampleDate, setSampleDate] = useState('');

  useEffect(() => {
    const ec =
      soil?.stats?.EC ??
      soil?.stats?.ec ??
      soil?.modelPredictions?.EC ??
      soil?.properties?.ec ??
      soil?.EC ??
      soil?.ec ??
      null;
    const oc =
      soil?.stats?.OC ??
      soil?.stats?.oc ??
      soil?.modelPredictions?.OC ??
      soil?.properties?.oc ??
      soil?.OC ??
      soil?.oc ??
      null;
    console.log('FULL SOIL:', soil);
    console.log('EC FINAL:', ec);
    console.log('OC FINAL:', oc);
    console.log('STATS:', soil?.stats);
    console.log('MODEL:', soil?.modelPredictions);
  }, [soil]);

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

  const applySoilOverviewResponse = (soilJson: any) => {
    const response = soilJson?.data || soilJson;
    const baseSoil = response?.data || response;
    setSoil(baseSoil);
    const properties =
      response?.properties ||
      response?.data?.properties ||
      response?.soilFeatures ||
      response?.data?.soilFeatures ||
      {};
    let predictionBlock = response?.prediction || response?.data?.prediction || {};

    if (!predictionBlock?.predictions && response?.predictions) {
      predictionBlock = {
        predictions: response.predictions,
        stats: response.stats || {}
      };
    }

    const rawPredictions = predictionBlock?.predictions || {};
    const rawStats = predictionBlock?.stats || {};
    console.log("🔍 APPLY_SOIL_OVERVIEW - RESPONSE KEY", Object.keys(response || {}));
    console.log("🔍 APPLY_SOIL_OVERVIEW - PROPERTIES FOUND:", properties);
    console.log("FINAL BACKEND RESPONSE 👉", JSON.stringify(response, null, 2));
    console.log("PREDICTION BLOCK 👉", predictionBlock);
    console.log("RAW PREDICTIONS 👉", rawPredictions);

    const nutrients = {
      N:
        rawPredictions.nitrogen?.value != null
          ? Number(rawPredictions.nitrogen.value)
          : rawPredictions.N?.value != null
            ? Number(rawPredictions.N.value)
            : null,
      P:
        rawPredictions.phosphorus?.value != null
          ? Number(rawPredictions.phosphorus.value)
          : rawPredictions.P?.value != null
            ? Number(rawPredictions.P.value)
            : null,
      K:
        rawPredictions.potassium?.value != null
          ? Number(rawPredictions.potassium.value)
          : rawPredictions.K?.value != null
            ? Number(rawPredictions.K.value)
            : null,
      OC:
        properties?.oc ??
        properties?.OC ??
        response?.properties?.oc ??
        response?.properties?.OC ??
        response?.data?.properties?.oc ??
        response?.data?.properties?.OC ??
        response?.modelPredictions?.OC ??
        response?.stats?.OC?.value ??
        response?.stats?.OC ??
        response?.OC ??
        response?.oc ??
        rawPredictions?.OC?.value ??
        null,
      S:
        rawPredictions.SULFUR?.value != null
          ? Number(rawPredictions.SULFUR.value)
          : rawPredictions.sulfur?.value != null
            ? Number(rawPredictions.sulfur.value)
            : rawPredictions.S?.value != null
              ? Number(rawPredictions.S.value)
              : null,
      Zn:
        rawPredictions.zinc?.value != null
          ? Number(rawPredictions.zinc.value)
          : rawPredictions.Zn?.value != null
            ? Number(rawPredictions.Zn.value)
            : null,
      B:
        rawPredictions.BORON?.value != null
          ? Number(rawPredictions.BORON.value)
          : rawPredictions.boron?.value != null
            ? Number(rawPredictions.boron.value)
            : rawPredictions.B?.value != null
              ? Number(rawPredictions.B.value)
              : null,
      Fe:
        rawPredictions.iron?.value != null
          ? Number(rawPredictions.iron.value)
          : rawPredictions.Fe?.value != null
            ? Number(rawPredictions.Fe.value)
            : null,
      Mn:
        rawPredictions.manganese?.value != null
          ? Number(rawPredictions.manganese.value)
          : rawPredictions.Mn?.value != null
            ? Number(rawPredictions.Mn.value)
            : null,
      Cu:
        rawPredictions.copper?.value != null
          ? Number(rawPredictions.copper.value)
          : rawPredictions.Cu?.value != null
            ? Number(rawPredictions.Cu.value)
            : null,
      pH:
        properties?.ph != null
          ? Number(properties.ph)
          : rawPredictions.pH?.value != null
            ? Number(rawPredictions.pH.value)
            : null,
      EC:
        properties?.ec?.value ??
        (typeof properties?.ec === 'number' ? properties.ec : null) ??
        properties?.EC?.value ??
        (typeof properties?.EC === 'number' ? properties.EC : null) ??
        response?.properties?.ec?.value ??
        (typeof response?.properties?.ec === 'number' ? response.properties.ec : null) ??
        response?.properties?.EC?.value ??
        (typeof response?.properties?.EC === 'number' ? response.properties.EC : null) ??
        response?.data?.properties?.ec?.value ??
        (typeof response?.data?.properties?.ec === 'number' ? response.data.properties.ec : null) ??
        response?.data?.properties?.EC?.value ??
        (typeof response?.data?.properties?.EC === 'number' ? response.data.properties.EC : null) ??
        response?.modelPredictions?.EC ??
        response?.stats?.EC?.value ??
        response?.stats?.EC ??
        response?.EC?.value ??
        (typeof response?.EC === 'number' ? response.EC : null) ??
        response?.ec?.value ??
        (typeof response?.ec === 'number' ? response.ec : null) ??
        rawPredictions?.EC?.value ??
        null,
    };
    console.log('SOIL DATA FULL:', response);
    console.log('EC:', response?.properties?.ec ?? response?.properties?.EC ?? response?.data?.properties?.ec ?? response?.data?.properties?.EC ?? response?.ec ?? response?.EC ?? null);
    console.log('OC:', response?.properties?.oc ?? response?.properties?.OC ?? response?.data?.properties?.oc ?? response?.data?.properties?.OC ?? response?.oc ?? response?.OC ?? null);
    console.log('FARMER:', response?.farmer);
    console.log('🔍 NUTRIENTS OBJECT CREATED:', nutrients);
    console.log('EC RAW:', properties?.ec ?? properties?.EC);
    console.log('EC FINAL:', nutrients.EC);
    console.log('OC RAW properties.oc:', properties?.oc ?? properties?.OC);
    console.log('OC RAW rawPredictions.OC:', rawPredictions.OC);
    console.log('OC FINAL:', nutrients.OC);

    const adaptedSoilData = {
      overallSoilScore: response?.overallSoilScore ?? null,
      lat: response?.lat,
      lon: response?.lon,
      properties: response?.properties ?? null,
      farmer: response?.farmer ?? null,
      ec: response?.ec ?? null,
      oc: response?.oc ?? null,
      nutrients,
      stats: {

        N: { label: normalizeMacroStatus(rawStats?.N?.label) },
        P: { label: normalizeMacroStatus(rawStats?.P?.label) },
        K: { label: normalizeMacroStatus(rawStats?.K?.label) },
        OC: { label: normalizeMacroStatus(rawStats?.OC?.label) },
        S: { label: normalizeMicroStatus(rawStats?.S?.label) },
        Zn: { label: normalizeMicroStatus(rawStats?.Zn?.label) },
        Fe: { label: normalizeMicroStatus(rawStats?.Fe?.label) },
        Mn: { label: normalizeMicroStatus(rawStats?.Mn?.label) },
        Cu: { label: normalizeMicroStatus(rawStats?.Cu?.label) },
        B: { label: normalizeMicroStatus(rawStats?.B?.label) },
        pH: { label: normalizeStatus(rawStats?.pH?.label) },
        EC: { label: normalizeStatus(rawStats?.EC?.label) },
      },
      forecast7d: predictionBlock?.forecast7d ?? [],
      soilLayers: predictionBlock?.soilLayers ?? [],
      moistureLayers: predictionBlock?.moistureLayers ?? [],
      tempInsight: predictionBlock?.tempInsight,
      moistInsight: predictionBlock?.moistInsight,
      tempActions: predictionBlock?.tempActions ?? [],
      moistActions: predictionBlock?.moistActions ?? [],
      fertilizerRecommendation: response?.fertilizerRecommendation,
    };
    console.log('🔍 ADAPTED SOIL DATA - nutrients:', adaptedSoilData.nutrients);

    setData(adaptedSoilData);
    setStateValue(response?.state || '');
    setDistrictValue(response?.district || '');
    setCrop(response?.crop || '');

    if (predictionBlock?.predictions) {
      const n = predictionBlock.predictions;
      const safe = (v?: number, d = 2) =>
        typeof v === 'number' && !Number.isNaN(v) ? v.toFixed(d) : '';

      setN(safe(n.nitrogen?.value ?? n.N?.value, 0));
      setP(safe(n.phosphorus?.value ?? n.P?.value, 0));
      setK(safe(n.potassium?.value ?? n.K?.value, 0));
      setOC(
        safe(
          (properties?.oc as number | undefined) ??
            (response?.oc as number | undefined) ??
            n.OC?.value,
          2,
        ),
      );
    }

    return adaptedSoilData;
  };

async function generateReportByDate() {

  const fieldId = selectedFieldId;
  if (!fieldId) {
    console.error('No field selected');
    return;
  }
  console.log('Using fieldId:', fieldId);

  if (!sampleDate) {
    alert("Please select sample date");
    return;
  }

  try {
    setLoadingSoil(true);

    // get lat/lon from already loaded soil overview data
    const lat = data?.lat;
    const lon = data?.lon;

    if (!lat || !lon) {
      alert("Field location not available");
      return;
    }

    let soilJson: any = null;

    try {
      // Trigger prediction first; final UI should still render from refreshed overview.
      await predictSoil({
        field_id: fieldId,
        lat: lat,
        lon: lon,
        sample_date: sampleDate,
      });
      soilJson = await fetchSoilData(fieldId);
    } catch (predictErr) {
      console.error('predictSoil or overview refresh failed, falling back to legacy date report', predictErr);
      soilJson = await fetchSoilByDate({
        lat: lat,
        lon: lon,
        sample_date: sampleDate,
      });
    }

    const response = soilJson?.data || soilJson;
    const baseSoil = response?.data || response;
    setSoil(baseSoil);
    const properties =
      response?.properties ||
      response?.data?.properties ||
      response?.soilFeatures ||
      response?.data?.soilFeatures ||
      {};
    let predictionBlock = response?.prediction || response?.data?.prediction || {};

    if (!predictionBlock?.predictions && response?.predictions) {
      predictionBlock = {
        predictions: response.predictions,
        stats: response.stats || {}
      };
    }

    const rawPredictions = predictionBlock?.predictions || {};
    const rawStats = predictionBlock?.stats || {};
    console.log("FINAL BACKEND RESPONSE 👉", JSON.stringify(response, null, 2));
    console.log("PREDICTION BLOCK 👉", predictionBlock);
    console.log("RAW PREDICTIONS 👉", rawPredictions);
    console.log("PROPERTIES 👉", properties);

    const nutrients = {
  N:
    rawPredictions.nitrogen?.value != null
      ? Number(rawPredictions.nitrogen.value)
      : rawPredictions.N?.value != null
        ? Number(rawPredictions.N.value)
        : null,
  P:
    rawPredictions.phosphorus?.value != null
      ? Number(rawPredictions.phosphorus.value)
      : rawPredictions.P?.value != null
        ? Number(rawPredictions.P.value)
        : null,
  K:
    rawPredictions.potassium?.value != null
      ? Number(rawPredictions.potassium.value)
      : rawPredictions.K?.value != null
        ? Number(rawPredictions.K.value)
        : null,

  OC:
    properties?.oc ??
    properties?.OC ??
    response?.properties?.oc ??
    response?.properties?.OC ??
    response?.data?.properties?.oc ??
    response?.data?.properties?.OC ??
    response?.modelPredictions?.OC ??
    response?.stats?.OC?.value ??
    response?.stats?.OC ??
    response?.OC ??
    response?.oc ??
    rawPredictions?.OC?.value ??
    null,

  S:
    rawPredictions.SULFUR?.value != null
      ? Number(rawPredictions.SULFUR.value)
      : rawPredictions.sulfur?.value != null
        ? Number(rawPredictions.sulfur.value)
        : rawPredictions.S?.value != null
          ? Number(rawPredictions.S.value)
          : null,
  Zn:
    rawPredictions.zinc?.value != null
      ? Number(rawPredictions.zinc.value)
      : rawPredictions.Zn?.value != null
        ? Number(rawPredictions.Zn.value)
        : null,
  B:
    rawPredictions.BORON?.value != null
      ? Number(rawPredictions.BORON.value)
      : rawPredictions.boron?.value != null
        ? Number(rawPredictions.boron.value)
        : rawPredictions.B?.value != null
          ? Number(rawPredictions.B.value)
          : null,
  Fe:
    rawPredictions.iron?.value != null
      ? Number(rawPredictions.iron.value)
      : rawPredictions.Fe?.value != null
        ? Number(rawPredictions.Fe.value)
        : null,
  Mn:
    rawPredictions.manganese?.value != null
      ? Number(rawPredictions.manganese.value)
      : rawPredictions.Mn?.value != null
        ? Number(rawPredictions.Mn.value)
        : null,
  Cu:
    rawPredictions.copper?.value != null
      ? Number(rawPredictions.copper.value)
      : rawPredictions.Cu?.value != null
        ? Number(rawPredictions.Cu.value)
        : null,

  pH:
    properties?.ph != null
      ? Number(properties.ph)
      : rawPredictions.pH?.value != null
        ? Number(rawPredictions.pH.value)
        : null,
  EC:
    properties?.ec?.value ??
    (typeof properties?.ec === 'number' ? properties.ec : null) ??
    properties?.EC?.value ??
    (typeof properties?.EC === 'number' ? properties.EC : null) ??
    response?.properties?.ec?.value ??
    (typeof response?.properties?.ec === 'number' ? response.properties.ec : null) ??
    response?.properties?.EC?.value ??
    (typeof response?.properties?.EC === 'number' ? response.properties.EC : null) ??
    response?.data?.properties?.ec?.value ??
    (typeof response?.data?.properties?.ec === 'number' ? response.data.properties.ec : null) ??
    response?.data?.properties?.EC?.value ??
    (typeof response?.data?.properties?.EC === 'number' ? response.data.properties.EC : null) ??
    response?.modelPredictions?.EC ??
    response?.stats?.EC?.value ??
    response?.stats?.EC ??
    response?.EC?.value ??
    (typeof response?.EC === 'number' ? response.EC : null) ??
    response?.ec?.value ??
    (typeof response?.ec === 'number' ? response.ec : null) ??
    rawPredictions?.EC?.value ??
    null,
};
  console.log('SOIL DATA FULL:', response);
  console.log('EC:', response?.properties?.ec ?? response?.properties?.EC ?? response?.data?.properties?.ec ?? response?.data?.properties?.EC ?? response?.ec ?? response?.EC ?? null);
  console.log('OC:', response?.properties?.oc ?? response?.properties?.OC ?? response?.data?.properties?.oc ?? response?.data?.properties?.OC ?? response?.oc ?? response?.OC ?? null);
  console.log('FARMER:', response?.farmer);
  console.log('EC RAW:', properties?.ec ?? properties?.EC);
  console.log('EC FINAL:', nutrients.EC);

  setData((prev: any) => ({
      ...prev,

      properties: response?.properties ?? prev?.properties ?? null,
      farmer: response?.farmer ?? prev?.farmer ?? null,
      ec: response?.ec ?? prev?.ec ?? null,
      oc: response?.oc ?? prev?.oc ?? null,

      nutrients,

      stats: {
        N:  { label: normalizeMacroStatus(rawStats?.N?.label) },
        P:  { label: normalizeMacroStatus(rawStats?.P?.label) },
        K:  { label: normalizeMacroStatus(rawStats?.K?.label) },
        OC: { label: normalizeMacroStatus(rawStats?.OC?.label) },

        S:  { label: normalizeMicroStatus(rawStats?.S?.label) },
        Zn: { label: normalizeMicroStatus(rawStats?.Zn?.label) },
        Fe: { label: normalizeMicroStatus(rawStats?.Fe?.label) },
        Mn: { label: normalizeMicroStatus(rawStats?.Mn?.label) },
        Cu: { label: normalizeMicroStatus(rawStats?.Cu?.label) },

        pH: { label: normalizeStatus(rawStats?.pH?.label) },
        EC: { label: normalizeStatus(rawStats?.EC?.label) },
      },

      // ⭐ ADD THESE
      forecast7d: predictionBlock?.forecast7d ?? [], 
      soilLayers: predictionBlock?.soilLayers ?? [],
      moistureLayers: predictionBlock?.moistureLayers ?? [],

      tempInsight: predictionBlock?.tempInsight,
      moistInsight: predictionBlock?.moistInsight,

      tempActions: predictionBlock?.tempActions ?? [],
      moistActions: predictionBlock?.moistActions ?? [],
      fertilizerRecommendation: response?.fertilizerRecommendation,
    }));

  } catch (err) {
    console.error(err);
  } finally {
    setLoadingSoil(false);
  }
}

  /* ---------- Fetch field details ---------- */
  useEffect(() => {
    if (!selectedFieldId) return;

    if (lastFetchedFieldIdRef.current === selectedFieldId) return;
    lastFetchedFieldIdRef.current = selectedFieldId;

    let isMounted = true;

    async function fetchFieldDetails() {
      try {
        const details = await fetchFieldById(selectedFieldId);
        if (!isMounted) return;
        setFieldData(details);
        setHasError(false);
      } catch (e: any) {
        if (!isMounted) return;
        console.error('Field details fetch failed:', e);
        setError('Unable to fetch field details.');
        setHasError(true);
      }
    }

    fetchFieldDetails();

    return () => {
      isMounted = false;
    };
  }, [selectedFieldId]);

  /* ---------- Run prediction from DB field data ---------- */
  const fieldDataId = fieldData?.field_id ?? fieldData?.id ?? null;

  useEffect(() => {
    if (!fieldDataId) return;

    if (lastPredictedFieldIdRef.current === fieldDataId) return;
    if (cachedFieldIdRef.current === fieldDataId) return;
    lastPredictedFieldIdRef.current = fieldDataId;

    let isMounted = true;

    async function runPrediction() {
      try {
        if (!isMounted) return;

        setLoadingSoil(true);
        setError(null);
        setHasError(false);

        const predictionRes = await predictSoilByFieldId(fieldDataId);
        console.log('🔍 PREDICTION API RESPONSE PROPERTIES:', predictionRes?.properties || 'NO PROPERTIES');

        const soilJson = await fetchSoilData(fieldDataId);
        if (!isMounted) return;
        console.log('🔍 SOIL DATA API RESPONSE PROPERTIES:', soilJson?.data?.properties || soilJson?.properties || 'NO PROPERTIES');

        // ✅ inject properties ONLY (no other change)
        if (predictionRes?.properties) {
          const target = soilJson?.data ?? soilJson;
          console.log('🔍 TARGET BEFORE MERGE:', { hasTarget: !!target, targetKeys: Object.keys(target || {}) });

          target.properties = {
            ...(target.properties || {}),
            ...predictionRes.properties,
          };
          console.log('🔍 TARGET AFTER MERGE - PROPERTIES:', target.properties);
        } else {
          console.log('🔍 NO PREDICTION PROPERTIES TO MERGE');
        }

        applySoilOverviewResponse(soilJson);
        setCachedSoilResponse(fieldDataId, soilJson);
      } catch (e: any) {
        if (!isMounted) return;
        console.error('Prediction failed:', e);
        const status = e?.response?.status ?? e?.status;

        if (
          status === 401 ||
          e?.message?.toLowerCase().includes('token')
        ) {
          router.push('/login');
          return;
        }

        setError('Unable to fetch soil data from backend. Backend is unavailable, please try again later.');
        setHasError(true);
      } finally {
        if (isMounted) {
          setLoadingSoil(false);
        }
      }
    }

    runPrediction();

    return () => {
      isMounted = false;
    };
  }, [fieldDataId]);

  /* ---------- Fertilizer API (FULLY BACKEND DRIVEN) ---------- */
  async function getRecommendation() {
    setLoadingFert(true);
    setFertilizer(null);
    setError(null);

    try {
      const overviewFertilizer = data?.fertilizerRecommendation;

      if (overviewFertilizer) {
        const adaptedFromOverview = {
          crop: crop || overviewFertilizer?.crop || '',
          soilConditioner: overviewFertilizer?.fym || '—',
          combo1: Array.isArray(overviewFertilizer?.combination_1)
            ? overviewFertilizer.combination_1
            : [],
          combo2: Array.isArray(overviewFertilizer?.combination_2)
            ? overviewFertilizer.combination_2
            : [],
        };

        setFertilizer(adaptedFromOverview);
        setLoadingFert(false);
        return;
      }

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

  const getDisplayCombinations = (fert: any) => {
    const combo1 = Array.isArray(fert?.combo1) ? fert.combo1 : [];
    const combo2 = Array.isArray(fert?.combo2) ? fert.combo2 : [];

    const combosAreSame =
      combo1.length > 0 &&
      combo2.length > 0 &&
      JSON.stringify(combo1) === JSON.stringify(combo2);

    if (!combosAreSame) {
      return { combo1Display: combo1, combo2Display: combo2 };
    }

    if (combo1.length <= 1) {
      return { combo1Display: combo1, combo2Display: [] };
    }

    const splitAt = Math.ceil(combo1.length / 2);
    return {
      combo1Display: combo1.slice(0, splitAt),
      combo2Display: combo1.slice(splitAt),
    };
  };

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

  if (hasError) {
    return (
      <div className="h-screen flex items-center justify-center text-red-600">
        Unable to load soil data. Please try again later.
      </div>
    );
  }
  if (!soil) return null;
  // API data processing

  const ec =
    soil?.stats?.EC ??
    soil?.stats?.ec ??
    soil?.modelPredictions?.EC ??
    soil?.properties?.ec ??
    soil?.properties?.EC ??
    soil?.data?.properties?.ec ??
    soil?.data?.properties?.EC ??
    soil?.EC ??
    soil?.ec ??
    null;
  const oc =
    soil?.stats?.OC ??
    soil?.stats?.oc ??
    soil?.modelPredictions?.OC ??
    soil?.properties?.oc ??
    soil?.properties?.OC ??
    soil?.data?.properties?.oc ??
    soil?.data?.properties?.OC ??
    soil?.OC ??
    soil?.oc ??
    null;
  const ecValue = ec !== null && ec !== undefined
    ? ec && typeof ec === 'object'
      ? ec.value
      : ec
    : 'N/A';
  const ocValue = oc !== null && oc !== undefined
    ? oc && typeof oc === 'object'
      ? oc.value
      : oc
    : 'N/A';

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
    nutrientKey,
    label,
    myValue,
    unit,
  }: {
    nutrientKey: string;
    label: string;
    myValue: any;
    unit: string;
  }) => {
    const resolvedValue =
      myValue && typeof myValue === 'object' ? myValue.value : myValue;
    const hasValue = resolvedValue !== null && resolvedValue !== undefined;
    const parsedValue = Number(resolvedValue);
    const isNumericValue = Number.isFinite(parsedValue);
    const level = getLevelFromValue(
      nutrientKey,
      isNumericValue ? parsedValue : null,
    );
    const style = level ? LEVEL_STYLE[level] : null;
    const rangeInfo = NUTRIENT_RANGE_TEXT[nutrientKey];
    const middleLabel = rangeInfo?.middleLabel ?? 'SUFFICIENT';
    const highLabel = rangeInfo?.highLabel ?? 'HIGH';
    const isMicroTwoColumn = ['S', 'Zn', 'B', 'Fe', 'Mn', 'Cu'].includes(nutrientKey);
    const showThirdRangeColumn =
      !!rangeInfo && !isMicroTwoColumn && highLabel !== '-' && !!rangeInfo.high?.trim();
    const displayValue = hasValue ? resolvedValue : 'N/A';
    const badgeText =
      nutrientKey === 'EC' && level === 'Sufficient'
        ? 'MEDIUM'
        : level
          ? level.toUpperCase()
          : 'N/A';
    const sliderGradient =
      nutrientKey === 'EC'
        ? 'from-green-200 via-yellow-200 to-red-200'
        : 'from-rose-200 via-amber-200 to-emerald-200';

    return (
      <div className="bg-gradient-to-br from-white via-emerald-50/30 to-lime-50/40 border border-emerald-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            {label}
          </div>

          <span
            className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
              style?.badge ?? 'bg-slate-100 text-slate-600'
            }`}
          >
            {badgeText}
          </span>
        </div>

        <div className="text-xl font-bold text-slate-900 mb-3">
          {displayValue}
          {isNumericValue && (
            <span className="text-xs text-slate-400 ml-1">{unit}</span>
          )}
        </div>

        <div className={`w-full h-2 rounded-full bg-gradient-to-r ${sliderGradient} relative`}>
          <div
            className="absolute top-[-4px] w-3 h-3 bg-orange-500 rounded-full shadow"
            style={{ left: style?.pointer ?? '50%' }}
          ></div>
        </div>

        {isMicroTwoColumn ? (
          <div className="grid grid-cols-2 text-[10px] text-slate-400 mt-1 font-medium">
            <span className="text-left">LOW</span>
            <span className="text-center">{middleLabel}</span>
          </div>
        ) : (
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
            <span>LOW</span>
            <span>{middleLabel}</span>
            <span>{highLabel}</span>
          </div>
        )}

        {rangeInfo && (
          <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden">
            {showThirdRangeColumn ? (
              <>
                <div className="grid grid-cols-3 bg-slate-50 text-[9px] font-semibold text-slate-600">
                  <div className="px-2 py-1 border-r border-slate-200">LOW</div>
                  <div className="px-2 py-1 border-r border-slate-200">{middleLabel}</div>
                  <div className="px-2 py-1">{highLabel}</div>
                </div>
                <div className="grid grid-cols-3 text-[9px] text-slate-500">
                  <div className="px-2 py-1 border-r border-slate-200">{rangeInfo.low}</div>
                  <div className="px-2 py-1 border-r border-slate-200">{rangeInfo.medium}</div>
                  <div className="px-2 py-1">{rangeInfo.high}</div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 bg-slate-50 text-[9px] font-semibold text-slate-600">
                  <div className="px-2 py-1 border-r border-slate-200">LOW</div>
                  <div className="px-2 py-1">{middleLabel}</div>
                </div>
                <div className="grid grid-cols-2 text-[9px] text-slate-500">
                  <div className="px-2 py-1 border-r border-slate-200">{rangeInfo.low}</div>
                  <div className="px-2 py-1">{rangeInfo.medium}</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const getNumericMoistureValue = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value.replace('%', '').trim());
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const fallbackMoistureActions = (() => {
    if (Array.isArray(activeData?.moistActions) && activeData.moistActions.length > 0) {
      return activeData.moistActions;
    }

    const forecastMoisture = getNumericMoistureValue(activeData?.forecast7d?.[0]?.moisture);
    const layerMoistureValues = Array.isArray(activeData?.moistureLayers)
      ? activeData.moistureLayers
          .map((l: any) => getNumericMoistureValue(l?.value))
          .filter((v: number | null): v is number => v !== null)
      : [];

    const avgLayerMoisture =
      layerMoistureValues.length > 0
        ? layerMoistureValues.reduce((sum: number, v: number) => sum + v, 0) /
          layerMoistureValues.length
        : null;

    const moistureNow = forecastMoisture ?? avgLayerMoisture;

    if (moistureNow === null) {
      return [
        {
          step: '1',
          color: 'blue',
          title: 'Run Moisture Check',
          description: 'Refresh soil moisture readings to generate irrigation actions.',
          cta: 'Refresh Data',
        },
        {
          step: '2',
          color: 'yellow',
          title: 'Inspect Field Zones',
          description: 'Check uneven wetness across depth layers before irrigation.',
          cta: 'View Field Notes',
        },
      ];
    }

    if (moistureNow < 25) {
      return [
        {
          step: '1',
          color: 'red',
          title: 'Start Irrigation Cycle',
          description: 'Soil moisture is critically low. Apply water immediately in short cycles.',
          cta: 'Start Irrigation',
        },
        {
          step: '2',
          color: 'yellow',
          title: 'Apply Surface Mulch',
          description: 'Use mulch to reduce evaporation and retain root-zone moisture.',
          cta: 'View Mulching Guide',
        },
      ];
    }

    if (moistureNow < 40) {
      return [
        {
          step: '1',
          color: 'yellow',
          title: 'Increase Irrigation Window',
          description: 'Moisture is below target. Increase duration slightly in morning hours.',
          cta: 'Update Schedule',
        },
        {
          step: '2',
          color: 'blue',
          title: 'Recheck After 24 Hours',
          description: 'Validate improvement in all depth layers after the next cycle.',
          cta: 'Set Reminder',
        },
      ];
    }

    if (moistureNow <= 70) {
      return [
        {
          step: '1',
          color: 'green',
          title: 'Maintain Current Plan',
          description: 'Moisture is in the optimal band. Continue the existing irrigation routine.',
          cta: 'Keep Current Plan',
        },
        {
          step: '2',
          color: 'blue',
          title: 'Monitor Daily Trend',
          description: 'Track depth-wise changes daily to prevent sudden moisture drops.',
          cta: 'Track Trend',
        },
      ];
    }

    return [
      {
        step: '1',
        color: 'blue',
        title: 'Reduce Irrigation Volume',
        description: 'Moisture is high. Reduce water input to avoid root stress.',
        cta: 'Lower Irrigation',
      },
      {
        step: '2',
        color: 'yellow',
        title: 'Improve Field Drainage',
        description: 'Inspect outlets and channels to prevent standing water buildup.',
        cta: 'Check Drainage',
      },
    ];
  })();

  return (
    // ADDED: h-screen and overflow-y-auto to enable scrolling
    <div className="p-4 sm:p-5 h-full bg-[#f3f7f6] min-w-0">
      {/* ================= MITHU TOP STRIP ================= */}
      <div className="bg-white rounded-xl shadow-sm px-6 py-4 flex items-center justify-between border border-slate-200 mb-6">

  <div className="flex items-center gap-4">
    <div className="h-14 w-14 rounded-xl bg-green-50 flex items-center justify-center">
      <Image
        src="/images/soil-mithu.png"
        alt="Soil Saathi"
        width={50}
        height={50}
        className="object-contain"
      />
    </div>

    <div>
      <div className="text-xl font-extrabold text-green-800">
        Soil Saathi
      </div>
      <div className="text-xs text-gray-500 tracking-wide">
        Precision Diagnostics Enabled
      </div>
    </div>
  </div>

  {/*
  <div className="flex items-center gap-3">
    <input
      type="date"
      value={sampleDate}
      onChange={(e) => setSampleDate(e.target.value)}
      className="border border-slate-200 rounded-lg px-4 py-2 text-sm"
    />

    <button
      onClick={generateReportByDate}
      className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow"
    >
      Scan Field
    </button>
  </div>
  */}

</div>



      {/* ================= FIELD MAP (Full Width) ================= */}
      <div className="w-full my-4 h-100 rounded-lg overflow-hidden shadow-lg border border-slate-200">
        <FarmMap
          title="Soil Map"
          initialLayer="savi"
          onFieldSelect={(field) => {
            const newId = field?.id || '';

            // Prevent repeated triggers from map rerenders.
            if (lastMapSelectionRef.current === newId) {
              return;
            }

            lastMapSelectionRef.current = newId;

            setSelectedFieldId(newId);
          }}
        />
      </div>

      
 
      {/* ================= MAIN CONTENT GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-[500px_1fr] gap-4 items-stretch">
        {/* LEFT COLUMN: Score Card & Nutrients */}
        <div className="flex flex-col gap-4 h-full">
          {/* 1. SOIL SCORE CARD (Top) */}
          <div className="bg-white rounded-lg p-3 shadow border border-slate-100 flex flex-col">
            <div className="text-sm font-semibold mb-2">Soil Score Card</div>

            <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
              <div className="text-xs text-gray-500">Overall Soil Score</div>
              <div
                className={`text-3xl font-bold leading-tight ${
                  activeData?.overallSoilScore != null
                    ? Number(activeData.overallSoilScore) > 0.6
                      ? 'text-green-700'
                      : Number(activeData.overallSoilScore) >= 0.3
                        ? 'text-yellow-700'
                        : 'text-red-700'
                    : 'text-green-700'
                }`}
              >
                {activeData?.overallSoilScore != null
                  ? Number(activeData.overallSoilScore).toFixed(2)
                  : '--'}
              </div>
            </div>

            {(() => {
              const score =
                activeData?.overallSoilScore != null
                  ? Number(activeData.overallSoilScore)
                  : null;

              const interpretation =
                score == null
                  ? 'Soil score not available yet. Run analysis to view interpretation.'
                  : score > 0.6
                    ? 'Healthy vegetation detected. Soil condition is good and supports crop growth.'
                    : score >= 0.3
                      ? 'Moderate vegetation health. Soil condition is average and may require attention.'
                      : 'Low vegetation health detected. Soil may be dry, low in nutrients, or under stress. Field may also be recently harvested or not cultivated.';

              const interpretationTone =
                score == null
                  ? 'bg-slate-50 text-slate-700 border-slate-200'
                  : score > 0.6
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : score >= 0.3
                      ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                      : 'bg-red-50 text-red-800 border-red-200';

              return (
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`rounded-lg border px-3 py-2 text-left ${interpretationTone}`}>
                    <div className="text-[10px] font-bold uppercase tracking-wide mb-1">
                      Score Interpretation
                    </div>
                    <p className="text-[11px] leading-snug">{interpretation}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white overflow-hidden text-left">
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                      Soil Score Reference
                    </div>
                    <div className="px-3 py-2 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0" />
                          <span className="font-semibold text-slate-700 truncate">Healthy</span>
                        </div>
                        <span className="text-slate-500 shrink-0">0.6 - 1.0</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500 shrink-0" />
                          <span className="font-semibold text-slate-700 truncate">Moderate</span>
                        </div>
                        <span className="text-slate-500 shrink-0">0.3 - 0.6</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
                          <span className="font-semibold text-slate-700 truncate">Low</span>
                        </div>
                        <span className="text-slate-500 shrink-0">0.0 - 0.3</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full bg-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-700 truncate">Degraded</span>
                        </div>
                        <span className="text-slate-500 shrink-0">&lt; 0</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="mt-3">
              <button
                onClick={() => {
                  try {
                    localStorage.setItem(
                      'soilHealthCardSnapshot',
                      JSON.stringify({
                        sampleDate,
                        selectedFieldId: selectedFieldId || fieldDataId || '',
                        soilData: data,
                        fieldData,
                      }),
                    );
                  } catch (snapshotErr) {
                    console.error('Failed to store soil health card snapshot', snapshotErr);
                  }

                  router.push(`/soil/health-card?sampleDate=${sampleDate}`);
                }}
                className="flex items-center justify-center gap-2 w-full bg-green-700 hover:bg-green-800 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-sm"
              >
                <FileText className="w-3 h-3" /> Get Soil Health Card
              </button>
            </div>
          </div>

          {/* 2. KEY SOIL NUTRIENTS (Fills Remaining Height using flex-1) */}
          <div className="bg-gradient-to-b from-emerald-50/60 via-white to-lime-50/40 rounded-2xl p-4 shadow-sm border border-emerald-100 flex flex-col relative overflow-hidden flex-1">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-200/40 rounded-full blur-3xl opacity-60 -mr-16 -mt-16 pointer-events-none"></div>

            {/* TITLE & TABS */}
            <div className="mb-5 relative z-10">
              <div className="flex items-center justify-between mb-6">

              <div>
                <div className="text-lg font-bold text-slate-900">
                  Nutrient Intelligence
                </div>
                <div className="text-xs text-slate-400">
                  Real-time soil nutrient diagnostics
                </div>
              </div>

            </div>

              <div className="flex justify-center">
                <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-xl border border-emerald-100 inline-flex gap-1 shadow-sm">
                  {['macro', 'micro', 'prop'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setNutrientTab(t as any)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                        nutrientTab === t
                          ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-emerald-50'
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
            <div className="flex-1 relative z-10 pb-2 min-h-0">
              {/* CONTAINER: SWITCHES BETWEEN LIST AND GRID */}
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                  nutrientTab === 'micro' ? 'max-h-[520px] overflow-y-auto pr-1' : ''
                }`}
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
                          nutrientKey="N"
                          label="Nitrogen (N)"
                          myValue={vals.N}
                          unit="kg/ha"
                        />

                        <NutrientGroupRow
                          nutrientKey="P"
                          label="Phosphorus (P)"
                          myValue={vals.P}
                          unit="kg/ha"
                        />

                        <NutrientGroupRow
                          nutrientKey="K"
                          label="Potassium (K)"
                          myValue={vals.K}
                          unit="kg/ha"
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
                        nutrientKey={item.k}
                        label={item.l}
                        myValue={vals[item.k]}
                        unit="mg/kg"
                      />
                    ));
                  }

                  if (nutrientTab === 'prop') {
                    return (
                      <>
                        <NutrientGroupRow
                          nutrientKey="OC"
                          label="Organic Carbon (OC)"
                          myValue={vals.OC ?? ocValue}
                          unit="%"
                        />

                        <NutrientGroupRow
                          nutrientKey="pH"
                          label="pH Level"
                          myValue={vals.pH}
                          unit=""
                        />
                         
                        <NutrientGroupRow
                          nutrientKey="EC"
                          label="Elec. Conductivity"
                          myValue={vals.EC ?? ecValue}
                          unit="dS/m"
                        />
                      </>
                    );
                  }
                })()}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-500 text-center font-medium">
              <a
                href={RANGE_SOURCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline underline-offset-2"
              >
                ICAR-Indian Institute of Soil Science reference
              </a>
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
                        min-h-[140px] shadow-md hover:shadow-lg transition-all
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
            <div className="bg-gradient-to-b from-emerald-50/60 to-white rounded-2xl shadow-lg border border-emerald-200 p-5 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3 mt-1">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <ThermometerSun className="w-4 h-4 text-green-700" />
                </div>
                <h3 className="font-bold text-green-900 text-sm">
                  Real-Time Soil Temperature
                </h3>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800 mb-4 flex items-start gap-2">
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
            <div className="bg-gradient-to-b from-emerald-50/60 to-white rounded-2xl shadow-lg border border-emerald-200 p-5 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3 mt-1">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <Droplets className="w-4 h-4 text-green-700" />
                </div>
                <h3 className="font-bold text-green-900 text-sm">
                  Real-Time Soil Moisture
                </h3>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800 mb-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-6 flex-shrink-0 mt-0.5" />
                <span>
                  <span className="font-bold">Advisory:</span>{' '}
                  {activeData?.moistInsight?.message ||
                    'No moisture insight available'}
                </span>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  DIAGNOSTIC VIEW
                </div>
                {/* Responsive container, h-80 for matching height */}
                {/* LEFT: Depth Labels - 4 items, centered with equal spacing */}
                <div
                  className="grid grid-cols-[80px_1fr_80px]"
                  style={{ minHeight: `${DEPTH_ROW_HEIGHT * 4}px` }}
                >
                  {/* LEFT: DEPTH LABELS */}
                  <div className="grid grid-rows-4 text-right pr-2" style={{ marginTop: `${SOIL_TOP_OFFSET}px` }}>
                    {activeData?.moistureLayers?.map((l: any, i: number) => (
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

                  {/* RIGHT: MOISTURE VALUES */}
                  <div className="grid grid-rows-4 pl-2" style={{ marginTop: `${SOIL_TOP_OFFSET}px` }}>
                    {activeData?.moistureLayers?.map((l: any, i: number) => (
                      <div
                        key={i}
                        style={{ height: `${DEPTH_ROW_HEIGHT}px` }}
                        className="flex items-center font-bold text-gray-800"
                      >
                        {l.value}%
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
                  {Array.isArray(fallbackMoistureActions) &&
                    fallbackMoistureActions.map((action: any, i: number) => (
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

        <div className="bg-gradient-to-r from-green-700 to-green-800 text-white px-6 py-4 font-bold text-lg rounded-t-xl">
        🌱 Fertilizer Recommendation Engine
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
                  (() => {
                    const { combo1Display, combo2Display } =
                      getDisplayCombinations(fertilizer);

                    return (
                      <tr>
                        <td className="p-2 border">{crop || fertilizer.crop}</td>
                        <td className="p-2 border">{fertilizer.soilConditioner}</td>
                        <td className="p-2 border">
                          {combo1Display.map(
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
                          {combo2Display.length > 0 ? (
                            combo2Display.map(
                              (
                                c: { fertilizer: string; doseKgHa: number },
                                i: number,
                              ) => (
                                <div key={i}>
                                  {c.fertilizer} ({c.doseKgHa} kg/ha)
                                </div>
                              ),
                            )
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })()
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


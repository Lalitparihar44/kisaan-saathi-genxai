// kvk/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic'; // Required for Leaflet
import { ChevronDown, ArrowLeft, Plus, Minus } from 'lucide-react';
import { handleLogout } from '../../lib/auth';
import { fetchFarmScore, fetchLocationData, fetchSubDistricts } from '../../lib/api';
import { LAYER_NAMES, LayerKey } from '../../lib/types';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar, getElementAtEvent } from 'react-chartjs-2';
import {
  Calendar,
  Layers,
  MapPin,
  Activity,
  FileText,
  LogOut,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS

// --- DYNAMIC IMPORTS FOR MAP (Prevents SSR Issues) ---
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false },
);
const GeoJSON = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false },
);
const MapEffect = dynamic(
  () =>
    import('react-leaflet').then((mod) => {
      const { useMap } = mod;
      return function MapEffect({
        center,
        zoom,
      }: {
        center: [number, number];
        zoom: number;
      }) {
        const map = useMap();
        useEffect(() => {
          map.setView(center, zoom);
        }, [center, zoom, map]);
        return null;
      };
    }),
  { ssr: false },
);

// Register Charts
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

// --- STYLES ---
const TAB_RECTANGLE =
  'bg-white border border-gray-200 rounded-md p-2 shadow-sm relative cursor-pointer hover:border-green-400 hover:shadow-md transition-all flex flex-col justify-center';
const TAB_LABEL =
  'flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-0.5';
const TAB_SELECT =
  'w-full bg-transparent text-sm font-bold text-gray-800 outline-none appearance-none z-10 relative cursor-pointer';

// --- CONSTANTS ---
const SEASONS = [
  'Oct-Dec (2025-2026)',
  'Rabi 2025-2026',
  'Kharif 2025',
  'Zaid 2025',
];
const PARAMETERS = LAYER_NAMES;

const STATE_CENTROIDS: Record<string, [number, number]> = {
  Maharashtra: [19.7515, 75.7139],
  Rajasthan: [26.5, 73.8],
  Gujarat: [22.2587, 71.1924],
  Karnataka: [15.3173, 75.7139],
  'Madhya Pradesh': [22.9734, 78.6569],
  'Uttar Pradesh': [26.8467, 80.9462],
  Punjab: [31.1471, 75.3412],
  Telangana: [18.1124, 79.0193],
  'Andhra Pradesh': [15.9129, 79.74],
  'Tamil Nadu': [11.1271, 78.6569],
  Kerala: [10.8505, 76.2711],
  'West Bengal': [22.9868, 87.855],
  Bihar: [25.0961, 85.3131],
  Odisha: [20.9517, 85.0985],
  Haryana: [29.0588, 76.0856],
  Assam: [26.2006, 92.9376],
  Chhattisgarh: [21.2787, 81.8661],
  Jharkhand: [23.6102, 85.2799],
  Uttarakhand: [30.0668, 79.0193],
  'Himachal Pradesh': [31.1048, 77.1734],
  Default: [22.0, 78.0],
};

const getParameterConfig = (param: string) => {
  switch (param) {
    case 'NDVI (Vegetation)':
      return {
        weights: [0.1, 0.15, 0.2, 0.25, 0.3],
        histLabels: [
          '0.0-0.1',
          '0.1-0.2',
          '0.2-0.3',
          '0.3-0.4',
          '0.4-0.5',
          '0.5-0.6',
          '>0.6',
        ],
        unit: '',
        isReverse: true,
      };
    
    case 'NDWI (Water Index)':
      return {
        weights: [0.12, 0.18, 0.25, 0.25, 0.2],
        histLabels: ['< -0.2', '-0.2–0', '0–0.2', '0.2–0.4', '0.4–0.6', '>0.6'],
        unit: '',
        isReverse: true,
      };
    case 'NDMI (Moisture Index)':
      return {
        weights: [0.1, 0.2, 0.25, 0.25, 0.2],
        histLabels: ['< -0.3', '-0.3–0', '0–0.2', '0.2–0.4', '0.4–0.6', '>0.6'],
        unit: '',
        isReverse: true,
      };
    case 'EVI (Enhanced Vegetation)':
      return {
        weights: [0.08, 0.12, 0.2, 0.3, 0.3],
        histLabels: ['<0.2', '0.2–0.4', '0.4–0.6', '0.6–0.8', '>0.8'],
        unit: '',
        isReverse: false,
      };
    default:
      return {
        weights: [0.1, 0.15, 0.25, 0.25, 0.25],
        histLabels: [
          'Critical',
          'Very Poor',
          'Poor',
          'Avg',
          'Good',
          'Very Good',
          'Excellent',
        ],
        unit: '',
        isReverse: true,
      };
  }
};

const getParameterSummary = (param: string, region: string) => {
  return `Current analysis for ${region} using ${param} indicates varying conditions. Darker regions on the map represent higher stress or deviation, while lighter regions indicate normal conditions based on the ${param} index.`;
};

const getStressMultiplier = (season: string, date: string) => {
  const month = new Date(date).getMonth() + 1;
  if (month >= 4 && month <= 6) return 1.4;
  if (month >= 7 || month <= 10) return 0.8;
  return 1.0;
};

const getParameterAxisLabels = (param: string) => {
  switch (param) {
    case 'NDVI Deviation':
      return { x: 'Deviation (%)', y: 'Region Count' };
    case 'NDVI (Vegetation)':
      return { x: 'Vegetation Index (0-1)', y: 'Field Count' };
    case 'NDRE':
      return { x: 'Red Edge Index', y: 'Field Count' };
    case 'NDWI (Water Index)':
      return { x: 'Water Index (-1 to 1)', y: 'Region Count' };
    case 'NDMI (Moisture Index)':
      return { x: 'Moisture Index (-1 to 1)', y: 'Region Count' };
    case 'EVI (Enhanced Vegetation)':
      return { x: 'Enhanced Vegetation Index (0–1)', y: 'Region Count' };
    case 'SAVI':
      return { x: 'Soil Adjusted Index', y: 'Field Count' };
    default:
      return { x: 'Value Range', y: 'Frequency' };
  }
};
const getSubDistricts = (
  state: string,
  district: string,
  locationData: Record<string, string[]>,
) => {
  if (!locationData[state] || !locationData[state].includes(district))
    return [];
  return [`${district} Rural`, `${district} Urban`];
};

interface DashboardStats {
  extreme: any[];
  severe: any[];
  moderate: any[];
  mild: any[];
  normal: any[];
  total: any[];
}
interface RegionDetail {
  id: string;
  name: string;
  status: 'Extreme' | 'Severe' | 'Moderate' | 'Mild' | 'Normal';
  value: string;
}

export default function KVKDashboard() {
  const router = useRouter();
  const donutChartRef = useRef<any>(null);

  const [locationData, setLocationData] = useState<Record<string, string[]>>(
    {},
  );
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [level, setLevel] = useState('District');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');
  const [subDistrict, setSubDistrict] = useState('Haveli');
  const [subDistricts, setSubDistricts] = useState<string[]>([]);
  const [parameter, setParameter] = useState<LayerKey>('ndvi');
  const [season, setSeason] = useState(SEASONS[0]);
  const [date, setDate] = useState('2025-12-01');
  const [fieldDetails, setFieldDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [subDistrictGeoJson, setSubDistrictGeoJson] = useState<any>(null);

  const [stats, setStats] = useState<DashboardStats>({
    extreme: [],
    severe: [],
    moderate: [],
    mild: [],
    normal: [],
    total: [],
  });
  const [chartData, setChartData] = useState<{
    pie: number[];
    hist: number[];
    histLabels: string[];
  }>({
    pie: [],
    hist: [],
    histLabels: [],
  });

  const [detailedData, setDetailedData] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('accessToken');
    const isOfficial = localStorage.getItem('isOfficial');
    if ((!user && isOfficial != 'true') || (user && isOfficial != 'true')) {
      router.push('/login');
    } else {
      setIsAuthorized(true);
      fetchLocationData().then(setLocationData).catch(console.error);
    }
  }, [router]);
  useEffect(() => {
    const districts = locationData[state] || [];
    if (!districts.includes(district)) setDistrict(districts[0] || '');
    fetchSubDistricts(district).then(setSubDistricts);
  }, [state, district, locationData]);

  // useEffect(() => {
  //   const subs = getSubDistricts(state, district, locationData);
  //   if (!subs.includes(subDistrict)) setSubDistrict(subs[0] || '');
  // }, [state, district, subDistrict, locationData]);

  useEffect(() => {
    const fetchGeoJson = async () => {
      setMapLoading(true);
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/geohacker/india/master/district/india_district.geojson',
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch district geojson: ${response.status}`,
          );
        }

        const text = await response.text();
        const data = JSON.parse(text);
        setGeoJsonData(data);
      } catch (error) {
        console.error('Failed to load map data', error);
      } finally {
        setMapLoading(false);
      }
    };
    fetchGeoJson();
  }, []);
  // 🔽 ADD THIS EXACT BLOCK BELOW district geojson useEffect
  useEffect(() => {
    if (level !== 'Sub-District') return;

    const fetchSubDistrictGeoJson = async () => {
      try {
        const res = await fetch('/geojson/india_subdistrict.geojson');
        if (!res.ok) throw new Error('Failed to load sub-district geojson');
        const data = await res.json();
        setSubDistrictGeoJson(data); // 🔴 THIS NEVER HAPPENED BEFORE
      } catch (err) {
        console.error('Sub-district geojson error:', err);
      }
    };

    fetchSubDistrictGeoJson();
  }, [level]);

  useEffect(() => {
    const generateData = async () => {
      setLoading(true);
      setSelectedCategory(null);
      setDetailedData([]);
      await new Promise((r) => setTimeout(r, 600));

      // Call farm score API
      try {
        const farmScoreData = await fetchFarmScore(
          state, 
          level === 'State' ? undefined : district, 
          parameter
        );
        console.log('Farm score data:', farmScoreData);
        
        // Use API response data if available
        if (farmScoreData) {
          const config = getParameterConfig(parameter);
          const apiStats = {
            extreme: farmScoreData.extreme || [],
            severe: farmScoreData.severe || [],
            moderate: farmScoreData.moderate || [],
            mild: farmScoreData.mild || [],
            normal: farmScoreData.normal || [],
            total: [...farmScoreData.extreme, ...farmScoreData.severe, ...farmScoreData.moderate, ...farmScoreData.mild, ...farmScoreData.normal],
          };
          
          setStats(apiStats);
          setChartData({
            pie: [
              apiStats.extreme.length,
              apiStats.severe.length,
              apiStats.moderate.length,
              apiStats.mild.length,
              apiStats.normal.length,
            ],
            hist: config.histLabels.map(() =>
              Math.floor(apiStats.total.length / config.histLabels.length + Math.random() * 10)
            ),
            histLabels: config.histLabels,
          });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Failed to fetch farm score:', error);
      }
      
      setLoading(false);
    };
    generateData();
  }, [
    level,
    state,
    district,
    subDistrict,
    parameter,
    season,
    date,
    subDistrictGeoJson,
  ]); 
  const handleCustomReport = () => router.push('/kvk/custom-report');

  const handleTotalClick = () => {
    if (level === 'State') setLevel('District');
    else if (level === 'District') setLevel('Sub-District');
  };

  const handleCardClick = (category: string) => {
    if (stats[category.toLowerCase() as keyof DashboardStats].length > 0)
      {setSelectedCategory(category);
    setDetailedData(stats[category.toLowerCase() as keyof DashboardStats]);
  }};

  const handleDonutClick = (event: any) => {
    const { current: chart } = donutChartRef;
    if (!chart) return;
    const elements = getElementAtEvent(chart, event);
    if (elements.length > 0) {
      const index = elements[0].index;
      const categories = ['Extreme', 'Severe', 'Moderate', 'Mild', 'Normal'];
      setSelectedCategory(categories[index]);
      setDetailedData(stats[categories[index].toLowerCase() as keyof DashboardStats]);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-bold text-green-800 text-sm">
            Verifying Access...
          </span>
        </div>
      </div>
    );
  }

  const StatCard = ({
    label,
    val,
    color,
  }: {
    label: string;
    val: any[];
    color: string;
  }) => (
    <div
      onClick={() => handleCardClick(label)}
      className={`flex flex-col items-center justify-center p-2 rounded-lg shadow-sm ${color} text-white flex-1 min-w-[85px] hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-95`}
    >
      {loading ? (
        <div className="h-6 w-6 bg-white/30 rounded-full animate-pulse mb-1" />
      ) : (
        <span className="text-2xl font-bold">{val.length}</span>
      )}
      <span className="text-[10px] font-bold uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );

  const axisLabels = getParameterAxisLabels(parameter);
  const filteredSubDistrictGeoJson =
    level === 'Sub-District' && subDistrictGeoJson
      ? {
          ...subDistrictGeoJson,
          features: subDistrictGeoJson.features.filter((f: any) => {
            const p = f.properties || {};
            const sName = p.ST_NAME || p.st_nm || p.NAME_1 || '';
            const dName = p.DT_NAME || p.district || p.NAME_2 || '';
            return (
              sName.toLowerCase() === state.toLowerCase() &&
              dName.toLowerCase() === district.toLowerCase()
            );
          }),
        }
      : null;
  console.log('detailedData:', detailedData);
  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* 1. HEADER */}
      <header className="bg-green-600 border-b-4 border-green-700 px-4 py-2 flex justify-between items-center shadow-md z-30">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg shadow-sm h-10 w-10 flex items-center justify-center overflow-hidden">
            <img
              src="https://placehold.co/100x100/png?text=Logo"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="leading-none">
            <h1 className="text-xl font-bold text-white">
              KisaanSaathi{' '}
              <span className="text-green-200 font-normal">- KVK</span>
            </h1>
            <p className="text-[10px] text-green-100 font-bold uppercase mt-1">
              Analytics Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <div className="text-xs font-bold text-green-200 uppercase">
              Current View
            </div>
            <div className="text-sm font-bold text-white">
              {level === 'State'
                ? state
                : level === 'District'
                  ? `${district}, ${state}`
                  : `${subDistrict}, ${district}`}
            </div>
          </div>
          <button
            onClick={() => handleLogout(router)}
            className="flex items-center gap-2 bg-green-800 hover:bg-black text-white px-3 py-1.5 rounded text-xs font-bold transition shadow border border-green-600"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {/* 2. FILTERS BAR */}
      <div className="bg-white px-4 py-3 shadow-md border-b border-gray-200 z-20">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className={`${TAB_RECTANGLE} flex-1 min-w-[150px] group`}>
            <label className={TAB_LABEL}>
              <Calendar size={10} className="text-gray-400" /> Season
            </label>
            <div className="relative">
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className={TAB_SELECT}
              >
                {SEASONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          <div className={`${TAB_RECTANGLE} flex-1 min-w-[110px] group`}>
            <label className={TAB_LABEL}>
              <Layers size={10} className="text-gray-400" /> Level
            </label>
            <div className="relative">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className={TAB_SELECT}
              >
                <option value="State">State</option>
                <option value="District">District</option>
                <option value="Sub-District">Sub-District</option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          <div className={`${TAB_RECTANGLE} flex-1 min-w-[140px] group`}>
            <label className={TAB_LABEL}>
              <MapPin size={10} className="text-gray-400" /> State
            </label>
            <div className="relative">
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={TAB_SELECT}
              >
                {Object.keys(locationData)
                  .sort()
                  .map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          <div
            className={`${TAB_RECTANGLE} flex-1 min-w-[140px] group transition-all ${level === 'State' ? 'bg-gray-50 opacity-60' : ''}`}
          >
            <label className={TAB_LABEL}>
              <MapPin size={10} className="text-gray-400" /> District
            </label>
            <div className="relative">
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  fetchSubDistricts(district);
                }}
                className={`${TAB_SELECT} ${level === 'State' ? 'cursor-not-allowed' : ''}`}
                disabled={level === 'State'}
              >
                {level === 'State' && <option>All Districts</option>}
                {(locationData[state] || []).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          <div
            className={`${TAB_RECTANGLE} flex-1 min-w-[140px] group transition-all ${level !== 'Sub-District' ? 'bg-gray-50 opacity-60' : ''}`}
          >
            <label className={TAB_LABEL}>
              <MapPin size={10} className="text-gray-400" /> Sub-Dist
            </label>
            <div className="relative">
              <select
                value={subDistrict}
                onChange={(e) => setSubDistrict(e.target.value)}
                className={`${TAB_SELECT} ${level !== 'Sub-District' ? 'cursor-not-allowed' : ''}`}
                disabled={level !== 'Sub-District'}
              >
                {subDistricts.map((sd) => (
                  <option key={sd} value={sd}>
                    {sd}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          <div
            className={`${TAB_RECTANGLE} flex-[1.5] min-w-[220px] group border-l-4 border-l-green-600 bg-green-50/30`}
          >
            <label className={`${TAB_LABEL} text-green-700`}>
              <Activity size={10} /> Parameter
            </label>
            <div className="relative">
              <select
                value={parameter}
                onChange={(e) => setParameter(e.target.value as LayerKey)}
                className={`${TAB_SELECT} text-green-900`}
              >
                {Object.entries(PARAMETERS)
                  .filter(([key]) => key !== 'todays_image')
                  .map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          <div className={`${TAB_RECTANGLE} flex-1 min-w-[130px] group`}>
            <label className={TAB_LABEL}>
              <Calendar size={10} className="text-gray-400" /> Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${TAB_SELECT} uppercase`}
              />
            </div>
          </div>

          <button
            onClick={handleCustomReport}
            className="ml-auto bg-green-800 hover:bg-green-900 text-white px-6 py-3 rounded-lg shadow-sm hover:shadow-lg transition-all flex items-center gap-2 font-bold uppercase tracking-wider text-xs whitespace-nowrap transform hover:-translate-y-0.5"
          >
            <FileText size={16} /> Custom Report
          </button>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD */}
      <div className="flex-1 p-3 flex flex-col gap-3 overflow-hidden">
        {/* A. Alert Banner */}
        {!loading && stats.extreme.length > stats.total.length * 0.05 && (
          <div className="bg-red-50 border-l-4 border-red-600 p-2 flex items-center gap-2 rounded shadow-sm animate-pulse">
            <AlertTriangle className="text-red-600" size={16} />
            <p className="text-xs font-bold text-red-800">
              CRITICAL ALERT: {stats.extreme.length}{' '}
              {level === 'Sub-District' ? 'farms' : 'regions'} in{' '}
              {level === 'State'
                ? state
                : level === 'District'
                  ? district
                  : subDistrict}{' '}
              are showing extreme {parameter} stress.
            </p>
          </div>
        )}

        {/* B. Charts Section */}
        {/* 3. MAIN DASHBOARD AREA (Updated Layout) */}
        <div className="flex-1 relative w-full h-full overflow-hidden bg-gray-100">
          {/* --- BACKGROUND: MAP PANEL (Full Screen) --- */}
          <div className="absolute inset-0 z-0 w-full h-full">
            {/* Global Styles for Map Labels */}
            <style jsx global>{`
              .map-label {
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                font-size: 10px;
                font-weight: 700;
                color: #374151;
                text-shadow:
                  1px 1px 0 #fff,
                  -1px -1px 0 #fff,
                  1px -1px 0 #fff,
                  -1px 1px 0 #fff;
                text-transform: uppercase;
                pointer-events: none;
              }
            `}</style>

            {selectedCategory ? (
              /* LIST VIEW (Overlay) */
              <div className="absolute inset-0 bg-white z-20 flex flex-col animate-fadeIn">
                {/* Reusing your table logic here, adapted for full screen overlay */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <button
                        onClick={() => {setSelectedCategory(null); 
                          setDetailedData([])}}
                      className="p-1.5 hover:bg-gray-200 rounded-full"
                    >
                      <ArrowLeft size={16} className="text-gray-600" />
                    </button>
                    <h3 className="font-bold text-gray-800 text-xs uppercase">
                      {selectedCategory} Regions{' '}
                      <span className="text-gray-400 mx-1">/</span> {level}
                    </h3>
                  </div>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar pt-0 mt-3">
                  {/* (Table Code Preserved) */}
                  <table className="w-50 text-left text-sm min-w-max">
                    <thead className="bg-gray-100 text-gray-500 text-[10px] uppercase sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2 whitespace-nowrap">Field name</th>
                        <th className="px-4 py-2 whitespace-nowrap">Crop name</th>
                        <th className="px-4 py-2 whitespace-nowrap">State</th>
                        <th className="px-4 py-2 whitespace-nowrap">District</th>
                        <th className="px-4 py-2 text-right whitespace-nowrap">{parameter}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedData
                        .map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="px-4 py-2">{item.name}</td>
                            <td className="px-4 py-2">{item.crop_name}</td>
                            <td className="px-4 py-2">{item.state}</td>
                            <td className="px-4 py-2">{item.district}</td>
                            <td className="px-4 py-2 text-right">
                              {item[`vegetation_indices.${parameter.toLowerCase()}`]}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* MAP RENDER */
              <>
                {mapLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-[50] backdrop-blur-sm">
                    <div className="h-10 w-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-green-800 text-xs animate-pulse mt-3 uppercase">
                      Loading Map...
                    </span>
                  </div>
                )}

                {/* Map Controls (Floating Left) */}
                <div className="absolute top-4 left-4 z-[400] flex flex-col bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden">
                  <button className="p-2 hover:bg-gray-100 border-b border-gray-100 transition-colors">
                    <Plus size={16} className="text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 transition-colors">
                    <Minus size={16} className="text-gray-600" />
                  </button>
                </div>

                <MapContainer
                  center={STATE_CENTROIDS[state] || STATE_CENTROIDS['Default']}
                  zoom={5.5}
                  style={{
                    height: '100%',
                    width: '100%',
                    background: '#f8fafc',
                  }}
                  zoomControl={false}
                  className="z-0"
                >
                  <MapEffect
                    center={
                      STATE_CENTROIDS[state] || STATE_CENTROIDS['Default']
                    }
                    zoom={
                      level === 'Sub-District'
                        ? 9.5
                        : level === 'District'
                          ? 7.5
                          : 5.5
                    }
                  />
                  {geoJsonData && (
                    <GeoJSON
                      key={`${state}-${level}-${district}-${subDistrict}`}
                      data={geoJsonData}
                      style={(feature) => {
                        const p = feature?.properties || {};
                        const featState = p.NAME_1 || p.st_nm;
                        const featDist = p.NAME_2 || p.district;
                        const isStateMatch =
                          featState?.toLowerCase() === state.toLowerCase();

                        if (!isStateMatch)
                          return {
                            fillColor: '#f3f4f6',
                            weight: 1,
                            opacity: 1,
                            color: '#d1d5db',
                            fillOpacity: 0.5,
                          };

                        if (level === 'District' || level === 'Sub-District') {
                          const isDistMatch =
                            featDist?.toLowerCase() === district.toLowerCase();
                          if (!isDistMatch)
                            return {
                              fillColor: '#ecfdf5',
                              weight: 1,
                              opacity: 1,
                              color: '#d1fae5',
                              fillOpacity: 0.3,
                            };
                        }

                        const region = detailedData.find(
                          (d) =>
                            d.name.toLowerCase() ===
                            (featDist || '').toLowerCase(),
                        );
                        let color = '#16a34a';
                        if (region) {
                          if (region.status === 'Extreme') color = '#7f1d1d';
                          else if (region.status === 'Severe')
                            color = '#dc2626';
                          else if (region.status === 'Moderate')
                            color = '#f97316';
                          else if (region.status === 'Mild') color = '#facc15';
                        }
                        return {
                          fillColor: color,
                          weight: 1.5,
                          opacity: 1,
                          color: 'white',
                          fillOpacity: 0.9,
                        };
                      }}
                      onEachFeature={(feature, layer) => {
                        const p = feature.properties;
                        const featState = p.NAME_1 || p.st_nm;
                        const featDist = p.NAME_2 || p.district;
                        let showLabel = false;
                        if (featState?.toLowerCase() === state.toLowerCase()) {
                          if (level === 'State') showLabel = true;
                          else if (
                            featDist?.toLowerCase() === district.toLowerCase()
                          )
                            showLabel = true;
                        }
                        if (showLabel) {
                          const name =
                            p.NAME_3 ||
                            p.tehsil ||
                            p.sub_district ||
                            p.taluk ||
                            p.NAME_2 ||
                            p.district ||
                            p.NAME_1;
                          if (name)
                            layer.bindTooltip(name, {
                              permanent: true,
                              direction: 'center',
                              className: 'map-label',
                            });
                        }
                      }}
                    />
                  )}
                  {level === 'Sub-District' && filteredSubDistrictGeoJson && (
                    <GeoJSON
                      key={`${state}-${district}-sub`}
                      data={filteredSubDistrictGeoJson}
                      style={(feature) => {
                        const p = feature?.properties || {};
                        const name =
                          p.TEHSIL || p.sub_district || p.NAME_3 || '';

                        // Lookup status from detailedData
                        const region = detailedData.find(
                          (d) => d.name.toLowerCase() === name.toLowerCase(),
                        );
                        let color = '#60a5fa'; // Default Blue fallback

                        if (region) {
                          if (region.status === 'Extreme') color = '#7f1d1d';
                          else if (region.status === 'Severe')
                            color = '#dc2626';
                          else if (region.status === 'Moderate')
                            color = '#f97316';
                          else if (region.status === 'Mild') color = '#facc15';
                          else color = '#16a34a'; // Normal
                        }

                        return {
                          fillColor: color,
                          weight: 1.2,
                          color: '#ffffff', // White border for cleanliness
                          fillOpacity: 0.6,
                        };
                      }}
                      onEachFeature={(feature, layer) => {
                        const name =
                          feature.properties?.SUBDISTRICT ||
                          feature.properties?.TEHSIL ||
                          feature.properties?.TALUK ||
                          feature.properties?.NAME_3;

                        if (name) {
                          layer.bindTooltip(name, {
                            permanent: true,
                            direction: 'center',
                            className: 'map-label',
                          });
                        }
                      }}
                    />
                  )}
                </MapContainer>

                <div className="absolute bottom-1 right-1 bg-white/80 px-1.5 py-0.5 text-[8px] text-gray-400 z-[50] pointer-events-none">
                  Leaflet | © OpenStreetMap | KVK Analytics
                </div>
              </>
            )}
          </div>

          {/* --- FOREGROUND: RIGHT PANEL (Floating Overlay) --- */}
          {/* 
                - Absolute positioning to float on right.
                - pointer-events-none on wrapper lets clicks pass through gaps to the map.
                - pointer-events-auto on cards enables interaction with charts/buttons.
            */}
          {/* --- FOREGROUND: RIGHT PANEL (Floating Overlay) --- */}
          <div className="absolute top-4 right-4 bottom-4 w-[550px] z-10 flex flex-col gap-3 pointer-events-none">
            {/* A. Stats Cards Row */}
            <div className="flex gap-1.5 pointer-events-auto h-[60px] shrink-0">
              <StatCard
                label="Extreme"
                val={stats.extreme}
                color="bg-red-900"
              />
              <StatCard label="Severe" val={stats.severe} color="bg-red-600" />
              <StatCard
                label="Moderate"
                val={stats.moderate}
                color="bg-orange-500"
              />
              <StatCard
                label="Mild"
                val={stats.mild}
                color="bg-yellow-400 text-black"
              />
              <StatCard
                label="Normal"
                val={stats.normal}
                color="bg-green-600"
              />

              <div
                onClick={handleTotalClick}
                className="flex flex-col items-center justify-center p-1 rounded-lg border-2 border-green-600 bg-white min-w-[60px] cursor-pointer hover:bg-green-50 transition-colors group shadow-sm"
              >
                <span className="text-xl font-bold text-gray-800 group-hover:text-green-700">
                  {stats.total.length}
                </span>
                <span className="text-[9px] font-bold text-gray-500 uppercase">
                  Total
                </span>
              </div>
            </div>

            {/* B. SIDE-BY-SIDE CHARTS CONTAINER */}
            {/* Flex-grow to take available space, min-height to ensure charts are readable */}
            <div className="flex-[2] min-h-[280px] flex flex-row gap-3 pointer-events-auto">
              {/* 1. DONUT CHART CARD */}
              <div className="w-1/2 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-200 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide truncate pr-2">
                    {LAYER_NAMES[parameter]}
                  </h3>
                </div>

                {/* Content */}
                <div className="flex-1 p-2 flex flex-col min-h-0 relative">
                  <span className="text-[9px] text-gray-500 font-bold uppercase mb-1 block shrink-0">
                    Percentage Distribution
                  </span>

                  {/* Chart Area */}
                  <div className="flex-1 w-full flex items-center gap-2 min-h-0">
                    {/* Chart Canvas: Flex-1 to fill space */}
                    <div className="flex-1 relative h-full min-w-0">
                      <Doughnut
                        ref={donutChartRef}
                        onClick={handleDonutClick}
                        data={{
                          labels: [
                            'Extreme',
                            'Severe',
                            'Moderate',
                            'Mild',
                            'Normal',
                          ],
                          datasets: [
                            {
                              data: chartData.pie,
                              backgroundColor: [
                                '#7f1d1d',
                                '#dc2626',
                                '#f97316',
                                '#facc15',
                                '#16a34a',
                              ],
                              borderWidth: 0,
                              hoverOffset: 4,
                            },
                          ],
                        }}
                        options={{
                          maintainAspectRatio: false,
                          cutout: '0%', // Pie chart style
                          layout: { padding: 5 },
                          plugins: {
                            legend: { display: false },
                            tooltip: { enabled: true },
                          },
                        }}
                      />
                    </div>

                    {/* Legend: Fixed width to prevent squashing */}
                    <div className="w-[80px] shrink-0 flex flex-col justify-center gap-1.5">
                      {[
                        { label: 'Extreme', color: 'bg-[#7f1d1d]' },
                        { label: 'Severe', color: 'bg-[#dc2626]' },
                        { label: 'Moderate', color: 'bg-[#f97316]' },
                        { label: 'Mild', color: 'bg-[#facc15]' },
                        { label: 'Normal', color: 'bg-[#16a34a]' },
                      ].map((item) => (
                        <div
                          key={item.label}
                          onClick={() => {
                            setSelectedCategory(item.label); 
                            setDetailedData(stats[item.label.toLowerCase() as keyof DashboardStats])
                          }}
                          className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 p-0.5 rounded transition-colors"
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-sm ${item.color} shadow-sm shrink-0`}
                          ></div>
                          <span className="text-[8px] font-bold text-gray-600 uppercase tracking-tight truncate">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. HISTOGRAM CARD */}
              <div className="w-1/2 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-200 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide truncate pr-2">
                    {LAYER_NAMES[parameter]}
                  </h3>
                </div>

                {/* Content */}
                <div className="flex-1 p-2 flex flex-col min-h-0">
                  <span className="text-[9px] text-gray-500 font-bold uppercase mb-1 block shrink-0">
                    Histogram
                  </span>

                  {/* Relative container for Chart.js to fit strictly */}
                  <div className="flex-1 w-full min-h-0 relative">
                    <div className="absolute inset-0">
                      <Bar
                        data={{
                          labels: ['Extreme', 'Severe', 'Moderate', 'Mild', 'Normal'],
                          datasets: [
                            {
                              label: 'Count',
                              data: [stats.extreme.length, stats.severe.length, stats.moderate.length, stats.mild.length, stats.normal.length],
                              backgroundColor: ['#7f1d1d', '#dc2626', '#f97316', '#facc15', '#16a34a'],
                              borderRadius: 2,
                              barThickness: 'flex',
                              maxBarThickness: 30,
                            },
                          ],
                        }}
                        options={{
                          maintainAspectRatio: false,
                          responsive: true,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { display: false, beginAtZero: true },
                            x: {
                              grid: { display: false },
                              ticks: {
                                font: { size: 7 },
                                maxRotation: 45,
                                minRotation: 45,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* C. INFO SUMMARY */}
            <div className="flex-[0.8] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-200 flex flex-col overflow-hidden pointer-events-auto min-h-[120px]">
              <div className="flex justify-between items-center px-3 py-2 border-b border-gray-200 bg-gray-50/80">
                <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide truncate">
                  Cumulative Deviation (%)
                </h3>
              </div>
              <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col justify-between">
                <p className="text-xs text-gray-600 leading-relaxed text-justify font-medium">
                  {getParameterSummary(
                    parameter,
                    level === 'State' ? state : district,
                  )}
                </p>
                <div className="mt-2 pt-2 border-t border-gray-100 text-[9px] text-gray-400">
                  Source: IMD gridded rainfall data at 0.25 degree spatial
                  resolution.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
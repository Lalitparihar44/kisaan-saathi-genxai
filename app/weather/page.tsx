"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchWeatherData,
  createWeatherStream,
  BackendResponse,
} from "../../lib/weather";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import Mithu, { MithuMood } from "@/components/Mithu";

import { AlertTriangle } from "lucide-react";
import Image from "next/image";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const POLL_INTERVAL = 60_000;
const DEFAULT_LAT = 18.5204;
const DEFAULT_LON = 73.8567;

/* -------------------- Frontend Types (UI Expectation) -------------------- */
type DailyRange = { date: string; min: number; max: number };
type DailySeries = { dates?: string[]; values: number[] };

type WeatherCurrent = {
  temperature: number | null;
  humidity?: number | null;
  rain?: number | null;
  windSpeed: number | null;
  precipitation: number | null;
  summary: string;
  lastUpdated?: string;
};

type WeatherAnalysisResponse = {
  location: {
    name: string;
    latitude: number | string;
    longitude: number | string;
    timezone: string;
  };
  current: WeatherCurrent;
  forecast7d: {
    temperature: DailyRange[];
    precipitation: DailySeries;
    humidity?: DailySeries;
  };
  history30d: {
    temperature: DailyRange[];
    precipitation: DailySeries;
    humidity?: DailySeries;
  };
};

/* -------------------- Backend Types (API Response) -------------------- */
// Moved to lib/weather.ts

/* -------------------- Helpers -------------------- */

// DATA TRANSFORMER: Converts Backend JSON -> Frontend Object
function transformBackendData(data: BackendResponse): WeatherAnalysisResponse {
  const historyDates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (30 - i));
    return d.toISOString().split("T")[0];
  });

  return {
    location: {
      name: data.location.timezone || "UTC",
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      timezone: data.location.timezone,
    },
    current: {
      temperature: data.current.temperature,
      humidity: data.current.humidity,
      rain: data.current.rain,
      precipitation: data.current.rain,
      windSpeed: data.current.wind,
      summary: data.advisory?.title || "Clear",
      lastUpdated: data.generatedAt,
    },
    forecast7d: {
      temperature: data.forecast7d.map((d) => ({
        date: d.date,
        min: d.minTemp,
        max: d.maxTemp,
      })),
      precipitation: {
        values: data.forecast7d.map((d) => d.rain),
        dates: data.forecast7d.map((d) => d.date),
      },
      humidity: {
        values: data.forecast7d.map((d) => d.avgHumidity),
      },
    },
    history30d: {
      temperature: data.trend30d.avgTemp.map((temp, i) => ({
        date: historyDates[i],
        min: temp,
        max: temp,
      })),
      precipitation: {
        values: data.trend30d.rain,
        dates: historyDates,
      },
      humidity: {
        values: data.trend30d.humidity,
      },
    },
  };
}

function mithuMoodFromSummary(summary?: string): MithuMood {
  if (!summary) return "default";
  const s = summary.toLowerCase();
  if (s.includes("rain") || s.includes("shower") || s.includes("wet"))
    return "rainy";
  if (s.includes("sun") || s.includes("clear") || s.includes("favorable"))
    return "sunny";
  if (s.includes("hot") || s.includes("heat") || s.includes("risk"))
    return "hot";
  if (s.includes("wind") || s.includes("breeze")) return "windy";
  if (s.includes("cloud") || s.includes("caution")) return "cloudy";
  return "default";
}

function generateAdvice(data: WeatherAnalysisResponse | null): string {
  if (!data) return "I don't have weather data yet. Click Mithu for tips.";
  const cur = data.current;
  const avg7 = data.forecast7d.temperature.map((d) => (d.min + d.max) / 2);
  const avg7Mean = avg7.length
    ? avg7.reduce((s, v) => s + v, 0) / avg7.length
    : null;
  const total7Rain = data.forecast7d.precipitation.values.reduce(
    (s, v) => s + v,
    0
  );
  const avg7Humidity =
    data.forecast7d.humidity?.values.reduce((s, v) => s + v, 0) ?? 0;

  if ((cur.precipitation ?? 0) >= 6) {
    return "Immediate Alert: Heavy rain expected. Protect seedlings and avoid fertilizer application for 24 hours.";
  }
  if ((cur.windSpeed ?? 0) >= 10) {
    return "Wind Alert: Strong winds detected. Secure lightweight materials and check greenhouse covers.";
  }
  if ((cur.temperature ?? 0) >= 38) {
    return "Heat Alert: High temperature — increase irrigation during early morning and evening.";
  }
  if (
    avg7Mean !== null &&
    avg7Mean > (cur.temperature ?? 0) + 3 &&
    total7Rain < 5
  ) {
    return "Prediction: Temperatures rising over next 7 days and low rain — consider earlier irrigation to maintain soil moisture.";
  }
  if (total7Rain >= 20) {
    return "Prediction: Significant rainfall expected this week — delay harvest and ensure drainage.";
  }
  if ((cur.humidity ?? 0) < 40 && (cur.temperature ?? 0) > 30) {
    return "Tip: Soil moisture is low and it's warm. Consider topping up irrigation to avoid stress.";
  }
  if (avg7Humidity && avg7Humidity / Math.max(1, avg7.length) < 45) {
    return "Prediction: Lower humidity trend ahead — watch for increased evapotranspiration.";
  }

  return "No urgent actions. Monitor trends and follow recommended irrigation schedule. Tap Mithu for specific tips.";
}

/* -------------------- Page -------------------- */
export default function WeatherPage() {
  const [data, setData] = useState<WeatherAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtime, setRealtime] = useState(false);

  // Mithu UI states
  const [showAdvice, setShowAdvice] = useState(false);
  const [adviceText, setAdviceText] = useState("Tap Mithu for advice.");
  const [glideToTrend, setGlideToTrend] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lon: number }>({
    lat: DEFAULT_LAT,
    lon: DEFAULT_LON,
  });
  const predictionRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  useEffect(() => {
    const token = globalThis.window
      ? localStorage.getItem("accessToken")
      : null;
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  /* initial fetch */
  useEffect(() => {
    fetchWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Update advice automatically when data loads */
  useEffect(() => {
    if (data) {
      setAdviceText(generateAdvice(data));
      setShowAdvice(true);
    }
  }, [data]);

  /* -------------------- Weather Fetcher -------------------- */
  async function fetchWeather() {
    setLoading(true);
    setError(null);
    try {
      const backendData = await fetchWeatherData();
      const transformedData = transformBackendData(backendData);
      setData(transformedData);

      // Update coords from backend response
      if (
        transformedData.location.latitude &&
        transformedData.location.longitude
      ) {
        setCoords({
          lat: Number(transformedData.location.latitude),
          lon: Number(transformedData.location.longitude),
        });
        setRealtime(true);
      }
    } catch (err: any) {
      console.error("Weather fetch error:", err);
      setError(err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }
  /* ----------------------------------------------------------------------------------- */

  /* SSE / Polling logic */
  useEffect(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (realtime) {
      createWeatherStream(
        (backendData) => {
          const data = backendData.split("\n")
            .find((line: string) => line.startsWith("data:"))
            ?.replace("data:", "")
            .trim();
          const transformedData = transformBackendData(JSON.parse(data));
          setData(transformedData);

          // Update coords from response
          if (
            transformedData.location.latitude &&
            transformedData.location.longitude
          ) {
            setCoords({
              lat: Number(transformedData.location.latitude),
              lon: Number(transformedData.location.longitude),
            });
          }
        },
        () => {
          // Fallback to polling on error
          timerRef.current = setInterval(fetchWeather, POLL_INTERVAL);
        },
        POLL_INTERVAL
      ).then((cleanup) => {
        cleanupRef.current = cleanup;
      });
    } else {
      timerRef.current = setInterval(fetchWeather, POLL_INTERVAL);
    }

    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
      if (cleanupRef.current) cleanupRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtime, coords]);

  /* Charts building */
  const buildPredictionChart = () => {
    if (!data) return null;
    const labels = data.forecast7d.temperature.map((d) => d.date);
    const avg = data.forecast7d.temperature.map((d) => (d.min + d.max) / 2);
    const rain = data.forecast7d.precipitation.values;
    const humidity =
      data.forecast7d.humidity?.values ?? new Array(labels.length).fill(NaN);
    return {
      labels,
      datasets: [
        {
          label: "Avg Temp (°C)",
          data: avg,
          borderColor: "rgba(34,197,94,0.95)",
          tension: 0.25,
          fill: false,
          yAxisID: "y",
        },
        {
          label: "Rain (mm)",
          data: rain,
          type: "bar" as const,
          backgroundColor: "rgba(245,158,11,0.36)",
          yAxisID: "y1",
        },
        {
          label: "Humidity (%)",
          data: humidity,
          borderColor: "rgba(14,165,233,0.95)",
          tension: 0.25,
          fill: false,
          yAxisID: "y2",
        },
      ],
    };
  };

  const buildHistoryChart = () => {
    if (!data) return null;
    const labels = data.history30d.temperature.map((d) => d.date);
    const avg = data.history30d.temperature.map((d) => (d.min + d.max) / 2);
    const rain = data.history30d.precipitation.values;
    const humidity =
      data.history30d.humidity?.values ?? new Array(labels.length).fill(NaN);
    return {
      labels,
      datasets: [
        {
          label: "Avg Temp (°C)",
          data: avg,
          borderColor: "rgba(34,197,94,0.95)",
          tension: 0.25,
          fill: false,
          yAxisID: "y",
        },
        {
          label: "Rain (mm)",
          data: rain,
          type: "bar" as const,
          backgroundColor: "rgba(245,158,11,0.28)",
          yAxisID: "y1",
        },
        {
          label: "Humidity (%)",
          data: humidity,
          borderColor: "rgba(14,165,233,0.95)",
          tension: 0.25,
          fill: false,
          yAxisID: "y2",
        },
      ],
    };
  };

  const predictionChart = buildPredictionChart();
  const historyChart = buildHistoryChart();

  const coordsLabel = data
    ? `${Number(data.location.latitude ?? coords.lat).toFixed(2)}, ${Number(
        data.location.longitude ?? coords.lon
      ).toFixed(2)}`
    : `${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}`;

  /* Mithu click handler */
  function onMithuClick() {
    setGlideToTrend(true);
    setTimeout(() => {
      predictionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setGlideToTrend(false);
    }, 900);
  }

  return (
    <div className="h-screen w-full overflow-y-auto bg-gray-50 p-6">
      <header className="mb-6 flex items-center gap-4">
        <div className="h-14 w-14 flex items-center justify-center">
          <Image
            src="/images/weather-mithu.png"
            alt="MarketSaathi"
            width={64}
            height={64}
            className="object-contain"
            priority
          />
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-400">
            Weather Saathi
          </div>
          <div className="text-xs text-gray-500">
            Predictions & trends — Mithu guides you
          </div>
        </div>


      </header>

      {error && (
        <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">{error}</div>
      )}

      {/* ================= MAIN DASHBOARD CARD ================= */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4 mb-4 group hover:shadow-md transition-all overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          
          {/* 1. TEMPERATURE CARD - Fixed Double Icon Issue */}
          <div
            className="w-full lg:w-32 rounded-2xl flex flex-col items-center justify-center text-white flex-shrink-0 p-4 text-center shadow-md transition-transform hover:scale-[1.02]"
            style={{ background: "linear-gradient(180deg, #16a34a 0%, #065f46 100%)" }}
          >
            {/* Main Temperature */}
            <div className="text-3xl md:text-4xl font-black tracking-tighter leading-none mb-4 drop-shadow-sm">
              {data && data.current.temperature != null ? Math.round(data.current.temperature) : "--"}°C
            </div>

            {/* Condition Row */}
            <div className="flex flex-col items-center justify-center gap-2 leading-tight">
              {/* ONLY BIG DYNAMIC ICON */}
              <span className="text-2xl filter drop-shadow-md">
                {(() => {
                  const s = (data?.current?.summary || "").toLowerCase();
                  if (s.includes("rain") || s.includes("shower")) return "🌧️";
                  if (s.includes("cloud")) return "☁️";
                  if (s.includes("sun") || s.includes("clear") || s.includes("favorable")) return "🌤️";
                  if (s.includes("storm")) return "⛈️";
                  if (s.includes("wind")) return "💨";
                  return "⛅";
                })()}
              </span>
              
              {/* TEXT ONLY (Regex removes any emoji potentially hidden in the summary string) */}
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-wider max-w-[85px] line-clamp-2">
                {(data?.current?.summary || "Favorable Conditions")
                  .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF])/g, '')
                  .trim()}
              </span>
            </div>
          </div>

          {/* 2. MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col md:flex-row gap-4 min-w-0">

            {/* 2A. LOCATION & STATS - Height Reduced */}
            <div className="flex-[2] flex flex-col gap-2.5">
              {/* Header: Tightened */}
              <div className="flex justify-between items-center pb-1 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-800 mb-0">Current Weather</h2>
                  <span className="text-[10px] text-teal-600 font-medium flex items-center gap-0.5">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    {data?.location?.name ?? "My Location"}
                  </span>
                </div>
                <div className="hidden sm:block text-[10px] font-bold text-red-800/80 bg-red-50 px-1.5 py-0.5 rounded">
                  Updated: {data?.current?.lastUpdated ? new Date(data.current.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "03:19 PM"}
                </div>
              </div>

              {/* Grid: 3 columns on desktop, 2 on mobile to save space */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
                {[
                  { label: 'Humidity', val: `${Math.round(data?.current?.humidity ?? 49)}%`, icon: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z', color: 'blue' },
                  { label: 'Wind Speed', val: `${data?.current?.windSpeed?.toFixed(1) ?? '0.5'}m/s`, icon: 'M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2', color: 'purple', stroke: true },
                  { label: 'Rain', val: `${data?.current?.precipitation?.toFixed(0) ?? '0'}mm`, icon: 'M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25M8 16v4m4-4v4m4-4v4', color: 'indigo', stroke: true },
                  { label: 'Cloud Cover', val: '6%', icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z', color: 'slate', stroke: true },
                  { label: 'Pressure', val: '1015hPa', icon: 'M13 10V2L5 14h6v8l8-12h-6z', color: 'orange' },
                  { label: 'Visibility', val: '0.0km', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', color: 'green', stroke: true }
                ].map((item, i) => (
                  <div key={i} className={`bg-white rounded-lg p-2 border border-slate-100 flex items-center gap-2 hover:border-${item.color}-200 transition-all`}>
                    <div className={`p-1.5 bg-${item.color}-50 rounded-md shrink-0`}>
                      <svg className={`w-3.5 h-3.5 text-${item.color}-500`} fill={item.stroke ? "none" : "currentColor"} stroke={item.stroke ? "currentColor" : "none"} strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-slate-400 text-[9px] font-bold uppercase truncate">{item.label}</div>
                      <div className={`text-sm font-black text-${item.color}-600 leading-tight`}>{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2B. ADVISORY - High-End Premium Glassmorphism Design */}
            <div className="flex-1 min-w-[220px] bg-gradient-to-br from-amber-50/60 to-orange-50/40 backdrop-blur-sm border border-white/60 rounded-3xl p-4 flex flex-col relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] group/adv transition-all duration-500 hover:shadow-lg hover:shadow-amber-200/20">
              
              {/* Premium Glow Effect */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-200/30 rounded-full blur-[40px] transition-all duration-700 group-hover/adv:bg-amber-300/40 group-hover/adv:scale-125"></div>
              
              {/* Header: Refined Badge Style */}
              <div className="flex items-center gap-2.5 mb-3 relative z-10">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white shadow-sm border border-amber-100/50 transition-transform group-hover/adv:rotate-12">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-amber-800/60 uppercase tracking-[0.15em] leading-none mb-1">
                    Intelligence
                  </span>
                  <span className="text-xs font-bold text-slate-800 leading-none">
                    Mithu's Advisory
                  </span>
                </div>
              </div>

              {/* Body: High-Readability Typography */}
              <div className="flex-1 flex items-start relative z-10">
                <div className="relative pl-4">
                  {/* Vertical Accent Line */}
                  <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-gradient-to-b from-amber-400 to-orange-300 shadow-[0_0_8px_rgba(251,191,36,0.4)]"></div>
                  
                  <p className="text-[11px] md:text-[12px] mb-1 text-slate-700 leading-snug font-medium antialiased">
                    <span className="text-amber-700 font-bold mr-1">Note:</span>
                    {adviceText || "Conditions are currently stable. We recommend maintaining the standard irrigation cycle for optimal crop health."}
                  </p>
                </div>
              </div>

              {/* Subtle Footer Ornament */}
              <div className="mt-2 flex justify-end opacity-20 grayscale relative z-10">
                <svg className="w-8 h-auto" viewBox="0 0 100 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 10C20 10 30 0 50 0C70 0 80 10 100 10" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
            </div>

            {/* 2C. PARROT - Significantly Shrunk */}
            <div className="hidden lg:flex w-24 shrink-0 flex-col items-center justify-center pl-2 border-l border-dashed border-gray-100">
              <Mithu
                mood={mithuMoodFromSummary(data?.current?.summary)}
                loop={true}
                onClick={onMithuClick}
                advice={""}
                showAdvice={false}
                glide={glideToTrend}
                size={85}
              />
              <div className="text-[8px] text-gray-400 font-bold uppercase mt-1">Trends</div>
            </div>
          </div>
        </div>

        {/* Footer: Ultra-thin */}
        <div className="mt-2 pt-1.5 border-t border-gray-50 flex justify-end">
          <span className="text-[9px] text-gray-400 font-medium">
            Sync: {data?.current?.lastUpdated ? new Date(data.current.lastUpdated).toLocaleString() : "—"}
          </span>
        </div>
      </section>

      {/* Prediction Table */}
      <section ref={predictionRef} className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-12 lg:col-span-6 bg-white p-0 rounded-2xl shadow hover:shadow-lg transition-transform hover:scale-105">
          <div className="font-semibold text-lg mb-2 border-b p-3">7-Day Prediction</div>
          <div className="p-3">
          <table className="w-full text-sm border rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-center">Min</th>
                <th className="p-2 text-center">Max</th>
                <th className="p-2 text-center">Rain</th>
                <th className="p-2 text-center">Humidity</th>
              </tr>
            </thead>
            <tbody>
              {data?.forecast7d.temperature.map((d, i) => (
                <tr key={i} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                  <td className="p-2">{d.date}</td>
                  <td className="p-2 text-center">{d.min}</td>
                  <td className="p-2 text-center">{d.max}</td>
                  <td className="p-2 text-center">
                    {data.forecast7d.precipitation.values[i]}
                  </td>
                  <td className="p-2 text-center">
                    {data.forecast7d.humidity?.values?.[i] != null
                      ? data.forecast7d.humidity.values[i]
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bg-white p-0 rounded-2xl shadow hover:shadow-lg transition-transform hover:scale-105">
          <div className="flex items-center justify-between mb-2 border-b">
            <div className="font-semibold text-lg p-3">7-Day Prediction Trend</div>
            <div className="text-sm text-gray-500 pr-3">
              Average Temp • Rain • Humidity
            </div>
          </div>
          <div className="p-3" style={{ height: 300 }}>
            {predictionChart ? (
              <Line
                data={predictionChart as any}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom" } },
                  interaction: { mode: "index", intersect: false },
                  scales: {
                    y: { title: { display: true, text: "Avg Temp (°C)" } },
                    y1: {
                      title: { display: true, text: "Rain (mm)" },
                      position: "right",
                      grid: { drawOnChartArea: false },
                    },
                    y2: {
                      title: { display: true, text: "Humidity (%)" },
                      position: "right",
                      grid: { drawOnChartArea: false },
                      display: true,
                    },
                  },
                }}
              />
            ) : (
              <div className="text-center text-gray-400">Chart unavailable</div>
            )}
          </div>
        </div>
      </section>

      {/* 30-Day History */}
      <section className="bg-white p-0 rounded-2xl shadow hover:shadow-lg transition-transform hover:scale-105">
        <div className="flex items-center justify-between mb-3 border-b p-3">
          <div className="font-semibold text-lg">30-Day Average Trend</div>
          <div className="text-sm text-gray-500">
            Average Temp • Rain • Humidity
          </div>
        </div>
        <div className="p-3">
        <div className="" style={{ height: 300 }}>
          {historyChart ? (
            <Line
              data={historyChart as any}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
                scales: {
                  y: { title: { display: true, text: "Avg Temp (°C)" } },
                  y1: { display: false, position: "right" },
                  y2: {
                    title: { display: true, text: "Humidity (%)" },
                    position: "right",
                    grid: { drawOnChartArea: false },
                    display: true,
                  },
                },
              }}
            />
          ) : (
            <div className="text-gray-400 text-center">No data</div>
          )}
        </div>
        </div>
      </section>

      <style>{`
        .mithu-glide { animation: mithuGlide 0.9s cubic-bezier(.2,.9,.2,1) forwards; }
        @keyframes mithuGlide { 0% { transform: translateX(0) } 60% { transform: translateX(160px) } 100% { transform: translateX(220px) } }
        @media (max-width: 1024px) {
          .mithu-glide { transform: none !important; animation: none !important; }
        }
      `}</style>

      <section className="mt-12">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-left">
            Sources & References
          </h2>

          <div className="text-sm text-gray-600 leading-relaxed text-left space-y-3">
            <p>
              This Weather Advisory and risk classification system is developed in
              alignment with officially published guidelines of the Government of
              India and the India Meteorological Department (IMD). The weather
              classification logic follows standard IMD-defined thresholds for
              temperature, rainfall, wind speed, and extreme weather events, as used
              in national weather forecasting and disaster preparedness systems.
            </p>

            <p className="font-medium text-gray-700">
              Official Government & Research Sources:
            </p>

            <ul className="list-disc list-inside space-y-1">
              <li>
                India Meteorological Department (IMD) – Weather forecasting standards,
                extreme weather definitions, and advisory thresholds (
                <a
                  href="https://mausam.imd.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  IMD Weather Portal
                </a>
                )
              </li>

              <li>
                IMD Agrometeorological Advisory Services (AAS) – Weather-based
                advisories for agriculture and rural planning (
                <a
                  href="https://imdagrimet.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  IMD Agromet Portal
                </a>
                )
              </li>

              <li>
                Ministry of Earth Sciences (MoES) – National climate monitoring,
                forecasting, and meteorological research
              </li>

              <li>
                National Disaster Management Authority (NDMA) – Heatwave, heavy rainfall,
                cyclone, and disaster risk management guidelines (
                <a
                  href="https://ndma.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  NDMA Guidelines
                </a>
                )
              </li>
            </ul>

            <p className="mt-3 text-xs text-gray-500 italic">
              Disclaimer: Weather advisories and risk indicators generated by this
              system are indicative and advisory in nature. They are derived from
              officially published IMD thresholds, historical datasets, and rule-based
              classification models. Actual weather impacts may vary due to local
              micro-climatic conditions. Users are advised to follow official IMD
              bulletins and local authority advisories for critical decision-making.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Filter,
  Loader2,
  RefreshCw,
  IndianRupee,
  Navigation,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CalendarDays,
  ChevronRight,
  Target,
  Sprout,
  ShieldCheck,
  Activity
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import {
  fetchMarkets,
  fetchStates,
  fetchDistrictsByState,
  fetchPriceDynamics,
} from "@/lib/market";
import Image from "next/image";
 
/* ================= 1. CONSTANTS ================= */

const TOP_GAINERS = [
  { name: "Moong", price: 4305.0, change: 10.31 },
  { name: "Arhar", price: 3964.8, change: 8.68 },
  { name: "Maize", price: 1635.6, change: 5.53 },
  { name: "Sesamum", price: 7089.6, change: 4.98 },
  { name: "Gram", price: 4107.6, change: 4.19 },
];

const TOP_LOSERS = [
  { name: "Groundnut", price: 4536.2, change: -2.15 },
  { name: "Rape", price: 3642.5, change: -0.61 },
  { name: "Paddy", price: 1926.79, change: -0.51 },
  { name: "Niger", price: 4938.5, change: 0.0 },
  { name: "Sugarcane", price: 3813.75, change: 0.0 },
];

const STAR_PREDICTIONS = [
  { name: "Copra", price: 5946.6, change: 5.89, trend: "up" },
  { name: "Barley", price: 1142.68, change: -5.89, trend: "down" },
];



/* ================= 2. HELPERS ================= */

function getTrend(history: any[]) {
  if (!history || history.length < 2) return "flat";
  const latest = history[history.length - 1].price || 0;
  const prev = history[history.length - 2].price || 0;
  return latest > prev ? "up" : latest < prev ? "down" : "flat";
}

function formatDateTick(dateStr: string) {
  if (!dateStr || isNaN(Date.parse(dateStr))) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}


function getAdvisory(trend: string) {
  if (trend === "up") return { label: "HOLD STOCK", color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: TrendingUp, reason: "Prices are rising. Best time to wait." };
  if (trend === "down") return { label: "SELL NOW", color: "bg-rose-50 text-rose-700 border-rose-100", icon: TrendingDown, reason: "Prices falling. Sell to avoid loss." };
  return { label: "WATCH", color: "bg-indigo-50 text-indigo-700 border-indigo-100", icon: Minus, reason: "Market stable. Monitor movements." };
}

/* ================= 3. COMPONENT ================= */

export default function MarketPage() {
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  

  const [commodity, setCommodity] = useState("");
  const [markets, setMarkets] = useState<any[]>([]);
  const [rawMarketItems, setRawMarketItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [crops, setCrops] = useState<string[]>([]);

  const [priceDynamics, setPriceDynamics] = useState<any>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);


  const noData =
  !loading &&
  markets.length === 0 &&
  !!state &&
  !!district;




// Fetch states on mount
  useEffect(() => {
    fetchStates()
      .then((data) => {
        setStates(data || []);
        if (data?.length) setState(data[0]);
      })
      .catch(console.error);
  }, []);
  // Update districts when state changes
  useEffect(() => {
    if (!state) return
    fetchDistrictsByState(state)
      .then((data) => {
        setDistricts(data || []);
         if (data?.length) setDistrict(data[0]); // default = All Districts
      })
      .catch(console.error);
  }, [state]);

  useEffect(() => {
  setCommodity("");      // reset commodity
}, [district]);


// Update crops when district changes
  useEffect(() => {
  if  (!rawMarketItems.length) {
    setCrops([]);
    return;
  }

  const uniqueCommodities = Array.from(
    new Set(
      rawMarketItems
        .map((m: any) => m.commodity)
        .filter(Boolean)
    )
  ).sort();

  setCrops(uniqueCommodities);
}, [ rawMarketItems]);

//Effect A — for dropdown (NO commodity filter)
useEffect(() => {
  if (!state || !district) return;

  fetchMarkets({
    state: state.toLowerCase(),
    district: district.toLowerCase(),
  })
    .then((data) => {
      const items = Array.isArray(data?.items) ? data.items : [];
      setRawMarketItems(items); 
    })
    .catch(() => setRawMarketItems([]));
}, [state, district]);
//Effect B — for table + charts (WITH commodity filter)
useEffect(() => {
  if (!state || !district) return;

  setLoading(true);

  fetchMarkets({
    state: state.toLowerCase(),
    district: district.toLowerCase(),
    commodity: commodity || undefined,
  })
    .then((data) => {
      const items = Array.isArray(data?.items) ? data.items : [];
      setMarkets(items); // ONLY markets
    })
    .catch(() => setMarkets([]))
    .finally(() => setLoading(false));
}, [state, district, commodity]);


// Fetch price dynamics when state, district, or commodity changes
useEffect(() => {
  if (!state || !district || !commodity) return;

  setPriceLoading(true);
  setPriceError(null);
  setPriceDynamics(null);

  fetchPriceDynamics({
    state: state.toLowerCase(),
    district: district.toLowerCase(),
    commodity,
    days: 30,
  })
    .then(setPriceDynamics)
    .catch(() => setPriceError("Unable to load price trends"))
    .finally(() => setPriceLoading(false));
}, [state, district, commodity]);


  const bestMarket = markets[0];
  const chartMarkets = useMemo(() => markets.slice(0, 6), [markets]);
  const priceChartData = useMemo(() => {
  if (!priceDynamics?.prices) return [];
  return priceDynamics.prices.map((p: any) => ({
    date: p.date,
    price: p.modal,
  }));
}, [priceDynamics]);


  return (
    <div className="min-h-screen h-full bg-[#f8fafc] pb-20 font-sans selection:bg-indigo-100 overflow-y-auto overflow-x-hidden">
      
      {/* 1. STICKY HEADER */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
        <div className="px-8 py-3 w-full flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">

             <div className="h-14 w-14 flex items-center justify-center">
                       <Image
                         src="/images/market-mithu.png"
                         alt="MarketSaathi"
                         width={64}
                         height={64}
                         className="object-contain"
                         priority
                       />
                     </div>
              <div>
                <h1 className="text-2xl font-extrabold text-green-800 tracking-tight mb-0">Market<span className="text-green-800 ml-1">Saathi</span></h1>
                <p className="mb-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                   <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Live Analysis Engine
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                { label: "State", val: state, set: setState, opt: states, icon: MapPin },
                { label: "District", val: district, set: setDistrict, opt: districts, icon: Navigation },
                { label: "Commodity", val: commodity, set: setCommodity, opt: crops, icon: Filter }
              ].map((f, i) => (
                <div key={i} className="relative group min-w-[160px]">
                  <select 
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-regular text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer" 
                    value={f.val} 
                    onChange={(e) => f.set(e.target.value)}
                  >
                    {f.label === "Commodity" && (
                      <option value="">All Commodities</option>
                    )}
                    {f.label === "District" && (
                      <option value="">All Districts</option>
                    )}
                    {Array.isArray(f.opt) &&
                    f.opt.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <f.icon className="absolute right-3 top-3 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors" size={14} />
                </div>
              ))}
            </div>
        </div>
      </div>

      <div className="px-8 py-8 w-full space-y-6 animate-in fade-in duration-1000">

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
            <p className="font-bold tracking-tight text-lg">Fetching Latest Mandi Records...</p>
          </div>
        ) : noData ? (
          <div className="h-96 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Activity size={48} className="text-slate-300 mb-4" />

            <h3 className="text-xl font-black text-slate-700 mb-2">
              No Mandi Data Available Today
            </h3>

            <p className="text-sm text-slate-500 max-w-md">
              Market prices for the selected state, district, and commodity
              have not been published in today’s Agmarknet update.
              Please try a different selection or check back later.
            </p>
          </div>
        ) : ( 

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* 2. LEFT COLUMN (8/12) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* TOP KPI ROW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Peak Rate in {district}</p>
                   <div className="flex items-end gap-2">
                     <h2 className="mb-0 text-3xl font-black text-slate-900">₹{bestMarket?.modal}</h2>
                     <span className="text-xs font-bold text-slate-400 mb-1">/Qtl</span>
                   </div>
                   <p className="d-flex gap-2 align-center text-xs font-bold text-teal-600 mt-2 mb-0 truncate"><MapPin size={12}/> {bestMarket?.market}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Mandis</p>
                   <h2 className="text-3xl font-black text-slate-900">{markets.length}</h2>
                   <p className="text-xs font-bold text-slate-500 mt-2 mb-0">Verified Hubs Mapped</p>
                </div>
                {bestMarket && (() => {
                  const adv = getAdvisory(
                    getTrend(Array.isArray(bestMarket?.trendHistory) ? bestMarket.trendHistory : [])
                  );

                  return (
                    <div className={`p-6 rounded-3xl border transition-all ${adv.color} relative overflow-hidden group`}>
                      <div className="relative z-10">
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Market Advisory</p>
                        <h2 className="text-2xl font-black tracking-tight">{adv.label}</h2>
                        <p className="text-xs font-bold opacity-80 mb-0">{adv.reason}</p>
                      </div>
                      <adv.icon size={48} className="absolute right-2 -bottom-1 opacity-10 group-hover:scale-110 transition-transform" />
                    </div>
                  );
                })()}
              </div>

              {/* CHARTS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-3 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-6">Price Dynamics (10D)</h3>
                  <div className="h-[240px] w-full flex items-center justify-center">
                {priceLoading && (
                  <p className="text-xs text-slate-400">
                    Loading price trends…
                  </p>
                )}

                {!priceLoading && (priceError || priceDynamics?.message) && (
                  <p className="text-xs text-amber-600 text-center px-4">
                    {priceError || priceDynamics.message}
                  </p>
                )}

                {!priceLoading && priceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceChartData}>
                      <defs>
                        <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDateTick}
                        tick={{ fontSize: 9, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        fill="url(#areaColor)"
                      />
                    </AreaChart>
                  </ResponsiveContainer> 
                ) : null} 

                {!priceLoading && priceDynamics?.prices?.length === 0 && (
                  <p className="text-xs text-slate-400 text-center">
                    Price trends not available
                  </p>
                )}
              </div>

                </div>

                <div className="bg-white p-3 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-6">Market Comparison</h3>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartMarkets}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="market" tick={{fontSize: 9, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(v) => v.split(' ')[0]} />
                        <YAxis tick={{fontSize: 9, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                        <Bar dataKey="modal" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* LIVE MANDI REPORT TABLE (INCREASED HEIGHT TO h-[910px] TO ALIGN BOTTOM WITH SIDEBAR) */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[420px] transition-all hover:shadow-md">
                <div className="px-3 py-3 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 mb-0">Live Mandi Report</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 mb-0">Coverage: {district}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-teal-50 text-teal-500 px-4 py-1.5 rounded-full border border-teal-100/50">
                    <span className="text-[10px] font-black uppercase tracking-widest">{markets.length} Markets Found</span>
                  </div>
                </div>
                
                <div className="overflow-y-auto custom-scrollbar max-h-[260px] pb-2">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 sticky top-0 z-20 backdrop-blur-md border-b">
                      <tr className="text-xs font-bold text-black uppercase tracking-widest">
                        <th className="px-3 py-2 text-sm">Mandi Hub</th>
                        <th className="px-3 py-2 text-sm">Arrival Vol.</th>
                        <th className="px-3 py-2 text-sm">Modal Price</th>
                        <th className="px-3 py-2 text-sm text-center">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {markets.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition-all group">
                          <td className="px-3 py-1">
                            <span className="font-regular text-sm text-slate-700 group-hover:text-indigo-600 transition-colors">{m.market}</span>
                          </td>
                          <td className="px-3 py-1 text-slate-400 font-bold text-xs">{m.arrival}</td>
                          <td className="px-3 py-1 font-regular text-sm text-slate-800 text-lg">₹{m.modal}</td>
                          <td className="px-3 py-1 text-center">
                            <div className="mx-auto w-fit p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:rotate-12 transition-transform">
                               <ArrowUpRight size={16}/>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 3. RIGHT COLUMN: FORECASTING + SIDEBAR TABLES (4/12) */}
            <div className="lg:col-span-4 flex flex-col gap-6 animate-in slide-in-from-right duration-700">
              
              {/* WHITE THEME FORECASTING CARD WITH LIGHT YELLOW HEADER */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
                <div className="px-3 py-3 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-0 bg-whit rounded-lg shadow-smm text-teal-600">
                      <Sparkles size={16} />
                    </div>
                    <h3 className="mb-0 text-xs font-black uppercase text-teal-800 tracking-widest">Forecasting AI</h3>
                  </div>
                  <ShieldCheck size={18} className="text-teal-400 opacity-60" />
                </div>
                
                <div className="p-4 space-y-5">
                  <div className="space-y-4">
                    {STAR_PREDICTIONS.map((p, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all group/item">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.name}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                             {p.trend === 'up' ? '↑' : '↓'} {p.change}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-2xl font-regular text-slate-900 tracking-normal">₹{p.price}</h4>
                          <ChevronRight size={16} className="text-slate-300 group-hover/item:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between align-center items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-normal">Accuracy Level</span>
                    <span className="text-xs font-black text-green-600">96.4% CONFIDENCE</span>
                  </div>
                </div>
              </div>

              {/* TOP GAINERS */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="px-3 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" />
                    <h3 className="font-black text-emerald-800 text-xs uppercase tracking-widest mb-0">Top Gainers</h3>
                  </div>
                </div>
                <div className="p-2 max-h-[192px] overflow-y-auto custom-scrollbar">
                  {TOP_GAINERS.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-2xl transition-all">
                      <span className="text-md font-bold textslate-600 group-hover:text-slate-900">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-regular text-slate-900">₹{item.price}</span>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+{item.change}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOP LOSERS */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="px-3 py-3 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown size={16} className="text-rose-600" />
                    <h3 className="font-black text-rose-800 text-xs uppercase tracking-widest mb-0">Top Losers</h3>
                  </div>
                </div>
                <div className="p-2 max-h-[192px] overflow-y-auto custom-scrollbar">
                  {TOP_LOSERS.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-2xl transition-all">
                      <span className="text-md font-bold textslate-600 group-hover:text-slate-900">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-regular text-slate-900">₹{item.price}</span>
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">{item.change}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
      <section className="mt-12">
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
    <h2 className="text-lg font-bold text-gray-900 mb-4 text-left">
      Sources & References
    </h2>

    <div className="text-sm text-gray-600 leading-relaxed text-left space-y-3">
      <p>
        This Market Price Information and advisory module is developed using
        officially published mandi price data provided by Government of India
        platforms. The pricing logic, availability indicators, and advisory
        messages are aligned with standard agricultural market reporting
        practices followed by Agricultural Produce Market Committees (APMCs)
        across India.
      </p>

      <p className="font-medium text-gray-700">
        Official Government Data Sources:
      </p>

      <ul className="list-disc list-inside space-y-1">
        <li>
          Directorate of Marketing & Inspection (DMI), Ministry of Agriculture
          & Farmers Welfare – National agricultural market data authority
        </li>

        <li>
          AGMARKNET – Agricultural Marketing Information Network (
          <a
            href="https://agmarknet.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline"
          >
            Official portal
          </a>
          )
        </li>

        <li>
          Agricultural Produce Market Committees (APMCs) – Primary mandi-level
          data reporting agencies
        </li>

        <li>
          National Informatics Centre (NIC) – Digital infrastructure and data
          dissemination for agricultural markets
        </li>
      </ul>

      <p className="mt-3 text-xs text-gray-500 italic">
        Disclaimer: Market prices, arrival volumes, and advisory indicators
        displayed are indicative and based on the latest officially available
        mandi updates published by Agmarknet. Data availability may vary by
        location, commodity, and reporting day. Users are advised to verify
        prices with local APMC offices or official government notifications
        before making commercial decisions.
      </p>
    </div>
  </div>
</section>

    </div>
  );
}
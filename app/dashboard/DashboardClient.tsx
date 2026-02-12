"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { apiCallWithRefresh, handleLogout } from "../../lib/auth";
import FarmScoreCard from "./components/FarmScoreCard";
import ActionCenter from "./components/ActionCenter";
import { useDiseaseId } from "../../lib/hooks/dashboard";
import { fetchSoilData } from "@/lib/soil";

export default function DashboardClient() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<string>("");
  const [soilMoisture7d, setSoilMoisture7d] = useState<number[]>([]);
  const [avgSoilMoisture, setAvgSoilMoisture] = useState<number | null>(null);
  const [severity, setSeverity] = useState<string>("");

  useEffect(() => {
    // Initialize effect if needed
    fetchSoil();
  }, []);

  /* -------------------- Weather Fetcher -------------------- */
  
  async function fetchSoil() {
    const backendData = await fetchSoilData();
    setSoilMoisture7d(
      backendData?.prediction?.forecast7d.map((x: any) => x?.moisture ?? 0) ??
        []
    );
    setAvgSoilMoisture(
      Math.round(
        backendData?.prediction?.forecast7d.find((x: any) => x?.day == "Today")
          ?.moisture ?? 0
      )
    );
    setSeverity(backendData?.prediction?.moistInsight.severity ?? "");
  }
  useEffect(() => {
    const token = globalThis.window
      ? localStorage.getItem("accessToken")
      : null;
    if (token) {
      setAuthChecked(true);
      // safely read userName from localStorage on the client
      const u = localStorage.getItem("userName") || "";
      setUser(u);
    } else {
      router.push("/login");
    }
  }, [router]);
  // `user` is now read into state in the effect above to avoid accessing
  // localStorage during server-side render.
  const { handleIdentifyDisease } = useDiseaseId();

  if (!authChecked) return null;

  const handleLogoutClick = async () => {
    setShowMenu(false);
    await handleLogout(router);
  };

  return (
    <div className="bg-gray-50 font-sans antialiased min-h-screen container-fluid mx-auto">
      <div id="app" className="flex flex-col h-screen">
        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {/* Header (Mobile/Desktop) - Used for User and Notifications */}
          <header className="flex flex-col header-responsive justify-between items-center mb-8 pb-4 border-b border-gray-200 gap-4 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
    
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-0 flex items-center gap-2">
                Welcome, {user}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Mock Language Toggle */}
              <select className="p-2 rounded-lg bg-white text-gray-600 shadow-lg border border-gray-200 text-sm hidden sm:block">
                <option>English</option>
                <option>Hindi</option>
                <option>Marathi</option>
              </select>
              <button className="p-3 rounded-full bg-white text-gray-600 shadow-lg hover:bg-gray-100 transition duration-150 hidden sm:block">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-3 rounded-full bg-white text-gray-600 shadow-lg hover:bg-gray-100 transition duration-150"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </button>
                {showMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-white shadow-lg rounded-lg border z-10">
                    <button
                      onClick={() => setShowMenu(false)}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </button>
                    <button
                      onClick={handleLogoutClick}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
              {/* <img
                className="box shake-after-10s"
                width="70"
                src="/images/kissan_sathi_logo.png"
                alt="Kissan Sathi"
              /> */}
            </div>
          </header>

          <FarmScoreCard severity={severity} avgSoilMoisture={avgSoilMoisture} soilMoisture7d={soilMoisture7d} selectedDate="selectedDate" />
          <ActionCenter onDiseaseClick={handleIdentifyDisease} severity={severity} avgSoilMoisture={avgSoilMoisture} soilMoisture7d={soilMoisture7d}/>
          {/* <SensorMetrics /> */}
          {/* <CropOverview /> */}
        </main>
      </div>
      <style jsx>{`
        @media (min-width: 512px) {
          .header-responsive {
            flex-direction: row !important;
            gap: 0 !important;
          }
          .header-responsive > div:first-child {
            flex-direction: row !important;
            gap: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}

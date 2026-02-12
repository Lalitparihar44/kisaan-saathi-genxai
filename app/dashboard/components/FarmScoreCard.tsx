"use client";

import { useState, useEffect } from "react";
import FarmMap from "@/components/ui/farm-map";
import Sparkline from "./Sparkline";
import { fetchFarmScore } from "@/lib/api";
import { SelectedField } from "@/lib/types";

export default function FarmScoreCard( {severity, avgSoilMoisture, soilMoisture7d, selectedDate}: {severity: string, avgSoilMoisture: number | null, soilMoisture7d: number[]; selectedDate: string | null} ) {
  const [farmScore, setFarmScore] = useState<number>(0.0);
  const [selectedField, setSelectedField] = useState<SelectedField | null>(null);

  const fetchFarmScoreData = async () => {
  if (!selectedDate) return;

  try {
    const data = await fetchFarmScore(
      undefined,   // state
      undefined,   // district
      undefined,   // parameters
      selectedDate // from (DATE)
    );
    console.log("Farm score date:", selectedDate);


    if (data?.farm_score !== undefined) {
      setFarmScore(Number(data.farm_score.toFixed(1)));
    }  else {
      setFarmScore(0);
    }
  } catch (error) {
    console.error("Failed to fetch farm score:", error);
  }

};

  useEffect(() => {
    fetchFarmScoreData();
  }, [selectedField]);
  
  return (
    <section className="mb-5 flex-1">
      {/* Main grid with scorecard and map below */}
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-6 pb-3 h-full">
        <div className="lg:col-span-1 md:col-span-2 sm:col-span-2 rounded-2xl shadow p-2">
          <h2 className="text-xl font-bold text-gray-800 p-3 border-bottom">
            Farm Balance Scorecard
          </h2>
          <div className="farm-score-card h-64 rounded-2xl shadow-2xl mx-3 my-2 px-2 py-3 flex flex-col items-start md:items-center justify-around text-white relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://placehold.co/800x200/FFFFFF/059669/png?text=AI+Pattern')",
                opacity: 0.1,
                transform: "rotate(10deg) scale(1.5)",
              }}
            ></div>
            <div className="flex flex-col items-center space-x-6 relative z-10 md:mb-2">
              <div className="w-28 h-28 flex items-center justify-center border-4 border-white/50 rounded-full bg-transparent shadow-2xl flex-shrink-0 mb-2">
                <span className="text-3xl font-extrabold">{farmScore}</span>
              </div>
              <div>
                <p className="text-2xl font-bold">Farm Score</p>
                <p className="mt-1 text-sm font-medium opacity-90">
                  Recommendations: Monitor soil moisture in this Field.
                </p>
              </div>
            </div>
            <div className="relative z-10 w-full h-full justify-center items-center flex flex-col p-2 bg-white/20 mt-3 rounded-lg">
              <p className="text-sm font-semibold mb-1">
                Score Trend (Last 7 Days)
              </p>
              <Sparkline data={soilMoisture7d} color="rgba(255, 255, 255, 0.5)"/>
              <span className="text-xs font-medium mt-1 inline-block text-white/90">
                Stable (+0.3 WoW)
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 p-3">
            <div className="col-span-3 bg-teal/20 p-2 place-items-center rounded-lg farm-score-card  h-100">
              <p className="text-sm text-white font-semibold mb-2">Soil</p>
              <div className="w-20 h-20 flex items-center justify-center border-4 bg-white/20 border-white/50 rounded-full bg-transparent shadow-2xl flex-shrink-0">
                <span className="text-3xl text-white font-extrabold">{avgSoilMoisture}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-5 md:col-span-4 sm:col-span-4 shadow rounded-2xl overflow-hidden h-full min-h-[400px]">
          <FarmMap 
            title="My Farm" 
            onFieldSelect={(field) => setSelectedField(field)}
          />
        </div>
      </div>
    </section>
  );
}

"use client";

import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SoilNutrientsPie() {
  const data = {
    labels: [
      "Nitrogen (N)",
      "Phosphorus (P)",
      "Potassium (K)",
      "Organic Carbon (OC)",
      "pH",
      "EC",
      "Sulfur (S)",
      "Iron (Fe)",
      "Zinc (Zn)",
      "Copper (Cu)",
      "Boron (B)",
      "Manganese (Mn)",
    ],
    datasets: [
      {
        label: "Soil Nutrient Composition",
        data: [40, 25, 30, 18, 7, 4, 10, 6, 3, 2, 1, 5], // sample values
        backgroundColor: [
          "#4CAF50",
          "#FF9800",
          "#2196F3",
          "#795548",
          "#9C27B0",
          "#00BCD4",
          "#CDDC39",
          "#F44336",
          "#3F51B5",
          "#FF5722",
          "#8BC34A",
          "#607D8B",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.label}: ${context.raw}`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold mb-4">
        Soil Nutrient Distribution
      </h2>
      <Pie data={data} options={options} />
    </div>
  );
}

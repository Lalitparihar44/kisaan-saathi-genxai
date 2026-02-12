'use client';

import { useMemo, useState } from 'react';

type Props = {
  dates: readonly string[];
  selectedDate: string;
  onSelect: (date: string) => void;
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function TimelineCalendar({
  dates,
  selectedDate,
  onSelect,
}: Props) {
  const enabledDates = useMemo(() => new Set(dates), [dates]);

  const minYear = 2022;
  const maxYear = new Date().getFullYear();

  const [year, setYear] = useState(new Date(selectedDate).getFullYear());
  const [month, setMonth] = useState(new Date(selectedDate).getMonth());

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from(
    { length: daysInMonth },
    (_, i) => new Date(year, month, i + 1).toISOString().split('T')[0],
  );

  const prevMonth = () => {
    if (month === 0) {
      if (year > minYear) {
        setYear(year - 1);
        setMonth(11);
      }
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      if (year < maxYear) {
        setYear(year + 1);
        setMonth(0);
      }
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <div className="calendar-popup">
      {/* HEADER */}
      <div className="calendar-header">
        <button onClick={prevMonth} className="nav-btn">
          ‹
        </button>
        <span className="month-label">
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} className="nav-btn">
          ›
        </button>
      </div>

      {/* DAYS */}
      <div className="calendar-grid">
        {days.map((date) => {
          const enabled = enabledDates.has(date);
          const selected = date === selectedDate;

          return (
            <button
              key={date}
              disabled={!enabled}
              onClick={() => enabled && onSelect(date)}
              className={`day
                ${enabled ? 'enabled' : 'disabled'}
                ${selected ? 'selected' : ''}
              `}
            >
              {new Date(date).getDate()}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .calendar-popup {
          background: linear-gradient(145deg, #0f172a, #1e293b);
          border-radius: 14px;
          padding: 16px;
          width: 260px;
          height: 310px; /* fixed height */
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          transition: all 0.3s ease;
        }

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          color: #f0f9ff;
          font-family: 'Inter', sans-serif;
        }

        .month-label {
          font-size: 14px;
          font-weight: 700;
        }

        .nav-btn {
          background: none;
          border: none;
          outline: none;
          box-shadow: none;
          color: #38bdf8;
          font-size: 20px;
          cursor: pointer;
          transition: color 0.2s;
        }

        .nav-btn:focus,
        .nav-btn:focus-visible,
        .nav-btn:active {
          outline: none;
          box-shadow: none;
        }

        .nav-btn:hover {
          color: #0ea5e9;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-auto-rows: 36px; /* fixed cell height */
          gap: 6px;
          flex: 1; /* keeps the grid stretching in fixed height container */
        }

        .day {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 13px;

          border: none;
          outline: none;
          box-shadow: none;

          background-clip: padding-box;
          transition: all 0.2s ease;
        }

        .day:focus,
        .day:focus-visible,
        .day:active {
          outline: none;
          box-shadow: none;
        }

        .day.enabled {
          background: #38bdf8;
          color: #0f172a;
          font-weight: 600;
          cursor: pointer;
        }

        .day.enabled:hover {
          background: #22d3ee;
        }

        .day.disabled {
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.05);
          cursor: not-allowed;
        }

        .day.selected {
          background: #0ea5e9;
          color: #f0f9ff;
          font-weight: 700;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}

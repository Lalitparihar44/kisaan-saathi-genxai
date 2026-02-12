'use client';

import { useState } from 'react';
import Calendar from './TimelineCalendar';
import { formatDate } from '@/lib/utils';

interface TimelineProps {
  dates: readonly string[] | string[]; // timeline (recent)
  calendarDates: readonly string[] | string[]; // 👈 ADD THIS
  selectedDate: string;
  onDateSelect: (date: string) => void;
  nextImageDate?: string | null;
  isLoading?: boolean;
}

export default function Timeline({
  dates,
  calendarDates, // 👈 ADD
  selectedDate,
  onDateSelect,
  nextImageDate,
  isLoading = false,
}: TimelineProps) {
  const currentIndex = dates.indexOf(selectedDate);
  const [showCalendar, setShowCalendar] = useState(false);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onDateSelect(dates[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < dates.length - 1) {
      onDateSelect(dates[currentIndex + 1]);
    }
  };

  // Format next image date for display
  const nextImageFormatted = nextImageDate ? formatDate(nextImageDate) : null;

  return (
    <div className="timeline-container">
      {/* CALENDAR ICON */}
      {/* CALENDAR ICON */}
      <div style={{ position: 'relative' }}>
        <button
          className="timeline-nav"
          title="Select date"
          onClick={() => setShowCalendar((v) => !v)}
          disabled={isLoading}
        >
          📅
        </button>

        {showCalendar && (
          <div
            style={{
              position: 'absolute',
              bottom: '42px',
              left: 0,
              background: '#fff',
              borderRadius: 6,
              padding: 6,
              boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
              zIndex: 50,
            }}
          >
            <Calendar
              dates={calendarDates}
              selectedDate={selectedDate}
              onSelect={(date) => {
                onDateSelect(date);
                setShowCalendar(false);
              }}
            />
          </div>
        )}
      </div>

      {/* LEFT ARROW */}
      <button
        className="timeline-nav"
        onClick={handlePrevious}
        disabled={currentIndex === 0 || isLoading}
      >
        ←
      </button>

      <div className="timeline-scroll">
        {isLoading ? (
          <div className="loading-dates">Loading available imagery...</div>
        ) : (
          dates.map((date) => (
            <button
              key={date}
              className={`timeline-date ${
                date === selectedDate ? 'active' : ''
              }`}
              onClick={() => onDateSelect(date)}
            >
              <span className="date-label">{formatDate(date)}</span>
              <span className="date-indicator">S2</span>
            </button>
          ))
        )}
      </div>

      <button
        className="timeline-nav"
        onClick={handleNext}
        disabled={currentIndex === dates.length - 1 || isLoading}
      >
        →
      </button>

      <div className="timeline-info">
        Next image
        <br />
        <span className="next-date">
          {nextImageFormatted || formatDate(selectedDate)}
        </span>
      </div>

      <style jsx>{`
        .timeline-container {
          display: flex;
          align-items: center;
          background: rgba(10, 22, 40, 0.95);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 8px 16px;
          gap: 8px;
          height: 10%;
          width: 100%;
          box-sizing: border-box;
        }

        .timeline-nav {
          background: #1e293b;
          color: #fff;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.2s;
        }

        .timeline-nav:hover:not(:disabled) {
          background: #334155;
        }

        .timeline-nav:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .timeline-scroll {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          flex: 1;
          padding: 4px 0;
        }

        .timeline-scroll::-webkit-scrollbar {
          height: 4px;
        }

        .timeline-scroll::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 2px;
        }

        .timeline-date {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: transparent;
          border: none;
          color: #9ca3af;
          padding: 4px 12px;
          cursor: pointer;
          border-radius: 4px;
          min-width: 70px;
          transition: background 0.2s;
        }

        .timeline-date:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .timeline-date.active {
          background: #0ea5e9;
          color: #fff;
        }

        .date-label {
          font-size: 11px;
          white-space: nowrap;
        }

        .date-indicator {
          font-size: 9px;
          color: #0ea5e9;
          margin-top: 2px;
        }

        .timeline-date.active .date-indicator {
          color: rgba(255, 255, 255, 0.8);
        }

        .timeline-info {
          color: #9ca3af;
          font-size: 11px;
          text-align: right;
          min-width: 80px;
        }

        .next-date {
          color: #fff;
          font-weight: 500;
        }

        .loading-dates {
          color: #9ca3af;
          font-size: 12px;
          padding: 8px 16px;
        }
      `}</style>
    </div>
  );
}

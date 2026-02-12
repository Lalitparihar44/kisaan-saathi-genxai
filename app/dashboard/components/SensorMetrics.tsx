export default function SensorMetrics() {
  return (
    <section className="mb-10 shadow rounded-2xl pb-2">
      <h2 className="text-xl font-bold text-gray-800 mb-0 p-3 border-bottom">Real-time Sensor Readings & Indices</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-6 px-3 py-3">
        <div className="bg-white rounded-2xl shadow border p-4 border-b-5 border-primary hover:shadow-2xl transition duration-300">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Soil Moisture</h3>
          <div className="flex items-center justify-between">
            <div id="soil-moisture-progress" className="radial-progress">
              <div className="radial-progress-inner">68%</div>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-gray-900">68%</p>
              <p className="text-xs text-sky-blue mt-1 font-medium">Target: 65%</p>
            </div>
          </div>
          <div className="mt-4 border-t pt-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Last 7 Day Trend</p>
            <svg viewBox="0 0 100 30" className="w-full h-8">
              <polyline fill="none" stroke="#3B82F6" strokeWidth="1.5" points="0,20 16,10 32,25 48,15 64,18 80,5 100,10" />
              <circle cx="100" cy="10" r="1.5" fill="#3B82F6" />
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow border p-4 border-bottom-5 border-warning hover:shadow-2xl transition duration-300">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Temperature</h3>
          <div className="flex items-center justify-between">
            <div className="text-5xl text-warning">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 4v.17c0 1.05-.18 2.05-.52 3L11.83 11H8.17L6.52 7.17c-.34-.95-.52-1.95-.52-3V4h8z"/>
                <path d="M12 2v20"/>
                <path d="M17 5H7"/>
              </svg>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-gray-900">25.3°C</p>
              <p className="text-xs text-red-500 mt-1 font-medium">Slightly High</p>
            </div>
          </div>
          <div className="mt-4 border-t pt-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Last 7 Day Trend</p>
            <svg viewBox="0 0 100 30" className="w-full h-8">
              <polyline fill="none" stroke="#F97316" strokeWidth="1.5" points="0,15 16,10 32,5 48,12 64,8 80,18 100,15" />
              <circle cx="100" cy="15" r="1.5" fill="#F97316" />
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xll border p-4 border-bottom-5 border-success hover:shadow-2xl transition duration-300">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Crop Health Index</h3>
          <div className="flex items-center justify-between">
            <div id="crop-health-progress" className="radial-progress">
              <div className="radial-progress-inner">92%</div>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-gray-900">92%</p>
              <p className="text-xs text-success mt-1 font-medium">Excellent Vigor</p>
            </div>
          </div>
          <div className="mt-4 border-t pt-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Index Score (NDVI)</p>
            <p className="text-sm font-semibold text-gray-800">0.78 / 1.00</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xll border p-4 border-bottom-5 border-danger hover:shadow-2xl transition duration-300">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Critical Tasks</h3>
          <div className="flex items-center justify-between">
            <div className="text-5xl text-danger">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-gray-900">3</p>
              <p className="text-xs text-danger mt-1 font-medium">High Priority</p>
            </div>
          </div>
          <div className="mt-4 border-t pt-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Next Scouting Due</p>
            <p className="text-sm font-semibold text-gray-800">Tomorrow, 10 AM</p>
          </div>
        </div>
      </div>
    </section>
  );
}
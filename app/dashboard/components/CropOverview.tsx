export default function CropOverview() {
  return (
    <section className="mb-20 shadow rounded-2xl">
      <h2 className="text-xl font-bold text-gray-800 mb-0 p-3 border-bottom">Application Data: Crop Overview</h2>
      <div className="bg-white rounded-2xl shadow-xl py-4 px-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-xl">Crop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plant Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-xl">Yield Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-green-50/50 transition duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Corn</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Field 1 & 2</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Tasseling</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Apr 15, 2025</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">180 Bu/Acre</td>
              </tr>
              <tr className="hover:bg-green-50/50 transition duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Soybeans</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Field 3</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-green/20 text-secondary-green">Vegetative V4</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">May 1, 2025</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">65 Bu/Acre</td>
              </tr>
              <tr className="hover:bg-green-50/50 transition duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Wheat</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Field 4</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Harvest Ready</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Oct 1, 2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">45 Bu/Acre</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-center">
          <button className="text-primary-green hover:text-secondary-green text-base font-semibold p-2 rounded-lg transition duration-150">Manage All Crops →</button>
        </div>
      </div>
    </section>
  );
}
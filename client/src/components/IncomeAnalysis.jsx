import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaMoneyBillWave, 
  FaChartLine, 
  FaCalendarAlt,
  FaFilter,
  FaDownload
} from 'react-icons/fa';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

Chart.register(...registerables);

const IncomeAnalysis = () => {
  const navigate = useNavigate();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    paymentStatus: '',
    source: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchIncomes();
  }, [filter]);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filter.startDate) query.append('fromDate', filter.startDate.toISOString());
      if (filter.endDate) query.append('toDate', filter.endDate.toISOString());
      if (filter.paymentStatus) query.append('paymentStatus', filter.paymentStatus);
      if (filter.source) query.append('source', filter.source);

      const apiUrl = 'https://finlytix-server.onrender.com';
      const res = await fetch(`${apiUrl}/api/income?${query.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch incomes');

      setIncomes(data.data || []);
    } catch (err) {
      console.error('Error fetching incomes:', err);
      toast.error(err.message || 'Failed to load income data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date, field) => {
    setFilter(prev => ({ ...prev, [field]: date }));
  };

  const resetFilters = () => {
    setFilter({
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      endDate: new Date(),
      paymentStatus: '',
      source: ''
    });
  };

  // Prepare data for charts
  const prepareChartData = () => {
    // Group by source
    const sourceData = incomes.reduce((acc, income) => {
      acc[income.source] = (acc[income.source] || 0) + income.amount;
      return acc;
    }, {});

    // Group by date
    const dateData = incomes.reduce((acc, income) => {
      const date = new Date(income.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + income.amount;
      return acc;
    }, {});

    // Group by payment status
    const statusData = incomes.reduce((acc, income) => {
      acc[income.paymentStatus] = (acc[income.paymentStatus] || 0) + income.amount;
      return acc;
    }, {});

    return {
      source: {
        labels: Object.keys(sourceData),
        datasets: [{
          label: 'Income by Source',
          data: Object.values(sourceData),
          backgroundColor: [
            '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
          ],
          borderWidth: 1
        }]
      },
      timeline: {
        labels: Object.keys(dateData).sort(),
        datasets: [{
          label: 'Income Timeline',
          data: Object.keys(dateData).sort().map(date => dateData[date]),
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.1,
          fill: true
        }]
      },
      status: {
        labels: Object.keys(statusData),
        datasets: [{
          label: 'Income by Status',
          data: Object.values(statusData),
          backgroundColor: [
            '#10B981', // Received
            '#F59E0B', // Partial
            '#EF4444'  // Pending
          ],
          borderWidth: 1
        }]
      }
    };
  };

  const chartData = prepareChartData();
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaMoneyBillWave className="mr-2 text-indigo-600" />
              Income Analysis
            </h1>
            <p className="text-gray-600">
              {incomes.length} transactions totaling ${totalIncome.toFixed(2)}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FaFilter className="mr-2" />
              Filters
            </button>
            <button
              onClick={() => toast.info('Export feature coming soon!')}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FaDownload className="mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <DatePicker
                  selected={filter.startDate}
                  onChange={(date) => handleDateChange(date, 'startDate')}
                  selectsStart
                  startDate={filter.startDate}
                  endDate={filter.endDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <DatePicker
                  selected={filter.endDate}
                  onChange={(date) => handleDateChange(date, 'endDate')}
                  selectsEnd
                  startDate={filter.startDate}
                  endDate={filter.endDate}
                  minDate={filter.startDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select
                  name="paymentStatus"
                  value={filter.paymentStatus}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Statuses</option>
                  <option value="received">Received</option>
                  <option value="partial">Partial</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <input
                  type="text"
                  name="source"
                  value={filter.source}
                  onChange={handleFilterChange}
                  placeholder="Filter by source"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : incomes.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-500">No income records found for the selected filters.</p>
            <button
              onClick={() => navigate('/add-income')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add New Income
            </button>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-900">Total Income</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  ${totalIncome.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-900">Average per Transaction</h3>
                <p className="text-2xl font-bold text-green-600">
                  ${(totalIncome / incomes.length).toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-900">Transactions</h3>
                <p className="text-2xl font-bold text-blue-600">{incomes.length}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FaChartLine className="mr-2 text-indigo-600" />
                  Income by Source
                </h3>
                <div className="h-64">
                  <Pie 
                    data={chartData.source}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right'
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FaChartLine className="mr-2 text-indigo-600" />
                  Income Timeline
                </h3>
                <div className="h-64">
                  <Line 
                    data={chartData.timeline}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FaChartLine className="mr-2 text-indigo-600" />
                Income by Payment Status
              </h3>
              <div className="h-64">
                <Bar 
                  data={chartData.status}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {incomes.slice(0, 5).map((income) => (
                      <tr key={income._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(income.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {income.source}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${income.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            income.paymentStatus === 'received' ? 'bg-green-100 text-green-800' :
                            income.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {income.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {income.paymentMethod}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-200 text-right">
                <button
                  onClick={() => navigate('/incomes')}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  View All Transactions →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default IncomeAnalysis;
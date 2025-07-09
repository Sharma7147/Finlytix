import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaMoneyBillWave, 
  FaFilter, 
  FaSearch,
  FaEdit,
  FaPlus,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const IncomeTransactions = () => {
  const navigate = useNavigate();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    paymentStatus: '',
    source: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });

  useEffect(() => {
    fetchIncomes();
  }, [filter, sortConfig]);

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

      // Sort data
      const sortedData = [...(data.data || [])].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });

      setIncomes(sortedData);
    } catch (err) {
      console.error('Error fetching incomes:', err);
      toast.error(err.message || 'Failed to load income data');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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
    setSearchTerm('');
  };

  const filteredIncomes = incomes.filter(income => 
    income.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    income.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status, amount, receivedAmount) => {
    const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
    
    if (status === 'received') {
      return <span className={`${baseClasses} bg-green-100 text-green-800`}>Paid</span>;
    }
    if (status === 'partial') {
      const percentage = ((receivedAmount / amount) * 100).toFixed(0);
      return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>{percentage}% Paid</span>;
    }
    return <span className={`${baseClasses} bg-red-100 text-red-800`}>Pending</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaMoneyBillWave className="mr-2 text-indigo-600" />
              Income Transactions
            </h1>
            <p className="text-gray-600">
              {filteredIncomes.length} transactions found
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Link
              to="/add-income"
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <FaPlus className="mr-2" />
              Add Income
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by source or notes..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {showFilters ? <FaChevronUp className="mr-2" /> : <FaChevronDown className="mr-2" />}
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
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
                    <option value="received">Paid</option>
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
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredIncomes.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-500">No income records found for the selected filters.</p>
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center">
                        Date
                        {sortConfig.key === 'date' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('source')}
                    >
                      <div className="flex items-center">
                        Source
                        {sortConfig.key === 'source' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center">
                        Amount
                        {sortConfig.key === 'amount' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Method
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIncomes.map((income) => (
                    <tr key={income._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(income.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{income.source}</div>
                        {income.notes && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{income.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${income.amount.toFixed(2)}
                        {income.paymentStatus === 'partial' && (
                          <div className="text-xs text-gray-500">
                            Received: ${income.receivedAmount?.toFixed(2) || '0.00'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(income.paymentStatus, income.amount, income.receivedAmount)}
                        {income.dueDate && income.paymentStatus !== 'received' && (
                          <div className="text-xs text-gray-500 mt-1">
                            Due: {new Date(income.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {income.paymentMethod?.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {income.paymentStatus !== 'received' && (
                          <button
                            onClick={() => navigate(`/update-payment/${income._id}`)}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center"
                          >
                            <FaEdit className="mr-1" />
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeTransactions;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FaSearch, FaFileDownload, FaFilter } from 'react-icons/fa';
import { Menu, Transition } from '@headlessui/react';

const statusColor = {
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-red-100 text-red-700',
  partially_paid: 'bg-yellow-100 text-yellow-700',
};

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partially_paid', label: 'Partially Paid' },
];

const AllExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('date');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllExpenses();
  }, []);

  const fetchAllExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5000/api/expenses/all';
      
      // Add query parameters if filters are set
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setExpenses(data.expenses);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses
    .filter(expense => {
      const matchesSearch = (
        expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        expense.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      
      const matchesStatus = statusFilter === 'all' || expense.paymentStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'amount':
          return b.total - a.total;
        case 'vendor':
          return a.vendor.localeCompare(b.vendor);
        case 'date':
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

  const handleView = (id) => navigate(`/expenses/${id}`);
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/expenses/export', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleDateFilterApply = () => {
    fetchAllExpenses();
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setDateRange({ start: '', end: '' });
    setSearchTerm('');
    fetchAllExpenses();
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">All Expense Bills</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <FaFileDownload /> Export
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2 relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendor, item or reference..."
            className="pl-10 py-2 border rounded w-full focus:outline-none focus:ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
          <option value="vendor">Sort by Vendor</option>
        </select>

        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-2 w-full border rounded px-3 py-2 bg-white">
            <FaFilter /> Filters
          </Menu.Button>
          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-72 origin-top-right bg-white rounded shadow-lg z-10 p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    className="border rounded px-3 py-2"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    className="border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleDateFilterApply}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  Apply
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1 bg-gray-200 rounded text-sm"
                >
                  Reset
                </button>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No expenses found. {searchTerm || statusFilter !== 'all' || dateRange.start || dateRange.end ? 
            'Try adjusting your filters.' : 'Add your first expense to get started.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExpenses.map(expense => (
            <div
              key={expense._id}
              className="p-4 bg-white shadow rounded border hover:bg-gray-50 transition cursor-pointer"
              onClick={() => handleView(expense._id)}
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 capitalize">{expense.vendor}</h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(expense.date), 'PPP')} • {expense.items.length} item(s)
                    {expense.referenceNumber && ` • Ref: ${expense.referenceNumber}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-xl font-bold text-gray-700">
                    ₹{(expense.total ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <div>
                  <p>Paid: ₹{(expense.paidAmount ?? 0).toFixed(2)}</p>
                  <p>Due: ₹{((expense.total ?? 0) - (expense.paidAmount ?? 0)).toFixed(2)}</p>
                </div>
                <div>
                  <span
                    className={`px-2 py-1 text-xs rounded capitalize ${statusColor[expense.paymentStatus]}`}
                  >
                    {expense.paymentStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllExpenses;
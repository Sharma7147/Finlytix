import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ExpenseTable = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [displayCount, setDisplayCount] = useState(10); // Initial display count
  const [allExpensesLoaded, setAllExpensesLoaded] = useState(false);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/expenses/analytics/table', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setExpenses(res.data.expenses);
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const filterExpenses = () => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const matchesMonth = selectedMonth ? expenseDate.getMonth() + 1 === parseInt(selectedMonth) : true;
      const matchesYear = selectedYear ? expenseDate.getFullYear() === parseInt(selectedYear) : true;
      const matchesSearch = searchQuery
        ? [expense.vendor, expense.itemName, expense.category, expense.source]
            .some(field => field?.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      const matchesSpecificDate = selectedDate
        ? expense.date === selectedDate
        : true;

      return matchesMonth && matchesYear && matchesSearch && matchesSpecificDate;
    });
  };

  const handleLoadMore = () => {
    const filtered = filterExpenses();
    if (displayCount + 10 >= filtered.length) {
      setDisplayCount(filtered.length);
      setAllExpensesLoaded(true);
    } else {
      setDisplayCount(prevCount => prevCount + 10);
    }
  };

  const handleDownloadExcel = () => {
    const filtered = filterExpenses();
    const dataToExport = filtered.map(expense => ({
      Vendor: expense.vendor,
      Item: expense.itemName,
      Category: expense.category,
      Date: expense.date,
      Quantity: expense.quantity,
      'Unit Price': `$${expense.unitPrice.toFixed(2)}`,
      Amount: `$${expense.amount.toFixed(2)}`,
      Source: expense.source,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `expenses_${selectedMonth || 'all'}_${selectedYear || 'all'}.xlsx`);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedMonth('');
    setSelectedYear('');
    setDisplayCount(10); // Reset display count when filters change
    setAllExpensesLoaded(false);
  };

  const handleFilterChange = () => {
    setDisplayCount(10); // Reset display count when filters change
    setAllExpensesLoaded(false);
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const filteredExpenses = filterExpenses();
  const displayedExpenses = filteredExpenses.slice(0, displayCount);

  return (
    <div className="p-4 overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">Expense Table</h2>

      <div className="mb-4 flex gap-4 flex-wrap">
        {/* Search input */}
        <input
          type="text"
          placeholder="Search by vendor, item, category, source..."
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            handleFilterChange();
          }}
          className="border p-2 rounded w-64"
        />

        {/* Specific Date filter */}
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="border p-2 rounded"
        />

        {/* Month filter */}
        <select
          value={selectedMonth}
          onChange={e => {
            setSelectedMonth(e.target.value);
            setSelectedDate('');
            handleFilterChange();
          }}
          className="border p-2 rounded"
        >
          <option value="">All Months</option>
          {[
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
          ].map((month, index) => (
            <option key={index + 1} value={index + 1}>
              {month}
            </option>
          ))}
        </select>

        {/* Year filter */}
        <select
          value={selectedYear}
          onChange={e => {
            setSelectedYear(e.target.value);
            setSelectedDate('');
            handleFilterChange();
          }}
          className="border p-2 rounded"
        >
          <option value="">All Years</option>
          {yearOptions.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        {/* Download Button */}
        <button
          onClick={handleDownloadExcel}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Download as Excel
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No expenses found for selected criteria.</p>
      ) : (
        <>
          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">Vendor</th>
                <th className="border px-4 py-2">Item</th>
                <th className="border px-4 py-2">Category</th>
                <th className="border px-4 py-2">Quantity</th>
                <th className="border px-4 py-2">Unit Price</th>
                <th className="border px-4 py-2">Amount</th>
                <th className="border px-4 py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {displayedExpenses.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                  <td className="border px-4 py-2">{item.date}</td>
                  <td className="border px-4 py-2">{item.vendor}</td>
                  <td className="border px-4 py-2">{item.itemName}</td>
                  <td className="border px-4 py-2">{item.category}</td>
                  <td className="border px-4 py-2">{item.quantity}</td>
                  <td className="border px-4 py-2">${item.unitPrice.toFixed(2)}</td>
                  <td className="border px-4 py-2">${item.amount.toFixed(2)}</td>
                  <td className="border px-4 py-2">{item.source}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!allExpensesLoaded && displayedExpenses.length < filteredExpenses.length && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleLoadMore}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              >
                Load More
                {/* Load More ({filteredExpenses.length - displayedExpenses.length} remaining) */}
              </button>
            </div>
          )}

          {displayedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0 && (
            <p className="text-center text-gray-500 mt-4">
              Showing all {filteredExpenses.length} expenses
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default ExpenseTable;
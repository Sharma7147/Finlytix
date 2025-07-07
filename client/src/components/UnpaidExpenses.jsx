import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  FaMoneyBillWave, 
  FaCalendarAlt, 
  FaInfoCircle, 
  FaSearch, 
  FaFilter,
  FaCashRegister,
  FaCreditCard,
  FaUniversity,
  FaWallet
} from 'react-icons/fa';
import { MdPayment } from 'react-icons/md';

const UnpaidExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOption, setSortOption] = useState('dueDate');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'cash',
    reference: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/expenses/unpaid-or-partial', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data.expenses)) {
        setExpenses(data.expenses);
      } else {
        setError(data.message || 'Unexpected API response format');
      }
    } catch (error) {
      setError('Error fetching expenses: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculatePayable = (expense) => {
    if (expense.paymentStatus === 'unpaid') return expense.total;
    return expense.total - (expense.paidAmount || 0);
  };

  const handlePayNow = (expense) => {
    setCurrentExpense(expense);
    setPaymentData({
      amount: calculatePayable(expense),
      paymentMethod: 'cash',
      reference: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowPaymentModal(true);
    setPaymentSuccess(false);
  };

  const handleViewDetails = (expenseId) => {
    navigate(`/expenses/${expenseId}`);
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePayment = () => {
    if (!paymentData.amount || paymentData.amount <= 0) {
      return { valid: false, message: 'Please enter a valid payment amount' };
    }
    if (paymentData.amount > calculatePayable(currentExpense)) {
      return { valid: false, message: 'Payment amount cannot exceed payable amount' };
    }
    if (paymentData.paymentMethod !== 'cash' && !paymentData.reference) {
      return { valid: false, message: 'Please enter a reference for this payment' };
    }
    return { valid: true };
  };

  const processPayment = async () => {
  const validation = validatePayment();
  if (!validation.valid) {
    setError(validation.message);
    return;
  }

  setPaymentProcessing(true);
  setError(null);

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/expenses/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        expenseId: currentExpense._id,
        amount: parseFloat(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        reference: paymentData.reference,
        notes: paymentData.notes,
        paymentDate: paymentData.date
      })
    });

    // Check if response is OK (status 200-299)
    if (!response.ok) {
      // Handle specific 404 error
      if (response.status === 404) {
        throw new Error('Payment endpoint not found. Please check the server.');
      }
      // Handle other errors
      const errorData = await response.json();
      throw new Error(errorData.message || 'Payment failed');
    }

    const data = await response.json();

    // Only proceed if the response was successful
    setPaymentSuccess(true);
    // Update local state to reflect the payment
    setExpenses(prev => prev.map(exp => {
      if (exp._id === currentExpense._id) {
        const newPaidAmount = (exp.paidAmount || 0) + parseFloat(paymentData.amount);
        const newStatus = newPaidAmount >= exp.total ? 'paid' : 'partially_paid';
        return {
          ...exp,
          paidAmount: newPaidAmount,
          paymentStatus: newStatus
        };
      }
      return exp;
    }));
    
    // Auto-close modal after 2 seconds
    setTimeout(() => {
      setShowPaymentModal(false);
      setPaymentProcessing(false);
    }, 2000);
  } catch (error) {
    setError('Payment error: ' + error.message);
    setPaymentProcessing(false);
  }
};

  const filteredExpenses = expenses
    .filter(expense => {
      const matchesSearch = expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = filterStatus === 'all' || 
        expense.paymentStatus === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'dueDate':
          return new Date(a.dueDate || a.date) - new Date(b.dueDate || b.date);
        case 'amount':
          return calculatePayable(b) - calculatePayable(a);
        case 'vendor':
          return a.vendor.localeCompare(b.vendor);
        default:
          return 0;
      }
    });

  const totalPayable = filteredExpenses.reduce(
    (sum, expense) => sum + calculatePayable(expense), 0
  );

  const getStatusBadge = (status) => {
    const statusClasses = {
      unpaid: 'bg-red-100 text-red-800',
      'partially_paid': 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status]}`}>
        {status}
      </span>
    );
  };

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return '';
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span className="text-red-600 font-semibold">Overdue by {-diffDays} days</span>;
    } else if (diffDays === 0) {
      return <span className="text-orange-600 font-semibold">Due today</span>;
    } else {
      return <span className="text-gray-600">Due in {diffDays} days</span>;
    }
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: <FaCashRegister className="mr-2" /> },
    { value: 'card', label: 'Credit/Debit Card', icon: <FaCreditCard className="mr-2" /> },
    { value: 'bank', label: 'Bank Transfer', icon: <FaUniversity className="mr-2" /> },
    { value: 'upi', label: 'UPI Payment', icon: <FaWallet className="mr-2" /> },
    { value: 'other', label: 'Other', icon: <MdPayment className="mr-2" /> }
  ];

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Payment Modal */}
      {showPaymentModal && currentExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {paymentSuccess ? 'Payment Successful!' : 'Settle Payment'}
              </h3>
              
              {paymentSuccess ? (
                <div className="text-center py-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 mb-2">
                    ₹{paymentData.amount} paid to {currentExpense.vendor}
                  </p>
                  <p className="text-sm text-gray-500">
                    {paymentData.paymentMethod} • {format(new Date(paymentData.date), 'MMM dd, yyyy')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Vendor:</span>
                      <span className="font-medium">{currentExpense.vendor}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-medium">₹{currentExpense.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payable Amount:</span>
                      <span className="font-medium text-blue-600">
                        ₹{calculatePayable(currentExpense).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Amount (₹)
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={paymentData.amount}
                        onChange={handlePaymentChange}
                        min="0.01"
                        max={calculatePayable(currentExpense)}
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {paymentMethods.map(method => (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => setPaymentData(prev => ({
                              ...prev,
                              paymentMethod: method.value
                            }))}
                            className={`flex items-center px-3 py-2 border rounded-md text-sm ${paymentData.paymentMethod === method.value 
                              ? 'bg-blue-50 border-blue-500 text-blue-700' 
                              : 'border-gray-300 hover:bg-gray-50'}`}
                          >
                            {method.icon}
                            {method.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {paymentData.paymentMethod !== 'cash' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reference Number
                        </label>
                        <input
                          type="text"
                          name="reference"
                          value={paymentData.reference}
                          onChange={handlePaymentChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Transaction ID, UPI reference, etc."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={paymentData.date}
                        onChange={handlePaymentChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        name="notes"
                        value={paymentData.notes}
                        onChange={handlePaymentChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any additional payment details..."
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 text-sm text-red-600">
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
              {!paymentSuccess && (
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setError(null);
                  }}
                  disabled={paymentProcessing}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={paymentSuccess ? () => setShowPaymentModal(false) : processPayment}
                disabled={paymentProcessing}
                className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${paymentSuccess 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-green-500`}
              >
                {paymentProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : paymentSuccess ? (
                  'Close'
                ) : (
                  'Confirm Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Outstanding Expenses</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={fetchExpenses}
            className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-gray-500 text-sm font-medium">Total Unpaid</h3>
          <p className="text-2xl font-bold">
            {filteredExpenses.filter(e => e.paymentStatus === 'unpaid').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm font-medium">Partially Paid</h3>
          <p className="text-2xl font-bold">
            {filteredExpenses.filter(e => e.paymentStatus === 'partially_paid').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-medium">Total Payable</h3>
          <p className="text-2xl font-bold">₹{totalPayable.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by vendor or item..."
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <FaFilter className="text-gray-400" />
            <select
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value=""></option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Sort by:</span>
            <select
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="dueDate">Due Date</option>
              <option value="amount">Amount</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && !showPaymentModal && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && filteredExpenses.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No expenses found</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm || filterStatus !== 'all' 
              ? "Try adjusting your search or filter criteria" 
              : "All your expenses are paid up to date!"}
          </p>
        </div>
      )}

      {!loading && !error && filteredExpenses.length > 0 && (
        <div className="space-y-4">
          {filteredExpenses.map((expense) => (
            <div key={expense._id} className="border border-gray-200 rounded-lg shadow bg-white hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-800 capitalize">{expense.vendor}</h3>
                      {getStatusBadge(expense.paymentStatus)}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <FaCalendarAlt className="mr-1" />
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </span>
                      {expense.dueDate && (
                        <span>
                          {getDueDateStatus(expense.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-gray-500 text-sm">Total Amount</div>
                    <div className="text-xl font-bold">₹{expense.total.toFixed(2)}</div>
                    {expense.paymentStatus === 'partially_paid' && (
                      <div className="text-sm text-gray-600">
                        Paid: ₹{expense.paidAmount?.toFixed(2) || '0.00'}
                      </div>
                    )}
                    <div className="text-blue-600 font-bold">
                      Payable: ₹{calculatePayable(expense).toFixed(2)}
                    </div>
                  </div>
                </div>

                {expense.description && (
                  <div className="mt-2 flex items-start text-sm text-gray-600">
                    <FaInfoCircle className="flex-shrink-0 mr-1 mt-0.5" />
                    <p>{expense.description}</p>
                  </div>
                )}

                <div className="mt-3">
                  <ul className="text-sm">
                    {expense.items.map((item, idx) => (
                      <li key={idx} className="py-1 border-b border-gray-100 last:border-0">
                        <div className="flex justify-between">
                          <span className="text-gray-800">{item.name}</span>
                          <span className="text-gray-600">
                            ₹{item.amount.toFixed(2)} ({item.quantity} × ₹{item.unitPrice?.toFixed(2) || '0.00'})
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => handleViewDetails(expense._id)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handlePayNow(expense)}
                    className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm flex items-center"
                  >
                    <FaMoneyBillWave className="mr-1" />
                    Settle Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UnpaidExpenses;
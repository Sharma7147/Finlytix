import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaMoneyBillWave, FaCreditCard, FaUniversity, FaWallet } from 'react-icons/fa';
import { MdPayment } from 'react-icons/md';

const ExpensePayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'cash',
    reference: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [expense, setExpense] = useState(null);

  useEffect(() => {
    if (location.state?.expense) {
      setExpense(location.state.expense);
      setPaymentData(prev => ({
        ...prev,
        amount: location.state.expense.amount
      }));
    } else {
      // If no expense data, redirect back
      navigate(-1);
    }
  }, [location.state, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
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
          expenseId: expense.id,
          amount: parseFloat(paymentData.amount),
          paymentMethod: paymentData.paymentMethod,
          reference: paymentData.reference,
          notes: paymentData.notes,
          paymentDate: paymentData.date
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment failed');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(`/expenses/${expense.id}`, { 
          state: { message: 'Payment processed successfully' } 
        });
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error processing payment');
    } finally {
      setProcessing(false);
    }
  };

  if (!expense) return null;

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: <FaMoneyBillWave className="mr-2" /> },
    { value: 'card', label: 'Credit/Debit Card', icon: <FaCreditCard className="mr-2" /> },
    { value: 'bank', label: 'Bank Transfer', icon: <FaUniversity className="mr-2" /> },
    { value: 'upi', label: 'UPI Payment', icon: <FaWallet className="mr-2" /> },
    { value: 'other', label: 'Other', icon: <MdPayment className="mr-2" /> }
  ];

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-800"
      >
        <FaArrowLeft /> Back to Expense
      </button>

      <h1 className="text-2xl font-bold mb-4">Make Payment</h1>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Vendor:</span>
          <span className="font-medium capitalize">{expense.vendor}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Amount Due:</span>
          <span className="font-medium">{expense.currency}{expense.amount.toFixed(2)}</span>
        </div>
      </div>

      {success ? (
        <div className="text-center py-8">
          <FaCheckCircle className="mx-auto text-green-500 text-5xl mb-4" />
          <h2 className="text-xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-gray-600">
            {expense.currency}{paymentData.amount} paid to {expense.vendor}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount ({expense.currency})
              </label>
              <input
                type="number"
                name="amount"
                value={paymentData.amount}
                onChange={handleChange}
                min="0.01"
                max={expense.amount}
                step="0.01"
                required
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
                  onChange={handleChange}
                  required={paymentData.paymentMethod !== 'cash'}
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
                onChange={handleChange}
                required
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
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional payment details..."
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ExpensePayment;
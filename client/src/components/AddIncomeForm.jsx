import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMoneyBillWave, FaCalendarAlt, FaInfoCircle, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddIncomeForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    source: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMethod: 'cash',
    paymentStatus: 'received',
    receivedAmount: '',
    dueDate: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    return () => setIsMounted(false);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
    
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
  const errors = {};
  
  if (!formData.source.trim()) {
    errors.source = 'Income source is required';
  }
  
  if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
    errors.amount = 'Valid amount is required';
  }
  
  // For partial payments
  if (formData.paymentStatus === 'partial') {
    const received = Number(formData.receivedAmount);
    const total = Number(formData.amount);
    
    if (!formData.receivedAmount || 
        isNaN(received) || 
        received <= 0 || 
        received >= total) {
      errors.receivedAmount = 'Valid received amount is required (must be less than total amount)';
    }
  }
  
  // For both partial and pending payments
  if (['partial', 'pending'].includes(formData.paymentStatus)) {
    if (!formData.dueDate) {
      errors.dueDate = 'Due date is required';
    } else if (new Date(formData.dueDate) < new Date()) {
      errors.dueDate = 'Due date cannot be in the past';
    }
  }
  
  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        source: formData.source.trim(),
        date: formData.date,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes.trim(),
        dueDate: ['partial', 'pending'].includes(formData.paymentStatus) ? formData.dueDate : null,
        receivedAmount: formData.paymentStatus === 'partial' ? Number(formData.receivedAmount) : null
      };

      const apiUrl =  'https://finlytix-server.onrender.com';
      const res = await fetch(`${apiUrl}/api/income`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to add income');
      }

      toast.success('Income added successfully!');
      
      if (isMounted) {
        setFormData({
          source: '',
          date: new Date().toISOString().split('T')[0],
          amount: '',
          paymentMethod: 'cash',
          paymentStatus: 'received',
          receivedAmount: '',
          dueDate: '',
          notes: ''
        });
      }

      // Redirect to income list after successful submission
      navigate('/income-dashboard');
    } catch (err) {
      console.error('Error adding income:', err);
      toast.error(err.message || 'Failed to add income. Please try again.');
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-indigo-600 p-4 md:p-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FaMoneyBillWave className="mr-2" />
            Add New Income
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
          {/* Source Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  validationErrors.source ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Salary, Freelance, etc."
              />
              {validationErrors.source && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.source}</p>
              )}
            </div>
          </div>

          {/* Date and Amount Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Amount Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`w-full pl-10 px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    validationErrors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {validationErrors.amount && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.amount}</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Credit/Debit Card</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status <span className="text-red-500">*</span>
              </label>
              <select
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="received">Received</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Conditional Fields */}
          {formData.paymentStatus === 'partial' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Received Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Received Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    name="receivedAmount"
                    value={formData.receivedAmount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    max={formData.amount ? Number(formData.amount) - 0.01 : ''}
                    className={`w-full pl-10 px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      validationErrors.receivedAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {validationErrors.receivedAmount && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.receivedAmount}</p>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendarAlt className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full pl-10 px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      validationErrors.dueDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.dueDate && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.dueDate}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {formData.paymentStatus === 'pending' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full pl-10 px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    validationErrors.dueDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.dueDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.dueDate}</p>
                )}
              </div>
            </div>
          )}

          {/* Notes Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaInfoCircle className="mr-1" /> Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Additional information about this income..."
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Add Income'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddIncomeForm;
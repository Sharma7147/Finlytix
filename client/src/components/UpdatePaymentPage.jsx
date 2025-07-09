import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaMoneyBillWave, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UpdatePaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [income, setIncome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    paymentStatus: 'partial',
    receivedAmount: ''
  });

  useEffect(() => {
    const fetchIncome = async () => {
      try {
        const apiUrl =  'https://finlytix-server.onrender.com';
        const res = await fetch(`${apiUrl}/api/income/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch income');

        setIncome(data);
        setFormData({
          paymentStatus: data.paymentStatus,
          receivedAmount: data.receivedAmount || ''
        });
      } catch (err) {
        console.error('Error fetching income:', err);
        toast.error(err.message || 'Failed to load income data');
        navigate('/income-dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchIncome();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!income) return;

    // Validate form
    if (formData.paymentStatus === 'partial' && 
        (!formData.receivedAmount || isNaN(formData.receivedAmount) || 
        Number(formData.receivedAmount) <= 0 || 
        Number(formData.receivedAmount) >= income.amount)) {
      toast.error('Please enter a valid received amount (greater than 0 and less than total amount)');
      return;
    }

    setUpdating(true);

    try {
      const apiUrl =  'https://finlytix-server.onrender.com';
      const res = await fetch(`${apiUrl}/api/income/${id}/update-payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update payment');

      toast.success('Payment updated successfully!');
      navigate('/incomes');
    } catch (err) {
      console.error('Error updating payment:', err);
      toast.error(err.message || 'Failed to update payment');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-4xl text-indigo-600" />
      </div>
    );
  }

  if (!income) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <p className="text-gray-500">Income record not found.</p>
        <button
          onClick={() => navigate('/incomes')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Back to Incomes
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-indigo-600 p-4 md:p-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FaMoneyBillWave className="mr-2" />
            Update Payment
          </h2>
        </div>

        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900">{income.source}</h3>
            <p className="text-gray-600">Amount: ${income.amount.toFixed(2)}</p>
            {income.dueDate && (
              <p className="text-gray-600">
                Due Date: {new Date(income.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status <span className="text-red-500">*</span>
              </label>
              <select
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value="partial">Partial Payment</option>
                <option value="received">Mark as Fully Paid</option>
              </select>
            </div>

            {formData.paymentStatus === 'partial' && (
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
                    min="0.01"
                    step="0.01"
                    max={income.amount - 0.01}
                    className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Remaining: ${(income.amount - (Number(formData.receivedAmount) || 0)).toFixed(2)}
                </p>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={updating}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 ${
                  updating ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {updating ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="mr-2" />
                    Update Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdatePaymentPage;
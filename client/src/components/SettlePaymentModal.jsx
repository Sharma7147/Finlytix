import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const SettlePaymentModal = ({ onClose, onSubmit, maxAmount }) => {
  const [amount, setAmount] = useState(maxAmount);
  const [method, setMethod] = useState('cash');
  const [date, setDate] = useState(new Date());

  const handleSubmit = () => {
    if (!amount || amount <= 0) return alert('Enter valid amount');
    onSubmit({ amount, method, date });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>
          <FaTimes />
        </button>
        <h2 className="text-xl font-bold mb-4">Settle Payment</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium">Amount</label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded-md"
            value={amount}
            max={maxAmount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Method</label>
          <select
            className="w-full border px-3 py-2 rounded-md"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Payment Date</label>
          <DatePicker
            selected={date}
            onChange={(d) => setDate(d)}
            className="w-full border px-3 py-2 rounded-md"
          />
        </div>

        <div className="flex justify-end">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            onClick={handleSubmit}
          >
            Submit Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettlePaymentModal;

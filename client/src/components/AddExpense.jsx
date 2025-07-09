import React, { useState, useRef } from 'react';

const AddExpense = () => {
  const [formData, setFormData] = useState({
    item: '',
    quantity: 1,
    amount: '',
    date: '',
    vendor: '',
    category: 'uncategorized',
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    dueDate: '',
    paidAmount: '',
    isRecurring: false,
    recurrencePattern: '',
    nextRecurrenceDate: '',
    notes: ''
  });

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [mode, setMode] = useState('manual');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const categories = [
    'uncategorized', 'office supplies', 'groceries', 'travel', 'meals',
    'entertainment', 'utilities', 'rent', 'equipment', 'software',
    'marketing', 'training', 'transportation'
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'check', label: 'Check' },
    { value: 'other', label: 'Other' }
  ];

  const recurrencePatterns = [
    '', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'paymentStatus') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        paidAmount: value === 'paid' ? prev.amount : 
                   value === 'partially_paid' ? prev.paidAmount || '' : ''
      }));
    } else if (name === 'amount' && formData.paymentStatus === 'paid') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        paidAmount: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const resetForm = () => {
    setFormData({
      item: '',
      quantity: 1,
      amount: '',
      date: '',
      vendor: '',
      category: 'uncategorized',
      paymentStatus: 'paid',
      paymentMethod: 'cash',
      dueDate: '',
      paidAmount: '',
      isRecurring: false,
      recurrencePattern: '',
      nextRecurrenceDate: '',
      notes: ''
    });
    setMessage('');
    setFile(null);
    setFileName('');
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setMessage('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    if (mode === 'manual' && !formData.item) {
      setError('Item name is required');
      setIsSubmitting(false);
      return;
    }

    if (mode === 'manual' && !formData.amount) {
      setError('Amount is required');
      setIsSubmitting(false);
      return;
    }

    if (mode === 'upload' && !file) {
      setError('Please select a file to upload');
      setIsSubmitting(false);
      return;
    }

    if (formData.paymentStatus === 'partially_paid' && !formData.paidAmount) {
      setError('Paid amount is required for partially paid expenses');
      setIsSubmitting(false);
      return;
    }

    if (['partially_paid', 'unpaid'].includes(formData.paymentStatus) && !formData.dueDate) {
      setError('Due date is required for unpaid or partially paid expenses');
      setIsSubmitting(false);
      return;
    }

    try {
      if (mode === 'manual') {
        await submitManualExpense();
      } else {
        await submitFileUpload();
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitManualExpense = async () => {
    const paidAmount = formData.paymentStatus === 'paid' 
      ? Number(formData.amount) 
      : formData.paymentStatus === 'partially_paid' 
        ? Number(formData.paidAmount) 
        : 0;

    const payload = {
      userId: localStorage.getItem('userId'),
      vendor: formData.vendor || formData.item,
      date: formData.date ? new Date(formData.date) : new Date(),
      total: Number(formData.amount),
      source: 'manual',
      paymentStatus: formData.paymentStatus,
      paymentMethod: formData.paymentStatus !== 'unpaid' ? formData.paymentMethod : undefined,
      paidAmount: paidAmount,
      dueDate: ['partially_paid', 'unpaid'].includes(formData.paymentStatus)
        ? new Date(formData.dueDate)
        : null,
      items: [{
        name: formData.item,
        quantity: Number(formData.quantity),
        amount: Number(formData.amount),
        unitPrice: Number(formData.amount) / Number(formData.quantity),
        category: formData.category,
      }],
      isRecurring: formData.isRecurring,
      recurrencePattern: formData.isRecurring ? formData.recurrencePattern : undefined,
      nextRecurrenceDate: formData.isRecurring ? new Date(formData.nextRecurrenceDate) : undefined,
      notes: formData.notes,
      payments: formData.paymentStatus !== 'unpaid'
        ? [{
            amount: paidAmount,
            method: formData.paymentMethod,
            date: new Date(),
            recordedBy: localStorage.getItem('userId')
          }]
        : []  
    };

    const response = await fetch('https://finlytix-server.onrender.com/api/expenses/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to add expense');

    setMessage('Expense added successfully!');
    resetForm();
  };

  const submitFileUpload = async () => {
    if (!file) throw new Error('Please select a file');

    const formPayload = new FormData();
    formPayload.append('file', file);
    formPayload.append('paymentStatus', formData.paymentStatus);
    
    if (formData.paymentStatus !== 'unpaid') {
      formPayload.append('paymentMethod', formData.paymentMethod);
    }
    
    formPayload.append('notes', formData.notes);

    if (formData.paymentStatus === 'paid') {
      formPayload.append('amount', formData.amount);
    }

    if (formData.paymentStatus === 'partially_paid') {
      formPayload.append('paidAmount', formData.paidAmount);
    }

    if (['partially_paid', 'unpaid'].includes(formData.paymentStatus)) {
      formPayload.append('dueDate', formData.dueDate);
    }

    if (formData.isRecurring) {
      formPayload.append('isRecurring', 'true');
      formPayload.append('recurrencePattern', formData.recurrencePattern);
      formPayload.append('nextRecurrenceDate', formData.nextRecurrenceDate);
    }

    const response = await fetch('https://finlytix-server.onrender.com/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formPayload,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Upload failed');

    setMessage('Receipt uploaded and processing...');
    setFile(null);
    setFileName('');
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 bg-white rounded-xl shadow-md overflow-hidden">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Add New Expense</h1>
        <p className="text-gray-600 mt-2">Track your business expenditures</p>
      </div>

      <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
        {['manual', 'upload'].map(m => (
          <button
            key={m}
            type="button"
            onClick={() => handleModeChange(m)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition ${mode === m ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
          >
            {m === 'manual' ? 'Manual Entry' : 'Upload Receipt'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === 'manual' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input
                type="text"
                name="item"
                value={formData.item}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full pl-8 px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
              <input
                type="text"
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            {formData.paymentStatus !== 'unpaid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.paymentStatus === 'paid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="paidAmount"
                    value={formData.amount}
                    readOnly
                    className="w-full pl-8 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>
            )}

            {formData.paymentStatus === 'partially_paid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="paidAmount"
                    value={formData.paidAmount}
                    onChange={handleChange}
                    required
                    min="0"
                    max={formData.amount}
                    step="0.01"
                    className="w-full pl-8 px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {['partially_paid', 'unpaid'].includes(formData.paymentStatus) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}

            <div className="col-span-2 flex items-center">
              <input
                type="checkbox"
                name="isRecurring"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-700">
                Recurring Expense
              </label>
            </div>

            {formData.isRecurring && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence Pattern *</label>
                  <select
                    name="recurrencePattern"
                    value={formData.recurrencePattern}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {recurrencePatterns.map(pattern => (
                      <option key={pattern} value={pattern}>
                        {pattern ? pattern.charAt(0).toUpperCase() + pattern.slice(1) : 'Select...'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Recurrence Date *</label>
                  <input
                    type="date"
                    name="nextRecurrenceDate"
                    value={formData.nextRecurrenceDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </>
            )}

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        ) : (
          <>
            <div
              onClick={triggerFileInput}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="hidden"
              />
              <p className="text-gray-500">Click to upload or drag and drop</p>
              {fileName && <p className="text-sm text-gray-700 mt-2">Selected file: {fileName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            {formData.paymentStatus !== 'unpaid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.paymentStatus === 'paid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full pl-8 px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {formData.paymentStatus === 'partially_paid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="paidAmount"
                    value={formData.paidAmount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-8 px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Total amount will be extracted from the receipt</p>
              </div>
            )}

            {['partially_paid', 'unpaid'].includes(formData.paymentStatus) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isRecurring"
                id="isRecurringUpload"
                checked={formData.isRecurring}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isRecurringUpload" className="ml-2 block text-sm text-gray-700">
                Recurring Expense
              </label>
            </div>

            {formData.isRecurring && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence Pattern *</label>
                  <select
                    name="recurrencePattern"
                    value={formData.recurrencePattern}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {recurrencePatterns.map(pattern => (
                      <option key={pattern} value={pattern}>
                        {pattern ? pattern.charAt(0).toUpperCase() + pattern.slice(1) : 'Select...'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Recurrence Date *</label>
                  <input
                    type="date"
                    name="nextRecurrenceDate"
                    value={formData.nextRecurrenceDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isSubmitting || (mode === 'upload' && !file)}
          className={`w-full mt-6 py-3 px-4 rounded-xl font-semibold text-white ${
            isSubmitting || (mode === 'upload' && !file)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting
            ? mode === 'manual'
              ? 'Adding Expense...'
              : 'Uploading...'
            : mode === 'manual'
            ? 'Add Expense'
            : 'Upload Receipt'}
        </button>
      </form>

      {message && <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{message}</div>}
      {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
    </div>
  );
};

export default AddExpense;
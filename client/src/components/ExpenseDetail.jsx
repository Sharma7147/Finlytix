import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FaArrowLeft, FaEdit, FaTrash, FaFileDownload, FaPrint, FaMoneyBillWave } from 'react-icons/fa';

const ExpenseDetail = () => {
  const { id } = useParams();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://finlytix-server.onrender.com/api/expenses/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setExpense(data.expense);
        } else {
          setError(data.message || 'Failed to fetch expense');
        }
      } catch (error) {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://finlytix-server.onrender.com/api/expenses/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          navigate('/allexpenses', { 
            state: { 
              message: 'Expense deleted successfully',
              showNotification: true
            } 
          });
        } else {
          const data = await res.json();
          setError(data.message || 'Failed to delete expense');
        }
      } catch (error) {
        setError('Error connecting to server');
      }
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-content');
    const originalContents = document.body.innerHTML;
    
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    
    // Refetch the expense data as we've modified the DOM
    fetchExpense();
  };

  const handleMakePayment = () => {
    navigate(`/expenses/${id}/pay`, {
      state: {
        expense: {
          id: expense._id,
          vendor: expense.vendor,
          amount: expense.total - (expense.paidAmount || 0),
          currency: '₹'
        }
      }
    });
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!expense) return <div className="p-6 text-center text-red-500">Expense not found.</div>;

  const isPendingPayment = expense.paymentStatus === 'unpaid' || expense.paymentStatus === 'partially_paid';
  const payableAmount = expense.total - (expense.paidAmount || 0);

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 bg-white">
        {/* Non-printable header */}
        <div className="mb-6 print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        <div className="flex justify-between items-start mb-6 print:hidden">
          <div>
            <h1 className="text-2xl font-bold capitalize">{expense.vendor}</h1>
            <p className="text-sm text-gray-600">
              Date: {format(new Date(expense.date), 'PPP')}
              {expense.referenceNumber && ` • Ref: ${expense.referenceNumber}`}
            </p>
          </div>
          <div className="flex gap-2">
            {isPendingPayment && (
              <button
                onClick={handleMakePayment}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <FaMoneyBillWave /> Pay ₹{payableAmount.toFixed(2)}
              </button>
            )}
            
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              <FaTrash /> Delete
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              <FaPrint /> Print
            </button>
          </div>
        </div>

        {/* Printable content */}
        <div id="printable-content" className="print:p-6">
          {/* Printable header */}
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold capitalize">{expense.vendor}</h1>
            <p className="text-sm text-gray-600">
              Date: {format(new Date(expense.date), 'PPP')}
              {expense.referenceNumber && ` • Ref: ${expense.referenceNumber}`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded">
              <h2 className="text-lg font-semibold mb-3 border-b pb-2">Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">₹{expense.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="font-medium">
                    ₹{typeof expense.paidAmount === 'number' ? expense.paidAmount.toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Amount:</span>
                  <span className="font-medium">
                    ₹{(expense.total - expense.paidAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded capitalize ${
                    expense.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                    expense.paymentStatus === 'unpaid' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {expense.paymentStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h2 className="text-lg font-semibold mb-3 border-b pb-2">Details</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Source:</span>
                  <span className="capitalize">{expense.source}</span>
                </div>
                
                {expense.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span>{format(new Date(expense.dueDate), 'PPP')}</span>
                  </div>
                )}
                {expense.isRecurring && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recurrence:</span>
                      <span>{expense.recurrencePattern}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next Occurrence:</span>
                      <span>{format(new Date(expense.nextRecurrenceDate), 'PPP')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3 border-b pb-2">Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-3 border">Item</th>
                    <th className="p-3 border">Category</th>
                    <th className="p-3 border text-right">Qty</th>
                    <th className="p-3 border text-right">Unit Price</th>
                    <th className="p-3 border text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expense.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 border">{item.name}</td>
                      <td className="p-3 border">{item.category || '-'}</td>
                      <td className="p-3 border text-right">{item.quantity}</td>
                      <td className="p-3 border text-right">₹{item.unitPrice?.toFixed(2) || '-'}</td>
                      <td className="p-3 border text-right">₹{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="p-3 border" colSpan="4" align="right">Total:</td>
                    <td className="p-3 border text-right">₹{expense.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {expense.payments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3 border-b pb-2">Payment History</h2>
              <div className="overflow-x-auto">
                <table className="w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="p-3 border">Date</th>
                      <th className="p-3 border">Amount</th>
                      <th className="p-3 border">Method</th>
                      <th className="p-3 border">Reference</th>
                      <th className="p-3 border">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expense.payments.map((pay, idx) => (
                      <tr key={idx}>
                        <td className="p-3 border">{format(new Date(pay.date), 'PPP')}</td>
                        <td className="p-3 border text-right">₹{pay.amount.toFixed(2)}</td>
                        <td className="p-3 border">{pay.method}</td>
                        <td className="p-3 border">{pay.reference || '-'}</td>
                        <td className="p-3 border">{pay.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(expense.notes || expense.fileUrl) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {expense.notes && (
                <div className="bg-gray-50 p-4 rounded">
                  <h2 className="text-lg font-semibold mb-2">Notes</h2>
                  <p className="whitespace-pre-wrap">{expense.notes}</p>
                </div>
              )}
              {expense.fileUrl && (
                <div className="bg-gray-50 p-4 rounded">
                  <h2 className="text-lg font-semibold mb-2">Attachments</h2>
                  <a
                    href={expense.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <FaFileDownload /> Download Receipt
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-content, #printable-content * {
            visibility: visible;
          }
          #printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default ExpenseDetail;
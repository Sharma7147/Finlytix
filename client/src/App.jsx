import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import AddExpense from './components/AddExpense';
import ExpensesDashboard from './components/ExpensesDashboard';
import MainLayout from './components/layout/MainLayout';
import ExpenseTable from './components/ExpenseTable';
import UnpaidExpenses from './components/UnpaidExpenses';
import ExpenseDetail from './components/ExpenseDetail';
import AllExpenses from './components/AllExpenses';
import AddIncomeForm from './components/AddIncomeForm';
import ExpensePayment from './components/ExpensePayment';
import HomePage from './components/HomePage';
import IncomeAnalysis from './components/IncomeAnalysis';
import UpdatePaymentPage from './components/UpdatePaymentPage';
import IncomeTransactions from './components/IncomeTransactions';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* App Routes with Layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="add-expense" element={<AddExpense />} />
      <Route path="/expenses/:id/pay" element={<ExpensePayment />} />
          <Route path="dashboard" element={<ExpensesDashboard />} />
          
          <Route path="expense" element={<ExpenseTable />} />
          <Route path="payment-status" element={<UnpaidExpenses />} />
       <Route path="/expenses/:id" element={<ExpenseDetail />} />
          <Route path="allexpenses" element={<AllExpenses />} />
          <Route path="income" element={<AddIncomeForm />} />
          <Route path="income-dashboard" element={<IncomeAnalysis />} />
<Route path="/update-payment/:id" element={<UpdatePaymentPage />} />
<Route path="income-transactions" element={< IncomeTransactions/>} />




        </Route>
      </Routes>
    </Router>
  );
}

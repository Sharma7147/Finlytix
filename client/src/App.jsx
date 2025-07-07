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

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* App Routes with Layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<ExpensesDashboard />} />
          <Route path="add-expense" element={<AddExpense />} />
      <Route path="/expenses/:id/pay" element={<ExpensePayment />} />
          
          <Route path="expense" element={<ExpenseTable />} />
          <Route path="payment-status" element={<UnpaidExpenses />} />
       <Route path="/expenses/:id" element={<ExpenseDetail />} />
          <Route path="allexpenses" element={<AllExpenses />} />
          <Route path="income" element={<AddIncomeForm />} />






        </Route>
      </Routes>
    </Router>
  );
}

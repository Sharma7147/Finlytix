import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Box
} from '@mui/material';

const ListExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [receipts, setReceipts] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchExpenses = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/expenses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setExpenses(data.expenses || []);
        else console.error(data.message);
      } catch (err) {
        console.error('Fetch error (expenses):', err);
      }
    };

    const fetchReceipts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/receipts/import');
        const data = await res.json();
        if (res.ok) setReceipts(data.receipts || []);
        else console.error(data.message);
      } catch (err) {
        console.error('Fetch error (receipts):', err);
      }
    };

    fetchExpenses();
    fetchReceipts();
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h5" gutterBottom>📋 Your Manual Expenses</Typography>

      <Paper elevation={3} sx={{ overflow: 'auto', mb: 4 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f0f0f0' }}>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Amount (₹)</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map(exp => (
              <TableRow key={exp._id}>
                <TableCell>{exp.item}</TableCell>
                <TableCell>{exp.quantity}</TableCell>
                <TableCell>{exp.amount}</TableCell>
                <TableCell>{new Date(exp.date).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Typography variant="h5" gutterBottom>🧾 Receipt-Based Expenses</Typography>
      {receipts.map(receipt => (
        <Paper key={receipt.receipt_id} elevation={4} sx={{ p: 2, mb: 4 }}>
          <Typography><strong>Date:</strong> {new Date(receipt.date).toLocaleString()}</Typography>
          <Typography><strong>File:</strong> {receipt.file_name}</Typography>
          <Table sx={{ mt: 2 }}>
            <TableHead sx={{ backgroundColor: '#f9f9f9' }}>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receipt.items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.name || 'Unknown'}</TableCell>
                  <TableCell>{item.qty || 1}</TableCell>
                  <TableCell>{item.price || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      ))}
    </Container>
  );
};

export default ListExpenses;

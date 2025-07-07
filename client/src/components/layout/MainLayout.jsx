import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import styled from 'styled-components';

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
`;

const Sidebar = styled.nav`
  width: 220px;
  background: #1f3a93;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const StyledLink = styled(NavLink)`
  color: white;
  margin-bottom: 15px;
  text-decoration: none;
  font-weight: 600;
  &.active {
    color: #f5a623;
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: 30px;
  background: #f9fbfd;
  overflow-y: auto;
`;

export default function MainLayout() {
  return (
    <LayoutContainer>
      <Sidebar>
        <h2>ExpenseApp</h2>
        <StyledLink to="/">Dashboard</StyledLink>
        <StyledLink to="/add-expense">Add Expense</StyledLink>
        <StyledLink to="/income">Add Income</StyledLink>
        <StyledLink to="/allexpenses">All Expenses</StyledLink>
        <StyledLink to="/expense">Expense</StyledLink>
        <StyledLink to="/payment-status">Payment</StyledLink>





      </Sidebar>
      <MainContent>
        <Outlet />
      </MainContent>
    </LayoutContainer>
  );
}

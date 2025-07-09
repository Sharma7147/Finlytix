import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { FaBars, FaTimes } from 'react-icons/fa';

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Sidebar = styled.nav`
  width: 220px;
  background: #1f3a93;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  
  @media (max-width: 768px) {
    width: 100%;
    position: fixed;
    height: 100vh;
    z-index: 100;
    transform: ${({ isOpen }) => isOpen ? 'translateX(0)' : 'translateX(-100%)'};
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: #1f3a93;
  font-size: 24px;
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 101;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const StyledLink = styled(NavLink)`
  color: white;
  margin-bottom: 15px;
  text-decoration: none;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &.active {
    color: #f5a623;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: 30px;
  background: #f9fbfd;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding-top: 70px;
    padding-left: 20px;
    padding-right: 20px;
  }
`;

const Overlay = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
  
  @media (max-width: 768px) {
    display: ${({ isOpen }) => isOpen ? 'block' : 'none'};
  }
`;

export default function MainLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <LayoutContainer>
      {isMobile && (
        <MobileMenuButton onClick={toggleSidebar}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </MobileMenuButton>
      )}
      
      <Overlay isOpen={isOpen} onClick={toggleSidebar} />
      
      <Sidebar isOpen={isOpen}>
        <h2>ExpenseApp</h2>
        
        <StyledLink to="/" onClick={() => isMobile && setIsOpen(false)}>Home</StyledLink>
        <StyledLink to="/dashboard" onClick={() => isMobile && setIsOpen(false)}>Dashboard</StyledLink>
        <StyledLink to="/add-expense" onClick={() => isMobile && setIsOpen(false)}>Add Expense</StyledLink>
        <StyledLink to="/income" onClick={() => isMobile && setIsOpen(false)}>Add Income</StyledLink>
        <StyledLink to="/allexpenses" onClick={() => isMobile && setIsOpen(false)}>All Expenses</StyledLink>
        <StyledLink to="/expense" onClick={() => isMobile && setIsOpen(false)}>Expense</StyledLink>
        <StyledLink to="/payment-status" onClick={() => isMobile && setIsOpen(false)}>Payment</StyledLink>
        <StyledLink to="/register" onClick={() => isMobile && setIsOpen(false)}>Register</StyledLink>
        <StyledLink to="/login" onClick={() => isMobile && setIsOpen(false)}>Login</StyledLink>
        <StyledLink to="/income-dashboard" onClick={() => isMobile && setIsOpen(false)}>Income Dashboard</StyledLink>
        <StyledLink to="/income-transactions" onClick={() => isMobile && setIsOpen(false)}>Income Transactions</StyledLink>
      </Sidebar>
      
      <MainContent>
        <Outlet />
      </MainContent>
    </LayoutContainer>
  );
}
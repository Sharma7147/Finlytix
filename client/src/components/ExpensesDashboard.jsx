import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FiDownload, FiRefreshCw, FiFilter, FiBarChart2, FiPieChart } from 'react-icons/fi';

// --- Animations ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(74, 144, 226, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(74, 144, 226, 0); }
  100% { box-shadow: 0 0 0 0 rgba(74, 144, 226, 0); }
`;

// --- Constants ---
const COLORS = [
  '#4a90e2', '#50e3c2', '#f5a623', '#9013fe', 
  '#e94e77', '#7ed6df', '#e1b12c', '#9b59b6',
  '#1abc9c', '#d35400', '#3498db', '#e74c3c'
];

const MONTHS = [
  { name: 'Jan', value: 1 }, { name: 'Feb', value: 2 }, { name: 'Mar', value: 3 },
  { name: 'Apr', value: 4 }, { name: 'May', value: 5 }, { name: 'Jun', value: 6 },
  { name: 'Jul', value: 7 }, { name: 'Aug', value: 8 }, { name: 'Sep', value: 9 },
  { name: 'Oct', value: 10 }, { name: 'Nov', value: 11 }, { name: 'Dec', value: 12 }
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

// --- Styled Components ---
const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #2f2f2f;
  background: linear-gradient(135deg, #f7f9fc 0%, #f1f5f9 100%);
  min-height: 100vh;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  animation: ${fadeIn} 0.5s ease-out;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
  background: linear-gradient(90deg, #4a90e2, #9013fe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
`;

const ControlsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  animation: ${fadeIn} 0.6s ease-out;
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
`;

const ControlLabel = styled.span`
  font-weight: 600;
  color: #4a5568;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Select = styled.select`
  padding: 10px 15px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  font-weight: 500;
  font-size: 14px;
  min-width: 120px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: #cbd5e0;
  }

  &:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
  }
`;

const ToggleButton = styled.button`
  background-color: ${props => props.active ? '#4a90e2' : 'white'};
  color: ${props => props.active ? 'white' : '#4a5568'};
  border: 1px solid ${props => props.active ? '#4a90e2' : '#e2e8f0'};
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    background-color: ${props => props.active ? '#3a7bc8' : '#f7fafc'};
    border-color: ${props => props.active ? '#3a7bc8' : '#cbd5e0'};
  }
`;

const ActionButton = styled.button`
  background-color: ${props => props.primary ? '#4a90e2' : 'white'};
  color: ${props => props.primary ? 'white' : '#4a5568'};
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  animation: ${props => props.pulse ? pulse : 'none'} 2s infinite;

  &:hover {
    background-color: ${props => props.primary ? '#3a7bc8' : '#f7fafc'};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: ${fadeIn} 0.5s ease-out;
  border: 1px solid rgba(0, 0, 0, 0.03);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 300px;
  margin-top: 15px;
`;

const Loading = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 18px;
  color: #718096;
  gap: 10px;
`;

const ErrorMessage = styled.div`
  background: #fff5f5;
  color: #e53e3e;
  padding: 20px;
  border-radius: 8px;
  font-weight: 600;
  text-align: center;
  margin: 20px 0;
  border: 1px solid #fed7d7;
`;

const StatCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 30px;
`;

const StatValue = styled.div`
  font-size: 36px;
  font-weight: 700;
  color: #4a90e2;
  margin: 10px 0;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #718096;
  font-weight: 500;
`;

const CustomTooltip = styled.div`
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  font-size: 14px;

  strong {
    color: #4a5568;
    margin-bottom: 5px;
    display: block;
  }

  span {
    color: #718096;
    display: block;
    margin-top: 3px;
  }
`;

// --- Utility Functions ---
const fetchData = async (endpoint, month, year) => {
  const url = new URL(endpoint, window.location.origin);

  if (month !== null && month !== undefined) {
    url.searchParams.append('month', month);
  }
  if (year) {
    url.searchParams.append('year', year);
  }

  const token = localStorage.getItem('token');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${res.statusText}`);
  }

  return res.json();
};

const formatCurrency = (val) => `${val?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`;

// --- Main Component ---
export default function EnhancedExpensesDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [itemData, setItemData] = useState([]);
  const [enterpriseData, setEnterpriseData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [quantityData, setQuantityData] = useState([]);
  const [viewMode, setViewMode] = useState('amount');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [timeRange, setTimeRange] = useState('monthly');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [selectedMonth, selectedYear, timeRange]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');
      setRefreshing(true);

      const month = timeRange === 'monthly' ? selectedMonth : null;

      const [
        { itemBreakdown = [] },
        { vendorBreakdown = [] },
        { monthlyTrend = [] },
        { categoryBreakdown = [] },
      ] = await Promise.all([
        fetchData('https://finlytix-server.onrender.com/api/expenses/analytics/items', month, selectedYear),
        fetchData('https://finlytix-server.onrender.com/api/expenses/analytics/vendors', month, selectedYear),
        fetchData('https://finlytix-server.onrender.com/api/expenses/analytics/monthly', month, selectedYear),
        fetchData('https://finlytix-server.onrender.com/api/expenses/analytics/categories', month, selectedYear),
      ]);

      setItemData(itemBreakdown);
      setEnterpriseData(vendorBreakdown);
      setMonthlyData(monthlyTrend);
      setQuantityData(categoryBreakdown);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderCustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <CustomTooltip>
          <strong>{data.item || data.vendor || data.month || data.category}</strong>
          <span>Amount: {formatCurrency(data.totalAmount || data.total || 0)}</span>
          {data.percentage && <span>Percentage: {data.percentage.toFixed(1)}%</span>}
        </CustomTooltip>
      );
    }
    return null;
  };

  const completeMonthlyData = MONTHS.map(m => {
    const match = monthlyData.find(d => d.month === m.value);
    return {
      month: m.name,
      totalAmount: match ? match.total : 0
    };
  });

  const handleDownloadExcel = () => {
    const dataToExport = [];

    itemData.forEach(item => {
      dataToExport.push({
        Type: 'Item',
        Name: item.name,
        Amount: item.totalAmount,
        Percentage: item.percentage?.toFixed(2) || 0,
        Month: timeRange === 'monthly' ? MONTHS.find(m => m.value === selectedMonth)?.name : 'All',
        Year: selectedYear,
      });
    });

    enterpriseData.forEach(vendor => {
      dataToExport.push({
        Type: 'Vendor',
        Name: vendor.vendor,
        Amount: vendor.totalAmount || vendor.total,
        Percentage: vendor.percentage?.toFixed(2) || 0,
        Month: timeRange === 'monthly' ? MONTHS.find(m => m.value === selectedMonth)?.name : 'All',
        Year: selectedYear,
      });
    });

    quantityData.forEach(cat => {
      dataToExport.push({
        Type: 'Category',
        Name: cat.category,
        Amount: cat.totalAmount,
        Percentage: cat.percentage?.toFixed(2) || 0,
        Month: timeRange === 'monthly' ? MONTHS.find(m => m.value === selectedMonth)?.name : 'All',
        Year: selectedYear,
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses Breakdown');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    const fileName = `Expenses_${timeRange}_${selectedMonth || 'All'}_${selectedYear}.xlsx`;
    saveAs(blob, fileName);
  };

  const totalExpenses = monthlyData.reduce((sum, item) => sum + (item.total || 0), 0);
  const topCategory = quantityData.length > 0 ? quantityData[0] : null;
  const topVendor = enterpriseData.length > 0 ? enterpriseData[0] : null;

  if (loading && !refreshing) return (
    <DashboardContainer>
      <Loading>
        <FiRefreshCw className="spin" />
        Loading your dashboard...
      </Loading>
    </DashboardContainer>
  );

  if (error) return (
    <DashboardContainer>
      <ErrorMessage>
        ❌ {error}
      </ErrorMessage>
    </DashboardContainer>
  );

  return (
    <DashboardContainer>
      <Header>
        <Title>Expenses Analytics Dashboard</Title>
        <ActionButton 
          onClick={loadAllData} 
          pulse={refreshing}
        >
          <FiRefreshCw className={refreshing ? "spin" : ""} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </ActionButton>
      </Header>

      <ControlsWrapper>
        <ControlGroup>
          <ControlLabel><FiFilter /> Time Range:</ControlLabel>
          <ToggleButton 
            active={timeRange === 'monthly'} 
            onClick={() => setTimeRange('monthly')}
          >
            Monthly
          </ToggleButton>
          <ToggleButton 
            active={timeRange === 'yearly'} 
            onClick={() => setTimeRange('yearly')}
          >
            Yearly
          </ToggleButton>
        </ControlGroup>

        {timeRange === 'monthly' && (
          <ControlGroup>
            <ControlLabel>Month:</ControlLabel>
            <Select 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(Number(e.target.value))}
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.name}</option>
              ))}
            </Select>
          </ControlGroup>
        )}

        <ControlGroup>
          <ControlLabel>Year:</ControlLabel>
          <Select 
            value={selectedYear} 
            onChange={e => setSelectedYear(Number(e.target.value))}
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </ControlGroup>

        <ControlGroup>
          <ControlLabel><FiBarChart2 /> View By:</ControlLabel>
          <ToggleButton 
            active={viewMode === 'amount'} 
            onClick={() => setViewMode('amount')}
          >
            Amount
          </ToggleButton>
          <ToggleButton 
            active={viewMode === 'percentage'} 
            onClick={() => setViewMode('percentage')}
          >
            Percentage
          </ToggleButton>
        </ControlGroup>

        <ActionButton 
          primary 
          onClick={handleDownloadExcel}
        >
          <FiDownload />
          Export Data
        </ActionButton>
      </ControlsWrapper>

      <DashboardGrid>
        <StatCard>
          <StatLabel>Total Expenses</StatLabel>
          <StatValue>{formatCurrency(totalExpenses)}</StatValue>
          <StatLabel>{timeRange === 'monthly' ? 'This Month' : 'This Year'}</StatLabel>
        </StatCard>

        {topCategory && (
          <StatCard>
            <StatLabel>Top Category</StatLabel>
            <StatValue>{topCategory.category}</StatValue>
            <StatLabel>{formatCurrency(topCategory.totalAmount)} ({topCategory.percentage?.toFixed(1)}%)</StatLabel>
          </StatCard>
        )}

        {topVendor && (
          <StatCard>
            <StatLabel>Top Vendor</StatLabel>
            <StatValue>{topVendor.vendor}</StatValue>
            <StatLabel>{formatCurrency(topVendor.totalAmount || topVendor.total)} ({topVendor.percentage?.toFixed(1)}%)</StatLabel>
          </StatCard>
        )}
      </DashboardGrid>

      <DashboardGrid>
        <Card>
          <CardHeader>
            <CardTitle><FiPieChart /> Expense Categories</CardTitle>
            <ControlLabel>View: {viewMode === 'amount' ? 'Amount' : 'Percentage'}</ControlLabel>
          </CardHeader>
          <ChartContainer>
            {loading ? (
              <Loading>
                <FiRefreshCw className="spin" />
                Loading chart...
              </Loading>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={quantityData}
                    dataKey={viewMode === 'percentage' ? 'percentage' : 'total' || 'totalAmount'}
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {quantityData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={renderCustomTooltip} />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right" 
                    wrapperStyle={{ paddingLeft: '20px' }}
                    formatter={(value, entry, index) => (
                      <span style={{ color: '#4a5568' }}>
                        {value} ({quantityData[index]?.percentage?.toFixed(1)}%)
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle><FiBarChart2 /> Monthly Trend</CardTitle>
            <ControlLabel>{selectedYear}</ControlLabel>
          </CardHeader>
          <ChartContainer>
            {loading ? (
              <Loading>
                <FiRefreshCw className="spin" />
                Loading chart...
              </Loading>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={completeMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#718096' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={val => `$${(val / 1000)}k`}
                    tick={{ fill: '#718096' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    content={renderCustomTooltip}
                    cursor={{ stroke: '#4a90e2', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="totalAmount" 
                    stroke="#4a90e2" 
                    fill="#4a90e2" 
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </Card>
      </DashboardGrid>

      <DashboardGrid>
        <Card>
          <CardHeader>
            <CardTitle>Top Items</CardTitle>
            <ControlLabel>View: {viewMode === 'amount' ? 'Amount' : 'Percentage'}</ControlLabel>
          </CardHeader>
          <ChartContainer>
            {loading ? (
              <Loading>
                <FiRefreshCw className="spin" />
                Loading chart...
              </Loading>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={itemData.slice(0, 6)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#edf2f7" />
                  <XAxis 
                    type="number" 
                    tickFormatter={val => viewMode === 'percentage' ? `${val}%` : formatCurrency(val)}
                    tick={{ fill: '#718096' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    tick={{ fill: '#718096' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={renderCustomTooltip} />
                  <Bar 
                    dataKey={viewMode === 'percentage' ? 'percentage' :  'totalAmount'}
                    fill="#4a90e2"
                    radius={[0, 4, 4, 0]}
                    animationDuration={1500}
                  >
                    {itemData.slice(0, 6).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Vendors</CardTitle>
            <ControlLabel>View: {viewMode === 'amount' ? 'Amount' : 'Percentage'}</ControlLabel>
          </CardHeader>
          <ChartContainer>
            {loading ? (
              <Loading>
                <FiRefreshCw className="spin" />
                Loading chart...
              </Loading>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={enterpriseData.slice(0, 6)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#edf2f7" />
                  <XAxis 
                    type="number" 
                    tickFormatter={val => viewMode === 'percentage' ? `${val}%` : formatCurrency(val)}
                    tick={{ fill: '#718096' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="vendor" 
                    width={100}
                    tick={{ fill: '#718096' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={renderCustomTooltip} />
                  <Bar 
                    dataKey={viewMode === 'percentage' ? 'percentage' : 'total' || 'totalAmount'}
                    fill="#50e3c2"
                    radius={[0, 4, 4, 0]}
                    animationDuration={1500}
                  >
                    {enterpriseData.slice(0, 6).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </Card>
      </DashboardGrid>
    </DashboardContainer>
  );
}

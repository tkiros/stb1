import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import { 
  FaChartLine, 
  FaCoins, 
  FaWallet, 
  FaExclamationTriangle,
  FaCog,
  FaPlay,
  FaStop,
  FaTrash,
  FaExternalLinkAlt
} from 'react-icons/fa';
import TokenDiscoveryPanel from './TokenDiscoveryPanel';
import ActiveTradesPanel from './ActiveTradesPanel';
import ExecutedTradesPanel from './ExecutedTradesPanel';
import AlertsPanel from './AlertsPanel';
import ControlPanel from './ControlPanel';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
  color: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Header = styled.header`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: #00d4ff;
`;

const StatusIndicator = styled.div<{ status: 'running' | 'stopped' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  background: ${props => props.status === 'running' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)'};
  border: 1px solid ${props => props.status === 'running' ? '#00ff00' : '#ff0000'};
`;

const MainContent = styled.main`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 1.5rem;
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Panel = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(0, 212, 255, 0.3);
    box-shadow: 0 8px 32px rgba(0, 212, 255, 0.1);
  }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const PanelTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`;

const PanelIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
`;

const TokenDiscoveryIcon = styled(PanelIcon)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const ActiveTradesIcon = styled(PanelIcon)`
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
`;

const ExecutedTradesIcon = styled(PanelIcon)`
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
`;

const AlertsIcon = styled(PanelIcon)`
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
`;

const ControlIcon = styled(PanelIcon)`
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #00d4ff;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
`;

const Dashboard: React.FC = () => {
  const [botStatus, setBotStatus] = useState<'running' | 'stopped'>('running');
  const [stats, setStats] = useState({
    totalTokens: 0,
    activeTrades: 0,
    totalPnl: 0,
    alertsCount: 0,
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, this would fetch data from the API
      setStats(prev => ({
        ...prev,
        totalTokens: Math.floor(Math.random() * 50) + 10,
        activeTrades: Math.floor(Math.random() * 5),
        totalPnl: (Math.random() - 0.5) * 1000,
        alertsCount: Math.floor(Math.random() * 3),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardContainer>
      <Header>
        <Logo>
          <FaChartLine />
          Solana Trading Bot
        </Logo>
        <StatusIndicator status={botStatus}>
          <div className={`status-dot ${botStatus}`} />
          {botStatus === 'running' ? 'Running' : 'Stopped'}
        </StatusIndicator>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.totalTokens}</StatValue>
          <StatLabel>Active Tokens</StatCard>
        <StatCard>
          <StatValue>{stats.activeTrades}</StatValue>
          <StatLabel>Open Positions</StatCard>
        <StatValue className={stats.totalPnl >= 0 ? 'positive' : 'negative'}>
          ${stats.totalPnl.toFixed(2)}
        </StatValue>
          <StatLabel>Total P&L</StatCard>
        <StatCard>
          <StatValue>{stats.alertsCount}</StatValue>
          <StatLabel>Alerts</StatCard>
      </StatsGrid>

      <MainContent>
        <Panel>
          <PanelHeader>
            <TokenDiscoveryIcon>
              <FaCoins />
            </TokenDiscoveryIcon>
            <PanelTitle>Token Discovery</PanelTitle>
          </PanelHeader>
          <TokenDiscoveryPanel />
        </Panel>

        <Panel>
          <PanelHeader>
            <ActiveTradesIcon>
              <FaWallet />
            </ActiveTradesIcon>
            <PanelTitle>Active Trades</PanelTitle>
          </PanelHeader>
          <ActiveTradesPanel />
        </Panel>

        <Panel>
          <PanelHeader>
            <ExecutedTradesIcon>
              <FaChartLine />
            </ExecutedTradesIcon>
            <PanelTitle>Executed Trades</PanelTitle>
          </PanelHeader>
          <ExecutedTradesPanel />
        </Panel>

        <Panel>
          <PanelHeader>
            <AlertsIcon>
              <FaExclamationTriangle />
            </AlertsIcon>
            <PanelTitle>Alerts & Events</PanelTitle>
          </PanelHeader>
          <AlertsPanel />
        </Panel>

        <Panel style={{ gridColumn: '1 / -1' }}>
          <PanelHeader>
            <ControlIcon>
              <FaCog />
            </ControlIcon>
            <PanelTitle>Control Panel</PanelTitle>
          </PanelHeader>
          <ControlPanel />
        </Panel>
      </MainContent>
    </DashboardContainer>
  );
};

export default Dashboard;
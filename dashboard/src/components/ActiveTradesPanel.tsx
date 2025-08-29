import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import { FaChartLine, FaDollarSign, FaClock, FaSell } from 'react-icons/fa';

const PanelContainer = styled.div`
  height: 400px;
  overflow-y: auto;
`;

const TradeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TradeItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 212, 255, 0.3);
    background: rgba(255, 255, 255, 0.05);
  }
`;

const TradeInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const TradeToken = styled.div`
  font-weight: 600;
  color: #ffffff;
`;

const TradeDetails = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
`;

const TradeMetrics = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
`;

const PnL = styled.div<{ isPositive: boolean }>`
  font-weight: 600;
  font-size: 1.1rem;
  color: ${props => props.isPositive ? '#00ff88' : '#ff4444'};
`;

const StopLoss = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
`;

const TradeActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.sell {
    border-color: #00d4ff;
    color: #00d4ff;

    &:hover {
      background: rgba(0, 212, 255, 0.1);
    }
  }

  &.emergency {
    border-color: #ff4444;
    color: #ff4444;

    &:hover {
      background: rgba(255, 68, 68, 0.1);
    }
  }
`;

interface Position {
  id: number;
  token_id: number;
  token_name?: string;
  token_symbol?: string;
  entry_price: number;
  current_price: number;
  entry_size: number;
  current_size: number;
  entry_timestamp: string;
  status: 'OPEN' | 'CLOSED';
  realized_pnl?: number;
  unrealized_pnl?: number;
  trailing_stop_price?: number;
  hard_stop_loss?: number;
  fibonacci_target?: number;
}

const ActiveTradesPanel: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);

  // Simulate position data
  useEffect(() => {
    const mockPositions: Position[] = [
      {
        id: 1,
        token_id: 1,
        token_name: 'Bitcoin',
        token_symbol: 'BTC',
        entry_price: 45000,
        current_price: 46500,
        entry_size: 0.1,
        current_size: 0.1,
        entry_timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'OPEN',
        unrealized_pnl: 150,
        trailing_stop_price: 43875,
        hard_stop_loss: 42750,
        fibonacci_target: 1.618,
      },
      {
        id: 2,
        token_id: 2,
        token_name: 'Ethereum',
        token_symbol: 'ETH',
        entry_price: 2800,
        current_price: 2750,
        entry_size: 0.15,
        current_size: 0.15,
        entry_timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'OPEN',
        unrealized_pnl: -75,
        trailing_stop_price: 2660,
        hard_stop_loss: 2520,
        fibonacci_target: 1.618,
      },
    ];

    setPositions(mockPositions);
  }, []);

  const handleSell = (positionId: number) => {
    console.log('Selling position:', positionId);
    // In a real app, this would call the API to sell the position
  };

  const handleEmergencySell = (positionId: number) => {
    console.log('Emergency selling position:', positionId);
    // In a real app, this would call the API to immediately sell
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <PanelContainer>
      <TradeList>
        {positions.map((position) => (
          <TradeItem key={position.id}>
            <TradeInfo>
              <TradeToken>
                {position.token_name || 'Unknown Token'} ({position.token_symbol})
              </TradeToken>
              <TradeDetails>
                <span>Entry: {formatPrice(position.entry_price)}</span>
                <span>Current: {formatPrice(position.current_price)}</span>
                <span>Size: {position.entry_size} SOL</span>
                <span>Holding: {formatTime(position.entry_timestamp)}</span>
              </TradeDetails>
            </TradeInfo>

            <TradeMetrics>
              <PnL isPositive={position.unrealized_pnl! >= 0}>
                {position.unrealized_pnl! >= 0 ? '+' : ''}{formatPrice(position.unrealized_pnl!)}
              </PnL>
              <StopLoss>
                Stop: {position.trailing_stop_price ? formatPrice(position.trailing_stop_price) : 'N/A'}
              </StopLoss>
              <StopLoss>
                Target: {position.fibonacci_target ? `${(position.fibonacci_target * 100).toFixed(0)}%` : 'N/A'}
              </StopLoss>
            </TradeMetrics>

            <TradeActions>
              <ActionButton
                className="sell"
                onClick={() => handleSell(position.id)}
                title="Sell position"
              >
                <FaSell /> Sell
              </ActionButton>
              
              <ActionButton
                className="emergency"
                onClick={() => handleEmergencySell(position.id)}
                title="Emergency sell"
              >
                Emergency
              </ActionButton>
            </TradeActions>
          </TradeItem>
        ))}
      </TradeList>
    </PanelContainer>
  );
};

export default ActiveTradesPanel;
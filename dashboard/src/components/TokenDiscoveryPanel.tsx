import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import { FaSearch, FaFilter, FaExternalLinkAlt } from 'react-icons/fa';

const PanelContainer = styled.div`
  height: 400px;
  overflow-y: auto;
`;

const SearchBar = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 0.875rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: #00d4ff;
  }
`;

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #00d4ff;
  }
`;

const TokenList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TokenItem = styled.div`
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

const TokenInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const TokenName = styled.div`
  font-weight: 600;
  color: #ffffff;
`;

const TokenSymbol = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
`;

const TokenDetails = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
`;

const TokenActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.25rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.unsubscribe {
    border-color: #ff4444;
    color: #ff4444;

    &:hover {
      background: rgba(255, 68, 68, 0.1);
    }
  }

  &.trade {
    border-color: #00d4ff;
    color: #00d4ff;

    &:hover {
      background: rgba(0, 212, 255, 0.1);
    }
  }
`;

const RiskScore = styled.div<{ score: number }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    if (props.score <= 2) return 'rgba(0, 255, 0, 0.2)';
    if (props.score <= 4) return 'rgba(255, 255, 0, 0.2)';
    return 'rgba(255, 0, 0, 0.2)';
  }};
  color: ${props => {
    if (props.score <= 2) return '#00ff00';
    if (props.score <= 4) return '#ffff00';
    return '#ff0000';
  }};
`;

interface Token {
  id: number;
  mint_address: string;
  name?: string;
  symbol?: string;
  risk_score?: number;
  organic_score?: number;
  market_cap?: number;
  created_at: string;
  is_active: boolean;
}

const TokenDiscoveryPanel: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Simulate token data
  useEffect(() => {
    const mockTokens: Token[] = [
      {
        id: 1,
        mint_address: 'So11111111111111111111111111111111111111112',
        name: 'Bitcoin',
        symbol: 'BTC',
        risk_score: 1.2,
        organic_score: 8.5,
        market_cap: 750000000000,
        created_at: new Date().toISOString(),
        is_active: true,
      },
      {
        id: 2,
        mint_address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        name: 'Ethereum',
        symbol: 'ETH',
        risk_score: 1.5,
        organic_score: 9.1,
        market_cap: 350000000000,
        created_at: new Date().toISOString(),
        is_active: true,
      },
      {
        id: 3,
        mint_address: 'DezXAZ8z7PnrnRJjzPzVcMwBHBH3knk2UeHX1DkCzZx1',
        name: 'Raydium',
        symbol: 'RAY',
        risk_score: 2.8,
        organic_score: 7.2,
        market_cap: 850000000,
        created_at: new Date().toISOString(),
        is_active: true,
      },
    ];

    setTokens(mockTokens);
    setFilteredTokens(mockTokens);
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredTokens(tokens);
    } else {
      const filtered = tokens.filter(token =>
        token.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTokens(filtered);
    }
  }, [searchTerm, tokens]);

  const handleUnsubscribe = (mintAddress: string) => {
    console.log('Unsubscribing from token:', mintAddress);
    // In a real app, this would call the API
  };

  const handleOpenTrade = (mintAddress: string) => {
    const url = `https://pump.fun/${mintAddress}`;
    window.open(url, '_blank');
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toLocaleString()}`;
  };

  return (
    <PanelContainer>
      <SearchBar>
        <SearchInput
          type="text"
          placeholder="Search tokens..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FilterButton>
          <FaFilter />
        </FilterButton>
      </SearchBar>

      <TokenList>
        {filteredTokens.map((token) => (
          <TokenItem key={token.id}>
            <TokenInfo>
              <TokenName>{token.name || 'Unknown Token'}</TokenName>
              <TokenSymbol>{token.symbol || 'N/A'}</TokenSymbol>
              <TokenDetails>
                <span>Market Cap: {token.market_cap ? formatMarketCap(token.market_cap) : 'N/A'}</span>
                <span>Age: {new Date(token.created_at).toLocaleTimeString()}</span>
              </TokenDetails>
            </TokenInfo>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {token.risk_score && (
                <RiskScore score={token.risk_score}>
                  Risk: {token.risk_score.toFixed(1)}
                </RiskScore>
              )}
              
              <TokenActions>
                <ActionButton
                  className="trade"
                  onClick={() => handleOpenTrade(token.mint_address)}
                  title="Open in trading interface"
                >
                  <FaExternalLinkAlt />
                </ActionButton>
                
                <ActionButton
                  className="unsubscribe"
                  onClick={() => handleUnsubscribe(token.mint_address)}
                  title="Unsubscribe from token"
                >
                  Unsubscribe
                </ActionButton>
              </TokenActions>
            </div>
          </TokenItem>
        ))}
      </TokenList>
    </PanelContainer>
  );
};

export default TokenDiscoveryPanel;
import React, { useState, useEffect } from 'react';
import { getDashboardSummary, getTopProducts, getDashboardInsights } from '../services/dashboardService';
import Card from '../components/card';
import Button from '../components/button';

export const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [insights, setInsights] = useState(null);
  
  // Loading states
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [topProductsLoading, setTopProductsLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [refreshingInsights, setRefreshingInsights] = useState(false);

  const loadMetrics = async () => {
    try {
      setMetricsLoading(true);
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error loading dashboard summary:', error);
    } finally {
      setMetricsLoading(false);
    }
  };

  const loadTopProducts = async () => {
    try {
      setTopProductsLoading(true);
      const data = await getTopProducts();
      setTopProducts(data || []);
    } catch (error) {
      console.error('Error loading top products:', error);
    } finally {
      setTopProductsLoading(false);
    }
  };

  const loadInsights = async () => {
    try {
      setInsightsLoading(true);
      const data = await getDashboardInsights();
      setInsights(data?.insights || '');
    } catch (error) {
      console.error('Error loading AI insights:', error);
      setInsights('Failed to generate AI insights. Please verify Gemini configuration on the backend.');
    } finally {
      setInsightsLoading(false);
      setRefreshingInsights(false);
    }
  };

  const handleRefreshInsights = () => {
    setRefreshingInsights(true);
    loadInsights();
  };

  useEffect(() => {
    loadMetrics();
    loadTopProducts();
    loadInsights();
  }, []);

  // Simple parser to render markdown details returned by Gemini
  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      let cleanLine = line.trim();
      if (!cleanLine) return <div key={idx} style={{ height: '8px' }} />;
      
      const isBullet = cleanLine.startsWith('*') || cleanLine.startsWith('-');
      if (isBullet) {
        cleanLine = cleanLine.replace(/^[*-\s]+/, '');
      }

      // Format bold text: **text**
      const parts = cleanLine.split('**');
      const content = parts.map((part, pIdx) => {
        if (pIdx % 2 !== 0) {
          return <strong key={pIdx} style={{ color: 'var(--accent-color)', fontWeight: '700' }}>{part}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} style={{ marginLeft: '16px', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-primary)', listStyleType: 'disc', lineHeight: '1.4' }}>
            {content}
          </li>
        );
      }

      // Check if header line
      const isHeader = line.startsWith('**') && line.endsWith('**') && parts.length === 3;
      if (isHeader) {
        return (
          <h4 key={idx} style={{ fontSize: '0.98rem', fontWeight: '700', marginTop: '16px', marginBottom: '10px', color: 'var(--primary-color)', borderLeft: '3px solid var(--primary-color)', paddingLeft: '10px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {parts[1]}
          </h4>
        );
      }

      return (
        <p key={idx} style={{ marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
          {content}
        </p>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      
      {/* Dashboard Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>Business Metrics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Real-time shop sales totals, product inventory health, and AI analysis.
          </p>
        </div>
        <Button
          id="refresh-dashboard-btn"
          variant="secondary"
          size="sm"
          onClick={() => {
            loadMetrics();
            loadTopProducts();
            handleRefreshInsights();
          }}
        >
          🔄 Refresh Data
        </Button>
      </div>

      {/* 1. KPI Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Revenue */}
        <Card title="Total Revenue" style={{ position: 'relative' }}>
          {metricsLoading ? (
            <div className="shimmer-bg" style={{ height: '38px', borderRadius: '6px', margin: '4px 0' }} />
          ) : (
            <h2 style={{ fontSize: '2.2rem', color: 'var(--accent-color)', margin: '4px 0' }}>
              {summary?.total_revenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} FCFA
            </h2>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gross sales receipts</span>
        </Card>

        {/* Transactions */}
        <Card title="Sales Count">
          {metricsLoading ? (
            <div className="shimmer-bg" style={{ height: '38px', borderRadius: '6px', margin: '4px 0' }} />
          ) : (
            <h2 style={{ fontSize: '2.2rem', color: 'var(--primary-color)', margin: '4px 0' }}>
              {summary?.total_sales ?? 0}
            </h2>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total shopping carts processed</span>
        </Card>

        {/* Unique Products */}
        <Card title="Unique Products">
          {metricsLoading ? (
            <div className="shimmer-bg" style={{ height: '38px', borderRadius: '6px', margin: '4px 0' }} />
          ) : (
            <h2 style={{ fontSize: '2.2rem', color: 'var(--color-success)', margin: '4px 0' }}>
              {summary?.total_products ?? 0}
            </h2>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Catalog items registered</span>
        </Card>

        {/* Stock Alerts */}
        <Card title="Low Stock Warnings">
          {metricsLoading ? (
            <div className="shimmer-bg" style={{ height: '38px', borderRadius: '6px', margin: '4px 0' }} />
          ) : (
            <h2 style={{
              fontSize: '2.2rem',
              color: (summary?.low_stock_alerts > 0) ? 'var(--color-danger)' : 'var(--text-secondary)',
              margin: '4px 0'
            }}>
              {summary?.low_stock_alerts ?? 0}
            </h2>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Products containing ≤ 5 units</span>
        </Card>
      </div>

      {/* 2. Charts and AI insights split screen */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Left Side: Top Products List */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          <Card
            title={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 17h16M7 13v4m5-10v10m5-6v6" />
                </svg>
                Best Selling Items
              </span>
            }
            subtitle="Top 5 catalog products ranked by sales quantity"
            style={{ height: '100%' }}
          >
            {topProductsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx} className="shimmer-bg" style={{ height: '40px', borderRadius: '8px' }} />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)' }}>
                No sales records found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {topProducts.map((p, idx) => {
                  // Find relative proportion for visual fill
                  const maxSold = Math.max(...topProducts.map(tp => tp.units_sold), 1);
                  const barWidth = (p.units_sold / maxSold) * 100;
                  
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span style={{ fontWeight: '600' }}>{idx + 1}. {p.product}</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                          {p.units_sold} sold <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>({p.revenue.toFixed(2)} FCFA)</span>
                        </span>
                      </div>
                      <div style={{
                        height: '8px',
                        backgroundColor: 'var(--glass-card-bg)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${barWidth}%`,
                          height: '100%',
                          backgroundColor: 'var(--primary-color)',
                          boxShadow: '0 0 8px rgba(var(--primary-color-rgb), 0.3)',
                          borderRadius: '4px'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Gemini AI Business insights report */}
        <div style={{ flex: 1.3, minWidth: '350px' }}>
          <Card
            title={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364l-2.121 2.121M8.757 15.243l-2.121 2.121M18.364 18.364l-2.121-2.121M8.757 8.757l-2.121-2.121" />
                </svg>
                Gemini AI Insights
              </span>
            }
            subtitle="Automated shop analysis & health diagnostics"
            actions={
              <Button
                id="refresh-insights-btn"
                variant="secondary"
                size="sm"
                onClick={handleRefreshInsights}
                loading={refreshingInsights}
              >
                Re-Analyze
              </Button>
            }
          >
            {insightsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderTopColor: 'var(--primary-color)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Querying Gemini LLM...</span>
                </div>
                <div className="shimmer-bg" style={{ height: '16px', borderRadius: '4px', width: '90%' }} />
                <div className="shimmer-bg" style={{ height: '16px', borderRadius: '4px', width: '95%' }} />
                <div className="shimmer-bg" style={{ height: '16px', borderRadius: '4px', width: '80%' }} />
                <div className="shimmer-bg" style={{ height: '16px', borderRadius: '4px', width: '85%' }} />
                <div className="shimmer-bg" style={{ height: '16px', borderRadius: '4px', width: '50%' }} />
              </div>
            ) : (
              <div style={{
                backgroundColor: 'var(--glass-card-bg)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid var(--glass-card-border)',
                maxHeight: '350px',
                overflowY: 'auto'
              }}>
                {renderMarkdown(insights)}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
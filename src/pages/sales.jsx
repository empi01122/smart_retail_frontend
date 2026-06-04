import React, { useState, useEffect } from 'react';
import { getAllSales } from '../services/salesService';
import Card from '../components/card';
import Table from '../components/table';
import Button from '../components/button';

const titleCase = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.trim().split(/\s+/).map(word => word[0]?.toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSaleId, setExpandedSaleId] = useState(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await getAllSales();
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching transactions ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const toggleExpandSale = (id) => {
    setExpandedSaleId(prev => (prev === id ? null : id));
  };

  // Compute ledger-wide stats
  const totalTransactions = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const averageBasketValue = totalTransactions > 0 ? (totalRevenue / totalTransactions) : 0;
  
  const totalItemsSold = sales.reduce((sum, sale) => {
    return sum + (sale.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>Transaction Ledger</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Historical checkout transactions recorded in this store terminal.
        </p>
      </div>

      {/* Summary KPI Panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <Card title="Total Revenue" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--accent-color)', margin: '4px 0 0 0' }}>
            {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FCFA
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gross store transactions</span>
        </Card>

        <Card title="Checkout Volume" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--primary-color)', margin: '4px 0 0 0' }}>
            {totalTransactions}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total sales count</span>
        </Card>

        <Card title="Items Dispensed" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--color-success)', margin: '4px 0 0 0' }}>
            {totalItemsSold}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Units deducted from inventory</span>
        </Card>

        <Card title="Avg Basket Value" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
            {averageBasketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FCFA
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mean sale size</span>
        </Card>
      </div>

      {/* Transaction Logs Table */}
      <Card padding="0px" style={{ overflow: 'hidden' }}>
        <Table
          headers={['Transaction ID', 'Timestamp', 'Items Sold', 'Gross Total', 'Inspector']}
          loading={loading}
          emptyMessage="No sales transactions recorded yet."
        >
          {sales.map((sale) => {
            const isExpanded = expandedSaleId === sale.id;
            const itemsCount = sale.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
            
            return (
              <React.Fragment key={sale.id}>
                {/* Main Transaction Row */}
                <tr
                  id={`transaction-row-${sale.id}`}
                  onClick={() => toggleExpandSale(sale.id)}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? 'rgba(255,255,255,0.01)' : 'transparent',
                    transition: 'var(--transition-fast)'
                  }}
                  className="table-row-hover"
                >
                  {/* ID */}
                  <td style={{ padding: '16px 20px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    #{sale.id}
                  </td>

                  {/* Timestamp */}
                  <td style={{ padding: '16px 20px', color: 'var(--text-primary)' }}>
                    {new Date(sale.created_at).toLocaleString()}
                  </td>

                  {/* Items Count */}
                  <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: '500' }}>
                    {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                  </td>

                  {/* Gross Total */}
                  <td style={{ padding: '16px 20px', fontWeight: '800', color: 'var(--accent-color)' }}>
                    {sale.total_amount.toFixed(2)} FCFA
                  </td>

                  {/* Inspect Details Button */}
                  <td style={{ padding: '16px 20px' }}>
                    <Button
                      id={`expand-sale-${sale.id}`}
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpandSale(sale.id);
                      }}
                    >
                      {isExpanded ? 'Hide Details ▲' : 'View Details ▼'}
                    </Button>
                  </td>
                </tr>

                {/* Expanded Details Row */}
                {isExpanded && (
                  <tr>
                    <td colSpan={5} style={{
                      backgroundColor: 'var(--bg-app)',
                      padding: '20px 40px',
                      borderBottom: '1px solid var(--border-sidebar)',
                    }}>
                      <div className="animate-slide-up" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Basket breakdown:
                        </h4>
 
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          maxWidth: '600px',
                        }}>
                          {sale.items && sale.items.length > 0 ? (
                            sale.items.map((item) => (
                              <div
                                key={item.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '8px 12px',
                                  backgroundColor: 'var(--glass-card-bg)',
                                  border: '1px solid var(--glass-card-border)',
                                  borderRadius: '8px',
                                  fontSize: '0.85rem'
                                }}
                              >
                                <div>
                                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                    {titleCase(item.product_name) || `Product #${item.product_id}`}
                                  </span>
                                  <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                                    (x{item.quantity} units @ {item.unit_price.toFixed(2)} FCFA)
                                  </span>
                                </div>
                                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                                  {(item.quantity * item.unit_price).toFixed(2)} FCFA
                                </span>
                              </div>
                            ))
                          ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No item details stored.</p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </Table>
      </Card>
    </div>
  );
};

export default Sales;
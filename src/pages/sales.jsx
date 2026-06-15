import React, { useState, useEffect } from 'react';
import { getAllSales, releaseEscrow, disputeTransaction, resolveDispute, submitStoreResponse } from '../services/salesService';
import Card from '../components/card';
import Table from '../components/table';
import Button from '../components/button';
import { useRole } from '../hooks/useRole';
import { WarningIcon, RefundIcon, CashIcon, MomoIcon } from '../components/icons';

const titleCase = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.trim().split(/\s+/).map(word => word[0]?.toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const getProductEmoji = (category, name) => {
  const cat = category?.toLowerCase() || '';
  const n = name?.toLowerCase() || '';
  
  if (cat.includes('dairy') || n.includes('milk') || n.includes('cheese') || n.includes('butter')) return '🥛';
  if (cat.includes('bakery') || n.includes('bread') || n.includes('baguette') || n.includes('croissant') || n.includes('flour')) return '🍞';
  if (cat.includes('beverag') || cat.includes('drink') || n.includes('coffee') || n.includes('tea') || n.includes('juice') || n.includes('soda')) return '☕';
  if (cat.includes('snack') || n.includes('chips') || n.includes('cookie') || n.includes('candy') || n.includes('chocolate')) return '🍪';
  if (cat.includes('vitamin') || cat.includes('pharmacy') || cat.includes('health') || n.includes('pain') || n.includes('pill') || n.includes('tablet') || n.includes('relief')) return '💊';
  if (cat.includes('personal') || n.includes('soap') || n.includes('shampoo') || n.includes('perfume')) return '🧼';
  if (cat.includes('electronic') || cat.includes('accessori') || n.includes('keyboard') || n.includes('mouse') || n.includes('cable') || n.includes('charger') || n.includes('phone') || n.includes('usb')) return '💻';
  
  return '📦';
};

const getSvgFallback = (category, name) => {
  const emoji = getProductEmoji(category, name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="rgba(255,255,255,0.02)"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="40">${emoji}</text></svg>`;
  try {
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  } catch (e) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
};

const getProductImage = (imageUrl, category, name) => {
  if (imageUrl && imageUrl.trim() !== '') return imageUrl;

  const cat = category?.toLowerCase() || '';
  const n = name?.toLowerCase() || '';
  
  if (cat.includes('dairy') || n.includes('milk') || n.includes('cheese') || n.includes('butter')) {
    return 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&auto=format&fit=crop&q=60';
  }
  if (cat.includes('bakery') || n.includes('bread') || n.includes('baguette') || n.includes('croissant') || n.includes('flour')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=60';
  }
  if (cat.includes('beverag') || cat.includes('drink') || n.includes('coffee') || n.includes('tea') || n.includes('juice') || n.includes('soda')) {
    return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=60';
  }
  if (cat.includes('snack') || n.includes('chips') || n.includes('cookie') || n.includes('candy') || n.includes('chocolate')) {
    return 'https://images.unsplash.com/photo-1599490659213-e2b9527b0876?w=400&auto=format&fit=crop&q=60';
  }
  if (cat.includes('vitamin') || cat.includes('pharmacy') || cat.includes('health') || n.includes('pain') || n.includes('pill') || n.includes('tablet') || n.includes('relief')) {
    return 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&auto=format&fit=crop&q=60';
  }
  if (cat.includes('personal') || n.includes('soap') || n.includes('shampoo') || n.includes('perfume')) {
    return 'https://images.unsplash.com/photo-1607006342445-565a4c5f949c?w=400&auto=format&fit=crop&q=60';
  }
  if (cat.includes('electronic') || cat.includes('accessori') || n.includes('keyboard') || n.includes('mouse') || n.includes('cable') || n.includes('charger') || n.includes('phone') || n.includes('usb')) {
    return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=60';
  }
  
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=60';
};

export const Sales = () => {
  const { isTechnician, isAdmin } = useRole();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [verificationPin, setVerificationPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [storeResponses, setStoreResponses] = useState({});
  const [storeResponseLoading, setStoreResponseLoading] = useState({});

  const handleSaveStoreResponse = async (saleId) => {
    const text = storeResponses[saleId]?.trim();
    if (!text) return;
    try {
      setStoreResponseLoading(prev => ({ ...prev, [saleId]: true }));
      const updated = await submitStoreResponse(saleId, text);
      alert("Store response submitted successfully!");
      setSales(prev => prev.map(s => s.id === saleId ? updated : s));
    } catch (err) {
      console.error("Failed to submit store response:", err);
      alert(err.response?.data?.detail || "Failed to submit response. Please try again.");
    } finally {
      setStoreResponseLoading(prev => ({ ...prev, [saleId]: false }));
    }
  };

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
    setVerificationPin('');
    setExpandedSaleId(prev => (prev === id ? null : id));
  };

  const handleVerifyPin = async (saleId) => {
    if (!verificationPin) return;
    try {
      setPinLoading(true);
      const updatedSale = await releaseEscrow(saleId, verificationPin);
      alert("Funds released successfully! Delivery completed.");
      setVerificationPin('');
      setSales(prev => prev.map(s => s.id === saleId ? updatedSale : s));
    } catch (error) {
      console.error("Escrow verification failed:", error);
      alert(error.response?.data?.detail || "Invalid PIN code. Please try again.");
    } finally {
      setPinLoading(false);
    }
  };

  const handleDispute = async (saleId) => {
    if (!window.confirm("Are you sure you want to dispute this transaction? This will freeze the funds under admin review.")) return;
    try {
      const updatedSale = await disputeTransaction(saleId);
      alert("Transaction placed in dispute. System Technician notified.");
      setSales(prev => prev.map(s => s.id === saleId ? updatedSale : s));
    } catch (error) {
      console.error("Failed to dispute transaction:", error);
      alert(error.response?.data?.detail || "Dispute failed. Please try again.");
    }
  };

  const handleResolveDispute = async (saleId, action) => {
    const actionLabel = action === 'release' ? "force release funds to the merchant" : "force refund funds to the customer";
    if (!window.confirm(`Are you sure you want to resolve this dispute and ${actionLabel}?`)) return;
    try {
      const updatedSale = await resolveDispute(saleId, action);
      alert(`Dispute resolved successfully. Funds ${action === 'release' ? 'released' : 'refunded'}.`);
      setSales(prev => prev.map(s => s.id === saleId ? updatedSale : s));
    } catch (error) {
      console.error("Failed to resolve dispute:", error);
      alert(error.response?.data?.detail || "Resolution failed. Please try again.");
    }
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
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gross value of all sales</span>
        </Card>

        <Card title="Checkout Volume" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--primary-color)', margin: '4px 0 0 0' }}>
            {totalTransactions}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Number of transactions processed</span>
        </Card>

        <Card title="Items Dispensed" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--color-success)', margin: '4px 0 0 0' }}>
            {totalItemsSold}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total units sold and deducted from stock</span>
        </Card>

        <Card title="Avg Basket Value" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
            {averageBasketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FCFA
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average revenue per transaction</span>
        </Card>
      </div>

      {/* Transaction Logs Table */}
      <Card padding="0px" style={{ overflow: 'hidden' }}>
        <Table
          headers={['Transaction ID', 'Timestamp', 'Items Sold', 'Gross Total', 'Details']}
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
                   {/* ID & Payment Method Icon */}
                  <td style={{ padding: '16px 20px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>#{sale.id}</span>
                      {sale.payment_method === 'mobile_money' ? (
                        <MomoIcon size={12} style={{ color: 'var(--accent-color)' }} title="Mobile Money" />
                      ) : (
                        <CashIcon size={12} style={{ color: 'var(--color-success)' }} title="Cash Payment" />
                      )}
                    </div>
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
                      padding: '24px 40px',
                      borderBottom: '1px solid var(--border-sidebar)',
                    }}>
                      <div className="animate-slide-up" style={{
                        display: 'flex',
                        gap: '40px',
                        flexWrap: 'wrap',
                      }}>
                        {/* Left Side: Basket Items */}
                        <div style={{ flex: 1.2, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
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
                                    fontSize: '0.85rem',
                                    gap: '12px'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                    {/* Small image thumbnail in Worker Transaction Ledger details */}
                                    <div style={{
                                      width: '36px',
                                      height: '36px',
                                      borderRadius: '6px',
                                      backgroundColor: 'rgba(255,255,255,0.02)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      overflow: 'hidden',
                                      border: '1px solid var(--glass-card-border, rgba(255,255,255,0.08))',
                                      flexShrink: 0
                                    }}>
                                      <img 
                                        src={getProductImage(item.image_url, item.category, item.product_name)} 
                                        alt={item.product_name} 
                                        onError={(e) => { 
                                          if (!e.currentTarget.dataset.error) {
                                            e.currentTarget.dataset.error = 'true';
                                            e.currentTarget.src = getSvgFallback(item.category, item.product_name);
                                          }
                                        }}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} 
                                      />
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                      <span style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                        {titleCase(item.product_name) || `Product #${item.product_id}`}
                                      </span>
                                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                        x{item.quantity} units @ {item.unit_price.toFixed(2)} FCFA
                                      </span>
                                    </div>
                                  </div>
                                  <span style={{ fontWeight: '700', color: 'var(--text-primary)', flexShrink: 0 }}>
                                    {(item.quantity * item.unit_price).toFixed(2)} FCFA
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No item details stored.</p>
                            )}
                          </div>
                        </div>
                        <div style={{ flex: 0.8, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {sale.payment_method === 'mobile_money' ? (
                            <>
                              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                 <MomoIcon size={14} style={{ color: 'var(--accent-color)' }} /> Payment Audit:
                              </h4>
                              
                              <div style={{
                                padding: '16px',
                                borderRadius: '12px',
                                backgroundColor: 'var(--glass-card-bg)',
                                border: '1px solid var(--glass-card-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                   <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Payment Status:</span>
                                  <span style={{
                                    padding: '3px 10px',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    backgroundColor: 
                                      sale.payment_status === 'completed' ? 'rgba(16, 185, 129, 0.12)' :
                                      sale.payment_status === 'disputed' ? 'rgba(239, 68, 68, 0.12)' :
                                      sale.payment_status === 'refunded' ? 'rgba(100, 116, 139, 0.12)' :
                                      'rgba(245, 158, 11, 0.12)',
                                    color: 
                                      sale.payment_status === 'completed' ? 'var(--color-success)' :
                                      sale.payment_status === 'disputed' ? 'var(--color-danger)' :
                                      sale.payment_status === 'refunded' ? 'var(--text-muted)' :
                                      'var(--accent-color)'
                                  }}>
                                    {sale.payment_status === 'completed' ? 'Released / Completed' :
                                     sale.payment_status === 'disputed' ? 'Disputed' :
                                     sale.payment_status === 'refunded' ? 'Refunded' :
                                     'Held Securely (Pending PIN)'}
                                  </span>
                                </div>

                                {sale.payment_status === 'paid_escrow' && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                                    <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                                      Enter the 4-digit Delivery PIN from the customer's receipt to release money:
                                    </p>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                      <input
                                        type="text"
                                        placeholder="PIN"
                                        value={verificationPin}
                                        onChange={(e) => setVerificationPin(e.target.value)}
                                        maxLength={4}
                                        style={{
                                          padding: '8px',
                                          width: '70px',
                                          backgroundColor: 'var(--input-bg)',
                                          border: '1px solid var(--input-border)',
                                          borderRadius: '6px',
                                          color: 'var(--text-primary)',
                                          fontSize: '1rem',
                                          textAlign: 'center',
                                          fontWeight: 'bold',
                                          outline: 'none'
                                        }}
                                      />
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleVerifyPin(sale.id)}
                                        loading={pinLoading}
                                        disabled={verificationPin.length !== 4}
                                      >
                                        Release Funds
                                      </Button>
                                    </div>
                                    {isAdmin && (
                                      <div style={{ borderTop: '1px dotted rgba(255, 255, 255, 0.08)', paddingTop: '8px', marginTop: '4px' }}>
                                        <Button
                                          variant="danger"
                                          size="sm"
                                          fullWidth
                                          icon={<WarningIcon size={14} />}
                                          onClick={() => handleDispute(sale.id)}
                                        >
                                          File Dispute
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {sale.payment_status === 'disputed' && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)', fontSize: '0.8rem', fontWeight: '600' }}>
                                       <WarningIcon size={14} style={{ color: 'var(--color-danger)' }} /> Under Dispute Review
                                    </div>
                                    
                                    {/* Dispute Details Panel */}
                                    <div style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '12px',
                                      padding: '14px',
                                      borderRadius: '10px',
                                      backgroundColor: 'rgba(239, 68, 68, 0.04)',
                                      border: '1px solid rgba(239, 68, 68, 0.15)'
                                    }}>
                                      <div>
                                        <strong style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--color-danger)', display: 'block', marginBottom: '4px' }}>
                                          Customer Complain / Reason:
                                        </strong>
                                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                                          {sale.dispute_reason || "No reason provided by customer."}
                                        </p>
                                      </div>
                                      
                                      {sale.dispute_picture && (
                                        <div>
                                          <strong style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                                            Visual Evidence:
                                          </strong>
                                          <div style={{ maxWidth: '240px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-sidebar)' }}>
                                            <img 
                                              src={sale.dispute_picture} 
                                              alt="Dispute evidence" 
                                              style={{ width: '100%', height: 'auto', display: 'block' }} 
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Merchant Counter-claim Panel */}
                                    <div style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '12px',
                                      padding: '14px',
                                      borderRadius: '10px',
                                      backgroundColor: 'var(--glass-card-bg)',
                                      border: '1px solid var(--glass-card-border)'
                                    }}>
                                      <strong style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--accent-color)', display: 'block' }}>
                                        Store Counter-Claim Note:
                                      </strong>
                                      {sale.store_dispute_response ? (
                                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                                          {sale.store_dispute_response}
                                        </p>
                                      ) : !isTechnician ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                                            Submit the store's counter-complaint explanation regarding this delivery for the System Technician to review:
                                          </p>
                                          <textarea
                                            placeholder="Describe the store's response (e.g. proof of courier dispatch, packed items check)..."
                                            rows={3}
                                            value={storeResponses[sale.id] || ''}
                                            onChange={e => setStoreResponses(prev => ({ ...prev, [sale.id]: e.target.value }))}
                                            style={{
                                              width: '100%',
                                              padding: '10px',
                                              borderRadius: '8px',
                                              border: '1px solid var(--input-border)',
                                              backgroundColor: 'var(--input-bg)',
                                              color: 'var(--text-primary)',
                                              outline: 'none',
                                              resize: 'none',
                                              boxSizing: 'border-box',
                                              fontSize: '0.82rem',
                                              fontFamily: 'inherit'
                                            }}
                                          />
                                          <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleSaveStoreResponse(sale.id)}
                                            loading={storeResponseLoading[sale.id]}
                                            disabled={!(storeResponses[sale.id]?.trim())}
                                            style={{ alignSelf: 'flex-end' }}
                                          >
                                            Submit Counter-Claim
                                          </Button>
                                        </div>
                                      ) : (
                                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                          No store response has been submitted yet.
                                        </p>
                                      )}
                                    </div>

                                    {isTechnician && (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dotted rgba(255, 255, 255, 0.08)', paddingTop: '10px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--accent-color)', textTransform: 'uppercase' }}>Technician Arbitration:</span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                          <Button
                                            variant="success"
                                            size="sm"
                                            fullWidth
                                            onClick={() => handleResolveDispute(sale.id, 'release')}
                                          >
                                            Force Release
                                          </Button>
                                          <Button
                                            variant="danger"
                                            size="sm"
                                            fullWidth
                                            onClick={() => handleResolveDispute(sale.id, 'refund')}
                                          >
                                            Force Refund
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {sale.payment_status === 'completed' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: '600' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '16px', height: '16px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                     Money released to store.
                                  </div>
                                )}

                                {sale.payment_status === 'refunded' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600' }}>
                                    <RefundIcon size={14} style={{ color: 'var(--text-muted)' }} /> Funds refunded to buyer.
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CashIcon size={14} style={{ color: 'var(--color-success)' }} /> Payment Audit:
                              </h4>
                              
                              <div style={{
                                padding: '16px',
                                borderRadius: '12px',
                                backgroundColor: 'var(--glass-card-bg)',
                                border: '1px solid var(--glass-card-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Method:</span>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    Cash Transaction
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Payment Status:</span>
                                  <span style={{
                                    padding: '3px 10px',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                    color: 'var(--color-success)'
                                  }}>
                                    Completed
                                  </span>
                                </div>
                                <div style={{ borderTop: '1px dotted rgba(255, 255, 255, 0.08)', paddingTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: '600' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '16px', height: '16px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                  Paid & Settled Instantly
                                </div>
                              </div>
                            </>
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
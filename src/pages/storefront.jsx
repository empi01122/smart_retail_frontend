import React, { useState, useEffect, useRef } from 'react';
import { getAllProducts } from '../services/productService';
import { recordSale, getPendingOnlineOrders, confirmOnlineOrder } from '../services/salesService';
import Card from '../components/card';
import Button from '../components/button';
import Modal from '../components/modal';
import { useSettings } from '../hooks/useSettings';
import { CashIcon, MomoIcon, BoxIcon, ReceiptIcon, PrintIcon, LockIcon, WarningIcon, CartIcon, ProductsIcon } from '../components/icons';

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
const TOUR_STEPS = [
  {
    target: '#pos-search-input',
    title: 'Product Search & Filters',
    content: 'Quickly find products by typing their title, description, or code here. You can also filter products by selecting the category badges below.',
    position: 'bottom'
  },
  {
    target: '#pos-product-grid',
    title: 'Store Product Catalog',
    content: 'Browse all available catalog items here. Click on any active product card to immediately add it to the shopping cart.',
    position: 'right'
  },
  {
    target: '#pos-cart-section',
    title: 'Interactive Shopping Cart',
    content: 'Review the customer\'s selections here. You can click "+" or "-" to adjust quantities, remove items, or clear the cart.',
    position: 'left'
  },
  {
    target: '#payment-method-select',
    title: 'Payment Method Selection',
    content: 'Choose how the transaction will be settled. Cash Payment is standard, or select Mobile Money (MoMo) for electronic payment collection.',
    position: 'top'
  },
  {
    target: '#checkout-submit-btn',
    title: 'Complete Transaction',
    content: 'Click here to process the checkout. This will write the transaction to the ledger, deduct stock levels, and generate a printable invoice receipt.',
    position: 'top'
  }
];

export const Storefront = () => {
  const { settings } = useSettings();
  const [products, setProducts] = useState([]);

  // Guided Walkthrough Onboarding Tour States
  const [tourActive, setTourActive] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState(null);

  const handleFinishTour = () => {
    setTourActive(false);
    setCurrentStepIdx(0);
    localStorage.setItem('storefront_tour_completed', 'true');
  };

  useEffect(() => {
    const tourCompleted = localStorage.getItem('storefront_tour_completed');
    if (!tourCompleted) {
      const timer = setTimeout(() => {
        setTourActive(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!tourActive) {
      setHighlightStyle(null);
      return;
    }

    const step = TOUR_STEPS[currentStepIdx];
    if (!step) return;

    const updateSpotlight = () => {
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        setTimeout(() => {
          const updatedRect = el.getBoundingClientRect();
          setHighlightStyle({
            position: 'fixed',
            left: `${updatedRect.left - 8}px`,
            top: `${updatedRect.top - 8}px`,
            width: `${updatedRect.width + 16}px`,
            height: `${updatedRect.height + 16}px`,
            borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)',
            zIndex: 100000,
            pointerEvents: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          });
        }, 300);
      } else {
        setHighlightStyle(null);
      }
    };

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    return () => window.removeEventListener('resize', updateSpotlight);
  }, [tourActive, currentStepIdx]);

  const getPopoverStyle = (step) => {
    const el = document.querySelector(step.target);
    if (!el) return { display: 'none' };
    
    const rect = el.getBoundingClientRect();
    const margin = 16;
    
    const styles = {
      position: 'fixed',
      zIndex: 100001,
      width: '280px',
      backgroundColor: 'var(--bg-sidebar, #111827)',
      border: '1px solid var(--border-sidebar, rgba(255, 255, 255, 0.15))',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), var(--shadow-lg)',
      color: 'var(--text-primary)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    if (step.position === 'bottom') {
      styles.top = `${rect.bottom + margin}px`;
      styles.left = `${rect.left + rect.width / 2 - 140}px`;
    } else if (step.position === 'top') {
      styles.top = `${rect.top - 190 - margin}px`;
      styles.left = `${rect.left + rect.width / 2 - 140}px`;
    } else if (step.position === 'left') {
      styles.top = `${rect.top + rect.height / 2 - 90}px`;
      styles.left = `${rect.left - 280 - margin}px`;
    } else if (step.position === 'right') {
      styles.top = `${rect.top + rect.height / 2 - 90}px`;
      styles.left = `${rect.right + margin}px`;
    }

    // Keep popover inside screen borders
    const numericLeft = parseFloat(styles.left);
    if (!isNaN(numericLeft)) {
      if (numericLeft < 12) styles.left = '12px';
      if (numericLeft + 280 > window.innerWidth - 12) {
        styles.left = `${window.innerWidth - 280 - 12}px`;
      }
    }
    const numericTop = parseFloat(styles.top);
    if (!isNaN(numericTop)) {
      if (numericTop < 12) styles.top = '12px';
      if (numericTop + 200 > window.innerHeight - 12) {
        styles.top = `${window.innerHeight - 200 - 12}px`;
      }
    }

    return styles;
  };
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Shopping Cart state
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  // Checkout States
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  // Simulated MoMo Modal State
  const [showSimulatedMomoModal, setShowSimulatedMomoModal] = useState(false);
  const [simulatedMomoStep, setSimulatedMomoStep] = useState('choose_provider'); // choose_provider | sending_push | success
  const [momoProvider, setMomoProvider] = useState('mtn'); // mtn | orange
  const [momoPhoneNumber, setMomoPhoneNumber] = useState('');

  // Mobile/Tablet responsive view controls
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1024);
  const [cartOpen, setCartOpen] = useState(false);

  // Auto-open/close cart drawer for the guided tour steps on mobile
  useEffect(() => {
    if (tourActive && isMobileView) {
      if (currentStepIdx === 2 || currentStepIdx === 3 || currentStepIdx === 4) {
        setCartOpen(true);
      } else {
        setCartOpen(false);
      }
    }
  }, [tourActive, currentStepIdx, isMobileView]);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 1024;
      setIsMobileView(isMobile);
      if (!isMobile) {
        setCartOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Online order notification state
  const [pendingOrders, setPendingOrders] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  const handleConfirmOnlineOrder = async (orderId) => {
    try {
      await confirmOnlineOrder(orderId);
      // Refresh list
      const orders = await getPendingOnlineOrders();
      setPendingOrders(orders);
      alert("Order confirmed & dispatched! You can print the dispatch receipt now.");
    } catch (error) {
      console.error("Failed to confirm online order:", error);
      alert(error.response?.data?.detail || "Failed to confirm order. Please try again.");
    }
  };

  const handlePrintDispatchReceipt = (order) => {
    let container = document.getElementById('printable-receipt-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'printable-receipt-container';
      document.body.appendChild(container);
    }
    
    const itemsHtml = order.items?.map(item => `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:0.88rem;color:#000;">
        <span>${titleCase(item.product_name) || ('Product #' + item.product_id)} (x${item.quantity})</span>
        <span>${(item.unit_price * item.quantity).toFixed(2)} FCFA</span>
      </div>
    `).join('') || '';

    container.innerHTML = `
      <div style="text-align:center;">
        <h2 style="margin:0 0 2px 0;font-size:1.2rem;font-weight:800;color:#000;">${settings?.store_name || 'SMART RETAIL'}</h2>
        <p style="margin:0;font-size:0.7rem;color:#64748b;text-transform:uppercase;">Rider Dispatch Bill</p>
      </div>
      <div style="border-top:1px dashed #000; margin:12px 0;"></div>
      <div style="font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#64748b; margin-bottom:6px;">Order Details</div>
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px; color:#000;"><span><b>Invoice No:</b></span><span>${order.receipt_number || ('#' + order.id)}</span></div>
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px; color:#000;"><span><b>Date:</b></span><span>${new Date(order.created_at).toLocaleString()}</span></div>
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px; color:#000;"><span><b>Payment:</b></span><span>Mobile Money</span></div>
      <div style="border-top:1px dashed #000; margin:12px 0;"></div>
      <div style="font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#64748b; margin-bottom:6px;">Delivery Destination</div>
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px; color:#000;"><span><b>Recipient:</b></span><span>${order.customer_name}</span></div>
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px; color:#000;"><span><b>Phone:</b></span><span>${order.customer_phone}</span></div>
      <div style="font-size:0.85rem;margin-top:4px;color:#000;"><b>Address:</b> ${order.delivery_address}</div>
      ${order.order_note ? `<div style="font-size:0.85rem;margin-top:4px;font-style:italic;color:#000;"><b>Note:</b> "${order.order_note}"</div>` : ''}
      <div style="border-top:1px dashed #000; margin:12px 0;"></div>
      <div style="font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#64748b; margin-bottom:6px;">Items Dispatched</div>
      <div style="color:#000;">
        ${itemsHtml}
      </div>
      <div style="border-top:1px dashed #000; margin:12px 0;"></div>
      <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.05rem; margin-top:10px; color:#000;">
        <span>TOTAL AMOUNT</span>
        <span>${order.total_amount.toLocaleString()} FCFA</span>
      </div>
      <div style="border:2px dashed #b45309; padding:12px; margin:16px 0; text-align:center; background:#fffbeb; border-radius:4px; font-size:0.76rem; color:#78350f; font-weight:bold;">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-weight:bold;margin-bottom:6px;color:#78350f;">
          🔒 <span>CUSTOMER SECURE PIN CHECK</span>
        </div>
        PIN Code is hidden from cashier/rider. Collect the 4-digit verification code from customer delivery book to claim funds.
      </div>
      <div style="border-top:1px dashed #000; margin:12px 0;"></div>
      <div style="font-size:0.75rem;color:#64748b;margin-top:20px;text-align:center;">
        Thank you for shopping with us!
      </div>
    `;

    document.body.classList.add('is-printing-receipt');

    const cleanUp = () => {
      document.body.classList.remove('is-printing-receipt');
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };

    setTimeout(() => {
      window.print();
      setTimeout(cleanUp, 1000);
    }, 100);
  };
  const prevOrderIdsRef = useRef(new Set());
  const timerRef = useRef(null);

  const startSwiftChange = (productId, delta, maxStock) => {
    if (timerRef.current) return;

    const performStep = () => {
      setCart(prevCart => {
        const item = prevCart.find(i => i.product.id === productId);
        if (!item) return prevCart;
        const newQty = item.quantity + delta;
        if (newQty <= 0) {
          return prevCart.filter(i => i.product.id !== productId);
        }
        if (newQty > maxStock) {
          return prevCart;
        }
        return prevCart.map(i =>
          i.product.id === productId ? { ...i, quantity: newQty } : i
        );
      });
    };

    performStep();

    timerRef.current = setTimeout(() => {
      timerRef.current = setInterval(performStep, 80);
    }, 350);
  };

  const stopSwiftChange = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        clearInterval(timerRef.current);
      }
    };
  }, []);



  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading storefront products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Poll for new online orders every 25 seconds
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const orders = await getPendingOnlineOrders();
        const newIds = new Set(orders.map(o => o.id));
        // If any IDs are new, open the panel automatically
        const hasNew = orders.some(o => !prevOrderIdsRef.current.has(o.id));
        if (hasNew && orders.length > 0) setNotifOpen(true);
        prevOrderIdsRef.current = newIds;
        setPendingOrders(orders);
      } catch (_) {
        // Silently fail — cashier may not have internet briefly
      }
    };
    fetchPending(); // immediate first call
    const interval = setInterval(fetchPending, 25000);
    return () => clearInterval(interval);
  }, []);

  // Filter products by search query and category
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Cart operations
  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        // Check if adding exceeds inventory
        if (existing.quantity >= product.stock) {
          alert(`Cannot exceed available inventory (${product.stock} units)`);
          return prevCart;
        }
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, newQuantity, maxStock) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    if (newQuantity > maxStock) {
      alert(`Cannot exceed available inventory (${maxStock} units)`);
      return;
    }
    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setPaymentMethod('cash');
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const saveMomoSale = async () => {
    try {
      setCheckoutLoading(true);
      setCheckoutError('');
      const payload = {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        })),
        payment_method: 'mobile_money',
        created_at: new Date().toISOString()
      };

      const saleResult = await recordSale(payload);
      setReceipt(saleResult);
      setIsCheckoutModalOpen(true);
      clearCart();
      await fetchProducts();
    } catch (error) {
      console.error('Mobile money checkout failed:', error);
      setCheckoutError(
        error.response?.data?.detail || 
        'An unexpected error occurred during checkout. Please verify stock counts.'
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCheckout = async () => {
    console.log("handleCheckout clicked! paymentMethod:", paymentMethod, "cart:", cart);
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    setCheckoutError('');
    
    if (paymentMethod === 'mobile_money') {
      setMomoPhoneNumber(''); // let the user input it
      setMomoProvider('mtn');
      setSimulatedMomoStep('choose_provider');
      setShowSimulatedMomoModal(true);
      setCheckoutLoading(false);
    } else {
      // Cash payment - directly write to DB
      const payload = {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        })),
        payment_method: paymentMethod,
        created_at: new Date().toISOString()
      };

      try {
        const saleResult = await recordSale(payload);
        setReceipt(saleResult);
        setIsCheckoutModalOpen(true);
        clearCart();
        await fetchProducts();
      } catch (error) {
        console.error('Checkout failed:', error);
        setCheckoutError(
          error.response?.data?.detail || 
          'An unexpected error occurred during checkout. Please verify stock counts.'
        );
      } finally {
        setCheckoutLoading(false);
      }
    }
  };

  const renderSimulatedMomoModal = () => {
    if (!showSimulatedMomoModal) return null;

    const handleConfirmSimulatedPayment = () => {
      const phoneVal = momoPhoneNumber.trim();
      if (!phoneVal) {
        alert("Please enter the customer's Mobile Money phone number.");
        return;
      }

      // Stripping country codes
      let localPhone = phoneVal;
      if (phoneVal.startsWith('+237')) {
        localPhone = phoneVal.slice(4);
      } else if (phoneVal.startsWith('237')) {
        localPhone = phoneVal.slice(3);
      }
      localPhone = localPhone.replace(/[\s\-]/g, '');

      if (!/^\d+$/.test(localPhone)) {
        alert("Phone number must contain only digits.");
        return;
      }
      if (localPhone.length !== 9) {
        alert("Cameroonian phone numbers must be exactly 9 digits long (excluding +237).");
        return;
      }
      if (!/^6[5-9]\d{7}$/.test(localPhone)) {
        alert("Invalid Cameroon phone number. Must start with 6 followed by 5, 7, 8, or 9 (e.g. 6XXXXXXXX).");
        return;
      }

      // Update provider based on prefix
      if (localPhone.startsWith('69') || localPhone.startsWith('655') || localPhone.startsWith('656') || localPhone.startsWith('657') || localPhone.startsWith('658') || localPhone.startsWith('659')) {
        setMomoProvider('orange');
      } else {
        setMomoProvider('mtn');
      }

      setMomoPhoneNumber(localPhone);
      setSimulatedMomoStep('sending_push');
      setTimeout(() => {
        setSimulatedMomoStep('success');
        setTimeout(async () => {
          setShowSimulatedMomoModal(false);
          await saveMomoSale();
        }, 1200);
      }, 2500);
    };

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{
          backgroundColor: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '380px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          color: '#ffffff'
        }}>
          {simulatedMomoStep !== 'sending_push' && simulatedMomoStep !== 'success' && (
            <button
              onClick={() => setShowSimulatedMomoModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                fontSize: '1.4rem'
              }}
            >
              ×
            </button>
          )}

          {simulatedMomoStep === 'choose_provider' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: '800' }}>Smart Retail MoMo Pay</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>Select customer's mobile payment provider</p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setMomoProvider('mtn')}
                  style={{
                    flex: 1,
                    padding: '16px 12px',
                    borderRadius: '12px',
                    border: `2px solid ${momoProvider === 'mtn' ? '#F59E0B' : 'rgba(255,255,255,0.05)'}`,
                    backgroundColor: momoProvider === 'mtn' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.02)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FBEB3C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#000', fontSize: '0.82rem' }}>MTN</div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>MTN MoMo</span>
                </button>

                <button
                  onClick={() => setMomoProvider('orange')}
                  style={{
                    flex: 1,
                    padding: '16px 12px',
                    borderRadius: '12px',
                    border: `2px solid ${momoProvider === 'orange' ? '#F97316' : 'rgba(255,255,255,0.05)'}`,
                    backgroundColor: momoProvider === 'orange' ? 'rgba(249, 115, 22, 0.08)' : 'rgba(255,255,255,0.02)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FF6600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#fff', fontSize: '0.82rem' }}>Orange</div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Orange Money</span>
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.55)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Customer MoMo Phone Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 6XXXXXXXX"
                  value={momoPhoneNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMomoPhoneNumber(val);
                    if (val.startsWith('69') || val.startsWith('23769') || val.startsWith('+23769') || val.startsWith('655')) {
                      setMomoProvider('orange');
                    } else if (val.startsWith('67') || val.startsWith('68') || val.startsWith('23767') || val.startsWith('23768')) {
                      setMomoProvider('mtn');
                    }
                  }}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Total Amount:</span>
                  <span style={{ fontWeight: '800', color: '#F59E0B' }}>{cartTotal.toLocaleString()} FCFA</span>
                </div>
              </div>

              <button
                onClick={handleConfirmSimulatedPayment}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: momoProvider === 'mtn' ? '#F59E0B' : '#F97316',
                  color: '#ffffff',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                Simulate Push Request
              </button>
            </div>
          )}

          {simulatedMomoStep === 'sending_push' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px 0', textAlign: 'center' }}>
              <div style={{
                width: '44px',
                height: '44px',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: momoProvider === 'mtn' ? '#F59E0B' : '#F97316',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: '700' }}>Waiting for Approval</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  Sending Mobile Money payment prompt to account <strong>{momoPhoneNumber}</strong>.
                </p>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.4 }}>
                  Please ask the customer to dial {momoProvider === 'mtn' ? '*126#' : '#150#'} on their phone and enter their PIN to approve.
                </p>
              </div>
            </div>
          )}

          {simulatedMomoStep === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0', textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="#10b981" style={{ width: '28px', height: '28px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '800', color: '#10b981' }}>Approved!</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Recording transaction...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handlePrintReceipt = () => {
    if (!receipt) return;
    let container = document.getElementById('printable-receipt-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'printable-receipt-container';
      document.body.appendChild(container);
    }
    
    const itemsHtml = receipt.items?.map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.9rem; color: #000;">
        <span>${titleCase(item.product_name) || ('Product #' + item.product_id)} (${item.quantity})</span>
        <span>${(item.unit_price * item.quantity).toFixed(2)} FCFA</span>
      </div>
    `).join('') || '';

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0 0 4px 0; font-size: 1.2rem; font-weight: 800; color: #000;">
          ${settings?.store_name ? settings.store_name.toUpperCase() : 'SMART RETAIL'}
        </h2>
        <p style="margin: 0; font-size: 0.75rem; text-transform: uppercase; color: #64748b;">
          Transaction Receipt
        </p>
      </div>
      
      <div style="border-top: 1px dashed #000; margin: 12px 0;"></div>
      
      <p style="margin: 0 0 6px 0; font-size: 0.85rem; color: #000;"><strong>RECEIPT ID:</strong> ${receipt.receipt_number || ('#' + receipt.id)}</p>
      <p style="margin: 0 0 6px 0; font-size: 0.85rem; color: #000;"><strong>DATE:</strong> ${new Date(receipt.created_at).toLocaleString()}</p>
      <p style="margin: 0 0 12px 0; font-size: 0.85rem; color: #000;"><strong>PAYMENT:</strong> ${receipt.payment_method === 'mobile_money' ? 'Mobile Money' : 'Cash'}</p>
      
      <div style="border-top: 1px dashed #000; margin: 12px 0;"></div>
      
      <div style="margin: 12px 0; color: #000;">
        ${itemsHtml}
      </div>
      
      <div style="border-top: 1px dashed #000; margin: 12px 0;"></div>
      
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.05rem; margin-top: 10px; color: #000;">
        <span>TOTAL AMOUNT</span>
        <span>${receipt.total_amount.toFixed(2)} FCFA</span>
      </div>
      
      ${receipt.payment_status === "paid_escrow" ? `
        <div style="border: 2px dashed #b45309; padding: 12px; margin: 16px 0; text-align: center; background-color: #fef3c7; border-radius: 4px;">
          <span style="font-weight: bold; font-size: 0.82rem; color: #b45309; display: block; text-transform: uppercase;">Secure Payment Enabled</span>
          <p style="margin: 4px 0 8px 0; font-size: 0.74rem; color: #78350f; line-height: 1.3;">Share this PIN with delivery staff only after receiving items:</p>
          <div style="font-size: 1.5rem; font-weight: 800; letter-spacing: 0.12em; margin-top: 6px; color: #b45309;">${receipt.delivery_pin}</div>
        </div>
      ` : ''}
      
      <div style="border-top: 1px dashed #000; margin: 12px 0;"></div>
      
      <p style="margin-top: 30px; font-size: 0.8rem; color: #64748b; text-align: center;">Thank you for shopping with us!</p>
    `;

    document.body.classList.add('is-printing-receipt');

    const cleanUp = () => {
      document.body.classList.remove('is-printing-receipt');
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };

    setTimeout(() => {
      window.print();
      setTimeout(cleanUp, 1000);
    }, 100);
  };

  return (
    <>
      <div className="pos-layout-container animate-fade-in" style={{ flexDirection: isMobileView ? 'column' : 'row' }}>
      
      {/* LEFT COLUMN: Catalog / Product Selection (Flexible Grid) */}
      <div style={{
        flex: 1.8,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxHeight: '100%',
        minHeight: 0
      }}>
        
        {/* Header and filters */}
        <div className="pos-header-filters" style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="pos-terminal-title" style={{ margin: 0 }}>Register Terminal</h1>
              
              {/* Help Tour */}
              <button
                onClick={() => {
                  setTourActive(true);
                  setCurrentStepIdx(0);
                }}
                className="help-tour-btn"
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
                Help Tour
              </button>

              {/* Online Orders Notifier (both mobile & desktop) */}
              <button
                onClick={() => setNotifOpen(o => !o)}
                style={{
                  background: pendingOrders.length > 0 ? 'rgba(245,158,11,0.15)' : 'var(--glass-card-bg)',
                  border: `1px solid ${pendingOrders.length > 0 ? 'rgba(245,158,11,0.4)' : 'var(--glass-card-border)'}`,
                  borderRadius: '10px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  color: pendingOrders.length > 0 ? '#f59e0b' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  transition: 'var(--transition-fast)'
                }}
                title="Online Orders"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                {isMobileView ? '' : 'Online Orders'}
                {pendingOrders.length > 0 && (
                  <span style={{ backgroundColor: '#ef4444', color: '#fff', borderRadius: '20px', padding: '1px 6px', fontSize: '0.68rem', fontWeight: '800', marginLeft: '6px' }}>{pendingOrders.length}</span>
                )}
              </button>

              {/* Mobile Cart toggle button */}
              {isMobileView && (
                <button
                  id="mobile-cart-toggle-btn"
                  onClick={() => setCartOpen(o => !o)}
                  style={{
                    background: cart.length > 0 ? 'var(--primary-color)' : 'var(--glass-card-bg)',
                    border: `1px solid ${cart.length > 0 ? 'var(--primary-color)' : 'var(--glass-card-border)'}`,
                    borderRadius: '10px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    color: cart.length > 0 ? '#fff' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    transition: 'var(--transition-fast)'
                  }}
                  title="Cart Ledger"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                  <span>Cart</span>
                  {cart.length > 0 && (
                    <span style={{
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </button>
              )}
            </div>
            <span className="pos-total-items-badge" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Total items active: <strong>{products.length}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                id="pos-search-input"
                type="text"
                placeholder="Search products by title, details or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: '40px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              />
              <span style={{ position: 'absolute', left: '16px', top: '13px', fontSize: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.5 5.5a7.5 7.5 0 0010.5 10.5z" /></svg></span>
            </div>
          </div>

          {/* Mobile Category Dropdown Select */}
          <div className="mobile-category-filter">
            <select
              id="mobile-storefront-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--input-border)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {categories.map(category => (
                <option key={category} value={category} style={{ backgroundColor: 'var(--bg-sidebar, #111827)', color: '#fff' }}>
                  {category === 'All' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Category badges */}
          <div className="category-scroll-container desktop-category-filters">
            {categories.map(category => (
              <button
                key={category}
                id={`category-${category.toLowerCase()}`}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  backgroundColor: selectedCategory === category ? 'var(--primary-color)' : 'var(--glass-card-bg)',
                  color: selectedCategory === category ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'var(--transition-fast)'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', background: 'rgba(255, 255, 255, 0.01)', border: '1px dotted rgba(255,255,255,0.08)', borderRadius: '16px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '56px', height: '56px', marginBottom: '10px', color: 'var(--text-muted)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M15 12H9" /></svg>
            <p style={{ color: 'var(--text-muted)' }}>No products match your criteria.</p>
          </div>
        ) : (
          <div id="pos-product-grid" className="pos-product-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '10px',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            paddingRight: '4px'
          }}>
            {filteredProducts.map((product) => {
              const outOfStock = product.stock <= 0;
              const lowStock = product.stock > 0 && product.stock <= 5;
              
              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  onClick={() => !outOfStock && addToCart(product)}
                  className="pos-product-card"
                  style={{
                    backgroundColor: 'var(--glass-card-bg)',
                    border: '1px solid var(--glass-card-border)',
                    cursor: outOfStock ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: outOfStock ? 0.5 : 1,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (!outOfStock) {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                      e.currentTarget.style.backgroundColor = 'var(--input-bg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--glass-card-border)';
                    e.currentTarget.style.backgroundColor = 'var(--glass-card-bg)';
                  }}
                >
                  {/* Category Pill */}
                  {product.category && (
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      zIndex: 10,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.62rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      backgroundColor: 'rgba(0, 0, 0, 0.65)',
                      color: '#ffffff',
                      backdropFilter: 'blur(4px)'
                    }}>
                      {product.category}
                    </span>
                  )}

                  {/* Cover Image container */}
                  <div className="pos-product-img-container" style={{
                    width: '100%',
                    backgroundColor: 'rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderBottom: '1px solid var(--glass-card-border)',
                    flexShrink: 0
                  }}>
                    <img 
                      src={getProductImage(product.image_url, product.category, product.name)} 
                      alt={product.name} 
                      onError={(e) => { 
                        if (!e.currentTarget.dataset.error) {
                          e.currentTarget.dataset.error = 'true';
                          e.currentTarget.src = getSvgFallback(product.category, product.name);
                        }
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: 'var(--glass-card-bg, rgba(255, 255, 255, 0.02))' }} 
                    />
                  </div>

                  {/* Card content with padding */}
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
                    <h3 style={{
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      margin: '0 0 2px 0',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      whiteSpace: 'normal',
                      color: 'var(--text-primary)',
                      display: '-webkit-box',
                      WebkitLineClamp: '2',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '2.4em',
                      lineHeight: '1.2'
                    }}>
                      {titleCase(product.name)}
                    </h3>

                    <p className="pos-product-desc" style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      margin: '0 0 8px 0',
                      lineHeight: '1.25',
                      flexGrow: 1,
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      display: '-webkit-box',
                      WebkitLineClamp: '2',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '2.5em'
                    }}>
                      {product.description || 'No description provided.'}
                    </p>

                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '2px', 
                      marginTop: 'auto',
                      alignItems: 'flex-start',
                      width: '100%'
                    }}>
                      <span style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                        {Math.round(product.price).toLocaleString()} FCFA
                      </span>
                      
                      {/* Stock status indicator */}
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        color: outOfStock ? 'var(--color-danger)' : lowStock ? 'var(--color-warning)' : 'var(--color-success)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%'
                      }}>
                        {outOfStock ? 'Out of stock' : lowStock ? `Only ${product.stock} left` : `${product.stock} units`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Interactive Shopping Cart (POS Side Drawer) */}
      {(!isMobileView || cartOpen) && (
        <div 
          className={isMobileView ? "pos-cart-drawer-backdrop" : ""} 
          onClick={isMobileView ? () => setCartOpen(false) : undefined}
        >
          <div
            id="pos-cart-section"
            className={isMobileView ? "pos-cart-drawer-content" : ""}
            onClick={(e) => isMobileView && e.stopPropagation()}
            style={!isMobileView ? {
              flex: 1.1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              height: '100%',
              maxHeight: '100%'
            } : {
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              width: '100%'
            }}
          >
            <Card
              title="Shopping Cart"
              subtitle={isMobileView ? null : "Customer selection ledger"}
              padding={isMobileView ? '16px' : '24px'}
              style={{ height: '100%', background: 'var(--bg-sidebar)', border: '1px solid var(--border-sidebar)' }}
              actions={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Clear Cart
                    </button>
                  )}
                  {isMobileView && (
                    <button
                      onClick={() => setCartOpen(false)}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: 'var(--text-primary)',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        lineHeight: 1
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              }
            >
          {checkoutError && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: 'var(--color-danger)',
              fontSize: '0.8rem',
              marginBottom: '16px',
              lineHeight: 1.4
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <WarningIcon size={14} />
                <span>{checkoutError}</span>
              </div>
            </div>
          )}
          {/* Cart item list */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, marginBottom: '20px', paddingRight: '4px' }}>
            {cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '100px', color: 'var(--text-muted)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '48px', height: '48px', marginBottom: '10px', color: 'var(--text-muted)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>                <p style={{ fontSize: '0.85rem' }}>Basket is empty. Select products to begin.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cart.map(item => (
                  <div
                    key={item.product.id}
                    className="pos-cart-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      backgroundColor: 'var(--glass-card-bg)',
                      border: '1px solid var(--glass-card-border)',
                      borderRadius: '8px'
                    }}
                  >
                    {/* Small image thumbnail in POS checkout cart ledger */}
                    <div className="pos-cart-item-img" style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.05)',
                      flexShrink: 0
                    }}>
                      <img 
                        src={getProductImage(item.product.image_url, item.product.category, item.product.name)} 
                        alt={item.product.name} 
                        onError={(e) => { 
                          if (!e.currentTarget.dataset.error) {
                            e.currentTarget.dataset.error = 'true';
                            e.currentTarget.src = getSvgFallback(item.product.category, item.product.name);
                          }
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} 
                      />
                    </div>

                    <div className="pos-cart-item-info" style={{ flex: 1, overflow: 'hidden' }}>
                      <h4 style={{ fontSize: '0.85rem', margin: 0, wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'normal', lineHeight: 1.3 }}>
                        {titleCase(item.product.name)}
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {Math.round(item.product.price).toLocaleString()} FCFA each
                      </span>
                    </div>

                    {/* Quantity controls */}
                    <div className="pos-cart-item-qty" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onMouseDown={() => startSwiftChange(item.product.id, -1, item.product.stock)}
                        onMouseUp={stopSwiftChange}
                        onMouseLeave={stopSwiftChange}
                        onTouchStart={(e) => { e.preventDefault(); startSwiftChange(item.product.id, -1, item.product.stock); }}
                        onTouchEnd={stopSwiftChange}
                        onClick={(e) => e.preventDefault()}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          border: '1px solid var(--glass-card-border)',
                          backgroundColor: 'var(--glass-card-bg)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          userSelect: 'none'
                        }}
                      >
                        -
                      </button>
                      
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0, item.product.stock)}
                        style={{
                          width: '40px',
                          padding: '2px',
                          textAlign: 'center',
                          backgroundColor: 'var(--glass-card-bg)',
                          border: '1px solid var(--glass-card-border)',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          color: 'var(--text-primary)'
                        }}
                      />

                      <button
                        onMouseDown={() => startSwiftChange(item.product.id, 1, item.product.stock)}
                        onMouseUp={stopSwiftChange}
                        onMouseLeave={stopSwiftChange}
                        onTouchStart={(e) => { e.preventDefault(); startSwiftChange(item.product.id, 1, item.product.stock); }}
                        onTouchEnd={stopSwiftChange}
                        onClick={(e) => e.preventDefault()}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          border: '1px solid var(--glass-card-border)',
                          backgroundColor: 'var(--glass-card-bg)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          userSelect: 'none'
                        }}
                      >
                        +
                      </button>
                    </div>

                    <div className="pos-cart-item-total" style={{ textAlign: 'right', minWidth: '60px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.88rem' }}>
                        {Math.round(item.product.price * item.quantity).toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing breakdowns & Checkout actions */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span>{Math.round(cartTotal).toLocaleString()} FCFA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Tax (0%)</span>
              <span>0.00 FCFA</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '4px 0 12px 0' }}>
              <label htmlFor="payment-method-select" style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.03em' }}>
                Payment Method:
              </label>
              <select
                id="payment-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--input-border)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                <option value="cash">Cash Payment</option>
                <option value="mobile_money">Mobile Money (Secure Payment)</option>
              </select>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.25rem',
              fontWeight: '800',
              borderTop: '1px dotted var(--border-sidebar)',
              paddingTop: '12px',
              marginBottom: '10px'
            }}>
              <span>Total</span>
              <span style={{ color: 'var(--accent-color)' }}>{Math.round(cartTotal).toLocaleString()} FCFA</span>
            </div>

            <Button
              id="checkout-submit-btn"
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleCheckout}
              disabled={cart.length === 0}
              loading={checkoutLoading}
            >
              Process Transaction
            </Button>
          </div>
        </Card>
          </div>
        </div>
      )}

      {/* RECEIPT POPUP MODAL (Visual Confirmation) */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ReceiptIcon size={20} style={{ color: 'var(--primary-color)' }} />
            <span>Transaction Successful</span>
          </div>
        }
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={handlePrintReceipt} variant="secondary" icon={<PrintIcon size={16} />}>
              Print Receipt
            </Button>
            <Button onClick={() => setIsCheckoutModalOpen(false)} variant="primary">
              Done
            </Button>
          </div>
        }
      >
        {receipt && (
          <div style={{
            fontFamily: "'Courier New', Courier, monospace",
            backgroundColor: '#ffffff',
            color: '#1e293b',
            padding: '24px',
            borderRadius: '2px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            maxWidth: '340px',
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#0f172a', fontFamily: 'inherit', margin: '0 0 4px 0', fontWeight: '800' }}>
                {settings?.store_name ? settings.store_name.toUpperCase() : 'SMART RETAIL'}
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Transaction Receipt
              </p>
            </div>

            <div style={{ borderBottom: '1px dashed #94a3b8', marginBottom: '12px' }} />

            <p style={{ margin: '0 0 4px 0' }}><strong>RECEIPT ID:</strong> {receipt.receipt_number || `#${receipt.id}`}</p>
            <p style={{ margin: '0 0 4px 0' }}><strong>DATE:</strong> {new Date(receipt.created_at).toLocaleString()}</p>
            <p style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong>PAYMENT:</strong>
              {receipt.payment_method === 'mobile_money' ? (
                <>
                  <MomoIcon size={14} style={{ color: '#0f172a' }} />
                  <span style={{ marginLeft: '4px' }}>Mobile Money</span>
                </>
              ) : (
                <>
                  <CashIcon size={14} style={{ color: '#0f172a' }} />
                  <span style={{ marginLeft: '4px' }}>Cash</span>
                </>
              )}
            </p>
            
            <div style={{ borderBottom: '1px dashed #94a3b8', marginBottom: '12px' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {receipt.items?.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{titleCase(item.product_name) || `Product #${item.product_id}`} ({item.quantity})</span>
                  <span>{(item.unit_price * item.quantity).toFixed(2)} FCFA</span>
                </div>
              ))}
            </div>

            <div style={{ borderBottom: '1px dashed #94a3b8', marginBottom: '12px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: '#0f172a', fontWeight: 'bold' }}>
              <span>TOTAL AMOUNT</span>
              <span>{receipt.total_amount.toFixed(2)} FCFA</span>
            </div>

            {/* Escrow System Protection Badge — PIN is on printed receipt ONLY, not shown on screen */}
            {receipt.payment_status === "paid_escrow" && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#fef3c7',
                border: '1px dashed #d97706',
                borderRadius: '4px',
                color: '#b45309',
                textAlign: 'center'
              }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <LockIcon size={14} style={{ color: '#b45309' }} /> Secure Payment Active
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.45, color: '#78350f' }}>
                  Payment is held securely. <strong>Print and hand the receipt to the customer.</strong>
                  <br />The delivery verification PIN is printed on the receipt only.
                </p>
              </div>
            )}

            <div style={{ borderBottom: '1px dashed #94a3b8', marginTop: '16px', marginBottom: '16px' }} />

            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}>
              Thank you for shopping with us!
            </div>
          </div>
        )}
      </Modal>



      {/* ─── Notification Panel Overlay ─── */}
      {notifOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
          <div onClick={() => setNotifOpen(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '420px', backgroundColor: 'var(--bg-sidebar, #1e293b)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.4)', overflow: 'hidden' }}>

            {/* Panel header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-sidebar, rgba(255,255,255,0.07))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: pendingOrders.length > 0 ? 'rgba(245,158,11,0.08)' : 'transparent' }}>
              <div>
                <h2 style={{ margin: '0 0 2px 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>Online Orders</h2>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted, rgba(255,255,255,0.45))' }}>
                  {pendingOrders.length === 0 ? 'No pending orders right now.' : `${pendingOrders.length} order(s) awaiting dispatch`}
                </p>
              </div>
              <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted, rgba(255,255,255,0.4))', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
            </div>

            {/* Orders list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {pendingOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted, rgba(255,255,255,0.25))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '40px', height: '40px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>All clear — no pending online orders.</p>
                </div>
              ) : pendingOrders.map(order => (
                <div key={order.id} style={{ backgroundColor: 'var(--glass-card-bg, rgba(255,255,255,0.03))', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Order stripe */}
                  <div style={{ padding: '12px 16px', backgroundColor: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f59e0b' }}>Online Order #{order.id}</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-muted, rgba(255,255,255,0.5))' }}>{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#f59e0b' }}>{order.total_amount.toLocaleString()} FCFA</span>
                  </div>

                  {/* Customer info */}
                  <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                    {[
                      { label: 'Customer', value: order.customer_name },
                      { label: 'Phone', value: order.customer_phone },
                      { label: 'Address', value: order.delivery_address },
                    ].map(row => row.value && (
                      <div key={row.label} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--text-secondary, rgba(255,255,255,0.7))', minWidth: '58px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', paddingTop: '2px' }}>{row.label}</span>
                        <span style={{ color: 'var(--text-primary, #ffffff)', lineHeight: 1.4, fontWeight: '500' }}>{row.value}</span>
                      </div>
                    ))}
                    {order.order_note && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--text-secondary, rgba(255,255,255,0.7))', minWidth: '58px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', paddingTop: '2px' }}>Note</span>
                        <span style={{ color: '#f59e0b', fontStyle: 'italic', lineHeight: 1.4, fontWeight: '500' }}>"{order.order_note}"</span>
                      </div>
                    )}

                    {/* Items */}
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-sidebar, rgba(255,255,255,0.1))' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary, rgba(255,255,255,0.6))', letterSpacing: '0.05em' }}>Items Ordered</span>
                      <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {order.items?.map(item => (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', gap: '8px', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                              {/* Small image thumbnail in Worker Pending Online Orders list */}
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(255,255,255,0.02)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.05)',
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
                                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1px' }} 
                                />
                              </div>
                              <span style={{ color: 'var(--text-primary, #ffffff)', textTransform: 'capitalize', fontWeight: '500', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {item.product_name || `Product #${item.product_id}`} × {item.quantity}
                              </span>
                            </div>
                            <span style={{ color: 'var(--text-secondary, rgba(255,255,255,0.75))', fontWeight: '600', flexShrink: 0 }}>{(item.unit_price * item.quantity).toFixed(2)} FCFA</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border-sidebar, rgba(255,255,255,0.1))', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {order.is_confirmed ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#10b981', fontSize: '0.8rem', fontWeight: '800', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <span>✓ Dispatched / Awaiting Delivery PIN</span>
                          </div>
                          <button
                            onClick={() => handlePrintDispatchReceipt(order)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: 'rgba(255, 255, 255, 0.08)',
                              color: 'var(--text-primary, #fff)',
                              fontWeight: '700',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '14px', height: '14px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg>
                            Print Dispatch Receipt
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button
                            onClick={() => handlePrintDispatchReceipt(order)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-sidebar, rgba(255,255,255,0.15))',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--text-primary, #fff)',
                              fontWeight: '700',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '14px', height: '14px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg>
                            Print / Save Dispatch Receipt
                          </button>
                          <button
                            onClick={async () => {
                              handlePrintDispatchReceipt(order);
                              await handleConfirmOnlineOrder(order.id);
                            }}
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: '#f59e0b',
                              color: '#000',
                              fontWeight: '800',
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                            onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                          >
                            Confirm & Dispatch Order
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            {pendingOrders.length > 0 && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-sidebar, rgba(255,255,255,0.07))', fontSize: '0.74rem', color: 'var(--text-muted, rgba(255,255,255,0.3))', textAlign: 'center', lineHeight: 1.5 }}>
                Dispatch your rider. Money releases in the Transaction Ledger once the customer writes their PIN in the delivery book.
              </div>
            )}
          </div>
        </div>
      )}
      </div>
      {renderSimulatedMomoModal()}

      {/* Guided Onboarding Walkthrough Tour Overlay & Bubble */}
      {tourActive && highlightStyle && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'none' }}>
          {/* Spotlight Mask */}
          <div style={highlightStyle} />
          
          {/* Popover Bubble */}
          <div style={{ ...getPopoverStyle(TOUR_STEPS[currentStepIdx]), pointerEvents: 'auto' }}>
            {/* Step header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Step {currentStepIdx + 1} of {TOUR_STEPS.length}
              </span>
              <button
                onClick={handleFinishTour}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Title & Description */}
            <h4 style={{ fontSize: '0.92rem', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              {TOUR_STEPS[currentStepIdx].title}
            </h4>
            <p style={{ fontSize: '0.82rem', lineHeight: '1.45', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              {TOUR_STEPS[currentStepIdx].content}
            </p>

            {/* Navigation Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleFinishTour}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                Skip
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                {currentStepIdx > 0 && (
                  <button
                    onClick={() => setCurrentStepIdx(prev => prev - 1)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                  >
                    Back
                  </button>
                )}
                
                <button
                  onClick={() => {
                    if (currentStepIdx < TOUR_STEPS.length - 1) {
                      setCurrentStepIdx(prev => prev + 1);
                    } else {
                      handleFinishTour();
                    }
                  }}
                  style={{
                    background: 'var(--primary-color)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                >
                  {currentStepIdx === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Storefront;
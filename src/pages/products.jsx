import React, { useState, useEffect } from 'react';
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';
import { useRole } from '../hooks/useRole';
import Card from '../components/card';
import Button from '../components/button';
import Table from '../components/table';
import Modal from '../components/modal';
import { BoxIcon, PencilIcon } from '../components/icons';

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

export const Products = () => {
  const { isAdmin, isEmployee } = useRole();
  const canManage = isAdmin || isEmployee;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image_url: ''
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching inventory products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(search.toLowerCase())) ||
                          (product.category && product.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Open modal for creating new item
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '0',
      category: '',
      image_url: ''
    });
    setModalMode('create');
    setIsModalOpen(true);
  };

  // Open modal for editing existing item
  const handleOpenEdit = (product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category || '',
      image_url: product.image_url || ''
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500; // Optimal width for product grid display
          const MAX_HEIGHT = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to medium-quality JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFormData(prev => ({ ...prev, image_url: compressedDataUrl }));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert('Product Name and Price are required.');
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock) || 0,
      category: formData.category || null,
      image_url: formData.image_url || null
    };

    try {
      setFormLoading(true);
      if (modalMode === 'create') {
        await createProduct(payload);
      } else {
        await updateProduct(currentProduct.id, payload);
      }
      setIsModalOpen(false);
      await fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please check inputs.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this product?')) {
      return;
    }

    try {
      await deleteProduct(id);
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product.');
    }
  };

  const renderStockProgress = (stock) => {
    const maxBarVal = 50; // Arbitrary value for visual fullness
    const percent = Math.min((stock / maxBarVal) * 100, 100);
    
    let color = 'var(--color-success)';
    if (stock === 0) color = 'var(--color-danger)';
    else if (stock <= 5) color = 'var(--color-warning)';

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '120px' }}>
        <div style={{
          flex: 1,
          height: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '3px',
            boxShadow: `0 0 8px ${color}`
          }} />
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: stock === 0 ? 'var(--color-danger)' : stock <= 5 ? 'var(--color-warning)' : '#ffffff' }}>
          {stock}
        </span>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      
      {/* Search filters and Add button */}
      <div className="inventory-header-row" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div className="inventory-title-block">
          <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>Inventory Catalog</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {canManage ? 'Create, view, edit or delete items.' : 'View current items in stock.'}
          </p>
        </div>

        {canManage && (
          <Button
            id="add-product-btn"
            variant="primary"
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
            onClick={handleOpenCreate}
          >
            Add New Product
          </Button>
        )}
      </div>

      {/* Filter panel */}
      <Card className="inventory-filter-card" style={{ padding: '16px' }}>
        <div className="inventory-filter-container" style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div className="inventory-search-wrapper" style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <input
              id="inventory-search-input"
              type="text"
              placeholder="Search catalog..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
            <span style={{ position: 'absolute', left: '16px', top: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.5 5.5a7.5 7.5 0 0010.5 10.5z" /></svg></span>
          </div>

          {/* Mobile Category Dropdown Select */}
          <div className="mobile-category-filter">
            <label htmlFor="mobile-category-select" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Filter by Category:</label>
            <select
              id="mobile-category-select"
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

          {/* Desktop Category Buttons */}
          <div className="desktop-category-filters">
            {categories.map(category => (
              <button
                key={category}
                id={`filter-category-${category.toLowerCase()}`}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
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
      </Card>

      {/* Catalog Table */}
      <Card className="inventory-table-card" padding="0px" style={{ overflow: 'hidden' }}>
        <Table
          id="products-table"
          headers={
            canManage 
              ? ['ID', 'Product Info', 'Category', 'Price', 'Stock Level', 'Actions']
              : ['ID', 'Product Info', 'Category', 'Price', 'Stock Level']
          }
          loading={loading}
          emptyMessage="No products registered in the inventory."
        >
          {filteredProducts.map((product) => (
            <tr
              key={product.id}
              id={`inventory-row-${product.id}`}
              style={{
                borderBottom: '1px solid var(--border-sidebar)',
                transition: 'var(--transition-fast)'
              }}
              className="table-row-hover"
            >
              {/* ID */}
              <td data-label="ID" style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600' }}>
                #{product.id}
              </td>

              {/* Product Info */}
              <td data-label="Product Info" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--glass-card-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '1px solid var(--glass-card-border)',
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
                  <div>
                    <h4 style={{ fontSize: '0.92rem', margin: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{titleCase(product.name)}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {product.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </td>

              {/* Category */}
              <td data-label="Category" style={{ padding: '16px 20px' }}>
                {product.category ? (
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backgroundColor: 'var(--glass-card-bg)',
                    color: 'var(--text-secondary)'
                  }}>
                    {product.category}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unclassified</span>
                )}
              </td>

              {/* Price */}
              <td data-label="Price" style={{ padding: '16px 20px', fontWeight: '800', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                {product.price.toFixed(2)} FCFA
              </td>

              {/* Stock Progress bar */}
              <td data-label="Stock Level" style={{ padding: '16px 20px' }}>
                {renderStockProgress(product.stock)}
              </td>

              {/* Actions (Staff Only) */}
              {canManage && (
                <td data-label="Actions" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      id={`edit-btn-${product.id}`}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenEdit(product)}
                    >
                      Edit
                    </Button>
                    <Button
                      id={`delete-btn-${product.id}`}
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </Table>
      </Card>

      {/* CREATE & EDIT DIALOG MODAL (Admin Only) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalMode === 'create' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BoxIcon size={20} style={{ color: 'var(--primary-color)' }} />
              <span>Register New Product</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PencilIcon size={20} style={{ color: 'var(--primary-color)' }} />
              <span>Edit Product #{currentProduct?.id}</span>
            </div>
          )
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label htmlFor="name">Product Name *</label>
            <input
              id="product-form-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Organic Milk"
              required
            />
          </div>

          <div>
            <label htmlFor="description">Description</label>
            <textarea
              id="product-form-desc"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="e.g. 1 Litre fresh organic whole milk bottle"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-row">
            <div style={{ flex: 1 }}>
              <label htmlFor="price">Price (FCFA) *</label>
              <input
                id="product-form-price"
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="stock">Stock Count</label>
              <input
                id="product-form-stock"
                type="number"
                min="0"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div style={{ flex: 1 }}>
              <label htmlFor="category">Category</label>
              <input
                id="product-form-category"
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g. Dairy, Grocery"
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label>Product Image</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div 
                  onClick={() => document.getElementById('product-file-input').click()}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    border: '2px dashed rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    backgroundColor: 'var(--glass-card-bg)',
                    transition: 'var(--transition-fast)',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
                >
                  <img 
                    src={getProductImage(formData.image_url, formData.category, formData.name)} 
                    alt="Product Preview" 
                    onError={(e) => { 
                      if (!e.currentTarget.dataset.error) {
                        e.currentTarget.dataset.error = 'true';
                        e.currentTarget.src = getSvgFallback(formData.category, formData.name);
                      }
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: 'var(--glass-card-bg, rgba(255, 255, 255, 0.02))' }} 
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input 
                    id="product-file-input"
                    type="file" 
                    accept="image/*"
                    onChange={handleProductFileChange}
                    style={{ display: 'none' }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => document.getElementById('product-file-input').click()}
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '12px', height: '12px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.6-3.7A2.25 2.25 0 0012 9.75H4.5A2.25 2.25 0 002.25 12v5.25c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.75A2.25 2.25 0 0019.5 12h-2.25a2.25 2.25 0 00-1.664.733l-.8 1.05a2.25 2.25 0 01-1.664.733H12a2.25 2.25 0 01-1.664-.733l-.8-1.05a2.25 2.25 0 00-1.664-.733H4.5" />
                      </svg>
                    }
                    style={{ alignSelf: 'flex-start', padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    Choose Photo
                  </Button>
                  <input
                    id="product-form-img"
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="Or paste image URL here..."
                    style={{ fontSize: '0.8rem', padding: '6px 10px', margin: 0 }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '20px',
            borderTop: '1px solid var(--border-sidebar)',
            paddingTop: '16px'
          }}>
            <Button
              id="product-form-cancel"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              id="product-form-submit"
              type="submit"
              variant="primary"
              loading={formLoading}
            >
              {modalMode === 'create' ? 'Create Product' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;
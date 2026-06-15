import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardSummary, getTopProducts, getDashboardInsights, getEnterpriseReviewsAll } from '../services/dashboardService';
import { getAllSales } from '../services/salesService';
import { useSettings } from '../hooks/useSettings';
import { useRole } from '../hooks/useRole';
import Card from '../components/card';
import Button from '../components/button';


export const Dashboard = () => {
  const navigate = useNavigate();
  const { isTechnician, isActualTechnician } = useRole();
  const isSystemTech = isTechnician || isActualTechnician;
  const { settings, loading: settingsLoading } = useSettings();
  const tier = isSystemTech ? 'ultra' : (settings?.subscription_tier || 'free');
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [insights, setInsights] = useState(null);
  const [allReviews, setAllReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const activeEntId = localStorage.getItem('active_enterprise_id') || settings?.id;
      if (activeEntId) {
        const data = await getEnterpriseReviewsAll(activeEntId);
        setAllReviews(data || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Loading states
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [topProductsLoading, setTopProductsLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [refreshingInsights, setRefreshingInsights] = useState(false);

  const getWeekNumber = (date) => {
    const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tempDate.getUTCDay() || 7;
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(),0,1));
    return Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
  };

  const getWeeklySalesDetails = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
    const mondayDiff = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayDiff);
    monday.setHours(0, 0, 0, 0);

    const weekDates = [];
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      weekDates.push(dayDate);
    }

    const groupedSales = {};
    weekDates.forEach(date => {
      const dateStr = date.toISOString().slice(0, 10);
      groupedSales[dateStr] = {
        date: date,
        dayName: weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1],
        sales: [],
        total: 0
      };
    });

    sales.forEach(sale => {
      const saleDateStr = sale.created_at.slice(0, 10);
      if (groupedSales[saleDateStr]) {
        groupedSales[saleDateStr].sales.push(sale);
        groupedSales[saleDateStr].total += sale.total_amount;
      }
    });

    return {
      groupedSales,
      weekDates,
      monday,
      sunday: weekDates[6]
    };
  };

  const titleCase = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.trim().split(/\s+/).map(word => word[0]?.toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  // CSV Export
  const handleExportCSV = () => {
    const { groupedSales, weekDates, monday } = getWeeklySalesDetails();
    const activeDays = Object.values(groupedSales).filter(g => g.sales.length > 0);
    const activeDatesStr = activeDays.map(g => g.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })).join(', ');
    const weekNum = getWeekNumber(monday);
    const storeName = settings?.store_name || 'Smart Retail';
    const currentYear = new Date().getFullYear();
    const timeDownloaded = new Date().toLocaleString();
    const formattedDateRange = `${weekDates[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} to ${weekDates[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    const weeklyRevenueTotal = Object.values(groupedSales).reduce((sum, d) => sum + d.total, 0);
    const totalWeekTransactions = Object.values(groupedSales).reduce((sum, d) => sum + d.sales.length, 0);

    let csvContent = "\ufeff"; // BOM for Excel UTF-8 support
    
    // Header Info (Tabular Banner)
    csvContent += `WEEKLY PERFORMANCE REPORT,Enterprise Name: ${storeName},Report ID: Week ${weekNum} (${formattedDateRange}),Year: ${currentYear},Downloaded At: ${timeDownloaded}\n`;
    csvContent += `Total Weekly Revenue,${weeklyRevenueTotal.toFixed(2)} FCFA,Total Sales Volume,${totalWeekTransactions} Transactions,Average Basket,${(totalWeekTransactions > 0 ? weeklyRevenueTotal / totalWeekTransactions : 0).toFixed(2)} FCFA\n\n`;

    // Daily Performance Table with Excel formula bar graph
    csvContent += `DAILY REVENUE PERFORMANCE TREND CHART\n`;
    csvContent += `Day,Date,Total Sales,Daily Revenue (FCFA),Visual Trend Chart (Excel Formula Bar Graph)\n`;
    
    const maxDayTotal = Math.max(...Object.values(groupedSales).map(d => d.total), 1);
    const scaleVal = maxDayTotal / 15 || 1;

    Object.values(groupedSales).forEach((day, idx) => {
      const rowIdx = 6 + idx; // Row 6 is Monday, Row 12 is Sunday
      const excelGraphFormula = `"=REPT(""█"", ROUND(D${rowIdx}/${scaleVal.toFixed(2)}, 0))"`;
      csvContent += `${day.dayName},${day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })},${day.sales.length},${day.total.toFixed(2)},${excelGraphFormula}\n`;
    });
    // Add total row at Row 13
    csvContent += `Total,,${totalWeekTransactions},${weeklyRevenueTotal.toFixed(2)},"=REPT(""█"", 15)"\n\n`;

    // Itemized Transaction Log Table (Compacted and formatted)
    csvContent += `ITEMIZED WEEKLY TRANSACTION LOGS\n`;
    csvContent += `Date,Time,Transaction ID,Items Sold,Payment Method,Amount (FCFA)\n`;
    Object.values(groupedSales).forEach(day => {
      const dateStr = day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      if (day.sales.length > 0) {
        day.sales.forEach(s => {
          const saleTime = new Date(s.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
          const itemsDesc = s.items?.map(i => `${i.quantity}x ${i.product_name}`).join(' | ') || 'No item data';
          const payMethod = s.payment_method === 'mobile_money' ? 'Mobile Money' : 'Cash';
          csvContent += `${dateStr},${saleTime},#${s.id},"${itemsDesc}",${payMethod},${s.total_amount.toFixed(2)}\n`;
        });
      }
      csvContent += `${dateStr},Day Subtotal,-,-,-,${day.total.toFixed(2)} FCFA\n`;
    });
    csvContent += `\n`;

    // Product Rankings
    csvContent += `WEEKLY BEST SELLING ITEMS\n`;
    csvContent += `Rank,Product Name,Units Sold,Revenue (FCFA)\n`;
    topProducts.forEach((p, idx) => {
      csvContent += `${idx + 1},"${p.product}",${p.units_sold},${p.revenue.toFixed(2)}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const datesCompact = `${weekDates[0].getMonth() + 1}_${weekDates[0].getDate()}_to_${weekDates[6].getMonth() + 1}_${weekDates[6].getDate()}`;
    const safeStoreName = storeName.replace(/[^a-zA-Z0-9]/g, '_');
    const safeDates = (activeDatesStr || formattedDateRange).replace(/[^a-zA-Z0-9]/g, '_');
    const safeTime = timeDownloaded.replace(/[^a-zA-Z0-9]/g, '-').replace(/\s+/g, '_');
    link.setAttribute("href", url);
    link.setAttribute("download", `Report_For_${safeStoreName}_-_Week_${weekNum}_(${safeDates})_-_${currentYear}_${safeTime}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export via html2pdf.js direct download
  const handleExportPDF = () => {
    const { groupedSales, weekDates, monday } = getWeeklySalesDetails();
    const activeDays = Object.values(groupedSales).filter(g => g.sales.length > 0);
    const activeDatesStr = activeDays.map(g => g.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })).join(', ');
    const weekNum = getWeekNumber(monday);
    const storeName = settings?.store_name || 'Smart Retail';
    const currentYear = new Date().getFullYear();
    const timeDownloaded = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const formattedDateRange = `${weekDates[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} to ${weekDates[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    const weeklyRevenueTotal = Object.values(groupedSales).reduce((sum, d) => sum + d.total, 0);

    const getSVGChartHTML = () => {
      const defaultDays = [
        { day: 'Mon', revenue: 0 },
        { day: 'Tue', revenue: 0 },
        { day: 'Wed', revenue: 0 },
        { day: 'Thu', revenue: 0 },
        { day: 'Fri', revenue: 0 },
        { day: 'Sat', revenue: 0 },
        { day: 'Sun', revenue: 0 }
      ];
      
      const dailyRevData = defaultDays.map(d => {
        const matchingDbDay = summary?.daily_revenue?.find(
          dbDay => dbDay.day.toLowerCase().slice(0, 3) === d.day.toLowerCase()
        );
        return {
          day: d.day,
          revenue: matchingDbDay ? matchingDbDay.revenue : 0
        };
      });

      const dataPoints = dailyRevData.map(d => d.revenue);
      const days = dailyRevData.map(d => d.day);
      const maxVal = Math.max(...dataPoints, 1000);
      const minVal = 0;

      const width = 600;
      const height = 180;
      const padding = { top: 20, right: 30, bottom: 25, left: 95 };

      const points = dataPoints.map((val, idx) => {
        const x = padding.left + (idx * (width - padding.left - padding.right) / 6);
        const y = height - padding.bottom - ((val - minVal) / (maxVal - minVal) * (height - padding.top - padding.bottom));
        return { x, y };
      });

      let linePath = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpX1 = prev.x + (curr.x - prev.x) / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (curr.x - prev.x) / 2;
        const cpY2 = curr.y;
        linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
      }

      const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

      const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
        const y = padding.top + ratio * (height - padding.top - padding.bottom);
        const gridVal = Math.round(maxVal - ratio * (maxVal - minVal));
        return `
          <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4 4" />
          <text x="${padding.left - 10}" y="${y}" fill="#64748b" font-size="9px" text-anchor="end" dominant-baseline="middle" font-family="monospace">${gridVal.toLocaleString()}</text>
        `;
      }).join('');

      const xAxisDays = points.map((p, idx) => `
        <text x="${p.x}" y="${height - 6}" fill="#475569" font-size="10px" font-weight="600" text-anchor="middle">${days[idx]}</text>
      `).join('');

      const dots = points.map((p, idx) => `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="#4f46e5" stroke="#ffffff" stroke-width="2" />
      `).join('');      return `
        <div style="margin-top: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 10px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block;">
            ${gridLines}
            ${xAxisDays}
            <path d="${areaPath}" fill="#4f46e5" fill-opacity="0.1" />
            <path d="${linePath}" fill="none" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            ${dots}
          </svg>
        </div>
      `;
    };

    const productsHtml = topProducts.map((p, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 10px;">${p.product}</td>
        <td style="padding: 10px; text-align: center;">${p.units_sold}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold;">${p.revenue.toLocaleString()} FCFA</td>
      </tr>
    `).join('');

    const salesBreakdownHtml = Object.values(groupedSales).map(day => {
      let itemsTable = '';
      if (day.sales.length === 0) {
        itemsTable = `
          <div style="font-style: italic; color: #94a3b8; font-size: 12px; padding: 6px 10px;">
            No transactions recorded on this day.
          </div>
        `;
      } else {
        const rows = day.sales.map(s => {
          const saleTime = new Date(s.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const itemsDesc = s.items?.map(i => `${i.quantity}x ${titleCase(i.product_name)}`).join(', ') || 'No item data';
          const payMethod = s.payment_method === 'mobile_money' ? 'Mobile Money' : 'Cash';
          
          return `
            <tr style="border-bottom: 1px dashed #e2e8f0;">
              <td style="padding: 6px 10px; color: #64748b;">${saleTime}</td>
              <td style="padding: 6px 10px; font-weight: 600;">#${s.id}</td>
              <td style="padding: 6px 10px; font-size: 11px; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsDesc}">${itemsDesc}</td>
              <td style="padding: 6px 10px; color: #475569;">${payMethod}</td>
              <td style="padding: 6px 10px; text-align: right; font-weight: bold; color: #0f172a;">${s.total_amount.toFixed(2)} FCFA</td>
            </tr>
          `;
        }).join('');
        
        itemsTable = `
          <table style="width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 12px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: left;">
                <th style="padding: 6px 10px; color: #64748b; font-weight: 600; width: 80px;">Time</th>
                <th style="padding: 6px 10px; color: #64748b; font-weight: 600; width: 60px;">ID</th>
                <th style="padding: 6px 10px; color: #64748b; font-weight: 600;">Items Sold</th>
                <th style="padding: 6px 10px; color: #64748b; font-weight: 600; width: 100px;">Payment</th>
                <th style="padding: 6px 10px; color: #64748b; font-weight: 600; text-align: right; width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        `;
      }
      
      return `
        <div style="margin-bottom: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px;">
            <strong style="color: #4f46e5; font-size: 13px;">${day.dayName} (${day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})</strong>
            <span style="font-weight: bold; color: #d97706; font-size: 13px;">Daily Total: ${day.total.toLocaleString()} FCFA</span>
          </div>
          ${itemsTable}
        </div>
      `;
    }).join('');

    const loadHtml2Pdf = () => {
      return new Promise((resolve, reject) => {
        if (window.html2pdf) {
          resolve(window.html2pdf);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => resolve(window.html2pdf);
        script.onerror = () => reject(new Error('Failed to load html2pdf.js'));
        document.head.appendChild(script);
      });
    };

    loadHtml2Pdf().then((html2pdf) => {
      const parent = document.createElement('div');
      parent.style.position = 'fixed';
      parent.style.left = '0';
      parent.style.top = '0';
      parent.style.width = '794px';
      parent.style.height = '0';
      parent.style.overflow = 'hidden';
      parent.style.zIndex = '-9999';

      const element = document.createElement('div');
      element.style.width = '794px';
      element.style.boxSizing = 'border-box';
      element.style.background = '#ffffff';
      element.style.padding = '40px';
      element.style.color = '#1e293b';
      element.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
      
      element.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px;">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; color: #4f46e5; margin: 0;">${storeName.toUpperCase()}</h1>
            <p style="font-size: 14px; color: #64748b; margin: 5px 0 0 0;">Weekly Business Performance Report</p>
          </div>
          <div style="font-size: 12px; color: #94a3b8; text-align: right;">
            <strong>Report ID:</strong> Week ${weekNum} (${formattedDateRange})<br/>
            <strong>Downloaded At:</strong> ${new Date().toLocaleDateString()} ${timeDownloaded}<br/>
            <strong>Plan Tier:</strong> ULTRA Premium
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 8px 0;">Weekly Revenue</p>
            <h3 style="font-size: 18px; font-weight: bold; color: #d97706; margin: 0;">${weeklyRevenueTotal.toLocaleString()} FCFA</h3>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 8px 0;">Transactions Processed</p>
            <h3 style="font-size: 18px; font-weight: bold; color: #0f172a; margin: 0;">${summary?.total_sales ?? 0}</h3>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 8px 0;">Catalog Size</p>
            <h3 style="font-size: 18px; font-weight: bold; color: #0f172a; margin: 0;">${summary?.total_products ?? 0} Items</h3>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 8px 0;">Low Stock Warnings</p>
            <h3 style="font-size: 18px; font-weight: bold; color: #ef4444; margin: 0;">${summary?.low_stock_alerts ?? 0} Alerts</h3>
          </div>
        </div>

        <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin: 30px 0 15px 0;">Revenue Trend Graph</h3>
        ${getSVGChartHTML()}

        <div style="page-break-before: always;"></div>

        <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin: 30px 0 15px 0;">Daily Sales Breakdowns & Receipts</h3>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${salesBreakdownHtml}
        </div>

        <div style="page-break-before: always;"></div>

        <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin: 30px 0 15px 0;">Product Sales Performance Rankings</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="width: 50px; padding: 10px;">Rank</th>
              <th style="padding: 10px;">Product Name</th>
              <th style="text-align: center; width: 100px; padding: 10px;">Units Sold</th>
              <th style="text-align: right; width: 150px; padding: 10px;">Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${productsHtml || '<tr><td colspan="4" style="text-align: center;">No product sales recorded yet.</td></tr>'}
          </tbody>
        </table>

        <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin: 30px 0 15px 0;">Automated AI Insights & Recommendations</h3>
        <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 15px; font-size: 12px; line-height: 1.6; white-space: pre-line;">
          ${insights || 'No AI insights generated for this period.'}
        </div>

        <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 50px; border-top: 1px dashed #cbd5e1; padding-top: 15px;">
          Confidential — Generated by Smart Retail System AI for Store Administration.
        </p>
      `;

      const safeStoreName = storeName.replace(/[^a-zA-Z0-9]/g, '_');
      const safeDates = (activeDatesStr || formattedDateRange).replace(/[^a-zA-Z0-9]/g, '_');
      const safeTime = timeDownloaded.replace(/[^a-zA-Z0-9]/g, '-').replace(/\s+/g, '_');
      const filename = `Report_For_${safeStoreName}_-_Week_${weekNum}_(${safeDates})_-_${currentYear}_${safeTime}.pdf`;

      const opt = {
        margin:       0,
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      parent.appendChild(element);
      document.body.appendChild(parent);

      setTimeout(() => {
        html2pdf().set(opt).from(element).save().then(() => {
          document.body.removeChild(parent);
        }).catch(err => {
          console.error('Error saving PDF:', err);
          document.body.removeChild(parent);
        });
      }, 250);
    }).catch(err => {
      console.error('Error loading html2pdf:', err);
      alert('Could not download PDF report because html2pdf library failed to load.');
    });
  };

  const renderCustomSVGChart = () => {
    const defaultDays = [
      { day: 'Mon', revenue: 0 },
      { day: 'Tue', revenue: 0 },
      { day: 'Wed', revenue: 0 },
      { day: 'Thu', revenue: 0 },
      { day: 'Fri', revenue: 0 },
      { day: 'Sat', revenue: 0 },
      { day: 'Sun', revenue: 0 }
    ];
    
    const dailyRevData = defaultDays.map(d => {
      const matchingDbDay = summary?.daily_revenue?.find(
        dbDay => dbDay.day.toLowerCase().slice(0, 3) === d.day.toLowerCase()
      );
      return {
        day: d.day,
        revenue: matchingDbDay ? matchingDbDay.revenue : 0
      };
    });

    const dataPoints = dailyRevData.map(d => d.revenue);
    const days = dailyRevData.map(d => d.day);
    const isZeroWeek = dataPoints.every(v => v === 0);
    const chartColor = isZeroWeek ? '#ef4444' : 'var(--primary-color)';

    const width = 600;
    const height = 200;
    const padding = { top: 20, right: 30, bottom: 30, left: 95 };

    const maxVal = Math.max(...dataPoints, 1000);
    const minVal = 0;

    const points = dataPoints.map((val, idx) => {
      const x = padding.left + (idx * (width - padding.left - padding.right) / 6);
      const y = height - padding.bottom - ((val - minVal) / (maxVal - minVal) * (height - padding.top - padding.bottom));
      return { x, y, val, day: days[idx] };
    });

    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.45" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding.top + ratio * (height - padding.top - padding.bottom);
            const gridVal = Math.round(maxVal - ratio * (maxVal - minVal));
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="var(--glass-card-border, rgba(255,255,255,0.06))"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={y}
                  dominantBaseline="middle"
                  fill="var(--text-muted)"
                  fontSize="9px"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {gridVal.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* X-axis days */}
          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - 8}
              fill="var(--text-secondary)"
              fontSize="10px"
              fontWeight="600"
              textAnchor="middle"
            >
              {p.day}
            </text>
          ))}

          {/* Area under the path */}
          <path d={areaPath} fill="url(#chartGrad)" />

          {/* Stroke Line */}
          <path
            d={linePath}
            fill="none"
            stroke={chartColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: isZeroWeek ? 'none' : 'drop-shadow(0px 4px 8px rgba(var(--primary-color-rgb), 0.35))'
            }}
          />

          {/* Data Points */}
          {points.map((p, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g key={idx} style={{ cursor: 'pointer' }}>
                {/* Transparent hover capture circle */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="14"
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {/* Active visible dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? "6" : "4"}
                  fill={isHovered ? (isZeroWeek ? "#ff8787" : "var(--accent-color)") : chartColor}
                  stroke="var(--bg-app)"
                  strokeWidth="2"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ transition: 'all 0.15s ease' }}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Indicator */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '20px',
          backgroundColor: 'var(--bg-sidebar, #111827)',
          border: '1px solid var(--border-sidebar, rgba(255, 255, 255, 0.1))',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-md)',
          display: hoveredIndex !== null ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'flex-end',
          pointerEvents: 'none',
          transition: 'opacity 0.15s ease',
          fontSize: '0.82rem',
          zIndex: 5
        }}>
          {hoveredIndex !== null && (
            <>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                {points[hoveredIndex].day} Revenue
              </span>
              <strong style={{ color: isZeroWeek ? '#ef4444' : 'var(--accent-color)', fontSize: '0.90rem', marginTop: '2px' }}>
                {points[hoveredIndex].val.toLocaleString()} FCFA
              </strong>
            </>
          )}
        </div>
      </div>
    );
  };

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

  const loadSales = async () => {
    try {
      setSalesLoading(true);
      const data = await getAllSales();
      setSales(data || []);
    } catch (error) {
      console.error('Error loading sales list for dashboard:', error);
    } finally {
      setSalesLoading(false);
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
    loadSales();
    if (tier === 'ultra') {
      loadReviews();
    }
  }, [tier, settings?.id]);

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

  if (settingsLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: 'var(--primary-color)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '80vh' }}>
      
      {/* Blurred Dashboard Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        filter: tier === 'free' ? 'blur(6px)' : 'none',
        pointerEvents: tier === 'free' ? 'none' : 'auto',
        userSelect: tier === 'free' ? 'none' : 'auto',
        transition: 'all 0.3s ease'
      }} className="animate-fade-in">
        
        {/* Dashboard Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>Business Metrics</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Real-time shop sales totals, product inventory health, and AI analysis.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {tier === 'ultra' && (
              <>
                <Button
                  id="export-csv-btn"
                  variant="secondary"
                  size="sm"
                  onClick={handleExportCSV}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '13px', height: '13px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Export CSV
                  </span>
                </Button>
                <Button
                  id="export-pdf-btn"
                  variant="secondary"
                  size="sm"
                  onClick={handleExportPDF}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '13px', height: '13px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    Export PDF
                  </span>
                </Button>
              </>
            )}
            <Button
              id="refresh-dashboard-btn"
              variant="secondary"
              size="sm"
              onClick={() => {
                loadMetrics();
                loadTopProducts();
                loadSales();
                handleRefreshInsights();
                if (tier === 'ultra') loadReviews();
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '13px', height: '13px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Refresh Data
              </span>
            </Button>
          </div>
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

        {/* 1.5 Custom SVG Sales Performance Trend Chart */}
        <Card
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px', color: 'var(--accent-color)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.94" />
              </svg>
              Revenue Performance Trend
            </span>
          }
          subtitle="Last 7-day business sales volume & gross revenue path"
        >
          <div style={{ position: 'relative', width: '100%', height: '220px', padding: '10px 0' }}>
            {renderCustomSVGChart()}
          </div>
        </Card>

        {/* 2. Charts and AI insights split screen */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          
          {/* Left Side: Top Products List */}
          <div style={{ flex: 1, minWidth: '300px' }}>
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

          {/* Middle Side: Predictive Stock Forecasting (Ultra Only) */}
          {tier === 'ultra' && (
            <div style={{ flex: 1, minWidth: '300px' }}>
              <Card
                title={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px', color: 'var(--color-danger)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    AI Stock Forecasting
                  </span>
                }
                subtitle="Predictive restock velocity & depletion dates"
                style={{ height: '100%' }}
              >
                {topProductsLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2, 3].map(idx => (
                      <div key={idx} className="shimmer-bg" style={{ height: '50px', borderRadius: '8px' }} />
                    ))}
                  </div>
                ) : summary?.low_stock_alerts === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', textAlign: 'center', gap: '8px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#10b981" style={{ width: '24px', height: '24px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h5 style={{ margin: 0, fontWeight: '700' }}>All Stock Levels Healthy</h5>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '240px' }}>Based on sales velocity, next inventory depletion event is in &gt;14 days.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ padding: '10px 12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--color-danger)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '15px', height: '15px', color: 'var(--color-danger)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                      {summary?.low_stock_alerts} item(s) are critically low and require immediate reordering.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--glass-card-bg)', borderRadius: '8px', border: '1px solid var(--glass-card-border)' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem', display: 'block', textTransform: 'capitalize' }}>Low stock items</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Velocity: ~1.4 units/day</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-danger)', padding: '4px 8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                          Depletion in &lt; 3 Days
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--glass-card-bg)', borderRadius: '8px', border: '1px solid var(--glass-card-border)' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem', display: 'block', textTransform: 'capitalize' }}>Other catalog alerts</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Velocity: ~0.8 units/day</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-color)', padding: '4px 8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px' }}>
                          Depletion in ~ 6 Days
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

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

        {/* Customer Feedback Audit Logs (Ultra Exclusive) */}
        {tier === 'ultra' && (
          <Card
            title={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px', color: 'var(--accent-color)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h9m-9 3h3m-6.75 12h10.5a2.25 2.25 0 002.25-2.25v-10.5A2.25 2.25 0 0018 3.75H3.75a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 003.75 20.25z" />
                </svg>
                Customer Feedback Audit Logs
              </span>
            }
            subtitle="Diagnostic feed of client reviews. Submissions under 4 stars are shielded from catalog viewers to protect storefront reputation."
          >
            {reviewsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3].map(idx => (
                  <div key={idx} className="shimmer-bg" style={{ height: '50px', borderRadius: '8px' }} />
                ))}
              </div>
            ) : allReviews.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No customer reviews logged yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                {allReviews.map((rev) => {
                  const isNegative = rev.rating < 4;
                  return (
                    <div
                      key={rev.id}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: `1px solid ${isNegative ? 'rgba(239, 68, 68, 0.25)' : 'var(--glass-card-border)'}`,
                        backgroundColor: isNegative ? 'rgba(239, 68, 68, 0.03)' : 'var(--glass-card-bg)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{rev.customer_name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(rev.created_at).toLocaleDateString()} at {new Date(rev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: '#F59E0B', fontWeight: 'bold' }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} style={{ color: i < rev.rating ? '#F59E0B' : 'rgba(255,255,255,0.15)' }}>★</span>
                            ))}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            padding: '4px 8px',
                            borderRadius: '20px',
                            backgroundColor: isNegative ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isNegative ? '#EF4444' : '#10B981'
                          }}>
                            {isNegative ? 'Catalog Shielded' : 'Public Testimonial'}
                          </span>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.45', fontStyle: isNegative ? 'italic' : 'normal' }}>
                        "{rev.comment}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

      </div>

      {/* Free Tier Premium Lock Overlay */}
      {tier === 'free' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.45)', // subtle dark tint
          backdropFilter: 'blur(4px)',
          borderRadius: '16px',
          zIndex: 10,
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-sidebar, #111827)',
            border: '1px solid var(--border-sidebar, rgba(255, 255, 255, 0.1))',
            borderRadius: '24px',
            padding: '40px 32px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), var(--shadow-lg)',
            animation: 'scaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            color: 'var(--text-primary)'
          }}>
            <style>{`
              @keyframes scaleUp {
                0% { transform: scale(0.95); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>
            
            {/* Lock Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '2px solid var(--accent-color, #F59E0B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="var(--accent-color, #F59E0B)" style={{ width: '36px', height: '36px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>

            <h2 style={{
              fontSize: '1.6rem',
              fontWeight: '800',
              marginBottom: '12px',
              background: 'linear-gradient(135deg, #ffffff 30%, var(--text-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'var(--text-primary)'
            }}>
              Unlock Business Intelligence
            </h2>
            
            <p style={{
              fontSize: '0.92rem',
              color: 'var(--text-muted, #94a3b8)',
              lineHeight: '1.6',
              marginBottom: '32px'
            }}>
              Your storefront is currently on the <strong>Free Trial</strong> plan. Upgrade your subscription to Pro or Ultra to track real-time sales metrics, view interactive revenue trend lines, and access AI-powered diagnostic insights.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button
                id="upgrade-momo-cta-btn"
                variant="primary"
                onClick={() => navigate('/settings')}
                style={{
                  padding: '14px',
                  fontWeight: '700',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(var(--primary-color-rgb), 0.3)'
                }}
              >
                Go to Subscription Plans
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/storefront')}
                style={{
                  padding: '12px',
                  fontWeight: '600',
                  borderRadius: '12px'
                }}
              >
                Back to POS Storefront
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
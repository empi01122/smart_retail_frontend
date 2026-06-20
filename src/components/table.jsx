import React from 'react';

export const Table = ({
  headers = [],
  rows = [], // array of objects/arrays or render rows directly
  children,
  emptyMessage = 'No data available',
  loading = false,
  id,
}) => {
  return (
    <div
      id={id}
      className="table-responsive-wrapper"
      style={{
        width: '100%',
        overflowX: 'auto',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '0.92rem',
      }}>
        <thead>
          <tr style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            {headers.map((header, idx) => (
              <th
                key={idx}
                style={{
                  padding: '16px 20px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={headers.length || 1} style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderTopColor: 'var(--primary-color)',
                  borderRadius: '50%',
                  animation: 'tableSpin 0.8s linear infinite',
                  margin: '0 auto 12px auto'
                }} />
                <span style={{ color: 'var(--text-muted)' }}>Loading items...</span>
              </td>
            </tr>
          ) : children ? (
            children
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length || 1} style={{
                padding: '40px',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                  transition: 'var(--transition-fast)',
                }}
                className="table-row-hover"
              >
                {Object.values(row).map((val, cellIdx) => (
                  <td
                    key={cellIdx}
                    style={{
                      padding: '16px 20px',
                      color: '#ffffff',
                    }}
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <style>{`
        @keyframes tableSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .table-row-hover:hover {
          background-color: rgba(255, 255, 255, 0.02);
        }
      `}</style>
    </div>
  );
};

export default Table;
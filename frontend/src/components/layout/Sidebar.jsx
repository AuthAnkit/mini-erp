import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: '⚡', exact: true, roles: ['ADMIN','OWNER','SALES','PURCHASE','MANUFACTURING','INVENTORY'] },
    ]
  },
  {
    label: 'Operations',
    items: [
      { path: '/sales', label: 'Sales Orders', icon: '🛒', roles: ['ADMIN','OWNER','SALES'] },
      { path: '/purchase', label: 'Purchase Orders', icon: '📋', roles: ['ADMIN','OWNER','PURCHASE'] },
      { path: '/manufacturing', label: 'Manufacturing', icon: '⚙️', roles: ['ADMIN','OWNER','MANUFACTURING'] },
    ]
  },
  {
    label: 'Inventory',
    items: [
      { path: '/products', label: 'Products & BoM', icon: '📦', roles: ['ADMIN','OWNER','INVENTORY'] },
      { path: '/stock-graph', label: 'Stock Graph', icon: '🕸️', roles: ['ADMIN','OWNER','INVENTORY'] },
    ]
  },
  {
    label: 'Contacts',
    items: [
      { path: '/customers', label: 'Customers', icon: '👥', roles: ['ADMIN','OWNER','SALES'] },
      { path: '/vendors', label: 'Vendors', icon: '🤝', roles: ['ADMIN','OWNER','PURCHASE'] },
    ]
  },
  {
    label: 'Intelligence',
    items: [
      { path: '/analytics/health', label: 'Business Health', icon: '❤️', roles: ['ADMIN','OWNER'] },
      { path: '/analytics/demand', label: 'Demand Forecast', icon: '📈', roles: ['ADMIN','OWNER','SALES','INVENTORY'] },
      { path: '/analytics/procurement', label: 'Smart Procurement', icon: '🤖', roles: ['ADMIN','OWNER','PURCHASE'] },
      { path: '/analytics/mfg-priority', label: 'Mfg Priority', icon: '🔥', roles: ['ADMIN','OWNER','MANUFACTURING'] },
      { path: '/analytics/auto-mfg', label: 'Auto Manufacturing', icon: '⚡', roles: ['ADMIN','OWNER','MANUFACTURING'] },
      { path: '/analytics/shortages', label: 'Shortage Alerts', icon: '⚠️', roles: ['ADMIN','OWNER','MANUFACTURING','INVENTORY'] },
      { path: '/analytics/heatmap', label: 'Stock Heat Map', icon: '🗺️', roles: ['ADMIN','OWNER','INVENTORY'] },
      { path: '/analytics/dead-stock', label: 'Dead Stock', icon: '💀', roles: ['ADMIN','OWNER','INVENTORY'] },
      { path: '/analytics/rankings', label: 'Rankings', icon: '🏆', roles: ['ADMIN','OWNER'] },
      { path: '/analytics/profit-leaks', label: 'Profit Leaks', icon: '💸', roles: ['ADMIN','OWNER'] },
      { path: '/analytics/stories', label: 'ERP Story', icon: '📰', roles: ['ADMIN','OWNER'] },
      { path: '/analytics/simulator', label: 'Business Simulator', icon: '🕹️', roles: ['ADMIN','OWNER'] },
      { path: '/analytics/chatbot', label: 'AI Chatbot', icon: '💬', roles: ['ADMIN','OWNER'] },
    ]
  },
  {
    label: 'Administration',
    items: [
      { path: '/audit', label: 'Audit Logs', icon: '📋', roles: ['ADMIN','OWNER'] },
    ]
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { connected, procurementEvents } = useWebSocket();
  const hasNewEvents = procurementEvents.length > 0;

  const roleColors = {
    ADMIN: { bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc', label: 'Admin' },
    OWNER: { bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', label: 'Owner' },
    SALES: { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', label: 'Sales' },
    PURCHASE: { bg: 'rgba(59,130,246,0.15)', color: '#93c5fd', label: 'Purchase' },
    MANUFACTURING: { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5', label: 'Production' },
    INVENTORY: { bg: 'rgba(168,85,247,0.15)', color: '#d8b4fe', label: 'Inventory' },
  };
  const roleStyle = roleColors[user?.role] || roleColors.ADMIN;

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      background: '#141720',
      borderRight: '1px solid #1e2132',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* Brand */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid #1e2132',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '34px',
          height: '34px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          flexShrink: 0,
          boxShadow: '0 0 20px rgba(99,102,241,0.25)',
        }}>⚡</div>
        <div>
          <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: '#f1f5f9', letterSpacing: '-0.3px' }}>
            ErpMini
          </p>
          <p style={{ margin: 0, fontSize: '10px', color: '#4b5563', letterSpacing: '0.05em' }}>
            ENTERPRISE ERP
          </p>
        </div>
      </div>

      {/* Live Status Bar */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid #1e2132',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: connected ? '#10b981' : '#ef4444',
          boxShadow: connected ? '0 0 8px #10b981' : 'none',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: '11px', color: '#4b5563' }}>
          {connected ? 'System Live' : 'Connecting...'}
        </span>
        {hasNewEvents && (
          <span style={{
            marginLeft: 'auto',
            background: '#6366f1',
            color: '#fff',
            fontSize: '10px',
            padding: '2px 7px',
            borderRadius: '10px',
            fontWeight: '600',
          }}>{procurementEvents.length} new</span>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {navGroups.map(group => {
          const visibleItems = group.items.filter(item => item.roles.includes(user?.role));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} style={{ marginBottom: '8px' }}>
              <p style={{
                fontSize: '10px',
                fontWeight: '600',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '8px 8px 4px',
                margin: 0,
              }}>{group.label}</p>
              {visibleItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 10px',
                    borderRadius: '8px',
                    marginBottom: '2px',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? '#a5b4fc' : '#6b7280',
                    background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                    borderLeft: isActive ? '2px solid #6366f1' : '2px solid transparent',
                    transition: 'all 0.15s',
                  })}
                >
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Auto-Procurement Events */}
      {procurementEvents.length > 0 && (
        <div style={{
          padding: '12px',
          borderTop: '1px solid #1e2132',
          background: 'rgba(99,102,241,0.04)',
        }}>
          <p style={{ fontSize: '10px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
            Auto-Procurement
          </p>
          {procurementEvents.slice(0, 2).map((e, i) => (
            <div key={i} style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '8px',
              padding: '8px 10px',
              marginBottom: '6px',
            }}>
              <p style={{ fontSize: '11px', color: '#a5b4fc', margin: 0, lineHeight: 1.4 }}>{e.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* User Profile */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid #1e2132',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: roleStyle.bg,
          border: `1px solid ${roleStyle.color}40`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: '700',
          color: roleStyle.color,
          flexShrink: 0,
        }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name}
          </p>
          <span style={{
            fontSize: '10px',
            background: roleStyle.bg,
            color: roleStyle.color,
            padding: '1px 7px',
            borderRadius: '10px',
            fontWeight: '500',
          }}>{roleStyle.label}</span>
        </div>
        <button
          id="logoutBtn"
          onClick={() => { logout(); navigate('/login'); }}
          title="Sign out"
          style={{
            background: 'none',
            border: 'none',
            color: '#4b5563',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}
        >
          ⏻
        </button>
      </div>
    </aside>
  );
}

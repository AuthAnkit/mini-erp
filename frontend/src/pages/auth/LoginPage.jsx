import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const FEATURES = [
  { icon: '📦', label: 'Inventory & Products' },
  { icon: '🛒', label: 'Sales Management' },
  { icon: '🏭', label: 'Procurement' },
  { icon: '⚙️', label: 'Manufacturing' },
  { icon: '📊', label: 'Real-time Analytics' },
  { icon: '🔒', label: 'Role-based Access' },
];

export default function LoginPage() {
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.loginId, form.password);
      navigate('/');
    } catch {
      setError('Invalid credentials. Please check your login ID and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1117 0%, #1a1d2e 50%, #0f1117 100%)',
      display: 'flex',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Left Panel — Branding */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        background: 'linear-gradient(160deg, #1a1d27 0%, #151824 100%)',
        borderRight: '1px solid #2a2d3e',
        display: 'none',
      }} className="login-left-panel">
      </div>

      {/* Main Login Container */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: '-200px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

          {/* Logo + Brand */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 40px rgba(99,102,241,0.3)',
              fontSize: '28px',
            }}>
              ⚡
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#f1f5f9',
              margin: '0 0 6px',
              letterSpacing: '-0.5px',
            }}>ErpMini</h1>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0,
            }}>Enterprise Resource Planning · Built for Modern Business</p>
          </div>

          {/* Login Card */}
          <div style={{
            background: 'rgba(26,29,39,0.8)',
            border: '1px solid #2a2d3e',
            borderRadius: '20px',
            padding: '36px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#e2e8f0',
              margin: '0 0 6px',
            }}>Sign in to your workspace</h2>
            <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 28px' }}>
              Enter your credentials to access the ERP system
            </p>

            <form onSubmit={handleSubmit}>
              {/* Login ID */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#9ca3af',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>Login ID</label>
                <input
                  id="loginId"
                  type="text"
                  value={form.loginId}
                  onChange={e => setForm({ ...form, loginId: e.target.value })}
                  placeholder="Enter your login ID"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#0f1117',
                    border: '1px solid #2a2d3e',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: '#e2e8f0',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#2a2d3e'}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#9ca3af',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>Password</label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••••"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#0f1117',
                    border: '1px solid #2a2d3e',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: '#e2e8f0',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#2a2d3e'}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* Submit */}
              <button
                id="signInBtn"
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: loading
                    ? '#4b5563'
                    : 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px', height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Authenticating...
                  </>
                ) : 'Sign In →'}
              </button>
            </form>
          </div>

          {/* Feature Pills */}
          <div style={{ marginTop: '32px' }}>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#374151', marginBottom: '12px' }}>
              POWERED BY ERPMI
            </p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
            }}>
              {FEATURES.map(f => (
                <div key={f.label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(26,29,39,0.6)',
                  border: '1px solid #2a2d3e',
                  borderRadius: '20px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  color: '#6b7280',
                }}>
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p style={{
            textAlign: 'center',
            fontSize: '11px',
            color: '#374151',
            marginTop: '24px',
          }}>
            ErpMini v1.0 · Contact your system administrator for access
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 1024px) {
          .login-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

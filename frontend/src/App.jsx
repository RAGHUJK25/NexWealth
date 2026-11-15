
import { useEffect, useState } from 'react';
import { ChevronRight, LoaderCircle } from 'lucide-react';
import api from './api.js';
import Dashboard from './Dashboard.jsx';
import BrandMark from './BrandMark.jsx';

function Auth({ onAuth, initialError = '' }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!form.email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (mode !== 'forgot' && !form.password) {
      setError('Please enter your password.');
      return;
    }

    if (mode === 'register' && !form.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setBusy(true);

    try {
      if (mode === 'forgot') {
        const response = await api.post('/auth/forgot-password', {
          email: form.email.trim(),
        });
        setNotice(response.data?.message || 'If an account exists for that email, a reset link has been sent.');
        return;
      }

      const payload =
        mode === 'login'
          ? {
              email: form.email.trim(),
              password: form.password,
            }
          : {
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
            };

      const response = await api.post(`/auth/${mode}`, payload);
      const data = response.data;

      if (!data?.access_token || !data?.user) {
        throw new Error('Invalid response received from the server.');
      }

      localStorage.setItem('nexwealth_token', data.access_token);
      localStorage.setItem('nexwealth_user', JSON.stringify(data.user));

      onAuth(data.user);
    } catch (e) {
      const detail = e?.response?.data?.detail;

      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => {
              const field = Array.isArray(item?.loc)
                ? item.loc.filter((part) => part !== 'body').join('.')
                : '';

              return field
                ? `${field}: ${item?.msg || 'Invalid input'}`
                : item?.msg || 'Invalid input';
            })
            .join(', ')
        );
      } else {
        setError(
          e?.response?.data?.message ||
          e?.message ||
          'Something went wrong. Please try again.'
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-art">
        <div className="brand">
          <BrandMark /> NexWealth
        </div>

        <div className="auth-copy">
          <span className="eyebrow">A CLEARER VIEW OF YOUR MONEY</span>
          <h1>Make every<br /><em>move</em> count.</h1>
          <p>
            Bring your financial life into focus. Understand your patterns,
            plan ahead, and build momentum.
          </p>

          <div className="auth-stats">
            <div><b>01</b><span>Understand</span></div>
            <div><b>02</b><span>Plan</span></div>
            <div><b>03</b><span>Grow</span></div>
          </div>
        </div>

        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <span className="eyebrow">
            {mode === 'login'
              ? 'WELCOME BACK'
              : mode === 'register'
                ? 'YOUR NEXT CHAPTER STARTS HERE'
                : 'PASSWORD RECOVERY'}
          </span>

          <h2>
            {mode === 'login'
              ? 'Sign in to NexWealth'
              : mode === 'register'
                ? 'Create your account'
                : 'Reset your password'}
          </h2>

          <p className="muted">
            {mode === 'login'
              ? 'Pick up where you left off.'
              : mode === 'register'
                ? 'A more intentional relationship with money starts here.'
                : 'We will email a secure, time-limited reset link if the account exists.'}
          </p>

          {mode === 'register' && (
            <label>
              <span>Full name</span>
              <input
                name="name"
                required
                minLength={2}
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
              />
            </label>
          )}

          <label>
            <span>Email address</span>
            <input
              name="email"
              required
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </label>

          {mode !== 'forgot' && (
            <label>
              <span>Password</span>
              <input
                name="password"
                required
                minLength={8}
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
              />
            </label>
          )}

          {mode === 'login' && (
            <button className="text-btn forgot-password" type="button" onClick={() => { setMode('forgot'); setError(''); setNotice(''); }}>
              Forgot password?
            </button>
          )}

          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {notice && <div className="note-card" role="status">{notice}</div>}

          <button className="btn primary wide" type="submit" disabled={busy}>
            {busy && <LoaderCircle className="spin" size={17} />}
            {mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}
            <ChevronRight size={17} />
          </button>

          <p className="switch-auth">
            {mode === 'forgot' ? (
              <button type="button" onClick={() => { setMode('login'); setError(''); setNotice(''); }}>Back to sign in</button>
            ) : (
              <>
                {mode === 'login' ? 'New to NexWealth?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode((prev) => prev === 'login' ? 'register' : 'login');
                    setError('');
                    setNotice('');
                  }}
                >
                  {mode === 'login' ? 'Create an account' : 'Sign in'}
                </button>
              </>
            )}
          </p>
        </form>

        <span className="auth-foot">
          Your financial data stays in your account.
        </span>
      </div>
    </div>
  );
}

function ResetPassword({ token, onComplete }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (password.length < 8) {
      setError('Use at least 8 characters for your new password.');
      return;
    }
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        token,
        new_password: password,
      });
      setNotice(data.message || 'Password reset successful. Sign in with your new password.');
    } catch (requestError) {
      const detail = requestError?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : requestError?.message || 'Unable to reset the password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-art">
        <div className="brand"><BrandMark /> NexWealth</div>
        <div className="auth-copy">
          <span className="eyebrow">ACCOUNT SECURITY</span>
          <h1>Start with<br /><em>a fresh</em> key.</h1>
          <p>Reset links expire after 60 minutes and can only be used once.</p>
        </div>
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
      </div>
      <div className="auth-form-wrap">
        {notice ? (
          <div className="auth-form">
            <span className="eyebrow">PASSWORD UPDATED</span>
            <h2>You're all set.</h2>
            <p className="muted">{notice}</p>
            <button className="btn primary wide" type="button" onClick={onComplete}>Back to sign in</button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <span className="eyebrow">PASSWORD RECOVERY</span>
            <h2>Choose a new password</h2>
            <p className="muted">Use at least 8 characters. Your reset link works once.</p>
            <label>
              <span>New password</span>
              <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label>
              <span>Confirm new password</span>
              <input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            </label>
            {error && <div className="error" role="alert">{error}</div>}
            <button className="btn primary wide" type="submit" disabled={busy}>
              {busy && <LoaderCircle className="spin" size={17} />}
              Reset password
              <ChevronRight size={17} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [sessionError, setSessionError] = useState('');
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get('reset_token'));
  const [sessionLoading, setSessionLoading] = useState(() => Boolean(localStorage.getItem('nexwealth_token')) && !new URLSearchParams(window.location.search).has('reset_token'));

  useEffect(() => {
    if (resetToken) {
      setSessionLoading(false);
      return;
    }
    const token = localStorage.getItem('nexwealth_token');
    if (!token) {
      setSessionLoading(false);
      return;
    }

    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem('nexwealth_user', JSON.stringify(data));
      })
      .catch((error) => {
        setUser(null);
        setSessionError(error?.response?.status === 401
          ? 'Your previous session expired. Please sign in again.'
          : `Unable to restore your session: ${error?.message || 'check that the backend is running.'}`);
      })
      .finally(() => setSessionLoading(false));
  }, [resetToken]);

  useEffect(() => {
    const handleSessionExpired = () => setUser(null);
    window.addEventListener('nexwealth:logout', handleSessionExpired);
    return () => window.removeEventListener('nexwealth:logout', handleSessionExpired);
  }, []);

  const signOut = () => {
    localStorage.removeItem('nexwealth_token');
    localStorage.removeItem('nexwealth_user');
    setSessionError('');
    setUser(null);
  };

  const handleAuth = (authenticatedUser) => {
    setSessionError('');
    setUser(authenticatedUser);
  };

  const finishPasswordReset = () => {
    localStorage.removeItem('nexwealth_token');
    localStorage.removeItem('nexwealth_user');
    setUser(null);
    setSessionError('');
    const url = new URL(window.location.href);
    url.searchParams.delete('reset_token');
    window.history.replaceState({}, '', url.toString());
    setResetToken(null);
  };

  if (resetToken) {
    return <ResetPassword token={resetToken} onComplete={finishPasswordReset} />;
  }

  if (sessionLoading) {
    return <div className="loading-state"><LoaderCircle className="spin" size={19} />Restoring your session…</div>;
  }

  if (!user) {
    return <Auth key={sessionError} onAuth={handleAuth} initialError={sessionError} />;
  }

  return <Dashboard user={user} onSignOut={signOut} />;
}

export default App;
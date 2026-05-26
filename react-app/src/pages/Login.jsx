import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(t('invalid_credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>{t('login')}</h1>
        <p>{t('admin_login_desc')}</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('username_email')}</label>
            <input type="text" className="form-input" value={username} onChange={e => setUsername(e.target.value)} placeholder={t('enter_username')} required />
          </div>
          <div className="form-group">
            <label className="form-label">{t('password')}</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('enter_password')} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? t('signing_in') : t('login')}
          </button>
        </form>
        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '.9rem', color: 'var(--text2)' }}>
          <span>{t('no_account')}</span>
          <a href="/register" style={{ color: 'var(--red)', fontWeight: 600 }}>{t('register_team')}</a>
        </div>
      </div>
    </div>
  );
}
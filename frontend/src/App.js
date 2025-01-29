import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      await fetchChildren(data.token);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async (currentToken) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/children`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch children');
      }

      const data = await response.json();
      setChildren(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      if (err.message.includes('Invalid token')) {
        localStorage.removeItem('token');
        setToken(null);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setChildren([]);
  };

  if (!token) {
    return (
      <div className="container">
        <h1>Montessori školka - Přihlášení</h1>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div>
            <label>Email:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label>Heslo:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Přihlašování...' : 'Přihlásit'}
          </button>
        </form>
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container">
      <div className="header">
        <h1>Montessori školka - Správa dětí</h1>
        <button onClick={handleLogout} className="logout-button">
          Odhlásit se
        </button>
      </div>
      {children.length === 0 ? (
        <p>No children found</p>
      ) : (
        <table className="children-table">
          <thead>
            <tr>
              <th>Jméno</th>
              <th>Věk</th>
              <th>Rodič</th>
              <th>Kontakt</th>
              <th>Poznámky</th>
            </tr>
          </thead>
          <tbody>
            {children.map((child) => (
              <tr key={child.id}>
                <td>{child.name}</td>
                <td>{child.age}</td>
                <td>{child.parent_name}</td>
                <td>{child.contact}</td>
                <td>{child.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;

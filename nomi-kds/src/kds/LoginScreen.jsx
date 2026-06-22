import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseconfig';
import { collection, getDocs } from 'firebase/firestore';

export default function LoginScreen({ onLogin }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRest, setSelectedRest] = useState('all');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const querySnapshot = await getDocs(collection(db, 'restaurants'));
        const list = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setRestaurants(list);
      } catch (err) {
        console.error('Error fetching restaurants for login:', err);
      }
    }
    fetchRestaurants();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Por favor ingresa un nombre de usuario.');
      return;
    }
    if (!password) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    // Mock validation for demo purposes: password is 'admin' or matches user
    setTimeout(() => {
      if (password === 'admin' || password === '1234') {
        let name = 'Administrador General';
        if (selectedRest !== 'all') {
          const found = restaurants.find(r => r.id === selectedRest);
          if (found) name = found.name;
        }
        onLogin(selectedRest, username, name);
      } else {
        setError('Contraseña incorrecta. (Prueba con "admin")');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div style={styles.container}>
      <div style={styles.glassCard}>
        <div style={styles.header}>
          <span style={styles.logoNomi}>NOMI</span>
          <span style={styles.logoSub}>Kitchen Operations</span>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.title}>Iniciar Sesión</h2>
          <p style={styles.subtitle}>Selecciona tu cocina y accede al panel de control</p>

          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Cocina / Restaurante</label>
            <select
              style={styles.select}
              value={selectedRest}
              onChange={(e) => setSelectedRest(e.target.value)}
            >
              <option value="all">Administrador (Todas las cocinas)</option>
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Nombre de Usuario</label>
            <input
              type="text"
              placeholder="Ej. Chef Carlos"
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span style={styles.hint}>Contraseña demo: admin</span>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? <div style={styles.spinner} /> : 'Ingresar al Panel'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#050505',
    backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(249, 115, 22, 0.08) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(52, 211, 153, 0.05) 0%, transparent 40%)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  glassCard: {
    width: 440,
    padding: '40px',
    backgroundColor: 'rgba(20, 20, 20, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoNomi: {
    fontSize: '36px',
    fontWeight: 900,
    color: '#F97316',
    letterSpacing: '0.15em',
    textShadow: '0 0 20px rgba(249, 115, 22, 0.3)',
  },
  logoSub: {
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.25em',
    marginTop: '6px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#F5F5F0',
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: '#888',
    margin: '0 0 10px 0',
    lineHeight: '1.4',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#EF4444',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 500,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#A0A0A0',
  },
  input: {
    backgroundColor: '#0F0F0F',
    border: '1px solid #1C1C1C',
    borderRadius: '12px',
    padding: '14px',
    color: '#FFF',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    ':focus': {
      borderColor: '#F97316',
      boxShadow: '0 0 8px rgba(249, 115, 22, 0.2)',
    }
  },
  select: {
    backgroundColor: '#0F0F0F',
    border: '1px solid #1C1C1C',
    borderRadius: '12px',
    padding: '14px',
    color: '#FFF',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
  },
  hint: {
    fontSize: '11px',
    color: '#6B6B6B',
    marginTop: '4px',
  },
  submitBtn: {
    backgroundColor: '#F97316',
    color: '#FFF',
    border: 'none',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'transform 0.2s, background-color 0.2s, box-shadow 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '10px',
    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)',
    ':hover': {
      backgroundColor: '#EA580C',
      transform: 'translateY(-1px)',
      boxShadow: '0 6px 16px rgba(249, 115, 22, 0.3)',
    }
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid #FFF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  }
};

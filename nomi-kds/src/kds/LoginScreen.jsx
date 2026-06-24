import React, { useState } from 'react';
import { db, auth } from '../firebase/firebaseconfig';
import { collection, query, where, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';

// ─── Mode constants ───────────────────────────────────────────────────────────
const MODE_LOGIN  = 'login';
const MODE_SIGNUP = 'signup';

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState(MODE_LOGIN);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup fields
  const [signupName,            setSignupName]            = useState('');
  const [signupEmail,           setSignupEmail]           = useState('');
  const [signupPassword,        setSignupPassword]        = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const [restaurantName,        setRestaurantName]        = useState('');
  const [restaurantAddress,     setRestaurantAddress]     = useState('');
  const [restaurantPhone,       setRestaurantPhone]       = useState('');

  // Shared
  const [loading,     setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  // ── SWITCH MODE ──────────────────────────────────────────────────────────────
  const switchTo = (m) => {
    setMode(m);
    setError('');
    setSuccess('');
  };

  // ── RESOLVE PROFILE → onLogin ────────────────────────────────────────────────
  // Takes a Firestore profile object and calls onLogin if role is valid.
  // Returns an error string if the role is not allowed, or null on success.
  const resolveProfile = (profile, displayName) => {
    if (!profile) return 'Tu cuenta no tiene un perfil asociado en el sistema.';

    if (profile.role === 'admin') {
      onLogin('all', profile.name || displayName, 'Administrador General');
      return null;
    }

    if (profile.role === 'restaurant') {
      if (profile.status === 'pending_verification') {
        return 'Tu cuenta está pendiente de aprobación. El administrador te avisará por correo.';
      }
      if (!profile.restaurantId) {
        return 'Tu cuenta no tiene un restaurante asignado. Contacta al administrador.';
      }
      onLogin(profile.restaurantId, profile.name || displayName, profile.restaurantName || 'Cocina Nomi');
      return null;
    }

    return 'Acceso denegado. Este panel es exclusivo para personal del restaurante.';
  };

  // ── LOGIN (correo + password via Firebase Auth) ─────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const credential = await signInWithEmailAndPassword(auth, loginEmail.trim(), password);
      const uid = credential.user.uid;
      const snap = await getDoc(doc(db, 'users', uid));
      
      if (!snap.exists()) {
        setError('El perfil no existe en el sistema.');
        await auth.signOut();
      } else {
        const profile = snap.data();
        const err = resolveProfile(profile, profile.name || loginEmail);
        if (err) {
          setError(err);
          await auth.signOut();
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError('Error al iniciar sesión. Verifica tus credenciales.');
      }
    }
    setLoading(false);
  };

  // ── GOOGLE SIGN-IN ────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result  = await signInWithPopup(auth, provider);
      const uid     = result.user.uid;
      const displayName = result.user.displayName || result.user.email;

      // Check if this Google account has a profile in Firestore
      const profileSnap = await getDoc(doc(db, 'users', uid));

      if (!profileSnap.exists()) {
        // No profile → not registered in the system
        setError(
          'Tu cuenta de Google no está registrada en el sistema. ' +
          'Usa la pestaña "Postular Restaurante" para solicitar acceso.'
        );
        // Sign out so auth state doesn't persist
        await auth.signOut();
        setGoogleLoading(false);
        return;
      }

      const profile = profileSnap.data();
      const err = resolveProfile(profile, displayName);
      if (err) {
        setError(err);
        await auth.signOut();
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed popup — silent, no error
      } else if (err.code === 'auth/popup-blocked') {
        setError('Tu navegador bloqueó la ventana de Google. Permite popups para este sitio e intenta de nuevo.');
      } else {
        setError('Error al iniciar sesión con Google. Intenta de nuevo.');
      }
    }
    setGoogleLoading(false);
  };

  // ── SIGNUP (postulación de restaurante) ──────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!signupName || !signupEmail || !signupPassword || !restaurantName || !restaurantAddress) {
      setError('Completa todos los campos obligatorios.');
      return;
    }
    if (signupPassword !== signupPasswordConfirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (signupPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      // 1. Crear cuenta en Firebase Auth
      const credential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      const uid = credential.user.uid;

      // 2. Guardar perfil en Firestore (mismo esquema que Prototipo1)
      const profile = {
        name:           signupName,
        email:          signupEmail,
        role:           'restaurant',
        status:         'pending_verification',  // admin lo aprueba
        restaurantName,
        address:        restaurantAddress,
        phone:          restaurantPhone,
        lat:            19.4326,
        lng:            -99.1332,
        createdAt:      new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', uid), profile);

      // Sign out so they wait for approval before actually logging in
      await auth.signOut();

      setSuccess(
        '¡Solicitud enviada correctamente! El equipo administrativo revisará ' +
        'tu postulación y activará tu acceso. Te notificaremos por correo a ' +
        signupEmail + '.'
      );
    } catch (err) {
      console.error('Signup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Ese correo ya tiene una cuenta registrada.');
      } else {
        setError(err.message || 'Error al enviar la solicitud. Intenta de nuevo.');
      }
    }
    setLoading(false);
  };

  // ── GOOGLE SIGN-UP (postulación con cuenta de Google) ────────────────────────
  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError('');
    setSuccess('');

    if (!restaurantName || !restaurantAddress) {
      setError('Antes de continuar con Google, completa el nombre y la dirección del restaurante.');
      setGoogleLoading(false);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result  = await signInWithPopup(auth, provider);
      const uid     = result.user.uid;
      const gUser   = result.user;

      // Check if already registered
      const existing = await getDoc(doc(db, 'users', uid));
      if (existing.exists()) {
        setError('Esta cuenta de Google ya está registrada. Ve a "Iniciar Sesión" para ingresar.');
        await auth.signOut();
        setGoogleLoading(false);
        return;
      }

      const profile = {
        name:           gUser.displayName || signupName || 'Usuario Google',
        email:          gUser.email,
        role:           'restaurant',
        status:         'pending_verification',
        restaurantName,
        address:        restaurantAddress,
        phone:          restaurantPhone,
        lat:            19.4326,
        lng:            -99.1332,
        createdAt:      new Date().toISOString(),
        googleLinked:   true,
      };
      await setDoc(doc(db, 'users', uid), profile);
      await auth.signOut();

      setSuccess(
        '¡Solicitud enviada con tu cuenta de Google! El equipo administrativo ' +
        'revisará tu postulación y activará tu acceso. Te notificaremos a ' +
        gUser.email + '.'
      );
    } catch (err) {
      console.error('Google signup error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        // silent
      } else {
        setError('Error al conectar con Google. Intenta de nuevo.');
      }
    }
    setGoogleLoading(false);
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={s.container}>
      <div style={s.glassCard}>

        {/* Header */}
        <div style={s.header}>
          <span style={s.logoNomi}>NOMI</span>
          <span style={s.logoSub}>Kitchen Operations</span>
        </div>

        {/* Tab Switcher */}
        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(mode === MODE_LOGIN  ? s.tabActive : {}) }}
            onClick={() => switchTo(MODE_LOGIN)}
            type="button"
          >
            Iniciar Sesión
          </button>
          <button
            style={{ ...s.tab, ...(mode === MODE_SIGNUP ? s.tabActive : {}) }}
            onClick={() => switchTo(MODE_SIGNUP)}
            type="button"
          >
            Postular Restaurante
          </button>
        </div>

        {/* ── LOGIN FORM ── */}
        {mode === MODE_LOGIN && (
          <form onSubmit={handleLogin} style={s.form}>
            <div>
              <h2 style={s.formTitle}>Bienvenido</h2>
              <p style={s.subtitle}>Ingresa tus credenciales asignadas por la administración.</p>
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            <div style={s.inputGroup}>
              <label style={s.label}>Correo Electrónico</label>
              <input
                type="email"
                placeholder="Ej. chef@restaurante.com"
                style={s.input}
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div style={s.inputGroup}>
              <label style={s.label}>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                style={s.input}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading || googleLoading} style={s.submitBtn}>
              {loading ? <div style={s.spinner} /> : 'Ingresar al Panel'}
            </button>

            {/* Divider */}
            <div style={s.divider}>
              <div style={s.dividerLine} />
              <span style={s.dividerText}>o continúa con</span>
              <div style={s.dividerLine} />
            </div>

            {/* Google Sign-In */}
            <button
              type="button"
              style={s.googleBtn}
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <div style={{ ...s.spinner, borderTopColor: '#1E293B' }} />
              ) : (
                <>
                  <GoogleIcon />
                  <span>Continuar con Google</span>
                </>
              )}
            </button>

            <p style={s.hint}>
              ¿Aún no tienes acceso?{' '}
              <span style={s.hintLink} onClick={() => switchTo(MODE_SIGNUP)}>
                Postula tu restaurante aquí
              </span>
            </p>
          </form>
        )}

        {/* ── SIGNUP FORM ── */}
        {mode === MODE_SIGNUP && (
          <form onSubmit={handleSignup} style={s.form}>
            <div>
              <h2 style={s.formTitle}>Postulación de Restaurante</h2>
              <p style={s.subtitle}>
                Registra tu negocio. El equipo de NOMI revisará tu solicitud
                y activará tu cuenta cuando sea aprobada.
              </p>
            </div>

            {error   && <div style={s.errorBox}>{error}</div>}
            {success && <div style={s.successBox}>{success}</div>}

            {!success && (
              <>
                {/* ── Datos del contacto ── */}
                <div style={s.sectionLabel}>Datos del Contacto</div>

                <div style={s.inputGroup}>
                  <label style={s.label}>Nombre Completo *</label>
                  <input
                    type="text"
                    placeholder="Ej. Carlos Mendoza"
                    style={s.input}
                    value={signupName}
                    onChange={e => setSignupName(e.target.value)}
                  />
                </div>

                <div style={s.inputGroup}>
                  <label style={s.label}>Correo Electrónico *</label>
                  <input
                    type="email"
                    placeholder="contacto@mirestaurante.com"
                    style={s.input}
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                  />
                </div>

                <div style={s.row}>
                  <div style={{ ...s.inputGroup, flex: 1 }}>
                    <label style={s.label}>Contraseña *</label>
                    <input
                      type="password"
                      placeholder="Mín. 6 caracteres"
                      style={s.input}
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                    />
                  </div>
                  <div style={{ ...s.inputGroup, flex: 1 }}>
                    <label style={s.label}>Confirmar Contraseña *</label>
                    <input
                      type="password"
                      placeholder="Repite tu contraseña"
                      style={s.input}
                      value={signupPasswordConfirm}
                      onChange={e => setSignupPasswordConfirm(e.target.value)}
                    />
                  </div>
                </div>

                {/* ── Datos del restaurante ── */}
                <div style={s.sectionLabel}>Datos del Restaurante</div>

                <div style={s.inputGroup}>
                  <label style={s.label}>Nombre del Restaurante / Cocina *</label>
                  <input
                    type="text"
                    placeholder="Ej. Katsu Healthy Bowls"
                    style={s.input}
                    value={restaurantName}
                    onChange={e => setRestaurantName(e.target.value)}
                    required
                  />
                </div>

                <div style={s.inputGroup}>
                  <label style={s.label}>Dirección Física *</label>
                  <input
                    type="text"
                    placeholder="Calle, número, colonia, ciudad"
                    style={s.input}
                    value={restaurantAddress}
                    onChange={e => setRestaurantAddress(e.target.value)}
                    required
                  />
                </div>

                <div style={s.inputGroup}>
                  <label style={s.label}>Teléfono de Contacto</label>
                  <input
                    type="tel"
                    placeholder="10 dígitos"
                    style={s.input}
                    value={restaurantPhone}
                    onChange={e => setRestaurantPhone(e.target.value)}
                  />
                </div>

                <div style={s.infoBox}>
                  📋 Una vez enviada tu solicitud, el administrador la revisará y activará
                  tu acceso al panel KDS. Te notificaremos por correo electrónico.
                </div>

                {/* Submit with email/password */}
                <button type="submit" disabled={loading || googleLoading} style={s.submitBtn}>
                  {loading ? <div style={s.spinner} /> : 'Enviar Solicitud'}
                </button>

                {/* Divider */}
                <div style={s.divider}>
                  <div style={s.dividerLine} />
                  <span style={s.dividerText}>o regístrate con</span>
                  <div style={s.dividerLine} />
                </div>

                {/* Google Sign-Up */}
                <button
                  type="button"
                  style={s.googleBtn}
                  onClick={handleGoogleSignup}
                  disabled={loading || googleLoading}
                >
                  {googleLoading ? (
                    <div style={{ ...s.spinner, borderTopColor: '#1E293B' }} />
                  ) : (
                    <>
                      <GoogleIcon />
                      <span>Postular con Google</span>
                    </>
                  )}
                </button>

                <p style={s.hint}>
                  ¿Ya tienes acceso?{' '}
                  <span style={s.hintLink} onClick={() => switchTo(MODE_LOGIN)}>
                    Inicia sesión aquí
                  </span>
                </p>
              </>
            )}

            {success && (
              <button type="button" style={s.submitBtn} onClick={() => switchTo(MODE_LOGIN)}>
                Ir a Iniciar Sesión
              </button>
            )}
          </form>
        )}

      </div>
    </div>
  );
}

// ─── Google Icon SVG ──────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#050505',
    overflowY: 'auto',
    backgroundImage:
      'radial-gradient(circle at 20% 30%, rgba(249,115,22,0.09) 0%, transparent 40%),' +
      'radial-gradient(circle at 80% 70%, rgba(52,211,153,0.05) 0%, transparent 40%)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: '24px 16px',
    boxSizing: 'border-box',
  },
  glassCard: {
    width: '100%',
    maxWidth: 520,
    margin: 'auto',
    padding: '36px 32px',
    backgroundColor: 'rgba(20,20,20,0.82)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '24px',
    boxShadow: '0 24px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
    backdropFilter: 'blur(18px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  logoNomi: {
    fontSize: '34px',
    fontWeight: 900,
    color: '#F97316',
    letterSpacing: '0.15em',
    textShadow: '0 0 24px rgba(249,115,22,0.35)',
  },
  logoSub: {
    fontSize: '10px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.28em',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: '14px',
    padding: '4px',
  },
  tab: {
    flex: 1,
    padding: '10px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#666',
    background: 'none',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    backgroundColor: '#F97316',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(249,115,22,0.30)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#F5F5F0',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: '#777',
    margin: 0,
    lineHeight: '1.5',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#F97316',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(249,115,22,0.2)',
    paddingBottom: '6px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#A0A0A0',
  },
  input: {
    backgroundColor: '#0F0F0F',
    border: '1px solid #1C1C1C',
    borderRadius: '10px',
    padding: '13px 14px',
    color: '#FFF',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
    transition: 'border-color 0.2s ease',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  submitBtn: {
    backgroundColor: '#F97316',
    color: '#FFF',
    border: 'none',
    borderRadius: '12px',
    padding: '15px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(249,115,22,0.25)',
    transition: 'opacity 0.2s ease',
    marginTop: '4px',
    width: '100%',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E1E1E',
  },
  dividerText: {
    fontSize: '11px',
    color: '#444',
    whiteSpace: 'nowrap',
    fontWeight: 500,
  },
  googleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    backgroundColor: '#F8FAFC',
    color: '#1E293B',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 16px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease, transform 0.1s ease',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #FFF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.10)',
    border: '1px solid rgba(239,68,68,0.30)',
    color: '#EF4444',
    padding: '12px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 500,
  },
  successBox: {
    backgroundColor: 'rgba(52,211,153,0.10)',
    border: '1px solid rgba(52,211,153,0.30)',
    color: '#34D399',
    padding: '14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 500,
    lineHeight: '1.6',
  },
  infoBox: {
    backgroundColor: 'rgba(249,115,22,0.07)',
    border: '1px solid rgba(249,115,22,0.15)',
    color: '#F97316',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '12px',
    lineHeight: '1.6',
  },
  hint: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#555',
    margin: 0,
  },
  hintLink: {
    color: '#F97316',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

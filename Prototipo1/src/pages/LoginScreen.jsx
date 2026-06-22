// src/pages/LoginScreen.jsx

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent, IonSpinner } from "@ionic/react";

export default function LoginScreen() {
  const { login, loginWithGoogle, registerClient, registerNutriologist } = useApp();
  const history = useHistory();

  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [accountType, setAccountType] = useState("client"); // "client" | "nutriologist"
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [license, setLicense] = useState("");
  const [phone, setPhone] = useState("");
  
  // Status states
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!email || !password) {
      setErrorMsg("Completa los campos obligatorios.");
      setLoading(false);
      return;
    }

    let res;
    if (mode === "login") {
      res = await login(email, password);
    } else {
      if (!name) {
        setErrorMsg("Por favor, ingresa tu nombre.");
        setLoading(false);
        return;
      }
      if (accountType === "client") {
        res = await registerClient(name, email, password);
      } else {
        if (!license || !phone) {
          setErrorMsg("Completa tu cédula profesional y teléfono de contacto.");
          setLoading(false);
          return;
        }
        res = await registerNutriologist(name, email, password, license, phone);
      }
    }

    setLoading(false);

    if (res.success) {
      // Success feedback
      alert(mode === "login" ? "¡Sesión iniciada con éxito!" : "¡Registro completado exitosamente!");
      history.push("/home");
    } else {
      setErrorMsg(res.error || "Ocurrió un error. Intenta de nuevo.");
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setLoading(true);
    const res = await loginWithGoogle();
    setLoading(false);
    if (res.success) {
      alert("¡Sesión iniciada con Google!");
      history.push("/home");
    } else if (res.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <div style={styles.container}>
          
          {/* Logo / Header */}
          <div style={styles.header}>
            <div style={styles.logoPill}>
              <span style={styles.logoText}>nomi</span>
              <span style={styles.logoDot}>•</span>
              <span style={styles.logoSubtext}>foodtech</span>
            </div>
            <h1 style={styles.title}>Nutrición de precisión a tu puerta.</h1>
            <p style={styles.subtitle}>
              El eslabón perdido entre la dieta recetada y el plato en tu mesa.
            </p>
          </div>

          {/* Form Card */}
          <div style={styles.formCard}>
            
            <h2 style={styles.formTitle}>
              {mode === "login" ? "Iniciar Sesión" : "Crear una Cuenta"}
            </h2>

            {/* Error Banner */}
            {errorMsg && <div style={styles.errorBanner}>⚠️ {errorMsg}</div>}

            {/* Auth Form */}
            <form onSubmit={handleAuth} style={styles.form}>
              
              {mode === "signup" && (
                <>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Tipo de Perfil</label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      style={styles.select}
                    >
                      <option value="client">Cliente / Paciente</option>
                      <option value="nutriologist">Nutriólogo Clínico</option>
                    </select>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Nombre Completo</label>
                    <input
                      type="text"
                      placeholder="Ej. Carlos Mendoza"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={styles.input}
                      required
                    />
                  </div>
                </>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.label}>Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Contraseña</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              {mode === "signup" && accountType === "nutriologist" && (
                <>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Cédula Profesional</label>
                    <input
                      type="text"
                      placeholder="Cédula Federal o Estatal"
                      value={license}
                      onChange={(e) => setLicense(e.target.value)}
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Teléfono de Contacto</label>
                    <input
                      type="tel"
                      placeholder="10 dígitos"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={styles.input}
                      required
                    />
                  </div>
                </>
              )}

              <button type="submit" style={styles.submitBtn} disabled={loading}>
                {loading ? (
                  <IonSpinner name="crescent" color="dark" style={{ height: 20 }} />
                ) : mode === "login" ? (
                  "Iniciar Sesión"
                ) : (
                  "Registrarme"
                )}
              </button>

              {/* Mode Toggle Button */}
              <div style={styles.toggleContainer}>
                {mode === "login" ? (
                  <p style={styles.toggleText}>
                    ¿No tienes cuenta?{" "}
                    <span style={styles.toggleLink} onClick={() => { setMode("signup"); setErrorMsg(""); }}>
                      Regístrate aquí
                    </span>
                  </p>
                ) : (
                  <p style={styles.toggleText}>
                    ¿Ya tienes una cuenta?{" "}
                    <span style={styles.toggleLink} onClick={() => { setMode("login"); setErrorMsg(""); }}>
                      Inicia sesión aquí
                    </span>
                  </p>
                )}
              </div>

              {/* Divider */}
              <div style={styles.orDivider}>
                <div style={styles.orLine} />
                <span style={styles.orText}>o continúa con</span>
                <div style={styles.orLine} />
              </div>

              {/* Google Sign-In Button */}
              <button
                type="button"
                style={styles.googleBtn}
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Continuar con Google</span>
              </button>
            </form>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

const styles = {
  container: {
    backgroundColor: "#0B0B0C",
    minHeight: "100vh",
    maxWidth: 480,
    margin: "0 auto",
    padding: "36px 20px 48px 20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    marginBottom: 24,
  },
  logoPill: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    border: "1px solid rgba(249, 115, 22, 0.25)",
    borderRadius: 20,
    padding: "6px 16px",
    marginBottom: 16,
  },
  logoText: {
    color: "#F97316",
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: "-0.04em",
  },
  logoDot: {
    color: "#F97316",
    fontSize: 14,
  },
  logoSubtext: {
    color: "#E2E8F0",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontWeight: 600,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.2,
    margin: "0 0 8px 0",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 1.5,
    margin: 0,
    padding: "0 12px",
  },
  formCard: {
    backgroundColor: "#131316",
    borderRadius: 24,
    padding: "24px 20px",
    border: "1px solid #222227",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
  },
  formTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 20,
    marginTop: 0,
    textAlign: "left",
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 13,
    color: "#EF4444",
    marginBottom: 20,
    textAlign: "left",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    textAlign: "left",
  },
  label: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: 500,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    borderRadius: 12,
    color: "#F8FAFC",
    padding: "14px 16px",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  select: {
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    borderRadius: 12,
    color: "#F8FAFC",
    padding: "14px 16px",
    fontSize: 14,
    outline: "none",
    cursor: "pointer",
  },
  submitBtn: {
    backgroundColor: "#F97316",
    color: "#000000",
    border: "none",
    borderRadius: 14,
    padding: "16px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.2s ease",
  },
  toggleContainer: {
    textAlign: "center",
    marginTop: 8,
  },
  toggleText: {
    color: "#94A3B8",
    fontSize: 13,
    margin: 0,
  },
  toggleLink: {
    color: "#F97316",
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "underline",
  },
  orDivider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "4px 0",
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#222227",
  },
  orText: {
    fontSize: 11,
    color: "#475569",
    whiteSpace: "nowrap",
    fontWeight: 500,
  },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    color: "#1E293B",
    border: "none",
    borderRadius: 14,
    padding: "14px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s ease, transform 0.1s ease",
  },
};

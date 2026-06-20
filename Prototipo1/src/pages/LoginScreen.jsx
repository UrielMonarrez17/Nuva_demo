// src/pages/LoginScreen.jsx

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent, IonSpinner } from "@ionic/react";

export default function LoginScreen() {
  const { login, loginWithGoogle, registerClient, registerNutriologist } = useApp();
  const history = useHistory();

  const [activeTab, setActiveTab] = useState("login"); // "login" | "signup_client" | "signup_nutri"
  
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
    if (activeTab === "login") {
      res = await login(email, password);
    } else if (activeTab === "signup_client") {
      if (!name) {
        setErrorMsg("Por favor, ingresa tu nombre.");
        setLoading(false);
        return;
      }
      res = await registerClient(name, email, password);
    } else {
      if (!name || !license || !phone) {
        setErrorMsg("Completa tu nombre, cédula y teléfono.");
        setLoading(false);
        return;
      }
      res = await registerNutriologist(name, email, password, license, phone);
    }

    setLoading(false);

    if (res.success) {
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
      history.push("/home");
    } else if (res.error) {
      setErrorMsg(res.error);
    }
  };

  const handleDemoAccess = async (type) => {
    setErrorMsg("");
    setLoading(true);
    const demoEmail = type === "nutri" ? "demo.nutriologo@nomi.com" : "demo.cliente@nomi.com";
    const res = await login(demoEmail, "123456");
    setLoading(false);
    if (res.success) {
      history.push("/home");
    } else {
      setErrorMsg("Error al acceder con cuenta demo.");
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
            
            {/* Sliding Tabs */}
            <div style={styles.tabsContainer}>
              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "login" ? styles.activeTabButton : {}),
                }}
                onClick={() => { setActiveTab("login"); setErrorMsg(""); }}
              >
                Entrar
              </button>
              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "signup_client" ? styles.activeTabButton : {}),
                }}
                onClick={() => { setActiveTab("signup_client"); setErrorMsg(""); }}
              >
                Cliente
              </button>
              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "signup_nutri" ? styles.activeTabButton : {}),
                }}
                onClick={() => { setActiveTab("signup_nutri"); setErrorMsg(""); }}
              >
                Nutriólogo
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && <div style={styles.errorBanner}>⚠️ {errorMsg}</div>}

            {/* Auth Form */}
            <form onSubmit={handleAuth} style={styles.form}>
              {(activeTab === "signup_client" || activeTab === "signup_nutri") && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nombre Completo</label>
                  <input
                    type="text"
                    placeholder="Ej. Dr. Alejandro Gómez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.label}>Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="nombre@ejemplo.com"
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

              {activeTab === "signup_nutri" && (
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
                ) : activeTab === "login" ? (
                  "Iniciar Sesión"
                ) : activeTab === "signup_client" ? (
                  "Registrarme"
                ) : (
                  "Enviar Postulación"
                )}
              </button>

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

          {/* Quick Demos Section for Reviewers */}
          <div style={styles.demoSection}>
            <div style={styles.demoDivider}>
              <span style={styles.demoDividerText}>Acceso Rápido Demo</span>
            </div>
            <p style={styles.demoCaption}>
              Prueba los dos flujos al instante sin registrarte:
            </p>
            <div style={styles.demoButtonsRow}>
              <button
                style={{ ...styles.demoBtn, border: "1px solid #F97316", color: "#F97316" }}
                onClick={() => handleDemoAccess("client")}
                disabled={loading}
              >
                👤 Demo Cliente
              </button>
              <button
                style={{ ...styles.demoBtn, border: "1px solid #A78BFA", color: "#A78BFA" }}
                onClick={() => handleDemoAccess("nutri")}
                disabled={loading}
              >
                🩺 Demo Nutriólogo
              </button>
            </div>
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
    padding: "48px 24px 64px 24px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    marginBottom: 32,
    marginTop: 16,
  },
  logoPill: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    border: "1px solid rgba(249, 115, 22, 0.25)",
    borderRadius: 20,
    padding: "6px 16px",
    marginBottom: 20,
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
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1.2,
    margin: "0 0 12px 0",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
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
  tabsContainer: {
    display: "flex",
    backgroundColor: "#0B0B0C",
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    border: "1px solid #1A1A1E",
  },
  tabButton: {
    flex: 1,
    padding: "10px 4px",
    backgroundColor: "transparent",
    color: "#94A3B8",
    border: "none",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.25s ease",
  },
  activeTabButton: {
    backgroundColor: "#F97316",
    color: "#000000",
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
    ":focus": {
      borderColor: "#F97316",
    },
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
  demoSection: {
    marginTop: 40,
    textAlign: "center",
  },
  demoDivider: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  demoDividerText: {
    backgroundColor: "#0B0B0C",
    padding: "0 12px",
    color: "#475569",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontWeight: 600,
  },
  demoCaption: {
    color: "#94A3B8",
    fontSize: 12,
    margin: "0 0 16px 0",
  },
  demoButtonsRow: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
  },
  demoBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: "12px 8px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s ease",
    ":hover": {
      backgroundColor: "rgba(255,255,255,0.05)",
    },
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

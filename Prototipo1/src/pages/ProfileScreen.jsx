// src/pages/ProfileScreen.jsx

import React from "react";
import { useApp } from "../context/AppContext";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { 
  logOutOutline, 
  locationOutline, 
  timeOutline, 
  swapHorizontalOutline,
  bagHandleOutline,
  documentTextOutline,
  chevronForwardOutline
} from "ionicons/icons";

export default function ProfileScreen() {
  const { 
    userProfile, 
    activeRole, 
    changeRoleDualMode, 
    orders, 
    addresses, 
    logout, 
    verifyLicenseDemo 
  } = useApp();
  
  const history = useHistory();

  const handleLogout = async () => {
    await logout();
    history.push("/login");
  };

  const isNutriologist = userProfile?.role === "nutriologist";
  const isVerified = userProfile?.status === "verified";

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <div style={styles.screen}>
          
          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.title}>Mi Cuenta</h1>
            <button style={styles.logoutBtn} onClick={handleLogout}>
              <IonIcon icon={logOutOutline} style={{ marginRight: 4 }} />
              Salir
            </button>
          </div>

          {/* User Profile Card */}
          <div style={styles.profileCard}>
            <div style={styles.avatar}>
              {userProfile?.name?.charAt(0).toUpperCase() || "N"}
            </div>
            <div style={styles.profileDetails}>
              <h2 style={styles.userName}>{userProfile?.name || "Usuario Nomi"}</h2>
              <p style={styles.userEmail}>{userProfile?.email}</p>
              
              <div style={styles.badgeRow}>
                <span style={{
                  ...styles.roleBadge,
                  backgroundColor: isNutriologist ? "rgba(167, 139, 250, 0.15)" : "rgba(249, 115, 22, 0.15)",
                  color: isNutriologist ? "#A78BFA" : "#F97316"
                }}>
                  {isNutriologist ? "Nutriólogo Clínico" : "Cliente"}
                </span>
                
                {isNutriologist && (
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: isVerified ? "rgba(52, 211, 153, 0.15)" : "rgba(251, 191, 36, 0.15)",
                    color: isVerified ? "#34D399" : "#FBBF24"
                  }}>
                    {isVerified ? "Cédula Verificada" : "Pendiente de Cédula"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Verification Bypass Helper (Only visible for pending nutriologists) */}
          {isNutriologist && !isVerified && (
            <div style={styles.verificationPromo}>
              <div style={styles.promoIcon}>🩺</div>
              <div>
                <h3 style={styles.promoTitle}>Verifica tu perfil profesional</h3>
                <p style={styles.promoText}>
                  Como nutriólogo registrado, necesitas verificar tu cédula para poder recetar platos a tus pacientes.
                </p>
                <button style={styles.promoBtn} onClick={verifyLicenseDemo}>
                  Verificar Cédula Ahora (Prueba)
                </button>
              </div>
            </div>
          )}

          {/* Dual Mode Switch (Only for Nutriologists) */}
          {isNutriologist && (
            <div style={styles.dualModeContainer}>
              <h3 style={styles.sectionTitle}>Modo de Visualización</h3>
              <p style={styles.sectionDesc}>
                Cambia de rol para pedir tu propia comida o recetar a tus pacientes.
              </p>
              
              <div style={styles.toggleRow}>
                <button
                  style={{
                    ...styles.toggleBtn,
                    backgroundColor: activeRole === "client" ? "#F97316" : "#131316",
                    color: activeRole === "client" ? "#000000" : "#94A3B8",
                    borderColor: activeRole === "client" ? "#F97316" : "#222227"
                  }}
                  onClick={() => changeRoleDualMode("client")}
                >
                  🛒 Comprar para Mí
                </button>
                
                <button
                  style={{
                    ...styles.toggleBtn,
                    backgroundColor: activeRole === "nutriologist" ? "#A78BFA" : "#131316",
                    color: activeRole === "nutriologist" ? "#000000" : "#94A3B8",
                    borderColor: activeRole === "nutriologist" ? "#A78BFA" : "#222227"
                  }}
                  onClick={() => {
                    if (isVerified) {
                      changeRoleDualMode("nutriologist");
                    } else {
                      alert("Primero debes verificar tu Cédula Profesional (puedes usar el botón de auto-verificar arriba).");
                    }
                  }}
                >
                  🩺 Recetar a Paciente
                </button>
              </div>
            </div>
          )}

          {/* Medical Inbox Link */}
          {!isNutriologist && (
            <div style={styles.section}>
              <div 
                style={styles.menuItem} 
                onClick={() => history.push("/medical-inbox")}
              >
                <div style={styles.menuItemLeft}>
                  <div style={{...styles.iconWrapper, backgroundColor: "rgba(249, 115, 22, 0.1)", color: "#F97316"}}>
                    <IonIcon icon={documentTextOutline} />
                  </div>
                  <span>Buzón Médico / Recetas</span>
                </div>
                <IonIcon icon={chevronForwardOutline} style={styles.chevron} />
              </div>
            </div>
          )}

          {/* Saved Addresses List */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Direcciones Guardadas</h3>
            <div style={styles.addressesList}>
              {addresses.map((addr) => (
                <div key={addr.id} style={styles.addressItem}>
                  <IonIcon 
                    icon={locationOutline} 
                    style={{ ...styles.addrIcon, color: addr.active ? "#F97316" : "#64748B" }} 
                  />
                  <div>
                    <span style={styles.addrStreet}>{addr.street}</span>
                    <span style={styles.addrSub}>{addr.neighborhood}, {addr.city}</span>
                  </div>
                  {addr.active && <span style={styles.activeLabel}>Activa</span>}
                </div>
              ))}
            </div>
          </div>



          {/* Bottom navigation padding */}
          <div style={{ height: 100 }} />
        </div>
      </IonContent>
    </IonPage>
  );
}

const styles = {
  screen: {
    backgroundColor: "#0B0B0C",
    minHeight: "100vh",
    maxWidth: 480,
    margin: "0 auto",
    padding: "24px 20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#F8FAFC",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    margin: 0,
    letterSpacing: "-0.02em",
  },
  logoutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#EF4444",
    borderRadius: 10,
    padding: "8px 14px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  profileCard: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 24,
    padding: "20px",
    display: "flex",
    gap: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    backgroundColor: "#F97316",
    color: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: 800,
  },
  profileDetails: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: 800,
    margin: 0,
    color: "#F8FAFC",
  },
  userEmail: {
    fontSize: 12,
    color: "#64748B",
    margin: 0,
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  roleBadge: {
    fontSize: 9,
    fontWeight: 700,
    borderRadius: 6,
    padding: "3px 8px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: 700,
    borderRadius: 6,
    padding: "3px 8px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  verificationPromo: {
    backgroundColor: "rgba(167, 139, 250, 0.08)",
    border: "1px solid rgba(167, 139, 250, 0.2)",
    borderRadius: 20,
    padding: "16px",
    display: "flex",
    gap: 14,
    marginBottom: 24,
  },
  promoIcon: {
    fontSize: 28,
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#A78BFA",
    margin: "0 0 4px 0",
  },
  promoText: {
    fontSize: 11,
    color: "#94A3B8",
    lineHeight: 1.4,
    margin: "0 0 12px 0",
  },
  promoBtn: {
    backgroundColor: "#A78BFA",
    color: "#000000",
    border: "none",
    borderRadius: 10,
    padding: "8px 16px",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  },
  dualModeContainer: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 4px 0",
  },
  sectionDesc: {
    fontSize: 12,
    color: "#94A3B8",
    margin: "0 0 14px 0",
  },
  toggleRow: {
    display: "flex",
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 14,
    padding: "12px 6px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    transition: "all 0.2s ease",
  },
  section: {
    marginBottom: 28,
  },
  addressesList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 12,
  },
  addressItem: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 16,
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  addrIcon: {
    fontSize: 18,
  },
  addrStreet: {
    fontSize: 13,
    fontWeight: 700,
    color: "#F8FAFC",
    display: "block",
  },
  addrSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    display: "block",
  },
  activeLabel: {
    marginLeft: "auto",
    fontSize: 9,
    fontWeight: 700,
    color: "#F97316",
    backgroundColor: "rgba(249, 115, 22, 0.08)",
    padding: "2px 8px",
    borderRadius: 5,
    textTransform: "uppercase",
  },
  emptyOrders: {
    backgroundColor: "#131316",
    border: "1px dashed #222227",
    borderRadius: 16,
    padding: "24px",
    textAlign: "center",
    color: "#64748B",
    fontSize: 13,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  emptyOrdersIcon: {
    fontSize: 24,
  },
  ordersList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 12,
  },
  orderCard: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 20,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderDate: {
    fontSize: 10,
    color: "#64748B",
  },
  orderItemsTitle: {
    fontSize: 14,
    fontWeight: 700,
    margin: "4px 0 0 0",
    color: "#F8FAFC",
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: 700,
    color: "#F97316",
  },
  orderFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 11,
    color: "#94A3B8",
    borderTop: "1px solid #222227",
    paddingTop: 10,
  },
  orderAddress: {
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
    maxWidth: 200,
  },
  orderMacros: {
    color: "#64748B",
  },
  menuItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 16,
    padding: "16px",
    cursor: "pointer",
  },
  menuItemLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 15,
    fontWeight: 600,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
  },
  chevron: {
    color: "#64748B",
    fontSize: 20,
  }
};

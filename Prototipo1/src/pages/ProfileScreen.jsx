// src/pages/ProfileScreen.jsx

import React, { useState, useEffect } from "react";
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
import MapPicker from "../components/MapPicker";
import { db } from "../firebase/firebaseconfig";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore";

export default function ProfileScreen() {
  const { 
    userProfile, 
    activeRole, 
    changeRoleDualMode, 
    orders, 
    addresses, 
    logout,
    registerRestaurant
  } = useApp();
  
  const history = useHistory();
  const [showVerifModal, setShowVerifModal] = useState(false);
  const [pendingNutriologists, setPendingNutriologists] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const handleLogout = async () => {
    if (window.confirm("¿Seguro que deseas cerrar tu sesión?")) {
      await logout();
      history.push("/login");
    }
  };

  const isNutriologist = userProfile?.role === "nutriologist";
  const isVerified = userProfile?.status === "verified";
  const isAdmin = userProfile?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    
    const q = query(
      collection(db, "users"),
      where("role", "==", "nutriologist"),
      where("status", "==", "pending")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingNutriologists(list);
    });
    
    return () => unsubscribe();
  }, [isAdmin]);

  const handleApproveNutriologist = async (nutri) => {
    if (window.confirm(`¿Confirmas que deseas aprobar al nutriólogo "${nutri.name}" con cédula "${nutri.professionalLicense}"?`)) {
      try {
        setLoadingRequests(true);
        const userRef = doc(db, "users", nutri.id);
        await updateDoc(userRef, {
          status: "verified"
        });
        alert("¡Nutriólogo aprobado y verificado con éxito!");
      } catch (e) {
        console.error(e);
        alert("Ocurrió un error al aprobar al nutriólogo.");
      } finally {
        setLoadingRequests(false);
      }
    }
  };

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
                  <span>Buzón Médico / Recetas y Recomendaciones</span>
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

           {/* Admin Panel */}
           {isAdmin && (
             <div style={styles.section}>
               <h3 style={styles.sectionTitle}>Panel de Administrador</h3>
               <p style={styles.sectionDesc}>Funciones de administración global de la plataforma.</p>
               
               <div style={{ ...styles.menuItem, marginBottom: 16 }} onClick={() => setShowVerifModal(true)}>
                 <div style={styles.menuItemLeft}>
                   <div style={{...styles.iconWrapper, backgroundColor: "rgba(167, 139, 250, 0.1)", color: "#A78BFA"}}>
                     🩺
                   </div>
                   <span>Verificar Cédulas de Nutriólogos</span>
                 </div>
                 {pendingNutriologists.length > 0 && (
                   <span style={{
                     backgroundColor: "#EF4444",
                     color: "#FFF",
                     fontSize: 10,
                     fontWeight: 700,
                     borderRadius: "50%",
                     width: 20,
                     height: 20,
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     marginRight: 8
                   }}>{pendingNutriologists.length}</span>
                 )}
                 <IonIcon icon={chevronForwardOutline} style={styles.chevron} />
               </div>
             </div>
           )}

           {/* Verify Nutriologist Licenses Modal */}
           {showVerifModal && (
             <div style={styles.modalOverlay}>
               <div style={styles.modalCard}>
                 <div style={styles.modalHeader}>
                   <h3 style={styles.modalTitle}>Verificar Nutriólogos</h3>
                   <button style={styles.closeBtn} onClick={() => setShowVerifModal(false)}>✕</button>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                   {pendingNutriologists.length === 0 ? (
                     <p style={{ ...styles.sectionDesc, fontStyle: 'italic', textAlign: 'center', margin: '20px 0' }}>
                       No hay nutriólogos pendientes de verificación de cédula.
                     </p>
                   ) : (
                     <div style={styles.requestsContainer}>
                       {pendingNutriologists.map(nutri => (
                         <div key={nutri.id} style={styles.requestCard}>
                           <div style={{ textAlign: 'left' }}>
                             <strong style={styles.reqName}>{nutri.name}</strong>
                             <span style={styles.reqDetail}>Email: {nutri.email}</span>
                             <span style={styles.reqDetail}>Cédula Profesional: <strong style={{ color: '#F97316' }}>{nutri.professionalLicense}</strong></span>
                             <span style={styles.reqDetail}>Teléfono: {nutri.contactPhone || 'No registrado'}</span>
                           </div>
                           <button
                             type="button"
                             onClick={() => handleApproveNutriologist(nutri)}
                             disabled={loadingRequests}
                             style={styles.approveBtn}
                           >
                             {loadingRequests ? "Procesando..." : "Aprobar y Verificar Cédula 🩺"}
                           </button>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               </div>
             </div>
           )}

          {/* Bottom navigation padding */}
          <div style={{ height: "calc(100px + env(safe-area-inset-bottom))" }} />
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
    alignItems: "center"
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
  devAdminBtn: {
    fontSize: 9,
    fontWeight: 700,
    borderRadius: 6,
    padding: "3px 8px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    border: "1px dashed rgba(255,255,255,0.1)",
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
    textAlign: "left",
  },
  sectionDesc: {
    fontSize: 12,
    color: "#94A3B8",
    margin: "0 0 14px 0",
    textAlign: "left",
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
    textAlign: "left",
  },
  addrSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    display: "block",
    textAlign: "left",
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
  },

  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(8px)',
    padding: '20px'
  },
  modalCard: {
    backgroundColor: '#131316',
    border: '1px solid #222227',
    width: '100%',
    maxWidth: '440px',
    maxHeight: '90vh',
    borderRadius: '24px',
    padding: '24px',
    overflowY: 'auto',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #222227',
    paddingBottom: '12px'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#FFF',
    margin: 0
  },
  closeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6B6B6B',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'color 0.2s',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    textAlign: 'left',
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#94A3B8'
  },
  formInput: {
    backgroundColor: '#0B0B0C',
    border: '1px solid #222227',
    borderRadius: '10px',
    padding: '12px 14px',
    color: '#FFF',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  row: {
    display: 'flex',
    gap: '12px'
  },
  modalSubmitBtn: {
    backgroundColor: '#F97316',
    color: '#000',
    border: 'none',
    borderRadius: '12px',
    padding: '14px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '10px',
  },
  uploadBtn: {
    backgroundColor: "#222227",
    color: "#fff",
    border: "1px solid #333336",
    padding: "12px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: "12px",
    overflow: "hidden",
    marginTop: "8px",
    border: "1px solid #222227",
  },
  imagePreview: {
    width: "100%",
    height: "120px",
    objectFit: "cover",
    display: "block",
  },
  clearImageBtn: {
    position: "absolute",
    top: "8px",
    right: "8px",
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    border: "none",
    borderRadius: "6px",
    color: "#FFF",
    padding: "4px 8px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },
  requestsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "10px",
  },
  requestCard: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  reqName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#F8FAFC",
    display: "block",
  },
  reqDetail: {
    fontSize: "12px",
    color: "#94A3B8",
    display: "block",
    marginTop: "2px",
  },
  approveBtn: {
    backgroundColor: "#34D399",
    color: "#000000",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    alignSelf: "flex-end",
    transition: "opacity 0.2s",
  }
};

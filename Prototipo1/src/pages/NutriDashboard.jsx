// src/pages/NutriDashboard.jsx

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { 
  addOutline, 
  peopleOutline, 
  documentTextOutline, 
  shieldCheckmarkOutline, 
  mailOutline, 
  phonePortraitOutline,
  personOutline,
  closeOutline
} from "ionicons/icons";

export default function NutriDashboard() {
  const { 
    userProfile, 
    patients, 
    prescriptions, 
    addPatient, 
    setPatientSelector, 
    verifyLicenseDemo 
  } = useApp();
  const history = useHistory();

  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form states
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const activePatients = patients.length;
  const sentRecipesCount = prescriptions.length;

  const handleAddPatientSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!patientName || !patientEmail || !patientPhone) {
      setErrorMsg("Completa todos los campos obligatorios.");
      return;
    }

    const res = await addPatient(patientName, patientEmail, patientPhone);
    if (res.success) {
      setPatientName("");
      setPatientEmail("");
      setPatientPhone("");
      setShowAddModal(false);
    } else {
      setErrorMsg("Error al registrar el paciente.");
    }
  };

  const handlePrescribeToPatient = (patient) => {
    setPatientSelector(patient);
    history.push("/home"); // Redirect to menu to select a base recipe!
  };

  const isPending = userProfile?.status === "pending";

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <div style={styles.screen}>
          
          {/* Header */}
          <div style={styles.header}>
            <div>
              <span style={styles.eyebrow}>Plataforma Clínica</span>
              <h1 style={styles.title}>Nomi Pro</h1>
            </div>
            
            <div style={{
              ...styles.statusBadge,
              backgroundColor: isPending ? "rgba(251, 191, 36, 0.15)" : "rgba(52, 211, 153, 0.15)",
              color: isPending ? "#FBBF24" : "#34D399",
              border: isPending ? "1px solid rgba(251,191,36,0.3)" : "1px solid rgba(52,211,153,0.3)"
            }}>
              <span>{isPending ? "Pendiente" : "Verificado"}</span>
            </div>
          </div>

          {/* Pending Verification Notice */}
          {isPending && (
            <div style={styles.pendingCard}>
              <h3 style={styles.pendingTitle}>Verificación de Cédula en curso</h3>
              <p style={styles.pendingText}>
                Tu cédula profesional ({userProfile?.professionalLicense}) está siendo validada por nuestro equipo médico.
              </p>
              <div style={styles.pendingFooter}>
                <span style={styles.pendingCaption}>Bypass de verificación para pruebas:</span>
                <button style={styles.verifyBypassBtn} onClick={verifyLicenseDemo}>
                  Auto-Verificar Cédula
                </button>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <IonIcon icon={peopleOutline} style={styles.statIcon} />
              <span style={styles.statNumber}>{activePatients}</span>
              <span style={styles.statLabel}>Pacientes</span>
            </div>
            <div style={styles.statCard}>
              <IonIcon icon={documentTextOutline} style={styles.statIcon} />
              <span style={styles.statNumber}>{sentRecipesCount}</span>
              <span style={styles.statLabel}>Recetas Enviadas</span>
            </div>
          </div>

          {/* Patient list section */}
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Mis Pacientes</h2>
            <button 
              style={styles.addPatientBtn}
              onClick={() => setShowAddModal(true)}
            >
              <IonIcon icon={addOutline} style={{ marginRight: 4 }} />
              Nuevo
            </button>
          </div>

          {patients.length === 0 ? (
            <div style={styles.emptyPatientsCard}>
              <p style={styles.emptyText}>No tienes pacientes registrados todavía.</p>
              <button 
                style={styles.emptyActionBtn}
                onClick={() => setShowAddModal(true)}
              >
                Agregar mi primer paciente
              </button>
            </div>
          ) : (
            <div style={styles.patientsList}>
              {patients.map((pat) => (
                <div key={pat.id} style={styles.patientCard}>
                  <div style={styles.patientInfo}>
                    <div style={styles.avatarPill}>
                      <IonIcon icon={personOutline} />
                    </div>
                    <div>
                      <h3 style={styles.patName}>{pat.patientName}</h3>
                      <div style={styles.contactDetails}>
                        <div style={styles.contactItem}>
                          <IonIcon icon={mailOutline} style={styles.contactIcon} />
                          <span>{pat.patientEmail}</span>
                        </div>
                        <div style={styles.contactItem}>
                          <IonIcon icon={phonePortraitOutline} style={styles.contactIcon} />
                          <span>{pat.patientPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    style={styles.prescribeBtn}
                    onClick={() => handlePrescribeToPatient(pat)}
                    disabled={isPending}
                    title={isPending ? "Debes estar verificado para recetar" : "Recetar comida"}
                  >
                    Recetar Comida
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Prescriptions Log */}
          <div style={{ ...styles.sectionHeader, marginTop: 32 }}>
            <h2 style={styles.sectionTitle}>Historial de Recetas</h2>
          </div>

          {prescriptions.length === 0 ? (
            <div style={styles.emptyHistoryCard}>
              <p style={styles.emptyHistoryText}>No has enviado recetas aún.</p>
            </div>
          ) : (
            <div style={styles.historyList}>
              {prescriptions.map((pres) => (
                <div key={pres.id} style={styles.historyCard}>
                  <div style={styles.historyHeader}>
                    <div>
                      <h4 style={styles.historyRecipeName}>{pres.recipeName}</h4>
                      <span style={styles.historyPatientEmail}>Paciente: {pres.patientEmail}</span>
                    </div>
                    <span style={{
                      ...styles.historyStatus,
                      color: pres.status === "ordered" ? "#34D399" : "#FBBF24",
                      backgroundColor: pres.status === "ordered" ? "rgba(52,211,153,0.08)" : "rgba(251,191,36,0.08)"
                    }}>
                      {pres.status === "ordered" ? "Comprado" : "Pendiente"}
                    </span>
                  </div>
                  <div style={styles.historyMacros}>
                    <span>🔥 {pres.macros.kcal} kcal</span>
                    <span>🥩 {pres.macros.protein}g P</span>
                    <span>🌾 {pres.macros.carbs}g C</span>
                    <span>🫒 {pres.macros.fats}g G</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Patient Modal / Bottom Sheet */}
          {showAddModal && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalCard}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Registrar Paciente</h3>
                  <button style={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                    <IonIcon icon={closeOutline} />
                  </button>
                </div>

                {errorMsg && <div style={styles.modalError}>{errorMsg}</div>}

                <form onSubmit={handleAddPatientSubmit} style={styles.modalForm}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Nombre del Paciente</label>
                    <input
                      type="text"
                      placeholder="Ej. Carlos Mendoza"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Correo de Paciente (Nomi app)</label>
                    <input
                      type="email"
                      placeholder="correo@paciente.com"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Teléfono Móvil</label>
                    <input
                      type="tel"
                      placeholder="10 dígitos"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <button type="submit" style={styles.modalSubmitBtn}>
                    Guardar y Registrar
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Bottom spacing */}
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
  eyebrow: {
    fontSize: 11,
    color: "#A78BFA",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontWeight: 700,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    margin: "4px 0 0 0",
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 8,
    padding: "4px 10px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  pendingCard: {
    backgroundColor: "rgba(251, 191, 36, 0.05)",
    border: "1px solid rgba(251, 191, 36, 0.2)",
    borderRadius: 16,
    padding: "16px",
    marginBottom: 24,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#FBBF24",
    margin: "0 0 6px 0",
  },
  pendingText: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 1.5,
    margin: "0 0 14px 0",
  },
  pendingFooter: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    borderTop: "1px solid rgba(251, 191, 36, 0.15)",
    paddingTop: 12,
  },
  pendingCaption: {
    fontSize: 10,
    color: "#64748B",
  },
  verifyBypassBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#FBBF24",
    color: "#000000",
    border: "none",
    borderRadius: 10,
    padding: "8px 16px",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  },
  statsGrid: {
    display: "flex",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 20,
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
  },
  statIcon: {
    fontSize: 20,
    color: "#A78BFA",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 800,
    color: "#F8FAFC",
  },
  statLabel: {
    fontSize: 10,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: 0,
  },
  addPatientBtn: {
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    border: "1px solid rgba(167, 139, 250, 0.25)",
    color: "#A78BFA",
    borderRadius: 10,
    padding: "8px 14px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  emptyPatientsCard: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 20,
    padding: "36px 20px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
    margin: 0,
  },
  emptyActionBtn: {
    backgroundColor: "#A78BFA",
    color: "#000000",
    border: "none",
    borderRadius: 12,
    padding: "10px 20px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  patientsList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  patientCard: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 20,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  patientInfo: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  avatarPill: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    backgroundColor: "rgba(167,139,250,0.1)",
    color: "#A78BFA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    border: "1px solid rgba(167,139,250,0.2)"
  },
  patName: {
    fontSize: 15,
    fontWeight: 700,
    margin: 0,
    color: "#F8FAFC",
  },
  contactDetails: {
    display: "flex",
    gap: 12,
    marginTop: 4,
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 10,
    color: "#64748B",
  },
  contactIcon: {
    fontSize: 12,
  },
  prescribeBtn: {
    backgroundColor: "#A78BFA",
    color: "#000000",
    border: "none",
    borderRadius: 12,
    padding: "10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "center",
    transition: "opacity 0.2s ease",
    ":disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    }
  },
  emptyHistoryCard: {
    backgroundColor: "#131316",
    border: "1px dashed #222227",
    borderRadius: 16,
    padding: "24px",
    textAlign: "center",
  },
  emptyHistoryText: {
    fontSize: 12,
    color: "#64748B",
    margin: 0,
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  historyCard: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 16,
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  historyRecipeName: {
    fontSize: 13,
    fontWeight: 700,
    margin: 0,
    color: "#F8FAFC",
  },
  historyPatientEmail: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
    display: "block",
  },
  historyStatus: {
    fontSize: 9,
    fontWeight: 700,
    borderRadius: 5,
    padding: "2px 6px",
    textTransform: "uppercase",
  },
  historyMacros: {
    display: "flex",
    gap: 10,
    fontSize: 10,
    color: "#94A3B8",
  },

  // Modal / Drawer Add Patient
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
    backdropFilter: "blur(4px)",
  },
  modalCard: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 24,
    padding: "24px",
    width: "100%",
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#F8FAFC",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#64748B",
    fontSize: 22,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  modalError: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: 10,
    padding: "10px",
    fontSize: 12,
    color: "#EF4444",
  },
  modalForm: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  formLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: 500,
    paddingLeft: 2,
  },
  formInput: {
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    color: "#F8FAFC",
    padding: "12px 14px",
    borderRadius: 10,
    fontSize: 13,
    outline: "none",
  },
  modalSubmitBtn: {
    backgroundColor: "#A78BFA",
    color: "#000000",
    border: "none",
    borderRadius: 12,
    padding: "14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 6,
  }
};

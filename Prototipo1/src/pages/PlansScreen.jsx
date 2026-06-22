// src/pages/PlansScreen.jsx

import React, { useState, useEffect } from "react";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { useApp } from "../context/AppContext";
import { db } from "../firebase/firebaseconfig";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  onSnapshot 
} from "firebase/firestore";
import { 
  calendarOutline, 
  timeOutline, 
  addOutline,
  personOutline,
  shieldCheckmarkOutline,
  chevronForwardOutline,
  statsChartOutline
} from "ionicons/icons";

export default function PlansScreen() {
  const { 
    currentUser,
    userProfile, 
    nutritionalPlan, 
    autoGeneratePlan 
  } = useApp();

  const [nutriologists, setNutriologists] = useState([]);
  const [selectedNutri, setSelectedNutri] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookingArea, setShowBookingArea] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  
  // Load list of Nutriologists
  useEffect(() => {
    async function fetchNutriologists() {
      try {
        const q = query(collection(db, "users"), where("role", "==", "nutriologist"));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        setNutriologists(list);
        if (list.length > 0) {
          setSelectedNutri(list[0].uid);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchNutriologists();
  }, []);

  // Listen to available slots for selected Nutriologist
  useEffect(() => {
    if (!selectedNutri) return;

    const q = query(
      collection(db, "appointment_slots"),
      where("nutriologistId", "==", selectedNutri),
      where("status", "==", "available")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a,b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
      setAvailableSlots(list);
    });

    return () => unsubscribe();
  }, [selectedNutri]);

  // Listen to my booked appointments
  useEffect(() => {
    if (!userProfile) return;

    const q = query(
      collection(db, "appointment_slots"),
      where("patientEmail", "==", userProfile.email.toLowerCase().trim()),
      where("status", "==", "booked")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a,b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
      setMyAppointments(list);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleAutoGenerate = async (goal) => {
    if (window.confirm("¿Deseas auto-generar un plan nutricional ahora? Esto reemplazará planes del sistema anteriores.")) {
      const res = await autoGeneratePlan(goal);
      if (res.success) {
        alert("¡Plan generado exitosamente!");
        setShowGoalModal(false);
      } else {
        alert("Error al generar plan.");
      }
    }
  };

  const handleBookAppointment = async (slot) => {
    if (!userProfile) return;
    if (window.confirm(`¿Confirmas que deseas agendar la cita con tu nutriólogo el ${slot.date} a las ${slot.time}?`)) {
      setBookingLoading(true);
      try {
        const slotRef = doc(db, "appointment_slots", slot.id);
        await updateDoc(slotRef, {
          status: "booked",
          patientEmail: userProfile.email.toLowerCase().trim(),
          patientName: userProfile.name || "Paciente",
          bookedAt: new Date().toISOString()
        });
        alert("¡Cita reservada y programada con éxito! Tu nutriólogo ha sido notificado.");
        setShowBookingArea(false);
      } catch (err) {
        console.error(err);
        alert("Ocurrió un error al reservar la cita.");
      } finally {
        setBookingLoading(false);
      }
    }
  };

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <div style={styles.screen}>
          
          <h1 style={styles.title}>Mis Planes y Citas</h1>
          <p style={styles.subtitle}>Supervisa tu plan nutricional y agenda citas con expertos.</p>

          {/* 1. Nutritional Plan Card */}
          {nutritionalPlan ? (
            <div style={styles.planCard}>
              <div style={styles.planCardHeader}>
                <div>
                  <h2 style={styles.planTitle}>Plan Nutricional Activo</h2>
                  <span style={styles.planMeta}>
                    📅 {nutritionalPlan.startDate} al {nutritionalPlan.endDate}
                  </span>
                </div>
                <span style={{
                  ...styles.creatorBadge,
                  backgroundColor: nutritionalPlan.createdBy === "nutriologist" ? "rgba(167, 139, 250, 0.15)" : "rgba(52, 211, 153, 0.15)",
                  color: nutritionalPlan.createdBy === "nutriologist" ? "#A78BFA" : "#34D399"
                }}>
                  {nutritionalPlan.createdBy === "nutriologist" ? "Nutriólogo" : "Sistema"}
                </span>
              </div>

              {/* Progress Macros display */}
              <div style={styles.macrosGrid}>
                <div style={styles.macroCol}>
                  <strong style={{ color: "#34D399" }}>{nutritionalPlan.kcalLimit}</strong>
                  <span>Kcal</span>
                </div>
                <div style={styles.macroCol}>
                  <strong style={{ color: "#F97316" }}>{nutritionalPlan.proteinLimit}g</strong>
                  <span>Proteína</span>
                </div>
                <div style={styles.macroCol}>
                  <strong style={{ color: "#FACC15" }}>{nutritionalPlan.carbLimit}g</strong>
                  <span>Carbos</span>
                </div>
                <div style={styles.macroCol}>
                  <strong style={{ color: "#A78BFA" }}>{nutritionalPlan.fatLimit}g</strong>
                  <span>Grasas</span>
                </div>
              </div>

              <p style={styles.planFootnote}>
                * Las recetas que personalices adaptarán sus gramos automáticamente para cumplir este plan.
              </p>
            </div>
          ) : (
            <div style={styles.emptyCard}>
              <IonIcon icon={calendarOutline} style={styles.emptyIcon} />
              <p style={{ fontWeight: 700, margin: 0 }}>Aún no tienes un plan nutricional activo</p>
              <span style={styles.emptySub}>Puedes esperar a que tu nutriólogo te asigne uno, o autogenerar uno ahora.</span>
              
              <button style={styles.createBtn} onClick={() => setShowGoalModal(true)}>
                <IonIcon icon={addOutline} style={{ marginRight: 4 }} />
                Auto-generar Plan Nutricional
              </button>
            </div>
          )}

          {/* 2. Appointments / Booking slots section */}
          <div style={styles.appointmentsSection}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Agenda Clínico-Nutricional</h2>
              <button 
                style={styles.bookToggleBtn}
                onClick={() => setShowBookingArea(!showBookingArea)}
              >
                {showBookingArea ? "Ver mis Citas" : "Agendar Cita"}
              </button>
            </div>

            {showBookingArea ? (
              <div style={styles.bookingArea}>
                <h3 style={styles.areaSubTitle}>Seleccionar Nutriólogo</h3>
                <div style={{ marginBottom: 16 }}>
                  <select 
                    value={selectedNutri}
                    onChange={(e) => setSelectedNutri(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">Selecciona un especialista...</option>
                    {nutriologists.map(nutri => (
                      <option key={nutri.uid} value={nutri.uid}>{nutri.name} (Cédula: {nutri.professionalLicense})</option>
                    ))}
                  </select>
                </div>

                <h3 style={styles.areaSubTitle}>Horarios Disponibles</h3>
                {availableSlots.length === 0 ? (
                  <p style={styles.emptySlotsText}>Este especialista no tiene horarios disponibles publicados esta semana.</p>
                ) : (
                  <div style={styles.slotsGrid}>
                    {availableSlots.map(slot => (
                      <div 
                        key={slot.id} 
                        style={styles.slotCard}
                        onClick={() => !bookingLoading && handleBookAppointment(slot)}
                      >
                        <span>📅 {slot.date}</span>
                        <strong>⏱️ {slot.time}</strong>
                        <span style={styles.bookLabel}>Reservar</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.appointmentsListArea}>
                <h3 style={styles.areaSubTitle}>Mis Citas Programadas</h3>
                {myAppointments.length === 0 ? (
                  <p style={styles.emptySlotsText}>No tienes ninguna cita agendada en este momento.</p>
                ) : (
                  <div style={styles.myAppointmentsList}>
                    {myAppointments.map(appointment => (
                      <div key={appointment.id} style={styles.myApptCard}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={styles.apptIconBox}>🩺</div>
                          <div style={{ textAlign: 'left' }}>
                            <strong style={{ display: 'block', color: '#F8FAFC' }}>Cita con Nutriólogo</strong>
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>Especialista: {appointment.nutriologistName}</span>
                            <span style={{ fontSize: 11, color: '#F97316', display: 'block', marginTop: 2 }}>📅 {appointment.date} a las {appointment.time}</span>
                          </div>
                        </div>
                        <span style={styles.apptStatusBadge}>Confirmada</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Goal Modal */}
          {showGoalModal && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalCard}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Auto-generar Plan</h3>
                  <button style={styles.closeBtn} onClick={() => setShowGoalModal(false)}>✕</button>
                </div>
                <p style={styles.modalSubtitle}>Selecciona tu objetivo y el sistema calculará tus macros óptimos por 30 días.</p>

                <div style={styles.goalOptions}>
                  <button style={styles.goalBtn} onClick={() => handleAutoGenerate("weight_loss")}>
                    <span>📉 Perder Grasa / Definición</span>
                    <strong style={{ fontSize: 11, color: '#F97316' }}>~1600 Kcal diarios</strong>
                  </button>
                  <button style={styles.goalBtn} onClick={() => handleAutoGenerate("maintenance")}>
                    <span>⚖️ Mantener Peso / Estilo de Vida</span>
                    <strong style={{ fontSize: 11, color: '#34D399' }}>~2000 Kcal diarios</strong>
                  </button>
                  <button style={styles.goalBtn} onClick={() => handleAutoGenerate("gain_muscle")}>
                    <span>📈 Ganar Masa Muscular / Volumen</span>
                    <strong style={{ fontSize: 11, color: '#A78BFA' }}>~2600 Kcal diarios</strong>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Promo Card */}
          <div style={styles.promoCard}>
            <h3 style={styles.promoTitle}>🥗 Ventajas de un Plan Nomi</h3>
            <ul style={styles.promoList}>
              <li>Cumple tus macros diarios de manera exacta.</li>
              <li>Alineación automática con las metas de tu nutriólogo.</li>
              <li>Platos equilibrados que respetan tus porciones.</li>
            </ul>
          </div>
          
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
  title: {
    fontSize: 28,
    fontWeight: 800,
    margin: "0 0 8px 0",
    textAlign: "left",
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    margin: "0 0 24px 0",
    lineHeight: 1.4,
    textAlign: "left",
  },
  planCard: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 24,
    padding: "20px",
    marginBottom: 24,
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
  },
  planCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1px solid #222227",
    paddingBottom: 14,
    marginBottom: 16,
    textAlign: "left",
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#F8FAFC",
    margin: 0,
  },
  planMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    display: "block",
  },
  creatorBadge: {
    fontSize: 9,
    fontWeight: 700,
    borderRadius: 6,
    padding: "4px 8px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  macrosGrid: {
    display: "flex",
    justifyContent: "space-around",
    backgroundColor: "#0B0B0C",
    borderRadius: 16,
    padding: "16px 8px",
    border: "1px solid #1A1A1F",
  },
  macroCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  planFootnote: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 14,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    textAlign: "left",
    lineHeight: 1.4,
  },
  emptyCard: {
    backgroundColor: "#131316",
    border: "1px dashed #222227",
    borderRadius: 24,
    padding: "32px 20px",
    textAlign: "center",
    color: "#64748B",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 36,
    color: "#333336",
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 1.5,
    padding: "0 10px",
  },
  createBtn: {
    backgroundColor: "#F97316",
    color: "#000",
    border: "none",
    borderRadius: 14,
    padding: "14px",
    width: "100%",
    fontSize: 14,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 10,
    cursor: "pointer",
  },
  appointmentsSection: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 24,
    padding: "20px",
    marginBottom: 24,
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
  bookToggleBtn: {
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    border: "1px solid rgba(249, 115, 22, 0.25)",
    color: "#F97316",
    borderRadius: 10,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  bookingArea: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    textAlign: "left",
  },
  areaSubTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#94A3B8",
    margin: "0 0 6px 0",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    textAlign: "left",
  },
  select: {
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    borderRadius: 12,
    color: "#F8FAFC",
    padding: "14px",
    fontSize: 13,
    outline: "none",
    width: "100%",
    cursor: "pointer",
  },
  emptySlotsText: {
    fontSize: 12,
    color: "#64748B",
    margin: "4px 0",
    lineHeight: 1.5,
    textAlign: "left",
  },
  slotsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
    gap: 10,
    marginTop: 6,
  },
  slotCard: {
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    borderRadius: 14,
    padding: "12px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    fontSize: 10,
    color: "#94A3B8",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  bookLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#F97316",
    marginTop: 4,
    textTransform: "uppercase",
  },
  appointmentsListArea: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    textAlign: "left",
  },
  myAppointmentsList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  myApptCard: {
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    borderRadius: 16,
    padding: "12px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  apptIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(167, 139, 250, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },
  apptStatusBadge: {
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    color: "#34D399",
    border: "1px solid rgba(52, 211, 153, 0.3)",
    borderRadius: 8,
    padding: "4px 8px",
    fontSize: 10,
    fontWeight: 700,
  },
  promoCard: {
    backgroundColor: "rgba(249, 115, 22, 0.05)",
    border: "1px solid rgba(249, 115, 22, 0.2)",
    borderRadius: 24,
    padding: "20px",
    textAlign: "left",
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#F97316",
    margin: "0 0 8px 0",
  },
  promoList: {
    margin: 0,
    paddingLeft: 20,
    fontSize: 13,
    lineHeight: 1.8,
    color: "#CBD5E1",
  },

  // Modal styles
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
  modalSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    margin: 0,
    lineHeight: 1.5,
    textAlign: "left",
  },
  goalOptions: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  goalBtn: {
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    borderRadius: 14,
    padding: "16px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
    color: "#F8FAFC",
    textAlign: "left",
    transition: "background-color 0.2s ease",
  }
};

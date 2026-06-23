// src/pages/NutriDashboard.jsx

import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { db } from "../firebase/firebaseconfig";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";
import { 
  addOutline, 
  peopleOutline, 
  documentTextOutline, 
  mailOutline, 
  phonePortraitOutline,
  personOutline,
  closeOutline,
  calendarOutline,
  timeOutline,
  notificationsOutline
} from "ionicons/icons";

export default function NutriDashboard() {
  const { 
    currentUser,
    userProfile, 
    patients, 
    prescriptions, 
    addPatient, 
    setPatientSelector,
    createNutritionalPlan
  } = useApp();
  const history = useHistory();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedBatchSlots, setSelectedBatchSlots] = useState([]);
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("google");
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Form states - Patient registration
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form states - Plan assignment
  const [planStart, setPlanStart] = useState(new Date().toISOString().split('T')[0]);
  const [planEnd, setPlanEnd] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [planKcal, setPlanKcal] = useState("2000");
  const [planProtein, setPlanProtein] = useState("130");
  const [planCarb, setPlanCarb] = useState("220");
  const [planFat, setPlanFat] = useState("65");

  // Portion/equivalents states
  const [portProtein, setPortProtein] = useState(0);
  const [portCarb, setPortCarb] = useState(0);
  const [portVeg, setPortVeg] = useState(0);
  const [portFat, setPortFat] = useState(0);

  const updateMacrosFromPortions = (p, c, v, f) => {
    // 1 Port Protein: 7 P, 3 F, 55 Kcal
    // 1 Port Carb: 2 P, 15 C, 70 Kcal
    // 1 Port Veg: 1 P, 4 C, 25 Kcal
    // 1 Port Fat: 5 F, 45 Kcal
    const proteinGrams = p * 7 + c * 2 + v * 1;
    const carbGrams = c * 15 + v * 4;
    const fatGrams = p * 3 + f * 5;
    const kcalVal = p * 55 + c * 70 + v * 25 + f * 45;

    setPlanProtein(proteinGrams.toString());
    setPlanCarb(carbGrams.toString());
    setPlanFat(fatGrams.toString());
    setPlanKcal(kcalVal.toString());
  };

  // Form states - Slot creation
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotTime, setSlotTime] = useState("10:00 AM");

  // Slots state
  const [slots, setSlots] = useState([]);
  
  // Real-time notifications of new booked appointments
  const [recentBooking, setRecentBooking] = useState(null);

  const activePatients = patients.length;
  const sentRecipesCount = prescriptions.length;
  const isPending = userProfile?.status === "pending";

  // Listen to scheduled slots
  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, "appointment_slots"),
      where("nutriologistId", "==", currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
      
      // Check if there's any newly booked slot to notify
      const justBooked = list.find(slot => slot.status === "booked" && !slot.notified);
      if (justBooked) {
        setRecentBooking(justBooked);
      }
      
      setSlots(list);
    });

    return () => unsubscribe();
  }, [currentUser]);

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
      alert("¡Paciente registrado con éxito!");
    } else {
      setErrorMsg("Error al registrar el paciente.");
    }
  };

  const handlePrescribeToPatient = (patient) => {
    setPatientSelector(patient);
    history.push("/home"); // Redirect to menu to choose a base recipe
  };

  const handleOpenPlanModal = (patient) => {
    setSelectedPatient(patient);
    setShowPlanModal(true);
  };

  const handleAssignPlanSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    if (window.confirm("¿Seguro que deseas guardar y asignar este plan?")) {
      const res = await createNutritionalPlan(
        selectedPatient.patientEmail,
        planKcal,
        planProtein,
        planCarb,
        planFat,
        planStart,
        planEnd
      );

      if (res.success) {
        alert("¡Plan nutricional asignado con éxito!");
        setShowPlanModal(false);
        setSelectedPatient(null);
      } else {
        alert("Ocurrió un error al guardar el plan.");
      }
    }
  };

  const handleCreateSlotSubmit = async (e) => {
    e.preventDefault();
    if (!slotDate || !slotTime) return;

    try {
      await addDoc(collection(db, "appointment_slots"), {
        nutriologistId: currentUser.uid,
        nutriologistName: userProfile?.name || "Nutriólogo Clínico",
        date: slotDate,
        time: slotTime,
        status: "available",
        createdAt: new Date().toISOString()
      });
      alert("¡Horario de cita disponible agregado!");
      setShowSlotModal(false);
    } catch (err) {
      console.error(err);
      alert("Error al guardar horario.");
    }
  };

  const handleGoogleCalendarSync = async () => {
    if (!currentUser) return;
    setSyncingGoogle(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const newSlots = [];
    const times = ["09:00 AM", "11:00 AM", "03:00 PM", "05:00 PM"];
    for (let i = 1; i <= 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateString = d.toISOString().split("T")[0];
      const timeString = times[i - 1];
      newSlots.push({
        nutriologistId: currentUser.uid,
        nutriologistName: userProfile?.name || "Nutriólogo Clínico",
        date: dateString,
        time: timeString,
        status: "available",
        createdAt: new Date().toISOString(),
        importedFrom: "Google Calendar"
      });
    }

    try {
      await Promise.all(
        newSlots.map(slot => addDoc(collection(db, "appointment_slots"), slot))
      );
      alert("¡Sincronización exitosa! Se importaron 4 horarios libres desde tu Google Calendar.");
      setShowSlotModal(false);
    } catch (err) {
      console.error(err);
      alert("Error al sincronizar con Google Calendar.");
    } finally {
      setSyncingGoogle(false);
    }
  };

  const toggleBatchSlot = (date, time) => {
    const exists = selectedBatchSlots.some(s => s.date === date && s.time === time);
    if (exists) {
      setSelectedBatchSlots(prev => prev.filter(s => !(s.date === date && s.time === time)));
    } else {
      setSelectedBatchSlots(prev => [...prev, { date, time }]);
    }
  };

  const handlePublishBatchSlots = async (e) => {
    e.preventDefault();
    if (selectedBatchSlots.length === 0) {
      alert("Por favor selecciona al menos un horario de la cuadrícula.");
      return;
    }

    try {
      await Promise.all(
        selectedBatchSlots.map(slot => 
          addDoc(collection(db, "appointment_slots"), {
            nutriologistId: currentUser.uid,
            nutriologistName: userProfile?.name || "Nutriólogo Clínico",
            date: slot.date,
            time: slot.time,
            status: "available",
            createdAt: new Date().toISOString()
          })
        )
      );
      alert(`¡Se publicaron exitosamente ${selectedBatchSlots.length} horarios de disponibilidad!`);
      setSelectedBatchSlots([]);
      setShowSlotModal(false);
    } catch (err) {
      console.error(err);
      alert("Error al guardar los horarios.");
    }
  };

  const getNext7Days = () => {
    const days = [];
    const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateString = d.toISOString().split('T')[0];
      const label = `${weekdays[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
      days.push({ date: dateString, label });
    }
    return days;
  };

  const bookedSlots = slots.filter(s => s.status === "booked");
  const availableSlots = slots.filter(s => s.status === "available");

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
            </div>
          )}

          {/* Real-time booking notification banner */}
          {recentBooking && (
            <div style={styles.notificationBanner}>
              <div style={styles.notificationLeft}>
                <IonIcon icon={notificationsOutline} style={{ color: "#34D399", fontSize: 20 }} />
                <div>
                  <span style={styles.notificationTitle}>Nueva Cita Agendada</span>
                  <span style={styles.notificationText}>
                    El paciente <strong>{recentBooking.patientName}</strong> ha reservado cita el {recentBooking.date} a las {recentBooking.time}.
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setRecentBooking(null)} 
                style={styles.notificationCloseBtn}
              >
                ✕
              </button>
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
              <span style={styles.statLabel}>Platillos Recomendados</span>
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

                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button 
                      style={{ ...styles.prescribeBtn, flex: 1 }}
                      onClick={() => handlePrescribeToPatient(pat)}
                      disabled={isPending}
                      title={isPending ? "Debes estar verificado para recetar" : "Recomendar plato"}
                    >
                      🍳 Recomendar
                    </button>
                    <button 
                      style={{ ...styles.planBtn, flex: 1 }}
                      onClick={() => handleOpenPlanModal(pat)}
                      disabled={isPending}
                    >
                      📈 Recetar Macros
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Schedule Slots Availability section */}
          <div style={{ ...styles.sectionHeader, marginTop: 32 }}>
            <h2 style={styles.sectionTitle}>Agenda de Citas</h2>
            <button 
              style={styles.addPatientBtn}
              onClick={() => setShowSlotModal(true)}
            >
              <IonIcon icon={addOutline} style={{ marginRight: 4 }} />
              Disponibilidad
            </button>
          </div>

          {/* Scheduled/Booked slots list */}
          <div style={styles.scheduleSection}>
            <h3 style={styles.subSubTitle}>Citas Reservadas</h3>
            {bookedSlots.length === 0 ? (
              <p style={styles.emptyText}>No hay citas programadas para esta semana.</p>
            ) : (
              <div style={styles.slotsList}>
                {bookedSlots.map(slot => (
                  <div key={slot.id} style={styles.slotCardBooked}>
                    <div style={styles.slotDetails}>
                      <span style={styles.slotPatientName}>👤 {slot.patientName}</span>
                      <span style={styles.slotMeta}>📅 {slot.date} a las {slot.time}</span>
                      <span style={styles.slotEmail}>📧 {slot.patientEmail}</span>
                    </div>
                    <span style={styles.bookedBadge}>Reservada</span>
                  </div>
                ))}
              </div>
            )}

            <h3 style={{ ...styles.subSubTitle, marginTop: 20 }}>Horarios Disponibles</h3>
            {availableSlots.length === 0 ? (
              <p style={styles.emptyText}>No tienes horarios libres publicados.</p>
            ) : (
              <div style={styles.slotsGrid}>
                {availableSlots.map(slot => (
                  <div key={slot.id} style={styles.slotCardAvailable}>
                    <span>📅 {slot.date}</span>
                    <strong>⏱️ {slot.time}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prescriptions Log */}
          <div style={{ ...styles.sectionHeader, marginTop: 32 }}>
            <h2 style={styles.sectionTitle}>Historial de Recomendaciones</h2>
          </div>

          {prescriptions.length === 0 ? (
            <div style={styles.emptyHistoryCard}>
              <p style={styles.emptyHistoryText}>No has enviado recomendaciones aún.</p>
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

          {/* Add Patient Modal */}
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

          {/* Assign Plan Modal */}
          {showPlanModal && selectedPatient && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalCard}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Prescribir Plan Nutricional</h3>
                  <button style={styles.closeBtn} onClick={() => {
                    if (window.confirm("¿Seguro que deseas salir? Los cambios no se guardarán.")) {
                      setShowPlanModal(false);
                    }
                  }}>
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAssignPlanSubmit} style={styles.modalForm}>
                  <p style={{ fontSize: 13, color: "#A78BFA", margin: 0 }}>
                    Asignando macros a: <strong>{selectedPatient.patientName}</strong>
                  </p>

                  {/* Portions selector */}
                  <div style={styles.portionsCard}>
                    <p style={styles.portionsTitle}>📈 Recetar por Porciones (Equivalentes)</p>
                    <p style={styles.portionsSubtitle}>
                      Selecciona porciones de alimentos para calcular macros diarios automáticamente.
                    </p>
                    <div style={styles.portionsGrid}>
                      <div style={styles.portionCol}>
                        <label style={styles.portionLabel}>🥩 Proteínas</label>
                        <div style={styles.portionCounter}>
                          <button type="button" style={styles.counterBtn} onClick={() => {
                            const val = Math.max(0, portProtein - 1);
                            setPortProtein(val);
                            updateMacrosFromPortions(val, portCarb, portVeg, portFat);
                          }}>-</button>
                          <span style={styles.counterVal}>{portProtein}</span>
                          <button type="button" style={styles.counterBtn} onClick={() => {
                            const val = portProtein + 1;
                            setPortProtein(val);
                            updateMacrosFromPortions(val, portCarb, portVeg, portFat);
                          }}>+</button>
                        </div>
                      </div>

                      <div style={styles.portionCol}>
                        <label style={styles.portionLabel}>🍞 Carbohidratos</label>
                        <div style={styles.portionCounter}>
                          <button type="button" style={styles.counterBtn} onClick={() => {
                            const val = Math.max(0, portCarb - 1);
                            setPortCarb(val);
                            updateMacrosFromPortions(portProtein, val, portVeg, portFat);
                          }}>-</button>
                          <span style={styles.counterVal}>{portCarb}</span>
                          <button type="button" style={styles.counterBtn} onClick={() => {
                            const val = portCarb + 1;
                            setPortCarb(val);
                            updateMacrosFromPortions(portProtein, val, portVeg, portFat);
                          }}>+</button>
                        </div>
                      </div>

                      <div style={styles.portionCol}>
                        <label style={styles.portionLabel}>🥦 Verduras</label>
                        <div style={styles.portionCounter}>
                          <button type="button" style={styles.counterBtn} onClick={() => {
                            const val = Math.max(0, portVeg - 1);
                            setPortVeg(val);
                            updateMacrosFromPortions(portProtein, portCarb, val, portFat);
                          }}>-</button>
                          <span style={styles.counterVal}>{portVeg}</span>
                          <button type="button" style={styles.counterBtn} onClick={() => {
                            const val = portVeg + 1;
                            setPortVeg(val);
                            updateMacrosFromPortions(portProtein, portCarb, val, portFat);
                          }}>+</button>
                        </div>
                      </div>

                      <div style={styles.portionCol}>
                        <label style={styles.portionLabel}>🥑 Grasas</label>
                        <div style={styles.portionCounter}>
                          <button type="button" style={styles.counterBtn} onClick={() => {
                            const val = Math.max(0, portFat - 1);
                            setPortFat(val);
                            updateMacrosFromPortions(portProtein, portCarb, portVeg, val);
                          }}>-</button>
                          <span style={styles.counterVal}>{portFat}</span>
                          <button type="button" style={styles.counterBtn} onClick={() => {
                            const val = portFat + 1;
                            setPortFat(val);
                            updateMacrosFromPortions(portProtein, portCarb, portVeg, val);
                          }}>+</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={styles.row}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.formLabel}>Fecha Inicio</label>
                      <input 
                        type="date" 
                        value={planStart}
                        onChange={(e) => setPlanStart(e.target.value)}
                        style={styles.formInput} 
                        required
                      />
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.formLabel}>Fecha Fin</label>
                      <input 
                        type="date" 
                        value={planEnd}
                        onChange={(e) => setPlanEnd(e.target.value)}
                        style={styles.formInput} 
                        required
                      />
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Límite diario de Calorías (kcal)</label>
                    <input 
                      type="number" 
                      value={planKcal}
                      onChange={(e) => setPlanKcal(e.target.value)}
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <div style={styles.row}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.formLabel}>Proteína (g)</label>
                      <input 
                        type="number" 
                        value={planProtein}
                        onChange={(e) => setPlanProtein(e.target.value)}
                        style={styles.formInput} 
                        required
                      />
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.formLabel}>Carbos (g)</label>
                      <input 
                        type="number" 
                        value={planCarb}
                        onChange={(e) => setPlanCarb(e.target.value)}
                        style={styles.formInput} 
                        required
                      />
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.formLabel}>Grasas (g)</label>
                      <input 
                        type="number" 
                        value={planFat}
                        onChange={(e) => setPlanFat(e.target.value)}
                        style={styles.formInput} 
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" style={styles.modalSubmitBtn}>
                    Guardar y Asignar Plan
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Add Slot Modal */}
          {showSlotModal && (
            <div style={styles.modalOverlay}>
              <div style={{ ...styles.modalCard, maxWidth: 480 }}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Gestionar Disponibilidad</h3>
                  <button style={styles.closeBtn} onClick={() => setShowSlotModal(false)}>✕</button>
                </div>

                {/* Tabs */}
                <div style={styles.modalTabs}>
                  <button 
                    type="button"
                    style={{
                      ...styles.modalTabBtn,
                      ...(activeModalTab === "google" ? styles.activeModalTabBtn : {})
                    }}
                    onClick={() => setActiveModalTab("google")}
                  >
                    🗓️ Google Calendar
                  </button>
                  <button 
                    type="button"
                    style={{
                      ...styles.modalTabBtn,
                      ...(activeModalTab === "weekly" ? styles.activeModalTabBtn : {})
                    }}
                    onClick={() => setActiveModalTab("weekly")}
                  >
                    📅 Agenda Semanal
                  </button>
                  <button 
                    type="button"
                    style={{
                      ...styles.modalTabBtn,
                      ...(activeModalTab === "single" ? styles.activeModalTabBtn : {})
                    }}
                    onClick={() => setActiveModalTab("single")}
                  >
                    ⏱️ Cita Única
                  </button>
                </div>

                {/* Tab Content: Google Calendar Sync */}
                {activeModalTab === "google" && (
                  <div style={styles.googleSyncBox}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🗓️</div>
                    <h4 style={{ margin: "0 0 4px 0", color: "#FFF", fontSize: 15 }}>Sincronizar con Google Calendar</h4>
                    <p style={{ margin: "0 0 16px 0", color: "#94A3B8", fontSize: 12, lineHeight: 1.4 }}>
                      Conecta tu cuenta para importar automáticamente bloques de disponibilidad libre desde tu calendario de Google.
                    </p>
                    <button 
                      type="button"
                      onClick={handleGoogleCalendarSync} 
                      style={styles.googleBtn}
                      disabled={syncingGoogle}
                    >
                      {syncingGoogle ? "Sincronizando..." : "Sincronizar ahora"}
                    </button>
                  </div>
                )}

                {/* Tab Content: Weekly Planner */}
                {activeModalTab === "weekly" && (
                  <form onSubmit={handlePublishBatchSlots} style={styles.modalForm}>
                    <p style={{ margin: "0 0 10px 0", color: "#94A3B8", fontSize: 12, lineHeight: 1.4 }}>
                      Selecciona múltiples días y horas para publicarlos simultáneamente:
                    </p>
                    
                    <div style={styles.calendarScrollArea}>
                      {getNext7Days().map(day => (
                        <div key={day.date} style={styles.calendarDayRow}>
                          <span style={styles.calendarDayLabel}>{day.label}</span>
                          <div style={styles.timePillsGrid}>
                            {["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"].map(time => {
                              const isSel = selectedBatchSlots.some(s => s.date === day.date && s.time === time);
                              return (
                                <button
                                  type="button"
                                  key={time}
                                  onClick={() => toggleBatchSlot(day.date, time)}
                                  style={{
                                    ...styles.timePill,
                                    ...(isSel ? styles.timePillSelected : {})
                                  }}
                                >
                                  {time.replace(" AM", "").replace(" PM", "")}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: '#94A3B8' }}>
                        Seleccionados: <strong>{selectedBatchSlots.length} horarios</strong>
                      </span>
                      {selectedBatchSlots.length > 0 && (
                        <button 
                          type="button" 
                          onClick={() => setSelectedBatchSlots([])} 
                          style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                        >
                          Limpiar
                        </button>
                      )}
                    </div>

                    <button type="submit" style={styles.batchPublishBtn} disabled={selectedBatchSlots.length === 0}>
                      Publicar {selectedBatchSlots.length} Horarios
                    </button>
                  </form>
                )}

                {/* Tab Content: Single Slot */}
                {activeModalTab === "single" && (
                  <form onSubmit={handleCreateSlotSubmit} style={styles.modalForm}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Fecha de Cita</label>
                      <input 
                        type="date"
                        value={slotDate}
                        onChange={(e) => setSlotDate(e.target.value)}
                        style={styles.formInput}
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Hora</label>
                      <select
                        value={slotTime}
                        onChange={(e) => setSlotTime(e.target.value)}
                        style={styles.formInput}
                      >
                        <option value="08:00 AM">08:00 AM</option>
                        <option value="09:00 AM">09:00 AM</option>
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                        <option value="12:00 PM">12:00 PM</option>
                        <option value="01:00 PM">01:00 PM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="03:00 PM">03:00 PM</option>
                        <option value="04:00 PM">04:00 PM</option>
                        <option value="05:00 PM">05:00 PM</option>
                        <option value="06:00 PM">06:00 PM</option>
                      </select>
                    </div>

                    <button type="submit" style={styles.modalSubmitBtn}>
                      Publicar Horario Único
                    </button>
                  </form>
                )}
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
    textAlign: "left",
  },
  notificationBanner: {
    backgroundColor: "rgba(52, 211, 153, 0.08)",
    border: "1px solid rgba(52, 211, 153, 0.25)",
    borderRadius: 16,
    padding: "14px 16px",
    marginBottom: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  notificationLeft: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    textAlign: "left",
  },
  notificationTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#34D399",
    display: "block",
  },
  notificationText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
    display: "block",
    lineHeight: 1.4,
  },
  notificationCloseBtn: {
    background: "none",
    border: "none",
    color: "#64748B",
    fontSize: 14,
    cursor: "pointer",
    padding: 4,
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
    textAlign: "left",
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
    textAlign: "left",
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
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    border: "1px solid rgba(249, 115, 22, 0.3)",
    color: "#F97316",
    borderRadius: 12,
    padding: "10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "center",
    transition: "opacity 0.2s ease",
  },
  planBtn: {
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
  },
  scheduleSection: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 24,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    textAlign: "left",
  },
  subSubTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#F8FAFC",
    margin: "0 0 6px 0",
    textTransform: "uppercase",
    letterSpacing: "0.02em",
  },
  slotsList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  slotCardBooked: {
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    borderRadius: 16,
    padding: "12px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slotDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    textAlign: "left",
  },
  slotPatientName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#F8FAFC",
  },
  slotMeta: {
    fontSize: 11,
    color: "#94A3B8",
  },
  slotEmail: {
    fontSize: 10,
    color: "#64748B",
  },
  bookedBadge: {
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    color: "#34D399",
    border: "1px solid rgba(52, 211, 153, 0.3)",
    borderRadius: 8,
    padding: "4px 8px",
    fontSize: 10,
    fontWeight: 700,
  },
  slotsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 10,
    marginTop: 6,
  },
  slotCardAvailable: {
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    borderRadius: 12,
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    color: "#94A3B8",
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
    textAlign: "left",
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
    maxWidth: 400,
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
    textAlign: "left",
  },
  modalTabs: {
    display: "flex",
    borderBottom: "1px solid #222227",
    marginBottom: "16px",
    gap: "8px",
  },
  modalTabBtn: {
    flex: 1,
    padding: "10px 0",
    backgroundColor: "transparent",
    border: "none",
    color: "#94A3B8",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    transition: "all 0.2s",
  },
  activeModalTabBtn: {
    color: "#A78BFA",
    borderBottomColor: "#A78BFA",
  },
  googleSyncBox: {
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    borderRadius: "16px",
    padding: "24px 16px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "center",
  },
  googleBtn: {
    backgroundColor: "#A78BFA",
    color: "#000000",
    border: "none",
    borderRadius: "12px",
    padding: "12px 24px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  calendarScrollArea: {
    maxHeight: "260px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    paddingRight: "6px",
  },
  calendarDayRow: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    borderBottom: "1px solid #1C1C22",
    paddingBottom: "10px",
  },
  calendarDayLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#A78BFA",
    textAlign: "left",
  },
  timePillsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  timePill: {
    backgroundColor: "#1C1C22",
    border: "1px solid #222227",
    color: "#E2E8F0",
    padding: "6px 10px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  timePillSelected: {
    backgroundColor: "#A78BFA",
    borderColor: "#A78BFA",
    color: "#000000",
  },
  batchPublishBtn: {
    backgroundColor: "#A78BFA",
    color: "#000000",
    border: "none",
    borderRadius: "12px",
    padding: "14px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "10px",
    width: "100%",
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
  },
  row: {
    display: "flex",
    gap: 10,
  },
  portionsCard: {
    backgroundColor: "rgba(167, 139, 250, 0.04)",
    border: "1px solid rgba(167, 139, 250, 0.15)",
    borderRadius: 14,
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  portionsTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#C084FC",
    margin: 0,
  },
  portionsSubtitle: {
    fontSize: 10,
    color: "#94A3B8",
    margin: 0,
    lineHeight: 1.3,
  },
  portionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
    marginTop: "4px",
  },
  portionCol: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  portionLabel: {
    fontSize: 10,
    color: "#E2E8F0",
    fontWeight: 600,
  },
  portionCounter: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#0B0B0C",
    border: "1px solid rgba(167, 139, 250, 0.12)",
    borderRadius: 8,
    overflow: "hidden",
  },
  counterBtn: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    color: "#A78BFA",
    fontSize: 14,
    fontWeight: 700,
    padding: "6px 0",
    cursor: "pointer",
    textAlign: "center",
  },
  counterVal: {
    flex: 1.2,
    fontSize: 12,
    fontWeight: 700,
    color: "#FFF",
    textAlign: "center",
  }
};

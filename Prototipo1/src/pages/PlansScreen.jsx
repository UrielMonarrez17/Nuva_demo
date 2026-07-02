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
  onSnapshot,
  setDoc,
  deleteDoc
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
    autoGeneratePlan,
    recipes,
    addresses
  } = useApp();

  const [nutriologists, setNutriologists] = useState([]);
  const [selectedNutri, setSelectedNutri] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookingArea, setShowBookingArea] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Period state
  const [planningPeriod, setPlanningPeriod] = useState("weekly"); // "daily" | "weekly" | "monthly"
  const [selectedDailyDate, setSelectedDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedDay, setExpandedDay] = useState("Lunes"); // For weekly accordion
  const [expandedWeek, setExpandedWeek] = useState("Semana 1"); // For monthly accordion

  // Meal Planner states
  const [myMealPlans, setMyMealPlans] = useState({});
  const [selectedMealSlot, setSelectedMealSlot] = useState(null); // { period, dayKey, slotKey }
  const [showMealModal, setShowMealModal] = useState(false);
  
  // Meal Form states
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [mealTime, setMealTime] = useState("");
  const [buyThisMeal, setBuyThisMeal] = useState(false);
  const [mealAddress, setMealAddress] = useState("");
  const [mealPayment, setMealPayment] = useState("");

  // Checkout override prompt
  const [showCheckoutPrompt, setShowCheckoutPrompt] = useState(false);
  const [checkoutSlot, setCheckoutSlot] = useState(null); // { period, dayKey, slotKey }

  const WEEK_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const MONTH_WEEKS = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];

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

  // Listen to my meal plans in real-time
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "user_meal_plans"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plansMap = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        const key = `${data.period}_${data.dayKey}_${data.slotKey}`;
        plansMap[key] = { id: doc.id, ...data };
      });
      setMyMealPlans(plansMap);
    });

    return () => unsubscribe();
  }, [currentUser]);

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

  const handleOpenAddMeal = (period, dayKey, slotKey) => {
    const key = `${period}_${dayKey}_${slotKey}`;
    const existing = myMealPlans[key];
    
    setSelectedMealSlot({ period, dayKey, slotKey });
    if (existing) {
      setSelectedRecipeId(existing.recipeId || "");
      setMealTime(existing.time || getDefaultTime(slotKey));
      setBuyThisMeal(existing.buy || false);
      setMealAddress(existing.address || localStorage.getItem("pref_addr") || (addresses[0]?.street || ""));
      setMealPayment(existing.payment || localStorage.getItem("pref_pay") || "Tarjeta (*4321)");
    } else {
      setSelectedRecipeId(recipes[0]?.id || "");
      setMealTime(getDefaultTime(slotKey));
      setBuyThisMeal(false);
      setMealAddress(localStorage.getItem("pref_addr") || (addresses[0]?.street || ""));
      setMealPayment(localStorage.getItem("pref_pay") || "Tarjeta (*4321)");
    }
    setShowMealModal(true);
  };

  const getDefaultTime = (slotKey) => {
    switch (slotKey) {
      case "Desayuno": return "08:00 AM";
      case "Colacion1": return "11:00 AM";
      case "Comida": return "02:00 PM";
      case "Colacion2": return "05:00 PM";
      case "Cena": return "08:00 PM";
      default: return "12:00 PM";
    }
  };

  const handleSaveMeal = async (e) => {
    e.preventDefault();
    if (!currentUser || !selectedMealSlot) return;

    const { period, dayKey, slotKey } = selectedMealSlot;
    const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);
    if (!selectedRecipe) {
      alert("Selecciona un platillo válido.");
      return;
    }

    const docId = `${currentUser.uid}_${period}_${dayKey}_${slotKey}`;
    
    if (buyThisMeal && (!mealAddress || !mealPayment)) {
      alert("Por favor completa la dirección y método de pago.");
      return;
    }

    const mealData = {
      recipeId: selectedRecipeId,
      recipeName: selectedRecipe.name,
      recipeImage: selectedRecipe.imageUrl,
      time: mealTime,
      buy: buyThisMeal,
      address: buyThisMeal ? mealAddress : "",
      payment: buyThisMeal ? mealPayment : ""
    };

    if (buyThisMeal) {
      localStorage.setItem("pref_addr", mealAddress);
      localStorage.setItem("pref_pay", mealPayment);
    }

    try {
      await setDoc(doc(db, "user_meal_plans", docId), {
        userId: currentUser.uid,
        period,
        dayKey,
        slotKey,
        ...mealData,
        updatedAt: new Date().toISOString()
      });
      setShowMealModal(false);
      alert("¡Comida planificada guardada con éxito!");
    } catch (err) {
      console.error(err);
      alert("Error al guardar planificación.");
    }
  };

  const handleDeleteMeal = async (period, dayKey, slotKey) => {
    if (!window.confirm("¿Seguro que deseas eliminar este platillo del plan?")) return;
    const docId = `${currentUser.uid}_${period}_${dayKey}_${slotKey}`;
    try {
      await deleteDoc(doc(db, "user_meal_plans", docId));
      alert("Platillo quitado del plan.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBuyCheckbox = async (period, dayKey, slotKey, currentBuyState) => {
    const key = `${period}_${dayKey}_${slotKey}`;
    const existing = myMealPlans[key];
    if (!existing) {
      alert("Planifica un platillo primero para poder comprarlo.");
      return;
    }

    const docId = `${currentUser.uid}_${period}_${dayKey}_${slotKey}`;

    if (!currentBuyState) {
      setCheckoutSlot({ period, dayKey, slotKey });
      setMealAddress(existing.address || localStorage.getItem("pref_addr") || (addresses[0]?.street || ""));
      setMealPayment(existing.payment || localStorage.getItem("pref_pay") || "Tarjeta (*4321)");
      setShowCheckoutPrompt(true);
    } else {
      try {
        await updateDoc(doc(db, "user_meal_plans", docId), {
          buy: false,
          address: "",
          payment: ""
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleConfirmCheckoutPrompt = async (e) => {
    e.preventDefault();
    if (!checkoutSlot) return;

    const { period, dayKey, slotKey } = checkoutSlot;
    const docId = `${currentUser.uid}_${period}_${dayKey}_${slotKey}`;

    localStorage.setItem("pref_addr", mealAddress);
    localStorage.setItem("pref_pay", mealPayment);

    try {
      await updateDoc(doc(db, "user_meal_plans", docId), {
        buy: true,
        address: mealAddress,
        payment: mealPayment
      });
      setShowCheckoutPrompt(false);
      setCheckoutSlot(null);
      alert("¡Opción de compra activada para este platillo!");
    } catch (err) {
      console.error(err);
      alert("Error al guardar detalles de envío.");
    }
  };

  const renderMealSlot = (period, dayKey, slotKey) => {
    const key = `${period}_${dayKey}_${slotKey}`;
    const planned = myMealPlans[key];

    if (planned) {
      return (
        <div key={slotKey} style={styles.plannedSlotCard}>
          <div style={styles.slotTopRow}>
            <img src={planned.recipeImage} alt={planned.recipeName} style={styles.slotImage} />
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={styles.slotMetaRow}>
                <span style={styles.slotLabel}>{slotKey}</span>
                <span style={styles.slotTimeText}>⏱️ {planned.time}</span>
              </div>
              <strong style={styles.slotDishName}>{planned.recipeName}</strong>
            </div>
            
            <div style={styles.slotActionsBtnCol}>
              <button 
                type="button"
                onClick={() => handleOpenAddMeal(period, dayKey, slotKey)} 
                style={styles.actionIconBtn}
                title="Editar platillo"
              >
                ✏️
              </button>
              <button 
                type="button"
                onClick={() => handleDeleteMeal(period, dayKey, slotKey)} 
                style={{ ...styles.actionIconBtn, color: '#EF4444' }}
                title="Eliminar platillo"
              >
                🗑️
              </button>
            </div>
          </div>

          <div style={styles.slotPurchaseRow}>
            <label style={styles.checkboxContainer}>
              <input
                type="checkbox"
                checked={planned.buy || false}
                onChange={() => handleToggleBuyCheckbox(period, dayKey, slotKey, planned.buy)}
                style={styles.checkboxInput}
              />
              <span style={styles.checkboxLabel}>Pedir a domicilio en este horario 🛵</span>
            </label>
          </div>

          {planned.buy && (
            <div style={styles.checkoutDetailsRow}>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div>
                  <span style={styles.detailLabel}>Enviar a:</span>
                  <span style={styles.detailValue}>{planned.address}</span>
                </div>
                <div style={{ marginTop: 2 }}>
                  <span style={styles.detailLabel}>Pago:</span>
                  <span style={styles.detailValue}>{planned.payment}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCheckoutSlot({ period, dayKey, slotKey });
                  setMealAddress(planned.address || localStorage.getItem("pref_addr") || (addresses[0]?.street || ""));
                  setMealPayment(planned.payment || localStorage.getItem("pref_pay") || "Tarjeta (*4321)");
                  setShowCheckoutPrompt(true);
                }}
                style={styles.changeDeliveryBtn}
              >
                Modificar
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={slotKey} style={styles.emptySlotCard} onClick={() => handleOpenAddMeal(period, dayKey, slotKey)}>
        <span style={styles.emptySlotLabel}>{slotKey}</span>
        <button type="button" style={styles.addDishBtn}>
          ➕ Planificar Platillo
        </button>
      </div>
    );
  };

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <div style={styles.screen}>
          
          <h1 style={styles.title}>Planificador Nutricional</h1>
          <p style={styles.subtitle}>Planea tus comidas diarias, semanales o mensuales y recibe tu dieta directo a tu puerta.</p>

          {/* Active plan macros at a glance */}
          {nutritionalPlan ? (
            <div style={styles.miniPlanCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#A78BFA', fontWeight: 800 }}>📊 Plan Activo:</span>
                <span style={{ fontSize: 10, color: '#64748B' }}>{nutritionalPlan.startDate} al {nutritionalPlan.endDate}</span>
              </div>
              <div style={styles.macrosListRow}>
                <span style={styles.miniMacroPill}><strong style={{ color: '#34D399' }}>{nutritionalPlan.kcalLimit}</strong> Kcal</span>
                <span style={styles.miniMacroPill}><strong style={{ color: '#F97316' }}>{nutritionalPlan.proteinLimit}g</strong> Prot</span>
                <span style={styles.miniMacroPill}><strong style={{ color: '#FACC15' }}>{nutritionalPlan.carbLimit}g</strong> Carb</span>
                <span style={styles.miniMacroPill}><strong style={{ color: '#A78BFA' }}>{nutritionalPlan.fatLimit}g</strong> Gras</span>
              </div>
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

          {/* Interactive Planner Section */}
          <div style={styles.plannerSection}>
            <div style={styles.plannerHeader}>
              <h2 style={styles.plannerTitle}>Planificador de Comidas</h2>
              
              {/* Tab Selector */}
              <div style={styles.periodTabs}>
                {["daily", "weekly", "monthly"].map(p => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPlanningPeriod(p)}
                    style={{
                      ...styles.periodTabBtn,
                      ...(planningPeriod === p ? styles.activePeriodTabBtn : {})
                    }}
                  >
                    {p === "daily" ? "Diario" : p === "weekly" ? "Semanal" : "Mensual"}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily View */}
            {planningPeriod === "daily" && (
              <div style={styles.dailyContainer}>
                <div style={styles.dateSelectorRow}>
                  <label style={styles.dateLabel}>Seleccionar Día:</label>
                  <input
                    type="date"
                    value={selectedDailyDate}
                    onChange={(e) => setSelectedDailyDate(e.target.value)}
                    style={styles.dateInput}
                  />
                </div>

                <div style={styles.slotsListContainer}>
                  {["Desayuno", "Colacion1", "Comida", "Colacion2", "Cena"].map(slotKey => 
                    renderMealSlot("daily", selectedDailyDate, slotKey)
                  )}
                </div>
              </div>
            )}

            {/* Weekly View */}
            {planningPeriod === "weekly" && (
              <div style={styles.accordionContainer}>
                {WEEK_DAYS.map(day => {
                  const isOpen = expandedDay === day;
                  const plannedCount = ["Desayuno", "Colacion1", "Comida", "Colacion2", "Cena"].filter(slot => {
                    return !!myMealPlans[`weekly_${day}_${slot}`];
                  }).length;

                  return (
                    <div key={day} style={styles.accordionItem}>
                      <button
                        type="button"
                        onClick={() => setExpandedDay(isOpen ? "" : day)}
                        style={styles.accordionHeader}
                      >
                        <span style={styles.dayTitle}>{day}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {plannedCount > 0 && (
                            <span style={styles.plannedCountBadge}>{plannedCount} / 5</span>
                          )}
                          <span style={styles.accordionIcon}>{isOpen ? "▲" : "▼"}</span>
                        </div>
                      </button>

                      {isOpen && (
                        <div style={styles.accordionContent}>
                          {["Desayuno", "Colacion1", "Comida", "Colacion2", "Cena"].map(slot => 
                            renderMealSlot("weekly", day, slot)
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Monthly View */}
            {planningPeriod === "monthly" && (
              <div style={styles.accordionContainer}>
                {MONTH_WEEKS.map(week => {
                  const isOpen = expandedWeek === week;
                  
                  return (
                    <div key={week} style={styles.accordionItem}>
                      <button
                        type="button"
                        onClick={() => setExpandedWeek(isOpen ? "" : week)}
                        style={styles.accordionHeader}
                      >
                        <span style={styles.dayTitle}>{week}</span>
                        <span style={styles.accordionIcon}>{isOpen ? "▲" : "▼"}</span>
                      </button>

                      {isOpen && (
                        <div style={styles.accordionContent}>
                          {["Día 1", "Día 2", "Día 3", "Día 4", "Día 5", "Día 6", "Día 7"].map(dayLabel => {
                            const uniqueDayKey = `${week}_${dayLabel}`;
                            const plannedCount = ["Desayuno", "Colacion1", "Comida", "Colacion2", "Cena"].filter(slot => {
                              return !!myMealPlans[`monthly_${uniqueDayKey}_${slot}`];
                            }).length;

                            return (
                              <div key={dayLabel} style={styles.monthlyDayBox}>
                                <h4 style={styles.monthlyDayTitle}>
                                  {dayLabel} {plannedCount > 0 && <span style={styles.monthlyBadge}>{plannedCount} / 5</span>}
                                </h4>
                                <div style={styles.monthlyDaySlotsContainer}>
                                  {["Desayuno", "Colacion1", "Comida", "Colacion2", "Cena"].map(slot => 
                                    renderMealSlot("monthly", uniqueDayKey, slot)
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Appointments / Booking slots section */}
          <div style={styles.appointmentsSection}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Agenda Clínico-Nutricional</h2>
              <button 
                type="button"
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

          {/* Meal Planning Edit Modal */}
          {showMealModal && (
            <div style={styles.modalOverlay}>
              <div style={{ ...styles.modalCard, maxWidth: 400 }}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>
                    Planificar {selectedMealSlot?.slotKey}
                  </h3>
                  <button type="button" style={styles.closeBtn} onClick={() => setShowMealModal(false)}>✕</button>
                </div>
                <p style={styles.modalSubtitle}>
                  Elige un platillo de las recetas aprobadas en la base de datos para tu {selectedMealSlot?.slotKey} del {selectedMealSlot?.dayKey}.
                </p>

                <form onSubmit={handleSaveMeal} style={styles.modalForm}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Platillo / Receta</label>
                    <select
                      value={selectedRecipeId}
                      onChange={(e) => setSelectedRecipeId(e.target.value)}
                      style={styles.select}
                      required
                    >
                      <option value="">Selecciona una receta...</option>
                      {recipes.map(recipe => (
                        <option key={recipe.id} value={recipe.id}>
                          {recipe.name} ({recipe.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Hora estimada de comida</label>
                    <input
                      type="text"
                      placeholder="Ej. 08:30 AM"
                      value={mealTime}
                      onChange={(e) => setMealTime(e.target.value)}
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.checkboxContainer}>
                      <input
                        type="checkbox"
                        checked={buyThisMeal}
                        onChange={(e) => setBuyThisMeal(e.target.checked)}
                        style={styles.checkboxInput}
                      />
                      <span style={{ ...styles.checkboxLabel, fontSize: 13, fontWeight: 700, color: '#F97316' }}>
                        Pedir a domicilio 🛵
                      </span>
                    </label>
                  </div>

                  {buyThisMeal && (
                    <>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Dirección de envío</label>
                        <select
                          value={mealAddress}
                          onChange={(e) => setMealAddress(e.target.value)}
                          style={styles.select}
                          required
                        >
                          <option value="">Selecciona dirección...</option>
                          {addresses.map(addr => (
                            <option key={addr.id} value={addr.street}>
                              {addr.street} ({addr.neighborhood})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="O ingresa una dirección alternativa..."
                          value={mealAddress}
                          onChange={(e) => setMealAddress(e.target.value)}
                          style={{ ...styles.formInput, marginTop: 6 }}
                        />
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Método de pago preferente</label>
                        <select
                          value={mealPayment}
                          onChange={(e) => setMealPayment(e.target.value)}
                          style={styles.select}
                          required
                        >
                          <option value="Tarjeta (*4321)">Tarjeta Visa terminado en *4321</option>
                          <option value="Tarjeta (*9876)">Tarjeta MasterCard terminado en *9876</option>
                          <option value="Apple Pay">Apple Pay</option>
                          <option value="Efectivo contra entrega">Efectivo contra entrega</option>
                        </select>
                      </div>
                    </>
                  )}

                  <button type="submit" style={styles.modalSubmitBtn}>
                    Guardar en Calendario
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Checkout Preference Prompt Modal */}
          {showCheckoutPrompt && (
            <div style={styles.modalOverlay}>
              <div style={{ ...styles.modalCard, maxWidth: 380 }}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Configurar Entrega 🛵</h3>
                  <button type="button" style={styles.closeBtn} onClick={() => {
                    setShowCheckoutPrompt(false);
                    setCheckoutSlot(null);
                  }}>✕</button>
                </div>
                <p style={styles.modalSubtitle}>
                  Ingresa los detalles de envío y método de pago para este platillo. Guardaremos esto como tu dirección preferencial para agilizar tus pedidos.
                </p>

                <form onSubmit={handleConfirmCheckoutPrompt} style={styles.modalForm}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Dirección de envío</label>
                    <select
                      value={mealAddress}
                      onChange={(e) => setMealAddress(e.target.value)}
                      style={styles.select}
                      required
                    >
                      <option value="">Selecciona dirección...</option>
                      {addresses.map(addr => (
                        <option key={addr.id} value={addr.street}>
                          {addr.street} ({addr.neighborhood})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="O ingresa dirección alternativa..."
                      value={mealAddress}
                      onChange={(e) => setMealAddress(e.target.value)}
                      style={{ ...styles.formInput, marginTop: 6 }}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Método de pago preferente</label>
                    <select
                      value={mealPayment}
                      onChange={(e) => setMealPayment(e.target.value)}
                      style={styles.select}
                      required
                    >
                      <option value="Tarjeta (*4321)">Tarjeta Visa terminado en *4321</option>
                      <option value="Tarjeta (*9876)">Tarjeta MasterCard terminado en *9876</option>
                      <option value="Apple Pay">Apple Pay</option>
                      <option value="Efectivo contra entrega">Efectivo contra entrega</option>
                    </select>
                  </div>

                  <button type="submit" style={{ ...styles.modalSubmitBtn, backgroundColor: '#F97316' }}>
                    Confirmar Compra
                  </button>
                </form>
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
  title: {
    fontSize: 28,
    fontWeight: 800,
    margin: "0 0 8px 0",
    textAlign: "left",
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    margin: "0 0 20px 0",
    lineHeight: 1.4,
    textAlign: "left",
  },
  miniPlanCard: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "20px",
    textAlign: "left",
  },
  macrosListRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  miniMacroPill: {
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    padding: "4px 8px",
    borderRadius: "8px",
    fontSize: "11px",
    color: "#94A3B8",
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
  plannerSection: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: "24px",
    padding: "20px",
    marginBottom: "24px",
  },
  plannerHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "20px",
  },
  plannerTitle: {
    fontSize: "16px",
    fontWeight: 800,
    color: "#F8FAFC",
    margin: 0,
    textAlign: "left",
  },
  periodTabs: {
    display: "flex",
    backgroundColor: "#0B0B0C",
    borderRadius: "12px",
    padding: "4px",
    border: "1px solid #222227",
  },
  periodTabBtn: {
    flex: 1,
    padding: "8px 0",
    backgroundColor: "transparent",
    border: "none",
    color: "#64748B",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    borderRadius: "8px",
    transition: "all 0.2s",
  },
  activePeriodTabBtn: {
    backgroundColor: "#F97316",
    color: "#000000",
  },
  dailyContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  dateSelectorRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0B0B0C",
    borderRadius: "12px",
    padding: "10px 14px",
    border: "1px solid #222227",
  },
  dateLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#94A3B8",
  },
  dateInput: {
    backgroundColor: "transparent",
    border: "none",
    color: "#F8FAFC",
    fontSize: "13px",
    fontWeight: "600",
    outline: "none",
    cursor: "pointer",
  },
  slotsListContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  emptySlotCard: {
    backgroundColor: "#0B0B0C",
    border: "1px dashed #222227",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  emptySlotLabel: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#64748B",
  },
  addDishBtn: {
    backgroundColor: "rgba(249, 115, 22, 0.08)",
    border: "1px solid rgba(249, 115, 22, 0.2)",
    borderRadius: "8px",
    color: "#F97316",
    padding: "6px 12px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },
  plannedSlotCard: {
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  slotTopRow: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  slotImage: {
    width: "50px",
    height: "50px",
    borderRadius: "10px",
    objectFit: "cover",
  },
  slotMetaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slotLabel: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#F97316",
    textTransform: "uppercase",
  },
  slotTimeText: {
    fontSize: "11px",
    color: "#94A3B8",
    fontWeight: "600",
  },
  slotDishName: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#F8FAFC",
    marginTop: "2px",
    display: "block",
  },
  slotActionsBtnCol: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  actionIconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    padding: "2px",
  },
  slotPurchaseRow: {
    display: "flex",
    alignItems: "center",
    borderTop: "1px solid #1C1C22",
    paddingTop: "10px",
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    userSelect: "none",
  },
  checkboxInput: {
    width: "16px",
    height: "16px",
    accentColor: "#F97316",
    cursor: "pointer",
  },
  checkboxLabel: {
    fontSize: "12px",
    color: "#CBD5E1",
  },
  checkoutDetailsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(249, 115, 22, 0.04)",
    borderRadius: "10px",
    padding: "8px 12px",
    border: "1px dashed rgba(249, 115, 22, 0.15)",
    fontSize: "11px",
  },
  detailLabel: {
    color: "#64748B",
    marginRight: "4px",
  },
  detailValue: {
    color: "#E2E8F0",
    fontWeight: "600",
  },
  changeDeliveryBtn: {
    background: "none",
    border: "none",
    color: "#F97316",
    fontWeight: "700",
    fontSize: "10px",
    cursor: "pointer",
    textTransform: "uppercase",
    padding: "4px",
  },
  accordionContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  accordionItem: {
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    borderRadius: "14px",
    overflow: "hidden",
  },
  accordionHeader: {
    width: "100%",
    backgroundColor: "transparent",
    border: "none",
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    outline: "none",
  },
  dayTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#F8FAFC",
  },
  plannedCountBadge: {
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    color: "#A78BFA",
    fontSize: "10px",
    fontWeight: "700",
    padding: "2px 6px",
    borderRadius: "6px",
  },
  accordionIcon: {
    fontSize: "10px",
    color: "#64748B",
  },
  accordionContent: {
    padding: "0 14px 14px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    borderTop: "1px solid #1C1C22",
    paddingTop: "12px",
  },
  monthlyDayBox: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: "12px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "10px",
  },
  monthlyDayTitle: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#A78BFA",
    margin: 0,
    textAlign: "left",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthlyBadge: {
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    color: "#A78BFA",
    fontSize: "9px",
    padding: "1px 4px",
    borderRadius: "4px",
  },
  monthlyDaySlotsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "6px",
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
    maxHeight: "90vh",
    overflowY: "auto",
    boxSizing: "border-box",
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
  formLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#94A3B8"
  },
  formInput: {
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "#FFF",
    fontSize: "14px",
    outline: "none",
  },
  modalSubmitBtn: {
    backgroundColor: "#F97316",
    color: "#000",
    border: "none",
    borderRadius: "12px",
    padding: "14px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "10px",
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

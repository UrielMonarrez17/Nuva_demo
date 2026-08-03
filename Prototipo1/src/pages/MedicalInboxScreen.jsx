// src/pages/MedicalInboxScreen.jsx

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import {
  documentTextOutline,
  fitnessOutline,
  shieldCheckmarkOutline,
  cartOutline,
  checkmarkDoneOutline,
  chatbubbleEllipsesOutline,
  sendOutline,
  personOutline,
  flameOutline,
  barChartOutline,
  closeCircleOutline,
  timeOutline,
  nutritionOutline,
  chevronBackOutline
} from "ionicons/icons";

const TAB_PRESCRIPTIONS = "prescriptions";
const TAB_PLAN = "plan";
const TAB_CHAT = "chat";

export default function MedicalInboxScreen() {
  const {
    prescriptions,
    addToCart,
    redeemPrescription,
    userProfile,
    nutritionalPlan,
    chatMessages,
    activeChatPartnerId,
    setActiveChatPartnerId,
    sendChatMessage,
    currentUser
  } = useApp();

  const history = useHistory();
  const [activeTab, setActiveTab] = useState(TAB_PRESCRIPTIONS);
  const [successRedeem, setSuccessRedeem] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get the nutriologist linked to this patient
  const nutriologistId = userProfile?.nutriologistId || null;
  const nutriologistName = userProfile?.nutriologistName || "Tu Nutriólogo";

  // Filter only prescriptions for this patient
  const patientPrescriptions = prescriptions.filter(
    (p) => p.patientEmail === userProfile?.email?.toLowerCase().trim()
  );

  // Set the chat partner when tab changes to chat
  useEffect(() => {
    if (activeTab === TAB_CHAT && nutriologistId) {
      setActiveChatPartnerId(nutriologistId);
    }
  }, [activeTab, nutriologistId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === TAB_CHAT && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  const handleOrderPrescription = async (pres) => {
    const customizedItem = {
      recipeId: pres.recipeId,
      recipeName: `Receta: ${pres.recipeName}`,
      imageUrl: pres.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
      gramsMap: pres.gramsMap,
      finalPrice: pres.totalPrice,
      macros: pres.macros,
      breakdown: pres.breakdown || [],
      isPrescribed: true,
      prescriberName: pres.nutriologistName
    };
    addToCart(customizedItem);
    await redeemPrescription(pres.id);
    setSuccessRedeem(true);
    setTimeout(() => {
      setSuccessRedeem(false);
      history.push("/cart");
    }, 1200);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !nutriologistId || sending) return;
    setSending(true);
    await sendChatMessage(nutriologistId, chatInput.trim());
    setChatInput("");
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1) return "Ahora";
    if (diffMin < 60) return `${diffMin}m`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    return d.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
  };

  const activePlan = nutritionalPlan;

  return (
    <IonPage>
      <IonContent scrollY={activeTab !== TAB_CHAT}>
        <div style={styles.screen}>

          {/* Header */}
          <div style={styles.header}>
            <div>
              <span style={styles.eyebrow}>Espacio Clínico</span>
              <h1 style={styles.title}>Buzón Médico</h1>
            </div>
            <div style={styles.clinicalBadge}>
              <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: 12 }} />
              <span>Protegido</span>
            </div>
          </div>

          {/* Nutriologist info pill */}
          {nutriologistId ? (
            <div style={styles.nutriPill}>
              <div style={styles.nutriAvatar}>
                <IonIcon icon={personOutline} style={{ fontSize: 18, color: "#A78BFA" }} />
              </div>
              <div>
                <div style={styles.nutriLabel}>Tu nutriólogo asignado</div>
                <div style={styles.nutriName}>{nutriologistName}</div>
              </div>
              <div style={styles.onlineDot} />
            </div>
          ) : (
            <div style={styles.noNutriPill}>
              <IonIcon icon={personOutline} style={{ fontSize: 16, color: "#64748B" }} />
              <span style={{ fontSize: 12, color: "#64748B" }}>Sin nutriólogo asignado aún</span>
            </div>
          )}

          {/* Tabs */}
          <div style={styles.tabBar}>
            <button
              style={{ ...styles.tabBtn, ...(activeTab === TAB_PRESCRIPTIONS ? styles.tabBtnActive : {}) }}
              onClick={() => setActiveTab(TAB_PRESCRIPTIONS)}
            >
              <IonIcon icon={documentTextOutline} style={{ fontSize: 16 }} />
              <span>Recetas</span>
              {patientPrescriptions.filter(p => p.status !== "ordered").length > 0 && (
                <span style={styles.badge}>
                  {patientPrescriptions.filter(p => p.status !== "ordered").length}
                </span>
              )}
            </button>
            <button
              style={{ ...styles.tabBtn, ...(activeTab === TAB_PLAN ? styles.tabBtnActive : {}) }}
              onClick={() => setActiveTab(TAB_PLAN)}
            >
              <IonIcon icon={barChartOutline} style={{ fontSize: 16 }} />
              <span>Mi Plan</span>
            </button>
            <button
              style={{ ...styles.tabBtn, ...(activeTab === TAB_CHAT ? styles.tabBtnActive : {}) }}
              onClick={() => setActiveTab(TAB_CHAT)}
            >
              <IonIcon icon={chatbubbleEllipsesOutline} style={{ fontSize: 16 }} />
              <span>Chat</span>
            </button>
          </div>

          {/* ── TAB: PRESCRIPTIONS ── */}
          {activeTab === TAB_PRESCRIPTIONS && (
            <div style={styles.tabContent}>
              {patientPrescriptions.length === 0 ? (
                <div style={styles.emptyContainer}>
                  <div style={styles.emptyIcon}>🩺</div>
                  <h2 style={styles.emptyTitle}>Sin recetas activas</h2>
                  <p style={styles.emptySubtitle}>
                    Comparte tu correo <strong>{userProfile?.email}</strong> con tu nutriólogo para recibir recetas personalizadas.
                  </p>
                </div>
              ) : (
                <div style={styles.listContainer}>
                  {patientPrescriptions.map((pres) => {
                    const isOrdered = pres.status === "ordered";
                    return (
                      <div
                        key={pres.id}
                        style={{
                          ...styles.presCard,
                          opacity: isOrdered ? 0.6 : 1,
                          borderLeft: isOrdered ? "4px solid #334155" : "4px solid #A78BFA"
                        }}
                      >
                        {/* Card Header */}
                        <div style={styles.cardHeader}>
                          <div>
                            <span style={styles.doctorLabel}>RECETADO POR</span>
                            <h3 style={styles.doctorName}>{pres.nutriologistName}</h3>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                            <span style={{
                              ...styles.statusTag,
                              backgroundColor: isOrdered ? "rgba(71,85,105,0.15)" : "rgba(167,139,250,0.12)",
                              color: isOrdered ? "#64748B" : "#A78BFA",
                              border: isOrdered ? "1px solid rgba(71,85,105,0.3)" : "1px solid rgba(167,139,250,0.3)"
                            }}>
                              {isOrdered ? "✓ Ordenado" : "● Recetado"}
                            </span>
                            <span style={styles.dateTag}>
                              <IonIcon icon={timeOutline} style={{ fontSize: 10 }} />
                              {formatTime(pres.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div style={styles.divider} />

                        {/* Dish Name */}
                        <div style={styles.dishSection}>
                          <div style={styles.dishNameRow}>
                            <IonIcon icon={nutritionOutline} style={{ fontSize: 16, color: "#F97316" }} />
                            <h4 style={styles.dishName}>{pres.recipeName}</h4>
                          </div>

                          {/* Ingredients */}
                          {pres.breakdown && pres.breakdown.length > 0 && (
                            <div style={styles.ingredientsList}>
                              {pres.breakdown.map((ing, i) => (
                                <div key={ing.id || i} style={styles.ingRow}>
                                  <span style={styles.ingName}>• {ing.name}</span>
                                  <span style={styles.ingGrams}>{ing.grams}g</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Macros */}
                        <div style={styles.macrosBadgeSection}>
                          <MacroPill value={`${pres.macros?.protein || 0}g`} label="Prot" color="#A78BFA" />
                          <MacroPill value={`${pres.macros?.carbs || 0}g`} label="Carb" color="#60A5FA" />
                          <MacroPill value={`${pres.macros?.fats || 0}g`} label="Grasas" color="#FBBF24" />
                          <MacroPill value={`${pres.macros?.kcal || 0}`} label="Kcal" color="#34D399" />
                        </div>

                        {/* CTA */}
                        {!isOrdered && (
                          <button
                            style={styles.orderBtn}
                            onClick={() => handleOrderPrescription(pres)}
                          >
                            <IonIcon icon={cartOutline} style={{ marginRight: 8, fontSize: 18 }} />
                            Añadir al Carrito · ${pres.totalPrice?.toFixed(2)} MXN
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: PLAN ── */}
          {activeTab === TAB_PLAN && (
            <div style={styles.tabContent}>
              {!activePlan ? (
                <div style={styles.emptyContainer}>
                  <div style={styles.emptyIcon}>📋</div>
                  <h2 style={styles.emptyTitle}>Sin plan activo</h2>
                  <p style={styles.emptySubtitle}>
                    Tu nutriólogo aún no te ha asignado un plan nutricional. Escríbele en el chat para solicitarlo.
                  </p>
                  <button style={styles.chatCta} onClick={() => setActiveTab(TAB_CHAT)}>
                    <IonIcon icon={chatbubbleEllipsesOutline} style={{ marginRight: 6 }} />
                    Abrir Chat
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Plan Header */}
                  <div style={styles.planCard}>
                    <div style={styles.planHeader}>
                      <div>
                        <span style={styles.eyebrow}>Plan Activo</span>
                        <h2 style={styles.planTitle}>Plan de {activePlan.nutriologistName || "Tu Nutriólogo"}</h2>
                      </div>
                      <div style={styles.planBadge}>
                        <IonIcon icon={fitnessOutline} style={{ fontSize: 14 }} />
                        <span>{activePlan.periodType === "week" ? "Semanal" : "Diario"}</span>
                      </div>
                    </div>
                    <div style={styles.planDates}>
                      <span>📅 {activePlan.startDate} → {activePlan.endDate}</span>
                    </div>
                  </div>

                  {/* Macro Goals */}
                  <div style={styles.planCard}>
                    <h3 style={styles.sectionTitle}>
                      <IonIcon icon={flameOutline} style={{ color: "#F97316", fontSize: 18 }} />
                      Metas de Macros
                    </h3>
                    <div style={styles.macroGoalGrid}>
                      <MacroGoalCard
                        label="Proteína"
                        value={activePlan.proteinLimit}
                        unit="g"
                        color="#A78BFA"
                        emoji="💪"
                      />
                      <MacroGoalCard
                        label="Carbohidratos"
                        value={activePlan.carbLimit}
                        unit="g"
                        color="#60A5FA"
                        emoji="🌾"
                      />
                      <MacroGoalCard
                        label="Grasas"
                        value={activePlan.fatLimit}
                        unit="g"
                        color="#FBBF24"
                        emoji="🥑"
                      />
                      <MacroGoalCard
                        label="Calorías"
                        value={activePlan.kcalLimit}
                        unit="kcal"
                        color="#34D399"
                        emoji="🔥"
                      />
                    </div>
                  </div>

                  {/* Tip */}
                  <div style={styles.tipCard}>
                    <span style={{ fontSize: 20 }}>💡</span>
                    <p style={styles.tipText}>
                      Estos macros se aplican automáticamente en <strong>Ajustar por Macros</strong> dentro de cualquier platillo personalizado.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: CHAT ── */}
          {activeTab === TAB_CHAT && (
            <div style={styles.chatContainer}>
              {!nutriologistId ? (
                <div style={styles.emptyContainer}>
                  <div style={styles.emptyIcon}>💬</div>
                  <h2 style={styles.emptyTitle}>Sin nutriólogo asignado</h2>
                  <p style={styles.emptySubtitle}>
                    Cuando un nutriólogo te registre como paciente, podrás chatear directamente aquí.
                  </p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div style={styles.chatHeader}>
                    <div style={styles.nutriAvatarLarge}>
                      <IonIcon icon={personOutline} style={{ fontSize: 22, color: "#A78BFA" }} />
                    </div>
                    <div>
                      <div style={styles.chatHeaderName}>{nutriologistName}</div>
                      <div style={styles.chatHeaderSub}>Nutriólogo Certificado · Nomi</div>
                    </div>
                    <div style={styles.onlineDotLarge} />
                  </div>

                  {/* Messages */}
                  <div style={styles.messagesArea}>
                    {chatMessages.length === 0 && (
                      <div style={styles.chatEmpty}>
                        <span style={{ fontSize: 32 }}>👋</span>
                        <p style={{ color: "#64748B", fontSize: 13, marginTop: 8, textAlign: "center" }}>
                          Comienza la conversación con tu nutriólogo.
                        </p>
                      </div>
                    )}
                    {chatMessages.map((msg) => {
                      const isMine = msg.senderId === currentUser?.uid;
                      return (
                        <div
                          key={msg.id}
                          style={{
                            ...styles.msgWrapper,
                            justifyContent: isMine ? "flex-end" : "flex-start"
                          }}
                        >
                          {!isMine && (
                            <div style={styles.msgAvatar}>
                              <IonIcon icon={personOutline} style={{ fontSize: 12, color: "#A78BFA" }} />
                            </div>
                          )}
                          <div style={{
                            ...styles.msgBubble,
                            ...(isMine ? styles.msgBubbleMine : styles.msgBubbleTheirs)
                          }}>
                            {!isMine && (
                              <span style={styles.msgSenderName}>{msg.senderName}</span>
                            )}
                            <p style={styles.msgText}>{msg.text}</p>
                            <span style={styles.msgTime}>{formatTime(msg.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <div style={styles.chatInputArea}>
                    <textarea
                      ref={inputRef}
                      style={styles.chatInput}
                      placeholder="Escribe un mensaje..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                    />
                    <button
                      style={{
                        ...styles.sendBtn,
                        opacity: chatInput.trim() && !sending ? 1 : 0.4
                      }}
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || sending}
                    >
                      <IonIcon icon={sendOutline} style={{ fontSize: 18 }} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Success Toast */}
          {successRedeem && (
            <div style={styles.toastOverlay}>
              <div style={styles.toastCard}>
                <IonIcon icon={checkmarkDoneOutline} style={styles.toastIcon} />
                <span>Receta cargada en tu Carrito</span>
              </div>
            </div>
          )}

          {/* Bottom Spacing */}
          <div style={{ height: "calc(100px + env(safe-area-inset-bottom))" }} />
        </div>
      </IonContent>
    </IonPage>
  );
}

// ── Sub-components ──

function MacroPill({ value, label, color }) {
  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: "#0B0B0C",
      border: `1px solid ${color}22`,
      borderRadius: 10,
      padding: "7px 4px",
      gap: 2
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function MacroGoalCard({ label, value, unit, color, emoji }) {
  return (
    <div style={{
      backgroundColor: "#0B0B0C",
      border: `1px solid ${color}25`,
      borderRadius: 16,
      padding: "16px 12px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      flex: 1
    }}>
      <span style={{ fontSize: 24 }}>{emoji}</span>
      <span style={{ fontSize: 22, fontWeight: 800, color }}>{value}</span>
      <span style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", fontWeight: 600, textAlign: "center" }}>
        {label}<br />
        <span style={{ color: "#94A3B8", fontWeight: 400 }}>{unit}</span>
      </span>
    </div>
  );
}

// ── Styles ──

const styles = {
  screen: {
    backgroundColor: "#0B0B0C",
    minHeight: "100vh",
    maxWidth: 480,
    margin: "0 auto",
    padding: "24px 18px 0 18px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#F8FAFC",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 12,
  },
  eyebrow: {
    fontSize: 10,
    color: "#A78BFA",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 700,
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    margin: "4px 0 0 0",
  },
  clinicalBadge: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(167,139,250,0.08)",
    border: "1px solid rgba(167,139,250,0.2)",
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 8,
    padding: "5px 10px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    flexShrink: 0
  },
  // Nutriologist info pill
  nutriPill: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#131316",
    border: "1px solid rgba(167,139,250,0.15)",
    borderRadius: 14,
    padding: "12px 16px",
    marginBottom: 18,
    position: "relative"
  },
  nutriAvatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    backgroundColor: "rgba(167,139,250,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  nutriLabel: {
    fontSize: 9,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 600
  },
  nutriName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#F8FAFC",
    marginTop: 1
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    backgroundColor: "#34D399",
    position: "absolute",
    top: 12,
    right: 14,
    boxShadow: "0 0 0 2px #0B0B0C"
  },
  noNutriPill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 14,
    padding: "12px 16px",
    marginBottom: 18,
  },
  // Tab bar
  tabBar: {
    display: "flex",
    gap: 6,
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 14,
    padding: 5,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: "10px 6px",
    borderRadius: 10,
    border: "none",
    backgroundColor: "transparent",
    color: "#64748B",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    position: "relative"
  },
  tabBtnActive: {
    backgroundColor: "#1E1B2E",
    color: "#A78BFA",
    boxShadow: "0 2px 8px rgba(167,139,250,0.15)"
  },
  badge: {
    backgroundColor: "#F97316",
    color: "#000",
    borderRadius: "50%",
    width: 16,
    height: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 9,
    fontWeight: 800,
    position: "absolute",
    top: 4,
    right: 4
  },
  tabContent: {
    flex: 1
  },
  // Prescriptions
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  presCard: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 20,
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  doctorLabel: {
    fontSize: 9,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: 700,
    margin: "2px 0 0 0",
    color: "#F8FAFC",
  },
  statusTag: {
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 6,
    padding: "3px 8px",
    textTransform: "uppercase",
  },
  dateTag: {
    fontSize: 10,
    color: "#475569",
    display: "flex",
    alignItems: "center",
    gap: 3,
  },
  divider: {
    height: 1,
    backgroundColor: "#1E2028",
  },
  dishSection: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  dishNameRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  dishName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#F8FAFC",
    margin: 0,
  },
  ingredientsList: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    paddingLeft: 4,
    backgroundColor: "#0D0D10",
    borderRadius: 10,
    padding: "10px 12px",
  },
  ingRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#94A3B8",
  },
  ingName: { fontWeight: 500 },
  ingGrams: { color: "#64748B" },
  macrosBadgeSection: {
    display: "flex",
    gap: 6,
    marginTop: 2,
  },
  orderBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",
    color: "#000",
    border: "none",
    borderRadius: 14,
    padding: "15px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 16px rgba(249,115,22,0.3)",
    letterSpacing: "0.01em"
  },
  // Plan tab
  planCard: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 20,
    padding: "20px",
  },
  planHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: 800,
    margin: "4px 0 0 0",
    color: "#F8FAFC",
  },
  planBadge: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(167,139,250,0.1)",
    border: "1px solid rgba(167,139,250,0.2)",
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 8,
    padding: "4px 10px",
  },
  planDates: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "0 0 14px 0",
    color: "#F8FAFC",
  },
  macroGoalGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  tipCard: {
    backgroundColor: "rgba(249,115,22,0.06)",
    border: "1px solid rgba(249,115,22,0.15)",
    borderRadius: 16,
    padding: "14px 16px",
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  tipText: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 1.6,
    margin: 0,
  },
  chatCta: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#A78BFA",
    color: "#000",
    border: "none",
    borderRadius: 12,
    padding: "12px 20px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
  },
  // Chat tab
  chatContainer: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    maxHeight: "calc(100vh - 300px)",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 14,
    padding: "12px 16px",
    marginBottom: 14,
    position: "relative",
  },
  nutriAvatarLarge: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    backgroundColor: "rgba(167,139,250,0.1)",
    border: "2px solid rgba(167,139,250,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chatHeaderName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#F8FAFC",
  },
  chatHeaderSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  onlineDotLarge: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    backgroundColor: "#34D399",
    position: "absolute",
    top: 12,
    right: 14,
    boxShadow: "0 0 0 2px #131316"
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "4px 0",
    minHeight: 200,
    maxHeight: "calc(100vh - 420px)",
  },
  chatEmpty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  msgWrapper: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    backgroundColor: "rgba(167,139,250,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  msgBubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  msgBubbleMine: {
    backgroundColor: "#A78BFA",
    borderBottomRightRadius: 4,
  },
  msgBubbleTheirs: {
    backgroundColor: "#1A1A20",
    border: "1px solid #2A2A35",
    borderBottomLeftRadius: 4,
  },
  msgSenderName: {
    fontSize: 10,
    color: "#A78BFA",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: 2,
  },
  msgText: {
    fontSize: 14,
    color: "#F8FAFC",
    margin: 0,
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  msgTime: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    alignSelf: "flex-end",
  },
  chatInputArea: {
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 16,
    padding: "10px 12px",
    marginTop: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    color: "#F8FAFC",
    fontSize: 14,
    resize: "none",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    lineHeight: 1.5,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    backgroundColor: "#A78BFA",
    color: "#000",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "opacity 0.2s",
  },
  // Empty state
  emptyContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "50px 20px",
    gap: 14,
    backgroundColor: "#131316",
    borderRadius: 20,
    border: "1px solid #222227",
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    color: "#F8FAFC",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 1.6,
    margin: 0,
  },
  // Toast
  toastOverlay: {
    position: "fixed",
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
  },
  toastCard: {
    backgroundColor: "#34D399",
    color: "#000",
    padding: "12px 24px",
    borderRadius: 14,
    fontSize: 13,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
  },
  toastIcon: { fontSize: 18 },
};

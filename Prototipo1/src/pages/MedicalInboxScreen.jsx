// src/pages/MedicalInboxScreen.jsx

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { 
  documentTextOutline, 
  fitnessOutline, 
  shieldCheckmarkOutline, 
  chevronForwardOutline, 
  cartOutline,
  checkmarkDoneOutline
} from "ionicons/icons";

export default function MedicalInboxScreen() {
  const { prescriptions, addToCart, redeemPrescription, userProfile } = useApp();
  const history = useHistory();
  const [successRedeem, setSuccessRedeem] = useState(false);

  // Filter only prescriptions that match this patient's email
  const patientPrescriptions = prescriptions.filter(
    (p) => p.patientEmail === userProfile?.email?.toLowerCase().trim()
  );

  const handleOrderPrescription = async (pres) => {
    // 1. Create a customized item structured for the cart
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

    // 2. Add to Cart
    addToCart(customizedItem);

    // 3. Mark as redeemed in database
    await redeemPrescription(pres.id);

    // 4. Show success & Go to cart
    setSuccessRedeem(true);
    setTimeout(() => {
      setSuccessRedeem(false);
      history.push("/cart");
    }, 1200);
  };

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <div style={styles.screen}>
          
          {/* Header */}
          <div style={styles.header}>
            <div>
              <span style={styles.eyebrow}>Planes Alimenticios</span>
              <h1 style={styles.title}>Buzón Médico</h1>
            </div>
            <div style={styles.clinicalBadge}>
              <IonIcon icon={shieldCheckmarkOutline} style={styles.shieldIcon} />
              <span>Protegido</span>
            </div>
          </div>

          {/* Success overlay */}
          {successRedeem && (
            <div style={styles.toastOverlay}>
              <div style={styles.toastCard}>
                <IonIcon icon={checkmarkDoneOutline} style={styles.toastIcon} />
                <span>Receta cargada en tu Carrito</span>
              </div>
            </div>
          )}

          <p style={styles.description}>
            Aquí aparecen las comidas de precisión gramadas y recetadas directamente por tu nutriólogo certificado.
          </p>

          {patientPrescriptions.length === 0 ? (
            <div style={styles.emptyContainer}>
              <div style={styles.emptyIcon}>🩺</div>
              <h2 style={styles.emptyTitle}>Sin recetas activas</h2>
              <p style={styles.emptySubtitle}>
                Comparte tu correo <strong>{userProfile?.email}</strong> con tu nutriólogo certificado de Nomi para recibir recetas personalizadas al gramo.
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
                      opacity: isOrdered ? 0.65 : 1,
                      borderLeft: isOrdered ? "4px solid #475569" : "4px solid #A78BFA"
                    }}
                  >
                    {/* Prescriber header */}
                    <div style={styles.cardHeader}>
                      <div>
                        <span style={styles.doctorLabel}>RECETADO POR</span>
                        <h3 style={styles.doctorName}>{pres.nutriologistName}</h3>
                      </div>
                      <span style={{
                        ...styles.statusTag,
                        backgroundColor: isOrdered ? "rgba(71, 85, 105, 0.15)" : "rgba(167, 139, 250, 0.15)",
                        color: isOrdered ? "#94A3B8" : "#A78BFA",
                        border: isOrdered ? "1px solid rgba(71,85,105,0.3)" : "1px solid rgba(167,139,250,0.3)"
                      }}>
                        {isOrdered ? "Ordenado" : "Recetado"}
                      </span>
                    </div>

                    <div style={styles.divider} />

                    {/* Dish Info */}
                    <div style={styles.dishSection}>
                      <h4 style={styles.dishName}>{pres.recipeName}</h4>
                      <div style={styles.ingredientsList}>
                        {pres.breakdown && pres.breakdown.map((ing) => (
                          <div key={ing.id} style={styles.ingRow}>
                            <span style={styles.ingName}>• {ing.name}</span>
                            <span style={styles.ingGrams}>{ing.grams}g</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Macros breakdown */}
                    <div style={styles.macrosBadgeSection}>
                      <div style={styles.macroPill}>
                        <span style={styles.macroVal}>{pres.macros.protein}g</span>
                        <span style={styles.macroLbl}>Prot</span>
                      </div>
                      <div style={styles.macroPill}>
                        <span style={styles.macroVal}>{pres.macros.carbs}g</span>
                        <span style={styles.macroLbl}>Carb</span>
                      </div>
                      <div style={styles.macroPill}>
                        <span style={styles.macroVal}>{pres.macros.fats}g</span>
                        <span style={styles.macroLbl}>Gras</span>
                      </div>
                      <div style={{ ...styles.macroPill, borderColor: "rgba(52, 211, 153, 0.2)" }}>
                        <span style={{ ...styles.macroVal, color: "#34D399" }}>{pres.macros.kcal}</span>
                        <span style={styles.macroLbl}>Kcal</span>
                      </div>
                    </div>

                    {/* Order Action */}
                    {!isOrdered && (
                      <button 
                        style={styles.orderBtn}
                        onClick={() => handleOrderPrescription(pres)}
                      >
                        <IonIcon icon={cartOutline} style={{ marginRight: 6 }} />
                        Comprar Receta · ${pres.totalPrice.toFixed(2)} MXN
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Spacing */}
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
    marginBottom: 16,
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
  clinicalBadge: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(167, 139, 250, 0.1)",
    border: "1px solid rgba(167, 139, 250, 0.2)",
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 8,
    padding: "4px 10px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  shieldIcon: {
    fontSize: 12,
  },
  description: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 1.5,
    margin: "0 0 24px 0",
  },
  emptyContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "60px 24px",
    gap: 16,
    backgroundColor: "#131316",
    borderRadius: 20,
    border: "1px solid #222227",
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 1.5,
    margin: 0,
    padding: "0 8px",
  },
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  presCard: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 20,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
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
    fontSize: 16,
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
  divider: {
    height: 1,
    backgroundColor: "#222227",
  },
  dishSection: {
    display: "flex",
    flexDirection: "column",
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
    gap: 4,
    paddingLeft: 4,
  },
  ingRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#94A3B8",
  },
  ingName: {
    fontWeight: 500,
  },
  ingGrams: {
    color: "#64748B",
  },
  macrosBadgeSection: {
    display: "flex",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 4,
  },
  macroPill: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#0B0B0C",
    border: "1px solid #1C1C24",
    borderRadius: 10,
    padding: "6px 2px",
  },
  macroVal: {
    fontSize: 12,
    fontWeight: 700,
    color: "#F97316",
  },
  macroLbl: {
    fontSize: 8,
    color: "#64748B",
    textTransform: "uppercase",
    marginTop: 2,
    fontWeight: 500
  },
  orderBtn: {
    width: "100%",
    backgroundColor: "#A78BFA",
    color: "#000000",
    border: "none",
    borderRadius: 12,
    padding: "14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    boxShadow: "0 4px 15px rgba(167, 139, 250, 0.2)",
  },
  toastOverlay: {
    position: "fixed",
    bottom: 90,
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
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
    animation: "fadeInUp 0.3s ease",
  },
  toastIcon: {
    fontSize: 18,
  }
};

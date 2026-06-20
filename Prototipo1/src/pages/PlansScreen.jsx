import React, { useState } from "react";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { calendarOutline, timeOutline, addOutline } from "ionicons/icons";

export default function PlansScreen() {
  const [plans, setPlans] = useState([]);

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <div style={styles.screen}>
          <h1 style={styles.title}>Mis Planes</h1>
          <p style={styles.subtitle}>Programa tus comidas para la semana y recibe tus bowls favoritos automáticamente.</p>

          <button style={styles.createBtn} onClick={() => alert("Próximamente: Creador de planes interactivo")}>
            <IonIcon icon={addOutline} style={{ fontSize: 20 }} />
            Crear Nuevo Plan
          </button>

          {plans.length === 0 ? (
            <div style={styles.emptyCard}>
              <IonIcon icon={calendarOutline} style={styles.emptyIcon} />
              <p>Aún no tienes planes programados.</p>
              <span style={styles.emptySub}>Programa comidas para la oficina o el gimnasio.</span>
            </div>
          ) : (
            <div style={styles.list}>
              {/* Future plan cards will go here */}
            </div>
          )}

          <div style={styles.promoCard}>
            <h3>¿Por qué crear un plan?</h3>
            <ul style={styles.promoList}>
              <li>🥗 Cumple tus macros semanales sin pensar.</li>
              <li>🛵 Ahorra en costos de envío.</li>
              <li>⏰ Entregas exactas en tu horario de comida.</li>
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
    padding: "24px 20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#F8FAFC",
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    margin: "0 0 24px 0",
    lineHeight: 1.4,
  },
  createBtn: {
    backgroundColor: "#F97316",
    color: "#000",
    border: "none",
    borderRadius: 12,
    padding: "16px",
    width: "100%",
    fontSize: 16,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
    cursor: "pointer",
  },
  emptyCard: {
    backgroundColor: "#131316",
    border: "1px dashed #222227",
    borderRadius: 16,
    padding: "32px 24px",
    textAlign: "center",
    color: "#64748B",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
    color: "#333336",
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 12,
    color: "#475569",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  promoCard: {
    marginTop: 32,
    backgroundColor: "rgba(249, 115, 22, 0.05)",
    border: "1px solid rgba(249, 115, 22, 0.2)",
    borderRadius: 16,
    padding: "20px",
  },
  promoList: {
    margin: "12px 0 0 0",
    paddingLeft: 20,
    fontSize: 14,
    lineHeight: 1.8,
    color: "#CBD5E1",
  }
};

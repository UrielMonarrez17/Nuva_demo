import React from "react";
import { useApp } from "../context/AppContext";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { timeOutline, checkmarkCircleOutline, restaurantOutline, bicycleOutline } from "ionicons/icons";

export default function OrdersScreen() {
  const { orders } = useApp();

  // Active orders are those that are not 'DELIVERED' or 'COMPLETED' (in our current logic we have PENDING and READY)
  const activeOrders = orders.filter(o => o.status === "PENDING" || o.status === "READY");
  const pastOrders = orders.filter(o => o.status !== "PENDING" && o.status !== "READY");

  const getStatusInfo = (status) => {
    switch (status) {
      case "PENDING":
        return { text: "Recibido en Cocina", icon: timeOutline, color: "#64748B", progress: 25 };
      case "PREPARING":
        return { text: "Preparando", icon: restaurantOutline, color: "#3B82F6", progress: 50 };
      case "READY":
        return { text: "En Camino", icon: bicycleOutline, color: "#F97316", progress: 75 };
      case "DELIVERED":
        return { text: "Entregado", icon: checkmarkCircleOutline, color: "#34D399", progress: 100 };
      default:
        return { text: "Procesando", icon: timeOutline, color: "#64748B", progress: 10 };
    }
  };

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <div style={styles.screen}>
          <h1 style={styles.title}>Mis Pedidos</h1>
          <p style={styles.subtitle}>Sigue el estado de tu comida en tiempo real.</p>

          <h2 style={styles.sectionTitle}>Pedidos en Curso</h2>
          {activeOrders.length === 0 ? (
            <div style={styles.emptyCard}>
              <p>No tienes pedidos activos en este momento.</p>
            </div>
          ) : (
            <div style={styles.list}>
              {activeOrders.map(order => {
                const info = getStatusInfo(order.status || "PENDING");
                return (
                  <div key={order.id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <span style={styles.restaurantName}>Pedido #{order.id.substring(0, 6)}</span>
                      <span style={{ ...styles.statusBadge, color: info.color, backgroundColor: info.color + "20" }}>
                        <IonIcon icon={info.icon} style={{ marginRight: 4 }} />
                        {info.text}
                      </span>
                    </div>

                    <div style={styles.progressBarBg}>
                      <div style={{ ...styles.progressBarFill, width: `${info.progress}%`, backgroundColor: info.color }} />
                    </div>

                    <div style={styles.itemsList}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={styles.itemRow}>
                          <span style={styles.itemQty}>{item.quantity || 1}x</span>
                          <span style={styles.itemName}>{item.recipeName}</span>
                        </div>
                      ))}
                    </div>

                    <div style={styles.cardFooter}>
                      <span style={styles.totalText}>Total: ${order.totalPrice?.toFixed(2)}</span>
                      <span style={styles.etaText}>Llegada estimada: 30-45 min</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <h2 style={{ ...styles.sectionTitle, marginTop: 32 }}>Historial</h2>
          {pastOrders.length === 0 ? (
            <div style={styles.emptyCard}>
              <p>Tu historial está vacío.</p>
            </div>
          ) : (
            <div style={styles.list}>
              {pastOrders.map(order => (
                <div key={order.id} style={{ ...styles.card, opacity: 0.7 }}>
                  <div style={styles.cardHeader}>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    <span style={styles.totalText}>${order.totalPrice?.toFixed(2)}</span>
                  </div>
                  <div style={styles.itemsList}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={styles.itemRow}>
                        <span style={styles.itemName}>{item.recipeName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 16,
    color: "#F8FAFC",
  },
  emptyCard: {
    backgroundColor: "#131316",
    border: "1px dashed #222227",
    borderRadius: 16,
    padding: "24px",
    textAlign: "center",
    color: "#64748B",
    fontSize: 14,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  card: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 16,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: 700,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 8px",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#222227",
    borderRadius: 3,
    overflow: "hidden",
    margin: "8px 0",
  },
  progressBarFill: {
    height: "100%",
    transition: "width 0.5s ease",
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  itemRow: {
    display: "flex",
    gap: 8,
    fontSize: 14,
    color: "#CBD5E1",
  },
  itemQty: {
    fontWeight: 700,
    color: "#F97316",
  },
  itemName: {},
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #222227",
    paddingTop: 12,
    marginTop: 4,
  },
  totalText: {
    fontSize: 14,
    fontWeight: 700,
  },
  etaText: {
    fontSize: 12,
    color: "#94A3B8",
  }
};

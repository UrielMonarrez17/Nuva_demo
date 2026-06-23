// src/kds/KitchenDashboard.jsx

import { useState, useEffect } from "react";
import { useKitchenOrders } from "./hooks/useKitchenOrders";
import { db } from "../firebase/firebaseconfig";
import { collection, onSnapshot } from "firebase/firestore";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Devuelve cuántos minutos han pasado desde que llegó la orden.
 */
function getElapsedMinutes(createdAt) {
  if (!createdAt) return 0;
  const diff = Date.now() - createdAt.getTime();
  return Math.floor(diff / 60000);
}

/**
 * Devuelve el color de urgencia según los minutos transcurridos.
 */
function getUrgencyColor(minutes) {
  if (minutes >= 15) return "#EF4444"; // rojo: urgente
  if (minutes >= 8) return "#F59E0B";  // amarillo: advertencia
  return "#34D399";                     // verde: a tiempo
}

/**
 * Formatea una fecha a hora legible HH:MM
 */
function formatTime(date) {
  if (!date) return "--:--";
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ─── SUBCOMPONENTES ───────────────────────────────────────────────────────────

function KDSHeader({ pendingCount, readyCount, currentTime, selectedRestaurant, onSelectRestaurant, allowSwitch = true }) {
  const MOCK_RESTAURANTS = [
    { id: "all", name: "Todas las cocinas" },
    { id: "rest_nativa", name: "Nativa Dark Kitchen" },
    { id: "rest_green", name: "Green Lab Co." }
  ];

  return (
    <div style={styles.header}>
      <div style={styles.headerLeft}>
        <span style={styles.headerLogo}>NOMI</span>
        <span style={styles.headerSubtitle}>Kitchen Display System</span>
      </div>
      <div style={styles.headerCenter}>
        {allowSwitch ? (
          <select 
            style={styles.restaurantSelect}
            value={selectedRestaurant}
            onChange={(e) => onSelectRestaurant(e.target.value)}
          >
            {MOCK_RESTAURANTS.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        ) : (
          <span style={styles.restaurantTextLabel}>
            📍 {MOCK_RESTAURANTS.find(r => r.id === selectedRestaurant)?.name || selectedRestaurant}
          </span>
        )}
        <span style={{...styles.headerTime, marginLeft: 20}}>{currentTime}</span>
      </div>
      <div style={styles.headerRight}>
        <div style={styles.statBadge}>
          <span style={{ ...styles.statNumber, color: "#F97316" }}>
            {pendingCount}
          </span>
          <span style={styles.statLabel}>Pendientes</span>
        </div>
        <div style={styles.statBadge}>
          <span style={{ ...styles.statNumber, color: "#34D399" }}>
            {readyCount}
          </span>
          <span style={styles.statLabel}>Listas</span>
        </div>
      </div>
    </div>
  );
}

function IngredientRow({ ingredient, dbIngredients = [] }) {
  const getReadableFraction = (val, unitName) => {
    if (val <= 0) return "";
    
    const integerPart = Math.floor(val);
    const f = val - integerPart;
    let fraction = "";
    let extraInt = 0;
    
    if (f < 0.125) {
      fraction = "";
    } else if (f < 0.291) {
      fraction = "1/4";
    } else if (f < 0.416) {
      fraction = "1/3";
    } else if (f < 0.583) {
      fraction = "1/2";
    } else if (f < 0.708) {
      fraction = "2/3";
    } else if (f < 0.875) {
      fraction = "3/4";
    } else {
      extraInt = 1;
    }
    
    const totalInt = integerPart + extraInt;
    
    // Determine singular/plural for unit name
    let unit = unitName;
    if (unitName === "porción") {
      if (totalInt === 1 && !fraction) {
        unit = "porción";
      } else {
        unit = "porciones";
      }
    }
    
    let result = "";
    if (totalInt > 0 && fraction) {
      result = `${totalInt} y ${fraction}`;
    } else if (totalInt > 0) {
      result = `${totalInt}`;
    } else if (fraction) {
      result = fraction;
    }
    
    if (!result) {
      // If it rounded to 0 (e.g. less than 1/8 portion), display as decimal
      const dec = Math.round(val * 10) / 10;
      if (dec <= 0) return "";
      return `${dec} ${dec === 1 ? unitName : unitName + "es"}`;
    }
    
    return `${result} ${unit}`;
  };

  // Find live ingredient in dbIngredients to get defaultGrams
  const dbIng = dbIngredients.find(
    (i) =>
      i.id === ingredient.id ||
      i.id === ingredient.masterIngredientId ||
      i.name?.toLowerCase().trim() === ingredient.name?.toLowerCase().trim()
  );

  // Portion base weight: live defaultGrams, or live averageWeightPerUnit, or ingredient-defined defaultGrams, or fallback to 100g
  const baseWeight = dbIng?.defaultGrams || dbIng?.averageWeightPerUnit || ingredient.defaultGrams || ingredient.averageWeightPerUnit || 100;
  const unitName = dbIng?.unitName || ingredient.unitName || "porción";
  
  const portions = ingredient.grams / baseWeight;
  const portionsText = getReadableFraction(portions, unitName);

  return (
    <div style={styles.ingredientRow}>
      <span style={styles.ingredientText}>
        {ingredient.name} - {portionsText || `${portions.toFixed(1)} ${unitName}`} ({ingredient.grams}g)
      </span>
    </div>
  );
}

function PendingOrderCard({ order, onMarkReady, dbIngredients }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [elapsed, setElapsed] = useState(getElapsedMinutes(order.createdAt));
  const urgencyColor = getUrgencyColor(elapsed);

  // Actualizar el contador de minutos cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(getElapsedMinutes(order.createdAt));
    }, 30000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const handleMarkReady = async () => {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      await onMarkReady(order.id);
    } catch (err) {
      setUpdateError("Error al actualizar. Intenta de nuevo.");
      setIsUpdating(false);
    }
  };

  return (
    <div
      style={{
        ...styles.orderCard,
        borderTop: `4px solid ${urgencyColor}`,
      }}
    >
      {/* ── Encabezado de la tarjeta ── */}
      <div style={styles.cardHeader}>
        <div style={styles.cardHeaderLeft}>
          <span style={styles.orderIdLabel}>
            #{order.id.slice(-6).toUpperCase()}
          </span>
          <span style={styles.orderTime}>
            Recibido {formatTime(order.createdAt)}
          </span>
        </div>
        <div
          style={{
            ...styles.elapsedBadge,
            backgroundColor: urgencyColor + "22",
            border: `1px solid ${urgencyColor}44`,
          }}
        >
          <span style={{ color: urgencyColor, fontSize: 18, fontWeight: 700 }}>
            {elapsed}
          </span>
          <span style={{ color: urgencyColor, fontSize: 11 }}>min</span>
        </div>
      </div>
      
      {order.address && (
        <div style={styles.addressSection}>
          📍 <strong>Entrega:</strong> {order.address}
        </div>
      )}

      {/* ── Nombre del platillo ── */}
      {order.items?.map((item, itemIndex) => (
        <div key={itemIndex} style={styles.itemSection}>
          <div style={styles.itemHeader}>
            <span style={styles.itemName}>{item.recipeName}</span>
            <span style={styles.itemMacros}>
              {order.totalMacros?.protein}g P ·{" "}
              {order.totalMacros?.carbs}g C ·{" "}
              {order.totalMacros?.fats}g G
            </span>
          </div>

          {/* ── Ingredientes con gramos exactos ── */}
          <div style={styles.ingredientsList}>
            {item.customizedIngredients?.map((ingredient, ingIndex) => (
              <IngredientRow key={ingIndex} ingredient={ingredient} dbIngredients={dbIngredients} />
            ))}
            {item.selectedOptions && item.selectedOptions.length > 0 && (
              <div style={{ borderTop: "1px solid #1C1C1C", paddingTop: 8, marginTop: 8 }}>
                <span style={{ color: "#F97316", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                  Adicionales:
                </span>
                {item.selectedOptions.map((opt, optIndex) => (
                  <div key={optIndex} style={{ fontSize: 13, color: "#34D399", marginTop: 4 }}>
                    + {opt.name} ({opt.type === 'substitute' ? 'Sustituto' : 'Extra'})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* ── Error de actualización ── */}
      {updateError && (
        <div style={styles.cardError}>
          <span>⚠️ {updateError}</span>
        </div>
      )}

      {/* ── Botón LISTO ── */}
      <button
        style={{
          ...styles.readyButton,
          opacity: isUpdating ? 0.5 : 1,
          cursor: isUpdating ? "not-allowed" : "pointer",
        }}
        onClick={handleMarkReady}
        disabled={isUpdating}
      >
        {isUpdating ? "Actualizando..." : "✓  Marcar como LISTO"}
      </button>
    </div>
  );
}

function ReadyOrderCard({ order }) {
  return (
    <div style={styles.readyCard}>
      <div style={styles.readyCardLeft}>
        <span style={styles.readyCheckmark}>✓</span>
        <div style={styles.readyCardInfo}>
          <span style={styles.readyOrderId}>
            #{order.id.slice(-6).toUpperCase()}
          </span>
          <span style={styles.readyOrderDetail}>
            {order.items?.[0]?.recipeName ?? "Platillo"}
          </span>
        </div>
      </div>
      <div style={styles.readyCardRight}>
        <span style={styles.readyTime}>
          Listo {formatTime(order.readyAt)}
        </span>
        <span style={styles.readyPrice}>${order.totalPrice?.toFixed(2)}</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={styles.emptyState}>
      <span style={styles.emptyIcon}>🍽️</span>
      <span style={styles.emptyTitle}>Sin órdenes pendientes</span>
      <span style={styles.emptySubtitle}>
        Las nuevas órdenes aparecerán aquí automáticamente
      </span>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={styles.fullScreenCenter}>
      <div style={styles.kdsSpinner} />
      <p style={styles.kdsLoadingText}>Conectando con Firestore...</p>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div style={styles.fullScreenCenter}>
      <span style={{ fontSize: 48 }}>⚠️</span>
      <p style={{ color: "#EF4444", fontSize: 18, textAlign: "center" }}>
        {message}
      </p>
    </div>
  );
}

// ─── PANTALLA PRINCIPAL KDS ───────────────────────────────────────────────────

export default function KitchenDashboard({ selectedRestaurant = "all", onSelectRestaurant, allowSwitch = true }) {
  const { pendingOrders, readyOrders, loading, error, markAsReady } =
    useKitchenOrders(selectedRestaurant);

  const [dbIngredients, setDbIngredients] = useState([]);

  // Escuchar en tiempo real los ingredientes para conocer los defaultGrams de cada uno
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "ingredients"), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDbIngredients(list);
      }
    }, err => console.warn("Error loading ingredients inside KDS:", err));
    
    return () => unsubscribe();
  }, []);

  // Reloj en tiempo real para el header
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  );

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <div style={styles.dashboard}>
      {/* ── Header global ── */}
      <KDSHeader
        pendingCount={pendingOrders.length}
        readyCount={readyOrders.length}
        currentTime={currentTime}
        selectedRestaurant={selectedRestaurant}
        onSelectRestaurant={onSelectRestaurant || (() => {})}
        allowSwitch={allowSwitch}
      />

      {/* ── Layout de dos columnas ── */}
      <div style={styles.columnsLayout}>

        {/* ── Columna izquierda: PENDIENTES ── */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>
            <div style={styles.columnTitleRow}>
              <div style={{ ...styles.columnDot, backgroundColor: "#F97316" }} />
              <span style={styles.columnTitle}>PENDIENTES</span>
            </div>
            <span style={styles.columnCount}>{pendingOrders.length}</span>
          </div>

          <div style={styles.columnScroll}>
            {pendingOrders.length === 0 ? (
              <EmptyState />
            ) : (
              pendingOrders.map((order) => (
                <PendingOrderCard
                  key={order.id}
                  order={order}
                  onMarkReady={markAsReady}
                  dbIngredients={dbIngredients}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Columna derecha: LISTAS ── */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>
            <div style={styles.columnTitleRow}>
              <div style={{ ...styles.columnDot, backgroundColor: "#34D399" }} />
              <span style={styles.columnTitle}>LISTAS</span>
            </div>
            <span style={styles.columnCount}>{readyOrders.length}</span>
          </div>

          <div style={styles.columnScroll}>
            {readyOrders.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>✓</span>
                <span style={styles.emptyTitle}>Sin órdenes listas aún</span>
                <span style={styles.emptySubtitle}>
                  Las órdenes completadas aparecerán aquí
                </span>
              </div>
            ) : (
              readyOrders.map((order) => (
                <ReadyOrderCard key={order.id} order={order} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SISTEMA DE ESTILOS ───────────────────────────────────────────────────────

const styles = {
  dashboard: {
    backgroundColor: "#0A0A0A",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#F5F5F0",
    overflow: "hidden",
  },
  fullScreenCenter: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#0A0A0A",
    gap: 16,
  },
  kdsSpinner: {
    width: 48,
    height: 48,
    border: "3px solid #1C1C1C",
    borderTop: "3px solid #F97316",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  kdsLoadingText: {
    color: "#6B6B6B",
    fontSize: 16,
    letterSpacing: "0.05em",
  },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    height: 64,
    backgroundColor: "#111111",
    borderBottom: "1px solid #1C1C1C",
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: 700,
    color: "#F97316",
    letterSpacing: "0.1em",
  },
  headerSubtitle: {
    fontSize: 10,
    color: "#4A4A4A",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  headerCenter: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center"
  },
  restaurantSelect: {
    backgroundColor: "#1C1C1C",
    color: "#F97316",
    border: "1px solid #333",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    outline: "none",
    cursor: "pointer"
  },
  restaurantTextLabel: {
    color: "#F97316",
    fontSize: "16px",
    fontWeight: "700",
    letterSpacing: "0.02em",
  },
  headerTime: {
    fontSize: 28,
    fontWeight: 300,
    color: "#F5F5F0",
    letterSpacing: "0.05em",
    fontVariantNumeric: "tabular-nums",
  },
  headerRight: {
    display: "flex",
    gap: 16,
  },
  statBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#1C1C1C",
    borderRadius: 10,
    padding: "6px 16px",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 9,
    color: "#4A4A4A",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginTop: 2,
  },

  // Layout columnas
  columnsLayout: {
    display: "flex",
    flex: 1,
    gap: 0,
    overflow: "hidden",
  },
  column: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #1C1C1C",
    overflow: "hidden",
  },
  columnHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderBottom: "1px solid #1C1C1C",
    flexShrink: 0,
  },
  columnTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  columnDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
  },
  columnTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.15em",
    color: "#6B6B6B",
  },
  columnCount: {
    fontSize: 13,
    fontWeight: 700,
    color: "#F5F5F0",
    backgroundColor: "#1C1C1C",
    padding: "2px 10px",
    borderRadius: 20,
  },
  columnScroll: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  // Tarjeta PENDING
  orderCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: "20px",
    border: "1px solid #2A2A2A",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    flexShrink: 0,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardHeaderLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  orderIdLabel: {
    fontSize: 18,
    fontWeight: 700,
    color: "#F5F5F0",
    letterSpacing: "0.05em",
  },
  orderTime: {
    fontSize: 11,
    color: "#4A4A4A",
  },
  elapsedBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderRadius: 10,
    padding: "8px 14px",
    minWidth: 56,
  },
  addressSection: {
    backgroundColor: "rgba(249, 115, 22, 0.05)",
    border: "1px solid rgba(249, 115, 22, 0.2)",
    color: "#D4D4D8",
    fontSize: 13,
    padding: "8px 12px",
    borderRadius: 8,
    marginTop: -4,
  },

  // Item de la orden
  itemSection: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  itemHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 600,
    color: "#F5F5F0",
  },
  itemMacros: {
    fontSize: 11,
    color: "#4A4A4A",
  },

  // Ingredientes
  ingredientsList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    backgroundColor: "#0F0F0F",
    borderRadius: 12,
    padding: "12px",
  },
  ingredientRow: {
    display: "flex",
    alignItems: "center",
    padding: "4px 0",
  },
  ingredientText: {
    fontSize: "14px",
    color: "#F5F5F0",
    fontWeight: 500,
  },
  ingredientInfo: {
    width: 80,
    flexShrink: 0,
  },
  ingredientName: {
    fontSize: 13,
    color: "#A0A0A0",
    fontWeight: 500,
  },
  ingredientGrams: {
    display: "flex",
    alignItems: "baseline",
    gap: 2,
    width: 64,
    flexShrink: 0,
  },
  gramsNumber: {
    fontSize: 20,
    fontWeight: 700,
    color: "#F97316",
    fontVariantNumeric: "tabular-nums",
  },
  gramsLabel: {
    fontSize: 11,
    color: "#6B6B6B",
  },
  ingredientBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "#1C1C1C",
    borderRadius: 2,
    overflow: "hidden",
  },
  ingredientBarFill: {
    height: "100%",
    backgroundColor: "#F97316",
    borderRadius: 2,
    opacity: 0.6,
  },

  // Botón LISTO
  readyButton: {
    width: "100%",
    backgroundColor: "#34D399",
    color: "#0A0A0A",
    border: "none",
    borderRadius: 12,
    padding: "14px",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.02em",
    transition: "opacity 0.2s ease",
  },
  cardError: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 12,
    color: "#EF4444",
  },

  // Tarjeta READY
  readyCard: {
    backgroundColor: "#141414",
    borderRadius: 12,
    padding: "14px 16px",
    border: "1px solid #1C1C1C",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    opacity: 0.7,
  },
  readyCardLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  readyCheckmark: {
    fontSize: 18,
    color: "#34D399",
  },
  readyCardInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  readyOrderId: {
    fontSize: 14,
    fontWeight: 600,
    color: "#F5F5F0",
  },
  readyOrderDetail: {
    fontSize: 11,
    color: "#4A4A4A",
  },
  readyCardRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
  },
  readyTime: {
    fontSize: 11,
    color: "#4A4A4A",
  },
  readyPrice: {
    fontSize: 14,
    fontWeight: 600,
    color: "#34D399",
  },

  // Empty state
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 24px",
    gap: 8,
    flex: 1,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: 16,
    color: "#4A4A4A",
    fontWeight: 600,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#2A2A2A",
    textAlign: "center",
    lineHeight: 1.5,
  },
};
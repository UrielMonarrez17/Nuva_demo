// src/pages/CartScreen.jsx
import React, { useState, lazy, Suspense } from "react";
import { useApp } from "../context/AppContext";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent, IonIcon, IonSpinner } from "@ionic/react";
import {
  trashOutline,
  locationOutline,
  timeOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  addOutline,
  arrowBackOutline,
} from "ionicons/icons";

// Lazy-load the map so it only runs when the modal opens
const MapPicker = lazy(() => import("../components/MapPicker"));

export default function CartScreen() {
  const { cart, removeFromCart, placeOrder, addresses, selectAddress, addAddress, recipes, restaurants } = useApp();
  const history = useHistory();

  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [successOrderInfo, setSuccessOrderInfo] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newStreet, setNewStreet] = useState("");
  const [newColonia, setNewColonia] = useState("");
  const [newCity, setNewCity] = useState("CDMX");

  const handleMapConfirm = (location) => {
    addAddress(`Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)} · ${location.address}`, "Seleccionado en mapa", "CDMX");
    setShowAddressModal(false);
  };

  const activeAddress = (addresses || []).find(a => a.active) || (addresses || [])[0];

  const subtotal = (cart || []).reduce((acc, item) => acc + (item?.finalPrice || 0), 0);
  const shipping = subtotal > 0 ? 35 : 0;
  const total = subtotal + shipping;

  const totalProtein = (cart || []).reduce((acc, item) => acc + (item?.macros?.protein || 0), 0);
  const totalCarbs = (cart || []).reduce((acc, item) => acc + (item?.macros?.carbs || 0), 0);
  const totalFats = (cart || []).reduce((acc, item) => acc + (item?.macros?.fats || 0), 0);
  const totalKcal = (cart || []).reduce((acc, item) => acc + (item?.macros?.kcal || 0), 0);

  const getCoordinates = (street) => {
    if (!street) return null;
    const match = street.match(/Lat:\s*([-\d.]+),\s*Lng:\s*([-\d.]+)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    return null;
  };

  const calculateDistance = (userCoords, restCoords) => {
    if (!userCoords || !restCoords) return 3.2;
    const R = 6371;
    const dLat = (restCoords.lat - userCoords.lat) * Math.PI / 180;
    const dLng = (restCoords.lng - userCoords.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userCoords.lat * Math.PI / 180) * Math.cos(restCoords.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
  };

  const firstCartItem = cart?.[0];
  const cartRecipe = firstCartItem ? (recipes || []).find(r => r.id === firstCartItem.recipeId) : null;
  const cartRestaurant = cartRecipe ? (restaurants || []).find(r => r.id === cartRecipe.restaurantId) : null;
  const restCoords = cartRestaurant ? { lat: cartRestaurant.lat, lng: cartRestaurant.lng } : { lat: 19.414, lng: -99.171 };
  const userCoords = activeAddress ? getCoordinates(activeAddress.street) : null;
  const distance = activeAddress ? calculateDistance(userCoords, restCoords) : 3.2;
  const estTime = Math.max(15, Math.round(15 + distance * 3.5));

  const handleCheckout = async () => {
    if (!cart?.length) return;
    setLoadingCheckout(true);
    const addressStr = activeAddress
      ? `${activeAddress.street}, ${activeAddress.neighborhood}, ${activeAddress.city}`
      : "Dirección no especificada";
    const methodLabel =
      paymentMethod === "card" ? "Tarjeta de Crédito (Simulado)" :
        paymentMethod === "cash" ? "Efectivo al recibir" : "Express Pay (Simulado)";
    setTimeout(async () => {
      try {
        const res = await placeOrder(addressStr, methodLabel, distance, estTime);
        if (res?.success) setSuccessOrderInfo(res.orderId);
      } catch (e) {
        console.error("Checkout error:", e);
      } finally {
        setLoadingCheckout(false);
      }
    }, 1500);
  };

  const handleAddNewAddress = (e) => {
    e.preventDefault();
    if (!newStreet || !newColonia) return;
    addAddress(newStreet, newColonia, newCity);
    setNewStreet("");
    setNewColonia("");
    setShowAddressModal(false);
  };

  const cartIsEmpty = !cart || cart.length === 0;

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <div style={styles.screen}>

          {/* Header */}
          <div style={styles.header}>
            <button style={styles.backBtn} onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 22 }} />
            </button>
            <h1 style={styles.title}>Mi Orden</h1>
            <span style={styles.badge}>{cart?.length || 0} items</span>
          </div>

          {/* Success overlay */}
          {successOrderInfo && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalCard}>
                <div style={styles.modalSuccessIcon}>🎉</div>
                <h2 style={styles.modalTitle}>¡Pedido Confirmado!</h2>
                <p style={styles.modalSubtitle}>Tu comida de precisión ha sido enviada a cocina.</p>
                <div style={styles.orderIdCard}>
                  <span style={styles.orderIdLabel}>ID DE PEDIDO</span>
                  <span style={styles.orderIdValue}>#{String(successOrderInfo).slice(-8).toUpperCase()}</span>
                </div>
                <div style={styles.timeEstCard}>
                  <IonIcon icon={timeOutline} style={styles.estIcon} />
                  <span>Entrega estimada: <strong>25–35 mins</strong></span>
                </div>
                <button
                  style={styles.modalBtn}
                  onClick={() => { setSuccessOrderInfo(null); history.push("/home"); }}
                >
                  Entendido
                </button>
              </div>
            </div>
          )}

          {cartIsEmpty ? (
            <div style={styles.emptyContainer}>
              <div style={styles.emptyIcon}>🌯</div>
              <h2 style={styles.emptyTitle}>Tu carrito está vacío</h2>
              <p style={styles.emptySubtitle}>
                Explora nuestro menú y arma tu comida perfecta al gramo.
              </p>
              <button style={styles.exploreBtn} onClick={() => history.push("/home")}>
                Ir al Menú
              </button>
            </div>
          ) : (
            <>
              {/* Cart items */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Platillos Personalizados</h2>
                <div style={styles.itemsList}>
                  {cart.map((item, index) => (
                    <div key={index} style={styles.cartCard}>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.recipeName || "Platillo"}
                          style={styles.cardImg}
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      )}
                      <div style={styles.cardDetails}>
                        <div style={styles.cardHeaderRow}>
                          <h3 style={styles.recipeName}>{item.recipeName || "Platillo personalizado"}</h3>
                          <button style={styles.deleteBtn} onClick={() => removeFromCart(index)}>
                            <IonIcon icon={trashOutline} />
                          </button>
                        </div>

                        {/* Ingredient breakdown */}
                        {Array.isArray(item.breakdown) && item.breakdown.length > 0 && (
                          <div style={styles.ingredientsSummary}>
                            {item.breakdown.map((ing, idx) => (
                              <span key={ing.id || idx} style={styles.ingPill}>
                                {ing.name}: <strong>{ing.grams}g</strong>
                              </span>
                            ))}
                          </div>
                        )}

                        <div style={styles.cardFooterRow}>
                          <div style={styles.macroPillMini}>
                            🔥 {Math.round(item.macros?.kcal || 0)} kcal · 🥩 {(item.macros?.protein || 0).toFixed(0)}g prot
                          </div>
                          <span style={styles.priceTag}>${(item.finalPrice || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nutrition totals */}
              <div style={styles.totalMacrosCard}>
                <h3 style={styles.macrosTitle}>Balance Nutripedido</h3>
                <div style={styles.macrosGrid}>
                  <div style={styles.macroColumn}>
                    <span style={styles.macroVal}>{totalProtein.toFixed(1)}g</span>
                    <span style={styles.macroLbl}>Proteína</span>
                  </div>
                  <div style={styles.macroColumn}>
                    <span style={styles.macroVal}>{totalCarbs.toFixed(1)}g</span>
                    <span style={styles.macroLbl}>Carbos</span>
                  </div>
                  <div style={styles.macroColumn}>
                    <span style={styles.macroVal}>{totalFats.toFixed(1)}g</span>
                    <span style={styles.macroLbl}>Grasas</span>
                  </div>
                  <div style={styles.macroColumn}>
                    <span style={{ ...styles.macroVal, color: "#34D399" }}>{Math.round(totalKcal)}</span>
                    <span style={styles.macroLbl}>Kcal</span>
                  </div>
                </div>
              </div>

              {/* Delivery address */}
              <div style={styles.addressCard} onClick={() => setShowAddressModal(true)}>
                <div style={styles.addressLeft}>
                  <IonIcon icon={locationOutline} style={styles.locIcon} />
                  <div>
                    <h4 style={styles.addressTitle}>Entregar en</h4>
                    <p style={styles.addressText}>
                      {activeAddress
                        ? `${activeAddress.street}, ${activeAddress.neighborhood}`
                        : "Toca para seleccionar dirección"}
                    </p>
                  </div>
                </div>
                <IonIcon icon={chevronForwardOutline} style={styles.arrowIcon} />
              </div>

              {activeAddress && (
                <div style={styles.deliveryDetailCard}>
                  <IonIcon icon={timeOutline} style={styles.deliveryDetailIcon} />
                  <div>
                    <span style={styles.deliveryDetailTitle}>Envío Inteligente Nomi</span>
                    <span style={styles.deliveryDetailText}>
                      Distancia: <strong>{distance} km</strong> · Llegada: <strong>{estTime} min</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Payment */}
              <div style={styles.paymentCard}>
                <h3 style={styles.paymentTitle}>Método de Pago</h3>
                <div style={styles.paymentOptions}>
                  {[
                    { key: "card", label: "💳 Tarjeta" },
                    { key: "cash", label: "💵 Efectivo" },
                    { key: "applepay", label: "📱 Express Pay" },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setPaymentMethod(opt.key)}
                      style={{
                        ...styles.paymentOptBtn,
                        ...(paymentMethod === opt.key ? styles.paymentOptActive : {}),
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div style={styles.paymentInfoText}>
                  {paymentMethod === "card" && "Se simulará un cobro seguro cifrado por Stripe."}
                  {paymentMethod === "cash" && "Paga en efectivo al repartidor al recibir tu pedido."}
                  {paymentMethod === "applepay" && "Se simulará un pago express con tu billetera digital."}
                </div>
              </div>

              {/* Price summary */}
              <div style={styles.summaryCard}>
                <h3 style={styles.summaryTitle}>Resumen del pedido</h3>
                <div style={styles.priceRow}>
                  <span>Subtotal comida</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div style={styles.priceRow}>
                  <span>Envío Dark Kitchen</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div style={styles.divider} />
                <div style={styles.totalRow}>
                  <span>Total final</span>
                  <span style={styles.totalPrice}>${total.toFixed(2)} MXN</span>
                </div>
              </div>

              {/* CTA */}
              <div style={styles.ctaContainer}>
                <button
                  style={{ ...styles.checkoutBtn, opacity: loadingCheckout ? 0.7 : 1 }}
                  onClick={handleCheckout}
                  disabled={loadingCheckout}
                >
                  {loadingCheckout
                    ? <IonSpinner name="crescent" color="dark" style={{ height: 20 }} />
                    : `Confirmar Pedido · $${total.toFixed(2)}`}
                </button>
                <div style={styles.safetyDisclaimer}>
                  🔒 Pago 100% seguro encriptado procesado por Nomi Pay
                </div>
              </div>
            </>
          )}

          {/* Address modal — MapPicker lazy-loaded ONLY when modal is open */}
          {showAddressModal && (
            <div style={styles.modalOverlay}>
              <div style={{ ...styles.modalCard, maxWidth: 500, width: "92%", maxHeight: "88vh" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <h3 style={styles.modalTitle}>Dirección de Envío</h3>
                  <button style={styles.closeBtnX} onClick={() => setShowAddressModal(false)}>✕</button>
                </div>
                <p style={styles.modalSubtitle}>Toca el mapa para confirmar tu ubicación.</p>

                <Suspense fallback={
                  <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IonSpinner name="crescent" />
                  </div>
                }>
                  <div style={{ marginBottom: 16 }}>
                    <MapPicker onConfirm={handleMapConfirm} />
                  </div>
                </Suspense>

                {/* Saved addresses list */}
                {(addresses || []).length > 0 && (
                  <div style={styles.addressListContainer}>
                    {(addresses || []).map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => { selectAddress(addr.id); setShowAddressModal(false); }}
                        style={{
                          ...styles.addressListItem,
                          borderColor: addr.active ? "#F97316" : "#222227",
                          backgroundColor: addr.active ? "rgba(249,115,22,0.05)" : "#0B0B0C",
                        }}
                      >
                        <div style={styles.listItemLeft}>
                          <IonIcon icon={locationOutline} style={{ color: addr.active ? "#F97316" : "#64748B", fontSize: 18 }} />
                          <div>
                            <p style={styles.listStreet}>{addr.street}</p>
                            <p style={styles.listSub}>{addr.neighborhood}, {addr.city}</p>
                          </div>
                        </div>
                        {addr.active && <IonIcon icon={checkmarkCircleOutline} style={{ color: "#F97316" }} />}
                      </div>
                    ))}
                  </div>
                )}

                <div style={styles.divider} />

                <form onSubmit={handleAddNewAddress} style={styles.addAddressForm}>
                  <h4 style={styles.addAddressFormTitle}>Nueva Dirección Manual</h4>
                  <input
                    type="text"
                    placeholder="Calle y Número"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    style={styles.formInput}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Colonia"
                    value={newColonia}
                    onChange={(e) => setNewColonia(e.target.value)}
                    style={styles.formInput}
                    required
                  />
                  <button type="submit" style={styles.addAddrBtn}>
                    <IonIcon icon={addOutline} style={{ marginRight: 4 }} />
                    Agregar y Seleccionar
                  </button>
                </form>

                <button style={styles.modalSecondaryButton} onClick={() => setShowAddressModal(false)}>
                  Cerrar
                </button>
                <div style={{ height: 24 }} />
              </div>
            </div>
          )}

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
    padding: "20px 20px 0",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#F8FAFC",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 12,
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#F8FAFC",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    margin: 0,
    flex: 1,
    textAlign: "center",
  },
  badge: {
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    border: "1px solid rgba(249, 115, 22, 0.3)",
    color: "#F97316",
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 8,
    padding: "4px 8px",
    textTransform: "uppercase",
  },
  emptyContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "60px 24px",
    gap: 16,
  },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: 700, margin: 0 },
  emptySubtitle: { fontSize: 13, color: "#94A3B8", lineHeight: 1.5, margin: 0 },
  exploreBtn: {
    backgroundColor: "#F97316",
    color: "#000",
    border: "none",
    borderRadius: 14,
    padding: "14px 32px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 16px 0",
  },
  itemsList: { display: "flex", flexDirection: "column", gap: 16 },
  cartCard: {
    display: "flex",
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 20,
    overflow: "hidden",
  },
  cardImg: { width: 90, height: 110, objectFit: "cover", backgroundColor: "#222227" },
  cardDetails: {
    flex: 1,
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  cardHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  recipeName: { fontSize: 15, fontWeight: 700, margin: 0 },
  deleteBtn: { background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: 2, fontSize: 16 },
  ingredientsSummary: { display: "flex", flexWrap: "wrap", gap: 4, margin: "8px 0" },
  ingPill: {
    fontSize: 9,
    backgroundColor: "#0B0B0C",
    border: "1px solid #1C1C24",
    color: "#94A3B8",
    padding: "2px 6px",
    borderRadius: 5,
  },
  cardFooterRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  macroPillMini: { fontSize: 10, color: "#64748B" },
  priceTag: { fontSize: 14, fontWeight: 700, color: "#F97316" },
  totalMacrosCard: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 20,
    padding: "16px 20px",
    marginBottom: 20,
  },
  macrosTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 12px 0",
    textAlign: "center",
  },
  macrosGrid: { display: "flex", justifyContent: "space-between" },
  macroColumn: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1 },
  macroVal: { fontSize: 16, fontWeight: 700, color: "#F97316" },
  macroLbl: { fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 },
  addressCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 16,
    padding: "16px",
    marginBottom: 16,
    cursor: "pointer",
  },
  addressLeft: { display: "flex", alignItems: "center", gap: 12 },
  locIcon: { color: "#F97316", fontSize: 20 },
  addressTitle: { fontSize: 13, fontWeight: 700, margin: 0, color: "#F8FAFC" },
  addressText: { fontSize: 11, color: "#94A3B8", margin: "2px 0 0 0" },
  arrowIcon: { color: "#64748B", fontSize: 16 },
  deliveryDetailCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(52,211,153,0.05)",
    border: "1px solid rgba(52,211,153,0.2)",
    borderRadius: 16,
    padding: "14px",
    marginBottom: 20,
  },
  deliveryDetailIcon: { color: "#34D399", fontSize: 22 },
  deliveryDetailTitle: { fontSize: 11, fontWeight: 700, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.04em", display: "block" },
  deliveryDetailText: { fontSize: 12, color: "#CBD5E1", marginTop: 2, display: "block" },
  paymentCard: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 20,
    padding: "20px",
    marginBottom: 24,
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 14px 0",
  },
  paymentOptions: { display: "flex", gap: 8, marginBottom: 12 },
  paymentOptBtn: {
    flex: 1,
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    borderRadius: 12,
    padding: "12px 6px",
    fontSize: 11,
    fontWeight: 600,
    color: "#94A3B8",
    cursor: "pointer",
  },
  paymentOptActive: {
    backgroundColor: "rgba(249,115,22,0.15)",
    borderColor: "#F97316",
    color: "#F97316",
  },
  paymentInfoText: { fontSize: 11, color: "#64748B", paddingLeft: 4 },
  summaryCard: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 20,
    padding: "20px",
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 14px 0",
  },
  priceRow: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#94A3B8", marginBottom: 10 },
  divider: { height: 1, backgroundColor: "#222227", margin: "12px 0" },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, fontWeight: 700 },
  totalPrice: { color: "#F97316", fontSize: 16 },
  ctaContainer: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  checkoutBtn: {
    width: "100%",
    backgroundColor: "#F97316",
    color: "#000",
    border: "none",
    borderRadius: 16,
    padding: "16px",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  safetyDisclaimer: { fontSize: 10, color: "#64748B" },

  // Modals
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.9)",
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
    padding: "28px 24px",
    width: "100%",
    maxWidth: 360,
    maxHeight: "90vh",
    overflowY: "auto",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow: "0 15px 40px rgba(0,0,0,0.6)",
  },
  modalSuccessIcon: { fontSize: 54, marginBottom: 8, alignSelf: "center" },
  modalTitle: { fontSize: 20, fontWeight: 800, color: "#F8FAFC", margin: 0, textAlign: "center" },
  modalSubtitle: { fontSize: 13, color: "#94A3B8", textAlign: "center", margin: 0, lineHeight: 1.5 },
  orderIdCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    borderRadius: 12,
    padding: "10px 24px",
    width: "100%",
    marginTop: 8,
  },
  orderIdLabel: { fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" },
  orderIdValue: { fontSize: 18, fontWeight: 800, color: "#F97316" },
  timeEstCard: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#34D399", marginTop: 4 },
  estIcon: { fontSize: 14 },
  modalBtn: {
    width: "100%",
    backgroundColor: "#F97316",
    color: "#000",
    border: "none",
    borderRadius: 12,
    padding: "14px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 12,
  },
  closeBtnX: {
    backgroundColor: "transparent",
    border: "none",
    color: "#6B6B6B",
    fontSize: 18,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 4,
  },
  addressListContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    maxHeight: 200,
    overflowY: "auto",
    marginTop: 12,
  },
  addressListItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 12,
    padding: "12px",
    cursor: "pointer",
  },
  listItemLeft: { display: "flex", alignItems: "center", gap: 10 },
  listStreet: { fontSize: 13, fontWeight: 700, margin: 0, color: "#F8FAFC" },
  listSub: { fontSize: 11, color: "#64748B", margin: "2px 0 0 0" },
  addAddressForm: { width: "100%", display: "flex", flexDirection: "column", gap: 10, marginTop: 8 },
  addAddressFormTitle: { fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", margin: "8px 0 2px 0" },
  formInput: {
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    color: "#F8FAFC",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 12,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  addAddrBtn: {
    backgroundColor: "rgba(249,115,22,0.1)",
    border: "1px solid rgba(249,115,22,0.25)",
    color: "#F97316",
    borderRadius: 10,
    padding: "10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryButton: {
    width: "100%",
    backgroundColor: "transparent",
    color: "#64748B",
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 10,
    padding: "4px",
  },
};

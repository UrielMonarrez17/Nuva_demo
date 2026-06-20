// src/pages/CartScreen.jsx

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent, IonIcon, IonSpinner, IonModal } from "@ionic/react";
import { 
  trashOutline, 
  locationOutline, 
  timeOutline, 
  cardOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  addOutline
} from "ionicons/icons";
import MapPicker from "../components/MapPicker";

export default function CartScreen() {
  const { cart, removeFromCart, placeOrder, addresses, selectAddress, addAddress } = useApp();
  const history = useHistory();

  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [successOrderInfo, setSuccessOrderInfo] = useState(null);
  
  // Address drawer/modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newStreet, setNewStreet] = useState("");
  const [newColonia, setNewColonia] = useState("");
  const [newCity, setNewCity] = useState("CDMX");

  const handleMapConfirm = (location) => {
    addAddress(`Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)} · ${location.address}`, "Seleccionado en mapa", "CDMX");
    setShowAddressModal(false);
  };

  const activeAddress = addresses.find(a => a.active) || addresses[0];

  const subtotal = cart.reduce((acc, item) => acc + item.finalPrice, 0);
  const shipping = subtotal > 0 ? 35 : 0;
  const total = subtotal + shipping;

  const totalProtein = cart.reduce((acc, item) => acc + item.macros.protein, 0);
  const totalCarbs = cart.reduce((acc, item) => acc + item.macros.carbs, 0);
  const totalFats = cart.reduce((acc, item) => acc + item.macros.fats, 0);
  const totalKcal = cart.reduce((acc, item) => acc + item.macros.kcal, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoadingCheckout(true);

    const addressStr = activeAddress 
      ? `${activeAddress.street}, ${activeAddress.neighborhood}, ${activeAddress.city}`
      : "Dirección no especificada";

    // Simulate cooking/sending delays
    setTimeout(async () => {
      const res = await placeOrder(addressStr);
      setLoadingCheckout(false);
      if (res.success) {
        setSuccessOrderInfo(res.orderId);
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

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <div style={styles.screen}>
          
          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.title}>Mi Orden Nomi</h1>
            <span style={styles.badge}>{cart.length} items</span>
          </div>

          {successOrderInfo && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalCard}>
                <div style={styles.modalSuccessIcon}>🎉</div>
                <h2 style={styles.modalTitle}>¡Pedido Confirmado!</h2>
                <p style={styles.modalSubtitle}>
                  Tu comida de precisión ha sido enviada a nuestra Dark Kitchen más cercana.
                </p>
                <div style={styles.orderIdCard}>
                  <span style={styles.orderIdLabel}>ID DE PEDIDO</span>
                  <span style={styles.orderIdValue}>#{successOrderInfo.slice(-8).toUpperCase()}</span>
                </div>
                <div style={styles.timeEstCard}>
                  <IonIcon icon={timeOutline} style={styles.estIcon} />
                  <span>Entrega estimada: <strong>25 - 35 mins</strong></span>
                </div>
                <button 
                  style={styles.modalBtn} 
                  onClick={() => {
                    setSuccessOrderInfo(null);
                    history.push("/home");
                  }}
                >
                  Entendido
                </button>
              </div>
            </div>
          )}

          {cart.length === 0 ? (
            <div style={styles.emptyContainer}>
              <div style={styles.emptyIcon}>🌯</div>
              <h2 style={styles.emptyTitle}>Tu carrito está vacío</h2>
              <p style={styles.emptySubtitle}>
                Explora nuestro menú de bases y desliza los gramos para armar tu comida perfecta.
              </p>
              <button style={styles.exploreBtn} onClick={() => history.push("/home")}>
                Ir al Menú
              </button>
            </div>
          ) : (
            <>
              {/* Itemized List */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Platillos Personalizados</h2>
                <div style={styles.itemsList}>
                  {cart.map((item, index) => (
                    <div key={index} style={styles.cartCard}>
                      <img 
                        src={item.imageUrl} 
                        alt={item.recipeName} 
                        style={styles.cardImg}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                      <div style={styles.cardDetails}>
                        <div style={styles.cardHeaderRow}>
                          <h3 style={styles.recipeName}>{item.recipeName}</h3>
                          <button 
                            style={styles.deleteBtn}
                            onClick={() => removeFromCart(index)}
                          >
                            <IonIcon icon={trashOutline} />
                          </button>
                        </div>

                        {/* Grams Breakdown */}
                        <div style={styles.ingredientsSummary}>
                          {item.breakdown.map((ing) => (
                            <span key={ing.id} style={styles.ingPill}>
                              {ing.name}: <strong>{ing.grams}g</strong>
                            </span>
                          ))}
                        </div>

                        {/* Macros & Price Row */}
                        <div style={styles.cardFooterRow}>
                          <div style={styles.macroPillMini}>
                            🔥 {item.macros.kcal} kcal · 🥩 {item.macros.protein}g prot
                          </div>
                          <span style={styles.priceTag}>${item.finalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order total macro profile */}
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
                    <span style={styles.macroLbl}>Kcal Totales</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address section */}
              <div style={styles.addressCard} onClick={() => setShowAddressModal(true)}>
                <div style={styles.addressLeft}>
                  <IonIcon icon={locationOutline} style={styles.locIcon} />
                  <div>
                    <h4 style={styles.addressTitle}>Entregar en</h4>
                    <p style={styles.addressText}>
                      {activeAddress 
                        ? `${activeAddress.street}, ${activeAddress.neighborhood}`
                        : "Selecciona una dirección de entrega"}
                    </p>
                  </div>
                </div>
                <IonIcon icon={chevronForwardOutline} style={styles.arrowIcon} />
              </div>

              {/* Cost breakdown */}
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

              {/* Checkout CTA */}
              <div style={styles.ctaContainer}>
                <button 
                  style={{ ...styles.checkoutBtn, opacity: loadingCheckout ? 0.7 : 1 }} 
                  onClick={handleCheckout}
                  disabled={loadingCheckout}
                >
                  {loadingCheckout ? (
                    <IonSpinner name="crescent" color="dark" style={{ height: 20 }} />
                  ) : (
                    `Confirmar Pedido · $${total.toFixed(2)}`
                  )}
                </button>
                <div style={styles.safetyDisclaimer}>
                  🔒 Pago 100% seguro encriptado procesado por Nomi Pay
                </div>
              </div>
            </>
          )}

          {/* Add Address Drawer/Modal */}
          {showAddressModal && (
            <div style={styles.modalOverlay}>
              <div style={{ ...styles.modalCard, maxWidth: 500, width: "90%" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={styles.modalTitle}>Direcciones de Envío</h3>
                  <button style={styles.cancelPrescriptionBtn} onClick={() => setShowAddressModal(false)}>✕</button>
                </div>
                <p style={styles.modalSubtitle}>Selecciona en el mapa o elige una guardada.</p>
                
                <div style={{ marginBottom: 16 }}>
                  <MapPicker onConfirm={handleMapConfirm} />
                </div>

                <div style={styles.addressListContainer}>
                  {addresses.map((addr) => (
                    <div 
                      key={addr.id} 
                      onClick={() => { selectAddress(addr.id); setShowAddressModal(false); }}
                      style={{
                        ...styles.addressListItem,
                        borderColor: addr.active ? "#F97316" : "#222227",
                        backgroundColor: addr.active ? "rgba(249, 115, 22, 0.05)" : "#0B0B0C"
                      }}
                    >
                      <div style={styles.listItemLeft}>
                        <IonIcon 
                          icon={locationOutline} 
                          style={{ color: addr.active ? "#F97316" : "#64748B", fontSize: 18 }} 
                        />
                        <div>
                          <p style={styles.listStreet}>{addr.street}</p>
                          <p style={styles.listSub}>{addr.neighborhood}, {addr.city}</p>
                        </div>
                      </div>
                      {addr.active && <IonIcon icon={checkmarkCircleOutline} style={{ color: "#F97316" }} />}
                    </div>
                  ))}
                </div>

                <div style={styles.divider} />

                {/* Form to add address */}
                <form onSubmit={handleAddNewAddress} style={styles.addAddressForm}>
                  <h4 style={styles.addAddressFormTitle}>Nueva Dirección</h4>
                  <input
                    type="text"
                    placeholder="Calle y Número Ext/Int"
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

                <button 
                  style={styles.modalSecondaryButton} 
                  onClick={() => setShowAddressModal(false)}
                >
                  Cerrar
                </button>
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
    marginBottom: 24,
    marginTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    margin: 0,
  },
  badge: {
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    border: "1px solid rgba(249, 115, 22, 0.3)",
    color: "#F97316",
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 8,
    padding: "4px 8px",
    textTransform: "uppercase"
  },
  emptyContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "60px 24px",
    gap: 16,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 1.5,
    margin: 0,
    padding: "0 16px",
  },
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 16px 0",
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  cartCard: {
    display: "flex",
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 20,
    overflow: "hidden",
  },
  cardImg: {
    width: 90,
    height: 110,
    objectFit: "cover",
    backgroundColor: "#222227"
  },
  cardDetails: {
    flex: 1,
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  cardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  recipeName: {
    fontSize: 15,
    fontWeight: 700,
    margin: 0,
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "#EF4444",
    cursor: "pointer",
    padding: 2,
    fontSize: 16,
  },
  ingredientsSummary: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    margin: "8px 0",
  },
  ingPill: {
    fontSize: 9,
    backgroundColor: "#0B0B0C",
    border: "1px solid #1C1C24",
    color: "#94A3B8",
    padding: "2px 6px",
    borderRadius: 5,
  },
  cardFooterRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  macroPillMini: {
    fontSize: 10,
    color: "#64748B",
  },
  priceTag: {
    fontSize: 14,
    fontWeight: 700,
    color: "#F97316",
  },
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
  macrosGrid: {
    display: "flex",
    justifyContent: "space-between",
  },
  macroColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
  },
  macroVal: {
    fontSize: 16,
    fontWeight: 700,
    color: "#F97316",
  },
  macroLbl: {
    fontSize: 9,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginTop: 2,
  },
  addressCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 16,
    padding: "16px",
    marginBottom: 20,
    cursor: "pointer",
  },
  addressLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  locIcon: {
    color: "#F97316",
    fontSize: 20,
  },
  addressTitle: {
    fontSize: 13,
    fontWeight: 700,
    margin: 0,
    color: "#F8FAFC",
  },
  addressText: {
    fontSize: 11,
    color: "#94A3B8",
    margin: "2px 0 0 0",
  },
  arrowIcon: {
    color: "#64748B",
    fontSize: 16,
  },
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
  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#222227",
    margin: "12px 0",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 14,
    fontWeight: 700,
  },
  totalPrice: {
    color: "#F97316",
    fontSize: 16,
  },
  ctaContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
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
  safetyDisclaimer: {
    fontSize: 10,
    color: "#64748B",
  },

  // Modal / Drawer Overlay
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
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
    padding: "32px 24px",
    width: "100%",
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 15px 40px rgba(0,0,0,0.6)",
  },
  modalSuccessIcon: {
    fontSize: 54,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#F8FAFC",
    margin: 0,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    margin: 0,
    lineHeight: 1.5,
  },
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
  orderIdLabel: {
    fontSize: 9,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  orderIdValue: {
    fontSize: 18,
    fontWeight: 800,
    color: "#F97316",
  },
  timeEstCard: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "#34D399",
    marginTop: 4,
  },
  estIcon: {
    fontSize: 14,
  },
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

  // Address Modal Specific
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
  listItemLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  listStreet: {
    fontSize: 13,
    fontWeight: 700,
    margin: 0,
    color: "#F8FAFC",
  },
  listSub: {
    fontSize: 11,
    color: "#64748B",
    margin: "2px 0 0 0",
  },
  addAddressForm: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 8,
  },
  addAddressFormTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    margin: "8px 0 2px 0",
  },
  formInput: {
    backgroundColor: "#0B0B0C",
    border: "1px solid #222227",
    color: "#F8FAFC",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 12,
    outline: "none",
  },
  addAddrBtn: {
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    border: "1px solid rgba(249, 115, 22, 0.25)",
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
  }
};

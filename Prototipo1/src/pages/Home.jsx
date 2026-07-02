// src/pages/Home.jsx

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { searchOutline, flameOutline, timeOutline, closeCircleOutline, cartOutline } from "ionicons/icons";

export default function Home() {
  const { 
    userProfile, 
    recipes, 
    ingredients,
    restaurants, 
    activeRole, 
    patientSelector, 
    setPatientSelector, 
    prescriptions, 
    addToCart, 
    redeemPrescription 
  } = useApp();
  const history = useHistory();

  const patientPrescriptions = (prescriptions || []).filter(
    (p) => p.patientEmail === userProfile?.email?.toLowerCase().trim() && p.status === "pending"
  );

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
    alert(`¡"${pres.recipeName}" recomendada por ${pres.nutriologistName} añadida al carrito!`);
  };

  const handleCustomizePrescription = (pres) => {
    history.push({
      pathname: `/customDish/${pres.recipeId}`,
      state: { initialGrams: pres.gramsMap, prescriptionId: pres.id }
    });
  };

  const getRecipeBasePrice = (recipe) => {
    if (!recipe || !ingredients) return 90;
    
    // Sum cost of allowed ingredients at their default/min grams
    const ingredientCost = recipe.allowedIngredients.reduce((total, ingId) => {
      const ing = ingredients.find((i) => i.id === ingId || i.masterIngredientId === ingId);
      if (!ing) return total;
      
      const limits = recipe.ingredientLimits?.[ing.id] || {};
      const grams = limits.default !== undefined ? limits.default : (ing.defaultGrams || 0);
      const price = ing.pricePerGram ?? ing.costPerGram ?? 0;
      
      return total + (grams * price);
    }, 0);

    const productionCost = ingredientCost + (recipe.fixedCost || 0);
    const finalPrice = Math.max(productionCost * 3, 90);
    return finalPrice;
  };

  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectRecipe = (recipeId) => {
    history.push(`/customDish/${recipeId}`);
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesCategory = activeCategory === "Todos" || recipe.category === activeCategory;
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if the restaurant of this recipe is available/active
    const rest = restaurants?.find(r => r.id === recipe.restaurantId);
    const isRestAvailable = rest ? rest.isAvailable !== false : true;

    return matchesCategory && matchesSearch && isRestAvailable;
  });

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <div style={styles.screen}>
          
          {/* Header */}
          <div style={styles.header}>
            <div>
              <span style={styles.eyebrow}>
                {activeRole === "nutriologist" ? "🩺 Modo Profesional" : "👋 Hola,"}
              </span>
              <h1 style={styles.welcomeText}>
                {userProfile?.name || "Cargando..."}
              </h1>
            </div>
            
            {/* Visual branding */}
            <div style={styles.miniLogo}>
              <span>n</span>
            </div>
          </div>

          {/* Alert if prescribing (B2B Dual Mode) */}
          {activeRole === "nutriologist" && patientSelector && (
            <div style={styles.prescribingAlert}>
              <div style={styles.alertContent}>
                <span style={styles.alertIcon}>🩺</span>
                <div>
                  <p style={styles.alertTitle}>Prescribiendo receta</p>
                  <p style={styles.alertSubtitle}>
                    Para: <strong>{patientSelector.patientName}</strong> ({patientSelector.patientEmail})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setPatientSelector(null)} 
                style={styles.cancelPrescriptionBtn}
                title="Cancelar prescripción"
              >
                <IonIcon icon={closeCircleOutline} style={styles.cancelIcon} />
              </button>
            </div>
          )}

          {/* Search bar */}
          <div style={styles.searchContainer}>
            <div style={styles.searchBar}>
              <IonIcon icon={searchOutline} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar base de comida..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          {/* Horizontal Categories */}
          <div style={styles.categoriesContainer}>
            {["Todos", ...new Set((recipes || []).map(r => r.category).filter(Boolean))].map((cat) => {
              const categoryEmojis = {
                "Todos": "🍽️",
                "Bowl": "🥣",
                "Wrap": "🌯",
                "Pollo": "🍗",
                "Salmón": "🐟",
                "Avena": "🌾",
                "Tofu": "🍢",
                "Ensalada": "🥗",
                "Postre": "🍰",
                "Sopa": "🍜",
                "Bebida": "🥤",
                "Taco": "🌮",
                "Sushi": "🍣",
                "Pizza": "🍕",
                "Hamburguesa": "🍔",
                "Pasta": "🍝"
              };
              const emoji = categoryEmojis[cat] || "🍲";
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    ...styles.categoryPill,
                    ...(activeCategory === cat ? styles.activeCategoryPill : {})
                  }}
                >
                  {emoji} {cat}
                </button>
              );
            })}
          </div>

          {/* Recomendaciones del Nutriólogo */}
          {activeRole !== "nutriologist" && patientPrescriptions.length > 0 && (
            <div style={styles.recommendationsSection}>
              <div style={styles.sectionTitleRow}>
                <h2 style={{ ...styles.sectionTitle, color: "#A78BFA" }}>🩺 Recomendaciones del Nutriólogo</h2>
                <span style={{ ...styles.resultsCount, color: "#C084FC" }}>
                  {patientPrescriptions.length} pendientes
                </span>
              </div>
              <p style={styles.sectionSubtitle}>
                Elige entre la recomendación hecha por tu nutriólogo al gramo o cualquiera de las bases normales de platillo.
              </p>

              <div style={styles.recommendationsContainer}>
                {patientPrescriptions.map((pres) => (
                  <div key={pres.id} style={styles.recommendationCard}>
                    <div style={styles.recCardHeader}>
                      <span style={styles.recDoctorTag}>🩺 Dr/a. {pres.nutriologistName}</span>
                      <span style={styles.recStatusBadge}>Recetado</span>
                    </div>

                    <div style={styles.recCardBody}>
                      <div style={styles.recImageWrapper}>
                        <img
                          src={pres.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"}
                          alt={pres.recipeName}
                          style={styles.recImage}
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      </div>
                      
                      <div style={styles.recDetails}>
                        <h4 style={styles.recDishName}>{pres.recipeName}</h4>
                        
                        {/* Grams Breakdown */}
                        <div style={styles.recGramsGrid}>
                          {pres.breakdown && pres.breakdown.map((ing) => (
                            <span key={ing.id} style={styles.recGramsTag}>
                              {ing.name}: {ing.grams}g
                            </span>
                          ))}
                        </div>

                        {/* Macros Pill Grid */}
                        <div style={styles.recMacrosRow}>
                          <div style={styles.recMacroPill}>
                            <span style={styles.recMacroVal}>{pres.macros.protein}g</span>
                            <span style={styles.recMacroLbl}>Prot</span>
                          </div>
                          <div style={styles.recMacroPill}>
                            <span style={styles.recMacroVal}>{pres.macros.carbs}g</span>
                            <span style={styles.recMacroLbl}>Carb</span>
                          </div>
                          <div style={styles.recMacroPill}>
                            <span style={styles.recMacroVal}>{pres.macros.fats}g</span>
                            <span style={styles.recMacroLbl}>Gras</span>
                          </div>
                          <div style={{ ...styles.recMacroPill, borderColor: "rgba(52, 211, 153, 0.2)" }}>
                            <span style={{ ...styles.recMacroVal, color: "#34D399" }}>{pres.macros.kcal}</span>
                            <span style={styles.recMacroLbl}>Kcal</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={styles.recActions}>
                      <button
                        onClick={() => handleCustomizePrescription(pres)}
                        style={styles.recCustomizeBtn}
                      >
                        Personalizar Platillo
                      </button>
                      <button
                        onClick={() => handleOrderPrescription(pres)}
                        style={styles.recOrderBtn}
                      >
                        <IonIcon icon={cartOutline} style={{ marginRight: 6 }} />
                        Comprar Recomendación · ${pres.totalPrice.toFixed(2)} MXN
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Menu section */}
          <div style={styles.menuSection}>
            <div style={styles.sectionTitleRow}>
              <h2 style={styles.sectionTitle}>Bases de Platillo</h2>
              <span style={styles.resultsCount}>
                {filteredRecipes.length} bases
              </span>
            </div>
            <p style={styles.sectionSubtitle}>
              Selecciona una base para personalizar sus macros e ingredientes al gramo.
            </p>

            {filteredRecipes.length === 0 ? (
              <div style={styles.emptyResults}>
                <p>No encontramos platillos con esos criterios.</p>
              </div>
            ) : (
              <div style={styles.recipesGrid}>
                {filteredRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe.id)}
                    style={styles.recipeCard}
                  >
                    <div style={styles.cardImageContainer}>
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        style={styles.cardImage}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                      <div style={styles.cardOverlay} />
                      
                      {/* Estimated prep time */}
                      <div style={styles.timeBadge}>
                        <IonIcon icon={timeOutline} style={styles.badgeIcon} />
                        <span>{recipe.estimatedPrepTime} min</span>
                      </div>
                    </div>

                    <div style={styles.cardContent}>
                      <div style={styles.tagsContainer}>
                        {recipe.tags && recipe.tags.map((tag) => (
                          <span key={tag} style={styles.tagPill}>{tag}</span>
                        ))}
                      </div>

                      <h3 style={styles.recipeName}>{recipe.name}</h3>
                      {(() => {
                        const rest = restaurants?.find(r => r.id === recipe.restaurantId);
                        return rest ? (
                          <div style={styles.restaurantBadge}>
                            <IonIcon icon={flameOutline} style={{ display: 'none' }} />
                            <span>🏪 {rest.name}</span>
                          </div>
                        ) : null;
                      })()}
                      <p style={styles.recipeDescription}>{recipe.description}</p>
                      
                      <div style={styles.recipeFooter}>
                        <div style={styles.calPill}>
                          <IonIcon icon={flameOutline} style={styles.flameIcon} />
                          <span>~450-700 kcal</span>
                        </div>
                        <span style={styles.basePrice}>
                          Desde <strong style={styles.orangePrice}>${getRecipeBasePrice(recipe).toFixed(2)} MXN</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extra bottom spacing for navigation */}
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
    marginBottom: 24,
    marginTop: 12,
  },
  eyebrow: {
    fontSize: 12,
    color: "#F97316",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontWeight: 600,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 800,
    color: "#F8FAFC",
    margin: "4px 0 0 0",
    letterSpacing: "-0.02em",
  },
  miniLogo: {
    width: 42,
    height: 42,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    border: "1px solid rgba(249, 115, 22, 0.2)",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#F97316",
    fontWeight: 800,
    fontSize: 22,
  },
  prescribingAlert: {
    display: "flex",
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    border: "1px solid rgba(167, 139, 250, 0.3)",
    borderRadius: 16,
    padding: "12px 16px",
    marginBottom: 24,
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertContent: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  alertIcon: {
    fontSize: 24,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#C084FC",
    margin: 0,
  },
  alertSubtitle: {
    fontSize: 11,
    color: "#E2E8F0",
    margin: "2px 0 0 0",
  },
  cancelPrescriptionBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#A78BFA",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
  },
  cancelIcon: {
    fontSize: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 16,
    padding: "12px 16px",
    gap: 12,
  },
  searchIcon: {
    color: "#64748B",
    fontSize: 20,
  },
  searchInput: {
    backgroundColor: "transparent",
    border: "none",
    color: "#F8FAFC",
    fontSize: 14,
    outline: "none",
    width: "100%",
  },
  categoriesContainer: {
    display: "flex",
    gap: 10,
    marginBottom: 28,
    overflowX: "auto",
    paddingBottom: 4,
  },
  categoryPill: {
    backgroundColor: "#131316",
    border: "1px solid #222227",
    color: "#94A3B8",
    borderRadius: 12,
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
  },
  activeCategoryPill: {
    backgroundColor: "#F97316",
    color: "#000",
    borderColor: "#F97316",
  },
  menuSection: {
    display: "flex",
    flexDirection: "column",
  },
  sectionTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    color: "#F8FAFC",
  },
  resultsCount: {
    fontSize: 12,
    color: "#64748B",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    margin: "6px 0 20px 0",
    lineHeight: 1.4,
  },
  recipesGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  recipeCard: {
    backgroundColor: "#131316",
    borderRadius: 24,
    border: "1px solid #222227",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.2s ease, border-color 0.2s ease",
    ":active": {
      transform: "scale(0.98)",
    },
  },
  cardImageContainer: {
    position: "relative",
    height: 180,
    backgroundColor: "#222227",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  cardOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to bottom, transparent 60%, rgba(19, 19, 22, 0.9) 100%)",
  },
  timeBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(4px)",
    borderRadius: 8,
    padding: "4px 8px",
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    fontWeight: 600,
    color: "#E2E8F0",
  },
  badgeIcon: {
    fontSize: 13,
  },
  cardContent: {
    padding: "16px 20px 20px 20px",
  },
  tagsContainer: {
    display: "flex",
    gap: 6,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  tagPill: {
    fontSize: 9,
    fontWeight: 700,
    color: "#94A3B8",
    backgroundColor: "#1C1C22",
    padding: "3px 8px",
    borderRadius: 6,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 700,
    margin: "0 0 2px 0",
    color: "#F8FAFC",
  },
  restaurantBadge: {
    fontSize: 11,
    color: "#F97316",
    fontWeight: 600,
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  recipeDescription: {
    fontSize: 12,
    color: "#94A3B8",
    margin: "0 0 16px 0",
    lineHeight: 1.4,
  },
  recipeFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calPill: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(249, 115, 22, 0.08)",
    padding: "4px 10px",
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    color: "#F97316",
  },
  flameIcon: {
    fontSize: 12,
  },
  basePrice: {
    fontSize: 12,
    color: "#64748B",
  },
  orangePrice: {
    color: "#F97316",
    fontSize: 14,
  },
  emptyResults: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#64748B",
    fontSize: 14,
  },
  recommendationsSection: {
    marginBottom: 32,
    backgroundColor: "rgba(167, 139, 250, 0.05)",
    border: "1px solid rgba(167, 139, 250, 0.12)",
    borderRadius: 24,
    padding: 20,
  },
  recommendationsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  recommendationCard: {
    backgroundColor: "#131316",
    border: "1px solid rgba(167, 139, 250, 0.18)",
    borderRadius: 20,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  recCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recDoctorTag: {
    fontSize: 12,
    fontWeight: 700,
    color: "#C084FC",
  },
  recStatusBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: "#C084FC",
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    padding: "3px 8px",
    borderRadius: 8,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  recCardBody: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
  },
  recImageWrapper: {
    width: 68,
    height: 68,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#222227",
    flexShrink: 0,
  },
  recImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  recDetails: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  recDishName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#F8FAFC",
    margin: 0,
  },
  recGramsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
  },
  recGramsTag: {
    fontSize: 10,
    color: "#94A3B8",
    backgroundColor: "#1C1C22",
    padding: "2px 6px",
    borderRadius: 4,
  },
  recMacrosRow: {
    display: "flex",
    gap: 6,
    marginTop: 4,
  },
  recMacroPill: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: 8,
    padding: "4px 8px",
    minWidth: 44,
  },
  recMacroVal: {
    fontSize: 10,
    fontWeight: 700,
    color: "#F8FAFC",
  },
  recMacroLbl: {
    fontSize: 8,
    color: "#64748B",
    textTransform: "uppercase",
  },
  recActions: {
    display: "flex",
    gap: 10,
    marginTop: 6,
  },
  recCustomizeBtn: {
    flex: 1,
    backgroundColor: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#E2E8F0",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.2s ease",
  },
  recOrderBtn: {
    flex: 1.3,
    backgroundColor: "#A78BFA",
    border: "none",
    color: "#0B0B0C",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  }
};

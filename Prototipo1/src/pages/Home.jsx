// src/pages/Home.jsx

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useHistory } from "react-router-dom";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { searchOutline, flameOutline, timeOutline, closeCircleOutline } from "ionicons/icons";

export default function Home() {
  const { userProfile, recipes, restaurants, activeRole, patientSelector, setPatientSelector } = useApp();
  const history = useHistory();

  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectRecipe = (recipeId) => {
    history.push(`/customDish/${recipeId}`);
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesCategory = activeCategory === "Todos" || recipe.category === activeCategory;
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
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
            {["Todos", "Bowl", "Wrap"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  ...styles.categoryPill,
                  ...(activeCategory === cat ? styles.activeCategoryPill : {})
                }}
              >
                {cat === "Todos" ? "🍽️ Todos" : cat === "Bowl" ? "🥣 Bowls" : "🌯 Wraps"}
              </button>
            ))}
          </div>

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
                          Desde <strong style={styles.orangePrice}>$90 MXN</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extra bottom spacing for navigation */}
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
  }
};

// src/pages/CustomDishScreen.jsx

import { useState, useCallback, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRecipeLoader } from "../hooks/useRecipeLoader";
import { usePricingCalculator } from "../hooks/usePricingCalculator";
import { IonPage, IonContent } from "@ionic/react";

// ─── ID de la receta a mostrar (en el futuro vendrá de navegación/props) ──────
const RECIPE_ID = "recipe_tazon_teriyaki";

// ─── SUBCOMPONENTES ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={styles.centered}>
      <div style={styles.spinner} />
      <p style={styles.loadingText}>Cargando platillo...</p>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div style={styles.centered}>
      <p style={{ ...styles.loadingText, color: "#EF4444" }}>⚠️ {message}</p>
    </div>
  );
}

function MacroBadge({ label, value, unit, color }) {
  return (
    <div style={styles.macroBadge}>
      <span style={{ ...styles.macroValue, color }}>{value}</span>
      <span style={styles.macroUnit}>{unit}</span>
      <span style={styles.macroLabel}>{label}</span>
    </div>
  );
}

function IngredientSlider({ ingredient, grams, onChange }) {
  const percentage =
    ((grams - ingredient.minGrams) / (ingredient.maxGrams - ingredient.minGrams)) * 100;

  return (
    <div style={styles.sliderCard}>
      {/* Encabezado del ingrediente */}
      <div style={styles.sliderHeader}>
        <span style={styles.ingredientName}>{ingredient.name}</span>
        <div style={styles.gramsDisplay}>
          <span style={styles.gramsValue}>{grams}</span>
          <span style={styles.gramsUnit}>g</span>
        </div>
      </div>

      {/* Barra de progreso visual */}
      <div style={styles.progressBarTrack}>
        <div
          style={{
            ...styles.progressBarFill,
            width: `${percentage}%`,
          }}
        />
      </div>

      {/* Slider nativo */}
      <input
        type="range"
        min={ingredient.minGrams}
        max={ingredient.maxGrams}
        step={5}
        value={grams}
        onChange={(e) => onChange(ingredient.id, Number(e.target.value))}
        style={styles.sliderInput}
        aria-label={`Gramos de ${ingredient.name}`}
      />

      {/* Etiquetas min/max */}
      <div style={styles.sliderLabels}>
        <span style={styles.sliderLabelText}>{ingredient.minGrams}g mín</span>
        <span style={styles.sliderLabelText}>{ingredient.maxGrams}g máx</span>
      </div>

      {/* Info nutricional del ingrediente */}
      <div style={styles.ingNutrition}>
        <span style={styles.ingNutritionItem}>
          🥩 {Math.round(grams * ingredient.proteinPerGram * 10) / 10}g prot
        </span>
        <span style={styles.ingNutritionItem}>
          🌾 {Math.round(grams * ingredient.carbPerGram * 10) / 10}g carb
        </span>
        <span style={styles.ingNutritionItem}>
          🫒 {Math.round(grams * ingredient.fatPerGram * 10) / 10}g grasas
        </span>
        <span style={styles.ingNutritionItem}>
          🔥 {Math.round(grams * ingredient.kcalPerGram)} kcal
        </span>
      </div>
    </div>
  );
}

function OrderSuccessModal({ orderId, onClose }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalCard}>
        <div style={styles.modalIcon}>✅</div>
        <h2 style={styles.modalTitle}>¡Pedido enviado!</h2>
        <p style={styles.modalSubtitle}>Tu pedido está siendo preparado</p>
        <div style={styles.modalOrderId}>
          <span style={styles.modalOrderIdLabel}>ID de orden</span>
          <span style={styles.modalOrderIdValue}>
            #{orderId?.slice(-8).toUpperCase()}
          </span>
        </div>
        <button style={styles.modalButton} onClick={onClose}>
          Hacer otro pedido
        </button>
      </div>
    </div>
  );
}

// ─── PANTALLA PRINCIPAL ───────────────────────────────────────────────────────

export default function CustomDishScreen() {
  const { recipe, ingredients, loading, error } = useRecipeLoader(RECIPE_ID);

  // gramsMap: { [ingredientId]: number }
  // Se inicializa con los defaultGrams de cada ingrediente cuando cargan
  const [gramsMap, setGramsMap] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successOrderId, setSuccessOrderId] = useState(null);

  // Inicializar gramsMap con defaultGrams cuando los ingredientes cargan
  useEffect(() => {
    if (ingredients.length > 0 && !isInitialized) {
      const defaults = {};
      ingredients.forEach((ing) => {
        defaults[ing.id] = ing.defaultGrams;
      });
      setGramsMap(defaults);
      setIsInitialized(true);
    }
  }, [ingredients, isInitialized]);

  // Armar el array que consume usePricingCalculator
  const selectedIngredients = ingredients.map((ing) => ({
    ...ing,
    grams: gramsMap[ing.id] ?? ing.defaultGrams,
  }));

  // Motor de precios en tiempo real
  const { finalPrice, macros, breakdown, ingredientCost, productionCost } =
    usePricingCalculator(selectedIngredients, recipe?.fixedCost ?? 0);

  const handleSliderChange = useCallback((ingredientId, newGrams) => {
    setGramsMap((prev) => ({ ...prev, [ingredientId]: newGrams }));
  }, []);

  const handlePlaceOrder = async () => {
    if (!recipe || ingredients.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Construir el documento de orden según el esquema de Firestore
      const orderDoc = {
        status: "PENDING",
        totalPrice: finalPrice,
        totalMacros: {
          protein: macros.protein,
          carbs: macros.carbs,
          fats: macros.fats,
          kcal: macros.kcal,
        },
        items: [
          {
            recipeId: recipe.id,
            recipeName: recipe.name,
            fixedCost: recipe.fixedCost,
            ingredientCost,
            productionCost,
            customizedIngredients: breakdown.map((item) => ({
              ingredientId: item.id,
              name: item.name,
              grams: item.grams,
              subtotalCost: item.subtotalCost,
              macros: item.macros,
            })),
          },
        ],
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "orders"), orderDoc);
      setSuccessOrderId(docRef.id);
    } catch (err) {
      console.error("Error al crear la orden:", err);
      setSubmitError("No se pudo enviar el pedido. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessOrderId(null);
    setSubmitError(null);
    // Resetear sliders a defaults
    const defaults = {};
    ingredients.forEach((ing) => {
      defaults[ing.id] = ing.defaultGrams;
    });
    setGramsMap(defaults);
  };

  // ─── RENDERS CONDICIONALES ─────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;
  if (!recipe) return null;

  return (
    <IonPage>
      <IonContent>
        <div style={styles.screen}>
      {/* Modal de éxito */}
      {successOrderId && (
        <OrderSuccessModal orderId={successOrderId} onClose={handleReset} />
      )}

      {/* ── HERO: Imagen + nombre del platillo ── */}
      <div style={styles.hero}>
        <img
          src={recipe.imageUrl}
          alt={recipe.name}
          style={styles.heroImage}
          onError={(e) => { e.target.style.display = "none"; }}
        />
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent}>
          <span style={styles.heroEyebrow}>Personaliza tu platillo</span>
          <h1 style={styles.heroTitle}>{recipe.name}</h1>
          <span style={styles.heroPrepTime}>
            ⏱ {recipe.estimatedPrepTime} min de preparación
          </span>
        </div>
      </div>

      {/* ── PRECIO CENTRAL (firma visual) ── */}
      <div style={styles.priceSection}>
        <div style={styles.pricePill}>
          <span style={styles.priceCurrency}>$</span>
          <span style={styles.priceAmount}>
            {finalPrice.toFixed(2)}
          </span>
          <span style={styles.priceCurrency}>MXN</span>
        </div>
        <p style={styles.priceCaption}>
          Precio final · se actualiza en tiempo real
        </p>
      </div>

      {/* ── MACROS TOTALES ── */}
      <div style={styles.macrosSection}>
        <MacroBadge
          label="Proteína"
          value={macros.protein}
          unit="g"
          color="#F97316"
        />
        <MacroBadge
          label="Carbos"
          value={macros.carbs}
          unit="g"
          color="#FACC15"
        />
        <MacroBadge
          label="Grasas"
          value={macros.fats}
          unit="g"
          color="#A78BFA"
        />
        <MacroBadge
          label="Calorías"
          value={macros.kcal}
          unit="kcal"
          color="#34D399"
        />
      </div>

      {/* ── SLIDERS DE INGREDIENTES ── */}
      <div style={styles.slidersSection}>
        <h2 style={styles.sectionTitle}>Ajusta tus ingredientes</h2>
        <p style={styles.sectionSubtitle}>
          Mueve cada slider para personalizar las porciones
        </p>

        {ingredients.map((ingredient) => (
          <IngredientSlider
            key={ingredient.id}
            ingredient={ingredient}
            grams={gramsMap[ingredient.id] ?? ingredient.defaultGrams}
            onChange={handleSliderChange}
          />
        ))}
      </div>

      {/* ── RESUMEN DE COSTOS (transparencia) ── */}
      <div style={styles.costBreakdown}>
        <h3 style={styles.costBreakdownTitle}>Desglose de precio</h3>
        <div style={styles.costRow}>
          <span style={styles.costLabel}>Ingredientes</span>
          <span style={styles.costValue}>${ingredientCost.toFixed(2)}</span>
        </div>
        <div style={styles.costRow}>
          <span style={styles.costLabel}>Costo de producción</span>
          <span style={styles.costValue}>${productionCost.toFixed(2)}</span>
        </div>
        <div style={styles.costDivider} />
        <div style={styles.costRow}>
          <span style={{ ...styles.costLabel, color: "#F5F5F0", fontWeight: 700 }}>
            Total
          </span>
          <span style={{ ...styles.costValue, color: "#F97316", fontWeight: 700 }}>
            ${finalPrice.toFixed(2)} MXN
          </span>
        </div>
      </div>

      {/* ── ERROR DE ENVÍO ── */}
      {submitError && (
        <div style={styles.errorBanner}>
          <span>⚠️ {submitError}</span>
        </div>
      )}

      {/* ── BOTÓN DE ORDENAR ── */}
      <div style={styles.ctaSection}>
        <button
          style={{
            ...styles.ctaButton,
            opacity: isSubmitting ? 0.6 : 1,
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Enviando pedido..." : `Ordenar · $${finalPrice.toFixed(2)} MXN`}
        </button>
        <p style={styles.ctaCaption}>
          Tu pedido se enviará directamente a cocina
        </p>
      </div>

      {/* Espaciado inferior para móvil */}
      <div style={{ height: 40 }} />

      {/* Estilos globales del slider nativo */}
      <style>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 2px;
          background: transparent;
          outline: none;
          cursor: pointer;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #F97316;
          cursor: pointer;
          border: 3px solid #0F0F0F;
          box-shadow: 0 0 0 2px #F97316;
          transition: transform 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale(1.25);
        }
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #F97316;
          cursor: pointer;
          border: 3px solid #0F0F0F;
          box-shadow: 0 0 0 2px #F97316;
        }
      `}</style>
        </div>
      </IonContent>
    </IonPage>
  );
}

// ─── SISTEMA DE ESTILOS ───────────────────────────────────────────────────────

const styles = {
  screen: {
    backgroundColor: "#0F0F0F",
    minHeight: "100vh",
    maxWidth: 480,
    margin: "0 auto",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#F5F5F0",
  },
  centered: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#0F0F0F",
    gap: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #1C1C1C",
    borderTop: "3px solid #F97316",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "#6B6B6B",
    fontSize: 14,
    letterSpacing: "0.05em",
  },

  // Hero
  hero: {
    position: "relative",
    height: 260,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to bottom, rgba(15,15,15,0.1) 0%, rgba(15,15,15,0.95) 100%)",
  },
  heroContent: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.15em",
    color: "#F97316",
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#F5F5F0",
    margin: 0,
    lineHeight: 1.2,
  },
  heroPrepTime: {
    fontSize: 12,
    color: "#6B6B6B",
    marginTop: 4,
  },

  // Precio
  priceSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px 24px 16px",
    gap: 8,
  },
  pricePill: {
    display: "flex",
    alignItems: "flex-start",
    gap: 4,
  },
  priceCurrency: {
    fontSize: 20,
    fontWeight: 300,
    color: "#F97316",
    paddingTop: 10,
  },
  priceAmount: {
    fontSize: 72,
    fontWeight: 700,
    color: "#F97316",
    lineHeight: 1,
    letterSpacing: "-0.03em",
    transition: "all 0.15s ease",
  },
  priceCaption: {
    fontSize: 11,
    color: "#6B6B6B",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    margin: 0,
  },

  // Macros
  macrosSection: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0 24px 24px",
    gap: 8,
  },
  macroBadge: {
    flex: 1,
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    padding: "12px 8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1,
  },
  macroUnit: {
    fontSize: 10,
    color: "#6B6B6B",
    fontWeight: 400,
  },
  macroLabel: {
    fontSize: 9,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginTop: 2,
  },

  // Sliders
  slidersSection: {
    padding: "0 24px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#F5F5F0",
    margin: "0 0 4px 0",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#6B6B6B",
    margin: "0 0 20px 0",
  },
  sliderCard: {
    backgroundColor: "#1C1C1C",
    borderRadius: 16,
    padding: "20px 20px 16px",
    marginBottom: 12,
    border: "1px solid #2A2A2A",
  },
  sliderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: 600,
    color: "#F5F5F0",
  },
  gramsDisplay: {
    display: "flex",
    alignItems: "baseline",
    gap: 2,
    backgroundColor: "#0F0F0F",
    padding: "6px 12px",
    borderRadius: 8,
  },
  gramsValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "#F97316",
  },
  gramsUnit: {
    fontSize: 12,
    color: "#6B6B6B",
    fontWeight: 400,
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: "#2A2A2A",
    borderRadius: 2,
    marginBottom: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#F97316",
    borderRadius: 2,
    transition: "width 0.1s ease",
  },
  sliderInput: {
    width: "100%",
    marginBottom: 6,
  },
  sliderLabels: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sliderLabelText: {
    fontSize: 10,
    color: "#4A4A4A",
    letterSpacing: "0.05em",
  },
  ingNutrition: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 12,
    borderTop: "1px solid #2A2A2A",
  },
  ingNutritionItem: {
    fontSize: 11,
    color: "#6B6B6B",
    backgroundColor: "#0F0F0F",
    padding: "3px 8px",
    borderRadius: 6,
  },

  // Desglose de costos
  costBreakdown: {
    margin: "24px 24px 0",
    backgroundColor: "#1C1C1C",
    borderRadius: 16,
    padding: "20px",
    border: "1px solid #2A2A2A",
  },
  costBreakdownTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    margin: "0 0 16px 0",
  },
  costRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  costLabel: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  costValue: {
    fontSize: 14,
    color: "#F5F5F0",
    fontWeight: 500,
  },
  costDivider: {
    height: 1,
    backgroundColor: "#2A2A2A",
    margin: "12px 0",
  },

  // Error
  errorBanner: {
    margin: "16px 24px 0",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 13,
    color: "#EF4444",
  },

  // CTA
  ctaSection: {
    padding: "24px 24px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  ctaButton: {
    width: "100%",
    backgroundColor: "#F97316",
    color: "#0F0F0F",
    border: "none",
    borderRadius: 16,
    padding: "18px 24px",
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    transition: "opacity 0.2s ease, transform 0.1s ease",
  },
  ctaCaption: {
    fontSize: 11,
    color: "#4A4A4A",
    margin: 0,
    letterSpacing: "0.05em",
  },

  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#1C1C1C",
    borderRadius: 24,
    padding: "40px 32px",
    width: "100%",
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    border: "1px solid #2A2A2A",
  },
  modalIcon: {
    fontSize: 48,
    lineHeight: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#F5F5F0",
    margin: 0,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B6B6B",
    margin: 0,
  },
  modalOrderId: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#0F0F0F",
    borderRadius: 12,
    padding: "16px 32px",
    gap: 4,
    width: "100%",
    marginTop: 8,
  },
  modalOrderIdLabel: {
    fontSize: 10,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  modalOrderIdValue: {
    fontSize: 22,
    fontWeight: 700,
    color: "#F97316",
    letterSpacing: "0.05em",
  },
  modalButton: {
    width: "100%",
    backgroundColor: "#F97316",
    color: "#0F0F0F",
    border: "none",
    borderRadius: 12,
    padding: "16px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
  },
};
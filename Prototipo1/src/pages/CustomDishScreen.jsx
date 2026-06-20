// src/pages/CustomDishScreen.jsx

import React, { useState, useCallback, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useRecipeLoader } from "../hooks/useRecipeLoader";
import { usePricingCalculator } from "../hooks/usePricingCalculator";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { arrowBackOutline, documentTextOutline, cartOutline } from "ionicons/icons";

// ─── SUBCOMPONENTES ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={styles.centered}>
      <div style={styles.spinner} />
      <p style={styles.loadingText}>Cargando tu platillo de precisión...</p>
    </div>
  );
}

function ErrorScreen({ message, onGoBack }) {
  return (
    <div style={styles.centered}>
      <p style={{ ...styles.loadingText, color: "#EF4444" }}>⚠️ {message}</p>
      <button style={styles.backBtnInline} onClick={onGoBack}>
        Volver al Menú
      </button>
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
        <span style={styles.ingredientName}>
          {ingredient.icon || "🥗"} {ingredient.name}
        </span>
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

function OrderSuccessModal({ isPrescription, patientName, orderId, onGoBack, onGoCart }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalCard}>
        <div style={styles.modalIcon}>{isPrescription ? "🩺" : "🛒"}</div>
        <h2 style={styles.modalTitle}>
          {isPrescription ? "¡Receta Enviada!" : "Añadido al Carrito"}
        </h2>
        <p style={styles.modalSubtitle}>
          {isPrescription
            ? `Tu paciente ${patientName} recibirá una notificación con la orden pre-armada lista para pagar.`
            : "El platillo personalizado se ha agregado a tu carrito."}
        </p>

        {isPrescription ? (
          <div style={styles.modalOrderId}>
            <span style={styles.modalOrderIdLabel}>ESTADO</span>
            <span style={{ ...styles.modalOrderIdValue, color: "#A78BFA" }}>PENDIENTE</span>
          </div>
        ) : (
          <div style={styles.modalOrderId}>
            <span style={styles.modalOrderIdLabel}>PRECIO UNITARIO</span>
            <span style={styles.modalOrderIdValue}>${orderId} MXN</span>
          </div>
        )}

        <div style={styles.modalBtnColumn}>
          {isPrescription ? (
            <button style={styles.modalPrimaryButton} onClick={onGoBack}>
              Volver al Dashboard
            </button>
          ) : (
            <>
              <button style={styles.modalPrimaryButton} onClick={onGoCart}>
                Ir al Carrito
              </button>
              <button style={styles.modalSecondaryButton} onClick={onGoBack}>
                Seguir Comprando
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PANTALLA PRINCIPAL ───────────────────────────────────────────────────────

export default function CustomDishScreen() {
  const { recipeId } = useParams();
  const history = useHistory();
  const { activeRole, patientSelector, addToCart, sendPrescription, setPatientSelector, restaurants } = useApp();

  const activeRecipeId = recipeId || "recipe_tazon_teriyaki";
  const { recipe, ingredients, loading, error } = useRecipeLoader(activeRecipeId);

  // gramsMap: { [ingredientId]: number }
  const [gramsMap, setGramsMap] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  const handleAction = async () => {
    if (!recipe || ingredients.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const customizedItem = {
      recipeId: recipe.id,
      recipeName: recipe.name,
      imageUrl: recipe.imageUrl,
      gramsMap: { ...gramsMap },
      finalPrice: finalPrice,
      macros: { ...macros },
      breakdown: [...breakdown],
      ingredientCost,
      productionCost
    };

    try {
      if (activeRole === "nutriologist" && patientSelector) {
        // Mode: Send Prescription to Patient
        const res = await sendPrescription(
          patientSelector.patientEmail,
          recipe.id,
          recipe.name,
          recipe.imageUrl,
          gramsMap,
          finalPrice,
          macros,
          breakdown
        );
        if (res.success) {
          setShowSuccessModal(true);
        } else {
          setSubmitError("No se pudo enviar la receta.");
        }
      } else {
        // Mode: Add to Cart
        addToCart(customizedItem);
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error("Error executing action:", err);
      setSubmitError("No se pudo procesar tu solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (activeRole === "nutriologist" && patientSelector && showSuccessModal) {
      // Clear patient selector after successful prescription and go to dashboard
      setPatientSelector(null);
      history.push("/nutri-dashboard");
    } else {
      history.push("/home");
    }
  };

  const handleGoCart = () => {
    history.push("/cart");
  };

  // ─── RENDERS CONDICIONALES ─────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onGoBack={() => history.push("/home")} />;
  if (!recipe) return null;

  const isPrescribing = activeRole === "nutriologist" && patientSelector;
  const restaurant = restaurants?.find(r => r.id === recipe.restaurantId);

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <div style={styles.screen}>
          
          {/* Modal de éxito */}
          {showSuccessModal && (
            <OrderSuccessModal
              isPrescription={isPrescribing}
              patientName={patientSelector?.patientName}
              orderId={finalPrice.toFixed(2)}
              onGoBack={handleGoBack}
              onGoCart={handleGoCart}
            />
          )}

          {/* Floating Back Button */}
          <button style={styles.floatingBackBtn} onClick={() => history.push("/home")}>
            <IonIcon icon={arrowBackOutline} style={styles.backIcon} />
          </button>

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
              <span style={{ 
                ...styles.heroEyebrow,
                color: isPrescribing ? "#A78BFA" : "#F97316"
              }}>
                {isPrescribing ? `🩺 Recetando a ${patientSelector.patientName}` : "Personaliza tu platillo"}
              </span>
              <h1 style={styles.heroTitle}>{recipe.name}</h1>
              <span style={styles.heroPrepTime}>
                ⏱ {recipe.estimatedPrepTime} min de preparación · {restaurant ? restaurant.name : "Nomi Kitchen"}
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
              {isPrescribing ? "Costo aproximado para el paciente" : "Precio final · se actualiza en tiempo real"}
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
            <h2 style={styles.sectionTitle}>Macros de precisión</h2>
            <p style={styles.sectionSubtitle}>
              Mueve los deslizadores para ajustar los gramos exactos de la receta.
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
            <h3 style={styles.costBreakdownTitle}>Desglose del Costo</h3>
            <div style={styles.costRow}>
              <span style={styles.costLabel}>Ingredientes gramados</span>
              <span style={styles.costValue}>${ingredientCost.toFixed(2)}</span>
            </div>
            <div style={styles.costRow}>
              <span style={styles.costLabel}>Empaque y preparación fija</span>
              <span style={styles.costValue}>${productionCost.toFixed(2)}</span>
            </div>
            <div style={styles.costDivider} />
            <div style={styles.costRow}>
              <span style={{ ...styles.costLabel, color: "#F5F5F0", fontWeight: 700 }}>
                Total sugerido
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

          {/* ── BOTÓN ACCIÓN CENTRAL ── */}
          <div style={styles.ctaSection}>
            <button
              style={{
                ...styles.ctaButton,
                backgroundColor: isPrescribing ? "#A78BFA" : "#F97316",
                opacity: isSubmitting ? 0.6 : 1,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
              onClick={handleAction}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Procesando..."
                : isPrescribing
                ? `Enviar Receta · $${finalPrice.toFixed(2)} MXN`
                : `Añadir al Carrito · $${finalPrice.toFixed(2)}`}
            </button>
            <p style={styles.ctaCaption}>
              {isPrescribing
                ? "Se guardará en el buzón médico del paciente de forma instantánea"
                : "Puedes continuar modificando o agregar más platillos a tu orden"}
            </p>
          </div>

          {/* Espaciado inferior para móvil */}
          <div style={{ height: 60 }} />

          {/* Estilos globales del slider nativo */}
          <style>{`
            input[type="range"] {
              -webkit-appearance: none;
              appearance: none;
              width: 100%;
              height: 4px;
              background: #2D2D37;
              outline: none;
              cursor: pointer;
              border-radius: 2px;
            }
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 26px;
              height: 26px;
              border-radius: 50%;
              background: #F97316;
              cursor: pointer;
              border: 3px solid #131316;
              box-shadow: 0 0 10px rgba(249, 115, 22, 0.4);
              transition: transform 0.15s ease, background-color 0.15s ease;
            }
            input[type="range"]::-webkit-slider-thumb:active {
              transform: scale(1.2);
              background: #FFA366;
            }
            input[type="range"]::-moz-range-thumb {
              width: 26px;
              height: 26px;
              border-radius: 50%;
              background: #F97316;
              cursor: pointer;
              border: 3px solid #131316;
              box-shadow: 0 0 10px rgba(249, 115, 22, 0.4);
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
    backgroundColor: "#0B0B0C",
    minHeight: "100vh",
    maxWidth: 480,
    margin: "0 auto",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#F8FAFC",
    position: "relative"
  },
  floatingBackBtn: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 99,
    width: 44,
    height: 44,
    borderRadius: "50%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#F8FAFC"
  },
  backIcon: {
    fontSize: 20
  },
  backBtnInline: {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "#F8FAFC",
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 12
  },
  centered: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#0B0B0C",
    gap: 16,
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid #1C1C24",
    borderTop: "3px solid #F97316",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "#94A3B8",
    fontSize: 14,
    letterSpacing: "0.02em",
  },

  // Hero
  hero: {
    position: "relative",
    height: 280,
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
      "linear-gradient(to bottom, rgba(11,11,12,0.1) 0%, rgba(11,11,12,0.98) 100%)",
  },
  heroContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: "#F8FAFC",
    margin: 0,
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
  },
  heroPrepTime: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
  },

  // Precio
  priceSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px 20px 20px",
    gap: 8,
  },
  pricePill: {
    display: "flex",
    alignItems: "flex-start",
    gap: 4,
  },
  priceCurrency: {
    fontSize: 20,
    fontWeight: 400,
    color: "#F97316",
    paddingTop: 12,
  },
  priceAmount: {
    fontSize: 72,
    fontWeight: 800,
    color: "#F97316",
    lineHeight: 1,
    letterSpacing: "-0.04em",
  },
  priceCaption: {
    fontSize: 11,
    color: "#64748B",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    margin: 0,
  },

  // Macros
  macrosSection: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0 20px 24px",
    gap: 8,
  },
  macroBadge: {
    flex: 1,
    backgroundColor: "#131316",
    border: "1px solid #222227",
    borderRadius: 14,
    padding: "12px 6px",
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
    fontSize: 9,
    color: "#64748B",
    fontWeight: 400,
  },
  macroLabel: {
    fontSize: 9,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginTop: 4,
    fontWeight: 600
  },

  // Sliders
  slidersSection: {
    padding: "0 20px",
    display: "flex",
    flexDirection: "column",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#F8FAFC",
    margin: "0 0 4px 0",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    margin: "0 0 20px 0",
    lineHeight: 1.4
  },
  sliderCard: {
    backgroundColor: "#131316",
    borderRadius: 20,
    padding: "20px",
    marginBottom: 16,
    border: "1px solid #222227",
  },
  sliderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#F8FAFC",
  },
  gramsDisplay: {
    display: "flex",
    alignItems: "baseline",
    gap: 2,
    backgroundColor: "#0B0B0C",
    padding: "6px 12px",
    borderRadius: 10,
    border: "1px solid #1C1C24"
  },
  gramsValue: {
    fontSize: 18,
    fontWeight: 800,
    color: "#F97316",
  },
  gramsUnit: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: 500,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: "#222227",
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
    color: "#64748B",
    fontWeight: 500
  },
  ingNutrition: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 12,
    borderTop: "1px solid #222227",
  },
  ingNutritionItem: {
    fontSize: 10,
    color: "#94A3B8",
    backgroundColor: "#0B0B0C",
    padding: "3px 8px",
    borderRadius: 6,
    border: "1px solid #1C1C24"
  },

  // Desglose de costos
  costBreakdown: {
    margin: "12px 20px 0",
    backgroundColor: "#131316",
    borderRadius: 20,
    padding: "20px",
    border: "1px solid #222227",
  },
  costBreakdownTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 14px 0",
  },
  costRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  costLabel: {
    fontSize: 13,
    color: "#94A3B8",
  },
  costValue: {
    fontSize: 13,
    color: "#F8FAFC",
    fontWeight: 600,
  },
  costDivider: {
    height: 1,
    backgroundColor: "#222227",
    margin: "12px 0",
  },

  // Error
  errorBanner: {
    margin: "16px 20px 0",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: 14,
    padding: "12px 16px",
    fontSize: 13,
    color: "#EF4444",
  },

  // CTA
  ctaSection: {
    padding: "24px 20px 48px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  ctaButton: {
    width: "100%",
    color: "#000000",
    border: "none",
    borderRadius: 16,
    padding: "18px 24px",
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: "-0.01em",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)",
  },
  ctaCaption: {
    fontSize: 11,
    color: "#64748B",
    margin: 0,
    lineHeight: 1.4,
    textAlign: "center",
  },

  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
    backdropFilter: "blur(4px)"
  },
  modalCard: {
    backgroundColor: "#131316",
    borderRadius: 24,
    padding: "36px 24px",
    width: "100%",
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    border: "1px solid #222227",
    boxShadow: "0 15px 40px rgba(0,0,0,0.6)"
  },
  modalIcon: {
    fontSize: 48,
    lineHeight: 1,
    marginBottom: 8
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#F8FAFC",
    margin: 0,
    letterSpacing: "-0.01em"
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    margin: 0,
    textAlign: "center",
    lineHeight: 1.5,
    padding: "0 8px"
  },
  modalOrderId: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#0B0B0C",
    borderRadius: 14,
    padding: "12px 24px",
    gap: 4,
    width: "100%",
    marginTop: 8,
    border: "1px solid #222227"
  },
  modalOrderIdLabel: {
    fontSize: 10,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  modalOrderIdValue: {
    fontSize: 20,
    fontWeight: 800,
    color: "#F97316",
  },
  modalBtnColumn: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 16
  },
  modalPrimaryButton: {
    width: "100%",
    backgroundColor: "#F97316",
    color: "#000000",
    border: "none",
    borderRadius: 14,
    padding: "15px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  modalSecondaryButton: {
    width: "100%",
    backgroundColor: "transparent",
    color: "#94A3B8",
    border: "1px solid #222227",
    borderRadius: 14,
    padding: "14px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  }
};
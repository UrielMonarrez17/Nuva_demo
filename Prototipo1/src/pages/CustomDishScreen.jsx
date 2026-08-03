import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useHistory, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useRecipeLoader } from "../hooks/useRecipeLoader";
import { useMenu } from "../hooks/useMenu";
import { IonPage, IonContent, useIonViewWillEnter, IonIcon } from "@ionic/react";
import { arrowBackOutline, removeOutline, addOutline } from "ionicons/icons";

function MacroProgressBar({ label, current, target, colorClass }) {
  if (!target || target <= 0) target = 1; 
  const diff = current - target;
  let statusText = "";
  let statusColor = "";
  let progressColor = colorClass;

  if (diff > target * 0.1) {
    statusText = `Excedente: +${diff.toFixed(1)}g`;
    statusColor = "text-red-400";
    progressColor = "bg-red-500";
  } else if (diff < -target * 0.1) {
    statusText = `Faltan: ${Math.abs(diff).toFixed(1)}g`;
    statusColor = "text-yellow-400";
    progressColor = "bg-yellow-500";
  } else {
    statusText = "¡Excelente!";
    statusColor = "text-emerald-400";
    progressColor = "bg-emerald-500";
  }

  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400 font-bold uppercase tracking-wider">{label}</span>
        <span className={`${statusColor} font-bold`}>{statusText}</span>
      </div>
      <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${progressColor} transition-all duration-300 ease-out`} style={{ width: `${percentage}%` }}></div>
      </div>
      <div className="flex justify-between text-[10px] mt-1.5 text-zinc-500 font-medium">
        <span>Actual: {current.toFixed(1)}g</span>
        <span>Meta: {target.toFixed(1)}g</span>
      </div>
    </div>
  );
}

function OrderSuccessModal({ isPrescription, patientName, orderId, onGoBack, onGoCart }) {
  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[1000] p-5 backdrop-blur-md">
      <div className="bg-zinc-900 rounded-[28px] p-8 w-full max-w-sm flex flex-col items-center gap-3 border border-zinc-800 shadow-2xl">
        <div className="text-6xl mb-2">{isPrescription ? "🩺" : "🛒"}</div>
        <h2 className="text-2xl font-black text-white m-0 tracking-tight">
          {isPrescription ? "¡Receta Enviada!" : "Añadido al Carrito"}
        </h2>
        <p className="text-sm text-zinc-400 text-center leading-relaxed">
          {isPrescription
            ? `Tu paciente ${patientName} recibirá una notificación con la orden lista.`
            : "El platillo personalizado se ha agregado a tu carrito."}
        </p>

        <div className="flex flex-col items-center bg-zinc-950 rounded-2xl p-4 gap-1 w-full mt-4 border border-zinc-800">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{isPrescription ? "ESTADO" : "TOTAL"}</span>
          <span className={`text-xl font-black ${isPrescription ? 'text-orange-500' : 'text-white'}`}>
            {isPrescription ? "PENDIENTE" : `$${orderId} MXN`}
          </span>
        </div>

        <div className="w-full flex flex-col gap-3 mt-6">
          {isPrescription ? (
            <button className="w-full bg-orange-600 text-white rounded-xl py-4 text-sm font-bold hover:bg-orange-500 transition-colors" onClick={onGoBack}>
              Volver al Dashboard
            </button>
          ) : (
            <>
              <button className="w-full bg-orange-600 text-white rounded-xl py-4 text-sm font-bold hover:bg-orange-500 transition-colors" onClick={onGoCart}>
                Ir al Carrito
              </button>
              <button className="w-full bg-transparent text-zinc-400 border border-zinc-800 rounded-xl py-4 text-sm font-bold hover:bg-zinc-800 transition-colors" onClick={onGoBack}>
                Seguir Comprando
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomDishScreen() {
  const { recipeId } = useParams();
  const history = useHistory();
  const location = useLocation();
  const { activeRole, patientSelector, addToCart, sendPrescription, setPatientSelector, nutritionalPlan, redeemPrescription, userProfile } = useApp();

  const activeRecipeId = recipeId || "recipe_tazon_teriyaki";
  
  const { recipe, loading: recipeLoading, error: recipeError } = useRecipeLoader(activeRecipeId);
  const { ingredients: allMenu, loading: menuLoading } = useMenu("rest_1");

  const [portionsMap, setPortionsMap] = useState({});
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useIonViewWillEnter(() => {
    setShowSuccessModal(false);
    setSubmitError(null);
  });

  const recipeIngredients = useMemo(() => {
    if (!recipe || !allMenu.length) return [];
    return allMenu.filter(ing => {
      const allowed = recipe.allowedIngredients || [];
      return allowed.includes(ing.masterIngredientId) || 
             allowed.includes(ing.id) ||
             allowed.includes(`ing_${ing.masterIngredientId}`) ||
             allowed.includes(ing.name.toLowerCase().replace(" ", "_"));
    });
  }, [recipe, allMenu]);

  useEffect(() => {
    if (recipeIngredients.length > 0 && Object.keys(portionsMap).length === 0) {
      const initialMap = {};
      recipeIngredients.forEach(ing => {
        initialMap[ing.id] = 1; // Default 1 porción
      });
      setPortionsMap(initialMap);
    }
  }, [recipeIngredients, portionsMap]);

  const activePlan = nutritionalPlan || (userProfile?.targetMacros ? {
    kcalLimit: userProfile.targetMacros.kcalLimit,
    proteinLimit: userProfile.targetMacros.proteinLimit,
    carbLimit: userProfile.targetMacros.carbLimit,
    fatLimit: userProfile.targetMacros.fatLimit,
    periodType: userProfile.targetMacros.periodType || "day"
  } : null);

  const handlePortionChange = useCallback((id, change) => {
    setPortionsMap(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + change);
      return { ...prev, [id]: next };
    });
  }, []);

  const handleOptionToggle = (option) => {
    setSelectedOptions((prev) => {
      const exists = prev.some((o) => o.name === option.name);
      if (exists) return prev.filter((o) => o.name !== option.name);
      return [...prev, option];
    });
  };

  // Local Pricing and Macros Calculation based on unified schema
  const { finalPrice, macros } = useMemo(() => {
    let totalPrecio = recipe?.fixedCost || 0;
    const totalMacros = { protein: 0, carbs: 0, fats: 0, kcal: 0 };

    recipeIngredients.forEach(ing => {
      const portions = portionsMap[ing.id] || 0;
      totalPrecio += portions * (ing.pricePerPortion || 0);

      const grams = portions * (ing.gramsPerPortion || 0);
      const m = ing.macrosPerGram || { protein: 0, carbs: 0, fats: 0, kcal: 0 };
      
      totalMacros.protein += grams * (m.protein || 0);
      totalMacros.carbs += grams * (m.carbs || 0);
      totalMacros.fats += grams * (m.fats || 0);
      totalMacros.kcal += grams * (m.kcal || 0);
    });

    selectedOptions.forEach(opt => { totalPrecio += opt.price || 0; });

    return { 
      finalPrice: Math.max(totalPrecio, 0),
      macros: totalMacros
    };
  }, [portionsMap, recipeIngredients, recipe, selectedOptions]);

  const dietTargetProtein = activePlan ? (activePlan.periodType === "day" ? activePlan.proteinLimit / 3 : activePlan.proteinLimit) : 0;
  const dietTargetCarbs = activePlan ? (activePlan.periodType === "day" ? activePlan.carbLimit / 3 : activePlan.carbLimit) : 0;
  const dietTargetFat = activePlan ? (activePlan.periodType === "day" ? activePlan.fatLimit / 3 : activePlan.fatLimit) : 0;

  const handleAction = async () => {
    if (!recipe || recipeIngredients.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const breakdown = recipeIngredients
      .filter(ing => (portionsMap[ing.id] || 0) > 0)
      .map(ing => ({
        id: ing.id,
        name: ing.name,
        grams: (portionsMap[ing.id] || 0) * (ing.gramsPerPortion || 1)
      }));

    const customizedItem = {
      recipeId: recipe.id,
      recipeName: recipe.name,
      imageUrl: recipe.imageUrl,
      portionsMap: { ...portionsMap },
      finalPrice,
      macros: { ...macros },
      selectedOptions,
      breakdown // Included for CartScreen compatibility
    };

    try {
      if (activeRole === "nutriologist" && patientSelector) {
        const res = await sendPrescription(
          patientSelector.patientEmail,
          recipe.id,
          recipe.name,
          recipe.imageUrl,
          portionsMap,
          finalPrice,
          macros,
          breakdown
        );
        if (res.success) setShowSuccessModal(true);
        else setSubmitError("No se pudo enviar la receta.");
      } else {
        addToCart(customizedItem);
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error(err);
      setSubmitError("No se pudo procesar tu solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    setShowSuccessModal(false);
    if (activeRole === "nutriologist" && patientSelector && showSuccessModal) {
      setPatientSelector(null);
      history.push("/nutri-dashboard");
    } else {
      history.push("/home");
    }
  };

  const handleGoCart = () => {
    setShowSuccessModal(false);
    history.push("/cart");
  };

  if (recipeLoading || menuLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 gap-4">
      <div className="w-10 h-10 border-4 border-zinc-800 border-t-orange-500 rounded-full animate-spin"></div>
      <p className="text-zinc-500 font-bold text-sm tracking-widest uppercase">Cargando Menú...</p>
    </div>
  );

  if (recipeError || !recipe) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 gap-4">
      <p className="text-red-500 font-bold">⚠️ {recipeError || "Receta no encontrada"}</p>
      <button className="bg-zinc-800 text-white font-bold px-6 py-3 rounded-xl" onClick={() => history.push("/home")}>Volver al Inicio</button>
    </div>
  );

  const isPrescribing = activeRole === "nutriologist" && patientSelector;

  return (
    <IonPage>
      <IonContent scrollY={true} className="bg-zinc-950">
        <div className="bg-zinc-950 min-h-screen text-white pb-40 font-sans">
          
          {showSuccessModal && (
            <OrderSuccessModal
              isPrescription={isPrescribing}
              patientName={patientSelector?.patientName}
              orderId={finalPrice.toFixed(2)}
              onGoBack={handleGoBack}
              onGoCart={handleGoCart}
            />
          )}

          <button 
            className="absolute top-6 left-6 z-50 w-12 h-12 rounded-full bg-black/50 backdrop-blur-lg border border-white/10 flex items-center justify-center text-white transition-transform active:scale-95"
            onClick={() => history.push("/home")}
          >
            <IonIcon icon={arrowBackOutline} className="text-2xl" />
          </button>

          {/* 1. Header & Dish Info */}
          <div className="relative h-80 w-full max-w-[480px] mx-auto overflow-hidden">
            <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover scale-105" onError={(e) => { e.target.style.display = "none"; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-black/20"></div>
            <div className="absolute bottom-8 left-6 right-6">
               <p className="text-orange-500 text-xs font-black tracking-widest uppercase mb-2 drop-shadow-md">
                 {isPrescribing ? `🩺 Recetando a ${patientSelector.patientName}` : recipe.category || "Personalizar"}
               </p>
               <h1 className="text-4xl font-black text-white leading-tight mb-2 tracking-tighter drop-shadow-lg">{recipe.name}</h1>
               <div className="flex items-baseline gap-1 mt-2 drop-shadow-md">
                 <span className="text-2xl font-bold text-orange-500">$</span>
                 <span className="text-6xl font-black text-orange-500 tracking-tighter">{finalPrice.toFixed(2)}</span>
               </div>
            </div>
          </div>

          <div className="max-w-[480px] mx-auto">
            {/* 2. Global Macro Panel */}
            <div className="px-6 -mt-4 mb-8 relative z-10">
              <div className="bg-zinc-900 rounded-[28px] p-6 shadow-2xl border border-zinc-800/80 backdrop-blur-xl">
                {activePlan ? (
                  <div className="space-y-5">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="text-white font-black text-lg tracking-tight">Smart Dashboard</h3>
                       <span className="text-[10px] bg-orange-500/20 text-orange-400 font-bold px-2.5 py-1.5 rounded-md tracking-widest uppercase border border-orange-500/20">Dieta</span>
                    </div>
                    <MacroProgressBar label="Proteína" current={macros.protein} target={dietTargetProtein} colorClass="bg-orange-500" />
                    <MacroProgressBar label="Carbohidratos" current={macros.carbs} target={dietTargetCarbs} colorClass="bg-orange-500" />
                    <MacroProgressBar label="Grasas" current={macros.fats} target={dietTargetFat} colorClass="bg-orange-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                       <h3 className="text-white font-black text-lg tracking-tight">Resumen Nutricional</h3>
                       <span className="text-[10px] bg-zinc-800 text-zinc-300 font-bold px-2.5 py-1.5 rounded-md tracking-widest uppercase">Libre</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <div className="flex-1 bg-zinc-950 px-3 py-4 rounded-2xl border border-zinc-800/80 text-center flex flex-col items-center justify-center">
                          <p className="text-zinc-500 text-[11px] uppercase font-bold tracking-widest mb-1.5">Prot</p>
                          <p className="text-white font-black text-2xl">{macros.protein.toFixed(0)}<span className="text-sm text-zinc-500 ml-0.5">g</span></p>
                      </div>
                      <div className="flex-1 bg-zinc-950 px-3 py-4 rounded-2xl border border-zinc-800/80 text-center flex flex-col items-center justify-center">
                          <p className="text-zinc-500 text-[11px] uppercase font-bold tracking-widest mb-1.5">Carb</p>
                          <p className="text-white font-black text-2xl">{macros.carbs.toFixed(0)}<span className="text-sm text-zinc-500 ml-0.5">g</span></p>
                      </div>
                      <div className="flex-1 bg-zinc-950 px-3 py-4 rounded-2xl border border-zinc-800/80 text-center flex flex-col items-center justify-center">
                          <p className="text-zinc-500 text-[11px] uppercase font-bold tracking-widest mb-1.5">Grasa</p>
                          <p className="text-white font-black text-2xl">{macros.fats.toFixed(0)}<span className="text-sm text-zinc-500 ml-0.5">g</span></p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Lista de Ingredientes (Steppers) */}
            <div className="px-6">
              <h2 className="text-xl font-black text-white mb-5 tracking-tight">Personalizar Porciones</h2>
              
              {recipeIngredients.map(ing => {
                const portions = portionsMap[ing.id] || 0;
                return (
                  <div key={ing.id} className={`bg-zinc-900 rounded-[24px] p-5 mb-4 border border-zinc-800/50 transition-opacity duration-300 ${portions === 0 ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-white font-bold text-lg block mb-1">{ing.name}</span>
                            <span className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">
                              {ing.foodGroup}
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-orange-500 font-black text-base">+${ing.pricePerPortion}</span>
                            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mt-1">/ {ing.gramsPerPortion}g</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-2xl border border-zinc-800/50">
                        <button 
                          onClick={() => handlePortionChange(ing.id, -0.5)}
                          className="w-12 h-12 flex items-center justify-center rounded-xl bg-zinc-900 text-white active:scale-90 transition-transform disabled:opacity-50"
                          disabled={portions === 0}
                        >
                          <IonIcon icon={removeOutline} className="text-2xl" />
                        </button>
                        
                        <div className="flex flex-col items-center w-20">
                          <span className="text-2xl font-black text-white leading-none">{portions}</span>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Porciones</span>
                        </div>

                        <button 
                          onClick={() => handlePortionChange(ing.id, 0.5)}
                          className="w-12 h-12 flex items-center justify-center rounded-xl bg-orange-500 text-black active:scale-90 transition-transform"
                        >
                          <IonIcon icon={addOutline} className="text-2xl" />
                        </button>
                      </div>
                  </div>
                );
              })}
            </div>

            {submitError && (
              <div className="mx-6 mt-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                <span className="text-red-400 text-sm font-bold">⚠️ {submitError}</span>
              </div>
            )}
            
            <div className="h-10"></div>
          </div>

          {/* CTA Button Fixed Bottom */}
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#09090b] via-[#09090b]/90 to-transparent z-50 flex flex-col justify-end pointer-events-none pb-[calc(1.5rem+env(safe-area-inset-bottom,20px))]">
            <div className="w-full max-w-[480px] mx-auto pointer-events-auto">
              <button
                onClick={handleAction}
                disabled={isSubmitting}
                className="w-full bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-black text-lg py-5 rounded-[24px] shadow-[0_10px_40px_rgba(234,88,12,0.4)] transition-all hover:bg-orange-500 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
              >
                {isSubmitting
                  ? "Procesando..."
                  : isPrescribing
                  ? `Enviar Receta · $${finalPrice.toFixed(2)}`
                  : `Añadir · $${finalPrice.toFixed(2)}`}
              </button>
            </div>
          </div>
          
        </div>
      </IonContent>
    </IonPage>
  );
}

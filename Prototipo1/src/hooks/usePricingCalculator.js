// src/hooks/usePricingCalculator.js

import { useState, useEffect, useCallback } from "react";

// ─── CONSTANTES DE NEGOCIO ────────────────────────────────────────────────────

const PRICE_MULTIPLIER = 3;
const MINIMUM_PRICE = 90;

// ─── HELPERS PUROS (sin efectos secundarios, fáciles de testear) ──────────────

/**
 * Calcula el costo total de los ingredientes seleccionados.
 * @param {Array} selectedIngredients - [{ costPerGram, grams }, ...]
 * @returns {number} costo en MXN
 */
function calcIngredientCost(selectedIngredients) {
  return selectedIngredients.reduce((total, ingredient) => {
    const grams = ingredient.grams ?? 0;
    const costPerGram = ingredient.costPerGram ?? 0;
    return total + grams * costPerGram;
  }, 0);
}

/**
 * Aplica la fórmula de precio final de Nomi.
 * precioFinal = (costoIngredientes + fixedCost) * 3
 * Si el resultado es menor a $90, el precio final es $90.
 * @param {number} ingredientCost
 * @param {number} fixedCost
 * @returns {number} precio final en MXN
 */
function calcFinalPrice(ingredientCost, fixedCost) {
  const productionCost = ingredientCost + fixedCost;
  const rawPrice = productionCost * PRICE_MULTIPLIER;
  return Math.max(rawPrice, MINIMUM_PRICE);
}

/**
 * Calcula los macronutrientes totales de los ingredientes seleccionados.
 * @param {Array} selectedIngredients - [{ proteinPerGram, carbPerGram, fatPerGram, kcalPerGram, grams }, ...]
 * @returns {{ protein: number, carbs: number, fats: number, kcal: number }}
 */
function calcMacros(selectedIngredients) {
  return selectedIngredients.reduce(
    (totals, ingredient) => {
      const grams = ingredient.grams ?? 0;
      return {
        protein: totals.protein + grams * (ingredient.proteinPerGram ?? 0),
        carbs: totals.carbs + grams * (ingredient.carbPerGram ?? 0),
        fats: totals.fats + grams * (ingredient.fatPerGram ?? 0),
        kcal: totals.kcal + grams * (ingredient.kcalPerGram ?? 0),
      };
    },
    { protein: 0, carbs: 0, fats: 0, kcal: 0 }
  );
}

/**
 * Redondea todos los valores de un objeto de macros a 1 decimal.
 * @param {{ protein: number, carbs: number, fats: number, kcal: number }} macros
 * @returns {{ protein: number, carbs: number, fats: number, kcal: number }}
 */
function roundMacros(macros) {
  return {
    protein: Math.round(macros.protein * 10) / 10,
    carbs: Math.round(macros.carbs * 10) / 10,
    fats: Math.round(macros.fats * 10) / 10,
    kcal: Math.round(macros.kcal * 10) / 10,
  };
}

// ─── ESTADO INICIAL ───────────────────────────────────────────────────────────

const INITIAL_STATE = {
  ingredientCost: 0,
  productionCost: 0,
  finalPrice: MINIMUM_PRICE,
  macros: { protein: 0, carbs: 0, fats: 0, kcal: 0 },
  breakdown: [],
};

// ─── HOOK PRINCIPAL ───────────────────────────────────────────────────────────

/**
 * Hook que calcula precio y macros en tiempo real para un platillo de Nomi.
 *
 * @param {Array}  selectedIngredients - Lista de ingredientes con gramos seleccionados.
 *   Cada elemento debe tener la forma:
 *   {
 *     id: string,
 *     name: string,
 *     grams: number,          ← gramos seleccionados por el usuario (slider)
 *     costPerGram: number,
 *     proteinPerGram: number,
 *     carbPerGram: number,
 *     fatPerGram: number,
 *     kcalPerGram: number,
 *   }
 * @param {number} fixedCost - Costo fijo del platillo base (viene de base_recipes.fixedCost).
 *
 * @returns {{
 *   ingredientCost: number,   ← suma de (gramos * costPerGram)
 *   productionCost: number,   ← ingredientCost + fixedCost
 *   finalPrice: number,       ← productionCost * 3, mínimo $90
 *   macros: {
 *     protein: number,        ← gramos de proteína total
 *     carbs: number,          ← gramos de carbohidratos total
 *     fats: number,           ← gramos de grasas total
 *     kcal: number,           ← kilocalorías totales
 *   },
 *   breakdown: Array,         ← detalle por ingrediente (para mostrar en UI)
 *   recalculate: Function,    ← función para forzar recalculo manual si se necesita
 * }}
 */
export function usePricingCalculator(selectedIngredients = [], fixedCost = 0) {
  const [result, setResult] = useState(INITIAL_STATE);

  const calculate = useCallback(() => {
    // Si no hay ingredientes seleccionados, regresamos el estado inicial
    if (!selectedIngredients || selectedIngredients.length === 0) {
      setResult(INITIAL_STATE);
      return;
    }

    const ingredientCost = calcIngredientCost(selectedIngredients);
    const productionCost = ingredientCost + fixedCost;
    const finalPrice = calcFinalPrice(ingredientCost, fixedCost);
    const rawMacros = calcMacros(selectedIngredients);
    const macros = roundMacros(rawMacros);

    // Breakdown: detalle individual por ingrediente, útil para mostrar en la UI
    // y para guardar en Firestore dentro de orders.items.customizedIngredients
    const breakdown = selectedIngredients.map((ingredient) => {
      const grams = ingredient.grams ?? 0;
      return {
        id: ingredient.id,
        name: ingredient.name,
        grams,
        subtotalCost: Math.round(grams * ingredient.costPerGram * 100) / 100,
        macros: roundMacros({
          protein: grams * (ingredient.proteinPerGram ?? 0),
          carbs: grams * (ingredient.carbPerGram ?? 0),
          fats: grams * (ingredient.fatPerGram ?? 0),
          kcal: grams * (ingredient.kcalPerGram ?? 0),
        }),
      };
    });

    setResult({
      ingredientCost: Math.round(ingredientCost * 100) / 100,
      productionCost: Math.round(productionCost * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
      macros,
      breakdown,
    });
  }, [selectedIngredients, fixedCost]);

  // Se recalcula automáticamente cada vez que cambian los gramos o el fixedCost
  useEffect(() => {
    calculate();
  }, [calculate]);

  return {
    ...result,
    recalculate: calculate,
  };
}
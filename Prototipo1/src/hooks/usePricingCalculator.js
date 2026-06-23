// src/hooks/usePricingCalculator.js

import { useMemo } from "react";

// ─── CONSTANTES DE NEGOCIO ────────────────────────────────────────────────────
const PRICE_MULTIPLIER = 3;
const MINIMUM_PRICE = 90;

/**
 * Hook que calcula el precio y macros en tiempo real para un platillo de Nomi.
 * 
 * @param {Array} unifiedIngredients - Array de ingredientes unificados (con macros y precio).
 * @param {Object|number} gramsSelection - Objeto { [ingId]: gramos } seleccionado por el cliente, 
 *                                        o fixedCost si se usa la firma anterior.
 * @param {number} fixedCost - Costo fijo (si se usa la nueva firma).
 * 
 * @returns {{
 *   ingredientCost: number,
 *   productionCost: number,
 *   finalPrice: number,
 *   macros: { protein: number, carbs: number, fats: number, kcal: number },
 *   breakdown: Array,
 *   recalculate: Function
 * }}
 */
export function usePricingCalculator(unifiedIngredients = [], gramsSelection = {}, fixedCost = 0) {
  return useMemo(() => {
    let ingredients = unifiedIngredients || [];
    let selection = gramsSelection;
    let costBase = fixedCost;

    // Soporte para firma anterior: usePricingCalculator(selectedIngredients = [], fixedCost = 0)
    if (typeof gramsSelection === "number") {
      costBase = gramsSelection;
      selection = {};
      ingredients = unifiedIngredients.map((ing) => {
        if (ing && ing.id) {
          selection[ing.id] = ing.grams ?? 0;
        }
        return ing;
      });
    }

    // 1. Calcular el Costo de los Ingredientes
    const ingredientCost = ingredients.reduce((total, ing) => {
      if (!ing) return total;
      // Buscamos los gramos por el id unificado o por masterIngredientId
      const grams = selection[ing.id] ?? selection[ing.masterIngredientId] ?? ing.grams ?? 0;
      const price = ing.pricePerGram ?? ing.costPerGram ?? 0;
      return total + grams * price;
    }, 0);

    // 2. Aplicar la regla de precio final de Nomi: (Costo Ingredientes + Costo Fijo) * 3 con un mínimo de $90 MXN
    const productionCost = ingredientCost + costBase;
    const rawPrice = productionCost * PRICE_MULTIPLIER;
    const finalPrice = Math.max(rawPrice, MINIMUM_PRICE);

    // 3. Calcular los Macros Totales sumados
    const rawMacros = ingredients.reduce(
      (totals, ing) => {
        if (!ing) return totals;
        const grams = selection[ing.id] ?? selection[ing.masterIngredientId] ?? ing.grams ?? 0;
        return {
          protein: totals.protein + grams * (ing.proteinPerGram ?? 0),
          carbs: totals.carbs + grams * (ing.carbPerGram ?? 0),
          fats: totals.fats + grams * (ing.fatPerGram ?? 0),
          kcal: totals.kcal + grams * (ing.kcalPerGram ?? 0),
        };
      },
      { protein: 0, carbs: 0, fats: 0, kcal: 0 }
    );

    // Función auxiliar para redondear macros a 1 decimal
    const roundToOneDecimal = (num) => Math.round(num * 10) / 10;

    const macros = {
      protein: roundToOneDecimal(rawMacros.protein),
      carbs: roundToOneDecimal(rawMacros.carbs),
      fats: roundToOneDecimal(rawMacros.fats),
      kcal: roundToOneDecimal(rawMacros.kcal),
    };

    // 4. Calcular el desglose detallado para la UI
    const breakdown = ingredients.map((ing) => {
      const grams = selection[ing.id] ?? selection[ing.masterIngredientId] ?? ing.grams ?? 0;
      const price = ing.pricePerGram ?? ing.costPerGram ?? 0;
      return {
        id: ing.id,
        masterIngredientId: ing.masterIngredientId || ing.id,
        name: ing.name,
        grams,
        averageWeightPerUnit: ing.averageWeightPerUnit || 0,
        unitName: ing.unitName || "",
        defaultGrams: ing.defaultGrams || 100,
        subtotalCost: Math.round(grams * price * 100) / 100,
        macros: {
          protein: roundToOneDecimal(grams * (ing.proteinPerGram ?? 0)),
          carbs: roundToOneDecimal(grams * (ing.carbPerGram ?? 0)),
          fats: roundToOneDecimal(grams * (ing.fatPerGram ?? 0)),
          kcal: roundToOneDecimal(grams * (ing.kcalPerGram ?? 0)),
        },
      };
    });

    return {
      ingredientCost: Math.round(ingredientCost * 100) / 100,
      productionCost: Math.round(productionCost * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
      macros,
      breakdown,
      recalculate: () => {}, // mantener compatibilidad
    };
  }, [unifiedIngredients, gramsSelection, fixedCost]);
}
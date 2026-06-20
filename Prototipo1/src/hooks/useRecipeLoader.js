// src/hooks/useRecipeLoader.js

import { useState, useEffect } from "react";
import { db } from "../firebase/firebaseconfig";
import { doc, getDoc } from "firebase/firestore";

// High-fidelity Mock Data Fallback
const FALLBACK_INGREDIENTS = {
  ing_pollo: {
    id: "ing_pollo",
    name: "Pollo Deshebrado",
    costPerGram: 0.14,
    kcalPerGram: 1.65,
    proteinPerGram: 0.31,
    carbPerGram: 0.0,
    fatPerGram: 0.03,
    minGrams: 50,
    maxGrams: 300,
    defaultGrams: 150,
    unit: "g"
  },
  ing_arroz: {
    id: "ing_arroz",
    name: "Arroz Integral",
    costPerGram: 0.02,
    kcalPerGram: 1.3,
    proteinPerGram: 0.027,
    carbPerGram: 0.28,
    fatPerGram: 0.003,
    minGrams: 50,
    maxGrams: 300,
    defaultGrams: 100,
    unit: "g"
  },
  ing_aguacate: {
    id: "ing_aguacate",
    name: "Aguacate Hass",
    costPerGram: 0.06,
    kcalPerGram: 1.6,
    proteinPerGram: 0.02,
    carbPerGram: 0.085,
    fatPerGram: 0.15,
    minGrams: 20,
    maxGrams: 150,
    defaultGrams: 60,
    unit: "g"
  },
  ing_salmon: {
    id: "ing_salmon",
    name: "Salmón Grillado",
    costPerGram: 0.22,
    kcalPerGram: 2.06,
    proteinPerGram: 0.22,
    carbPerGram: 0.0,
    fatPerGram: 0.13,
    minGrams: 50,
    maxGrams: 250,
    defaultGrams: 120,
    unit: "g"
  },
  ing_quinoa: {
    id: "ing_quinoa",
    name: "Quinoa Orgánica",
    costPerGram: 0.04,
    kcalPerGram: 1.2,
    proteinPerGram: 0.04,
    carbPerGram: 0.21,
    fatPerGram: 0.02,
    minGrams: 50,
    maxGrams: 250,
    defaultGrams: 100,
    unit: "g"
  },
  ing_tofu: {
    id: "ing_tofu",
    name: "Tofu Marinado",
    costPerGram: 0.08,
    kcalPerGram: 1.44,
    proteinPerGram: 0.15,
    carbPerGram: 0.04,
    fatPerGram: 0.08,
    minGrams: 50,
    maxGrams: 300,
    defaultGrams: 120,
    unit: "g"
  }
};

const FALLBACK_RECIPES = {
  recipe_tazon_teriyaki: {
    id: "recipe_tazon_teriyaki",
    name: "Tazón Teriyaki de Pollo",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
    fixedCost: 15,
    allowedIngredients: ["ing_pollo", "ing_arroz", "ing_aguacate"],
    description: "Tazón de arroz integral caliente, pechuga de pollo tierna bañado en salsa teriyaki baja en sodio y aguacate.",
    estimatedPrepTime: 12,
    category: "Bowl",
    tags: ["Alto en Proteína", "Bajo en Grasa", "Popular"]
  },
  recipe_salmon_quinoa: {
    id: "recipe_salmon_quinoa",
    name: "Salmón Bowl & Quinoa",
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80",
    fixedCost: 20,
    allowedIngredients: ["ing_salmon", "ing_quinoa", "ing_aguacate"],
    description: "Salmón a la plancha sobre una base de quinoa ligera, acompañado de rebanadas de aguacate fresco.",
    estimatedPrepTime: 15,
    category: "Bowl",
    tags: ["Omega 3", "Keto", "Premium"]
  },
  recipe_wrap_fit: {
    id: "recipe_wrap_fit",
    name: "Wrap Proteico de Tofu",
    imageUrl: "https://images.unsplash.com/photo-1626700051175-6518c4793f4f?w=800&q=80",
    fixedCost: 10,
    allowedIngredients: ["ing_tofu", "ing_quinoa", "ing_aguacate"],
    description: "Una tortilla integral grande rellena de quinoa sazonada, tofu marinado y aguacate cremoso.",
    estimatedPrepTime: 8,
    category: "Wrap",
    tags: ["Vegano", "Fibra Alta"]
  }
};

import { useApp } from "../context/AppContext";

/**
 * Hook que carga una receta base y todos sus ingredientes permitidos desde el estado global,
 * con fallback instantáneo a datos mockeados locales en caso de fallar o no encontrar los IDs.
 * @param {string} recipeId - ID de la receta
 * @returns {{ recipe, ingredients, loading, error }}
 */
export function useRecipeLoader(recipeId) {
  const { recipes, ingredients: globalIngredients } = useApp();
  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!recipeId) return;

    setLoading(true);
    setError(null);

    // 1. Buscar la receta en el estado global o en los datos locales
    let recipeData = recipes.find(r => r.id === recipeId);
    if (!recipeData) {
      if (FALLBACK_RECIPES[recipeId]) {
        recipeData = FALLBACK_RECIPES[recipeId];
      } else {
        setError(`Receta con ID "${recipeId}" no encontrada.`);
        setLoading(false);
        return;
      }
    }

    // 2. Buscar ingredientes permitidos
    const validIngredients = recipeData.allowedIngredients
      .map((ingredientId) => {
        const globalIng = globalIngredients.find(ing => ing.id === ingredientId);
        return globalIng || FALLBACK_INGREDIENTS[ingredientId] || null;
      })
      .filter(Boolean);

    setRecipe(recipeData);
    setIngredients(validIngredients);
    setLoading(false);

  }, [recipeId, recipes, globalIngredients]);

  return { recipe, ingredients, loading, error };
}
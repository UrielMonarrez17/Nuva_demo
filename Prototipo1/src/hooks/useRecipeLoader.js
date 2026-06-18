// src/hooks/useRecipeLoader.js

import { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

/**
 * Hook que carga una receta base y todos sus ingredientes permitidos desde Firestore.
 * @param {string} recipeId - ID del documento en la colección base_recipes
 * @returns {{ recipe, ingredients, loading, error }}
 */
export function useRecipeLoader(recipeId) {
  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!recipeId) return;

    async function loadRecipeAndIngredients() {
      setLoading(true);
      setError(null);

      try {
        // 1. Cargar la receta base
        const recipeRef = doc(db, "base_recipes", recipeId);
        const recipeSnap = await getDoc(recipeRef);

        if (!recipeSnap.exists()) {
          throw new Error(`Receta con ID "${recipeId}" no encontrada.`);
        }

        const recipeData = { id: recipeSnap.id, ...recipeSnap.data() };

        // 2. Cargar cada ingrediente permitido por su ID explícito
        const ingredientPromises = recipeData.allowedIngredients.map(
          async (ingredientId) => {
            const ingRef = doc(db, "ingredients", ingredientId);
            const ingSnap = await getDoc(ingRef);

            if (!ingSnap.exists()) {
              console.warn(`Ingrediente "${ingredientId}" no encontrado en Firestore.`);
              return null;
            }

            return { id: ingSnap.id, ...ingSnap.data() };
          }
        );

        const ingredientResults = await Promise.all(ingredientPromises);

        // Filtrar nulos en caso de que algún ingrediente no exista
        const validIngredients = ingredientResults.filter(Boolean);

        setRecipe(recipeData);
        setIngredients(validIngredients);
      } catch (err) {
        console.error("Error cargando receta:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadRecipeAndIngredients();
  }, [recipeId]);

  return { recipe, ingredients, loading, error };
}
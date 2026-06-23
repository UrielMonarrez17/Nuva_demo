import { useState, useEffect } from "react";
import { db } from "../firebase/firebaseconfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

/**
 * Hook to retrieve restaurant-specific ingredients combined with their master nutritional details.
 * 
 * @param {string} restaurantId - The ID of the restaurant to fetch ingredients for.
 * @returns {{ menuIngredients: Array, loading: boolean, error: any }}
 */
export function useRestaurantMenu(restaurantId) {
  const [menuIngredients, setMenuIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!restaurantId) {
      setMenuIngredients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribeRestIngredients = () => {};
    let unsubscribeMasterIngredients = () => {};

    try {
      let restIngredientsMap = {};
      let masterIngredientsMap = {};

      const handleMerge = (restMap, masterMap) => {
        const unified = Object.values(restMap).map((restIng) => {
          const masterIng = masterMap[restIng.masterIngredientId] || {};
          return {
            id: restIng.id, // restaurant ingredient document ID
            restaurantId: restIng.restaurantId,
            masterIngredientId: restIng.masterIngredientId,
            pricePerGram: restIng.pricePerGram,
            isAvailable: restIng.isAvailable !== false,
            // Joined fields from master_ingredients
            name: masterIng.name || "Ingrediente Desconocido",
            kcalPerGram: masterIng.kcalPerGram ?? 0,
            proteinPerGram: masterIng.proteinPerGram ?? 0,
            carbPerGram: masterIng.carbPerGram ?? 0,
            fatPerGram: masterIng.fatPerGram ?? 0,
            defaultGrams: masterIng.defaultGrams ?? 100,
            minGrams: masterIng.minGrams ?? 0,
            maxGrams: masterIng.maxGrams ?? 999,
            unit: masterIng.unit || "g",
            unitName: masterIng.unitName || "porción",
            averageWeightPerUnit: masterIng.averageWeightPerUnit || 100,
          };
        });
        setMenuIngredients(unified);
      };

      // 1. Subscribe to master_ingredients
      const masterColRef = collection(db, "master_ingredients");
      unsubscribeMasterIngredients = onSnapshot(
        masterColRef,
        (masterSnapshot) => {
          const newMasterMap = {};
          masterSnapshot.forEach((doc) => {
            newMasterMap[doc.id] = { id: doc.id, ...doc.data() };
          });
          masterIngredientsMap = newMasterMap;
          handleMerge(restIngredientsMap, masterIngredientsMap);
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching master_ingredients in useRestaurantMenu:", err);
          setError(err);
          setLoading(false);
        }
      );

      // 2. Subscribe to restaurant_ingredients filtered by restaurantId
      const restIngQuery = query(
        collection(db, "restaurant_ingredients"),
        where("restaurantId", "==", restaurantId)
      );
      
      unsubscribeRestIngredients = onSnapshot(
        restIngQuery,
        (restSnapshot) => {
          const newRestMap = {};
          restSnapshot.forEach((doc) => {
            newRestMap[doc.id] = { id: doc.id, ...doc.data() };
          });
          restIngredientsMap = newRestMap;
          handleMerge(restIngredientsMap, masterIngredientsMap);
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching restaurant_ingredients in useRestaurantMenu:", err);
          setError(err);
          setLoading(false);
        }
      );

    } catch (err) {
      console.error("Error in useRestaurantMenu hook setup:", err);
      setError(err);
      setLoading(false);
    }

    return () => {
      unsubscribeRestIngredients();
      unsubscribeMasterIngredients();
    };
  }, [restaurantId]);

  return { menuIngredients, loading, error };
}

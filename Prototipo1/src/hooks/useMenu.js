// src/hooks/useMenu.js
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseconfig';

const MOCK_MASTER_INGREDIENTS = {
  "pollo": {
    id: "pollo",
    name: "Pollo Deshebrado",
    foodGroup: "Proteína",
    macrosPerGram: { kcal: 1.65, protein: 0.31, carbs: 0, fats: 0.03 },
    smaeEquivalentGrams: 30,
    visualMeasure: { unitName: "taza", averageWeight: 90 }
  },
  "arroz": {
    id: "arroz",
    name: "Arroz Integral",
    foodGroup: "Cereal",
    macrosPerGram: { kcal: 1.3, protein: 0.027, carbs: 0.28, fats: 0.003 },
    smaeEquivalentGrams: 45,
    visualMeasure: { unitName: "taza", averageWeight: 120 }
  },
  "aguacate": {
    id: "aguacate",
    name: "Aguacate Hass",
    foodGroup: "Grasa",
    macrosPerGram: { kcal: 1.6, protein: 0.02, carbs: 0.085, fats: 0.15 },
    smaeEquivalentGrams: 30,
    visualMeasure: { unitName: "pieza", averageWeight: 150 }
  },
  "salmon": {
    id: "salmon",
    name: "Salmón Grillado",
    foodGroup: "Proteína",
    macrosPerGram: { kcal: 2.06, protein: 0.22, carbs: 0, fats: 0.13 },
    smaeEquivalentGrams: 40,
    visualMeasure: { unitName: "filete", averageWeight: 120 }
  },
  "quinoa": {
    id: "quinoa",
    name: "Quinoa Orgánica",
    foodGroup: "Cereal",
    macrosPerGram: { kcal: 1.2, protein: 0.04, carbs: 0.21, fats: 0.02 },
    smaeEquivalentGrams: 40,
    visualMeasure: { unitName: "taza", averageWeight: 100 }
  },
  "tofu": {
    id: "tofu",
    name: "Tofu Marinado",
    foodGroup: "Proteína Vegetal",
    macrosPerGram: { kcal: 1.44, protein: 0.15, carbs: 0.04, fats: 0.08 },
    smaeEquivalentGrams: 50,
    visualMeasure: { unitName: "bloque", averageWeight: 120 }
  }
};

const MOCK_RESTAURANT_INGREDIENTS = [
  { id: "rest_pollo", masterIngredientId: "pollo", restaurantId: "rest_1", pricePerPortion: 15, gramsPerPortion: 30, isAvailable: true },
  { id: "rest_arroz", masterIngredientId: "arroz", restaurantId: "rest_1", pricePerPortion: 8, gramsPerPortion: 45, isAvailable: true },
  { id: "rest_aguacate", masterIngredientId: "aguacate", restaurantId: "rest_1", pricePerPortion: 12, gramsPerPortion: 30, isAvailable: true },
  { id: "rest_salmon", masterIngredientId: "salmon", restaurantId: "rest_1", pricePerPortion: 25, gramsPerPortion: 40, isAvailable: true },
  { id: "rest_quinoa", masterIngredientId: "quinoa", restaurantId: "rest_1", pricePerPortion: 10, gramsPerPortion: 40, isAvailable: true },
  { id: "rest_tofu", masterIngredientId: "tofu", restaurantId: "rest_1", pricePerPortion: 14, gramsPerPortion: 50, isAvailable: true }
];

export function useMenu(restaurantId) {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchMenu = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const masterRef = collection(db, 'master_ingredients');
        const restIngRef = collection(db, 'restaurant_ingredients');
        
        const [masterSnap, restSnap] = await Promise.all([
          getDocs(masterRef),
          getDocs(restIngRef)
        ]);

        const masterMap = {};
        masterSnap.forEach(doc => {
          masterMap[doc.id] = { id: doc.id, ...doc.data() };
        });

        const unifiedMenu = [];
        restSnap.forEach(doc => {
          const restData = doc.data();
          if ((!restaurantId || restData.restaurantId === restaurantId) && restData.isAvailable) {
            const masterData = masterMap[restData.masterIngredientId];
            if (masterData) {
              unifiedMenu.push({
                ...masterData,
                ...restData,
                id: doc.id, // ID from restaurant_ingredients
                masterIngredientId: masterData.id
              });
            }
          }
        });

        // Fallback to mock data if Firestore is empty (for demo purposes)
        if (unifiedMenu.length === 0) {
          MOCK_RESTAURANT_INGREDIENTS.forEach(restData => {
            if (!restaurantId || restData.restaurantId === restaurantId || restaurantId === "rest_1" || restaurantId === undefined) {
              const masterData = MOCK_MASTER_INGREDIENTS[restData.masterIngredientId];
              if (masterData && restData.isAvailable) {
                unifiedMenu.push({
                  ...masterData,
                  ...restData,
                  id: restData.id,
                  masterIngredientId: masterData.id
                });
              }
            }
          });
        }

        if (isMounted) setIngredients(unifiedMenu);
      } catch (err) {
        console.error("Error fetching menu:", err);
        // Fallback to mock data
        const unifiedMenu = [];
        MOCK_RESTAURANT_INGREDIENTS.forEach(restData => {
          const masterData = MOCK_MASTER_INGREDIENTS[restData.masterIngredientId];
          if (masterData && restData.isAvailable) {
            unifiedMenu.push({
              ...masterData,
              ...restData,
              id: restData.id,
              masterIngredientId: masterData.id
            });
          }
        });
        if (isMounted) setIngredients(unifiedMenu);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMenu();

    return () => {
      isMounted = false;
    };
  }, [restaurantId]);

  return { ingredients, loading, error };
}

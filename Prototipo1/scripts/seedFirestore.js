// scripts/seedFirestore.js

import { readFileSync } from "fs";
// The following lines are removed as they are for CommonJS require and not needed with ES modules:
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);

// Import specific functions from the modular Firebase Admin SDK
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Carga las credenciales del Service Account
const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

// Initialize the app using the imported initializeApp and cert functions
initializeApp({
  credential: cert(serviceAccount),
});

// Get the Firestore instance using the imported getFirestore function
const db = getFirestore();

// ─── DATOS DE PRUEBA ──────────────────────────────────────────────────────────

const INGREDIENT_IDS = {
  pollo: "ing_pollo",
  arroz: "ing_arroz",
  aguacate: "ing_aguacate",
  salmon: "ing_salmon",
  quinoa: "ing_quinoa",
  tofu: "ing_tofu",
  brocoli: "ing_brocoli",
  manzana: "ing_manzana",
  avena: "ing_avena",
};

const ingredients = [
  {
    id: INGREDIENT_IDS.pollo,
    data: {
      name: "Pollo",
      costPerGram: 0.14,
      kcalPerGram: 1.65,
      proteinPerGram: 0.31,
      carbPerGram: 0.0,
      fatPerGram: 0.03,
      minGrams: 50,
      maxGrams: 300,
      defaultGrams: 150,
      unit: "g",
    },
  },
  {
    id: INGREDIENT_IDS.arroz,
    data: {
      name: "Arroz",
      costPerGram: 0.02,
      kcalPerGram: 1.3,
      proteinPerGram: 0.027,
      carbPerGram: 0.28,
      fatPerGram: 0.003,
      minGrams: 50,
      maxGrams: 300,
      defaultGrams: 100,
      unit: "g",
    },
  },
  {
    id: INGREDIENT_IDS.aguacate,
    data: {
      name: "Aguacate",
      costPerGram: 0.06,
      kcalPerGram: 1.6,
      proteinPerGram: 0.02,
      carbPerGram: 0.085,
      fatPerGram: 0.15,
      minGrams: 20,
      maxGrams: 150,
      defaultGrams: 60,
      unit: "g",
    },
  },
  {
    id: INGREDIENT_IDS.salmon,
    data: {
      name: "Salmón",
      costPerGram: 0.28,
      kcalPerGram: 2.08,
      proteinPerGram: 0.20,
      carbPerGram: 0.0,
      fatPerGram: 0.13,
      minGrams: 50,
      maxGrams: 250,
      defaultGrams: 120,
      unit: "g",
    },
  },
  {
    id: INGREDIENT_IDS.quinoa,
    data: {
      name: "Quinoa",
      costPerGram: 0.05,
      kcalPerGram: 1.20,
      proteinPerGram: 0.04,
      carbPerGram: 0.21,
      fatPerGram: 0.02,
      minGrams: 50,
      maxGrams: 250,
      defaultGrams: 80,
      unit: "g",
    },
  },
  {
    id: INGREDIENT_IDS.tofu,
    data: {
      name: "Tofu",
      costPerGram: 0.08,
      kcalPerGram: 0.76,
      proteinPerGram: 0.08,
      carbPerGram: 0.02,
      fatPerGram: 0.05,
      minGrams: 50,
      maxGrams: 300,
      defaultGrams: 150,
      unit: "g",
    },
  },
  {
    id: INGREDIENT_IDS.brocoli,
    data: {
      name: "Brócoli",
      costPerGram: 0.015,
      kcalPerGram: 0.34,
      proteinPerGram: 0.028,
      carbPerGram: 0.066,
      fatPerGram: 0.004,
      minGrams: 20,
      maxGrams: 200,
      defaultGrams: 80,
      unit: "g",
    },
  },
  {
    id: INGREDIENT_IDS.manzana,
    data: {
      name: "Manzana en cubos",
      costPerGram: 0.02,
      kcalPerGram: 0.52,
      proteinPerGram: 0.003,
      carbPerGram: 0.14,
      fatPerGram: 0.002,
      minGrams: 20,
      maxGrams: 150,
      defaultGrams: 50,
      unit: "g",
    },
  },
  {
    id: INGREDIENT_IDS.avena,
    data: {
      name: "Avena",
      costPerGram: 0.01,
      kcalPerGram: 3.89,
      proteinPerGram: 0.169,
      carbPerGram: 0.663,
      fatPerGram: 0.069,
      minGrams: 20,
      maxGrams: 150,
      defaultGrams: 40,
      unit: "g",
    },
  },
];

const baseRecipes = [
  {
    id: "recipe_tazon_teriyaki",
    data: {
      name: "Tazón Teriyaki",
      imageUrl:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
      fixedCost: 15,
      allowedIngredients: [
        INGREDIENT_IDS.pollo,
        INGREDIENT_IDS.arroz,
        INGREDIENT_IDS.aguacate,
        INGREDIENT_IDS.brocoli,
      ],
      description:
        "Tazón de arroz integral caliente, pechuga de pollo tierna bañado en salsa teriyaki baja en sodio, aguacate y brócoli fresco.",
      estimatedPrepTime: 12,
      tags: ["alto-proteina", "sin-gluten", "popular"],
      restaurantId: "rest_nativa",
    },
  },
  {
    id: "recipe_salmon_quinoa",
    data: {
      name: "Salmón Bowl & Quinoa",
      imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80",
      fixedCost: 20,
      allowedIngredients: [
        INGREDIENT_IDS.salmon,
        INGREDIENT_IDS.quinoa,
        INGREDIENT_IDS.aguacate,
        INGREDIENT_IDS.brocoli,
      ],
      description: "Salmón a la plancha sobre una base de quinoa ligera, acompañado de rebanadas de aguacate fresco y brócoli.",
      estimatedPrepTime: 15,
      tags: ["Omega 3", "Keto", "Premium"],
      restaurantId: "rest_green",
    },
  },
  {
    id: "recipe_wrap_fit",
    data: {
      name: "Wrap Proteico de Tofu",
      imageUrl: "https://images.unsplash.com/photo-1626700051175-6518c4793f4f?w=800&q=80",
      fixedCost: 10,
      allowedIngredients: [
        INGREDIENT_IDS.tofu,
        INGREDIENT_IDS.quinoa,
        INGREDIENT_IDS.aguacate,
      ],
      description: "Una tortilla integral grande rellena de quinoa sazonada, tofu marinado y aguacate cremoso.",
      estimatedPrepTime: 8,
      tags: ["Vegano", "Fibra Alta"],
      restaurantId: "rest_nativa",
    },
  },
  {
    id: "recipe_avena_fruta",
    data: {
      name: "Bowl de Avena y Manzana",
      imageUrl: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&q=80",
      fixedCost: 12,
      allowedIngredients: [
        INGREDIENT_IDS.avena,
        INGREDIENT_IDS.manzana,
      ],
      description: "Bowl de avena calientita con trozos de manzana fresca, ideal para un desayuno energético.",
      estimatedPrepTime: 10,
      tags: ["Desayuno", "Energía", "Dulce"],
      restaurantId: "rest_green",
    },
  },
  {
    id: "recipe_pollo_brocoli",
    data: {
      name: "Pollo con Brócoli y Arroz",
      imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80",
      fixedCost: 18,
      allowedIngredients: [
        INGREDIENT_IDS.pollo,
        INGREDIENT_IDS.brocoli,
        INGREDIENT_IDS.arroz,
      ],
      description: "Clásico plato de pollo a la plancha acompañado de brócoli al vapor y arroz blanco, perfecto para ganar masa muscular.",
      estimatedPrepTime: 15,
      tags: ["Clásico", "Alto en Proteína"],
      restaurantId: "rest_nativa",
    },
  },
  {
    id: "recipe_bowl_vegano",
    data: {
      name: "Bowl Vegano de Tofu y Quinoa",
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
      fixedCost: 16,
      allowedIngredients: [
        INGREDIENT_IDS.tofu,
        INGREDIENT_IDS.quinoa,
        INGREDIENT_IDS.brocoli,
        INGREDIENT_IDS.aguacate,
      ],
      description: "Bowl nutritivo con tofu crujiente, base de quinoa, brócoli fresco y rebanadas de aguacate.",
      estimatedPrepTime: 12,
      tags: ["Vegano", "Ligero"],
      restaurantId: "rest_green",
    },
  },
  {
    id: "recipe_avena_horneada",
    data: {
      name: "Avena Horneada con Manzana",
      imageUrl: "https://images.unsplash.com/photo-1600336153113-d66c79de3f90?w=800&q=80",
      fixedCost: 14,
      allowedIngredients: [
        INGREDIENT_IDS.avena,
        INGREDIENT_IDS.manzana,
      ],
      description: "Deliciosa avena horneada con toques de canela y trozos de manzana caramelizada. Un desayuno reconfortante.",
      estimatedPrepTime: 20,
      tags: ["Dulce", "Fibra"],
      restaurantId: "rest_green",
    },
  },
];

const restaurants = [
  {
    id: "rest_nativa",
    data: {
      name: "Nativa Dark Kitchen",
      address: "Condesa, CDMX",
      lat: 19.414,
      lng: -99.171,
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80",
      rating: 4.8,
      deliveryTime: "25-35 min"
    }
  },
  {
    id: "rest_green",
    data: {
      name: "Green Lab Co.",
      address: "Polanco, CDMX",
      lat: 19.432,
      lng: -99.192,
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80",
      rating: 4.9,
      deliveryTime: "30-45 min"
    }
  }
];

// ─── FUNCIONES DE SEED ────────────────────────────────────────────────────────

async function seedIngredients(batch) {
  console.log("📦 Preparando ingredientes...");

  for (const ingredient of ingredients) {
    const ref = db.collection("ingredients").doc(ingredient.id);
    batch.set(ref, ingredient.data);
    console.log(
      `   ✔ Ingrediente preparado: ${ingredient.data.name} (${ingredient.id})`
    );
  }
}

async function seedBaseRecipes(batch) {
  console.log("🍽️  Preparando recetas base...");

  for (const recipe of baseRecipes) {
    const ref = db.collection("base_recipes").doc(recipe.id);
    batch.set(ref, recipe.data);
    console.log(
      `   ✔ Receta preparada: ${recipe.data.name} (${recipe.id})`
    );
  }
}

async function seedRestaurants(batch) {
  console.log("🏪 Preparando restaurantes...");

  for (const rest of restaurants) {
    const ref = db.collection("restaurants").doc(rest.id);
    batch.set(ref, rest.data);
    console.log(
      `   ✔ Restaurante preparado: ${rest.data.name} (${rest.id})`
    );
  }
}

async function runSeed() {
  console.log("🚀 Iniciando seed de Firestore para Nomi...\n");

  try {
    const batch = db.batch();

    await seedIngredients(batch);
    await seedBaseRecipes(batch);
    await seedRestaurants(batch);

    console.log("\n⏳ Enviando datos a Firestore...");
    await batch.commit();

    console.log("\n✅ Seed completado exitosamente.");
    console.log("   Colección 'ingredients': 3 documentos creados.");
    console.log("   Colección 'base_recipes': 1 documento creado.");
    console.log("   Colección 'restaurants': 2 documentos creados.");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error durante el seed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

runSeed();

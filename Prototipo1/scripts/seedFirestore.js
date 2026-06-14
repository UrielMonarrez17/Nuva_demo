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
      ],
      description:
        "Tazón de arroz con pollo glaseado en salsa teriyaki y aguacate fresco.",
      estimatedPrepTime: 12,
      tags: ["alto-proteina", "sin-gluten", "popular"],
    },
  },
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

async function runSeed() {
  console.log("🚀 Iniciando seed de Firestore para Nomi...\n");

  try {
    const batch = db.batch();

    await seedIngredients(batch);
    await seedBaseRecipes(batch);

    console.log("\n⏳ Enviando datos a Firestore...");
    await batch.commit();

    console.log("\n✅ Seed completado exitosamente.");
    console.log("   Colección 'ingredients': 3 documentos creados.");
    console.log("   Colección 'base_recipes': 1 documento creado.");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error durante el seed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

runSeed();

import { db } from './src/firebase/firebaseconfig.js';
import { collection, doc, setDoc } from 'firebase/firestore';

const masterIngredients = [
  // --- PROTEÍNAS (AOA) ---
  {
    id: "pollo_asado",
    name: "Pechuga de Pollo Asada",
    foodGroup: "Alimentos de Origen Animal (Muy bajo aporte de grasa)",
    // Ref: USDA (Chicken breast, roasted) -> 100g: 165 kcal, 31g prot, 0g carb, 3.6g fat
    macrosPerGram: { kcal: 1.65, protein: 0.31, carbs: 0, fats: 0.036 },
    // Ref: SMAE 1 Equivalente AOA muy bajo aporte de grasa
    smaeEquivalentGrams: 30,
    visualMeasure: { unitName: "milanesa", averageWeight: 90 }
  },
  {
    id: "res_asada",
    name: "Filete de Res Asado",
    foodGroup: "Alimentos de Origen Animal (Bajo aporte de grasa)",
    // Ref: USDA (Beef, tenderloin, roasted) -> 100g: 223 kcal, 27g prot, 0g carb, 12g fat
    macrosPerGram: { kcal: 2.23, protein: 0.27, carbs: 0, fats: 0.12 },
    // Ref: SMAE 1 Equivalente AOA bajo aporte de grasa
    smaeEquivalentGrams: 30,
    visualMeasure: { unitName: "filete", averageWeight: 120 }
  },
  {
    id: "salmon_horno",
    name: "Salmón al Horno",
    foodGroup: "Alimentos de Origen Animal (Alto aporte de grasa)",
    // Ref: USDA (Salmon, baked) -> 100g: 206 kcal, 22g prot, 0g carb, 12.3g fat
    macrosPerGram: { kcal: 2.06, protein: 0.22, carbs: 0, fats: 0.123 },
    // Ref: SMAE 1 Equivalente AOA
    smaeEquivalentGrams: 30,
    visualMeasure: { unitName: "filete", averageWeight: 150 }
  },
  {
    id: "cerdo_asado",
    name: "Lomo de Cerdo Asado",
    foodGroup: "Alimentos de Origen Animal (Muy bajo aporte de grasa)",
    // Ref: USDA (Pork, loin, roasted) -> 100g: 143 kcal, 26g prot, 0g carb, 3.5g fat
    macrosPerGram: { kcal: 1.43, protein: 0.26, carbs: 0, fats: 0.035 },
    // Ref: SMAE 1 Equivalente AOA
    smaeEquivalentGrams: 30,
    visualMeasure: { unitName: "rebanada", averageWeight: 60 }
  },
  {
    id: "atun_drenado",
    name: "Atún en Agua Drenado",
    foodGroup: "Alimentos de Origen Animal (Muy bajo aporte de grasa)",
    // Ref: USDA (Tuna, canned in water, drained) -> 100g: 116 kcal, 25.5g prot, 0g carb, 0.8g fat
    macrosPerGram: { kcal: 1.16, protein: 0.255, carbs: 0, fats: 0.008 },
    // Ref: SMAE 1 Equivalente AOA
    smaeEquivalentGrams: 30,
    visualMeasure: { unitName: "lata pequeña", averageWeight: 90 }
  },
  {
    id: "huevo_cocido",
    name: "Huevo Cocido",
    foodGroup: "Alimentos de Origen Animal (Moderado aporte de grasa)",
    // Ref: USDA (Egg, whole, boiled) -> 100g: 155 kcal, 12.6g prot, 1.1g carb, 10.6g fat
    macrosPerGram: { kcal: 1.55, protein: 0.126, carbs: 0.011, fats: 0.106 },
    // Ref: SMAE 1 Equivalente = 1 pieza (aprox 50g)
    smaeEquivalentGrams: 50,
    visualMeasure: { unitName: "pieza", averageWeight: 50 }
  },
  {
    id: "queso_panela",
    name: "Queso Panela",
    foodGroup: "Alimentos de Origen Animal (Moderado aporte de grasa)",
    // Ref: USDA/Tablas MX (Queso panela) -> 100g: 279 kcal, 18g prot, 3g carb, 21g fat
    macrosPerGram: { kcal: 2.79, protein: 0.18, carbs: 0.03, fats: 0.21 },
    // Ref: SMAE 1 Equivalente AOA
    smaeEquivalentGrams: 40,
    visualMeasure: { unitName: "rebanada gruesa", averageWeight: 40 }
  },
  {
    id: "tofu_firme",
    name: "Tofu Firme",
    foodGroup: "Leguminosas / Sustituto AOA",
    // Ref: USDA (Tofu, firm, prepared) -> 100g: 144 kcal, 15.8g prot, 2.8g carb, 8.7g fat
    macrosPerGram: { kcal: 1.44, protein: 0.158, carbs: 0.028, fats: 0.087 },
    // Ref: SMAE 1 Equivalente
    smaeEquivalentGrams: 65,
    visualMeasure: { unitName: "rebanada", averageWeight: 65 }
  },

  // --- CEREALES Y TUBÉRCULOS ---
  {
    id: "arroz_blanco",
    name: "Arroz Blanco Cocido",
    foodGroup: "Cereal sin grasa",
    // Ref: USDA (Rice, white, long-grain, cooked) -> 100g: 130 kcal, 2.69g prot, 28g carb, 0.28g fat
    macrosPerGram: { kcal: 1.30, protein: 0.027, carbs: 0.28, fats: 0.003 },
    // Ref: SMAE 1 Equivalente = 1/4 taza (aprox 47g)
    smaeEquivalentGrams: 47,
    visualMeasure: { unitName: "taza", averageWeight: 188 }
  },
  {
    id: "pasta_trigo",
    name: "Pasta de Trigo Cocida",
    foodGroup: "Cereal sin grasa",
    // Ref: USDA (Pasta, cooked, unenriched) -> 100g: 158 kcal, 5.8g prot, 30.8g carb, 0.9g fat
    macrosPerGram: { kcal: 1.58, protein: 0.058, carbs: 0.308, fats: 0.009 },
    // Ref: SMAE 1 Equivalente = 1/2 taza (aprox 70g)
    smaeEquivalentGrams: 70,
    visualMeasure: { unitName: "taza", averageWeight: 140 }
  },
  {
    id: "papa_horneada",
    name: "Papa Horneada",
    foodGroup: "Cereal sin grasa",
    // Ref: USDA (Potato, baked, flesh and skin) -> 100g: 93 kcal, 2.5g prot, 21g carb, 0.1g fat
    macrosPerGram: { kcal: 0.93, protein: 0.025, carbs: 0.21, fats: 0.001 },
    // Ref: SMAE 1 Equivalente = 1/2 pieza (aprox 85g)
    smaeEquivalentGrams: 85,
    visualMeasure: { unitName: "pieza", averageWeight: 170 }
  },
  {
    id: "quinoa_cocida",
    name: "Quinoa Cocida",
    foodGroup: "Cereal sin grasa",
    // Ref: USDA (Quinoa, cooked) -> 100g: 120 kcal, 4.4g prot, 21.3g carb, 1.9g fat
    macrosPerGram: { kcal: 1.20, protein: 0.044, carbs: 0.213, fats: 0.019 },
    // Ref: SMAE 1 Equivalente = 1/4 taza (aprox 46g)
    smaeEquivalentGrams: 46,
    visualMeasure: { unitName: "taza", averageWeight: 185 }
  },
  {
    id: "avena_cocida",
    name: "Avena Cocida",
    foodGroup: "Cereal sin grasa",
    // Ref: USDA (Oats, cooked with water) -> 100g: 71 kcal, 2.5g prot, 12g carb, 1.5g fat
    macrosPerGram: { kcal: 0.71, protein: 0.025, carbs: 0.12, fats: 0.015 },
    // Ref: SMAE 1 Equivalente = 3/4 taza cocida (aprox 115g, derivado de 30g crudo)
    smaeEquivalentGrams: 115,
    visualMeasure: { unitName: "taza", averageWeight: 153 }
  },
  {
    id: "maiz_elote",
    name: "Maíz Desgranado Cocido (Elote)",
    foodGroup: "Cereal sin grasa",
    // Ref: USDA (Corn, sweet, cooked) -> 100g: 96 kcal, 3.4g prot, 21g carb, 1.5g fat
    macrosPerGram: { kcal: 0.96, protein: 0.034, carbs: 0.21, fats: 0.015 },
    // Ref: SMAE 1 Equivalente = 1/2 taza (aprox 82g)
    smaeEquivalentGrams: 82,
    visualMeasure: { unitName: "taza", averageWeight: 164 }
  },
  {
    id: "camote_horneado",
    name: "Camote Horneado",
    foodGroup: "Cereal sin grasa",
    // Ref: USDA (Sweet potato, baked) -> 100g: 90 kcal, 2g prot, 20.7g carb, 0.1g fat
    macrosPerGram: { kcal: 0.90, protein: 0.02, carbs: 0.207, fats: 0.001 },
    // Ref: SMAE 1 Equivalente = 1/2 taza (aprox 100g)
    smaeEquivalentGrams: 100,
    visualMeasure: { unitName: "pieza", averageWeight: 150 }
  },

  // --- GRASAS ---
  {
    id: "aguacate",
    name: "Aguacate Hass",
    foodGroup: "Grasa sin proteína",
    // Ref: USDA (Avocado, raw) -> 100g: 160 kcal, 2g prot, 8.5g carb, 14.7g fat
    macrosPerGram: { kcal: 1.60, protein: 0.02, carbs: 0.085, fats: 0.147 },
    // Ref: SMAE 1 Equivalente = 1/3 pieza (aprox 30g)
    smaeEquivalentGrams: 30,
    visualMeasure: { unitName: "pieza", averageWeight: 90 }
  },
  {
    id: "aceite_oliva",
    name: "Aceite de Oliva Extra Virgen",
    foodGroup: "Grasa sin proteína",
    // Ref: USDA (Oil, olive) -> 100g: 884 kcal, 0g prot, 0g carb, 100g fat
    macrosPerGram: { kcal: 8.84, protein: 0, carbs: 0, fats: 1.00 },
    // Ref: SMAE 1 Equivalente = 1 cucharadita (5g)
    smaeEquivalentGrams: 5,
    visualMeasure: { unitName: "cucharada", averageWeight: 15 }
  },
  {
    id: "almendras_tostadas",
    name: "Almendras Tostadas",
    foodGroup: "Grasa con proteína",
    // Ref: USDA (Almonds, dry roasted) -> 100g: 598 kcal, 21g prot, 21g carb, 52.5g fat
    macrosPerGram: { kcal: 5.98, protein: 0.21, carbs: 0.21, fats: 0.525 },
    // Ref: SMAE 1 Equivalente = 10 piezas (aprox 12g)
    smaeEquivalentGrams: 12,
    visualMeasure: { unitName: "puñado", averageWeight: 30 }
  },
  {
    id: "crema_cacahuate",
    name: "Crema de Cacahuate",
    foodGroup: "Grasa con proteína",
    // Ref: USDA (Peanut butter, smooth) -> 100g: 588 kcal, 25g prot, 20g carb, 50g fat
    macrosPerGram: { kcal: 5.88, protein: 0.25, carbs: 0.20, fats: 0.50 },
    // Ref: SMAE 1 Equivalente = 1 cucharada (16g)
    smaeEquivalentGrams: 16,
    visualMeasure: { unitName: "cucharada", averageWeight: 16 }
  },
  {
    id: "chia_semillas",
    name: "Semillas de Chía",
    foodGroup: "Grasa con proteína",
    // Ref: USDA (Seeds, chia seeds) -> 100g: 486 kcal, 16.5g prot, 42.1g carb, 30.7g fat
    macrosPerGram: { kcal: 4.86, protein: 0.165, carbs: 0.421, fats: 0.307 },
    // Ref: SMAE 1 Equivalente = 7 cucharaditas (aprox 15g)
    smaeEquivalentGrams: 15,
    visualMeasure: { unitName: "cucharada", averageWeight: 10 }
  },

  // --- VERDURAS ---
  {
    id: "brocoli_cocido",
    name: "Brócoli Cocido",
    foodGroup: "Verdura",
    // Ref: USDA (Broccoli, boiled, drained) -> 100g: 35 kcal, 2.4g prot, 7.2g carb, 0.4g fat
    macrosPerGram: { kcal: 0.35, protein: 0.024, carbs: 0.072, fats: 0.004 },
    // Ref: SMAE 1 Equivalente = 1/2 taza (aprox 78g)
    smaeEquivalentGrams: 78,
    visualMeasure: { unitName: "taza", averageWeight: 156 }
  },
  {
    id: "zanahoria_cocida",
    name: "Zanahoria Cocida",
    foodGroup: "Verdura",
    // Ref: USDA (Carrots, boiled, drained) -> 100g: 35 kcal, 0.8g prot, 8.2g carb, 0.2g fat
    macrosPerGram: { kcal: 0.35, protein: 0.008, carbs: 0.082, fats: 0.002 },
    // Ref: SMAE 1 Equivalente = 1/2 taza (aprox 78g)
    smaeEquivalentGrams: 78,
    visualMeasure: { unitName: "taza", averageWeight: 156 }
  },
  {
    id: "calabacita_cocida",
    name: "Calabacita Cocida",
    foodGroup: "Verdura",
    // Ref: USDA (Squash, zucchini, boiled, drained) -> 100g: 15 kcal, 1.1g prot, 2.7g carb, 0.4g fat
    macrosPerGram: { kcal: 0.15, protein: 0.011, carbs: 0.027, fats: 0.004 },
    // Ref: SMAE 1 Equivalente = 1/2 taza (aprox 90g)
    smaeEquivalentGrams: 90,
    visualMeasure: { unitName: "taza", averageWeight: 180 }
  },
  {
    id: "champinon_cocido",
    name: "Champiñones Cocidos",
    foodGroup: "Verdura",
    // Ref: USDA (Mushrooms, white, boiled, drained) -> 100g: 28 kcal, 2.2g prot, 5.3g carb, 0.4g fat
    macrosPerGram: { kcal: 0.28, protein: 0.022, carbs: 0.053, fats: 0.004 },
    // Ref: SMAE 1 Equivalente = 1/2 taza (aprox 78g)
    smaeEquivalentGrams: 78,
    visualMeasure: { unitName: "taza", averageWeight: 156 }
  },
  {
    id: "espinaca_cocida",
    name: "Espinaca Cocida",
    foodGroup: "Verdura",
    // Ref: USDA (Spinach, boiled, drained) -> 100g: 23 kcal, 3g prot, 3.8g carb, 0.3g fat
    macrosPerGram: { kcal: 0.23, protein: 0.03, carbs: 0.038, fats: 0.003 },
    // Ref: SMAE 1 Equivalente = 1/2 taza (aprox 90g)
    smaeEquivalentGrams: 90,
    visualMeasure: { unitName: "taza", averageWeight: 180 }
  }
];

async function seedMasterCatalog() {
  console.log("Iniciando la siembra del catálogo maestro (25 ingredientes)...");
  
  let successCount = 0;
  for (const item of masterIngredients) {
    try {
      const docRef = doc(collection(db, "master_ingredients"), item.id);
      await setDoc(docRef, item);
      console.log(`✅ Creado ingrediente: ${item.name} (${item.id})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error al crear ${item.name}:`, error);
    }
  }

  console.log(`\n¡Siembra completada! Se crearon/actualizaron ${successCount} ingredientes.`);
  process.exit(0);
}

seedMasterCatalog();

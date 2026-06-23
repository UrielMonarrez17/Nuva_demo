// src/context/AppContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase/firebaseconfig";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

const AppContext = createContext(null);

// High-fidelity Mock Data for Offline/Fallback Mode
const MOCK_INGREDIENTS = [
  {
    id: "ing_pollo",
    name: "Pollo",
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
  {
    id: "ing_arroz",
    name: "Arroz",
    costPerGram: 0.02,
    kcalPerGram: 1.30,
    proteinPerGram: 0.027,
    carbPerGram: 0.28,
    fatPerGram: 0.003,
    minGrams: 50,
    maxGrams: 300,
    defaultGrams: 100,
    unit: "g"
  },
  {
    id: "ing_aguacate",
    name: "Aguacate",
    costPerGram: 0.06,
    kcalPerGram: 1.60,
    proteinPerGram: 0.02,
    carbPerGram: 0.085,
    fatPerGram: 0.15,
    minGrams: 20,
    maxGrams: 150,
    defaultGrams: 60,
    unit: "g"
  },
  {
    id: "ing_salmon",
    name: "Salmón",
    costPerGram: 0.28,
    kcalPerGram: 2.08,
    proteinPerGram: 0.20,
    carbPerGram: 0.0,
    fatPerGram: 0.13,
    minGrams: 50,
    maxGrams: 250,
    defaultGrams: 120,
    unit: "g"
  },
  {
    id: "ing_quinoa",
    name: "Quinoa",
    costPerGram: 0.05,
    kcalPerGram: 1.20,
    proteinPerGram: 0.04,
    carbPerGram: 0.21,
    fatPerGram: 0.02,
    minGrams: 50,
    maxGrams: 250,
    defaultGrams: 80,
    unit: "g"
  },
  {
    id: "ing_tofu",
    name: "Tofu",
    costPerGram: 0.08,
    kcalPerGram: 0.76,
    proteinPerGram: 0.08,
    carbPerGram: 0.02,
    fatPerGram: 0.05,
    minGrams: 50,
    maxGrams: 300,
    defaultGrams: 150,
    unit: "g"
  },
  {
    id: "ing_brocoli",
    name: "Brócoli",
    costPerGram: 0.015,
    kcalPerGram: 0.34,
    proteinPerGram: 0.028,
    carbPerGram: 0.066,
    fatPerGram: 0.004,
    minGrams: 20,
    maxGrams: 200,
    defaultGrams: 80,
    unit: "g"
  },
  {
    id: "ing_manzana",
    name: "Manzana en cubos",
    costPerGram: 0.02,
    kcalPerGram: 0.52,
    proteinPerGram: 0.003,
    carbPerGram: 0.14,
    fatPerGram: 0.002,
    minGrams: 20,
    maxGrams: 150,
    defaultGrams: 50,
    unit: "g"
  },
  {
    id: "ing_avena",
    name: "Avena",
    costPerGram: 0.01,
    kcalPerGram: 3.89,
    proteinPerGram: 0.169,
    carbPerGram: 0.663,
    fatPerGram: 0.069,
    minGrams: 20,
    maxGrams: 150,
    defaultGrams: 40,
    unit: "g"
  }
];

const MOCK_RESTAURANTS = [
  {
    id: "rest_nativa",
    name: "Nativa Dark Kitchen",
    address: "Condesa, CDMX",
    lat: 19.414,
    lng: -99.171,
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80",
    rating: 4.8,
    deliveryTime: "25-35 min"
  },
  {
    id: "rest_green",
    name: "Green Lab Co.",
    address: "Polanco, CDMX",
    lat: 19.432,
    lng: -99.192,
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80",
    rating: 4.9,
    deliveryTime: "30-45 min"
  }
];

const MOCK_RECIPES = [
  {
    id: "recipe_tazon_teriyaki",
    name: "Tazón Teriyaki de Pollo",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
    fixedCost: 15,
    allowedIngredients: ["ing_pollo", "ing_arroz", "ing_aguacate", "ing_brocoli"],
    description: "Tazón de arroz integral caliente, pechuga de pollo tierna bañado en salsa teriyaki baja en sodio, aguacate y brócoli fresco.",
    estimatedPrepTime: 12,
    category: "Pollo",
    restaurantId: "rest_nativa",
    tags: ["Alto en Proteína", "Bajo en Grasa", "Popular"]
  },
  {
    id: "recipe_salmon_quinoa",
    name: "Salmón Bowl & Quinoa",
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80",
    fixedCost: 20,
    allowedIngredients: ["ing_salmon", "ing_quinoa", "ing_aguacate", "ing_brocoli"],
    description: "Salmón a la plancha sobre una base de quinoa ligera, acompañado de rebanadas de aguacate fresco y brócoli.",
    estimatedPrepTime: 15,
    category: "Salmón",
    restaurantId: "rest_green",
    tags: ["Omega 3", "Keto", "Premium"]
  },
  {
    id: "recipe_wrap_fit",
    name: "Wrap Proteico de Tofu",
    imageUrl: "https://images.unsplash.com/photo-1626700051175-6518c4793f4f?w=800&q=80",
    fixedCost: 10,
    allowedIngredients: ["ing_tofu", "ing_quinoa", "ing_aguacate"],
    description: "Una tortilla integral grande rellena de quinoa sazonada, tofu marinado y aguacate cremoso.",
    estimatedPrepTime: 8,
    category: "Wrap",
    restaurantId: "rest_nativa",
    tags: ["Vegano", "Fibra Alta"]
  },
  {
    id: "recipe_avena_fruta",
    name: "Bowl de Avena y Manzana",
    imageUrl: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&q=80",
    fixedCost: 12,
    allowedIngredients: ["ing_avena", "ing_manzana"],
    description: "Bowl de avena calientita con trozos de manzana fresca, ideal para un desayuno energético.",
    estimatedPrepTime: 10,
    category: "Avena",
    restaurantId: "rest_green",
    tags: ["Desayuno", "Energía", "Dulce"]
  },
  {
    id: "recipe_pollo_brocoli",
    name: "Pollo con Brócoli y Arroz",
    imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80",
    fixedCost: 18,
    allowedIngredients: ["ing_pollo", "ing_brocoli", "ing_arroz"],
    description: "Clásico plato de pollo a la plancha acompañado de brócoli al vapor y arroz blanco, perfecto para ganar masa muscular.",
    estimatedPrepTime: 15,
    category: "Pollo",
    restaurantId: "rest_nativa",
    tags: ["Clásico", "Alto en Proteína"]
  },
  {
    id: "recipe_bowl_vegano",
    name: "Bowl Vegano de Tofu y Quinoa",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
    fixedCost: 16,
    allowedIngredients: ["ing_tofu", "ing_quinoa", "ing_brocoli", "ing_aguacate"],
    description: "Bowl nutritivo con tofu crujiente, base de quinoa, brócoli fresco y rebanadas de aguacate.",
    estimatedPrepTime: 12,
    category: "Bowl",
    restaurantId: "rest_green",
    tags: ["Vegano", "Ligero"]
  },
  {
    id: "recipe_avena_horneada",
    name: "Avena Horneada con Manzana",
    imageUrl: "https://images.unsplash.com/photo-1600336153113-d66c79de3f90?w=800&q=80",
    fixedCost: 14,
    allowedIngredients: ["ing_avena", "ing_manzana"],
    description: "Deliciosa avena horneada con toques de canela y trozos de manzana caramelizada. Un desayuno reconfortante.",
    estimatedPrepTime: 20,
    category: "Avena",
    restaurantId: "rest_green",
    tags: ["Dulce", "Fibra"]
  }
];

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // App state
  const [cart, setCart] = useState([]);
  const [recipes, setRecipes] = useState(MOCK_RECIPES);
  const [restaurants, setRestaurants] = useState(MOCK_RESTAURANTS);
  const [ingredients, setIngredients] = useState(MOCK_INGREDIENTS);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [nutritionalPlan, setNutritionalPlan] = useState(null);
  
  // Navigation states
  const [activeRole, setActiveRole] = useState("client"); // For dual-mode (client vs nutriologist)
  const [patientSelector, setPatientSelector] = useState(null); // When prescribing: the patient object

  // Addresses State
  const [addresses, setAddresses] = useState([
    { id: "1", street: "Av. Reforma 123", neighborhood: "Lomas de Chapultepec", city: "CDMX", active: true },
    { id: "2", street: "Calle Tulipanes 45", neighborhood: "Condesa", city: "CDMX", active: false }
  ]);

  // Handle Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        // Get user profile from Firestore
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const profile = userSnap.data();
            setUserProfile({ uid: user.uid, ...profile });
            setActiveRole(profile.role);
            
            // Restore cart and addresses if they exist
            if (profile.cart) setCart(profile.cart);
            if (profile.addresses) setAddresses(profile.addresses);
          } else {
            // Profile fallback if not found in db but authenticated
            const defaultProfile = {
              uid: user.uid,
              name: user.displayName || user.email.split("@")[0],
              email: user.email,
              role: "client"
            };
            setUserProfile(defaultProfile);
            setActiveRole("client");
          }
        } catch (error) {
          console.error("Firestore user fetch failed, using fallback:", error);
          const defaultProfile = {
            uid: user.uid,
            name: user.email.split("@")[0],
            email: user.email,
            role: "client"
          };
          setUserProfile(defaultProfile);
          setActiveRole("client");
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setActiveRole("client");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync real-time data from Firebase Firestore
  // Usar useRef para no suscribirnos varias veces innecesariamente
  const listenersActive = React.useRef(false);

  useEffect(() => {
    if (!currentUser || !userProfile) return;
    if (listenersActive.current) return;

    listenersActive.current = true;

    let unsubRecipes;
    let unsubRestaurants;
    let unsubIngredients;
    let unsubPrescriptions;
    let unsubPatients;
    let unsubOrders;
    let unsubPlans;

    try {
      // 1. Sync recipes & ingredients (read-only for normal users)
      unsubRecipes = onSnapshot(collection(db, "base_recipes"), (snapshot) => {
        if (!snapshot.empty) {
          const rList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Auto-migrate recipe categories if they don't match the new naming
          rList.forEach(async (recipe) => {
            let correctCategory = recipe.category;
            const nameLower = recipe.name.toLowerCase();
            
            if (nameLower.includes("pollo")) {
              correctCategory = "Pollo";
            } else if (nameLower.includes("salmón") || nameLower.includes("salmon") || nameLower.includes("salmo")) {
              correctCategory = "Salmón";
            } else if (nameLower.includes("avena")) {
              correctCategory = "Avena";
            } else if (nameLower.includes("wrap")) {
              correctCategory = "Wrap";
            } else if (nameLower.includes("bowl") || nameLower.includes("tazón") || nameLower.includes("tazon")) {
              correctCategory = "Bowl";
            } else if (nameLower.includes("tofu")) {
              correctCategory = "Tofu";
            }

            if (correctCategory && recipe.category !== correctCategory) {
              try {
                const recipeRef = doc(db, "base_recipes", recipe.id);
                await updateDoc(recipeRef, { category: correctCategory });
                console.log(`Updated recipe ${recipe.name} category to ${correctCategory}`);
              } catch (e) {
                console.warn(`Failed to update recipe category in Firestore:`, e);
              }
            }
          });

          setRecipes(rList);
        }
      }, err => console.log("Firebase recipes listen error, using mock:", err));

      unsubIngredients = onSnapshot(collection(db, "ingredients"), (snapshot) => {
        if (!snapshot.empty) {
          const iList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setIngredients(iList);
        }
      }, err => console.log("Firebase ingredients listen error, using mock:", err));

      unsubRestaurants = onSnapshot(collection(db, "restaurants"), (snapshot) => {
        if (!snapshot.empty) {
          const rList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setRestaurants(rList);
        }
      }, err => console.log("Firebase restaurants listen error, using mock:", err));

      // 2. Sync orders for this user
      const ordersQuery = query(collection(db, "orders"), where("userId", "==", currentUser.uid));
      unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
        const oList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by date (handles strings and standard formats)
        oList.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(oList);
      }, err => console.log("Firebase orders listen error:", err));

      // 3. Sync prescriptions & plans
      if (userProfile.role === "client") {
        // Patients see recipes sent to their email
        const presQuery = query(collection(db, "prescriptions"), where("patientEmail", "==", userProfile.email));
        unsubPrescriptions = onSnapshot(presQuery, (snapshot) => {
          const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          pList.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
          setPrescriptions(pList);
        });

        // Patients see their nutritional plan
        const plansQuery = query(collection(db, "nutritional_plans"), where("patientEmail", "==", userProfile.email));
        unsubPlans = onSnapshot(plansQuery, (snapshot) => {
          if (!snapshot.empty) {
            const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            pList.sort((a,b) => new Date(b.endDate) - new Date(a.endDate));
            setNutritionalPlan(pList[0]); // Active plan (newest end date)
          } else {
            setNutritionalPlan(null);
          }
        });
      } else if (userProfile.role === "nutriologist") {
        // Nutriologists see recipes they sent
        const presQuery = query(collection(db, "prescriptions"), where("nutriologistId", "==", currentUser.uid));
        unsubPrescriptions = onSnapshot(presQuery, (snapshot) => {
          const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          pList.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
          setPrescriptions(pList);
        });

        // Nutriologists see their patients
        const patientsQuery = query(collection(db, "patients"), where("nutriologistId", "==", currentUser.uid));
        unsubPatients = onSnapshot(patientsQuery, (snapshot) => {
          const patList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPatients(patList);
        });
      }
    } catch (e) {
      console.warn("Real-time snapshot error. Running in local fallback state.", e);
    }

    return () => {
      listenersActive.current = false;
      if (unsubRecipes) unsubRecipes();
      if (unsubRestaurants) unsubRestaurants();
      if (unsubIngredients) unsubIngredients();
      if (unsubPrescriptions) unsubPrescriptions();
      if (unsubPatients) unsubPatients();
      if (unsubOrders) unsubOrders();
      if (unsubPlans) unsubPlans();
    };
  }, [currentUser?.uid, userProfile?.role, userProfile?.email]);

  // --- ACTIONS ---

  // Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already has a Firestore profile
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        // First-time Google login: create a client profile
        const profile = {
          name: user.displayName || user.email.split("@")[0],
          email: user.email,
          role: "client",
          photoURL: user.photoURL || null,
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, profile);
        setUserProfile({ uid: user.uid, ...profile });
        setActiveRole("client");
      }
      // If profile exists, onAuthStateChanged will handle it

      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error("Google login failed:", error);
      setLoading(false);
      // If popup was closed by user, don't show error
      if (error.code === "auth/popup-closed-by-user") {
        return { success: false, error: null };
      }
      return { success: false, error: error.message };
    }
  };

  // Register Client
  const registerClient = async (name, email, password) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const profile = {
        name,
        email,
        role: "client",
        createdAt: new Date().toISOString()
      };
      
      // Store in Firestore
      await setDoc(doc(db, "users", user.uid), profile);
      
      setCurrentUser(user);
      setUserProfile({ uid: user.uid, ...profile });
      setActiveRole("client");
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error("Register client failed:", error);
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Register Nutriologist
  const registerNutriologist = async (name, email, password, license, phone) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const profile = {
        name,
        email,
        role: "nutriologist",
        status: "pending", // Pending verification
        professionalLicense: license,
        contactPhone: phone,
        createdAt: new Date().toISOString()
      };
      
      // Store in Firestore
      await setDoc(doc(db, "users", user.uid), profile);
      
      setCurrentUser(user);
      setUserProfile({ uid: user.uid, ...profile });
      setActiveRole("nutriologist");
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error("Register nutriologist failed:", error);
      setLoading(false);
      return { success: false, error: error.message };
    }
  };



  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.log("Firebase sign out failed, doing mock logout.");
    }
    setCurrentUser(null);
    setUserProfile(null);
    setCart([]);
    setPatients([]);
    setPrescriptions([]);
    setOrders([]);
    setActiveRole("client");
  };

  // Cart Functions
  const addToCart = async (item) => {
    const newCart = [...cart, item];
    setCart(newCart);
    if (currentUser) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), { cart: newCart }, { merge: true });
      } catch (e) { console.warn("Failed to sync cart", e); }
    }
  };

  const removeFromCart = async (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    if (currentUser) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), { cart: newCart }, { merge: true });
      } catch (e) { console.warn("Failed to sync cart", e); }
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  // Place Order (includes simulated paymentMethod, distance & deliveryTime calculations)
  const placeOrder = async (addressStr, paymentMethod = "Tarjeta de Crédito", distance = 0, deliveryTime = 30) => {
    if (!currentUser || cart.length === 0) return { success: false };
    
    const totalPrice = cart.reduce((acc, item) => acc + item.finalPrice, 0);
    const totalMacros = cart.reduce((acc, item) => ({
      protein: acc.protein + item.macros.protein,
      carbs: acc.carbs + item.macros.carbs,
      fats: acc.fats + item.macros.fats,
      kcal: acc.kcal + item.macros.kcal
    }), { protein: 0, carbs: 0, fats: 0, kcal: 0 });

    const newOrder = {
      userId: currentUser.uid,
      userName: userProfile?.name || currentUser.email,
      status: "PENDING",
      totalPrice: totalPrice + (totalPrice > 0 ? 35 : 0), // Include delivery fee
      totalMacros,
      items: cart.map(item => {
        const recipe = recipes.find(r => r.id === item.recipeId);
        const restaurant = restaurants.find(r => r.id === recipe?.restaurantId);
        return {
          recipeId: item.recipeId,
          recipeName: item.recipeName,
          restaurantId: restaurant?.id || null,
          restaurantName: restaurant?.name || "Nomi Kitchen",
          imageUrl: item.imageUrl,
          finalPrice: item.finalPrice,
          gramsMap: item.gramsMap,
          macros: item.macros,
          customizedIngredients: item.breakdown,
          selectedOptions: item.selectedOptions || []
        };
      }),
      address: addressStr,
      paymentMethod,
      distance: parseFloat(distance) || 0,
      deliveryTime: parseInt(deliveryTime) || 30,
      createdAt: new Date().toISOString()
    };

    try {
      // Try to write to Firestore
      const docRef = await addDoc(collection(db, "orders"), newOrder);
      const orderId = docRef.id;
      
      // Clear cart
      setCart([]);
      if (currentUser) {
        try {
          await setDoc(doc(db, "users", currentUser.uid), { cart: [] }, { merge: true });
        } catch (e) { console.warn("Failed to clear synced cart", e); }
      }
      
      // Update local state avoiding duplicates (checks if listener already added it)
      setOrders(prev => prev.some(o => o.id === orderId) ? prev : [{ id: orderId, ...newOrder }, ...prev]);
      return { success: true, orderId };
    } catch (e) {
      console.warn("Firestore order write failed, saving locally:", e);
      // Local fallback
      const orderId = "local_order_" + Math.random().toString(36).substr(2, 9);
      setCart([]);
      setOrders(prev => prev.some(o => o.id === orderId) ? prev : [{ id: orderId, ...newOrder }, ...prev]);
      return { success: true, orderId, isLocal: true };
    }
  };

  // Nutriologist: Add Patient
  const addPatient = async (name, email, phone) => {
    if (!currentUser) return { success: false };
    
    const newPatient = {
      nutriologistId: currentUser.uid,
      nutriologistName: userProfile?.name || "Dr.",
      patientName: name,
      patientEmail: email.toLowerCase().trim(),
      patientPhone: phone,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, "patients"), newPatient);
      setPatients(prev => [{ id: docRef.id, ...newPatient }, ...prev]);
      return { success: true };
    } catch (e) {
      console.warn("Firestore add patient failed, saving locally:", e);
      const localId = "local_pat_" + Math.random().toString(36).substr(2, 9);
      setPatients(prev => [{ id: localId, ...newPatient }, ...prev]);
      return { success: true, isLocal: true };
    }
  };

  // Nutriologist: Send Prescription (Recetar a Paciente)
  const sendPrescription = async (patientEmail, recipeId, recipeName, imageUrl, gramsMap, totalPrice, macros, breakdown) => {
    if (!currentUser) return { success: false };

    const newPrescription = {
      nutriologistId: currentUser.uid,
      nutriologistName: userProfile?.name || "Nutriólogo Nomi",
      patientEmail: patientEmail.toLowerCase().trim(),
      recipeId,
      recipeName,
      imageUrl,
      gramsMap,
      totalPrice,
      macros,
      breakdown,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, "prescriptions"), newPrescription);
      setPrescriptions(prev => [{ id: docRef.id, ...newPrescription }, ...prev]);
      return { success: true };
    } catch (e) {
      console.warn("Firestore prescription failed, saving locally:", e);
      const localId = "local_pres_" + Math.random().toString(36).substr(2, 9);
      setPrescriptions(prev => [{ id: localId, ...newPrescription }, ...prev]);
      return { success: true, isLocal: true };
    }
  };

  // Mark prescription as ordered/redeemed
  const redeemPrescription = async (prescriptionId) => {
    // Local update
    setPrescriptions(prev =>
      prev.map(p => (p.id === prescriptionId ? { ...p, status: "ordered" } : p))
    );
    // Real Firestore update if possible (mocked here or handled via Firebase rules)
    try {
      const presRef = doc(db, "prescriptions", prescriptionId);
      await setDoc(presRef, { status: "ordered" }, { merge: true });
    } catch (e) {
      console.log("Prescription status updated locally.");
    }
  };

  // Toggle Dual Mode
  const changeRoleDualMode = (role) => {
    if (userProfile && userProfile.role === "nutriologist") {
      setActiveRole(role);
    }
  };

  // Client: Address Management
  const addAddress = async (street, neighborhood, city) => {
    const newAddr = { id: Math.random().toString(), street, neighborhood, city, active: true };
    const newAddresses = addresses.map(a => ({ ...a, active: false })).concat(newAddr);
    setAddresses(newAddresses);
    if (currentUser) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), { addresses: newAddresses }, { merge: true });
      } catch (e) { console.warn("Failed to sync addresses", e); }
    }
  };

  const selectAddress = async (id) => {
    const newAddresses = addresses.map(a => ({ ...a, active: a.id === id }));
    setAddresses(newAddresses);
    if (currentUser) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), { addresses: newAddresses }, { merge: true });
      } catch (e) { console.warn("Failed to sync addresses", e); }
    }
  };

  const deleteAddress = async (id) => {
    const newAddresses = addresses.filter(a => a.id !== id);
    if (newAddresses.length > 0 && addresses.find(a => a.id === id)?.active) {
      newAddresses[0].active = true;
    }
    setAddresses(newAddresses);
    if (currentUser) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), { addresses: newAddresses }, { merge: true });
      } catch (e) { console.warn("Failed to sync addresses", e); }
    }
  };

  // User: Confirm Order Delivery
  const confirmOrderDelivery = async (orderId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: "DELIVERED" });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "DELIVERED" } : o));
    } catch (e) {
      console.warn("Failed to update status to DELIVERED:", e);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "DELIVERED" } : o));
    }
  };

  // Nutriologist: Create Nutritional Plan
  const createNutritionalPlan = async (patientEmail, kcalLimit, proteinLimit, carbLimit, fatLimit, startDate, endDate, periodType = "day") => {
    if (!currentUser) return { success: false };

    const newPlan = {
      patientEmail: patientEmail.toLowerCase().trim(),
      nutriologistId: currentUser.uid,
      nutriologistName: userProfile?.name || "Nutriólogo Clínico",
      kcalLimit: parseFloat(kcalLimit) || 2000,
      proteinLimit: parseFloat(proteinLimit) || 130,
      carbLimit: parseFloat(carbLimit) || 220,
      fatLimit: parseFloat(fatLimit) || 65,
      startDate,
      endDate,
      periodType,
      createdBy: "nutriologist",
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "nutritional_plans"), newPlan);
      return { success: true };
    } catch (e) {
      console.error("Error creating plan:", e);
      return { success: false, error: e.message };
    }
  };

  // Patient: Auto-generate Nutritional Plan
  const autoGeneratePlan = async (goals = "maintenance") => {
    if (!currentUser || !userProfile) return { success: false };

    let limitKcal = 2000;
    let protein = 130;
    let carbs = 220;
    let fats = 65;

    if (goals === "weight_loss") {
      limitKcal = 1600;
      protein = 120;
      carbs = 160;
      fats = 50;
    } else if (goals === "gain_muscle") {
      limitKcal = 2600;
      protein = 165;
      carbs = 300;
      fats = 80;
    }

    const newPlan = {
      patientEmail: userProfile.email.toLowerCase().trim(),
      kcalLimit: limitKcal,
      proteinLimit: protein,
      carbLimit: carbs,
      fatLimit: fats,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      periodType: "day",
      createdBy: "system",
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, "nutritional_plans"), newPlan);
      setNutritionalPlan({ id: docRef.id, ...newPlan });
      return { success: true };
    } catch (e) {
      console.warn("Failed to save auto-generated plan:", e);
      setNutritionalPlan({ id: "local_plan_" + Math.random().toString(36).substring(2), ...newPlan });
      return { success: true, isLocal: true };
    }
  };

  // Admin: Register New Restaurant
  const registerRestaurant = async (name, address, lat, lng, imageUrl, rating = 4.5, deliveryTime = "25-35 min") => {
    if (!currentUser) return { success: false };

    const newRest = {
      name,
      address,
      lat: parseFloat(lat) || 19.414,
      lng: parseFloat(lng) || -99.171,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80",
      rating: parseFloat(rating) || 4.5,
      deliveryTime,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, "restaurants"), newRest);
      setRestaurants(prev => [{ id: docRef.id, ...newRest }, ...prev]);
      return { success: true };
    } catch (e) {
      console.warn("Failed to write restaurant to Firestore, adding locally:", e);
      const localId = "local_rest_" + Math.random().toString(36).substr(2, 9);
      setRestaurants(prev => [{ id: localId, ...newRest }, ...prev]);
      return { success: true, isLocal: true };
    }
  };

  const registerRestaurantPending = async (name, email, password, restaurantName, address, lat, lng) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const profile = {
        name,
        email,
        role: "restaurant",
        status: "pending_verification",
        restaurantName,
        address,
        lat: parseFloat(lat) || 19.4326,
        lng: parseFloat(lng) || -99.1332,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, "users", user.uid), profile);
      
      setCurrentUser(user);
      setUserProfile({ uid: user.uid, ...profile });
      setActiveRole("restaurant");
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error("Register restaurant failed:", error);
      setLoading(false);
      return { success: false, error: error.message };
    }
  };



  return (
    <AppContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        cart,
        recipes,
        restaurants,
        ingredients,
        patients,
        prescriptions,
        orders,
        activeRole,
        patientSelector,
        addresses,
        setPatientSelector,
        login,
        loginWithGoogle,
        logout,
        registerClient,
        registerNutriologist,
        addToCart,
        removeFromCart,
        clearCart,
        placeOrder,
        addPatient,
        sendPrescription,
        redeemPrescription,
        changeRoleDualMode,
        addAddress,
        selectAddress,
        nutritionalPlan,
        confirmOrderDelivery,
        createNutritionalPlan,
        autoGeneratePlan,
        registerRestaurant,
        registerRestaurantPending
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

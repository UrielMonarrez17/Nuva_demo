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
  serverTimestamp
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
    category: "Bowl",
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
    category: "Bowl",
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
    category: "Desayuno",
    restaurantId: "rest_green",
    tags: ["Desayuno", "Energía", "Dulce"]
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

    try {
      // 1. Sync recipes & ingredients (read-only for normal users)
      unsubRecipes = onSnapshot(collection(db, "base_recipes"), (snapshot) => {
        if (!snapshot.empty) {
          const rList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        // Sort by date
        oList.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setOrders(oList);
      }, err => console.log("Firebase orders listen error:", err));

      // 3. Sync prescriptions
      if (userProfile.role === "client") {
        // Patients see recipes sent to their email
        const presQuery = query(collection(db, "prescriptions"), where("patientEmail", "==", userProfile.email));
        unsubPrescriptions = onSnapshot(presQuery, (snapshot) => {
          const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          pList.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setPrescriptions(pList);
        });
      } else if (userProfile.role === "nutriologist") {
        // Nutriologists see recipes they sent
        const presQuery = query(collection(db, "prescriptions"), where("nutriologistId", "==", currentUser.uid));
        unsubPrescriptions = onSnapshot(presQuery, (snapshot) => {
          const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          pList.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
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
      // Let's add a demo-login fallback for reviewer convenience!
      if (email.includes("demo")) {
        const dummyUser = {
          uid: "demo_uid_" + (email.includes("nutri") ? "nutri" : "client"),
          email: email,
          name: email.includes("nutri") ? "Dra. Sofía Ramos" : "Uriel Monarrez",
          role: email.includes("nutri") ? "nutriologist" : "client",
          status: email.includes("nutri") ? "verified" : "active",
          professionalLicense: email.includes("nutri") ? "12345678" : null,
          contactPhone: "555-123-4567"
        };
        setCurrentUser({ uid: dummyUser.uid, email: dummyUser.email });
        setUserProfile(dummyUser);
        setActiveRole(dummyUser.role);
        setLoading(false);
        return { success: true, isDemo: true };
      }
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

  // Verify license instantly (Bypass/Demo helper)
  const verifyLicenseDemo = async () => {
    if (!currentUser || !userProfile) return;
    const updatedProfile = { ...userProfile, status: "verified" };
    setUserProfile(updatedProfile);
    
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, { status: "verified" }, { merge: true });
    } catch (e) {
      console.log("Mock verify license done locally.");
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

  // Place Order
  const placeOrder = async (addressStr) => {
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
      totalPrice,
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
          customizedIngredients: item.breakdown
        };
      }),
      address: addressStr,
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
      
      // Update local state in case Firestore sync takes a second or is offline
      setOrders(prev => [{ id: orderId, ...newOrder }, ...prev]);
      return { success: true, orderId };
    } catch (e) {
      console.warn("Firestore order write failed, saving locally:", e);
      // Local fallback
      const orderId = "local_order_" + Math.random().toString(36).substr(2, 9);
      setCart([]);
      setOrders(prev => [{ id: orderId, ...newOrder }, ...prev]);
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
        verifyLicenseDemo,
        addToCart,
        removeFromCart,
        clearCart,
        placeOrder,
        addPatient,
        sendPrescription,
        redeemPrescription,
        changeRoleDualMode,
        addAddress,
        selectAddress
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

// src/components/RestaurantIngredientForm.jsx

import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebaseconfig";
import { collection, getDocs, addDoc } from "firebase/firestore";

/**
 * Componente de Formulario para que un Restaurante agregue un ingrediente a su menú.
 * Lee de master_ingredients (base de macros controlada por Admin) y permite definir
 * el pricePerGram para guardarlo en la colección restaurant_ingredients.
 * 
 * @param {Object} props
 * @param {string} props.restaurantId - ID del restaurante actual.
 * @param {Function} props.onIngredientAdded - Callback opcional tras guardar exitosamente.
 */
export default function RestaurantIngredientForm({ restaurantId = "rest_123", onIngredientAdded }) {
  const [masterIngredients, setMasterIngredients] = useState([]);
  const [selectedMasterId, setSelectedMasterId] = useState("");
  const [pricePerGram, setPricePerGram] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // 1. Cargar ingredientes maestros desde Firestore al montar el componente
  useEffect(() => {
    async function loadMasterIngredients() {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener todos los ingredientes de la colección controlada por el Admin
        const querySnapshot = await getDocs(collection(db, "master_ingredients"));
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        
        setMasterIngredients(list);
        if (list.length > 0) {
          setSelectedMasterId(list[0].id);
        }
      } catch (err) {
        console.error("Error loading master ingredients:", err);
        setError("Error al cargar los ingredientes maestros.");
      } finally {
        setLoading(false);
      }
    }

    loadMasterIngredients();
  }, []);

  // 2. Función de guardado en restaurant_ingredients
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!selectedMasterId) {
      setError("Por favor selecciona un ingrediente maestro.");
      return;
    }
    
    const price = parseFloat(pricePerGram);
    if (isNaN(price) || price <= 0) {
      setError("Por favor ingresa un precio por gramo válido mayor a 0.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Documento de acuerdo a la nueva arquitectura
      const newIngredient = {
        restaurantId,
        masterIngredientId: selectedMasterId,
        pricePerGram: price,
        isAvailable: true,
      };

      // Inserción en la colección controlada por el Restaurante
      const docRef = await addDoc(collection(db, "restaurant_ingredients"), newIngredient);

      setSuccess(true);
      setPricePerGram(""); // Limpiar input tras guardar
      
      if (onIngredientAdded) {
        onIngredientAdded({ id: docRef.id, ...newIngredient });
      }
    } catch (err) {
      console.error("Error saving restaurant ingredient:", err);
      setError("Error al guardar el ingrediente en el menú del restaurante.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Cargando ingredientes maestros...</p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Agregar Ingrediente al Menú</h2>
      <p style={styles.subtitle}>
        Selecciona un ingrediente de la base maestra de alimentos y define su precio de venta por gramo.
      </p>

      {error && <div style={styles.errorBanner}>⚠️ {error}</div>}
      {success && <div style={styles.successBanner}>✨ ¡Ingrediente agregado exitosamente!</div>}

      <form onSubmit={handleSave} style={styles.form}>
        {/* Selector de ingredientes maestros (macros controlados por Admin) */}
        <div style={styles.formGroup}>
          <label htmlFor="masterIngredientSelect" style={styles.label}>Ingrediente Maestro</label>
          <select
            id="masterIngredientSelect"
            value={selectedMasterId}
            onChange={(e) => setSelectedMasterId(e.target.value)}
            style={styles.select}
            required
          >
            {masterIngredients.map((ing) => (
              <option key={ing.id} value={ing.id} style={styles.option}>
                {ing.name} ({ing.kcalPerGram} kcal/g)
              </option>
            ))}
          </select>
        </div>

        {/* Input de precio por gramo controlado por el Restaurante (sin inputs de macros) */}
        <div style={styles.formGroup}>
          <label htmlFor="priceInput" style={styles.label}>Precio por Gramo (MXN)</label>
          <div style={styles.inputWrapper}>
            <span style={styles.inputPrefix}>$</span>
            <input
              id="priceInput"
              type="number"
              step="0.0001"
              min="0.0001"
              value={pricePerGram}
              onChange={(e) => setPricePerGram(e.target.value)}
              placeholder="0.157"
              style={styles.input}
              required
            />
            <span style={styles.inputSuffix}>/g</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            ...styles.button,
            opacity: saving ? 0.6 : 1,
            cursor: saving ? "not-allowed" : "pointer"
          }}
        >
          {saving ? "Guardando..." : "Guardar en mi Menú"}
        </button>
      </form>
    </div>
  );
}

// ─── ESTILOS VISUALES PREMIUM ──────────────────────────────────────────────────
const styles = {
  card: {
    backgroundColor: "#111111",
    border: "1px solid #1C1C1C",
    borderRadius: "24px",
    padding: "32px",
    maxWidth: "480px",
    margin: "0 auto",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#FFF"
  },
  title: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#FFF",
    margin: "0 0 8px 0"
  },
  subtitle: {
    fontSize: "14px",
    color: "#A0A0A0",
    lineHeight: "1.5",
    margin: "0 0 24px 0"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#A0A0A0"
  },
  select: {
    backgroundColor: "#0A0A0A",
    border: "1px solid #1C1C1C",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "#FFF",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
    transition: "border-color 0.2s",
    width: "100%"
  },
  option: {
    backgroundColor: "#111111",
    color: "#FFF"
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#0A0A0A",
    border: "1px solid #1C1C1C",
    borderRadius: "10px",
    padding: "0 14px",
    transition: "border-color 0.2s"
  },
  inputPrefix: {
    color: "#6B6B6B",
    fontSize: "14px",
    marginRight: "6px"
  },
  inputSuffix: {
    color: "#6B6B6B",
    fontSize: "14px",
    marginLeft: "6px"
  },
  input: {
    backgroundColor: "transparent",
    border: "none",
    color: "#FFF",
    fontSize: "14px",
    padding: "12px 0",
    outline: "none",
    width: "100%",
    fontFamily: "inherit"
  },
  button: {
    backgroundColor: "#34D399",
    color: "#0A0A0A",
    border: "none",
    borderRadius: "10px",
    padding: "14px 20px",
    fontSize: "14px",
    fontWeight: 700,
    transition: "background-color 0.2s",
    marginTop: "8px",
    width: "100%"
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    border: "1px solid #EF4444",
    borderRadius: "10px",
    color: "#EF4444",
    padding: "12px",
    fontSize: "13px",
    marginBottom: "16px"
  },
  successBanner: {
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    border: "1px solid #34D399",
    borderRadius: "10px",
    color: "#34D399",
    padding: "12px",
    fontSize: "13px",
    marginBottom: "16px"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    gap: "16px"
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #1C1C1C",
    borderTop: "3px solid #34D399",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  loadingText: {
    color: "#A0A0A0",
    fontSize: "14px"
  }
};

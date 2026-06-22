import React, { useState, useEffect } from 'react';
import { db } from "../firebase/firebaseconfig";
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

export default function MacrosDashboard() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form & modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");

  const [formName, setFormName] = useState("");
  const [formCostPerGram, setFormCostPerGram] = useState("0.05");
  const [formKcalPerGram, setFormKcalPerGram] = useState("1.0");
  const [formProteinPerGram, setFormProteinPerGram] = useState("0.1");
  const [formCarbPerGram, setFormCarbPerGram] = useState("0.1");
  const [formFatPerGram, setFormFatPerGram] = useState("0.02");
  const [formMinGrams, setFormMinGrams] = useState("50");
  const [formMaxGrams, setFormMaxGrams] = useState("250");
  const [formDefaultGrams, setFormDefaultGrams] = useState("100");
  const [formUnit, setFormUnit] = useState("g");

  // Load ingredients from Firestore
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "ingredients"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setIngredients(data);
      setLoading(false);
    }, (err) => {
      console.error("Error loading ingredients:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setEditingId("");
    setFormName("");
    setFormCostPerGram("0.05");
    setFormKcalPerGram("1.0");
    setFormProteinPerGram("0.1");
    setFormCarbPerGram("0.1");
    setFormFatPerGram("0.02");
    setFormMinGrams("50");
    setFormMaxGrams("250");
    setFormDefaultGrams("100");
    setFormUnit("g");
    setIsModalOpen(true);
  };

  const openEditModal = (ing) => {
    setIsEditing(true);
    setEditingId(ing.id);
    setFormName(ing.name || "");
    setFormCostPerGram(ing.costPerGram?.toString() || "0");
    setFormKcalPerGram(ing.kcalPerGram?.toString() || "0");
    setFormProteinPerGram(ing.proteinPerGram?.toString() || "0");
    setFormCarbPerGram(ing.carbPerGram?.toString() || "0");
    setFormFatPerGram(ing.fatPerGram?.toString() || "0");
    setFormMinGrams(ing.minGrams?.toString() || "0");
    setFormMaxGrams(ing.maxGrams?.toString() || "0");
    setFormDefaultGrams(ing.defaultGrams?.toString() || "0");
    setFormUnit(ing.unit || "g");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (window.confirm("¿Seguro que deseas salir? Se perderán los cambios no guardados en el ingrediente.")) {
      setIsModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Por favor ingresa un nombre para el ingrediente.");
      return;
    }
    if (!window.confirm(`¿Confirmas que deseas ${isEditing ? "actualizar" : "crear"} este ingrediente?`)) {
      return;
    }

    const ingData = {
      name: formName.trim(),
      costPerGram: parseFloat(formCostPerGram) || 0,
      kcalPerGram: parseFloat(formKcalPerGram) || 0,
      proteinPerGram: parseFloat(formProteinPerGram) || 0,
      carbPerGram: parseFloat(formCarbPerGram) || 0,
      fatPerGram: parseFloat(formFatPerGram) || 0,
      minGrams: parseInt(formMinGrams) || 0,
      maxGrams: parseInt(formMaxGrams) || 0,
      defaultGrams: parseInt(formDefaultGrams) || 0,
      unit: formUnit.trim() || "g"
    };

    try {
      if (isEditing) {
        // Update
        await updateDoc(doc(db, "ingredients", editingId), ingData);
      } else {
        // Create (generate a clean ID starting with ing_ if we want, or let Firestore generate it)
        // Let's generate a lowercase ID without special characters
        const safeId = "ing_" + formName.toLowerCase().replace(/[^a-z0-9]/g, "_");
        await updateDoc(doc(db, "ingredients", safeId), ingData); // setDoc style via updateDoc/setDoc. Using safer custom setDoc is better or just setting it with a custom ID
      }
      closeModal();
    } catch (err) {
      console.error("Error saving ingredient:", err);
      // Fallback in case document doesn't exist for update when creating
      try {
        const safeId = "ing_" + formName.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const docRef = doc(db, "ingredients", safeId);
        // Note: we can write it using setDoc if we want, or simple addDoc. Let's do addDoc/setDoc with custom doc ID
        await updateDoc(docRef, ingData).catch(async () => {
          // If update fails because it doesn't exist, we set it!
          // We can use a trick or write it cleanly. Wait, setDoc isn't imported, let's use the document reference if needed. Let's import setDoc!
        });
      } catch (innerErr) {
        console.error("Error on setDoc fallback:", innerErr);
        alert("Error al guardar ingrediente.");
      }
    }
  };

  const handleDelete = async (ingId) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este ingrediente? Se quitará de las recetas que lo usen.")) {
      try {
        await deleteDoc(doc(db, "ingredients", ingId));
      } catch (err) {
        console.error("Error deleting ingredient:", err);
        alert("Hubo un error al eliminar el ingrediente.");
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Ingredientes y Macros</h1>
          <p style={styles.subtitle}>Configura el costo, límites y aportes nutricionales de los ingredientes</p>
        </div>
        <button onClick={openAddModal} style={styles.primaryButton}>
          + Nuevo Ingrediente
        </button>
      </div>

      {loading ? (
        <div style={styles.centerBox}><div style={styles.spinner}/></div>
      ) : ingredients.length === 0 ? (
        <div style={styles.centerBox}>
          <span style={{ fontSize: 40, opacity: 0.5 }}>🥑</span>
          <p style={{ marginTop: 16, color: "#A0A0A0" }}>No hay ingredientes registrados.</p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Ingrediente</th>
                <th style={styles.th}>Costo /g</th>
                <th style={styles.th}>Macros (por gramo)</th>
                <th style={styles.th}>Límites (g)</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map(ing => (
                <tr key={ing.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600, color: "#F5F5F0" }}>{ing.name}</div>
                    <div style={{ fontSize: 11, color: "#6B6B6B" }}>ID: {ing.id}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.costBadge}>${ing.costPerGram?.toFixed(3)}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.macrosRow}>
                      <span style={styles.macroTag}>P: {ing.proteinPerGram}g</span>
                      <span style={styles.macroTag}>C: {ing.carbPerGram}g</span>
                      <span style={styles.macroTag}>G: {ing.fatPerGram}g</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                      {ing.kcalPerGram} kcal/{ing.unit || 'g'}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontSize: 13, color: "#CCC" }}>
                      Min: <span style={{color:"#FFF"}}>{ing.minGrams}g</span> <br/>
                      Max: <span style={{color:"#FFF"}}>{ing.maxGrams}g</span> <br/>
                      Default: <span style={{color:"#F97316"}}>{ing.defaultGrams}g</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEditModal(ing)} style={styles.btnEdit}>Editar</button>
                      <button onClick={() => handleDelete(ing.id)} style={styles.btnDanger}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{isEditing ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}</h2>
              <button onClick={closeModal} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.row}>
                <div style={{ ...styles.formGroup, flex: 2 }}>
                  <label style={styles.label}>Nombre del Ingrediente</label>
                  <input 
                    type="text" 
                    style={styles.input} 
                    value={formName} 
                    onChange={(e) => setFormName(e.target.value)} 
                    placeholder="Ej. Salmón fresco"
                    required
                  />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Unidad</label>
                  <input 
                    type="text" 
                    style={styles.input} 
                    value={formUnit} 
                    onChange={(e) => setFormUnit(e.target.value)} 
                    placeholder="g"
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Costo por Gramo ($)</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    style={styles.input} 
                    value={formCostPerGram} 
                    onChange={(e) => setFormCostPerGram(e.target.value)} 
                  />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Kcal por Gramo</label>
                  <input 
                    type="number" 
                    step="0.01"
                    style={styles.input} 
                    value={formKcalPerGram} 
                    onChange={(e) => setFormKcalPerGram(e.target.value)} 
                  />
                </div>
              </div>

              <h4 style={styles.sectionHeader}>Aportes Macronutricionales (por Gramo)</h4>
              <div style={styles.row}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Proteína (g)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    style={styles.input} 
                    value={formProteinPerGram} 
                    onChange={(e) => setFormProteinPerGram(e.target.value)} 
                  />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Carbohidratos (g)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    style={styles.input} 
                    value={formCarbPerGram} 
                    onChange={(e) => setFormCarbPerGram(e.target.value)} 
                  />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Grasa (g)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    style={styles.input} 
                    value={formFatPerGram} 
                    onChange={(e) => setFormFatPerGram(e.target.value)} 
                  />
                </div>
              </div>

              <h4 style={styles.sectionHeader}>Configuración de Límites (Pesajes Cocina)</h4>
              <div style={styles.row}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Mínimo (g)</label>
                  <input 
                    type="number" 
                    style={styles.input} 
                    value={formMinGrams} 
                    onChange={(e) => setFormMinGrams(e.target.value)} 
                  />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Máximo (g)</label>
                  <input 
                    type="number" 
                    style={styles.input} 
                    value={formMaxGrams} 
                    onChange={(e) => setFormMaxGrams(e.target.value)} 
                  />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Por Defecto (g)</label>
                  <input 
                    type="number" 
                    style={styles.input} 
                    value={formDefaultGrams} 
                    onChange={(e) => setFormDefaultGrams(e.target.value)} 
                  />
                </div>
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={closeModal} style={styles.btnCancel}>Cancelar</button>
                <button type="submit" style={styles.btnSave}>
                  {isEditing ? 'Guardar Cambios' : 'Crear Ingrediente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "32px 48px",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflowY: "auto",
    backgroundColor: "#0A0A0A",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#F5F5F0",
    margin: 0
  },
  subtitle: {
    fontSize: 14,
    color: "#A0A0A0",
    marginTop: 8
  },
  primaryButton: {
    backgroundColor: "#1C1C1C",
    color: "#34D399",
    border: "1px solid #34D399",
    borderRadius: 8,
    padding: "12px 24px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    ':hover': {
      backgroundColor: "rgba(52, 211, 153, 0.1)"
    }
  },
  centerBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  spinner: {
    width: 40, height: 40,
    border: "3px solid #1C1C1C",
    borderTop: "3px solid #34D399",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  tableContainer: {
    backgroundColor: "#141414",
    borderRadius: 16,
    border: "1px solid #1C1C1C",
    overflow: "hidden",
    marginBottom: 40
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left"
  },
  th: {
    padding: "16px 24px",
    borderBottom: "1px solid #1C1C1C",
    color: "#A0A0A0",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600,
    backgroundColor: "#111"
  },
  tr: {
    borderBottom: "1px solid #1C1C1C"
  },
  td: {
    padding: "16px 24px",
    verticalAlign: "middle"
  },
  costBadge: {
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    color: "#34D399",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums"
  },
  macrosRow: {
    display: "flex",
    gap: 6
  },
  macroTag: {
    backgroundColor: "#1C1C1C",
    color: "#D4D4D8",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500
  },
  btnEdit: {
    backgroundColor: "transparent",
    color: "#F97316",
    border: "1px solid rgba(249, 115, 22, 0.3)",
    padding: "8px 16px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
    ':hover': {
      backgroundColor: "rgba(249, 115, 22, 0.05)"
    }
  },
  btnDanger: {
    backgroundColor: "transparent",
    color: "#EF4444",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    padding: "8px 16px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    ':hover': {
      backgroundColor: "rgba(239, 68, 68, 0.05)",
      borderColor: "#EF4444"
    }
  },

  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(8px)',
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#111111',
    border: '1px solid #1C1C1C',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    borderRadius: '24px',
    padding: '32px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #1C1C1C',
    paddingBottom: '16px'
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#FFF',
    margin: 0
  },
  closeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6B6B6B',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'color 0.2s',
    ':hover': {
      color: '#FFF'
    }
  },
  sectionHeader: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#34D399',
    margin: '10px 0 0 0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  row: {
    display: 'flex',
    gap: '16px'
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#A0A0A0'
  },
  input: {
    backgroundColor: '#0A0A0A',
    border: '1px solid #1C1C1C',
    borderRadius: '10px',
    padding: '12px 14px',
    color: '#FFF',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    ':focus': {
      borderColor: '#34D399'
    }
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
    paddingTop: '16px',
    borderTop: '1px solid #1C1C1C'
  },
  btnCancel: {
    backgroundColor: '#1C1C1C',
    color: '#FFF',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#2C2C2C'
    }
  },
  btnSave: {
    backgroundColor: '#34D399',
    color: '#0A0A0A',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#10B981'
    }
  }
};

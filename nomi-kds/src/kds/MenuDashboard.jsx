import React, { useState, useEffect } from 'react';
import { db } from "../firebase/firebaseconfig";
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

export default function MenuDashboard({ selectedRestaurant }) {
  const [recipes, setRecipes] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState("");
  
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formFixedCost, setFormFixedCost] = useState("0");
  const [formPrepTime, setFormPrepTime] = useState("0");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formAllowedIngredients, setFormAllowedIngredients] = useState([]);
  const [formRestaurantId, setFormRestaurantId] = useState("rest_nativa");

  // Load recipes
  useEffect(() => {
    setLoading(true);
    const q = selectedRestaurant === "all" 
      ? collection(db, "base_recipes") 
      : query(collection(db, "base_recipes"), where("restaurantId", "==", selectedRestaurant));
      
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecipes(data);
      setLoading(false);
    }, (err) => {
      console.error("Error loading recipes:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedRestaurant]);

  // Load ingredients for form selection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "ingredients"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setIngredientsList(data);
    }, (err) => {
      console.error("Error loading ingredients:", err);
    });

    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setEditingRecipeId("");
    setFormName("");
    setFormDescription("");
    setFormFixedCost("15");
    setFormPrepTime("10");
    setFormImageUrl("");
    setFormTags("");
    setFormAllowedIngredients([]);
    setFormRestaurantId(selectedRestaurant === "all" ? "rest_nativa" : selectedRestaurant);
    setIsModalOpen(true);
  };

  const openEditModal = (recipe) => {
    setIsEditing(true);
    setEditingRecipeId(recipe.id);
    setFormName(recipe.name || "");
    setFormDescription(recipe.description || "");
    setFormFixedCost(recipe.fixedCost?.toString() || "0");
    setFormPrepTime(recipe.estimatedPrepTime?.toString() || "0");
    setFormImageUrl(recipe.imageUrl || "");
    setFormTags(recipe.tags?.join(", ") || "");
    setFormAllowedIngredients(recipe.allowedIngredients || []);
    setFormRestaurantId(recipe.restaurantId || "rest_nativa");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (window.confirm("¿Seguro que deseas salir? Se perderán los cambios no guardados en la receta.")) {
      setIsModalOpen(false);
    }
  };

  const handleIngredientToggle = (ingId) => {
    setFormAllowedIngredients(prev => 
      prev.includes(ingId) 
        ? prev.filter(id => id !== ingId) 
        : [...prev, ingId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Por favor ingresa un nombre para el platillo.");
      return;
    }
    if (!window.confirm(`¿Confirmas que deseas ${isEditing ? "actualizar" : "crear"} esta receta?`)) {
      return;
    }

    const fixedCostNum = parseFloat(formFixedCost) || 0;
    const prepTimeNum = parseInt(formPrepTime) || 0;
    const tagArray = formTags.split(",").map(t => t.trim()).filter(Boolean);
    const targetRestaurantId = selectedRestaurant === "all" ? formRestaurantId : selectedRestaurant;

    const recipeData = {
      name: formName.trim(),
      description: formDescription.trim(),
      fixedCost: fixedCostNum,
      estimatedPrepTime: prepTimeNum,
      imageUrl: formImageUrl.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
      tags: tagArray,
      allowedIngredients: formAllowedIngredients,
      restaurantId: targetRestaurantId
    };

    try {
      if (isEditing) {
        await updateDoc(doc(db, "base_recipes", editingRecipeId), recipeData);
      } else {
        await addDoc(collection(db, "base_recipes"), recipeData);
      }
      closeModal();
    } catch (err) {
      console.error("Error saving recipe:", err);
      alert("Hubo un error al guardar la receta. Intenta de nuevo.");
    }
  };

  const handleDelete = async (recipeId) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta receta? Esta acción no se puede deshacer.")) {
      try {
        await deleteDoc(doc(db, "base_recipes", recipeId));
      } catch (err) {
        console.error("Error deleting recipe:", err);
        alert("Hubo un error al eliminar la receta.");
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Mi Menú</h1>
          <p style={styles.subtitle}>Gestiona las recetas y platillos base disponibles en tu cocina</p>
        </div>
        <button onClick={openAddModal} style={styles.primaryButton}>
          + Agregar Receta
        </button>
      </div>

      {loading ? (
        <div style={styles.centerBox}><div style={styles.spinner}/></div>
      ) : recipes.length === 0 ? (
        <div style={styles.centerBox}>
          <span style={{ fontSize: 40, opacity: 0.5 }}>🍽️</span>
          <p style={{ marginTop: 16, color: "#A0A0A0" }}>No hay recetas registradas.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {recipes.map(recipe => (
            <div key={recipe.id} style={styles.card}>
              <div 
                style={{
                  ...styles.cardImage,
                  backgroundImage: `url(${recipe.imageUrl || 'https://via.placeholder.com/300?text=Sin+Imagen'})`
                }} 
              />
              <div style={styles.cardContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={styles.recipeName}>{recipe.name}</h3>
                  <span style={styles.recipeCost}>${recipe.fixedCost} base</span>
                </div>
                <p style={styles.recipeDesc}>{recipe.description}</p>
                
                <div style={styles.tagsContainer}>
                  {recipe.tags?.map((tag, idx) => (
                    <span key={idx} style={styles.tag}>{tag}</span>
                  ))}
                  <span style={styles.tagTime}>⏱ {recipe.estimatedPrepTime} min</span>
                </div>

                <div style={styles.cardActions}>
                  <button onClick={() => openEditModal(recipe)} style={styles.btnSecondary}>Editar</button>
                  <button onClick={() => handleDelete(recipe.id)} style={styles.btnDanger}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{isEditing ? 'Editar Receta' : 'Nueva Receta'}</h2>
              <button onClick={closeModal} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre del Platillo</label>
                <input 
                  type="text" 
                  style={styles.input} 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                  placeholder="Ej. Bowl de Avena Fit"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Descripción</label>
                <textarea 
                  style={styles.textarea} 
                  value={formDescription} 
                  onChange={(e) => setFormDescription(e.target.value)} 
                  placeholder="Describe el platillo, sus sabores e ingredientes clave..."
                  rows={3}
                />
              </div>

              <div style={styles.row}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Costo Fijo Base ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    style={styles.input} 
                    value={formFixedCost} 
                    onChange={(e) => setFormFixedCost(e.target.value)} 
                  />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Tiempo Prep. (min)</label>
                  <input 
                    type="number" 
                    style={styles.input} 
                    value={formPrepTime} 
                    onChange={(e) => setFormPrepTime(e.target.value)} 
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>URL de la Imagen</label>
                <input 
                  type="text" 
                  style={styles.input} 
                  value={formImageUrl} 
                  onChange={(e) => setFormImageUrl(e.target.value)} 
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Etiquetas (separadas por comas)</label>
                <input 
                  type="text" 
                  style={styles.input} 
                  value={formTags} 
                  onChange={(e) => setFormTags(e.target.value)} 
                  placeholder="Keto, Proteína, Desayuno"
                />
              </div>

              {selectedRestaurant === "all" && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Restaurante propietario</label>
                  <select 
                    style={styles.select}
                    value={formRestaurantId}
                    onChange={(e) => setFormRestaurantId(e.target.value)}
                  >
                    <option value="rest_nativa">Nativa Dark Kitchen</option>
                    <option value="rest_green">Green Lab Co.</option>
                  </select>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Ingredientes Permitidos (Macros Modificables)</label>
                <div style={styles.ingredientsGrid}>
                  {ingredientsList.map(ing => {
                    const isChecked = formAllowedIngredients.includes(ing.id);
                    return (
                      <div 
                        key={ing.id} 
                        onClick={() => handleIngredientToggle(ing.id)}
                        style={{
                          ...styles.checkboxContainer,
                          borderColor: isChecked ? '#F97316' : '#1C1C1C',
                          backgroundColor: isChecked ? 'rgba(249, 115, 22, 0.05)' : '#0F0F0F'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {}} // toggled by parent onClick
                          style={styles.checkbox}
                        />
                        <span style={{ fontSize: 13, color: isChecked ? '#FFF' : '#A0A0A0' }}>{ing.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={closeModal} style={styles.btnCancel}>Cancelar</button>
                <button type="submit" style={styles.btnSave}>
                  {isEditing ? 'Guardar Cambios' : 'Crear Receta'}
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
    backgroundColor: "#F97316",
    color: "#FFF",
    border: "none",
    borderRadius: 8,
    padding: "12px 24px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s",
    ':hover': {
      backgroundColor: "#EA580C"
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
    borderTop: "3px solid #F97316",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 24,
    paddingBottom: 40
  },
  card: {
    backgroundColor: "#141414",
    border: "1px solid #1C1C1C",
    borderRadius: 16,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transition: "all 0.2s ease",
  },
  cardImage: {
    height: 180,
    backgroundSize: "cover",
    backgroundPosition: "center",
    borderBottom: "1px solid #1C1C1C"
  },
  cardContent: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    flex: 1
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 600,
    color: "#F5F5F0",
    margin: 0
  },
  recipeCost: {
    fontSize: 14,
    fontWeight: 700,
    color: "#34D399"
  },
  recipeDesc: {
    fontSize: 13,
    color: "#888",
    lineHeight: 1.5,
    margin: 0,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden"
  },
  tagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: "auto"
  },
  tag: {
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#A0A0A0",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 500
  },
  tagTime: {
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    color: "#F97316",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600
  },
  cardActions: {
    display: "flex",
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTop: "1px solid #1C1C1C"
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: "#1C1C1C",
    color: "#F5F5F0",
    border: "none",
    padding: "10px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s",
    ':hover': {
      backgroundColor: "#2C2C2C"
    }
  },
  btnDanger: {
    flex: 1,
    backgroundColor: "transparent",
    color: "#EF4444",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    padding: "10px",
    borderRadius: 8,
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
    maxWidth: '560px',
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
      borderColor: '#F97316'
    }
  },
  textarea: {
    backgroundColor: '#0A0A0A',
    border: '1px solid #1C1C1C',
    borderRadius: '10px',
    padding: '12px 14px',
    color: '#FFF',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    ':focus': {
      borderColor: '#F97316'
    }
  },
  select: {
    backgroundColor: '#0A0A0A',
    border: '1px solid #1C1C1C',
    borderRadius: '10px',
    padding: '12px 14px',
    color: '#FFF',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer'
  },
  ingredientsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '10px',
    marginTop: '4px',
    maxHeight: '180px',
    overflowY: 'auto',
    padding: '4px',
    backgroundColor: '#070707',
    borderRadius: '12px',
    border: '1px solid #1C1C1C'
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #1C1C1C',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'all 0.2s ease'
  },
  checkbox: {
    cursor: 'pointer',
    accentColor: '#F97316'
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
    backgroundColor: '#F97316',
    color: '#FFF',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#EA580C'
    }
  }
};

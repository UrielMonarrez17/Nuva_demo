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
  const [formFixedCost, setFormFixedCost] = useState("15");
  const [formPrepTime, setFormPrepTime] = useState("10");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formRestaurantId, setFormRestaurantId] = useState("rest_nativa");

  // Custom ingredients selection states
  const [formAllowedIngredients, setFormAllowedIngredients] = useState([]); // array of ids
  const [formIngredientLimits, setFormIngredientLimits] = useState({}); // { [id]: { min, max, default } }
  
  // Selection states inside form
  const [ingSearch, setIngSearch] = useState("");
  const [selectedIngId, setSelectedIngId] = useState("");
  const [ingDefaultVal, setIngDefaultVal] = useState("100");
  const [ingDefaultUnit, setIngDefaultUnit] = useState("g"); // "g" or "unit"
  const [editingListIngId, setEditingListIngId] = useState("");

  // Recipe options (extras/substitutes) states
  const [formOptions, setFormOptions] = useState([]); // array of { name, type, price }
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionType, setNewOptionType] = useState("extra");
  const [newOptionPrice, setNewOptionPrice] = useState("10");
  const [newOptionReplacesId, setNewOptionReplacesId] = useState("");

  const [isIngDropdownOpen, setIsIngDropdownOpen] = useState(false);

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
        ...doc.data()
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
    setFormIngredientLimits({});
    setFormOptions([]);
    setIngSearch("");
    setSelectedIngId("");
    setIngDefaultVal("100");
    setIngDefaultUnit("g");
    setEditingListIngId("");
    setNewOptionName("");
    setNewOptionPrice("10");
    setNewOptionType("extra");
    setNewOptionReplacesId("");
    setIsIngDropdownOpen(false);
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
    setFormIngredientLimits(recipe.ingredientLimits || {});
    setFormOptions(recipe.options || []);
    setIngSearch("");
    setSelectedIngId("");
    setIngDefaultVal("100");
    setIngDefaultUnit("g");
    setEditingListIngId("");
    setNewOptionName("");
    setNewOptionPrice("10");
    setNewOptionType("extra");
    setNewOptionReplacesId("");
    setIsIngDropdownOpen(false);
    setFormRestaurantId(recipe.restaurantId || "rest_nativa");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (window.confirm("¿Seguro que deseas salir? Se perderán los cambios no guardados en la receta.")) {
      setIsModalOpen(false);
    }
  };

  // Image Upload from computer
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImageUrl(reader.result); // Base64 Data URL
      };
      reader.readAsDataURL(file);
    }
  };

  // Add selected ingredient to allowed lists
  const handleAddIngredientToList = () => {
    if (!selectedIngId) return;
    const ing = ingredientsList.find(i => i.id === selectedIngId);
    if (!ing) return;
    
    // Calculate default grams
    let defGrams = parseFloat(ingDefaultVal) || 0;
    if (ingDefaultUnit === "unit" && ing.averageWeightPerUnit) {
      defGrams = Math.round(defGrams * ing.averageWeightPerUnit);
    }
    
    // Sensible boundaries
    const minG = Math.round(defGrams * 0.2);
    const maxG = Math.round(defGrams * 2.5);
    
    setFormAllowedIngredients(prev => {
      if (prev.includes(selectedIngId)) return prev;
      return [...prev, selectedIngId];
    });
    
    setFormIngredientLimits(prev => ({
      ...prev,
      [selectedIngId]: {
        min: minG,
        max: maxG,
        default: defGrams
      }
    }));
    
    // Reset selection inputs
    setSelectedIngId("");
    setIngDefaultVal("100");
    setIngSearch("");
  };

  // Save edited portion from list
  const handleSaveEditedIngredient = (ingId, newVal, newUnit, ing) => {
    let defGrams = parseFloat(newVal) || 0;
    if (newUnit === "unit" && ing.averageWeightPerUnit) {
      defGrams = Math.round(defGrams * ing.averageWeightPerUnit);
    }
    const minG = Math.round(defGrams * 0.2);
    const maxG = Math.round(defGrams * 2.5);
    
    setFormIngredientLimits(prev => ({
      ...prev,
      [ingId]: {
        min: minG,
        max: maxG,
        default: defGrams
      }
    }));
    setEditingListIngId("");
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
      ingredientLimits: formIngredientLimits,
      options: formOptions,
      restaurantId: targetRestaurantId
    };

    try {
      if (isEditing) {
        await updateDoc(doc(db, "base_recipes", editingRecipeId), recipeData);
      } else {
        await addDoc(collection(db, "base_recipes"), recipeData);
      }
      setIsModalOpen(false);
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

  // Search filter
  const filteredIngList = ingredientsList.filter(ing => 
    ing.name.toLowerCase().includes(ingSearch.toLowerCase())
  );

  // Predict consumer price: (Ingredient cost + fixed base cost) * 3, minimum $90 MXN
  const predictFinalPrice = (recipe) => {
    let ingredientCost = 0;
    
    if (recipe.allowedIngredients && recipe.ingredientLimits) {
      recipe.allowedIngredients.forEach(ingId => {
        const limits = recipe.ingredientLimits[ingId] || {};
        const defaultGrams = limits.default || 0;
        
        // Find ingredient in ingredientsList
        const ing = ingredientsList.find(i => i.id === ingId);
        if (ing) {
          const costPerGram = ing.costPerGram || 0;
          ingredientCost += defaultGrams * costPerGram;
        }
      });
    }
    
    const fixedCost = parseFloat(recipe.fixedCost) || 0;
    const productionCost = ingredientCost + fixedCost;
    const rawPrice = productionCost * 3;
    const finalPrice = Math.max(rawPrice, 90);
    return {
      finalPrice: Math.round(finalPrice),
      ingredientCost: Math.round(ingredientCost * 100) / 100
    };
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

                {(() => {
                  const prediction = predictFinalPrice(recipe);
                  return (
                    <div style={styles.pricePredictionRow}>
                      <span style={styles.pricePredictionLabel}>Precio Consumidor:</span>
                      <strong style={styles.pricePredictionVal}>${prediction.finalPrice} MXN</strong>
                    </div>
                  );
                })()}

                <p style={styles.recipeDesc}>{recipe.description}</p>
                
                <div style={styles.tagsContainer}>
                  {recipe.tags?.map((tag, idx) => (
                    <span key={idx} style={styles.tag}>{tag}</span>
                  ))}
                  <span style={styles.tagTime}>⏱ {recipe.estimatedPrepTime} min</span>
                </div>

                {recipe.options && recipe.options.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#A0A0A0' }}>
                    Extras: {recipe.options.map(o => o.name).join(', ')}
                  </div>
                )}

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

              {/* Image Upload Block */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Subir Imagen desde el Ordenador</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload} 
                  style={styles.fileInput} 
                />
                
                <label style={styles.label} style={{ marginTop: 8 }}>O URL de la Imagen</label>
                <input 
                  type="text" 
                  style={styles.input} 
                  value={formImageUrl} 
                  onChange={(e) => setFormImageUrl(e.target.value)} 
                  placeholder="https://images.unsplash.com/..."
                />

                {formImageUrl && (
                  <div style={{ marginTop: 12 }}>
                    <span style={styles.label}>Previsualización:</span>
                    <img 
                      src={formImageUrl} 
                      alt="Previsualización" 
                      style={styles.previewImage} 
                    />
                  </div>
                )}
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

              {/* Allowed Ingredients with Limits list & config */}
              <div style={{ border: '1px solid #1C1C1C', borderRadius: 16, padding: 16, backgroundColor: '#070707', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h4 style={{ ...styles.sectionHeader, margin: 0 }}>Ingredientes Permitidos</h4>

                {/* Searchable Select (Single component) */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Buscar y Agregar Ingrediente</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Buscar y seleccionar ingrediente..." 
                        value={
                          selectedIngId 
                            ? (ingredientsList.find(i => i.id === selectedIngId)?.name || "") 
                            : ingSearch
                        }
                        onChange={(e) => {
                          if (selectedIngId) {
                            setSelectedIngId("");
                          }
                          setIngSearch(e.target.value);
                          setIsIngDropdownOpen(true);
                        }}
                        onFocus={() => setIsIngDropdownOpen(true)}
                        style={styles.input}
                        readOnly={!!selectedIngId}
                      />
                      {selectedIngId ? (
                        <button 
                          type="button" 
                          onClick={() => {
                            setSelectedIngId("");
                            setIngSearch("");
                          }}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            background: 'transparent',
                            border: 'none',
                            color: '#EF4444',
                            fontSize: '16px',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          ✕
                        </button>
                      ) : (
                        <span style={{ position: 'absolute', right: '12px', color: '#6B6B6B', pointerEvents: 'none' }}>
                          ▼
                        </span>
                      )}
                    </div>

                    {isIngDropdownOpen && !selectedIngId && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#111111',
                        border: '1px solid #1C1C1C',
                        borderRadius: '10px',
                        marginTop: '4px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 100,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                      }}>
                        {filteredIngList.length === 0 ? (
                          <div style={{ padding: '12px', color: '#6B6B6B', fontSize: '13px' }}>
                            No se encontraron ingredientes
                          </div>
                        ) : (
                          filteredIngList.map((ing) => (
                            <div 
                              key={ing.id}
                              onClick={() => {
                                setSelectedIngId(ing.id);
                                setIsIngDropdownOpen(false);
                                setIngSearch("");
                                if (ing.averageWeightPerUnit) {
                                  setIngDefaultUnit("unit");
                                  setIngDefaultVal("1");
                                } else {
                                  setIngDefaultUnit("g");
                                  setIngDefaultVal("100");
                                }
                              }}
                              style={{
                                padding: '10px 14px',
                                cursor: 'pointer',
                                color: '#FFF',
                                fontSize: '13px',
                                borderBottom: '1px solid #1C1C1C',
                                transition: 'background-color 0.2s',
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#1C1C1C'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              <div style={{ fontWeight: 600 }}>{ing.name}</div>
                              <div style={{ fontSize: 11, color: '#A0A0A0', marginTop: 2 }}>
                                {ing.kcalPerGram} kcal/g · 1 {ing.unitName || 'porcion'} = {ing.averageWeightPerUnit || 1}g
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  
                  {selectedIngId && (
                    <div style={{ ...styles.addIngRow, marginTop: 12 }}>
                      <input 
                        type="number" 
                        step="0.01"
                        value={ingDefaultVal}
                        onChange={e => setIngDefaultVal(e.target.value)}
                        placeholder="Porción"
                        style={{ ...styles.input, width: 85 }}
                      />
                      
                      {(() => {
                        const ing = ingredientsList.find(i => i.id === selectedIngId);
                        return (
                          <select
                            value={ingDefaultUnit}
                            onChange={e => setIngDefaultUnit(e.target.value)}
                            style={styles.select}
                          >
                            <option value="g">g</option>
                            {ing?.averageWeightPerUnit && (
                              <option value="unit">{ing.unitName || 'pieza'}</option>
                            )}
                          </select>
                        );
                      })()}
                      
                      <button 
                        type="button" 
                        onClick={handleAddIngredientToList}
                        style={styles.btnAddOption}
                      >
                        + Agregar
                      </button>
                    </div>
                  )}
                  
                  {selectedIngId && ingDefaultUnit === "unit" && (
                    <span style={{ fontSize: 12, color: '#34D399', marginTop: 8 }}>
                      {(() => {
                        const ing = ingredientsList.find(i => i.id === selectedIngId);
                        const val = parseFloat(ingDefaultVal) || 0;
                        return `Equivale a: ${Math.round(val * (ing?.averageWeightPerUnit || 0))} gramos`;
                      })()}
                    </span>
                  )}
                </div>

                {/* List of currently added ingredients */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Ingredientes Seleccionados ({formAllowedIngredients.length})</label>
                  {formAllowedIngredients.length > 0 ? (
                    <div style={styles.selectedIngsList}>
                      {formAllowedIngredients.map(ingId => {
                        const ing = ingredientsList.find(i => i.id === ingId);
                        if (!ing) return null;
                        const limits = formIngredientLimits[ingId] || { default: 100 };
                        const isEditingThis = editingListIngId === ingId;
                        
                        return (
                          <div key={ingId} style={styles.selectedIngItem}>
                            {isEditingThis ? (
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                                <span style={{ fontSize: 13, color: '#FFF', flex: 1 }}>{ing.name}</span>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  defaultValue={ing.averageWeightPerUnit ? (limits.default / ing.averageWeightPerUnit) : limits.default} 
                                  id={`edit-val-${ingId}`}
                                  style={{ ...styles.input, width: 70, padding: '6px 8px' }}
                                />
                                <select 
                                  defaultValue={ing.averageWeightPerUnit ? "unit" : "g"}
                                  id={`edit-unit-${ingId}`}
                                  style={{ ...styles.select, padding: '6px 8px' }}
                                  disabled={!ing.averageWeightPerUnit}
                                >
                                  <option value="g">g</option>
                                  {ing.averageWeightPerUnit && <option value="unit">{ing.unitName || 'pieza'}</option>}
                                </select>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const valInput = document.getElementById(`edit-val-${ingId}`).value;
                                    const unitSelect = document.getElementById(`edit-unit-${ingId}`).value;
                                    handleSaveEditedIngredient(ingId, valInput, unitSelect, ing);
                                  }} 
                                  style={{ ...styles.btnSaveMini, padding: '6px 12px', fontSize: 12 }}
                                >
                                  Guardar
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => setEditingListIngId("")} 
                                  style={{ ...styles.btnCancelMini, padding: '6px 12px', fontSize: 12 }}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{ing.name}</span>
                                  <span style={{ fontSize: 12, color: '#A0A0A0', marginLeft: 12 }}>
                                    Porción: {limits.default}g 
                                    {ing.averageWeightPerUnit ? ` (~ ${(limits.default / ing.averageWeightPerUnit).toFixed(2)} ${ing.unitName || 'pieza'})` : ''}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button 
                                    type="button" 
                                    onClick={() => setEditingListIngId(ingId)} 
                                    style={styles.btnMiniEdit}
                                  >
                                    Editar
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      setFormAllowedIngredients(prev => prev.filter(id => id !== ingId));
                                      setFormIngredientLimits(prev => {
                                        const next = { ...prev };
                                        delete next[ingId];
                                        return next;
                                      });
                                    }} 
                                    style={styles.btnMiniDanger}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: '#6B6B6B', margin: '4px 0' }}>No hay ingredientes agregados a esta receta.</p>
                  )}
                </div>
              </div>

              {/* Recipe options (Extras / Substitutes) */}
              <div style={{ border: '1px solid #1C1C1C', borderRadius: 16, padding: 16, backgroundColor: '#070707', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h4 style={{ ...styles.sectionHeader, margin: 0 }}>Opciones del Platillo (Extras y Sustitutos)</h4>
                
                {formOptions.length > 0 ? (
                  <div style={styles.optionsList}>
                    {formOptions.map((opt, idx) => (
                      <div key={idx} style={styles.optionItem}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{opt.name}</span>
                          <span style={{ fontSize: 11, color: opt.type === 'substitute' ? '#A78BFA' : '#34D399' }}>
                            {opt.type === 'substitute' 
                              ? `Sustituto ${opt.replacesName ? `de ${opt.replacesName}` : ''}` 
                              : 'Extra'} · ${opt.price} MXN
                          </span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setFormOptions(prev => prev.filter((_, i) => i !== idx))} 
                          style={styles.btnDeleteOption}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: '#6B6B6B', margin: '4px 0' }}>No se han agregado opciones adicionales.</p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={styles.addOptionRow}>
                    <input 
                      type="text" 
                      placeholder="Ej. Pollo Extra" 
                      value={newOptionName} 
                      onChange={e => setNewOptionName(e.target.value)} 
                      style={{ ...styles.input, flex: 2 }}
                    />
                    <select 
                      value={newOptionType} 
                      onChange={e => {
                        setNewOptionType(e.target.value);
                        setNewOptionReplacesId("");
                      }} 
                      style={{ ...styles.select, flex: 1 }}
                    >
                      <option value="extra">Extra</option>
                      <option value="substitute">Sustituto</option>
                    </select>
                    <input 
                      type="number" 
                      placeholder="Precio" 
                      value={newOptionPrice} 
                      onChange={e => setNewOptionPrice(e.target.value)} 
                      style={{ ...styles.input, width: 70 }}
                    />
                  </div>

                  {newOptionType === "substitute" && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={styles.label}>Ingrediente original que sustituye:</label>
                      <select
                        value={newOptionReplacesId}
                        onChange={e => setNewOptionReplacesId(e.target.value)}
                        style={styles.select}
                      >
                        <option value="">-- Selecciona el ingrediente original --</option>
                        {formAllowedIngredients.map(ingId => {
                          const ing = ingredientsList.find(i => i.id === ingId);
                          return (
                            <option key={ingId} value={ingId}>
                              {ing?.name || ingId}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  <button 
                    type="button" 
                    onClick={() => {
                      if (!newOptionName.trim()) {
                        alert("Por favor ingresa un nombre para la opción.");
                        return;
                      }
                      const price = parseFloat(newOptionPrice) || 0;
                      const replacesId = newOptionType === 'substitute' ? newOptionReplacesId : null;
                      const replacesName = newOptionType === 'substitute' && replacesId 
                        ? (ingredientsList.find(i => i.id === replacesId)?.name || "")
                        : null;

                      setFormOptions(prev => [...prev, { 
                        name: newOptionName.trim(), 
                        type: newOptionType, 
                        price,
                        replacesId,
                        replacesName
                      }]);
                      setNewOptionName("");
                      setNewOptionPrice("10");
                      setNewOptionReplacesId("");
                    }} 
                    style={{ ...styles.btnAddOption, width: '100%', marginTop: 4 }}
                  >
                    + Agregar Opción
                  </button>
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
    maxWidth: '600px',
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
    color: '#F97316',
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
    width: '100%',
    boxSizing: 'border-box',
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
    width: '100%',
    boxSizing: 'border-box',
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
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#0A0A0A',
    border: '1px solid #1C1C1C',
    borderRadius: '10px',
    padding: '12px 14px',
    color: '#FFF',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer'
  },
  fileInput: {
    color: '#A0A0A0',
    fontSize: '14px'
  },
  previewImage: {
    width: '100%',
    maxHeight: 180,
    objectFit: 'cover',
    borderRadius: 12,
    border: '1px solid #1C1C1C',
    marginTop: 8
  },

  // Options lists styling
  optionsList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    backgroundColor: "#070707",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #1C1C1C",
    maxHeight: 150,
    overflowY: "auto"
  },
  optionItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #1C1C1C"
  },
  btnDeleteOption: {
    backgroundColor: "transparent",
    border: "none",
    color: "#EF4444",
    cursor: "pointer",
    fontSize: 14,
    padding: 4
  },
  addOptionRow: {
    display: "flex",
    gap: 8,
    marginTop: 8
  },
  btnAddOption: {
    backgroundColor: "#1C1C1C",
    color: "#F97316",
    border: "1px solid rgba(249, 115, 22, 0.3)",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer"
  },

  // Selected ingredients styling
  selectedIngsList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    backgroundColor: "#070707",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #1C1C1C",
    maxHeight: 200,
    overflowY: "auto"
  },
  selectedIngItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #1C1C1C"
  },
  addIngRow: {
    display: "flex",
    gap: 8,
    marginTop: 8
  },
  btnMiniEdit: {
    backgroundColor: "transparent",
    color: "#F97316",
    border: "1px solid rgba(249, 115, 22, 0.3)",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer"
  },
  btnMiniDanger: {
    backgroundColor: "transparent",
    color: "#EF4444",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer"
  },
  btnSaveMini: {
    backgroundColor: "#F97316",
    color: "#FFF",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600
  },
  btnCancelMini: {
    backgroundColor: "#1C1C1C",
    color: "#FFF",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600
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
  },
  pricePredictionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    border: '1px solid rgba(52, 211, 153, 0.2)',
    borderRadius: '8px',
    padding: '6px 12px',
    margin: '10px 0',
  },
  pricePredictionLabel: {
    fontSize: '12px',
    color: '#A0A0A0',
    fontWeight: 500,
  },
  pricePredictionVal: {
    fontSize: '14px',
    color: '#34D399',
    fontWeight: 700,
  }
};

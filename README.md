# NOMI Demo Workspace 🍊

Este repositorio contiene la demostración y prototipos funcionales del ecosistema **NOMI**, una plataforma moderna para la gestión de pedidos y visualización en cocina (KDS).

El proyecto está dividido en dos aplicaciones principales que interactúan entre sí a través de Firebase.

---

## 📂 Estructura del Proyecto

El espacio de trabajo consta de los siguientes directorios clave:

```bash
Nuva_demo/
├── Prototipo1/        # Aplicación cliente / Administrador (Ionic + React + TypeScript)
├── nomi-kds/          # Pantalla de cocina (KDS) para tabletas y monitores (Vite + React + Tailwind CSS)
├── Logo.png           # Recurso gráfico del logotipo oficial de NOMI
└── package.json       # Configuración global y scripts auxiliares (ej. semilla de base de datos)
```

---

## 🚀 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
* **Node.js** (Versión 18 o superior recomendada)
* **npm** (Viene integrado con Node.js)

---

## ⚙️ Configuración y Ejecución

### 1. Inicialización de la Base de Datos (Opcional)
Si necesitas poblar la base de datos de Firestore con datos de prueba iniciales, puedes ejecutar el script de semilla desde la raíz del proyecto:

```bash
# Instalar dependencias en la raíz
npm install

# Ejecutar el script de seed
npm run seed
```

---

### 📱 Prototipo 1: Aplicación Cliente (Ionic)
Esta es la interfaz principal del cliente y del administrador construida sobre **Ionic React**.

#### Instrucciones de inicio:
1. Entra al directorio del proyecto:
   ```bash
   cd Prototipo1
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
4. Abre [http://localhost:8100](http://localhost:8100) (o el puerto indicado en tu terminal) en tu navegador.

---

### 🖥️ Nomi-KDS: Kitchen Display System
Esta es la pantalla optimizada para tabletas o pantallas de cocina encargada de mostrar el estado de las órdenes en tiempo real, desarrollada con **React, Vite y Tailwind CSS**.

#### Instrucciones de inicio:
1. Entra al directorio del proyecto:
   ```bash
   cd nomi-kds
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
4. Abre la dirección local proporcionada por la consola (generalmente [http://localhost:5173](http://localhost:5173)).

---

## 💡 Notas de Solución de Problemas (Windows PowerShell)

Si al intentar ejecutar comandos de `npm` en Windows usando PowerShell recibes un error de seguridad relacionado con la ejecución de scripts (`Execution_Policies`), puedes emplear cualquiera de las siguientes alternativas para saltar esta restricción:

* **Opción A (Recomendada):** Usa la consola clásica de comandos de Windows (`cmd`).
* **Opción B:** Ejecuta el comando en PowerShell indicando explícitamente el bypass de política:
  ```powershell
  powershell -ExecutionPolicy Bypass -Command "npm run dev"
  ```

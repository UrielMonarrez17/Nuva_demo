// src/kds/hooks/useKitchenOrders.js

import { useState, useEffect } from "react";
import { db } from "../../firebase/firebaseconfig";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Hook que escucha en tiempo real las órdenes PENDING y READY de Firestore.
 * Devuelve también la función para marcar una orden como READY.
 *
 * @returns {{
 *   pendingOrders: Array,
 *   readyOrders: Array,
 *   loading: boolean,
 *   error: string|null,
 *   markAsReady: (orderId: string) => Promise<void>
 * }}
 */
export function useKitchenOrders(restaurantId = null) {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Query 1: órdenes en estado PENDING ordenadas por fecha de creación
    const pendingQuery = query(
      collection(db, "orders"),
      where("status", "==", "PENDING"),
      orderBy("createdAt", "asc")
    );

    // Query 2: órdenes en estado READY de los últimos minutos (para mostrar historial reciente)
    const readyQuery = query(
      collection(db, "orders"),
      where("status", "==", "READY"),
      orderBy("createdAt", "desc")
    );

    let pendingLoaded = false;
    let readyLoaded = false;

    const checkAllLoaded = () => {
      if (pendingLoaded && readyLoaded) {
        setLoading(false);
      }
    };

    // Listener para PENDING
    const unsubscribePending = onSnapshot(
      pendingQuery,
      (snapshot) => {
        let orders = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            // Soporte mixto: Firestore Timestamp (toDate) o ISO String del cliente
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          };
        });
        
        if (restaurantId && restaurantId !== "all") {
          orders = orders.filter(order => order.items?.some(item => item.restaurantId === restaurantId));
        }
        
        setPendingOrders(orders);
        pendingLoaded = true;
        checkAllLoaded();
      },
      (err) => {
        console.error("Error escuchando órdenes PENDING:", err);
        setError("No se pudo conectar con Firestore. Verifica tu conexión.");
        setLoading(false);
      }
    );

    // Listener para READY
    const unsubscribeReady = onSnapshot(
      readyQuery,
      (snapshot) => {
        let orders = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
            readyAt: data.readyAt ? (data.readyAt?.toDate ? data.readyAt.toDate() : new Date(data.readyAt)) : null,
          };
        });
        
        if (restaurantId && restaurantId !== "all") {
          orders = orders.filter(order => order.items?.some(item => item.restaurantId === restaurantId));
        }
        
        // Mostrar solo las últimas 10 órdenes listas para no saturar la pantalla
        setReadyOrders(orders.slice(0, 10));
        readyLoaded = true;
        checkAllLoaded();
      },
      (err) => {
        console.error("Error escuchando órdenes READY:", err);
        setLoading(false);
      }
    );

    // Cleanup: cancelar ambos listeners al desmontar el componente
    return () => {
      unsubscribePending();
      unsubscribeReady();
    };
  }, [restaurantId]);

  /**
   * Cambia el status de una orden de PENDING a READY en Firestore.
   * El listener onSnapshot actualizará la UI automáticamente.
   * @param {string} orderId
   */
  const markAsReady = async (orderId) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "READY",
        readyAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(`Error actualizando orden ${orderId}:`, err);
      throw new Error("No se pudo actualizar la orden. Intenta de nuevo.");
    }
  };

  return {
    pendingOrders,
    readyOrders,
    loading,
    error,
    markAsReady,
  };
}
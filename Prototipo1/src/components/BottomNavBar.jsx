// src/components/BottomNavBar.jsx

import React from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { IonIcon } from "@ionic/react";
import {
  restaurantOutline,
  cartOutline,
  documentTextOutline,
  personOutline,
  peopleOutline,
  checkmarkCircleOutline,
  timeOutline,
  calendarOutline
} from "ionicons/icons";

export default function BottomNavBar() {
  const { userProfile, activeRole, cart, prescriptions } = useApp();
  const history = useHistory();
  const location = useLocation();

  if (!userProfile) return null; // Hide if not logged in

  const currentPath = location.pathname;

  // Count items
  const cartCount = cart.length;
  const pendingPrescriptionsCount = prescriptions.filter(p => p.status === "pending").length;

  const navigateTo = (path) => {
    history.push(path);
  };

  const clientTabs = [
    {
      label: "Menú",
      path: "/home",
      icon: restaurantOutline,
      badge: 0
    },
    {
      label: "Planes",
      path: "/plans",
      icon: calendarOutline,
      badge: 0
    },
    {
      label: "Carrito",
      path: "/cart",
      icon: cartOutline,
      badge: cartCount
    },
    {
      label: "Pedidos",
      path: "/orders",
      icon: timeOutline,
      badge: 0
    },
    {
      label: "Perfil",
      path: "/profile",
      icon: personOutline,
      badge: pendingPrescriptionsCount
    }
  ];

  const nutriologistTabs = [
    {
      label: "Pacientes",
      path: "/nutri-dashboard",
      icon: peopleOutline,
      badge: 0
    },
    {
      label: "Menú Recetas",
      path: "/home",
      icon: restaurantOutline,
      badge: 0
    },
    {
      label: "Perfil",
      path: "/profile",
      icon: personOutline,
      badge: 0
    }
  ];

  const tabs = activeRole === "nutriologist" ? nutriologistTabs : clientTabs;

  return (
    <div style={styles.tabBar}>
      <div style={styles.innerBar}>
        {tabs.map((tab) => {
          const isActive = currentPath === tab.path;
          return (
            <button
              key={tab.label}
              onClick={() => navigateTo(tab.path)}
              style={{
                ...styles.tabButton,
                color: isActive ? "#F97316" : "#64748B"
              }}
            >
              <div style={styles.iconWrapper}>
                <IonIcon icon={tab.icon} style={styles.icon} />
                {tab.badge > 0 && (
                  <span style={styles.badge}>{tab.badge}</span>
                )}
              </div>
              <span style={{
                ...styles.label,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#F97316" : "#64748B"
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  tabBar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#131316",
    borderTop: "1px solid #222227",
    padding: "8px 0 24px 0", // Bottom padding for iOS safe area style
    zIndex: 900,
    display: "flex",
    justifyContent: "center",
  },
  innerBar: {
    display: "flex",
    width: "100%",
    maxWidth: 480,
    justifyContent: "space-around",
    alignItems: "center",
    padding: "0 12px",
  },
  tabButton: {
    background: "none",
    border: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    cursor: "pointer",
    padding: "6px 12px",
    flex: 1,
    transition: "transform 0.1s ease",
    position: "relative"
  },
  iconWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 22,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: "#F97316",
    color: "#000",
    fontSize: 10,
    fontWeight: 700,
    borderRadius: "50%",
    width: 16,
    height: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #131316"
  },
  label: {
    fontSize: 10,
    letterSpacing: "0.02em",
  }
};

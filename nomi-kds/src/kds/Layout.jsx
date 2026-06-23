import React, { useState, useEffect } from 'react';
import { db } from "../firebase/firebaseconfig";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

export default function Layout({ currentView, onViewChange, user, onLogout, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [restaurantStatus, setRestaurantStatus] = useState(true);

  useEffect(() => {
    if (!user || user.restaurantId === "all") return;
    const unsub = onSnapshot(doc(db, "restaurants", user.restaurantId), (docSnap) => {
      if (docSnap.exists()) {
        setRestaurantStatus(docSnap.data().isAvailable !== false);
      }
    });
    return () => unsub();
  }, [user]);

  const toggleAvailability = async () => {
    if (!user || user.restaurantId === "all") return;
    try {
      await updateDoc(doc(db, "restaurants", user.restaurantId), {
        isAvailable: !restaurantStatus
      });
    } catch (e) {
      console.error("Error toggling availability:", e);
    }
  };

  const menuItems = [
    { id: "orders", label: "Órdenes (KDS)", icon: "🍳" },
    { id: "menu", label: "Mi Menú", icon: "📋" },
    { id: "macros", label: "Ingredientes / Macros", icon: "🥑" },
  ];

  // Get first letter for avatar
  const getAvatarChar = () => {
    if (user && user.username) return user.username.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div style={styles.layoutContainer}>
      {/* Sidebar */}
      <nav style={{
        ...styles.sidebar,
        width: isCollapsed ? 0 : 280,
        opacity: isCollapsed ? 0 : 1,
        borderRight: isCollapsed ? "none" : "1px solid #1C1C1C",
      }}>
        <div style={styles.logoHeader}>
          <div style={styles.logoContainer}>
            <span style={styles.logoNomi}>NOMI</span>
            <span style={styles.logoSub}>Admin</span>
          </div>
          <button 
            onClick={() => setIsCollapsed(true)} 
            style={styles.collapseBtn}
            title="Ocultar menú"
          >
            ◀
          </button>
        </div>
        
        <div style={styles.navMenu}>
          {menuItems.map(item => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {})
                }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>
        
        {user && user.restaurantId !== "all" && (
          <div style={styles.availabilitySection}>
            <span style={styles.availabilityLabel}>Plataforma Nomi:</span>
            <button
              type="button"
              onClick={toggleAvailability}
              style={{
                ...styles.availabilityBtn,
                backgroundColor: restaurantStatus ? "rgba(52, 211, 153, 0.1)" : "rgba(239, 68, 68, 0.1)",
                color: restaurantStatus ? "#34D399" : "#EF4444",
                borderColor: restaurantStatus ? "#34D399" : "#EF4444",
              }}
            >
              {restaurantStatus ? "🟢 Disponible" : "🔴 Fuera de Servicio"}
            </button>
          </div>
        )}

        {user && (
          <div style={styles.userSection}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div style={styles.userAvatar}>{getAvatarChar()}</div>
              <div style={styles.userInfo}>
                <span style={styles.userName}>{user.username}</span>
                <span style={styles.userRole}>{user.restaurantName}</span>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              style={styles.logoutBtn}
              title="Cerrar Sesión"
            >
              🚪
            </button>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main style={{
        ...styles.mainContent,
        paddingLeft: isCollapsed ? 64 : 0, // extra spacing when collapsed to accommodate floating menu button
      }}>
        {isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(false)} 
            style={styles.expandBtn}
            title="Mostrar menú"
          >
            ☰
          </button>
        )}
        {children}
      </main>
    </div>
  );
}

const styles = {
  layoutContainer: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    backgroundColor: "#0A0A0A",
    color: "#F5F5F0",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflow: "hidden"
  },
  sidebar: {
    backgroundColor: "#111111",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    overflow: "hidden",
  },
  logoHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 16,
  },
  logoContainer: {
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    flex: 1
  },
  logoNomi: {
    fontSize: 24,
    fontWeight: 800,
    color: "#F97316",
    letterSpacing: "0.1em",
  },
  logoSub: {
    fontSize: 12,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    marginTop: 4
  },
  collapseBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#6B6B6B",
    fontSize: 16,
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s, background-color 0.2s",
    ':hover': {
      color: "#F97316",
      backgroundColor: "rgba(255,255,255,0.05)"
    }
  },
  expandBtn: {
    position: "absolute",
    left: 20,
    top: 20,
    zIndex: 50,
    width: 44,
    height: 44,
    borderRadius: "12px",
    backgroundColor: "#111111",
    border: "1px solid #1C1C1C",
    color: "#F97316",
    fontSize: 20,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
    transition: "all 0.2s ease",
    ':hover': {
      backgroundColor: "#1C1C1C",
      transform: "scale(1.05)"
    }
  },
  navMenu: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "0 16px"
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "16px",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: 12,
    color: "#A0A0A0",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease",
    width: "100%",
  },
  navItemActive: {
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    color: "#F97316",
  },
  navIcon: {
    fontSize: 20
  },
  userSection: {
    padding: "24px",
    borderTop: "1px solid #1C1C1C",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    backgroundColor: "#F97316",
    color: "#FFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 18,
    flexShrink: 0
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  userName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#F5F5F0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  userRole: {
    fontSize: 12,
    color: "#6B6B6B",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  logoutBtn: {
    backgroundColor: "transparent",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    padding: 8,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s",
    ':hover': {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
    }
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
    transition: "padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  availabilitySection: {
    padding: "16px 24px",
    borderTop: "1px solid #1C1C1C",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  availabilityLabel: {
    fontSize: 12,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600,
  },
  availabilityBtn: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "center",
    width: "100%",
  }
};


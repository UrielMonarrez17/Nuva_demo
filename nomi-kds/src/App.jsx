import { useState, useEffect } from 'react'
import './App.css'

import Layout from "./kds/Layout";
import KitchenDashboard from "./kds/KitchenDashboard";
import MenuDashboard from "./kds/MenuDashboard";
import MacrosDashboard from "./kds/MacrosDashboard";
import LoginScreen from "./kds/LoginScreen";

export default function App() {
  const [currentView, setCurrentView] = useState("orders");
  const [selectedRestaurant, setSelectedRestaurant] = useState("all"); 
  const [user, setUser] = useState(null); // { restaurantId, username, restaurantName }
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (restaurantId, username, restaurantName) => {
    setUser({ restaurantId, username, restaurantName });
    setSelectedRestaurant(restaurantId);
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedRestaurant("all");
    setCurrentView("orders");
  };

  if (showSplash) {
    return (
      <div style={splashStyles.loadingContainer}>
        <style>
          {`
            @keyframes tailwindPulse {
              0%, 100% { opacity: 1; }
              50% { opacity: .5; }
            }
            @media (min-width: 768px) {
              .splash-logo { width: 300px !important; height: 300px !important; border-radius: 48px !important; }
              .splash-title { font-size: 80px !important; }
              .splash-spinner { width: 80px !important; height: 80px !important; margin-top: 48px !important; }
              .splash-gap { gap: 48px !important; }
            }
          `}
        </style>
        <div style={splashStyles.logoBox} className="splash-gap">
          <img src="/logo.png" alt="NOMI Logo" style={splashStyles.logoImg} className="splash-logo" />
          <h1 style={splashStyles.logoTitle} className="splash-title">NOMI</h1>
          <svg 
            className="animate-spin splash-spinner" 
            style={splashStyles.spinner}
            viewBox="0 0 50 50"
          >
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="80, 200"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderView = () => {
    // If user is locked to a specific restaurant, override selectedRestaurant to their ID for security/accuracy
    const effectiveRestaurant = user.restaurantId !== "all" ? user.restaurantId : selectedRestaurant;
    
    switch (currentView) {
      case "orders":
        return (
          <KitchenDashboard 
            selectedRestaurant={effectiveRestaurant} 
            onSelectRestaurant={setSelectedRestaurant} 
            allowSwitch={user.restaurantId === "all"} // Admin can switch kitchens, single restaurants are locked
          />
        );
      case "menu":
        return <MenuDashboard selectedRestaurant={effectiveRestaurant} />;
      case "macros":
        return <MacrosDashboard />;
      default:
        return (
          <KitchenDashboard 
            selectedRestaurant={effectiveRestaurant} 
            onSelectRestaurant={setSelectedRestaurant} 
            allowSwitch={user.restaurantId === "all"}
          />
        );
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      onViewChange={setCurrentView}
      user={user}
      onLogout={handleLogout}
    >
      {renderView()}
    </Layout>
  );
}

// styles moved to tailwind

const splashStyles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#FFF7ED',
    color: '#F97316',
    gap: 24,
  },
  logoBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  logoImg: {
    width: '120px',
    height: '120px',
    objectFit: 'contain',
    borderRadius: '24px',
    boxShadow: '0 10px 30px rgba(249, 115, 22, 0.15)',
    animation: 'tailwindPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
  logoTitle: {
    fontSize: '40px',
    fontWeight: 900,
    letterSpacing: '0.05em',
    color: '#F97316',
    margin: 0,
    fontFamily: "'Inter', 'Roboto', sans-serif",
  },
  spinner: {
    marginTop: '24px',
    width: '36px',
    height: '36px',
    color: '#F97316',
  }
};



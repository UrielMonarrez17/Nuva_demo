import { useState } from 'react'
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

  const handleLogin = (restaurantId, username, restaurantName) => {
    setUser({ restaurantId, username, restaurantName });
    setSelectedRestaurant(restaurantId);
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedRestaurant("all");
    setCurrentView("orders");
  };

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


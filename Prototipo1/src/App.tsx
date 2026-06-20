// src/App.tsx

import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact, IonSpinner } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AppProvider, useApp } from './context/AppContext';

// Pages
import LoginScreen from './pages/LoginScreen';
import Home from './pages/Home.jsx';
import CustomDishScreen from './pages/CustomDishScreen';
import CartScreen from './pages/CartScreen';
import MedicalInboxScreen from './pages/MedicalInboxScreen';
import NutriDashboard from './pages/NutriDashboard';
import ProfileScreen from './pages/ProfileScreen';
import OrdersScreen from './pages/OrdersScreen';
import PlansScreen from './pages/PlansScreen';

// Components
import BottomNavBar from './components/BottomNavBar';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

/**
 * Guard component: redirects unauthenticated users to /login
 */
function ProtectedRoute({ children, ...rest }: any) {
  const { currentUser, loading } = useApp();
  
  return (
    <Route
      {...rest}
      render={() => {
        if (loading) return null;
        if (!currentUser) return <Redirect to="/login" />;
        return children;
      }}
    />
  );
}

const MainApp: React.FC = () => {
  const { currentUser, loading } = useApp();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinnerOuter}>
          <div style={styles.spinnerInner} />
        </div>
        <p style={styles.loadingText}>Iniciando nomi...</p>
      </div>
    );
  }

  return (
    <IonReactRouter>
      <IonRouterOutlet id="main-content">
        <Route exact path="/login" render={() => (
          currentUser ? <Redirect to="/home" /> : <LoginScreen />
        )} />
        
        <Route exact path="/home" render={() => (
          !currentUser ? <Redirect to="/login" /> : <Home />
        )} />
        
        <Route exact path="/customDish/:recipeId" render={() => (
          !currentUser ? <Redirect to="/login" /> : <CustomDishScreen />
        )} />
        
        <Route exact path="/cart" render={() => (
          !currentUser ? <Redirect to="/login" /> : <CartScreen />
        )} />
        
        <Route exact path="/medical-inbox" render={() => (
          !currentUser ? <Redirect to="/login" /> : <MedicalInboxScreen />
        )} />
        
        <Route exact path="/nutri-dashboard" render={() => (
          !currentUser ? <Redirect to="/login" /> : <NutriDashboard />
        )} />
        
        <Route exact path="/profile" render={() => (
          !currentUser ? <Redirect to="/login" /> : <ProfileScreen />
        )} />
        
        <Route exact path="/orders" render={() => (
          !currentUser ? <Redirect to="/login" /> : <OrdersScreen />
        )} />
        
        <Route exact path="/plans" render={() => (
          !currentUser ? <Redirect to="/login" /> : <PlansScreen />
        )} />
        
        <Route exact path="/" render={() => (
          <Redirect to={currentUser ? "/home" : "/login"} />
        )} />
      </IonRouterOutlet>
      
      {/* Dynamic Bottom Navbar shown only when logged in */}
      {currentUser && <BottomNavBar />}
    </IonReactRouter>
  );
};

const App: React.FC = () => (
  <IonApp>
    <AppProvider>
      <MainApp />
    </AppProvider>
  </IonApp>
);

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#0B0B0C',
    color: '#94A3B8',
    gap: 16,
  },
  spinnerOuter: {
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerInner: {
    width: 36,
    height: 36,
    border: '3px solid #1C1C24',
    borderTop: '3px solid #F97316',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '0.05em',
    color: '#F97316',
    textTransform: 'uppercase' as const,
  }
};

export default App;

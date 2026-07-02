// src/App.tsx

import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact, IonSpinner } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AppProvider, useApp } from './context/AppContext';
import { Geolocation } from '@capacitor/geolocation';
import { useEffect } from 'react';

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

  useEffect(() => {
    if (currentUser) {
      const requestGlobalPermissions = async () => {
        try {
          const perm = await Geolocation.checkPermissions();
          if (perm.location !== 'granted') {
            await Geolocation.requestPermissions();
          }
        } catch (error) {
          console.warn("Error requesting global permissions:", error);
        }
      };
      requestGlobalPermissions();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
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
        <div style={styles.logoBox} className="splash-gap">
          <img src="/logo.png" alt="NOMI Logo" style={styles.logoImg} className="splash-logo" />
          <h1 style={styles.logoTitle} className="splash-title">NOMI</h1>
          <IonSpinner color="warning" name="crescent" style={styles.spinner} className="splash-spinner" />
        </div>
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
    backgroundColor: '#FFF7ED',
    color: '#F97316',
    gap: 24,
  },
  logoBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 16,
  },
  logoImg: {
    width: '120px',
    height: '120px',
    objectFit: 'contain' as const,
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
  }
};

export default App;

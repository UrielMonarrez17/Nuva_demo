import React, { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact, IonSpinner, IonToast, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AppProvider, useApp } from './context/AppContext';
import { Geolocation } from '@capacitor/geolocation';
import { restaurantOutline, medkitOutline, chatbubblesOutline, personOutline } from 'ionicons/icons';

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

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';

setupIonicReact();

const MainApp = () => {
  const { currentUser, loading, errorMsg, setErrorMsg, activeRole } = useApp() as any;

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
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-orange-500 gap-6">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="NOMI Logo" className="w-32 h-32 object-contain rounded-3xl animate-pulse" />
          <h1 className="text-4xl font-black tracking-widest m-0">NOMI</h1>
          <IonSpinner color="warning" name="crescent" className="mt-6 w-10 h-10" />
        </div>
      </div>
    );
  }

  return (
    <IonReactRouter>
      {!currentUser ? (
        <IonRouterOutlet>
          <Route exact path="/login" component={LoginScreen} />
          <Route render={() => <Redirect to="/login" />} />
        </IonRouterOutlet>
      ) : (
        <IonTabs>
          <IonRouterOutlet id="main-content">
            <Route exact path="/home" component={Home} />
            <Route exact path="/customDish/:recipeId" component={CustomDishScreen} />
            <Route exact path="/cart" component={CartScreen} />
            <Route exact path="/medical-inbox" component={MedicalInboxScreen} />
            <Route exact path="/nutri-dashboard" component={NutriDashboard} />
            <Route exact path="/profile" component={ProfileScreen} />
            <Route exact path="/orders" component={OrdersScreen} />
            <Route exact path="/plans" component={PlansScreen} />
            <Route exact path="/" render={() => <Redirect to="/home" />} />
          </IonRouterOutlet>

          <IonTabBar slot="bottom" style={{ '--background': '#09090b', '--border': '1px solid #27272a' }}>
            <IonTabButton tab="home" href="/home" style={{ '--color': '#71717a', '--color-selected': '#f97316' }}>
              <IonIcon icon={restaurantOutline} />
              <IonLabel>Inicio</IonLabel>
            </IonTabButton>
            
            <IonTabButton tab="plans" href="/plans" style={{ '--color': '#71717a', '--color-selected': '#f97316' }}>
              <IonIcon icon={medkitOutline} />
              <IonLabel>Mi Plan</IonLabel>
            </IonTabButton>
            
            <IonTabButton tab="chat" href={activeRole === 'nutriologist' ? '/nutri-dashboard' : '/medical-inbox'} style={{ '--color': '#71717a', '--color-selected': '#f97316' }}>
              <IonIcon icon={chatbubblesOutline} />
              <IonLabel>{activeRole === 'nutriologist' ? 'Pacientes' : 'Chat'}</IonLabel>
            </IonTabButton>
            
            <IonTabButton tab="profile" href="/profile" style={{ '--color': '#71717a', '--color-selected': '#f97316' }}>
              <IonIcon icon={personOutline} />
              <IonLabel>Perfil</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      )}

      <IonToast
        isOpen={!!errorMsg}
        message={errorMsg || ""}
        duration={5000}
        onDidDismiss={() => setErrorMsg(null)}
        color="danger"
        position="top"
      />
    </IonReactRouter>
  );
};

const App = () => (
  <IonApp>
    <AppProvider>
      <MainApp />
    </AppProvider>
  </IonApp>
);

export default App;

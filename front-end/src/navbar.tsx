import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Importa tus pantallas
import MainView from './main/MainView'; // Tu pantalla inicial
import Search from './main/search';     // La nueva que creamos
import Settings from './main/settings';   // La otra nueva

const Tab = createBottomTabNavigator();

export default function Navbar() {
  return (
    // "initialRouteName" decide cuál se abre primero.
    // Si no pones nada, abre la primera de la lista.
    <Tab.Navigator initialRouteName="Home">
      
      {/* Pestaña 1: Tu pantalla principal */}
      <Tab.Screen 
        name="Home" 
        component={MainView} 
      />

      {/* Pestaña 2: La pantalla de buscar */}
      <Tab.Screen 
        name="Search" 
        component={Search} 
      />

      {/* Pestaña 3: La pantalla de ajustes */}
      <Tab.Screen 
        name="Configuración" 
        component={Search} 
      />

    </Tab.Navigator>
  );
}
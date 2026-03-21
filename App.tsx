import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { initDB } from './src/database';

export default function App() {
  const[isDbReady, setIsDbReady] = useState<boolean>(false);

  useEffect(() => {
    // Esta función se ejecuta solo una vez cuando la app arranca
    const setupDatabase = async () => {
      initDB(); // Inicializamos las tablas
      setIsDbReady(true); // Le decimos a React que ya podemos mostrar la app
    };

    setupDatabase();
  }, []);

  if (!isDbReady) {
    // Mientras la base de datos se está preparando, mostramos un indicador de carga
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Cargando base de datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido a tu App de Gym!</Text>
      {/* Aquí irían los componentes principales de tu app */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
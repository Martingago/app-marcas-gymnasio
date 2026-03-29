# NextPR

App de gimnasio (React Native + Expo): rutinas, sesiones de entreno, historial y seguimiento. Base de datos local con **expo-sqlite** y **Drizzle ORM**.

## Requisitos

- **Node.js** LTS (18 o 20 recomendado)
- **npm** (incluido con Node)
- Para probar en dispositivo: **Expo Go** o emulador Android / simulador iOS

El proyecto usa **Expo SDK 54**. La app **Expo Go** del móvil debe ser compatible con ese SDK (actualízala desde la tienda si ves el aviso de versión).

## Instalación

```bash
npm install
```

## Desarrollo

| Comando | Descripción |
|--------|-------------|
| `npm start` | Arranca el servidor de Metro (Expo) |
| `npx expo start -c` | Igual que arriba pero **limpia la caché** (útil si ves errores raros) |
| `npm run android` | Inicia Expo y abre en Android (emulador o dispositivo) |
| `npm run ios` | Inicia Expo y abre en iOS (solo macOS) |
| `npm run web` | Ejecuta la app en el navegador |
| `npm run typecheck` | Comprueba tipos TypeScript (`tsc --noEmit`) |
| `npm run build:android:apk` | **APK** con EAS (perfil `preview`) — ver [BUILD_ANDROID.md](./BUILD_ANDROID.md) |
| `npm run build:android:store` | **AAB** para Google Play (perfil `production`) |

Atajos en la terminal de Expo: `a` (Android), `i` (iOS), `r` (recargar).

## Base de datos (Drizzle)

Generar migraciones a partir del esquema:

```bash
npx drizzle-kit generate
```

> Aplica las migraciones según el flujo que tengas definido en el proyecto (SQLite en cliente).

## Build de producción (APK / AAB)

La generación de **APK** instalable y de **AAB** para Play Store se hace con **EAS Build** (Expo Application Services).

Pasos detallados, cuenta Expo y perfiles: **[BUILD_ANDROID.md](./BUILD_ANDROID.md)**.

Resumen rápido (APK para instalar fuera de la tienda):

```bash
npm run build:android:apk
```

(o `npx eas build --platform android --profile preview`).

## Estructura relevante

- `App.tsx` — navegación raíz
- `src/screens/` — pantallas
- `src/db/` — esquema SQLite y seed
- `app.json` — configuración Expo (nombre **NextPR**, slug, iconos)

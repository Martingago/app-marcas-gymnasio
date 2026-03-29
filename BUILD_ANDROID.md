# Generar APK (y AAB) — NextPR

Esta app usa **Expo SDK 54**. Para obtener un **APK** instalable en Android sin pasar por la tienda, o un **AAB** para Google Play, utiliza **EAS Build** (nube de Expo).

## 1. Prerrequisitos

1. Cuenta gratuita en [expo.dev](https://expo.dev) (registro con GitHub/Google/email).
2. **Node.js** y dependencias del proyecto instaladas:

   ```bash
   npm install
   ```

3. **EAS CLI** (puedes usarla sin instalar globalmente):

   ```bash
   npx eas-cli --version
   ```

   ```bash
   npx expo export -c 
   ```

   ```bash
   npx expo doctor
   ```


## 2. Enlazar el proyecto con Expo (primera vez)

Desde la raíz del repositorio:

```bash
npx eas-cli login
npx eas-cli init
```

`eas init` crea o vincula el proyecto en Expo y puede añadir el `projectId` en `app.json` bajo `extra.eas`. Si ya existe `eas.json` en el repo, confirma que el `projectId` coincida con tu cuenta al publicar.

## 3. Identificador de Android

En `app.json` debe existir **`expo.android.package`** (nombre único tipo dominio invertido), por ejemplo:

`com.tuempresa.nextpr`

Sin ese campo, los builds de Android en EAS suelen fallar o pedirlo. Ajusta el valor antes del primer build de producción; **no lo cambies** a la ligera si ya publicaste en Play Store (es el ID de la aplicación).

## 4. Perfiles de build (`eas.json`)

Este repositorio incluye:

| Perfil | Uso típico | Salida Android |
|--------|------------|----------------|
| **preview** | Pruebas internas, compartir APK | **APK** (`buildType: apk`) |
| **production** | Tienda Google Play | **AAB** (bundle) por defecto |

## 5. Comando para generar el APK

Asegúrate de haber hecho `eas login`. Luego (con `eas-cli` instalado en el proyecto):

```bash
npm run build:android:apk
```

Equivalente:

```bash
npx eas build --platform android --profile preview
```

- Sigue el asistente (keystore: deja que Expo la gestione la primera vez salvo que tengas la tuya).
- Al terminar, EAS muestra un **enlace de descarga** del APK.

### Variante no interactiva (CI)

Requiere token y secretos configurados; ver [documentación EAS](https://docs.expo.dev/build-reference/build-configuration/).

## 6. Build para Google Play (AAB)

```bash
npm run build:android:store
```

o `npx eas build --platform android --profile production`.

Sube el artefacto resultante en Google Play Console.

## 7. Instalar el APK en el móvil

1. Descarga el `.apk` desde el enlace que da EAS.
2. En el teléfono, activa **Origen desconocido** / instalación por fuera de Play (según fabricante).
3. Abre el APK y confirma la instalación.

## 8. Problemas frecuentes

- **Caché extraña en desarrollo:** `npx expo start -c`
- **Errores de firma:** en el primer build, elige que Expo genere y guarde el keystore.
- **Límite de builds gratis:** revisa el plan en [expo.dev/pricing](https://expo.dev/pricing).

## Scripts en `package.json` (opcional)

Si añades scripts como `build:android:apk`, pueden ser simplemente:

```json
"build:android:apk": "eas build --platform android --profile preview",
"build:android:store": "eas build --platform android --profile production"
```

Ejecución: `npm run build:android:apk` (con `eas-cli` disponible vía `npx` o dependencia local).

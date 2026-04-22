# Bitácora

<div align="center">

**Bitácora de IA de Código Abierto**

Cada sesión, recordada.

Transforma cualquier sesión hablada en memoria estructurada y buscable. Tu segundo cerebro para conferencias, conferencias y reuniones.

[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-purple.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.25-black)](https://expo.dev/)

</div>

---

## 📖 Resumen

Bitácora es una aplicación de bitácora potenciada por IA construida con React Native y Expo. Permite a los usuarios grabar sesiones de audio, transcribirlas y organizarlas en memorias buscables. Perfecto para conferencias, conferencias, reuniones y cualquier contenido hablado que desees recordar.

## ✨ Características

- **🎙️ Grabación de Audio** - Graba sesiones con captura de audio de alta calidad
- **📝 Transcripción con IA** - Conversión automática de voz a texto
- **🧠 Organización de Memoria** - Estructura y categoriza tus sesiones
- **🔍 Archivo Buscable** - Encuentra cualquier sesión al instante
- **📱 Multiplataforma** - Funciona en iOS, Android y Web
- **🎨 Interfaz Bonita** - Diseño moderno y limpio con TailwindCSS

## 🚀 Estado Actual

**Etapa: Desarrollo Temprano (v1.0.0)**

### ✅ Completado
- Flujo de autenticación (Email/Google)
- Sistema de navegación por pestañas
- Pantalla de inicio con lista de sesiones
- Funcionalidad de grabación
- Interfaz de gestión de memoria
- Pantalla de perfil
- Diseño responsivo

### 🚧 En Progreso
- Integración de transcripción con IA
- Funcionalidad de búsqueda
- Sincronización en la nube
- Modo sin conexión

### 📋 Planeado
- Características avanzadas de IA (resúmenes, insights)
- Características de colaboración
- Opciones de exportación
- Panel de análisis

## 🛠️ Stack Tecnológico

- **Framework**: React Native 0.81.5
- **Plataforma**: Expo SDK 54
- **Navegación**: Expo Router 6.0
- **Estilos**: TailwindCSS + NativeWind 4.1
- **Iconos**: Lucide React Native
- **Lenguaje**: TypeScript

## 📦 Instalación

### Requisitos Previos
- Node.js 18+
- npm o yarn
- App Expo Go (para pruebas) o development build de Expo

### Configuración

```bash
# Clona el repositorio
git clone https://github.com/yourusername/bitacora.git
cd bitacora

# Instala las dependencias
npm install

# Inicia el servidor de desarrollo
npx expo start
```

### Ejecutar la App

- **iOS**: Presiona `i` o abre vía Expo Go
- **Android**: Presiona `a` o abre vía Expo Go
- **Web**: Presiona `w` o abre http://localhost:8084

## 📁 Estructura del Proyecto

```
BITACORA/
├── app/                  # Páginas de Expo Router
│   ├── (tabs)/          # Pantallas de navegación por pestañas
│   │   ├── index.tsx    # Inicio
│   │   ├── record.tsx   # Grabación
│   │   ├── memory.tsx  # Memoria
│   │   └── profile.tsx  # Perfil
│   ├── index.tsx        # Pantalla de autenticación
│   └── _layout.tsx      # Layout raíz
├── components/          # Componentes reutilizables
│   ├── Button.tsx
│   ├── CreateBitacoraModal.tsx
│   └── ModeBadge.tsx
├── lib/                # Utilidades y helpers
├── assets/             # Imágenes, fuentes, etc.
└── global.css          # Estilos globales
```

## 🤝 Contribuir

¡Bienvenimos las contribuciones! Por favor consulta [CONTRIBUTING.md](CONTRIBUTING.md) para las guías.

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo [LICENSE](LICENSE) para detalles.

## 🌍 Idiomas

- [English](README.md)
- [Español](README.es.md) (este archivo)

## 📝 Registro de Cambios

Consulta [CHANGELOG.md](CHANGELOG.md) para el historial de versiones.

## 🔒 Seguridad

Para preocupaciones de seguridad, por favor envía un correo a security@bitacora.app

## 📞 Soporte

- 🐛 Reporta errores vía [GitHub Issues](https://github.com/yourusername/bitacora/issues)
- 💬 Únete a nuestro [Discord](https://discord.gg/bitacora)
- 📧 Email: support@bitacora.app

---

<div align="center">

Desarrollado por [Hashpass.tech](https://hashpass.tech)

Hecho con ❤️

</div>

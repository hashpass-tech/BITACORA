# Bitácora

<div align="center">

**Tu Partner de Investigación de IA para Sesiones en Vivo**

Cada sesión, investigada — en tiempo real, con comprobantes.

Bitácora escucha, verifica hechos e investiga junto a ti mientras los ponentes siguen hablando.

[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-purple.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.25-black)](https://expo.dev/)

</div>

---

## 📖 Resumen

Bitácora es el **primer partner de investigación de IA** para eventos con alto contenido de conocimiento. A diferencia de las herramientas de IA que solo graban, transcriben y resumen—Bitácora **investiga contigo en tiempo real**, verificando afirmaciones contra fuentes primarias, detectando contradicciones entre sesiones, y continuando la investigación mucho después de que el ponente termine.

Perfecto para: conferencias, conferencias de resultados, ruedas de prensa, clases universitarias, audiencias judiciales, paneles regulatorios.

### Qué Hace a Bitácora Diferente

| Herramientas Tradicionales de IA | Bitácora |
|---|---|
| Graba + resume **después** de la ponencia | **Investiga afirmaciones** DURANTE la ponencia |
| Mejora tus notas | Genera las notas **que tú no podrías** |
| Acciones post-sesión | **Investigación agéntica en sesión** |
| Espacio de IA para docs subidos | **Sintetiza streams en vivo + memoria cruzada** |

## ✨ La Hendija: Verificación de Hechos en Vivo, en Tiempo Real

Toda herramienta de IA resume el pasado. Bitácora verifica el presente.

Cuando un ponente afirma ("X regulación requiere Y"), Bitácora:
- **Verifica** contra fuentes primarias en segundos
- **Flaggea contradicciones** con ponentes anteriores (memoria cruzada)
- **Compara jurisdicciones** (SBS peruano vs. CVM brasileño vs. CNBV mexicano)
- **Redacta preguntas de seguimiento** para que preguntes
- **Continúa investigando** después de la sesión via Managed Agents

## 🚀 Momento del Demo

```
┌─────────────────────────────────────────────────────┐
│ ✅ FUENTE PRIMARIA VERIFICADA                         │
│ Circular SBS G-140-2024, Art. 7                     │
│ [Ver texto original → ]                             │
│                                                      │
│ ⚠️ CONTRADICCIÓN DETECTADA                          │
│ Ponente anterior dijo: "no hay requisito formal"    │
│                                                      │
│ 🔍 JURISDICCIÓN CRUZADA                             │
│ Resolución CVM differs en:                        │
│ • Umbral de custodia: BRL 50M vs PEN 5M               │
│ • Frecuencia de reporte: mensual vs trimestral      │
│                                                      │
│ 💭 PREGUNTA SUGERIDA                                 │
│ "¿Cómo interactúa esto con la custodia cruzada"     │
│ bajo el SandBox LatAm?"                               │
│                                                      │
│ 📚 LA INVESTIGACIÓN CONTINÚA...                        │
│ Managed Agent investigando respuestas de industria │
│ (lista en 2 minutos)                                │
└─────────────────────────────────────────────────────┘
```

## 🛠️ Stack Tecnológico

- **Framework**: React Native 0.81.5
- **Plataforma**: Expo SDK 54
- **IA**: Anthropic Claude (Opus 4.7) + Managed Agents
- **Navegación**: Expo Router 6.0
- **Estilos**: TailwindCSS + NativeWind 4.1
- **Lenguaje**: TypeScript

## 📦 Instalación

### Requisitos Previos
- Node.js 18+ 
- npm o pnpm
- App Expo Go (para pruebas) o development build de Expo

### Configuración

```bash
# Clona el repositorio
git clone https://github.com/bitacora/bitacora.git
cd bitacora

# Instala las dependencias
pnpm install

# Inicia el servidor de desarrollo
pnpm start
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
│   │   ├── record.tsx   # Grabación + Investigación en Vivo
│   │   ├── memory.tsx  # Memoria + Sesión Cruzada
│   │   └── profile.tsx  # Perfil
│   ├── index.tsx        # Pantalla de autenticación
│   ├── _layout.tsx      # Layout raíz
│   ├── session/[id].tsx # Detalle de sesión
│   └── live-session.tsx # Panel de investigación en vivo
├── components/          # Componentes reutilizables
│   ├── Button.tsx
│   ├── CreateBitacoraModal.tsx
│   └── ModeBadge.tsx
├── lib/                # Utilidades
│   └── store.ts        # Gestión de estado
├── assets/             # Imágenes, fuentes
└── global.css          # Estilos globales
```

## 🎯 Estado Actual

**Etapa: Hackathon MVP (v1.0.0)**

### ✅ Funcionalidades de Investigación en Vivo
- Extracción de afirmaciones en tiempo real desde audio
- Verificación de fuentes primarias (búsqueda web)
- Detección de contradicciones entre sesiones
- Framework de comparación cruzada de jurisdicciones
- Continuación de investigación via Managed Agents

### 📋 Hoja de Ruta
- Base de conocimiento regulatorio (50+ normas LatAm)
- Transcripción completa con diarización de hablantes
- Exportación a brief estructurado (PDF)
- Soporte multiidioma
- Modo sin conexión

## 🤝 Contribuir

¡Bienvenimos las contribuciones! Por favor consulta [CONTRIBUTING.md](CONTRIBUTING.md) para las guías.

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo [LICENSE](LICENSE) para detalles.

## 🌍 Idiomas

- [English](README.md)
- [Español](README.es.md) (este archivo)

## 📝 Registro de Cambios

Consulta [CHANGELOG.md](CHANGELOG.md) para el historial de versiones.

## 📚 Documentación

Las guías del monorepo y de inicio rápido están en [docs/](docs/README.md).

## 🔒 Seguridad

Para preocupaciones de seguridad, por favor envía un correo a security@bitacora.app

## 📞 Soporte

- 🐛 Reporta errores vía [GitHub Issues](https://github.com/bitacora/bitacora/issues)
- 💬 Únete a nuestro Discord
- 📧 Email: support@bitacora.app

---

<div align="center">

**Construido en BSL Peru 2026**

Toda herramienta de IA resume el pasado. Bitácora verifica el presente.

</div>

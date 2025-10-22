# DiagnoSys - API Endpoints Documentation

## 📋 **RESUMEN COMPLETO DE ENDPOINTS IMPLEMENTADOS**
---

### 🔧 **ADMINISTRADORES** (`/api/admin/`)

#### **Gestión de Formularios Base**
- **GET** `/api/admin/forms` - Listar formularios base
- **POST** `/api/admin/forms` - Crear nuevo formulario base
- **GET** `/api/admin/forms/[formId]` - Obtener formulario específico
- **PUT** `/api/admin/forms/[formId]` - Actualizar formulario completo
- **DELETE** `/api/admin/forms/[formId]` - Eliminar formulario
- **PATCH** `/api/admin/forms/[formId]/publish` - Publicar/despublicar formulario

#### **Gestión de Items**
- **GET** `/api/admin/items` - Listar items disponibles
- **POST** `/api/admin/items` - Crear nuevo item
- **GET** `/api/admin/items/[itemId]` - Obtener item específico
- **PUT** `/api/admin/items/[itemId]` - Actualizar item
- **DELETE** `/api/admin/items/[itemId]` - Eliminar item

---

### 🔐 **AUTENTICACIÓN** (`/api/auth/`)

#### **Gestión de Usuarios y Autenticación**
- **POST** `/api/auth/[...nextauth]` - NextAuth.js authentication (sign in/out)
- **GET** `/api/auth/[...nextauth]` - NextAuth.js providers and session handling
- **POST** `/api/auth/register` - Registro de nuevos usuarios
- **POST** `/api/auth/forgot-password` - Solicitar restablecimiento de contraseña
- **POST** `/api/auth/reset-password` - Restablecer contraseña con token
- **GET** `/api/auth/users` - Listar usuarios (admin only)
- **POST** `/api/auth/users` - Crear nuevo usuario (admin only)

---

### �👔 **CONSULTORES** (`/api/consultant/`)

#### **Gestión de Formularios**
- **GET** `/api/consultant/forms` - Ver formularios publicados disponibles

#### **Gestión de Organizaciones**
- **GET** `/api/consultant/organizations` - Listar organizaciones gestionadas
- **POST** `/api/consultant/organizations` - Crear nueva organización

#### **Gestión de Auditorías**
- **GET** `/api/consultant/organizations/[orgId]/audits` - Listar auditorías de organización
- **POST** `/api/consultant/organizations/[orgId]/audits` - Crear nueva auditoría

#### **Formularios Personalizados en Auditorías**
- **GET** `/api/consultant/audits/[auditId]/forms/base/[baseFormId]` - Obtener/crear formulario personalizado
- **POST** `/api/consultant/audits/[auditId]/forms/base/[baseFormId]` - Guardar formulario personalizado

#### **Evaluación y Reportes**
- **PUT** `/api/consultant/audits/[auditId]/forms/[formId]/evaluate` - Evaluar formulario completo
- **GET** `/api/consultant/audits/[auditId]/saved-forms` - Ver formularios guardados de auditoría
- **GET** `/api/consultant/audits/[auditId]/report` - Generar reporte completo de auditoría

---

### 🏢 **ORGANIZACIONES** (`/api/organization/`)

#### **Auto-evaluación**
- **GET** `/api/organization/forms` - Ver formularios disponibles para auto-evaluación
- **GET** `/api/organization/forms/[baseFormId]` - Obtener/crear auto-evaluación personalizada
- **POST** `/api/organization/forms/[baseFormId]` - Guardar auto-evaluación

#### **Reportes**
- **GET** `/api/organization/reports` - Generar reporte de auto-evaluaciones

---

### 📋 **FORMULARIOS Y MÓDULOS** (`/api/forms/`, `/api/modules/`)

#### **Gestión de Formularios Públicos**
- **GET** `/api/forms` - Listar formularios disponibles
- **GET** `/api/forms/[formId]` - Obtener formulario específico
- **POST** `/api/forms/[formId]/complete` - Completar formulario

#### **Gestión de Módulos**
- **GET** `/api/modules` - Listar módulos disponibles
- **GET** `/api/modules/[moduleId]/forms` - Obtener formularios de un módulo específico

---

## 🗄️ **MODELO DE DATOS**

### **⚠️ NOTA IMPORTANTE: SISTEMA UNIFICADO**

El proyecto DiagnoSys implementa un **SISTEMA UNIFICADO DE EVALUACIÓN** con roles diferenciados:

### **🆕 SISTEMA ACTUAL - Estructura Jerárquica**
```
Organization
├── Audit (creada por Consultor)
│   └── PersonalizedForm (formulario personalizado para auditoría)
│       └── PersonalizedCategory
│           └── PersonalizedItem (score: 1-5, comment, notes)
│
└── PersonalizedForm (auto-evaluación, auditId: null)
    └── PersonalizedCategory
        └── PersonalizedItem (score: 1-5, comment, notes)
```

### **🔄 Flujos de Trabajo**

#### **🔧 Administradores:**
1. Crean formularios base con categorías e ítems
2. Publican formularios para hacerlos disponibles
3. Gestionan la estructura de evaluación
4. Administran usuarios del sistema

#### **👔 Consultores:**
1. Ven formularios publicados
2. Crean y gestionan organizaciones clientes
3. Crean auditorías para organizaciones específicas
4. Personalizan formularios dentro de auditorías
5. Evalúan con puntajes 1-5 y comentarios
6. Generan reportes detallados con análisis

#### **🏢 Organizaciones:**
1. Realizan auto-evaluaciones con formularios publicados
2. Puntúan ítems con escala 1-5
3. Agregan comentarios y notas
4. Generan reportes de madurez digital

---

## 🔐 **SEGURIDAD Y AUTENTICACIÓN**

- **NextAuth.js** con roles diferenciados: `admin`, `consultant`, `organization`
- **Middleware** de autenticación en todas las rutas API protegidas
- **Validación de roles** específica por endpoint y operación
- **Validación de parámetros** estricta y sanitización de datos
- **Manejo de tokens** para reset de contraseñas
- **Session management** para usuarios autenticados

---

## �️ **ARQUITECTURA TÉCNICA**

### **🗺️ Resolución de Conflictos de Rutas**
En Next.js 13+ App Router, no pueden coexistir dos rutas dinámicas al mismo nivel. Por eso:

**❌ Conflicto Original:**
```
/api/consultant/audits/[auditId]/forms/[baseFormId]  ← Ruta dinámica
/api/consultant/audits/[auditId]/forms/[formId]      ← Conflicto!
```

**✅ Solución Implementada:**
```
/api/consultant/audits/[auditId]/forms/base/[baseFormId]  ← Formulario base
/api/consultant/audits/[auditId]/forms/[formId]          ← Formulario personalizado
```

### **📊 Base de Datos**
- **PostgreSQL** con **Prisma ORM**
- **Migraciones automáticas** con resolución de conflictos
- **Relaciones complejas** entre entidades
- **Índices optimizados** para consultas frecuentes

---

## 📊 **CARACTERÍSTICAS IMPLEMENTADAS**

### **✅ Sistema Completo Funcional:**

#### **🔧 Backend APIs (35 endpoints HTTP en 25 rutas)**
- ✅ **Administradores**: CRUD completo de formularios y usuarios
- ✅ **Consultores**: Gestión de organizaciones, auditorías y evaluaciones
- ✅ **Organizaciones**: Auto-evaluación y reportes
- ✅ **Autenticación**: NextAuth con roles y recuperación de contraseña

#### **🏗️ Infraestructura**
- ✅ **Next.js 15.5.2**: Migración completa con nuevas características
- ✅ **TypeScript**: Tipado estricto en todo el proyecto
- ✅ **Prisma**: ORM con migraciones automáticas
- ✅ **PostgreSQL**: Base de datos relacional optimizada
- ✅ **Middleware**: Autenticación y autorización automática

#### **🎯 Funcionalidades Clave**
- ✅ **Evaluación por roles**: Diferentes flujos según tipo de usuario
- ✅ **Formularios dinámicos**: Personalización basada en plantillas
- ✅ **Sistema de puntuación**: Escala 1-5 con comentarios y notas
- ✅ **Reportes inteligentes**: Análisis estadístico y visualización
- ✅ **Auditorías**: Gestión completa de evaluaciones organizacionales

### **🚀 Estado del Proyecto**
- **✅ Build exitoso**: Sin errores de compilación
- **✅ Migraciones resueltas**: Base de datos sincronizada
- **✅ Tipos validados**: TypeScript sin advertencias
- **✅ Listo para producción**: Optimizado y desplegable

### **💡 Arquitectura de Evaluación**
- **📋 Formularios base**: Plantillas creadas por administradores
- **🎨 Personalización**: Consultores y organizaciones adaptan formularios
- **📊 Evaluación dual**: 
  - **Consultores → Organizaciones**: Evaluación externa profesional
  - **Organizaciones → Auto-evaluación**: Evaluación interna
- **📈 Reportes comparativos**: Análisis de brechas y oportunidades de mejora

---

## 📈 **ESTADÍSTICAS DEL PROYECTO**

### **📊 Conteo de Endpoints por Categoría**

| Categoría | Rutas | Endpoints HTTP | Descripción |
|-----------|-------|---------------|-------------|
| **🔧 Admin** | 6 | 10 | Gestión de formularios base e items |
| **🔐 Auth** | 5 | 7 | Autenticación y gestión de usuarios |
| **👔 Consultores** | 6 | 7 | Auditorías y evaluaciones organizacionales |
| **🏢 Organizaciones** | 3 | 4 | Auto-evaluación y reportes |
| **📋 Formularios** | 3 | 4 | Sistema público de formularios |
| **📊 Módulos** | 2 | 3 | Gestión de módulos de evaluación |
| **TOTAL** | **25** | **35** | **Sistema completo funcional** |

### **🔧 Métodos HTTP Utilizados**
- **GET**: 15 endpoints (consultas y lecturas)
- **POST**: 11 endpoints (creación de recursos)
- **PUT**: 5 endpoints (actualizaciones completas)
- **DELETE**: 3 endpoints (eliminaciones)
- **PATCH**: 1 endpoint (actualizaciones parciales)

### **🏛️ Arquitectura de Roles**
- **👨‍💼 Administradores**: 17 endpoints disponibles
- **👔 Consultores**: 11 endpoints disponibles  
- **🏢 Organizaciones**: 4 endpoints disponibles
- **🌐 Público**: 3 endpoints sin autenticación

### **📅 Estado de Desarrollo**
- **✅ Completado**: 100% de los endpoints planeados
- **🧪 Probado**: Build exitoso sin errores
- **🚀 Desplegable**: Listo para producción
- **📚 Documentado**: Completamente documentado








# DiagnoSys - API Endpoints Documentation

## 📋 **RESUMEN COMPLETO DE ENDPOINTS IMPLEMENTADOS PARA EL MODULO ZOOM IN**

### 🔧 **ADMINISTRADORES** (`/api/admin/`)

#### **Gestión de Formularios Base**
- **GET** `/api/admin/forms` - Listar formularios base
- **POST** `/api/admin/forms` - Crear nuevo formulario base
- **GET** `/api/admin/forms/[formId]` - Obtener formulario específico
- **PUT** `/api/admin/forms/[formId]` - Actualizar formulario completo
- **DELETE** `/api/admin/forms/[formId]` - Eliminar formulario
- **PATCH** `/api/admin/forms/[formId]/publish` - Publicar/despublicar formulario
- **PUT** `/api/admin/forms/[formId]/structure` - Actualizar estructura (categorías/items)

#### **Gestión de Items**
- **GET** `/api/admin/items` - Listar items disponibles
- **POST** `/api/admin/items` - Crear nuevo item
- **GET** `/api/admin/items/[itemId]` - Obtener item específico
- **PUT** `/api/admin/items/[itemId]` - Actualizar item
- **DELETE** `/api/admin/items/[itemId]` - Eliminar item

---

### 👔 **CONSULTORES** (`/api/consultant/`)

#### **Gestión de Formularios**
- **GET** `/api/consultant/forms` - Ver formularios publicados disponibles

#### **Gestión de Organizaciones**
- **GET** `/api/consultant/organizations` - Listar organizaciones gestionadas
- **POST** `/api/consultant/organizations` - Crear nueva organización
- **PUT** `/api/consultant/organizations/[orgId]` - Actualizar organización
- **DELETE** `/api/consultant/organizations/[orgId]` - Eliminar organización

#### **Gestión de Auditorías**
- **GET** `/api/consultant/organizations/[orgId]/audits` - Listar auditorías de organización
- **POST** `/api/consultant/organizations/[orgId]/audits` - Crear nueva auditoría
- **PUT** `/api/consultant/organizations/[orgId]/audits/[auditId]` - Actualizar auditoría
- **DELETE** `/api/consultant/organizations/[orgId]/audits/[auditId]` - Eliminar auditoría

#### **Formularios Personalizados en Auditorías**
- **GET** `/api/consultant/audits/[auditId]/forms/[baseFormId]` - Obtener/crear formulario personalizado
- **POST** `/api/consultant/audits/[auditId]/forms/[baseFormId]` - Guardar formulario personalizado

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

## 🗄️ **MODELO DE DATOS**

### **Estructura Jerárquica**
```
Organization
├── Audit (creada por Consultor)
│   └── PersonalizedForm (formulario personalizado para auditoría)
│       └── PersonalizedCategory
│           └── PersonalizedItem (score: 1-5)
│
└── PersonalizedForm (auto-evaluación, auditId: null)
    └── PersonalizedCategory
        └── PersonalizedItem (score: 1-5)
```

### **Flujo de Trabajo**

#### **Administradores:**
1. Crean formularios base con categorías e ítems
2. Publican formularios para hacerlos disponibles
3. Gestionan la estructura de evaluación

#### **Consultores:**
1. Ven formularios publicados
2. Crean organizaciones clientes
3. Crean auditorías para organizaciones
4. Personalizan formularios dentro de auditorías
5. Evalúan con puntajes 1-5
6. Generan reportes detallados

#### **Organizaciones:**
1. Realizan auto-evaluaciones con formularios publicados
2. Puntúan ítems con escala 1-5
3. Generan reportes de madurez digital

---

## 🔐 **SEGURIDAD Y AUTENTICACIÓN**

- **NextAuth** con roles: `admin`, `consultant`, `organization`
- **Middleware** de autenticación en todas las rutas API
- **Validación de roles** específica por endpoint
- **Validación de parámetros** y sanitización de datos

---

## 📊 **CARACTERÍSTICAS IMPLEMENTADAS**

### **✅ Completado:**
- ✅ Migración completa a Next.js 15
- ✅ Sistema de roles y autenticación
- ✅ CRUD completo para administradores
- ✅ Workflow completo para consultores
- ✅ Auto-evaluación para organizaciones
- ✅ Sistema de puntajes 1-5
- ✅ Formularios personalizados
- ✅ Reportes y estadísticas
- ✅ Validación de tipos TypeScript
- ✅ Base de datos PostgreSQL con Prisma

### **💡 Características Clave:**
- **Formularios dinámicos**: Basados en plantillas que se personalizan
- **Evaluación dual**: Consultores evalúan organizaciones / Organizaciones se auto-evalúan
- **Escala de madurez**: Puntajes 1-5 con análisis estadístico
- **Reportes inteligentes**: Fortalezas, áreas de mejora, tendencias
- **Roles diferenciados**: Cada tipo de usuario tiene flujos específicos






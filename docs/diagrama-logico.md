# Diagrama Lógico (UML) - DiagnoSys

## Arquitectura de Componentes del Sistema

```mermaid
graph TB
    subgraph Client["🖥️ CAPA DE PRESENTACIÓN (Cliente)"]
        WEB["Web Browser<br/>React 19 + Next.js 16<br/>TypeScript"]
        UI["UI Components<br/>Radix UI + Tailwind CSS<br/>Recharts para gráficos"]
        AUTH_UI["Módulo Autenticación<br/>NextAuth v4"]
    end

    subgraph Backend["⚙️ CAPA DE LÓGICA DE NEGOCIO"]
        API["API Routes<br/>(Next.js App Router)"]
        AUTH["Servicio Autenticación<br/>NextAuth + bcrypt"]
        FORM_SERVICE["Servicio Formularios<br/>Gestión de Forms"]
        AUDIT_SERVICE["Servicio Auditorías<br/>Lógica de evaluación"]
        REPORT_SERVICE["Servicio Reportes<br/>Generación de PDFs"]
        VALIDATION["Validación de Datos<br/>Zod Schemas"]
    end

    subgraph Database["💾 CAPA DE PERSISTENCIA"]
        PRISMA["ORM Prisma<br/>(Adaptador PostgreSQL)"]
        PG["PostgreSQL Database<br/>Neon/Cloud Provider"]
    end

    subgraph External["🔗 SERVICIOS EXTERNOS"]
        EMAIL["Email Service<br/>Resend + Nodemailer"]
        PDF_GEN["PDF Generation<br/>pdf-lib + canvas"]
        CHARTS["Chart Generation<br/>Chart.js + chartjs-node-canvas"]
    end

    subgraph DataModels["📊 MODELOS DE DATOS"]
        USER["👤 User<br/>id, email, password<br/>name, role, sector"]
        ROLE["🎭 Role<br/>admin, consultant<br/>organization"]
        AUDIT["🔍 Audit<br/>name, description<br/>consultant, organization"]
        FORM["📋 Form<br/>name, description<br/>modules, categories"]
        PFORM["📝 PersonalizedForm<br/>baseForm, audit<br/>report, status"]
        CATEGORY["📂 Category<br/>name, items<br/>relacionada a Form"]
        ITEM["☑️ Item<br/>name, score<br/>categoryId"]
        REPORT["📄 Report<br/>name, version<br/>completedAt, userId"]
        PRIORITY["⭐ Priorities<br/>HighPriority<br/>MediumPriority<br/>LowPriority"]
        ANALYSIS["🎯 Analysis Items<br/>Opportunity<br/>Need<br/>Problem"]
    end

    %% Conexiones CLIENTE → BACKEND
    WEB --> AUTH_UI
    WEB --> UI
    AUTH_UI --> AUTH
    UI --> API

    %% Conexiones BACKEND → SERVICIOS
    API --> FORM_SERVICE
    API --> AUDIT_SERVICE
    API --> REPORT_SERVICE
    AUDIT_SERVICE --> VALIDATION
    FORM_SERVICE --> VALIDATION
    REPORT_SERVICE --> PDF_GEN
    REPORT_SERVICE --> CHARTS

    %% Conexiones BACKEND → BD
    FORM_SERVICE --> PRISMA
    AUDIT_SERVICE --> PRISMA
    REPORT_SERVICE --> PRISMA
    AUTH --> PRISMA
    PRISMA --> PG

    %% Conexiones SERVICIOS EXTERNOS
    AUTH --> EMAIL
    REPORT_SERVICE --> EMAIL
    FORM_SERVICE --> CHARTS

    %% Relaciones MODELOS DE DATOS
    USER -->|tiene| ROLE
    USER -->|realiza| AUDIT
    AUDIT -->|auditea a| USER
    AUDIT -->|utiliza| PFORM
    FORM -->|personaliza| PFORM
    PFORM -->|contiene| CATEGORY
    CATEGORY -->|contiene| ITEM
    REPORT -->|contiene| PFORM
    USER -->|crea| REPORT
    REPORT -->|contiene| PRIORITY
    REPORT -->|contiene| ANALYSIS

    style Client fill:#e1f5ff
    style Backend fill:#f3e5f5
    style Database fill:#fff3e0
    style External fill:#fce4ec
    style DataModels fill:#e8f5e9
```

## Descripción de Componentes

### 🖥️ Capa de Presentación
- **Web Browser**: Interfaz React moderna y responsiva
- **UI Components**: Sistema de componentes Radix UI + Tailwind
- **Auth UI**: Módulo de autenticación con NextAuth

### ⚙️ Capa de Lógica de Negocio
- **API Routes**: Endpoints REST con Next.js
- **Servicio Autenticación**: Gestión de usuarios, sesiones, JWT
- **Servicio Formularios**: CRUD de formularios dinámicos
- **Servicio Auditorías**: Lógica de evaluaciones
- **Servicio Reportes**: Generación de reportes en PDF
- **Validación**: Esquemas Zod para validar datos

### 💾 Capa de Persistencia
- **ORM Prisma**: Mapeo objeto-relacional
- **PostgreSQL**: Base de datos relacional

### 🔗 Servicios Externos
- **Email**: Resend/Nodemailer para notificaciones
- **PDF**: pdf-lib y canvas para generación
- **Charts**: Chart.js para gráficos

### 📊 Modelos de Datos Principales
- **User + Role**: Gestión de usuarios y permisos
- **Audit**: Auditorías entre consultores y organizaciones
- **Form + Category + Item**: Sistema de formularios dinámicos
- **PersonalizedForm**: Instancias personalizadas de formularios
- **Report**: Reportes finales con análisis
- **Priorities & Analysis**: Clasificación de oportunidades, necesidades y problemas

## Flujos Principales

### 1️⃣ Flujo de Autenticación
```
Usuario → Login UI → NextAuth → Validación Password → JWT → Sesión Activa
```

### 2️⃣ Flujo de Auditoría
```
Consultor → Crear Auditoría → Seleccionar Formulario → Personalizar → Compartir → Organización responde → Genera Reporte
```

### 3️⃣ Flujo de Generación de Reporte
```
Auditoría Completada → Procesar Datos → Generar Gráficos → Crear PDF → Enviar Email → Almacenar Reporte
```

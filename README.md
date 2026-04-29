# UTP Admin — Frontend

Panel de administración de usuarios con autenticación JWT y control de acceso por roles (RBAC), construido con **Angular 19** y **Angular Material 3**.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Angular 19 (standalone components) |
| UI | Angular Material 3 (MDC) |
| Auth | JWT — access token 15 min + refresh token 7 días |
| Estado | Angular Signals + RxJS BehaviorSubject |
| Estilos | SCSS + CSS custom properties (dark mode) |
| i18n | Pipe personalizado (ES / EN) |

## Roles y permisos

| Rol | Puede crear | Puede editar | Puede eliminar |
|-----|-------------|--------------|----------------|
| `superuser` | user, admin | user, admin | user, admin |
| `admin` | user | user (y su propio perfil) | user |
| `user` | — | solo su perfil | — |

---

## Desarrollo local

### Requisitos

- Node.js 20+
- Angular CLI 19: `npm install -g @angular/cli`
- Backend corriendo en `http://localhost:3000` ([ver repositorio del API](../project-nodejs-api))

### Instalación

```bash
npm install
```

### Configurar la URL del backend

Edita `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

### Levantar el servidor de desarrollo

```bash
ng serve
```

Abre `http://localhost:4200` en el navegador.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── app.component.ts        # Raíz — solo <router-outlet>
│   ├── app.config.ts           # Providers globales (router, HTTP, interceptors)
│   ├── app.routes.ts           # Definición de rutas con lazy loading
│   │
│   ├── core/
│   │   ├── guards/             # authGuard, guestGuard, roleGuard
│   │   ├── interceptors/       # authInterceptor (adjunta Bearer token, maneja 401)
│   │   ├── models/             # Interfaces TypeScript + tabla de permisos por rol
│   │   └── services/           # AuthService, TokenService, ThemeService, I18nService
│   │
│   ├── layout/
│   │   └── shell/              # Sidebar + topbar (solo rutas autenticadas)
│   │
│   ├── features/
│   │   ├── auth/login/         # Página de login
│   │   ├── dashboard/          # Página principal
│   │   ├── users/              # Lista, detalle y formulario de usuarios
│   │   └── profile/            # Perfil del usuario autenticado
│   │
│   └── shared/
│       ├── components/         # ConfirmDialogComponent
│       ├── directives/         # *appHasPermission
│       └── pipes/              # TranslatePipe (i18n)
│
└── environments/
    ├── environment.ts          # Desarrollo (localhost)
    └── environment.prod.ts     # Producción (URL real del backend)
```

## Variables de entorno relevantes (backend)

| Variable | Descripción |
|----------|-------------|
| `CORS_ORIGINS` | Origins permitidos, separados por coma |
| `JWT_ACCESS_SECRET` | Secret para firmar access tokens |
| `JWT_REFRESH_SECRET` | Secret para firmar refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | Expiración del access token (ej. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Expiración del refresh token (ej. `7d`) |

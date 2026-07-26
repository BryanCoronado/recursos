# Recursos SaaS

Base administrativa con Next.js 16, NextAuth, Prisma 7 y MySQL. Incluye
cuentas administradas, contraseña temporal, estados de usuario, roles
personalizables, permisos por acción y auditoría.

## Configuración

1. Copia `.env.example` como `.env`.
2. Inicia MySQL en Laragon y crea la base `recursos_saas`.
3. Configura `DATABASE_URL` y genera un `NEXTAUTH_SECRET` seguro.
4. Define temporalmente `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`.
5. Ejecuta:

```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed
npm run dev
```

El administrador inicial deberá cambiar su contraseña en el primer acceso.
Después del seed puedes retirar `SEED_ADMIN_PASSWORD` del entorno.

## Autorización

- `ACTIVE`: puede autenticarse; `INACTIVE` y `SUSPENDED`: acceso bloqueado.
- Los permisos se almacenan como `modulo:accion`.
- La navegación se filtra para mejorar la experiencia, pero cada operación
  vuelve a comprobar estado y permiso en el servidor.
- El rol raíz `SUPER_ADMIN` está protegido.

Para añadir un módulo, registra sus permisos en `lib/auth/permissions.ts`,
vuelve a ejecutar el seed y protege sus consultas o acciones con
`requirePermission`.

## Comandos

```bash
npm run lint
npm test
npm run build
```

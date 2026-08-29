# Cómo subir cambios al VPS (MICHITECH)

Documentación operativa para publicar actualizaciones en producción.

| Dato | Valor |
|------|--------|
| Sitio | https://michitech.digital |
| VPS | `root@38.250.161.192` |
| Carpeta | `/var/www/recursos` |
| Repo | `https://github.com/CoronadoBryan/recursos.git` |
| Rama | `master` |
| Procesos PM2 | `recursos-web` (Next.js :3000) y `recursos-worker` (Playwright) |

Flujo: **PC → GitHub → VPS (`git pull`) → build → PM2**.

---

## 1. En tu PC (antes de tocar el servidor)

Los cambios locales **no llegan al VPS** hasta que estén en GitHub.

```bash
git status
git add -A
git commit -m "Describe el cambio"
git push origin master
```

Comprueba que el remoto avanzó:

```bash
git log -1 --oneline
```

---

## 2. Actualización normal (el 95% de las veces)

Conéctate y corre **en este orden**:

```bash
ssh root@38.250.161.192
cd /var/www/recursos

# Si git pull se queja de package-lock.json (pasa seguido):
git checkout -- package-lock.json

git pull origin master

# Confirma que bajó el commit nuevo (debe coincidir con tu PC)
git log -1 --oneline

npm install
npx prisma generate
npm run deploy:all
pm2 status
```

`npm run deploy:all` hace:

1. `prisma generate`
2. `next build`
3. `pm2 restart recursos-web recursos-worker --update-env`

Al terminar, ambos procesos deben estar **online**. Recarga el sitio con **Ctrl+F5**.

---

## 3. Cuándo correr seed o migraciones

### Seed (roles, permisos, admin)

Hazlo si cambió `prisma/seed.ts` (roles Clientes Envato / Magnific, permisos, etc.):

```bash
cd /var/www/recursos
npx tsx prisma/seed.ts
```

El seed es **idempotente**: actualiza roles/permisos; no borra usuarios.

### Migraciones Prisma

Solo si cambió `prisma/schema.prisma`:

```bash
cd /var/www/recursos
npx prisma migrate deploy
npx prisma generate
npm run deploy:all
```

No uses `prisma migrate dev` en el VPS.

---

## 4. Si cambiaste el `.env`

```bash
cd /var/www/recursos
nano .env
```

Mínimo en producción:

```bash
DATABASE_URL="mysql://USUARIO:PASSWORD@localhost:3306/recursos"
NEXTAUTH_SECRET="cadena-larga-aleatoria"
NEXTAUTH_URL="https://michitech.digital"
NEXT_PUBLIC_SITE_URL="https://michitech.digital"
```

Luego:

```bash
pm2 restart recursos-web recursos-worker --update-env
```

`NEXT_PUBLIC_*` **solo se aplica en el `next build`**. Si cambias esa variable, hay que volver a buildear:

```bash
npm run deploy:all
```

---

## 5. Primera vez / PM2 caído

Solo si los procesos no existen o los borraste:

```bash
cd /var/www/recursos
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
pm2 status
```

El worker necesita display virtual (`DISPLAY=:99` en `ecosystem.config.cjs`). Si el worker queda `stopped`:

```bash
pm2 logs recursos-worker --lines 80 --nostream
```

---

## 6. Problemas frecuentes

### `git pull` aborta por `package-lock.json`

El VPS tiene un lockfile local distinto. **No hagas commit en el servidor.**

```bash
cd /var/www/recursos
git checkout -- package-lock.json
git pull origin master
```

Si sigue bloqueando:

```bash
git stash -u
git pull origin master
npm install
npm run deploy:all
```

### El sitio no muestra los últimos cambios

Causas típicas:

1. El `git pull` falló y el build corrió sobre código viejo.
2. No se hizo `git push` desde el PC.
3. Caché del navegador (Ctrl+F5).

Comprueba:

```bash
cd /var/www/recursos
git log -1 --oneline
git status
```

El commit debe ser el mismo que en GitHub/`git log` de tu PC.

### Error 500 / pantalla en blanco

```bash
pm2 logs recursos-web --lines 80 --nostream
pm2 status
```

Revisa `.env` (`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`).

### Worker `stopped` o descargas que no arrancan

```bash
pm2 logs recursos-worker --lines 80 --nostream
npx playwright install chromium
```

---

## 7. Checklist rápido post-deploy

- [ ] `git log -1` en VPS = último commit de GitHub
- [ ] `pm2 status` → `recursos-web` y `recursos-worker` **online**
- [ ] https://michitech.digital carga (Ctrl+F5)
- [ ] Login funciona
- [ ] Landing / precios / favicon se ven actualizados
- [ ] Si tocaste roles: corriste `npx tsx prisma/seed.ts`

---

## Comando copiable (actualización estándar)

```bash
cd /var/www/recursos && git checkout -- package-lock.json && git pull origin master && git log -1 --oneline && npm install && npx prisma generate && npm run deploy:all && pm2 status
```

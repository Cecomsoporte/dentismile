import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const rolUsuario = authService.getRol();

  // 1. Si no hay sesión o rol activo, directo al login
  if (!rolUsuario) {
    console.warn(`🔒 Acceso bloqueado. Intento de ingresar a: ${state.url}`);
    router.navigate(['/login']);
    return false;
  }

  // 2. El Administrador siempre tiene pase automático (Acceso Total)
  if (rolUsuario === 'Administrador') {
    return true;
  }

  // 3. Extraer la lista de roles permitidos de la metadata de la ruta
  const rolesPermitidos = route.data['roles'] as Array<string>;

  // 4. Validar si el rol actual está autorizado
  if (rolesPermitidos && rolesPermitidos.includes(rolUsuario)) {
    return true;
  }

  // 5. Si no tiene permisos, lo regresa al panel
  console.warn(`⚠️ Acceso denegado. El rol [${rolUsuario}] no tiene permisos para: ${state.url}`);
  router.navigate(['/panel']);
  return false;
};
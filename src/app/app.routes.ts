import { Routes } from '@angular/router';
import { roleGuard } from './services/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage) 
  },
  { 
    path: 'panel', 
    loadComponent: () => import('./pages/panel/panel.page').then(m => m.PanelPage),
    canActivate: [roleGuard],
    data: { roles: ['Administrador', 'Doctor', 'Recepcionista', 'Paciente'] } 
  },
  { 
    path: 'pacientes', 
    loadComponent: () => import('./pages/pacientes/pacientes.page').then(m => m.PacientesPage),
    canActivate: [roleGuard],
    data: { roles: ['Administrador', 'Doctor'] } // Doctor y Admin leen/escriben. Paciente/Recepcionista fuera.
  },
  { 
    path: 'citas', 
    loadComponent: () => import('./pages/citas/citas.page').then(m => m.CitasPage),
    canActivate: [roleGuard],
    data: { roles: ['Administrador', 'Doctor', 'Recepcionista', 'Paciente'] } 
  },
  { 
    path: 'pagos', 
    loadComponent: () => import('./pages/pagos/pagos.page').then(m => m.PagosPage),
    canActivate: [roleGuard],
    data: { roles: ['Administrador', 'Recepcionista'] } 
  },
  
  // 🩺 HISTORIAL CLÍNICO: Ruta base (Para cuando el Paciente ve su propio perfil)
  { 
    path: 'historial', 
    loadComponent: () => import('./pages/historial/historial.page').then(m => m.HistorialPage),
    canActivate: [roleGuard],
    data: { roles: ['Administrador', 'Doctor', 'Paciente'] } 
  },
  // 🔍 HISTORIAL CLÍNICO CON ID: Para cuando el Admin o Doctor buscan un paciente específico
  { 
    path: 'historial/:id', 
    loadComponent: () => import('./pages/historial/historial.page').then(m => m.HistorialPage),
    canActivate: [roleGuard],
    data: { roles: ['Administrador', 'Doctor'] } 
  },

  { 
    path: 'tratamientos', 
    loadComponent: () => import('./pages/tratamientos/tratamientos.page').then(m => m.TratamientosPage),
    canActivate: [roleGuard],
    data: { roles: ['Administrador', 'Doctor', 'Recepcionista'] }
  },
  { 
    path: 'reportes', 
    loadComponent: () => import('./pages/reportes/reportes.page').then(m => m.ReportesPage),
    canActivate: [roleGuard],
    data: { roles: ['Administrador'] } // Solo Administrador
  },
  { 
    path: 'configuracion', 
    loadComponent: () => import('./pages/configuracion/configuracion.page').then(m => m.ConfiguracionPage),
    canActivate: [roleGuard],
    data: { roles: ['Administrador'] } // Solo Administrador
  },
  {
    path: 'paciente-registro',
    loadComponent: () => import('./pages/paciente-registro/paciente-registro.page').then( m => m.PacienteRegistroPage)
  }
];
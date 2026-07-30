import { Component, OnInit, inject } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CitasService } from '../../services/citas';
import { AuthService } from '../../services/auth.service';
import { Cita } from '../../models/cita.model';

// 📦 Importamos componentes Standalone de Ionic y controladores
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle, 
  IonCardContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonList,        
  IonItem,        
  IonLabel,       
  IonBadge,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';

// 🎨 Importación de iconos nativos de Ionic
import { addIcons } from 'ionicons';
import { logOutOutline, cashOutline, checkmarkDoneOutline, walletOutline } from 'ionicons/icons'; 

@Component({
  selector: 'app-panel',
  templateUrl: './panel.page.html',
  styleUrls: ['./panel.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle, 
    IonCardContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonList,        
    IonItem,        
    IonLabel,       
    IonBadge        
  ]
})
export class PanelPage implements OnInit {

  // 🔑 Propiedad para almacenar el rol del usuario firmado
  rolUsuario: string = '';

  // 🏛️ Esta estructura se enlazará al HTML mediante el *ngFor
  opcionesMenu: any[] = [];

  // 💳 LISTA DE COBROS: Para guardar las consultas completadas por el doctor
  citasPorCobrar: Cita[] = [];

  // Inyección moderna de dependencias (Standalone compatible)
  private citasService = inject(CitasService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  // 📋 Lista maestra de opciones con sus respectivos roles permitidos
  private opcionesMenuCompleto = [
    { titulo: 'Pacientes', icono: '👨‍⚕️', descripcion: 'Registro, altas y expedientes clínicos.', ruta: '/pacientes', rolesPermitidos: ['Administrador', 'Doctor'] },
    { titulo: 'Citas', icono: '📅', descripcion: 'Agenda médica y control de horarios.', ruta: '/citas', rolesPermitidos: ['Administrador', 'Doctor', 'Recepcionista', 'Paciente'] },
    { titulo: 'Tratamientos', icono: '🦷', descripcion: 'Catálogo de procedimientos y costos.', ruta: '/tratamientos', rolesPermitidos: ['Administrador', 'Doctor', 'Recepcionista'] },
    { titulo: 'Pagos', icono: '💳', descripcion: 'Control de abonos, caja e ingresos.', ruta: '/pagos', rolesPermitidos: ['Administrador', 'Recepcionista'] },
    { titulo: 'Historial Clínico', icono: '📋', descripcion: 'Antecedentes odontológicos y evolución.', ruta: '/historial', rolesPermitidos: ['Administrador', 'Doctor', 'Paciente'] },
    { titulo: 'Reportes', icono: '📊', descripcion: 'Estadísticas mensuales del consultorio.', ruta: '/reportes', rolesPermitidos: ['Administrador'] },
    { titulo: 'Configuración', icono: '⚙️', descripcion: 'Ajustes del sistema y roles de usuario.', ruta: '/configuracion', rolesPermitidos: ['Administrador'] }
  ];

  constructor(
    private authService: AuthService,   // Inyectamos el servicio de Firebase Auth
    private router: Router              // Inyectamos el enrutador de Angular
  ) { 
    addIcons({ logOutOutline, cashOutline, checkmarkDoneOutline, walletOutline });
  }

  ngOnInit() {
    // 1. Recuperamos de manera segura el rol que el AuthService guardó al hacer Login
    this.rolUsuario = this.authService.getRol() || 'Paciente';

    console.log('Rol autenticado en el Panel:', this.rolUsuario);

    // 2. Filtramos los componentes del DOM basándonos en los privilegios
    if (this.rolUsuario === 'Administrador') {
      this.opcionesMenu = this.opcionesMenuCompleto;
    } else {
      this.opcionesMenu = this.opcionesMenuCompleto.filter(opcion => 
        opcion.rolesPermitidos.includes(this.rolUsuario)
      );
    }

    // 3. 💳 Si el usuario es Administrador o Recepcionista, cargamos los cobros pendientes
    if (this.rolUsuario === 'Administrador' || this.rolUsuario === 'Recepcionista') {
      this.cargarCitasPorCobrar();
    }
  }

  // Refresca la lista cada vez que la vista del Panel vuelve a estar activa
  async ionViewWillEnter() {
    if (this.rolUsuario === 'Administrador' || this.rolUsuario === 'Recepcionista') {
      await this.cargarCitasPorCobrar();
    }
  }

  // 🔍 FUNCIÓN ASÍNCRONA: Trae de Firebase las consultas terminadas en la fecha local hoy
  async cargarCitasPorCobrar() {
    try {
      // 🌟 SOLUCIÓN HORARIA: Fecha local en formato YYYY-MM-DD
      const fechaLocal = new Date();
      const año = fechaLocal.getFullYear();
      const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaLocal.getDate()).padStart(2, '0');
      const hoyLocal = `${año}-${mes}-${dia}`;

      console.log('Consultando cobros pendientes para la fecha local:', hoyLocal);

      this.citasPorCobrar = await this.citasService.obtenerCitasPorCobrar(hoyLocal);
      console.log('Cobros pendientes cargados:', this.citasPorCobrar);
    } catch (error: any) {
      console.error('Error al traer cuentas por cobrar de Firebase:', error);
    }
  }

  // 💰 FUNCIÓN ASÍNCRONA DE COBRO: Abre un modal interactivo para recepcionistas
  async cobrarCita(cita: Cita) {
    if (!cita.id) return;

    const costoSugerido = cita.costo || 350;

    const alert = await this.alertController.create({
      header: '💳 Registrar Cobro',
      subHeader: `Paciente: ${cita.nombrePaciente || 'Paciente General'}`,
      message: `
        <div style="text-align: left; margin-top: 5px;">
          <p style="margin: 3px 0;"><strong>Tratamiento:</strong> ${cita.tratamiento || 'Consulta'}</p>
          <p style="margin: 3px 0;"><strong>Diagnóstico:</strong> ${cita.diagnostico || 'Atención completada'}</p>
        </div>
      `,
      inputs: [
        {
          name: 'monto',
          type: 'number',
          placeholder: 'Monto a cobrar ($)',
          value: costoSugerido
        },
        {
          name: 'metodoPago',
          type: 'radio',
          label: '💵 Efectivo',
          value: 'Efectivo',
          checked: true
        },
        {
          name: 'metodoPago',
          type: 'radio',
          label: '💳 Tarjeta (Débito/Crédito)',
          value: 'Tarjeta'
        },
        {
          name: 'metodoPago',
          type: 'radio',
          label: '📱 Transferencia / SPEI',
          value: 'Transferencia'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar y Cobrar',
          handler: async (data) => {
            if (!data.monto || Number(data.monto) <= 0) {
              this.mostrarToast('Por favor ingresa un monto válido.', 'warning');
              return false;
            }

            await this.procesarPago(cita.id!, Number(data.monto), data.metodoPago);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  // Procesa el cambio de estado en Firebase e informa al usuario
  async procesarPago(citaId: string, monto: number, metodoPago: string) {
    try {
      // Si tu servicio soporta campos extra o cambio de estado:
      await this.citasService.actualizarEstado(citaId, 'Pagada');
      
      this.mostrarToast(`¡Cobro de $${monto} registrado exitosamente!`, 'success');
      await this.cargarCitasPorCobrar();
    } catch (error: any) {
      console.error('Error al procesar el cobro en Firebase:', error);
      this.mostrarToast('Ocurrió un error al registrar el pago.', 'danger');
    }
  }

  // 🔄 Manejador para navegar a las secciones de forma segura
  navegarA(ruta: string) {
    if (ruta === '/historial' && (this.rolUsuario === 'Administrador' || this.rolUsuario === 'Doctor')) {
      console.log('Redirección de seguridad: Desviando personal clínico a /pacientes');
      this.router.navigate(['/pacientes']);
      return;
    }

    console.log('Navegando de forma segura a:', ruta);
    this.router.navigate([ruta]);
  }

  // 🚪 Cerrar Sesión interactivo con Firebase
  async cerrarSesion() {
    try {
      await this.authService.logout();
      console.log('Sesión destruida con éxito.');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al intentar cerrar sesión:', error);
    }
  }

  // Mensajes flotantes informativos
  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}
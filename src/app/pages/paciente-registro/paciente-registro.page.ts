import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { saveOutline, calendarOutline, logOutOutline, medicalOutline, documentTextOutline } from 'ionicons/icons';

import { PacientesService } from '../../services/pacientes';
import { CitasService } from '../../services/citas'; 
import { Cita } from '../../models/cita.model';

@Component({
  selector: 'app-paciente-registro',
  templateUrl: './paciente-registro.page.html',
  styleUrls: ['./paciente-registro.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  providers: [PacientesService, CitasService] 
})
export class PacienteRegistroPage implements OnInit {
  
  pacienteData: any = {
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    telefono: '',
    rol: 'Paciente'
  };

  usuarioId: string = '';       
  isPerfilGuardado: boolean = false; 

  // 📌 Propiedad para renderizar la tarjeta de "Tu Próxima Cita" en la vista HTML
  proximaCita: Cita | null = null;

  constructor(
    @Inject(PacientesService) private pacientesService: PacientesService,
    @Inject(CitasService) private citasService: CitasService, 
    private alertController: AlertController, 
    private toastController: ToastController,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({ saveOutline, calendarOutline, logOutOutline, medicalOutline, documentTextOutline });
  }

  async ngOnInit() {
    this.usuarioId = localStorage.getItem('uidUsuario') || '';
    await this.verificarPerfilExistente();
    await this.cargarProximaCita();

    // 🔹 Si el paciente seleccionó un tratamiento desde el catálogo, abrimos la agenda con ese valor
    this.route.queryParams.subscribe(params => {
      if (params['servicio'] && this.isPerfilGuardado) {
        this.irAAgendarCita(params['servicio']);
      }
    });
  }

  // 🔄 Se ejecuta automáticamente cada vez que el paciente regresa a esta vista
  async ionViewWillEnter() {
    if (this.usuarioId) {
      await this.cargarProximaCita();
    }
  }

  async verificarPerfilExistente() {
    if (!this.usuarioId) return;
    try {
      const lista = await this.pacientesService.obtenerPacientes();
      const pacienteEncontrado = lista.find((p: any) => p.id === this.usuarioId);
      
      if (pacienteEncontrado) {
        this.pacienteData = { ...pacienteEncontrado };
        this.isPerfilGuardado = true; 
      }
    } catch (error) {
      console.error('Error al validar el perfil:', error);
    }
  }

  // 🔍 Carga la cita activa para el banner superior
  async cargarProximaCita() {
    if (!this.usuarioId) return;
    try {
      const todasLasCitas = await this.citasService.obtenerCitas();
      
      // Buscamos si existe alguna cita del paciente activa
      const citasUsuario = todasLasCitas.filter(
        (cita: Cita) => cita.pacienteId === this.usuarioId && 
        (cita.estado === 'Pendiente' || cita.estado === 'Confirmada')
      );

      if (citasUsuario.length > 0) {
        // Asignamos la cita activa encontrada
        this.proximaCita = citasUsuario[0];
      } else {
        this.proximaCita = null;
      }
    } catch (error) {
      console.error('Error al obtener la cita del paciente:', error);
    }
  }

  async guardarDatosPaciente() {
    const { nombre, apellido, fechaNacimiento, telefono } = this.pacienteData;

    if (!nombre?.trim() || !apellido?.trim() || !fechaNacimiento || !telefono?.trim()) {
      this.mostrarToast('Todos los campos son obligatorios.', 'warning');
      return;
    }

    try {
      const datosAEnviar = {
        nombre: nombre,
        apellido: apellido,
        fechaNacimiento: fechaNacimiento,
        telefono: telefono,
        rol: 'Paciente',
        perfilCompleto: true
      };
      
      await this.pacientesService.actualizarPaciente(this.usuarioId, datosAEnviar as any);
      this.isPerfilGuardado = true;
      this.mostrarToast('¡Perfil guardado! Ahora puedes acceder a tus opciones.', 'success');
    } catch (error) {
      console.error('Error al guardar:', error);
      this.mostrarToast('Hubo un error al registrar tus datos.', 'danger');
    }
  }

  // ➕ ACCIÓN DIRECTA CON CANDADO DE SEGURIDAD INTEGRADO 🛡️
  async irAAgendarCita(motivoPredefinido: string = '') {
    try {
      // 1. Solicitamos la lista completa de citas directo desde Firebase
      const listaCitasGlobales = await this.citasService.obtenerCitas();

      // 2. Filtramos si este usuario ya cuenta con alguna cita en estado 'Pendiente' o 'Confirmada'
      const tieneCitaActiva = listaCitasGlobales.some((cita: Cita) => 
        cita.pacienteId === this.usuarioId && 
        (cita.estado === 'Pendiente' || cita.estado === 'Confirmada')
      );

      // 3. Si se encuentra un registro activo, desplegamos la alerta de bloqueo y frenamos la ejecución
      if (tieneCitaActiva) {
        const alertaBloqueo = await this.alertController.create({
          header: 'Cita en Proceso',
          subHeader: 'Límite de agenda alcanzado',
          message: 'Por políticas de control en Dentismile, no puedes solicitar una nueva consulta si ya tienes un espacio agendado en estado Pendiente o Confirmada.',
          buttons: ['Entendido']
        });
        await alertaBloqueo.present();
        return; // Destruye el flujo y evita que aparezca el formulario de captura
      }

    } catch (err) {
      console.error('Error al verificar citas previas:', err);
      this.mostrarToast('No se pudo verificar el estatus de tus citas.', 'danger');
      return;
    }

    // 4. Si el validador pasa limpio, procede a pintar el formulario original
    const alert = await this.alertController.create({
      header: `Agendar Cita para: ${this.pacienteData.nombre}`,
      inputs: [
        { name: 'fecha', type: 'date', min: '2026-01-01' },
        { name: 'horaInicio', type: 'time' },
        { name: 'motivo', type: 'text', placeholder: 'Motivo (Ej. Limpieza, Dolor)', value: motivoPredefinido }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agendar Cita',
          handler: async (data) => {
            if (!data.fecha || !data.horaInicio || !data.motivo) {
              this.mostrarToast('Todos los campos son obligatorios', 'warning');
              return false;
            }

            const estadoInicial = 'Pendiente';

            // Calculamos hora de fin estimada (+1 hora)
            const [hora, minutos] = data.horaInicio.split(':');
            const horaFinCalculada = `${String(Number(hora) + 1).padStart(2, '0')}:${minutos}`;

            const nuevaCita: Cita = {
              pacienteId: this.usuarioId,
              nombrePaciente: `${this.pacienteData.nombre} ${this.pacienteData.apellido}`,
              doctorId: 'DOCTOR_DEFAULT_ID', 
              nombreDoctor: 'Dr. Alejandro Ortega', 
              fecha: data.fecha,
              horaInicio: data.horaInicio,
              horaFin: horaFinCalculada,
              estado: estadoInicial,
              motivoConsulta: data.motivo,
              fechaRegistro: new Date().toISOString().split('T')[0]
            };

            try {
              await this.citasService.agregarCita(nuevaCita);
              this.mostrarToast('¡Solicitud enviada! En espera de validación por recepción.', 'success');
              
              // 🔄 Actualizamos la pantalla de inmediato para mostrar el banner de "Tu Próxima Cita"
              await this.cargarProximaCita();
              
              return true;
            } catch (err) {
              console.error('Error al agendar cita:', err);
              this.mostrarToast('Error al conectar con la base de datos.', 'danger');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // 🚪 Cerrar sesión de forma segura limpiando el almacenamiento local
  async cerrarSesion() {
    localStorage.clear();
    this.mostrarToast('Sesión cerrada con éxito.', 'medium');
    this.router.navigate(['/login']);
  }

  // 🦷 Redirección al catálogo de tratamientos disponibles
  verTratamientos() {
    this.router.navigate(['/pages/tratamientos']); 
  }

  // 📋 Redirección al historial clínico del paciente
  verHistorialClinico() {
    this.router.navigate(['/pages/historial-clinico']); 
  }

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
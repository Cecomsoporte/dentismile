import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { saveOutline, calendarOutline, logOutOutline, medicalOutline, documentTextOutline } from 'ionicons/icons';

import { PacientesService } from '../../services/pacientes';
import { CitasService } from '../../services/citas'; // 👈 Inyectamos CitasService
import { Cita } from '../../models/cita.model';

@Component({
  selector: 'app-paciente-registro',
  templateUrl: './paciente-registro.page.html',
  styleUrls: ['./paciente-registro.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  providers: [PacientesService, CitasService] // 👈 Proveedor agregado
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

  constructor(
    @Inject(PacientesService) private pacientesService: PacientesService,
    @Inject(CitasService) private citasService: CitasService, // 👈 Inyectado
    private alertController: AlertController, // 👈 Inyectado
    private toastController: ToastController,
    private router: Router
  ) {
    addIcons({ saveOutline, calendarOutline, logOutOutline, medicalOutline, documentTextOutline });
  }

  async ngOnInit() {
    this.usuarioId = localStorage.getItem('uidUsuario') || '';
    await this.verificarPerfilExistente();
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

  // ➕ ACCIÓN DIRECTA: Abre el formulario de la cita en esta misma pantalla
  async irAAgendarCita() {
    const alert = await this.alertController.create({
      header: `Agendar Cita para: ${this.pacienteData.nombre}`,
      inputs: [
        { name: 'fecha', type: 'date', min: '2026-01-01' },
        { name: 'horaInicio', type: 'time' },
        { name: 'motivo', type: 'text', placeholder: 'Motivo (Ej. Limpieza, Dolor)' }
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

  // 🦷 Redirección al catálogo o modal de tratamientos disponibles
  verTratamientos() {
    this.router.navigate(['/tratamientos']); // Cambia por tu ruta real de tratamientos si es diferente
  }

  // 📋 Redirección al expediente o historial del propio paciente
  verHistorialClinico() {
    this.router.navigate(['/historial-clinico']); // Cambia por tu ruta real de historial si es diferente
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
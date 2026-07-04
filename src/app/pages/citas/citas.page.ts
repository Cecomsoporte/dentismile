import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  calendarOutline, 
  timeOutline, 
  checkmarkCircleOutline, 
  closeCircleOutline, 
  trashOutline, 
  addCircleOutline, 
  alertCircleOutline,
  checkmarkDoneOutline // 👈 Agregado para el botón del Doctor
} from 'ionicons/icons';

import { CitasService } from '../../services/citas';
import { PacientesService } from '../../services/pacientes'; 
import { Cita } from '../../models/cita.model';
import { Paciente } from '../../models/paciente.model';

@Component({
  selector: 'app-citas',
  templateUrl: './citas.page.html',
  styleUrls: ['./citas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  providers: [CitasService, PacientesService]
})
export class CitasPage implements OnInit {
  listaCitas: Cita[] = [];
  listaPacientes: Paciente[] = [];
  rolUsuario: string | null = '';

  constructor(
    @Inject(CitasService) private citasService: CitasService,
    @Inject(PacientesService) private pacientesService: PacientesService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    // 🛠️ Se registra el icono para que se renderice sin problemas en el HTML
    addIcons({ 
      calendarOutline, 
      timeOutline, 
      checkmarkCircleOutline, 
      closeCircleOutline, 
      trashOutline, 
      addCircleOutline, 
      alertCircleOutline,
      checkmarkDoneOutline // 👈 Registrado aquí
    });
  }

  async ngOnInit() {
    this.rolUsuario = localStorage.getItem('rolUsuario');
    this.cargarCitas();
    this.listaPacientes = await this.pacientesService.obtenerPacientes(); 
  }

  async cargarCitas() {
    this.listaCitas = await this.citasService.obtenerCitas();
  }

  // 🏢 ACCIÓN: Recepcionista o Doctor validan/confirman una cita pendiente
  async validarCita(cita: Cita) {
    const disponible = await this.citasService.verificarDisponibilidad(cita.fecha, cita.horaInicio);
    
    if (!disponible) {
      this.mostrarToast('¡Error! Ya existe una cita confirmada en este horario.', 'danger');
      return;
    }

    await this.citasService.actualizarCita(cita.id!, { estado: 'Confirmada' });
    this.mostrarToast('Cita validada y confirmada con éxito', 'success');
    this.cargarCitas();
  }

  // 🩺 ACCIÓN MEJORADA: El Doctor ve datos, agrega diagnóstico/tratamiento y finaliza la consulta
  async completarConsulta(cita: Cita) {
    if (!cita.id) return;

    // Se despliega un formulario dinámico para el expediente clínico de la cita
    const alert = await this.alertController.create({
      header: 'Finalizar Consulta Médica',
      subHeader: `Paciente: ${cita.nombrePaciente}`,
      message: `<strong>Motivo de consulta:</strong> ${cita.motivoConsulta || 'No especificado'}`,
      inputs: [
        {
          name: 'diagnostico',
          type: 'textarea',
          placeholder: 'Escribe el diagnóstico clínico detallado...',
          attributes: {
            rows: 3
          }
        },
        {
          name: 'tratamiento',
          type: 'textarea',
          placeholder: 'Escribe el tratamiento o procedimiento realizado...',
          attributes: {
            rows: 3
          }
        }
      ],
      buttons: [
        {
          text: 'Regresar',
          role: 'cancel'
        },
        {
          text: 'Guardar y Terminar',
          handler: async (data) => {
            // Validación para asegurar que el expediente no vaya vacío
            if (!data.diagnostico.trim() || !data.tratamiento.trim()) {
              this.mostrarToast('Por favor, llena el diagnóstico y tratamiento antes de finalizar.', 'warning');
              return false; // Mantiene el modal abierto para que no pierda lo que escribió
            }

            try {
              // Mandamos los datos clínicos adjuntos y cambiamos el estado a Completada
              await this.citasService.actualizarCita(cita.id!, {
                diagnostico: data.diagnostico,
                tratamiento: data.tratamiento,
                estado: 'Completada'
              });

              this.mostrarToast('Expediente actualizado y consulta enviada a recepción.', 'success');
              this.cargarCitas(); // Refrescamos pantalla del doctor
              return true; // Cierra el formulario con éxito
            } catch (error: any) {
              console.error('Error al guardar datos clínicos en Firebase:', error);
              this.mostrarToast('Hubo un error al procesar el cierre de consulta.', 'danger');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // ❌ ACCIÓN: Cancelar Cita
  async cancelarCita(id: string) {
    await this.citasService.actualizarCita(id, { estado: 'Cancelada' });
    this.mostrarToast('La cita ha sido cancelada', 'warning');
    this.cargarCitas();
  }

  // ➕ ACCIÓN: Agendar Nueva Cita
  async abrirFormularioCita() {
    const inputsPacientes = this.listaPacientes.map(paciente => ({
      label: `${paciente.nombre} ${paciente.apellido}`,
      type: 'radio' as const,
      value: paciente,
    }));

    if (inputsPacientes.length === 0) {
      this.mostrarToast('Primero debes registrar pacientes en el sistema.', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Agendar Cita Dental',
      subHeader: 'Selecciona el Paciente',
      inputs: inputsPacientes,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: (pacienteSeleccionado: Paciente) => {
            if (!pacienteSeleccionado) {
              this.mostrarToast('Debes seleccionar un paciente', 'warning');
              return false;
            }
            this.formularioDetallesCita(pacienteSeleccionado);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  // Paso 2 del formulario: capturar fecha, hora y motivo
  async formularioDetallesCita(paciente: Paciente) {
    const alert = await this.alertController.create({
      header: `Cita para: ${paciente.nombre}`,
      inputs: [
        { name: 'fecha', type: 'date', min: '2026-01-01' },
        { name: 'horaInicio', type: 'time' },
        { name: 'motivo', type: 'text', placeholder: 'Motivo (Ej. Limpieza, Extracción)' }
      ],
      buttons: [
        { text: 'Atrás', role: 'cancel' },
        {
          text: 'Agendar',
          handler: async (data) => {
            if (!data.fecha || !data.horaInicio || !data.motivo) {
              this.mostrarToast('Todos los campos son obligatorios', 'warning');
              return false;
            }

            const estadoInicial = (this.rolUsuario === 'Paciente') ? 'Pendiente' : 'Confirmada';

            if (estadoInicial === 'Confirmada') {
              const libre = await this.citasService.verificarDisponibilidad(data.fecha, data.horaInicio);
              if (!libre) {
                this.mostrarToast('Horario ocupado. Elige otra hora o día.', 'danger');
                return false;
              }
            }

            const [hora, minutos] = data.horaInicio.split(':');
            const horaFinCalculada = `${String(Number(hora) + 1).padStart(2, '0')}:${minutos}`;

            const nuevaCita: Cita = {
              pacienteId: paciente.id!,
              nombrePaciente: `${paciente.nombre} ${paciente.apellido}`,
              doctorId: 'DOCTOR_DEFAULT_ID', 
              nombreDoctor: 'Dr. Alejandro Ortega', 
              fecha: data.fecha,
              horaInicio: data.horaInicio,
              horaFin: horaFinCalculada,
              estado: estadoInicial,
              motivoConsulta: data.motivo,
              fechaRegistro: new Date().toISOString().split('T')[0]
            };

            await this.citasService.agregarCita(nuevaCita);
            this.mostrarToast(
              estadoInicial === 'Confirmada' ? 'Cita agendada and confirmada' : 'Solicitud enviada, en espera de validación', 
              'success'
            );
            this.cargarCitas();
            return true;
          }
        }
      ]
    });
    await alert.present();
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
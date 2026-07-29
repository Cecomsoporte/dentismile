import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  trashOutline,
  addCircleOutline,
  alertCircleOutline,
  checkmarkDoneOutline,
  personCircleOutline,
  eyeOutline,
  medkitOutline,
  cashOutline
} from 'ionicons/icons';

// 🚀 IMPORTACIÓN INDIVIDUAL Y PURA DE COMPONENTES STANDALONE DE IONIC
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonModal,
  IonBadge,
  IonDatetime,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonInput
} from '@ionic/angular/standalone';

import { CitasService } from '../../services/citas';
import { PacientesService } from '../../services/pacientes';
import { Cita } from '../../models/cita.model';
import { Paciente } from '../../models/paciente.model';

@Component({
  selector: 'app-citas',
  templateUrl: './citas.page.html',
  styleUrls: ['./citas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    // Componentes UI de Ionic registrados formalmente
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonModal,
    IonBadge,
    IonDatetime,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonInput
  ],
  providers: [CitasService, PacientesService]
})
export class CitasPage implements OnInit {
  listaCitas: Cita[] = [];
  listaCitasFiltradas: Cita[] = []; 
  listaPacientes: Paciente[] = [];
  rolUsuario: string | null = '';
  
  fechasDestacadas: any[] = []; 
  fechaFiltroActual: string = ''; 

  // 🔍 VARIABLES PARA LA BÚSQUEDA INTELIGENTE DE PACIENTES
  busquedaPaciente: string = '';
  pacientesFiltrados: Paciente[] = [];
  pacienteSeleccionadoObj: Paciente | null = null;

  // 📅 MODAL DE AGENDAR NUEVA CITA
  isAgendarModalOpen: boolean = false;
  nuevaCita = {
    nombrePaciente: '',
    fecha: '',
    horaInicio: '',
    duracion: '30 min',
    motivoConsulta: ''
  };

  // 🩺 MODAL DE FINALIZAR CONSULTA
  isFinalizarModalOpen: boolean = false;
  citaSeleccionada: Cita | null = null;

  // 🎨 MODAL VISUAL DEL CATÁLOGO
  isCatalogoModalOpen: boolean = false;

  registroConsulta = {
    diagnostico: '',
    tratamientoRealizado: '',
    tratamientoOtro: '',
    receta: ''
  };

  // 📋 CATÁLOGO ENRIQUECIDO CON DATOS VISUALES
  catalogoTratamientos = [
    { 
      nombre: 'Limpieza Dental Ultrasónica', 
      precio: 600, 
      duracion: '45 min', 
      categoria: 'Preventivo',
      descripcion: 'Eliminación profunda de sarro y placa bacteriana con pulido dental para prevenir gingivitis.'
    },
    { 
      nombre: 'Resina Estética (Empaste)', 
      precio: 800, 
      duracion: '60 min', 
      categoria: 'Restauración',
      descripcion: 'Restauración del diente afectado por caries utilizando resina fotocurable del mismo color del diente.'
    },
    { 
      nombre: 'Blanqueamiento Dental LED', 
      precio: 2500, 
      duracion: '60 min', 
      categoria: 'Estética',
      descripcion: 'Tratamiento estético para aclarar el tono de los dientes de manera rápida y segura.'
    },
    { 
      nombre: 'Extracción Dental Simple', 
      precio: 900, 
      duracion: '45 min', 
      categoria: 'Cirugía',
      descripcion: 'Remoción de pieza dental con anestesia local para casos donde la pieza no se puede conservar.'
    }
  ];

  constructor(
    @Inject(CitasService) private citasService: CitasService,
    @Inject(PacientesService) private pacientesService: PacientesService,
    private toastController: ToastController
  ) {
    addIcons({
      calendarOutline,
      timeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      trashOutline,
      addCircleOutline,
      alertCircleOutline,
      checkmarkDoneOutline,
      personCircleOutline,
      eyeOutline,
      medkitOutline,
      cashOutline
    });
  }

  async ngOnInit() {
    await this.inicializarDatos();
  }

  async ionViewWillEnter() {
    await this.inicializarDatos();
  }

  private async inicializarDatos() {
    try {
      this.rolUsuario = localStorage.getItem('rolUsuario') || 'Doctor';
      await this.cargarCitas();
      
      if (this.pacientesService) {
        this.listaPacientes = (await this.pacientesService.obtenerPacientes()) || [];
      }
    } catch (error) {
      console.error('Error al inicializar Citas:', error);
    }
  }

  async cargarCitas() {
    try {
      this.listaCitas = (await this.citasService.obtenerCitas()) || [];
      this.actualizarFechasDestacadas();
      this.aplicarFiltro(); 
    } catch (error) {
      console.error('Error al cargar citas:', error);
      this.listaCitas = [];
      this.listaCitasFiltradas = [];
    }
  }

  actualizarFechasDestacadas() {
    if (!this.listaCitas) return;
    const fechasUnicas = Array.from(new Set(this.listaCitas.map(c => c.fecha)));
    this.fechasDestacadas = fechasUnicas.map(fecha => ({
      date: fecha,
      textColor: '#1e62ff',
      backgroundColor: '#eef4ff' 
    }));
  }

  diaSeleccionado(event: any) {
    if (event.detail.value) {
      this.fechaFiltroActual = event.detail.value.split('T')[0];
      this.aplicarFiltro();
    }
  }

  aplicarFiltro() {
    if (this.fechaFiltroActual) {
      this.listaCitasFiltradas = this.listaCitas.filter(c => c.fecha === this.fechaFiltroActual);
    } else {
      this.listaCitasFiltradas = [...this.listaCitas]; 
    }
  }

  limpiarFiltro() {
    this.fechaFiltroActual = '';
    this.listaCitasFiltradas = [...this.listaCitas];
  }

  // 📅 MÉTODOS DEL MODAL AGENDAR CITA
  abrirFormularioCita() {
    // Limpieza de buscador
    this.busquedaPaciente = '';
    this.pacientesFiltrados = [];
    this.pacienteSeleccionadoObj = null;

    this.nuevaCita = {
      nombrePaciente: '',
      fecha: new Date().toISOString().split('T')[0],
      horaInicio: '09:00',
      duracion: '30 min',
      motivoConsulta: ''
    };
    this.isAgendarModalOpen = true;
  }

  cerrarFormularioCita() {
    this.isAgendarModalOpen = false;
    this.busquedaPaciente = '';
    this.pacientesFiltrados = [];
    this.pacienteSeleccionadoObj = null;
  }

  // 🔍 LÓGICA DE BÚSQUEDA INTELIGENTE DE PACIENTES
  filtrarPacientes(event: any) {
    const valor = event.detail.value ? event.detail.value.toLowerCase().trim() : '';
    this.pacienteSeleccionadoObj = null;

    if (valor.length === 0) {
      this.pacientesFiltrados = [];
      return;
    }

    // Coincidencia parcial por nombre, apellido o teléfono
    this.pacientesFiltrados = this.listaPacientes.filter(p => {
      const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
      const telefono = p.telefono ? p.telefono.toString() : '';
      return nombreCompleto.includes(valor) || telefono.includes(valor);
    });
  }

  // 🎯 SELECCIONAR PACIENTE DE LA LISTA SUGERIDA
  seleccionarPaciente(paciente: Paciente) {
    this.pacienteSeleccionadoObj = paciente;
    const nombreCompleto = `${paciente.nombre} ${paciente.apellido || ''}`.trim();
    this.busquedaPaciente = nombreCompleto;
    this.nuevaCita.nombrePaciente = nombreCompleto;
    this.pacientesFiltrados = []; // Ocultar dropdown de sugerencias
  }

  async guardarNuevaCita() {
    const nombreFinal = this.busquedaPaciente.trim();

    if (!nombreFinal || !this.nuevaCita.fecha || !this.nuevaCita.horaInicio || !this.nuevaCita.motivoConsulta) {
      this.mostrarToast('Por favor completa todos los campos requeridos.', 'warning');
      return;
    }

    // Mapeo de duración en minutos según la opción seleccionada
    let minutosDuracion = 30;
    if (this.nuevaCita.duracion === '45 min') minutosDuracion = 45;
    else if (this.nuevaCita.duracion === '1 hora') minutosDuracion = 60;
    else if (this.nuevaCita.duracion === '1.5 horas') minutosDuracion = 90;

    // Cálculo de Hora Fin
    const [horaStr, minutosStr] = this.nuevaCita.horaInicio.split(':');
    const minutosTotalesInicio = Number(horaStr) * 60 + Number(minutosStr);
    const minutosTotalesFin = minutosTotalesInicio + minutosDuracion;

    const horaFinH = String(Math.floor(minutosTotalesFin / 60)).padStart(2, '0');
    const horaFinM = String(minutosTotalesFin % 60).padStart(2, '0');
    const horaFinCalculada = `${horaFinH}:${horaFinM}`;

    const idDoctorActual = 'DOCTOR_DEFAULT_ID'; 

    // Validación de empalme
    const todasLasCitas = (await this.citasService.obtenerCitas()) || [];
    const citasDelDia = todasLasCitas.filter(c => 
      c.fecha === this.nuevaCita.fecha && 
      c.doctorId === idDoctorActual && 
      c.estado === 'Confirmada'
    );

    const seEmpalma = citasDelDia.some(existente => {
      return (this.nuevaCita.horaInicio < existente.horaFin && horaFinCalculada > existente.horaInicio);
    });

    if (seEmpalma) {
      this.mostrarToast('❌ El horario seleccionado ya está ocupado por otra consulta confirmada.', 'danger');
      return;
    }

    const estadoInicial = (this.rolUsuario === 'Paciente') ? 'Pendiente' : 'Confirmada';

    // Asignamos pacienteId real si seleccionó uno de la lista, o ID temporal si es manual
    const citaParaGuardar: Cita = {
      pacienteId: this.pacienteSeleccionadoObj?.id || 'PACIENTE_TEMP_ID',
      nombrePaciente: nombreFinal,
      doctorId: idDoctorActual,
      nombreDoctor: 'Dr. Sandoval',
      fecha: this.nuevaCita.fecha,
      horaInicio: this.nuevaCita.horaInicio,
      horaFin: horaFinCalculada,
      estado: estadoInicial,
      motivoConsulta: this.nuevaCita.motivoConsulta,
      fechaRegistro: new Date().toISOString().split('T')[0]
    };

    try {
      await this.citasService.agregarCita(citaParaGuardar);
      this.mostrarToast(
        estadoInicial === 'Confirmada' ? 'Cita agendada y confirmada' : 'Solicitud enviada, en espera de validación',
        'success'
      );
      this.cerrarFormularioCita();
      await this.cargarCitas();
    } catch (err) {
      console.error(err);
      this.mostrarToast('Error al conectar con la base de datos.', 'danger');
    }
  }

  async validarCita(cita: Cita) {
    try {
      const todasLasCitas = (await this.citasService.obtenerCitas()) || [];
      
      const citasConfirmadasDelDia = todasLasCitas.filter(c => 
        c.fecha === cita.fecha && 
        c.doctorId === cita.doctorId && 
        c.estado === 'Confirmada' &&
        c.id !== cita.id
      );

      const seEmpalma = citasConfirmadasDelDia.some(existente => {
        return (cita.horaInicio < existente.horaFin && cita.horaFin > existente.horaInicio);
      });

      if (seEmpalma) {
        this.mostrarToast('❌ Conflicto de agenda: Ya existe otra cita confirmada en este rango de tiempo.', 'danger');
        return;
      }

      await this.citasService.actualizarCita(cita.id!, { estado: 'Confirmada' });
      this.mostrarToast('Cita validada y confirmada con éxito', 'success');
      await this.cargarCitas();
    } catch (error) {
      console.error(error);
      this.mostrarToast('Error al actualizar el estado de la cita.', 'danger');
    }
  }

  verDetalleTratamientos() {
    this.isCatalogoModalOpen = true;
  }

  cerrarModalCatalogo() {
    this.isCatalogoModalOpen = false;
  }

  seleccionarTratamientoDesdeCatalogo(nombreTratamiento: string) {
    this.nuevaCita.motivoConsulta = nombreTratamiento;
    this.registroConsulta.tratamientoRealizado = nombreTratamiento;
    this.cerrarModalCatalogo();
    this.mostrarToast(`Seleccionado: ${nombreTratamiento}`, 'primary');
  }

  abrirModalFinalizar(cita: Cita) {
    this.citaSeleccionada = cita;
    const coincideConCatalogo = this.catalogoTratamientos.some(t => t.nombre === cita.motivoConsulta);

    this.registroConsulta = {
      diagnostico: '',
      tratamientoRealizado: coincideConCatalogo ? cita.motivoConsulta : (cita.motivoConsulta ? 'Otro' : ''),
      tratamientoOtro: coincideConCatalogo ? '' : (cita.motivoConsulta || ''),
      receta: ''
    };

    this.isFinalizarModalOpen = true;
  }

  cerrarModalFinalizar() {
    this.isFinalizarModalOpen = false;
    this.citaSeleccionada = null;
  }

  async guardarYCompletarConsulta() {
    if (!this.citaSeleccionada?.id) return;

    if (!this.registroConsulta.diagnostico.trim() || !this.registroConsulta.tratamientoRealizado) {
      this.mostrarToast('Por favor, ingresa el diagnóstico y selecciona un tratamiento.', 'warning');
      return;
    }

    const tratamientoFinal = this.registroConsulta.tratamientoRealizado === 'Otro' 
      ? this.registroConsulta.tratamientoOtro 
      : this.registroConsulta.tratamientoRealizado;

    if (!tratamientoFinal.trim()) {
      this.mostrarToast('Por favor, especifica el tratamiento aplicado.', 'warning');
      return;
    }

    try {
      await this.citasService.actualizarCita(this.citaSeleccionada.id, {
        diagnostico: this.registroConsulta.diagnostico,
        tratamiento: tratamientoFinal,
        receta: this.registroConsulta.receta,
        estado: 'Completada'
      });

      this.mostrarToast('Expediente actualizado y consulta finalizada.', 'success');
      this.cerrarModalFinalizar();
      await this.cargarCitas();
    } catch (error) {
      console.error('Error al guardar datos clínicos:', error);
      this.mostrarToast('Hubo un error al procesar el cierre de consulta.', 'danger');
    }
  }

  async cancelarCita(id: string) {
    try {
      await this.citasService.actualizarCita(id, { estado: 'Cancelada' });
      this.mostrarToast('La cita ha sido cancelada', 'warning');
      await this.cargarCitas();
    } catch (error) {
      console.error(error);
      this.mostrarToast('Error al cancelar la cita.', 'danger');
    }
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
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HistorialService } from '../../services/historial.service';
import { HistorialClinico } from '../../models/historial.model';

// 🌟 IMPORTAMOS LOS COMPONENTES DE ICONOS DE MANERA CONTROLADA
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';

// Importaciones Standalone de Ionic
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonTextarea,
    IonButton,
    IonIcon
  ]
})
export class HistorialPage implements OnInit {
  idPacienteSelected: string = '';
  rolUsuario: string | null = '';
  esEditable: boolean = false;
  resultado: string = '';

  historial: HistorialClinico = {
    idPaciente: '',
    nombrePaciente: '',
    alergias: 'Ninguna',
    enfermedadesCronicas: 'Ninguna',
    medicamentosActuales: 'Ninguno',
    motivoPrincipal: '',
    observacionesGenerales: '',
    fechaRegistro: new Date(),
    actualizadoPor: ''
  };

  constructor(
    private historialService: HistorialService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // 🌟 REGISTRAMOS EL ICONO DE GUARDAR EN EL NÚCLEO DE IONIC
    addIcons({ saveOutline });
  }

  async ngOnInit() {
    // 🛡️ Control de seguridad por roles
    this.rolUsuario = localStorage.getItem('rolUsuario');
    this.esEditable = (this.rolUsuario === 'Administrador' || this.rolUsuario === 'Doctor');

    // Recuperamos el ID del paciente desde la URL si viene del Panel de Control
    this.idPacienteSelected = this.route.snapshot.paramMap.get('id') || '';
    
    // Si no viene ningún ID en la URL y el rol es Paciente, carga su propio historial
    if (!this.idPacienteSelected && this.rolUsuario === 'Paciente') {
      this.idPacienteSelected = localStorage.getItem('uidUsuario') || '';
    }

    if (this.idPacienteSelected) {
      this.cargarHistorial();
    } else {
      this.resultado = '⚠️ No se especificó ningún paciente.';
    }
  }

 async cargarHistorial() {
    try {
      const data = await this.historialService.obtenerHistorialPorPaciente(this.idPacienteSelected);
      
      if (data) {
        this.historial = data;
      } else {
        // Inicializar datos base si el expediente es nuevo en Firestore
        this.historial.idPaciente = this.idPacienteSelected;
      }

      // 🌟 CORRECCIÓN RECTIFICADORA: Asegurar que el nombre nunca sea "Nuevo Paciente" o quede vacío
      if (!this.historial.nombrePaciente || this.historial.nombrePaciente === 'Nuevo Paciente') {
        if (this.rolUsuario === 'Paciente') {
          this.historial.nombrePaciente = localStorage.getItem('nombreUsuario') || 'Mi Expediente';
        } else {
          // Si es Doctor/Admin, consultamos directamente el nombre real del paciente usando su ID
          const nombreReal = await this.historialService.obtenerNombrePaciente(this.idPacienteSelected);
          this.historial.nombrePaciente = nombreReal ? nombreReal : 'Paciente Dentismile';
        }
      }

    } catch (err) {
      this.resultado = '❌ Error al conectar con el servidor médico.';
    }
  }

  async guardarExpediente() {
    if (!this.esEditable) return;

    try {
      this.historial.fechaRegistro = new Date();
      this.historial.actualizadoPor = localStorage.getItem('uidUsuario') || 'Anonimo';

      await this.historialService.guardarHistorial(this.idPacienteSelected, this.historial);
      this.resultado = '✅ Expediente clínico guardado de forma segura.';
    } catch (error) {
      this.resultado = '❌ Error de privilegios: No se pudo escribir en la BD.';
    }
  }
}
import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonicModule, 
  AlertController, 
  ToastController 
} from '@ionic/angular';

// 🌟 REGISTRAMOS medicalOutline PARA TU NUEVO BOTÓN CLÍNICO:
import { addIcons } from 'ionicons';
import { 
  eyeOutline, 
  createOutline, 
  trashOutline, 
  callOutline, 
  mailOutline, 
  addCircleOutline, 
  peopleOutline,
  medicalOutline // 👈 Agregado aquí
} from 'ionicons/icons';

import { PacientesService } from '../../services/pacientes'; 
import { Paciente } from '../../models/paciente.model';
import { RouterModule } from '@angular/router'; // 👈 Asegura la navegación por enlaces

@Component({
  selector: 'app-pacientes',
  templateUrl: './pacientes.page.html',
  styleUrls: ['./pacientes.page.scss'],
  standalone: true,
  // 🌟 Agregamos RouterModule en los imports para que el HTML reconozca el routerLink
  imports: [IonicModule, CommonModule, FormsModule, RouterModule], 
  providers: [PacientesService]
})
export class PacientesPage implements OnInit {
  listaPacientes: Paciente[] = [];
  listaPacientesRespaldo: Paciente[] = []; // 🔎 Para el filtro del buscador sin perder los datos reales
  esAdmin: boolean = false; 

  constructor(
    @Inject(PacientesService) private pacientesService: PacientesService,
    private alertController: AlertController,
    private toastController: ToastController
  ) { 
     // 🌟 Inyectamos medicalOutline en el core de Ionic para renderizar el icono
     addIcons({ 
       eyeOutline, 
       createOutline, 
       trashOutline, 
       callOutline, 
       mailOutline, 
       addCircleOutline, 
       peopleOutline,
       medicalOutline // 👈 Registrado aquí
     });   
  }

  ngOnInit() {
    const rol = localStorage.getItem('rolUsuario'); 
    this.esAdmin = (rol === 'Administrador');
    this.cargarPacientes();
  }

  // 📋 FUNCIÓN LEER: Trae la lista de Firebase
  async cargarPacientes() {
    try {
      this.listaPacientes = await this.pacientesService.obtenerPacientes();
      this.listaPacientesRespaldo = [...this.listaPacientes]; // Guardamos una copia exacta
    } catch (error) {
      this.mostrarToast('Error al cargar la base de datos.', 'danger');
    }
  }

  // 🔎 NUEVA FUNCIÓN: Filtra en tiempo real los pacientes en pantalla
  buscarPaciente(event: any) {
    const texto = event.target.value?.toLowerCase().trim() || '';

    if (texto === '') {
      this.listaPacientes = [...this.listaPacientesRespaldo]; // Si borran la búsqueda, regresa la lista completa
      return;
    }

    // Filtra por nombre, apellido o teléfono
    this.listaPacientes = this.listaPacientesRespaldo.filter(paciente => {
      return (
        paciente.nombre?.toLowerCase().includes(texto) ||
        paciente.apellido?.toLowerCase().includes(texto) ||
        paciente.telefono?.includes(texto)
      );
    });
  }

  // 🔎 NUEVA FUNCIÓN: Alerta interactiva para consultar la información completa del paciente
  async verDetallesPaciente(paciente: Paciente) {
    const alert = await this.alertController.create({
      header: `Expediente: ${paciente.nombre}`,
      subHeader: `${paciente.apellido}`,
      message: `
        <strong>📞 Teléfono:</strong> ${paciente.telefono || 'No registrado'}<br><br>
        <strong>✉️ Correo:</strong> ${paciente.correo || 'Sin correo'}<br><br>
        <strong>📅 F. Nacimiento:</strong> ${paciente.fechaNacimiento || 'No registrada'}
      `,
      buttons: ['Cerrar']
    });

    await alert.present();
  }

  // ➕ FUNCIÓN CREAR
  async abrirFormularioAgregar() {
    const alert = await this.alertController.create({
      header: 'Nuevo Expediente Clínico',
      inputs: [
        { name: 'nombre', type: 'text', placeholder: 'Nombre(s)' },
        { name: 'apellido', type: 'text', placeholder: 'Apellidos' },
        { name: 'telefono', type: 'tel', placeholder: 'Teléfono' },
        { name: 'correo', type: 'email', placeholder: 'Correo Electrónico' },
        { name: 'fechaNacimiento', type: 'date' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (!data.nombre || !data.apellido) {
              this.mostrarToast('El nombre y apellido son obligatorios', 'warning');
              return false;
            }
            
            const nuevoPaciente: Paciente = {
              nombre: data.nombre,
              apellido: data.apellido,
              telefono: data.telefono,
              correo: data.correo,
              fechaNacimiento: data.fechaNacimiento,
            // 🌟 SOLUCIÓN: Agregamos estas dos líneas para cumplir con la interfaz
  rol: 'Paciente',
  perfilCompleto: false // Al crearse desde la administración, inicia
            };

            await this.pacientesService.agregarPaciente(nuevoPaciente);
            this.mostrarToast('Paciente registrado con éxito', 'success');
            this.cargarPacientes(); 
            return true; 
          }
        }
      ]
    });

    await alert.present();
  }

  // ❌ FUNCIÓN ELIMINAR
  async clickEliminar(id: string) {
    if (!this.esAdmin) {
      this.mostrarToast('Acción denegada. Solo administradores.', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: '¿Confirmar eliminación?',
      message: 'Esta acción borrará de forma permanente el expediente de Firestore.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.pacientesService.eliminarPaciente(id);
            this.mostrarToast('Expediente eliminado', 'success');
            this.cargarPacientes(); 
            return true; 
          }
        }
      ]
    });

    await alert.present();
  }

  // 📝 FUNCIÓN ACTUALIZAR
  async abrirFormularioEditar(paciente: Paciente) {
    const alert = await this.alertController.create({
      header: 'Modificar Expediente',
      inputs: [
        { name: 'nombre', type: 'text', value: paciente.nombre, placeholder: 'Nombre' },
        { name: 'apellido', type: 'text', value: paciente.apellido, placeholder: 'Apellido' },
        { name: 'telefono', type: 'tel', value: paciente.telefono, placeholder: 'Teléfono' },
        { name: 'correo', type: 'email', value: paciente.correo, placeholder: 'Correo' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Actualizar',
          handler: async (data) => {
            const cambios: Partial<Paciente> = {
              nombre: data.nombre,
              apellido: data.apellido,
              telefono: data.telefono,
              correo: data.correo
            };

            await this.pacientesService.actualizarPaciente(paciente.id!, cambios);
            this.mostrarToast('Datos actualizados correctamente', 'success');
            this.cargarPacientes();
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
      duration: 2500,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}
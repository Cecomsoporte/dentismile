import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonBadge,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonAvatar,
  IonModal
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { 
  businessOutline, 
  peopleOutline, 
  optionsOutline, 
  saveOutline, 
  personCircleOutline,
  createOutline,
  cameraOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonBadge,
    IonIcon,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonAvatar,
    IonModal
  ]
})
export class ConfiguracionPage implements OnInit {

  seccionActiva: string = 'clinica';

  clinica = {
    nombre: 'Dentismile',
    telefono: '656-123-4567',
    direccion: 'Ciudad Juárez, Chih.',
    rfc: 'DMI240101XXX'
  };

  parametros = {
    duracionCita: '45',
    moneda: 'MXN'
  };

  usuarios = [
    { id: 1, nombre: 'Dr. Sandoval Quintero', correo: 'doctor@dentismile.com', rol: 'doctor', foto: '' },
    { id: 2, nombre: 'María Lopez', correo: 'recepcion@dentismile.com', rol: 'recepcionista', foto: '' },
    { id: 3, nombre: 'Administrador General', correo: 'admin@dentismile.com', rol: 'admin', foto: '' }
  ];

  // Control del Modal y formulario temporal
  isModalOpen: boolean = false;
  usuarioSeleccionado: any = null;
  tempNombre: string = '';
  tempFoto: string = '';

  constructor(private toastController: ToastController) {
    addIcons({ 
      businessOutline, 
      peopleOutline, 
      optionsOutline, 
      saveOutline, 
      personCircleOutline, 
      createOutline,
      cameraOutline
    });
  }

  ngOnInit() {}

  cambiarSeccion(event: any) {
    this.seccionActiva = event.detail.value;
  }

  // Abrir modal con los datos actuales
  editarUsuario(usuario: any) {
    this.usuarioSeleccionado = usuario;
    this.tempNombre = usuario.nombre;
    this.tempFoto = usuario.foto;
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.usuarioSeleccionado = null;
  }

  // Convertir imagen local a Base64 para guardarla fácilmente
  seleccionarFoto(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.tempFoto = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // Guardar datos en el objeto del usuario
  async guardarPerfil() {
    if (this.usuarioSeleccionado) {
      this.usuarioSeleccionado.nombre = this.tempNombre.trim();
      this.usuarioSeleccionado.foto = this.tempFoto;

      const toast = await this.toastController.create({
        message: `Perfil de ${this.usuarioSeleccionado.nombre} actualizado correctamente.`,
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      toast.present();
    }
    this.cerrarModal();
  }

  async guardarClinica() {
    const toast = await this.toastController.create({
      message: '¡Datos de la clínica guardados correctamente!',
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
    toast.present();
  }

  async guardarParametros() {
    const toast = await this.toastController.create({
      message: '¡Parámetros del sistema actualizados!',
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
    toast.present();
  }
}
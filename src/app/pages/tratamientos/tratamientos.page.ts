import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { calendarOutline, timeOutline, cashOutline, medkitOutline } from 'ionicons/icons';

// Componentes Standalone de Ionic
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
  IonBadge
} from '@ionic/angular/standalone';

export interface Tratamiento {
  id: string;
  nombre: string;
  descripcion: string;
  duracion: string;
  precioEstimado: number;
  categoria: string;
}

@Component({
  selector: 'app-tratamientos',
  templateUrl: './tratamientos.page.html',
  styleUrls: ['./tratamientos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
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
    IonCardSubtitle, // 👈 Conservado y utilizado en el template
    IonCardContent,
    IonButton,
    IonIcon,
    IonBadge
  ]
})
export class TratamientosPage implements OnInit {

  // Lista base de tratamientos del consultorio Dentismile
  listaTratamientos: Tratamiento[] = [
    {
      id: '1',
      nombre: 'Limpieza Dental Ultrasónica',
      descripcion: 'Eliminación profunda de sarro y placa bacteriana con pulido dental para prevenir gingivitis.',
      duracion: '45 min',
      precioEstimado: 600,
      categoria: 'Preventivo'
    },
    {
      id: '2',
      nombre: 'Resina Estética (Empaste)',
      descripcion: 'Restauración del diente afectado por caries utilizando resina fotocurable del mismo color del diente.',
      duracion: '60 min',
      precioEstimado: 800,
      categoria: 'Restauración'
    },
    {
      id: '3',
      nombre: 'Blanqueamiento Dental LED',
      descripcion: 'Tratamiento estético para aclarar el tono de los dientes de manera rápida y segura.',
      duracion: '60 min',
      precioEstimado: 2500,
      categoria: 'Estética'
    },
    {
      id: '4',
      nombre: 'Extracción Dental Simple',
      descripcion: 'Remoción de pieza dental con anestesia local para casos donde la pieza no se puede conservar.',
      duracion: '45 min',
      precioEstimado: 900,
      categoria: 'Cirugía'
    },
    {
      id: '5',
      nombre: 'Tratamiento de Conductos (Endodoncia)',
      descripcion: 'Procedimiento para salvar un diente severamente dañado o infectado retirando la pulpa afectada.',
      duracion: '90 min',
      precioEstimado: 3200,
      categoria: 'Especializada'
    }
  ];

  constructor(private router: Router) {
    // Registro de íconos requeridos
    addIcons({
      'calendar-outline': calendarOutline,
      'time-outline': timeOutline,
      'cash-outline': cashOutline,
      'medkit-outline': medkitOutline
    });
  }

  ngOnInit() {}

  // Asigna un color temático según la categoría del tratamiento
  getColorCategoria(categoria: string): string {
    switch (categoria.toLowerCase()) {
      case 'preventivo':
        return 'tertiary';
      case 'restauración':
        return 'secondary';
      case 'estética':
        return 'warning';
      case 'cirugía':
        return 'danger';
      case 'especializada':
        return 'primary';
      default:
        return 'medium';
    }
  }

  // Redirige a agendar cita pasando el tratamiento como parámetro
  agendarTratamiento(tratamientoNombre: string) {
    this.router.navigate(['/agendar-cita'], {
      queryParams: { servicio: tratamientoNombre }
    });
  }
}
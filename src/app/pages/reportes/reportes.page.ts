import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitasService } from '../../services/citas';

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
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { statsChartOutline, medicalOutline, pieChartOutline } from 'ionicons/icons';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
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
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonButtons,
    IonBackButton,
    IonSelect,
    IonSelectOption
  ]
})
export class ReportesPage implements OnInit {

  private citasService = inject(CitasService);

  citasBaseDatos: any[] = [];
  filtroPeriodo: string = 'todos';

  // Métricas financieras
  totalIngresos: number = 0;
  totalCitasAtendidas: number = 0;
  ticketPromedio: number = 0;

  // Agrupamiento
  desgloseTratamientos: { nombre: string; cantidad: number; subtotal: number }[] = [];

  constructor() {
    addIcons({ statsChartOutline, medicalOutline, pieChartOutline });
  }

  async ngOnInit() {
    await this.cargarCitas();
  }

  async ionViewWillEnter() {
    await this.cargarCitas();
  }

  async cargarCitas() {
    try {
      const todas = await this.citasService.obtenerCitas();
      // Solo tomamos citas en estado Pagada o Finalizada
      this.citasBaseDatos = todas.filter((c: any) => c.estado === 'Pagada' || c.estado === 'Finalizada' || c.pagado === true);
      this.procesarReportes();
    } catch (error) {
      console.error('Error al cargar datos para reportes:', error);
    }
  }

  procesarReportes() {
    const hoyStr = new Date().toISOString().split('T')[0];

    // 1. Filtrar citas según el período seleccionado
    const citasFiltradas = this.citasBaseDatos.filter(cita => {
      const fechaCita = cita.fecha || cita.fechaPago || '';

      if (this.filtroPeriodo === 'hoy') {
        return fechaCita.includes(hoyStr);
      }
      // Se pueden expandir comparaciones de fechas para semana / mes
      return true;
    });

    // 2. Reiniciar acumuladores
    this.totalIngresos = 0;
    this.totalCitasAtendidas = citasFiltradas.length;
    const mapaTratamientos: { [key: string]: { cantidad: number; subtotal: number } } = {};

    citasFiltradas.forEach(cita => {
      let monto = Number(cita.montoPagado || cita.costo || cita.monto || cita.precio || 0);
      if (!monto || isNaN(monto)) {
        monto = 350; // Valor fallback
      }

      this.totalIngresos += monto;

      const nombreTratamiento = cita.tratamiento || 'Consulta General';
      if (!mapaTratamientos[nombreTratamiento]) {
        mapaTratamientos[nombreTratamiento] = { cantidad: 0, subtotal: 0 };
      }
      mapaTratamientos[nombreTratamiento].cantidad += 1;
      mapaTratamientos[nombreTratamiento].subtotal += monto;
    });

    // 3. Ticket promedio
    this.ticketPromedio = this.totalCitasAtendidas > 0 
      ? Math.round(this.totalIngresos / this.totalCitasAtendidas) 
      : 0;

    // 4. Convertir mapa a arreglo para el *ngFor
    this.desgloseTratamientos = Object.keys(mapaTratamientos).map(key => ({
      nombre: key,
      cantidad: mapaTratamientos[key].cantidad,
      subtotal: mapaTratamientos[key].subtotal
    })).sort((a, b) => b.subtotal - a.subtotal);
  }
}

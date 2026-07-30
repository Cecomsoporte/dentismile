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
  IonSearchbar
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { receiptOutline, cashOutline, cardOutline, walletOutline } from 'ionicons/icons';

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.page.html',
  styleUrls: ['./pagos.page.scss'],
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
    IonSearchbar
  ]
})
export class PagosPage implements OnInit {

  private citasService = inject(CitasService);

  listaPagos: any[] = [];
  pagosFiltrados: any[] = [];
  textoBusqueda: string = '';

  // Indicadores financieros
  totalIngresosHoy: number = 0;
  totalEfectivo: number = 0;
  totalTarjeta: number = 0;
  totalTransferencia: number = 0;

  constructor() {
    addIcons({ receiptOutline, cashOutline, cardOutline, walletOutline });
  }

  async ngOnInit() {
    await this.cargarHistorialPagos();
  }

  async ionViewWillEnter() {
    await this.cargarHistorialPagos();
  }

  async cargarHistorialPagos() {
    try {
      // Obtenemos todas las citas
      const todasLasCitas = await this.citasService.obtenerCitas();

      // Filtramos únicamente las que ya están cobradas / pagadas
      this.listaPagos = todasLasCitas.filter((c: any) => c.estado === 'Pagada' || c.estado === 'Finalizada' || c.pagado === true);
      this.pagosFiltrados = [...this.listaPagos];

      this.calcularTotales();
    } catch (error) {
      console.error('Error al cargar historial de pagos:', error);
    }
  }
calcularTotales() {
    this.totalIngresosHoy = 0;
    this.totalEfectivo = 0;
    this.totalTarjeta = 0;
    this.totalTransferencia = 0;

    this.listaPagos.forEach(pago => {
      // 🌟 Intenta obtener el valor numérico de cualquier propiedad donde esté guardado el costo
      let monto = Number(pago.montoPagado || pago.costo || pago.monto || pago.precio || 0);

      // Si aún así da 0 o NaN, le asignamos un costo base de consulta
      if (!monto || isNaN(monto)) {
        monto = 350; // Costo por defecto si el tratamiento no tenía precio registrado
      }

      // Asignamos el monto calculado al objeto para que la etiqueta verde (+$) también se actualice
      pago.montoCalculado = monto;

      this.totalIngresosHoy += monto;

      const metodo = (pago.metodoPago || 'Efectivo').toLowerCase();
      if (metodo.includes('tarjeta')) {
        this.totalTarjeta += monto;
      } else if (metodo.includes('transferencia') || metodo.includes('spei')) {
        this.totalTransferencia += monto;
      } else {
        this.totalEfectivo += monto;
      }
    });
  }
 




  filtrarPagos() {
    const busqueda = this.textoBusqueda.toLowerCase().trim();
    if (!busqueda) {
      this.pagosFiltrados = [...this.listaPagos];
      return;
    }

    this.pagosFiltrados = this.listaPagos.filter(pago => {
      const paciente = (pago.nombrePaciente || '').toLowerCase();
      const tratamiento = (pago.tratamiento || '').toLowerCase();
      return paciente.includes(busqueda) || tratamiento.includes(busqueda);
    });
  }
}
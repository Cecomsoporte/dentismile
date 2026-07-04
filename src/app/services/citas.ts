import { Injectable, inject } from '@angular/core';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  getFirestore 
} from 'firebase/firestore'; 
import { Cita } from '../models/cita.model';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private firestore = getFirestore(); 
  private colRef = collection(this.firestore, 'citas');
  
  constructor() { }

  // 🔎 VALIDACIÓN DE DISPONIBILIDAD
  async verificarDisponibilidad(fecha: string, horaInicio: string): Promise<boolean> {
    const q = query(
      this.colRef,
      where('fecha', '==', fecha),
      where('horaInicio', '==', horaInicio),
      where('estado', '==', 'Confirmada')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  }

  // ➕ CREAR
  async agregarCita(cita: Cita): Promise<void> {
    await addDoc(this.colRef, cita);
  }

  // 📋 LEER TODAS
  async obtenerCitas(): Promise<Cita[]> {
    const q = query(this.colRef, orderBy('fecha', 'asc'), orderBy('horaInicio', 'asc'));
    const querySnapshot = await getDocs(q);
    const citas: Cita[] = [];
    
    querySnapshot.forEach((docSnap) => {
      citas.push({
        id: docSnap.id,
        ...docSnap.data()
      } as Cita);
    });
    
    return citas;
  }

  // 📝 ACTUALIZAR GENERAL
  async actualizarCita(id: string, cambios: Partial<Cita>): Promise<void> {
    const docRef = doc(this.firestore, 'citas', id);
    await updateDoc(docRef, cambios);
  }

  // ❌ ELIMINAR
  async eliminarCita(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'citas', id);
    await deleteDoc(docRef);
  }

  // =========================================================================
  // 🏥 LÓGICA ADAPTADA PARA EL DOCTOR Y LA RECEPCIONISTA (DENTISMILE)
  // =========================================================================

  // 1. CAMBIAR ESTADO (Ej: Pasar de 'Confirmada' a 'En progreso')
  async actualizarEstado(idCita: string, nuevoEstado: 'Pendiente' | 'Confirmada' | 'En progreso' | 'Completada' | 'Cancelada' | 'Pagada'): Promise<void> {
    const docRef = doc(this.firestore, 'citas', idCita);
    await updateDoc(docRef, { estado: nuevoEstado });
  }

  // 2. FINALIZAR CONSULTA (Módulo del Doctor)
  async finalizarConsulta(
    idCita: string, 
    datosConsulta: { diagnostico: string, tratamiento: string, costo: number }
  ): Promise<void> {
    const docRef = doc(this.firestore, 'citas', idCita);
    
    const cambios = {
      diagnostico: datosConsulta.diagnostico,
      tratamiento: datosConsulta.tratamiento, // 👈 Deja solo esto, borrando el "datosConsulta.treatment ||"
      costo: datosConsulta.costo,
      estado: 'Completada' as const,
      fechaTermino: new Date().toISOString()
    };

    await updateDoc(docRef, cambios);
  }

  // 3. OBTENER CITAS POR COBRAR (Módulo de Recepción: Trae las del día que estén 'Completada')
  async obtenerCitasPorCobrar(fechaHoy: string): Promise<Cita[]> {
    try {
      const q = query(
        this.colRef,
        where('fecha', '==', fechaHoy),
        where('estado', '==', 'Completada')
      );
      
      const querySnapshot = await getDocs(q);
      const citasPorCobrar: Cita[] = [];
      
      querySnapshot.forEach((docSnap) => {
        citasPorCobrar.push({
          id: docSnap.id,
          ...docSnap.data()
        } as Cita);
      });
      
      return citasPorCobrar;
    } catch (error) {
      console.error("Error dentro de obtenerCitasPorCobrar: ", error);
      throw error;
    }
  }
}
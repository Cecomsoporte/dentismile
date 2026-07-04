import { Injectable } from '@angular/core';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore'; 
import { HistorialClinico } from '../models/historial.model';

@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  private firestore = getFirestore();

  constructor() { }

  // 🔎 Buscar el historial clínico de un paciente por su ID único
  async obtenerHistorialPorPaciente(idPaciente: string): Promise<HistorialClinico | null> {
    const docRef = doc(this.firestore, `historiales_clinicos/${idPaciente}`);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as HistorialClinico;
    }
    return null;
  }
// Agrega esta función dentro de tu HistorialService en src/app/services/historial.service.ts

async obtenerNombrePaciente(idPaciente: string): Promise<string | null> {
  try {
    const docRef = doc(this.firestore, `pacientes/${idPaciente}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const datos = docSnap.data();
      return `${datos['nombre']} ${datos['apellido']}`;
    }
    return null;
  } catch (error) {
    return null;
  }
}

  // ➕ Guardar o actualizar el expediente clínico
  async guardarHistorial(idPaciente: string, historial: HistorialClinico): Promise<void> {
    const docRef = doc(this.firestore, `historiales_clinicos/${idPaciente}`);
    await setDoc(docRef, historial, { merge: true });
  }
}
import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc,
  updateDoc,
  deleteDoc,
  query, 
  orderBy 
} from 'firebase/firestore';
import { firebaseConfig } from '../../environments/firebase.config';

// 🛠️ RUTA CORREGIDA: Agregamos un "../" extra para que suba correctamente al nivel de app/
// 📁 Corregido: Sube un solo nivel (../) para salir de services y entrar a models
import { Paciente } from '../models/paciente.model';
@Injectable({
  providedIn: 'root'
})
export class PacientesService {
  private db;

  constructor() {
    // Inicializamos Firestore usando tu configuración actual
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  // ➕ 1. CREAR: Guardar un nuevo paciente en Firestore
  async agregarPaciente(paciente: Paciente) {
    const colRef = collection(this.db, 'pacientes');
    return await addDoc(colRef, {
      ...paciente,
      fechaRegistro: new Date() // Se agrega la fecha de registro del sistema
    });
  }

  // 📋 2. LEER: Traer la lista de pacientes ordenada por los más recientes
  async obtenerPacientes(): Promise<Paciente[]> {
    const colRef = collection(this.db, 'pacientes');
    const q = query(colRef, orderBy('fechaRegistro', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const pacientes: Paciente[] = [];
    querySnapshot.forEach((doc) => {
      pacientes.push({
        id: doc.id,
        ...doc.data()
      } as Paciente);
    });
    
    return pacientes;
  }

  // 📝 3. ACTUALIZAR: Modificar datos de un paciente existente (Admin o Doctor)
  async actualizarPaciente(id: string, datosModificados: Partial<Paciente>) {
    const docRef = doc(this.db, 'pacientes', id);
    return await updateDoc(docRef, datosModificados);
  }

  // ❌ 4. ELIMINAR: Borrar permanentemente de la base de datos (Exclusivo Admin)
  async eliminarPaciente(id: string) {
    const docRef = doc(this.db, 'pacientes', id);
    return await deleteDoc(docRef);
  }
}
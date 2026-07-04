import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';

// 📦 Importamos Firestore de la manera estándar compatible con tu inicialización de app
import { 
  getFirestore, 
  Firestore, 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';

import { firebaseConfig } from '../../environments/firebase.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Definimos las propiedades con su tipo correspondiente
  private app: FirebaseApp;
  private auth: Auth;
  private firestore: Firestore; // Instancia para la base de datos de roles

  // Almacenamos el rol en memoria para accesos rápidos desde los Guards
  private rolUsuarioActual: string | null = null;

  constructor() {
    // Inicializamos Firebase dentro del constructor para asegurar que ocurra
    // una sola vez cuando Angular cree la instancia única (Singleton) del servicio.
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.firestore = getFirestore(this.app); // Inicializamos Firestore de forma segura
  }

  // 🔐 Método para Iniciar Sesión (Modificado para extraer el Rol)
  async login(email: string, password: string) {
    // 1. Autenticamos con Firebase Auth
    const credenciales = await signInWithEmailAndPassword(this.auth, email, password);
    const uid = credenciales.user.uid;
    
    // 2. Buscamos el rol del usuario en la colección 'usuarios' usando su UID
    const userDoc = await getDoc(doc(this.firestore, `usuarios/${uid}`));
    
    if (userDoc.exists()) {
      this.rolUsuarioActual = userDoc.data()['rol']; // Guarda: 'Administrador', 'Doctor', 'Recepcionista' o 'Paciente'
      localStorage.setItem('rol', this.rolUsuarioActual!); // Respaldo local para recargas de página
    } else {
      // Si por alguna razón el usuario no tiene documento, le asignamos por defecto el de Paciente por seguridad
      this.rolUsuarioActual = 'Paciente';
      localStorage.setItem('rol', 'Paciente');
    }
    
    return credenciales;
  }

  // 👤 Método para Registrar Usuarios (Modificado para guardarlo en 'usuarios' y 'pacientes' en simultáneo)
  async register(email: string, password: string) {
    const credenciales = await createUserWithEmailAndPassword(this.auth, email, password);
    const uid = credenciales.user.uid;

    // Extraemos la primera parte del correo para usarla como su nombre en los listados médicos
    const nombreProvisional = email.split('@')[0];

    // 1. Guardamos el control de acceso en la colección 'usuarios'
    await setDoc(doc(this.firestore, `usuarios/${uid}`), {
      correo: email,
      rol: 'Paciente',
      fechaRegistro: new Date()
    });

    // 2. 🌟 LA SOLUCIÓN: Guardamos el perfil clínico en la colección 'pacientes' con el mismo ID
    // Esto hace que aparezca de inmediato en los formularios de selección para agendar citas
    await setDoc(doc(this.firestore, `pacientes/${uid}`), {
      id: uid,
      nombre: nombreProvisional,
      apellido: 'Registrado',
      correo: email,
      rol: 'Paciente',
      fechaRegistro: new Date()
    });

    return credenciales;
  }

  // 🔍 Método centralizado para que el RoleGuard consulte el rol actual
  getRol(): string | null {
    if (!this.rolUsuarioActual) {
      this.rolUsuarioActual = localStorage.getItem('rol');
    }
    return this.rolUsuarioActual;
  }

  // 📧 Método para Recuperar Contraseña
  resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  // 🚪 Método de Cerrar Sesión (Limpiando rastro de roles)
  logout() {
    this.rolUsuarioActual = null;
    localStorage.removeItem('rol'); // Destrucción segura del rol en el almacenamiento local
    return signOut(this.auth);
  }
}
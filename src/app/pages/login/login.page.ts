import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

// Importamos todos los componentes de Ionic que estás usando en tu HTML
import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
  ]
})
export class LoginPage {

  usuario: string = '';
  password: string = '';
  generada: string = '';
  resultado: string = '';

  intentos = 0;
  bloqueado = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // 🔐 Iniciar sesión con Firebase
  async iniciarSesion() {
    if (this.bloqueado) {
      this.resultado = '🔒 El sistema sigue bloqueado. Espera un momento.';
      return;
    }

    if (!this.usuario || !this.password) {
      this.resultado = '⚠️ Por favor, llena todos los campos.';
      return;
    }

    try {
      const usuarioFirebase = await this.authService.login(
        this.usuario,
        this.password
      );

      // 🌟 OBTENER Y GUARDAR ROL: Recuperamos el rol desde tu servicio Auth
      const rolAsignado = await this.authService.getRol();
      
      // Guardamos la información indispensable en el localStorage para las citas
      localStorage.setItem('rolUsuario', rolAsignado ?? 'Paciente');
      localStorage.setItem('uidUsuario', usuarioFirebase.user.uid);
      
      // Limpiamos el correo para usar la primera parte como nombre provisional en la agenda
      const nombreProvisional = usuarioFirebase.user.email?.split('@')[0] || 'Paciente';
      localStorage.setItem('nombreUsuario', nombreProvisional);

      this.resultado = '✅ Bienvenido ' + usuarioFirebase.user.email;
      this.intentos = 0; // Reseteamos intentos al entrar con éxito

      console.log('1. Login en Firebase exitoso. Rol guardado:', rolAsignado);

      // 🎯 EL TOQUE FINAL: El Admin/Recepcionista va al panel, el Paciente directo a completar sus datos
      const rutaDestino = (rolAsignado === 'Paciente') ? '/paciente-registro' : '/panel';

      this.router.navigate([rutaDestino]).then((nav_exito) => {
        console.log(`2. ¿Angular pudo navegar a ${rutaDestino}?:`, nav_exito);
      }).catch(err => {
        console.error('3. Error crítico al navegar:', err);
      });

    } catch (error: any) {
      this.intentos++;
      this.resultado = '❌ Usuario o contraseña incorrectos';
      this.verificarBloqueo();
    }
  }

  // 🔒 Validar fortaleza de contraseña
  validarPassword() {
    let password = this.password;

    if (!password) {
      this.resultado = '';
      return;
    }

    let tieneMayusculas = /[A-Z]/.test(password);
    let tieneNumero = /[0-9]/.test(password);
    let tieneEspecial = /[@$!%*?&.#]/.test(password);

    if (
      password.length >= 8 &&
      tieneMayusculas &&
      tieneNumero &&
      tieneEspecial
    ) {
      this.resultado = '✔ Contraseña Segura';
    } 
    else if (
      password.length >= 6 &&
      tieneMayusculas &&
      tieneNumero
    ) {
      this.resultado = '⚠ Contraseña Media';
    } 
    else {
      this.resultado = `✘ Contraseña Insegura <br>
      Requisitos:<br>
      - 8 caracteres mínimo<br>
      - 1 mayúscula<br>
      - 1 número<br>
      - 1 símbolo`;
    }
  }

  // 🔒 Control centralizado del bloqueo por intentos masivos
  private verificarBloqueo() {
    if (this.intentos >= 3) {
      this.bloqueado = true;
      this.resultado = '🔒 Sistema bloqueado por 10 segundos debido a intentos fallidos.';

      setTimeout(() => {
        this.bloqueado = false;
        this.intentos = 0;
        this.resultado = 'Sistema desbloqueado. Inténtalo de nuevo.';
      }, 10000);
    }
  }

  // 🔑 Generar contraseña automática
  generarPassword() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&.#';
    let password = '';

    for (let i = 0; i < 12; i++) {
      password += caracteres.charAt(
        Math.floor(Math.random() * caracteres.length)
      );
    }

    this.generada = password;
    this.password = password; 
    this.validarPassword();
  }

  // 👤 Crear cuenta (Modificado para Redirección al formulario exclusivo del Paciente)
  async crearCuenta() {
    if (!this.usuario || !this.password) {
      this.resultado = '⚠️ Captura correo y contraseña';
      return;
    }

    try {
      // 1. Registramos al nuevo usuario en Firebase Auth
      const credenciales = await this.authService.register(
        this.usuario,
        this.password
      );

      // 2. 🌟 SESIÓN AUTOMÁTICA: Guardamos sus credenciales de Paciente directo en localStorage
      localStorage.setItem('rolUsuario', 'Paciente');
      localStorage.setItem('uidUsuario', credenciales.user.uid);
      
      // Usamos el nick del correo electrónico como su nombre para mostrar en la cita
      const nombrePaciente = this.usuario.split('@')[0];
      localStorage.setItem('nombreUsuario', nombrePaciente);

      this.resultado = '✅ Cuenta creada correctamente. Redirigiendo a tu perfil...';
      
      // 3. 🎯 EL TOQUE FINAL: Lo mandamos directo al formulario para que ingrese sus datos personales
      setTimeout(() => {
        this.router.navigate(['/paciente-registro']);
      }, 1500);

    } catch (error: any) {
      this.resultado = '❌ Error: ' + this.traducirErrorFirebase(error.code);
    }
  }

  // 📧 Recuperar contraseña
  async recuperarPassword() {
    if (!this.usuario) {
      this.resultado = '⚠️ Captura tu correo electrónico en el campo superior';
      return;
    }

    try {
      await this.authService.resetPassword(this.usuario);
      this.resultado = '📧 Correo de recuperación enviado';
    } catch (error: any) {
      this.resultado = '❌ Error: ' + this.traducirErrorFirebase(error.code);
    }
  }

  // 🔄 Mapeador para cambiar los feos errores en inglés de Firebase a español limpio
  private traducirErrorFirebase(authCode: string): string {
    switch (authCode) {
      case 'auth/email-already-in-use':
        return 'Este correo ya está registrado.';
      case 'auth/invalid-email':
        return 'El formato del correo no es válido.';
      case 'auth/weak-password':
        return 'La contraseña es demasiado débil.';
      case 'auth/user-not-found':
        return 'No existe ningún usuario con este correo.';
      default:
        return 'Ocurrió un problema inesperado. Inténtalo más tarde.';
    }
  }
}
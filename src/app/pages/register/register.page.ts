import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  mailOutline, 
  lockClosedOutline, 
  eyeOutline, 
  eyeOffOutline, 
  keyOutline, 
  arrowBackOutline 
} from 'ionicons/icons';

// Componentes standalone de Ionic
import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
  ]
})
export class RegisterPage {

  email: string = '';
  password: string = '';
  mostrarPassword: boolean = false;

  resultado: string = '';
  resultadoOk: boolean = false;

  // ---- ÍCONOS SVG ----
  private readonly icoOk =
    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>';

  private readonly icoWarn =
    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/></svg>';

  private readonly icoError =
    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Registramos los íconos de Ionic que usamos en la vista
    addIcons({
      'mail-outline': mailOutline,
      'lock-closed-outline': lockClosedOutline,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
      'key-outline': keyOutline,
      'arrow-back-outline': arrowBackOutline,
    });
  }

  // Alternar el estado de ver/ocultar contraseña
  toggleMostrarPassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  // Generador de contraseña segura aleatoria
  generarPasswordSegura() {
    const mayusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const minusculas = 'abcdefghijklmnopqrstuvwxyz';
    const numeros = '0123456789';
    const simbolos = '@$!%*?&.#';
    
    let contrasena = '';

    // Asegurar que contenga mínimo uno de cada requisito
    contrasena += mayusculas.charAt(Math.floor(Math.random() * mayusculas.length));
    contrasena += minusculas.charAt(Math.floor(Math.random() * minusculas.length));
    contrasena += numeros.charAt(Math.floor(Math.random() * numeros.length));
    contrasena += simbolos.charAt(Math.floor(Math.random() * simbolos.length));

    // Rellenar hasta tener una longitud de 10 caracteres
    const todosLosCaracteres = mayusculas + minusculas + numeros + simbolos;
    for (let i = 0; i < 6; i++) {
      contrasena += todosLosCaracteres.charAt(Math.floor(Math.random() * todosLosCaracteres.length));
    }

    // Mezclar la cadena generada para mayor aleatoriedad
    this.password = contrasena.split('').sort(() => 0.5 - Math.random()).join('');
    
    // Forzar a mostrar la contraseña para que el usuario la pueda ver y copiar
    this.mostrarPassword = true;
    this.validarPassword();
  }

  // Validador visual en tiempo real
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
      this.resultadoOk = true;
      this.resultado = this.icoOk + ' Contraseña Segura';
    } 
    else if (
      password.length >= 6 &&
      tieneMayusculas &&
      tieneNumero
    ) {
      this.resultadoOk = false;
      this.resultado = this.icoWarn + ' Contraseña Media';
    } 
    else {
      this.resultadoOk = false;
      this.resultado = this.icoError + ` Contraseña Insegura <br>
      Requisitos:<br>
      - 8 caracteres mínimo<br>
      - 1 mayúscula<br>
      - 1 número<br>
      - 1 símbolo`;
    }
  }

  // Registro del nuevo usuario conectado a tu AuthService
  async registrarUsuario() {
    if (!this.email || !this.password) {
      this.resultadoOk = false;
      this.resultado = this.icoWarn + ' Por favor, llena todos los campos.';
      return;
    }

    // Validación de seguridad de la contraseña antes de registrar
    let tieneMayusculas = /[A-Z]/.test(this.password);
    let tieneNumero = /[0-9]/.test(this.password);
    let tieneEspecial = /[@$!%*?&.#]/.test(this.password);

    if (this.password.length < 8 || !tieneMayusculas || !tieneNumero || !tieneEspecial) {
      this.resultadoOk = false;
      this.resultado = this.icoError + ' Tu contraseña debe cumplir con los requisitos mínimos de seguridad.';
      return;
    }

    try {
      // Intento de registrar en Firebase Auth
      await this.authService.register(this.email, this.password);
      
      this.resultadoOk = true;
      this.resultado = this.icoOk + ' ¡Cuenta creada con éxito!';
      
      // Esperamos 1.5 segundos para que el usuario vea el mensaje y lo redirigimos
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1500);

    } catch (error: any) {
      this.resultadoOk = false;
      this.resultado = this.icoError + ' Error: ' + this.traducirErrorFirebase(error.code);
    }
  }

  // Traductor de errores comunes de Firebase
  private traducirErrorFirebase(authCode: string): string {
    switch (authCode) {
      case 'auth/email-already-in-use':
        return 'Este correo ya se encuentra registrado.';
      case 'auth/invalid-email':
        return 'El formato del correo electrónico no es válido.';
      case 'auth/weak-password':
        return 'La contraseña seleccionada es muy débil.';
      default:
        return 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
    }
  }
}
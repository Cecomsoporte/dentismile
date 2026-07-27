import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { refreshOutline } from 'ionicons/icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'; // 👈 1. Importación de DomSanitizer

// Componentes standalone de Ionic
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
    RouterLink,
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
export class LoginPage implements AfterViewInit, OnDestroy {

  @ViewChild('captchaCanvas', { static: false })
  captchaCanvas!: ElementRef<HTMLCanvasElement>;

  usuario: string = '';
  password: string = '';
  
  // 👈 2. Cambiamos el tipo de resultado a SafeHtml | string
  resultado: SafeHtml | string = '';
  resultadoOk: boolean = false;

  intentos = 0;
  bloqueado = false;

  // ---- CAPTCHA ----
  codigoGenerado: string = '';
  codigoIngresado: string = '';

  private readonly captchaExpiraSegundos = 90;
  private captchaTimer: any;

  // ---- ÍCONOS SVG ----
  private readonly icoOk =
    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>';

  private readonly icoWarn =
    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/></svg>';

  private readonly icoError =
    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>';

  private readonly icoLock =
    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11"/></svg>';

  private readonly icoMail =
    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>';

  constructor(
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer // 👈 3. Inyección de DomSanitizer en el constructor
  ) {
    addIcons({
      'refresh-outline': refreshOutline,
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.generarCaptcha(), 50);
  }

  ngOnDestroy(): void {
    if (this.captchaTimer) {
      clearTimeout(this.captchaTimer);
    }
  }

  // 🛡️ Método auxiliar para marcar el contenido HTML/SVG como seguro
  private setMensajeSeguro(htmlString: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(htmlString);
  }

  // 🖼️ Generador de Captcha seguro
  generarCaptcha(): void {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo = '';

    for (let i = 0; i < 5; i++) {
      codigo += caracteres.charAt(
        Math.floor(Math.random() * caracteres.length)
      );
    }

    this.codigoGenerado = codigo;
    this.codigoIngresado = '';

    const canvas = this.captchaCanvas?.nativeElement;
    if (!canvas) {
      return;
    }

    const anchoCss = canvas.clientWidth || 280;
    const altoCss = 64;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = anchoCss * dpr;
    canvas.height = altoCss * dpr;
    canvas.style.width = anchoCss + 'px';
    canvas.style.height = altoCss + 'px';

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.scale(dpr, dpr);

    const ancho = anchoCss;
    const alto = altoCss;

    const fondo = ctx.createLinearGradient(0, 0, ancho, alto);
    fondo.addColorStop(0, '#e8f2fb');
    fondo.addColorStop(1, '#dbeafe');
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, ancho, alto);

    // Líneas de interferencia
    for (let i = 0; i < 6; i++) {
      const red = 20 + Math.floor(Math.random() * 100);
      const green = 80 + Math.floor(Math.random() * 80);
      const blue = 150 + Math.floor(Math.random() * 80);
      ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.35)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * ancho, Math.random() * alto);
      ctx.lineTo(Math.random() * ancho, Math.random() * alto);
      ctx.stroke();
    }

    // Puntos de ruido
    for (let i = 0; i < 50; i++) {
      const red = 20 + Math.floor(Math.random() * 100);
      const green = 80 + Math.floor(Math.random() * 80);
      const blue = 150 + Math.floor(Math.random() * 80);
      ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.4)`;
      ctx.beginPath();
      ctx.arc(Math.random() * ancho, Math.random() * alto, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dibujar caracteres aleatorios con rotación
    const espacio = ancho / (codigo.length + 1);

    for (let i = 0; i < codigo.length; i++) {
      const letra = codigo[i];
      const x = espacio * (i + 1);
      const y = alto / 2 + (Math.random() * 10 - 5);
      const angulo = (Math.random() * 30 - 15) * (Math.PI / 180);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angulo);

      const tamañoLetra = 28 + Math.floor(Math.random() * 6);
      ctx.font = `bold ${tamañoLetra}px Arial`;

      const colorRed = 2 + Math.floor(Math.random() * 20);
      const colorGreen = 100 + Math.floor(Math.random() * 40);
      const colorBlue = 170 + Math.floor(Math.random() * 40);
      ctx.fillStyle = `rgb(${colorRed}, ${colorGreen}, ${colorBlue})`;
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letra, 0, 0);

      ctx.restore();
    }

    if (this.captchaTimer) {
      clearTimeout(this.captchaTimer);
    }

    this.captchaTimer = setTimeout(() => {
      this.generarCaptcha();
    }, this.captchaExpiraSegundos * 1000);
  }

  // 🔐 Iniciar sesión vinculada a Firebase
  async iniciarSesion() {
    if (this.bloqueado) {
      this.resultadoOk = false;
      this.resultado = this.setMensajeSeguro(this.icoLock + ' El sistema sigue bloqueado. Espera un momento.');
      return;
    }

    if (!this.usuario || !this.password) {
      this.resultadoOk = false;
      this.resultado = this.setMensajeSeguro(this.icoWarn + ' Por favor, llena todos los campos.');
      return;
    }

    if (!this.codigoIngresado) {
      this.resultadoOk = false;
      this.resultado = this.setMensajeSeguro(this.icoWarn + ' Ingresa el código de la imagen.');
      return;
    }

    if (this.codigoIngresado.toUpperCase() !== this.codigoGenerado) {
      this.resultadoOk = false;
      this.resultado = this.setMensajeSeguro(this.icoError + ' El código de seguridad no es correcto.');
      this.generarCaptcha();
      return;
    }

    try {
      const usuarioFirebase = await this.authService.login(
        this.usuario,
        this.password
      );

      const rolAsignado = await this.authService.getRol();
      
      localStorage.setItem('rolUsuario', rolAsignado ?? 'Paciente');
      localStorage.setItem('uidUsuario', usuarioFirebase.user.uid);
      
      const nombreProvisional = usuarioFirebase.user.email?.split('@')[0] || 'Paciente';
      localStorage.setItem('nombreUsuario', nombreProvisional);

      this.resultadoOk = true;
      this.resultado = this.setMensajeSeguro(this.icoOk + ' Bienvenido ' + usuarioFirebase.user.email);
      this.intentos = 0; 

      console.log('Login exitoso. Rol:', rolAsignado);

      const rutaDestino = (rolAsignado === 'Paciente') ? '/paciente-registro' : '/panel';
      this.router.navigate([rutaDestino]);

    } catch (error: any) {
      this.intentos++;
      this.resultadoOk = false;
      this.resultado = this.setMensajeSeguro(this.icoError + ' Usuario o contraseña incorrectos');
      this.generarCaptcha();
      this.verificarBloqueo();
    }
  }

  // 🔒 Validador dinámico de fortaleza de contraseña
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
      this.resultado = this.setMensajeSeguro(this.icoOk + ' Contraseña Segura');
    } 
    else if (
      password.length >= 6 &&
      tieneMayusculas &&
      tieneNumero
    ) {
      this.resultadoOk = false;
      this.resultado = this.setMensajeSeguro(this.icoWarn + ' Contraseña Media');
    } 
    else {
      this.resultadoOk = false;
      this.resultado = this.setMensajeSeguro(
        this.icoError + ` Contraseña Insegura <br>
        Requisitos:<br>
        - 8 caracteres mínimo<br>
        - 1 mayúscula<br>
        - 1 número<br>
        - 1 símbolo`
      );
    }
  }

  private verificarBloqueo() {
    if (this.intentos >= 3) {
      this.bloqueado = true;
      this.resultadoOk = false;
      this.resultado = this.setMensajeSeguro(this.icoLock + ' Sistema bloqueado por 10 segundos debido a intentos fallidos.');

      setTimeout(() => {
        this.bloqueado = false;
        this.intentos = 0;
        this.resultado = 'Sistema desbloqueado. Inténtalo de nuevo.';
      }, 10000);
    }
  }

  async recuperarPassword() {
    if (!this.usuario) {
      this.resultadoOk = false;
      this.resultado = this.setMensajeSeguro(this.icoWarn + ' Captura tu correo electrónico en el campo superior');
      return;
    }

    try {
      await this.authService.resetPassword(this.usuario);
      this.resultadoOk = true;
      this.resultado = this.setMensajeSeguro(this.icoMail + ' Correo de recuperación enviado');
    } catch (error: any) {
      this.resultadoOk = false;
      this.resultado = this.setMensajeSeguro(this.icoError + ' Error: ' + this.traducirErrorFirebase(error.code));
    }
  }

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
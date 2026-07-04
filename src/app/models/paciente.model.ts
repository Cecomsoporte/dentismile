export interface Paciente {
  id?: string;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  fechaNacimiento: string;
  antecedentes?: string;
  fechaRegistro?: any;
  rol: 'Paciente';
  perfilCompleto: boolean;

}
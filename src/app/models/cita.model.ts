export interface Cita {
  id?: string;             // ID único del documento en Firestore
  pacienteId: string;      // ID del paciente
  nombrePaciente: string;  // Nombre para mostrar en la agenda
  nombreDoctor: string;
  doctorId: string;        // ID del médico asignado
  fecha: string;           // Fecha de la cita (YYYY-MM-DD)
  hora?: string;    // Hora de la cita (HH:MM)
          
  horaInicio: string;
  horaFin : string;
  motivoConsulta:  string;
  fechaRegistro: string; //
  // Campo clave de estado con los valores permitidos:
  estado: 'Pendiente' | 'Confirmada' | 'En progreso' | 'Completada' | 'Cancelada';
  
  // Campos clínicos opcionales (se llenan al finalizar)
  diagnostico?: string;
  tratamiento?: string;
  costo?: number;
  fechaTermino?: string;
}
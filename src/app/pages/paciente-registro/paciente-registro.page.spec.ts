import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PacienteRegistroPage } from './paciente-registro.page';

describe('PacienteRegistroPage', () => {
  let component: PacienteRegistroPage;
  let fixture: ComponentFixture<PacienteRegistroPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PacienteRegistroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

export class AdmissionRequiredError extends Error {
  constructor() {
    super('admission_required');
    this.name = 'AdmissionRequiredError';
  }
}

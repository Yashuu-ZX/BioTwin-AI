class MockDB {
  constructor() {
    this.patients = new Map();
  }

  addPatient(patient) {
    this.patients.set(patient.id, patient);
    return patient;
  }

  getPatient(id) {
    return this.patients.get(id);
  }

  getAllPatients() {
    return Array.from(this.patients.values());
  }

  updatePatient(id, data) {
    if (this.patients.has(id)) {
      const patient = { ...this.patients.get(id), ...data };
      this.patients.set(id, patient);
      return patient;
    }
    return null;
  }
}

module.exports = new MockDB();

class MockDB {
  constructor() {
    this.patients = new Map();
    this.simulations = new Map();
    this.wearables = new Map();
  }

  addPatient(patient) {
    const keys = [patient.id, patient.patientId].filter(Boolean);
    keys.forEach((key) => this.patients.set(key, patient));
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
      this.addPatient(patient);
      return patient;
    }
    return null;
  }

  addSimulation(patientId, simulation) {
    const history = this.simulations.get(patientId) || [];
    history.unshift(simulation);
    this.simulations.set(patientId, history.slice(0, 20));
    return simulation;
  }

  getSimulations(patientId) {
    return this.simulations.get(patientId) || [];
  }

  addWearableEvent(deviceId, payload) {
    const history = this.wearables.get(deviceId) || [];
    history.unshift(payload);
    this.wearables.set(deviceId, history.slice(0, 30));
    return payload;
  }

  getWearableEvents(deviceId) {
    return this.wearables.get(deviceId) || [];
  }
}

module.exports = new MockDB();

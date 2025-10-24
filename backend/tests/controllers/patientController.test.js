// tests/controllers/patientController.test.js

// ---- Inline Mocks (ESM-friendly) ----
jest.mock('../../src/models/Patient.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(() => ({ select: jest.fn().mockResolvedValue([]) })),
    findById: jest.fn()
  }
}));

jest.mock('../../src/models/Appointment.js', () => ({
  __esModule: true,
  default: {}
}));

jest.mock('../../src/models/Doctor.js', () => ({
  __esModule: true,
  default: {}
}));

jest.mock('qrcode', () => ({
  __esModule: true,
  default: {
    toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,QR==')
  },
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,QR==')
}));

import Patient from '../../src/models/Patient.js';
import QRCode, { toDataURL as toDataURLNamed } from 'qrcode';

import {
  registerPatient,
  recordConsultation,
  getPatientById,
  getDoctorPatients,
  updatePatient
} from '../../src/controllers/patientController.js';

// ---- tiny req/res helpers ----
const mockReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: { _id: 'doctor_user_1' },
  ...overrides
});

const mockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.headersSent = false;
  res.status = jest.fn((c) => { res.statusCode = c; return res; });
  res.json = jest.fn((d) => { res.body = d; return res; });
  return res;
};

// ---- helpers to make fake "mongoose-like" docs ----
const fakePatientDoc = (overrides = {}) => {
  const doc = {
    _id: 'p1',
    name: 'Alice',
    email: 'a@example.com',
    phone: '0771234567',
    address: 'x',
    dateOfBirth: '1999-01-01',
    bloodType: 'A+',
    allergies: [],
    healthCardQR: null,
    records: [],
    toObject: function () { return { ...this }; },
    save: jest.fn(), // set below to resolve to doc
    ...overrides
  };
  if (!overrides.save) {
    doc.save.mockResolvedValue(doc); // ✅ return the mutated doc by default
  }
  return doc;
};

describe('patientController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- registerPatient ----------------
  describe('registerPatient', () => {
    it('returns 200 review when patient already exists (by email/phone)', async () => {
      const existing = fakePatientDoc();
      Patient.findOne.mockResolvedValueOnce(existing);

      const req = mockReq({
        body: { name: 'A', email: 'a@example.com', phone: '077', address: 'x' }
      });
      const res = mockRes();

      await registerPatient(req, res);

      expect(Patient.findOne).toHaveBeenCalledWith({ $or: [{ email: 'a@example.com' }, { phone: '077' }] });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Patient already exists', action: 'review', patient: existing })
      );
    });

    it('creates patient, parses allergies, generates QR, and saves (201)', async () => {
      Patient.findOne.mockResolvedValueOnce(null);

      const created = fakePatientDoc({ save: jest.fn().mockResolvedValue(true) });
      Patient.create.mockResolvedValueOnce(created);

      const req = mockReq({
        body: {
          name: 'New P',
          email: 'n@example.com',
          phone: '0701112222',
          address: 'Y',
          dateOfBirth: '2000-02-02',
          bloodType: 'B-',
          allergies: 'dust,   peanuts , , '
        }
      });
      const res = mockRes();

      await registerPatient(req, res);

      expect(Patient.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New P',
        email: 'n@example.com',
        phone: '0701112222',
        address: 'Y',
        dateOfBirth: '2000-02-02',
        bloodType: 'B-',
        allergies: ['dust', 'peanuts'],
        user: null
      }));

      // QR code called with patient id
      expect(QRCode.toDataURL || toDataURLNamed).toBeDefined();
      expect(QRCode.toDataURL).toHaveBeenCalledWith(`patient:${created._id}`);

      // patient updated and saved with QR
      expect(created.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Patient registered and QR generated'
        })
      );
    });
  });

  // ---------------- recordConsultation ----------------
  describe('recordConsultation', () => {
    it('404 if patient not found', async () => {
      Patient.findById.mockResolvedValueOnce(null);

      const req = mockReq({ params: { id: 'p404' }, body: {} });
      const res = mockRes();

      await recordConsultation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Patient not found' });
    });

    it('adds consultation with string inputs and saves', async () => {
      const p = fakePatientDoc();
      Patient.findById.mockResolvedValueOnce(p);

      const req = mockReq({
        params: { id: 'p1' },
        body: {
          diagnosis: 'flu, fever ,  ',
          treatment: 'rest,   water',
          medications: 'paracetamol:500mg, vitaminC:1000mg',
          followUpDate: '2025-11-01'
        }
      });
      const res = mockRes();

      await recordConsultation(req, res);

      expect(p.records.length).toBe(1);
      const rec = p.records[0];
      expect(rec.diagnosis).toEqual(['flu', 'fever']);
      expect(rec.treatment).toEqual(['rest', 'water']);
      expect(rec.medications).toEqual([
        { name: 'paracetamol', dosage: '500mg' },
        { name: 'vitaminC', dosage: '1000mg' }
      ]);
      expect(rec.followUpDate).toBe('2025-11-01');
      expect(p.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Consultation recorded successfully' })
      );
    });

    it('adds consultation with array inputs and saves', async () => {
      const p = fakePatientDoc();
      Patient.findById.mockResolvedValueOnce(p);

      const req = mockReq({
        params: { id: 'p1' },
        body: {
          diagnosis: ['   cold', ' ', 'headache'],
          treatment: ['sleep', ' hydration '],
          medications: [{ name: 'ibuprofen', dosage: '200mg' }, { name: '  ', dosage: '' }],
          followUpDate: null
        }
      });
      const res = mockRes();

      await recordConsultation(req, res);

      const rec = p.records[0];
      expect(rec.diagnosis).toEqual(['cold', 'headache']);      // ✅ now trimmed
      expect(rec.treatment).toEqual(['sleep', 'hydration']);    // ✅ now trimmed
      expect(rec.medications).toEqual([{ name: 'ibuprofen', dosage: '200mg' }]);
      expect(p.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Consultation recorded successfully' })
      );
    });
  });

  // ---------------- getPatientById ----------------
  describe('getPatientById', () => {
    it('404 when not found', async () => {
      Patient.findById.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(null)
      });

      const req = mockReq({ params: { id: 'p404' } });
      const res = mockRes();

      await getPatientById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Patient not found' });
    });

    it('200 when found', async () => {
      const doc = fakePatientDoc();
      Patient.findById.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(doc)
      });

      const req = mockReq({ params: { id: 'p1' } });
      const res = mockRes();

      await getPatientById(req, res);

      expect(res.json).toHaveBeenCalledWith(doc);
    });
  });

  // ---------------- getDoctorPatients ----------------
  describe('getDoctorPatients', () => {
    it('returns list with search filter', async () => {
      const list = [{ _id: 'p1' }];
      Patient.find.mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(list)
      });

      const req = mockReq({ query: { search: 'ali' } });
      const res = mockRes();

      await getDoctorPatients(req, res);

      expect(Patient.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'ali', $options: 'i' } },
          { email: { $regex: 'ali', $options: 'i' } }
        ]
      });
      expect(res.json).toHaveBeenCalledWith(list);
    });

    it('returns list without search', async () => {
      const list = [{ _id: 'p2' }];
      Patient.find.mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(list)
      });

      const req = mockReq({ query: {} });
      const res = mockRes();

      await getDoctorPatients(req, res);

      expect(Patient.find).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith(list);
    });
  });

  // ---------------- updatePatient ----------------
  describe('updatePatient', () => {
    it('404 when patient not found', async () => {
      Patient.findById.mockResolvedValueOnce(null);

      const req = mockReq({ params: { id: 'p404' }, body: {} });
      const res = mockRes();

      await updatePatient(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Patient not found' });
    });

    it('updates fields incl. allergies parsing and saves', async () => {
      const p = fakePatientDoc(); // save resolves to p (doc)
      Patient.findById.mockResolvedValueOnce(p);

      const req = mockReq({
        params: { id: 'p1' },
        body: {
          name: 'Bob',
          email: 'b@example.com',
          phone: '0712345678',
          address: 'New Addr',
          dateOfBirth: '2001-01-01',
          bloodType: 'O+',
          allergies: ' pollen ,  ,cats '
        }
      });
      const res = mockRes();

      await updatePatient(req, res);

      expect(p.name).toBe('Bob');
      expect(p.email).toBe('b@example.com');
      expect(p.phone).toBe('0712345678');
      expect(p.address).toBe('New Addr');
      expect(p.dateOfBirth).toBe('2001-01-01');
      expect(p.bloodType).toBe('O+');
      expect(p.allergies).toEqual(['pollen', 'cats']);
      expect(p.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(p); // ✅ now save() returns the doc
    });
  });
});

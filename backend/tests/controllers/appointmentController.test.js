// tests/controllers/appointmentController.test.js

// ---- Inline Mocks for models + Stripe ----
jest.mock('../../src/models/Doctor.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(() => ({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      })
    })),
    findById: jest.fn()
  }
}));

jest.mock('../../src/models/Patient.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('../../src/models/Appointment.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(() => {
      const sort = jest.fn().mockResolvedValue([]);
      const populate2 = jest.fn().mockReturnValue({ sort });
      const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
      return { populate: populate1 };
    }),
    findById: jest.fn(),
    create: jest.fn()
  }
}));

// Stripe is a constructor function. Mock it to return an object with paymentIntents.create
jest.mock('stripe', () => {
  const instance = {
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: 'pi_mock' })
    }
  };
  const StripeCtor = jest.fn(() => instance);
  StripeCtor.__instance = instance; // handy handle if needed
  return {
    __esModule: true,
    default: StripeCtor
  };
});

import Doctor from '../../src/models/Doctor.js';
import Patient from '../../src/models/Patient.js';
import Appointment from '../../src/models/Appointment.js';
import Stripe from 'stripe';

import {
  searchDoctors,
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  cancelAppointment
} from '../../src/controllers/appointmentController.js';

// ---- tiny req/res helpers ----
const mockReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: { _id: 'u1', name: 'Pat One', email: 'pat@example.com' },
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

// ---- helpers to build fake docs ----
const fakeDoctor = (overrides = {}) => {
  const doc = {
    _id: 'd1',
    hospital: overrides.hospital ?? { type: 'public' },
    availability: overrides.availability ?? [],
    populate: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(true),
    ...overrides
  };
  // default: populate resolves to doc itself
  if (!overrides.populate) {
    doc.populate.mockResolvedValue(doc);
  }
  return doc;
};

const fakePatient = (overrides = {}) => ({
  _id: 'p1',
  name: 'Pat One',
  email: 'pat@example.com',
  user: 'u1',
  ...overrides
});

const fakeAppointment = (overrides = {}) => ({
  _id: 'a1',
  toObject: function () { return { ...this }; },
  patient: 'p1',
  doctor: 'd1',
  date: new Date('2025-10-05T00:00:00Z'),
  timeSlot: { start: new Date('2025-10-05T08:00:00Z'), end: new Date('2025-10-05T09:00:00Z') },
  status: 'booked',
  save: jest.fn().mockResolvedValue(true),
  ...overrides
});

describe('appointmentController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- searchDoctors ----------------
  describe('searchDoctors', () => {
    it('applies filters (hospitalType + name + specialization)', async () => {
      const result = [{ _id: 'd1' }];
      Doctor.find.mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValueOnce(result)
        })
      });

      const req = mockReq({ query: { hospitalType: 'private', name: 'sam', specialization: 'Cardio' } });
      const res = mockRes();

      await searchDoctors(req, res);

      expect(Doctor.find).toHaveBeenCalledWith(expect.objectContaining({
        "hospital.type": "private",
        $or: [
          { name: { $regex: 'sam', $options: 'i' } },
          { specialization: { $regex: 'sam', $options: 'i' } }
        ],
        specialization: 'Cardio'
      }));
      expect(res.json).toHaveBeenCalledWith(result);
    });
  });

  // ---------------- getAvailableSlots ----------------
  describe('getAvailableSlots', () => {
    it('404 when doctor not found', async () => {
      Doctor.findById.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(null)
      });
      const req = mockReq({ params: { doctorId: 'd404' } });
      const res = mockRes();

      await getAvailableSlots(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Doctor not found' });
    });

    it('returns slots for given date', async () => {
      const targetDate = new Date('2025-10-10T00:00:00Z');
      const doc = fakeDoctor({
        hospital: { type: 'public' },
        availability: [
          {
            date: targetDate,
            timeSlots: [
              { start: new Date('2025-10-10T08:00:00Z'), end: new Date('2025-10-10T09:00:00Z'), isBooked: false },
              { start: new Date('2025-10-10T09:00:00Z'), end: new Date('2025-10-10T10:00:00Z'), isBooked: true }
            ]
          }
        ]
      });
      Doctor.findById.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(doc)
      });

      const req = mockReq({ params: { doctorId: 'd1' }, query: { date: '2025-10-10T00:00:00Z' } });
      const res = mockRes();

      await getAvailableSlots(req, res);

      expect(res.json).toHaveBeenCalledWith({
        hospitalType: 'public',
        slots: [{ start: new Date('2025-10-10T08:00:00Z'), end: new Date('2025-10-10T09:00:00Z'), isBooked: false }]
      });
    });

    it('returns future unbooked slots when no date', async () => {
      const now = new Date();
      const later = new Date(now.getTime() + 24 * 3600 * 1000);
      const doc = fakeDoctor({
        hospital: { type: 'public' },
        availability: [
          { date: new Date(now.getTime() - 24 * 3600 * 1000), timeSlots: [] }, // past
          { date: later, timeSlots: [{ start: new Date(later), end: new Date(later.getTime() + 3600000), isBooked: false }] }
        ]
      });
      Doctor.findById.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(doc)
      });

      const req = mockReq({ params: { doctorId: 'd1' } });
      const res = mockRes();

      await getAvailableSlots(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          hospitalType: 'public',
          slots: [expect.objectContaining({ isBooked: false, date: doc.availability[1].date })]
        })
      );
    });
  });

  // ---------------- bookAppointment ----------------
  describe('bookAppointment', () => {
    it('404 doctor not found', async () => {
      Patient.findOne.mockResolvedValueOnce(fakePatient());
      Doctor.findById.mockResolvedValueOnce(null);

      const req = mockReq({ body: { doctorId: 'd404', slot: {} } });
      const res = mockRes();

      await bookAppointment(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Doctor not found' });
    });

    it('400 no availability on date', async () => {
      Patient.findOne.mockResolvedValueOnce(fakePatient());
      const doc = fakeDoctor({ hospital: { type: 'public' }, availability: [] });
      Doctor.findById.mockResolvedValueOnce(doc);

      const req = mockReq({
        body: { doctorId: 'd1', slot: { date: '2025-10-10T00:00:00Z', start: '2025-10-10T08:00:00Z', end: '2025-10-10T09:00:00Z' } }
      });
      const res = mockRes();

      await bookAppointment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'No availability for this date' });
    });

    it('400 slot unavailable', async () => {
      Patient.findOne.mockResolvedValueOnce(fakePatient());
      const date = new Date('2025-10-10T00:00:00Z');
      const doc = fakeDoctor({
        hospital: { type: 'public' },
        availability: [{ date, timeSlots: [{ start: new Date('2025-10-10T08:00:00Z'), end: new Date('2025-10-10T09:00:00Z'), isBooked: true }] }]
      });
      Doctor.findById.mockResolvedValueOnce(doc);

      const req = mockReq({
        body: { doctorId: 'd1', slot: { date: '2025-10-10T00:00:00Z', start: '2025-10-10T08:00:00Z', end: '2025-10-10T09:00:00Z' } }
      });
      const res = mockRes();

      await bookAppointment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Slot unavailable' });
    });

    it('creates patient if not exists and books in PUBLIC hospital (no payment)', async () => {
      Patient.findOne.mockResolvedValueOnce(null);
      const createdPat = fakePatient();
      Patient.create.mockResolvedValueOnce(createdPat);

      const date = new Date('2025-10-10T00:00:00Z');
      const slot = { start: new Date('2025-10-10T08:00:00Z'), end: new Date('2025-10-10T09:00:00Z'), isBooked: false };
      const doc = fakeDoctor({
        hospital: { type: 'public' },
        availability: [{ date, timeSlots: [ { ...slot } ] }]
      });
      Doctor.findById.mockResolvedValueOnce(doc);

      const appt = fakeAppointment();
      Appointment.create.mockResolvedValueOnce(appt);

      const req = mockReq({
        body: { doctorId: 'd1', slot: { date: '2025-10-10T00:00:00Z', start: '2025-10-10T08:00:00Z', end: '2025-10-10T09:00:00Z' } }
      });
      const res = mockRes();

      await bookAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Appointment booked successfully',
        qrCode: expect.any(String)
      }));
    });

    it('books in PRIVATE hospital with successful payment', async () => {
      Patient.findOne.mockResolvedValueOnce(fakePatient());

      const date = new Date('2025-10-10T00:00:00Z');
      const slot = { start: new Date('2025-10-10T08:00:00Z'), end: new Date('2025-10-10T09:00:00Z'), isBooked: false };
      const doc = fakeDoctor({
        hospital: { type: 'private' },
        availability: [{ date, timeSlots: [ { ...slot } ] }]
      });
      Doctor.findById.mockResolvedValueOnce(doc);

      const appt = fakeAppointment({ paymentId: 'pi_mock' });
      Appointment.create.mockResolvedValueOnce(appt);

      // Force success path (Math.random > 0.1)
      const randSpy = jest.spyOn(Math, 'random').mockReturnValue(0.2);

      const req = mockReq({
        body: { doctorId: 'd1', slot: { date: '2025-10-10T00:00:00Z', start: '2025-10-10T08:00:00Z', end: '2025-10-10T09:00:00Z' } }
      });
      const res = mockRes();

      await bookAppointment(req, res);

      randSpy.mockRestore();

      // ✅ assert on result, not internal call count (less flaky)
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ paymentId: 'pi_mock' }));
    });

    it('payment failure path returns 400 (PRIVATE)', async () => {
      Patient.findOne.mockResolvedValueOnce(fakePatient());

      const date = new Date('2025-10-10T00:00:00Z');
      const slot = { start: new Date('2025-10-10T08:00:00Z'), end: new Date('2025-10-10T09:00:00Z'), isBooked: false };
      const doc = fakeDoctor({
        hospital: { type: 'private' },
        availability: [{ date, timeSlots: [ { ...slot } ] }]
      });
      Doctor.findById.mockResolvedValueOnce(doc);

      // ✅ Force the failure branch: Math.random() <= 0.1
      const randSpy = jest.spyOn(Math, 'random').mockReturnValue(0.05);

      const req = mockReq({
        body: { doctorId: 'd1', slot: { date: '2025-10-10T00:00:00Z', start: '2025-10-10T08:00:00Z', end: '2025-10-10T09:00:00Z' } }
      });
      const res = mockRes();

      await bookAppointment(req, res);

      randSpy.mockRestore();

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Payment failed' });
    });

    it('payment provider error returns 400 (PRIVATE)', async () => {
      Patient.findOne.mockResolvedValueOnce(fakePatient());

      const date = new Date('2025-10-10T00:00:00Z');
      const slot = { start: new Date('2025-10-10T08:00:00Z'), end: new Date('2025-10-10T09:00:00Z'), isBooked: false };
      const doc = fakeDoctor({
        hospital: { type: 'private' },
        availability: [{ date, timeSlots: [ { ...slot } ] }]
      });
      Doctor.findById.mockResolvedValueOnce(doc);

      // Make Stripe throw
      const stripeInstance = Stripe.mock.results[0]?.value || Stripe.__instance;
      stripeInstance.paymentIntents.create.mockRejectedValueOnce(new Error('boom'));

      const req = mockReq({
        body: { doctorId: 'd1', slot: { date: '2025-10-10T00:00:00Z', start: '2025-10-10T08:00:00Z', end: '2025-10-10T09:00:00Z' } }
      });
      const res = mockRes();

      await bookAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Payment error: boom' });
    });
  });

  // ---------------- getMyAppointments ----------------
  describe('getMyAppointments', () => {
    it('returns populated, sorted appointments', async () => {
      const list = [{ _id: 'a1' }];
      const sort = jest.fn().mockResolvedValueOnce(list);
      const populate2 = jest.fn().mockReturnValue({ sort });
      const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
      Appointment.find.mockReturnValueOnce({ populate: populate1 });

      const req = mockReq({});
      const res = mockRes();

      await getMyAppointments(req, res);

      expect(Appointment.find).toHaveBeenCalledWith({ patient: 'u1' });
      expect(res.json).toHaveBeenCalledWith(list);
    });
  });

  // ---------------- cancelAppointment ----------------
  describe('cancelAppointment', () => {
    it('403 when not authorized', async () => {
      const appt = fakeAppointment({ patient: 'someoneelse' });
      Appointment.findById.mockResolvedValueOnce(appt);

      const req = mockReq({ params: { id: 'a1' } });
      const res = mockRes();

      await cancelAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized' });
    });

    it('cancels and reopens slot', async () => {
      const date = new Date('2025-10-10T00:00:00Z');
      const slotStart = new Date('2025-10-10T08:00:00Z');

      const appt = fakeAppointment({
        patient: 'u1',
        doctor: 'd1',
        date,
        timeSlot: { start: slotStart, end: new Date('2025-10-10T09:00:00Z') }
      });
      Appointment.findById.mockResolvedValueOnce(appt);

      const doc = fakeDoctor({
        availability: [
          {
            date,
            timeSlots: [
              { start: slotStart, end: new Date('2025-10-10T09:00:00Z'), isBooked: true }
            ]
          }
        ]
      });
      Doctor.findById.mockResolvedValueOnce(doc);

      const req = mockReq({ params: { id: 'a1' } });
      const res = mockRes();

      await cancelAppointment(req, res);

      expect(appt.status).toBe('cancelled');
      expect(appt.save).toHaveBeenCalled();
      expect(doc.availability[0].timeSlots[0].isBooked).toBe(false);
      expect(doc.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Appointment cancelled' });
    });
  });
});

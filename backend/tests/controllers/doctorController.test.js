// Inline mocks for models and fs (ESM-friendly)
jest.mock('../../src/models/Doctor.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(() => ({ populate: jest.fn().mockResolvedValue([]) })),
    findById: jest.fn()
  }
}));

jest.mock('../../src/models/Hospital.js', () => ({
  __esModule: true,
  default: {
    findById: jest.fn()
  }
}));

jest.mock('../../src/models/Appointment.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(() => {
      // supports chained populate().populate().then
      const second = jest.fn().mockResolvedValue([]);
      const first = jest.fn().mockReturnValue({ populate: second });
      return { populate: first };
    }),
    findById: jest.fn(),
    deleteMany: jest.fn()
  }
}));

jest.mock('fs', () => ({
  __esModule: true,
  default: { unlink: jest.fn((_, cb) => cb && cb(null)) },
  unlink: jest.fn((_, cb) => cb && cb(null))
}));

import Doctor from '../../src/models/Doctor.js';
import Hospital from '../../src/models/Hospital.js';
import Appointment from '../../src/models/Appointment.js';
import fs from 'fs';

import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  setAvailability,
  getAvailability,
  updateAvailability,
  deleteAvailability,
  getDoctorAppointments,
  updateAppointment
} from '../../src/controllers/doctorController.js';

// --- tiny req/res helpers ---
const mockReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  file: null,
  user: { _id: 'user_123' },
  ...overrides
});
const mockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.headersSent = false;
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json   = jest.fn((data) => { res.body = data; return res; });
  return res;
};

// --- helpers to make fake mongoose docs (with methods) ---
const fakeDoctorDoc = (overrides = {}) => {
  return {
    _id: 'doc_1',
    name: 'DrA',
    image: overrides.image ?? null,
    availability: overrides.availability ?? [],
    hospital: 'h1',
    save: jest.fn().mockResolvedValue(overrides.saveReturns ?? overrides),
    deleteOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    remove: jest.fn().mockResolvedValue({ acknowledged: true }), // legacy fallback, not used
    ...overrides
  };
};

const makeAvail = ({ id = 'a1', date, slots = [], recurrence = 'none' } = {}) => {
  // Mimic mongoose subdoc array helpers id() and pull()
  const arr = [
    {
      _id: id,
      date: date ? new Date(date) : new Date(),
      timeSlots: slots,
      recurrence
    }
  ];
  arr.id = (x) => arr.find(v => v._id === x) || null;
  arr.pull = (query) => {
    const idx = arr.findIndex(v => v._id === query._id);
    if (idx >= 0) arr.splice(idx, 1);
  };
  return arr;
};

describe('doctorController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- existing happy-path tests (kept) ----------
  describe('createDoctor', () => {
    it('returns 400 if hospital is invalid', async () => {
      Hospital.findById.mockResolvedValueOnce(null);
      const req = mockReq({ body: { name: 'Dr A', specialization: 'Cardio', hospitalId: 'h1' } });
      const res = mockRes();

      await createDoctor(req, res);

      expect(Hospital.findById).toHaveBeenCalledWith('h1');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid hospital' });
      expect(Doctor.create).not.toHaveBeenCalled();
    });

    it('returns 400 if doctor already exists', async () => {
      Hospital.findById.mockResolvedValueOnce({ _id: 'h1' });
      Doctor.findOne.mockResolvedValueOnce({ _id: 'd1' });

      const req = mockReq({ body: { name: 'Dr A', specialization: 'Cardio', hospitalId: 'h1' } });
      const res = mockRes();

      await createDoctor(req, res);

      expect(Doctor.findOne).toHaveBeenCalledWith({ name: 'Dr A', specialization: 'Cardio' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Doctor already exists' });
    });

    it('creates doctor (201) with parsed fields and image path', async () => {
      Hospital.findById.mockResolvedValueOnce({ _id: 'h1' });
      Doctor.findOne.mockResolvedValueOnce(null);
      Doctor.create.mockResolvedValueOnce({ _id: 'dNew', name: 'Dr A' });

      const req = mockReq({
        body: {
          name: 'Dr A',
          age: '45',
          qualification: 'MBBS',
          specialization: 'Cardio',
          consultationRate: '1500.50',
          hospitalId: 'h1'
        },
        file: { filename: 'a.png' },
        user: { _id: 'u1' }
      });
      const res = mockRes();

      await createDoctor(req, res);

      expect(Doctor.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Dr A',
        age: 45,
        qualification: 'MBBS',
        specialization: 'Cardio',
        consultationRate: 1500.50,
        hospital: 'h1',
        image: '/uploads/doctors/a.png',
        user: 'u1'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ _id: 'dNew', name: 'Dr A' });
    });

    it('cleans up uploaded file on internal error', async () => {
      Hospital.findById.mockResolvedValueOnce({ _id: 'h1' });
      Doctor.findOne.mockResolvedValueOnce(null);
      Doctor.create.mockRejectedValueOnce(new Error('boom'));

      const req = mockReq({
        body: { name: 'Dr A', specialization: 'Cardio', hospitalId: 'h1' },
        file: { filename: 'a.png', path: '/tmp/a.png' }
      });
      const res = mockRes();

      await createDoctor(req, res);

      expect(fs.unlink).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'boom' });
    });
  });

  describe('getDoctors', () => {
    it('returns list (200) and supports search filter', async () => {
      const mockList = [{ _id: 'd1' }];
      Doctor.find.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockList)
      });

      const req = mockReq({ query: { search: 'car' } });
      const res = mockRes();

      await getDoctors(req, res);

      expect(Doctor.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'car', $options: 'i' } },
          { specialization: { $regex: 'car', $options: 'i' } }
        ]
      });
      expect(res.json).toHaveBeenCalledWith(mockList);
    });

    // extra small test to hit the other branch (hospital + specialization no search)
    it('applies hospital and specialization filters', async () => {
      const mockList = [{ _id: 'd2' }];
      Doctor.find.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockList)
      });
      const req = mockReq({ query: { hospital: 'h1', specialization: 'Cardio' } });
      const res = mockRes();

      await getDoctors(req, res);

      expect(Doctor.find).toHaveBeenCalledWith({ hospital: 'h1', specialization: 'Cardio' });
      expect(res.json).toHaveBeenCalledWith(mockList);
    });
  });

  describe('getDoctorById', () => {
    it('404 when not found', async () => {
      Doctor.findById.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(null)
      });
      const req = mockReq({ params: { id: 'd404' } });
      const res = mockRes();

      await getDoctorById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Doctor not found' });
    });

    it('200 when found', async () => {
      Doctor.findById.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce({ _id: 'd1', name: 'Dr A' })
      });
      const req = mockReq({ params: { id: 'd1' } });
      const res = mockRes();

      await getDoctorById(req, res);

      expect(res.json).toHaveBeenCalledWith({ _id: 'd1', name: 'Dr A' });
    });
  });

  // ---------- NEW TESTS to lift coverage ----------

  describe('updateDoctor', () => {
    it('404 when doctor not found', async () => {
      Doctor.findById.mockResolvedValueOnce(null);
      const req = mockReq({ params: { id: 'd404' }, body: {} });
      const res = mockRes();

      await updateDoctor(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Doctor not found' });
    });

    it('400 when hospitalId invalid', async () => {
      const doc = fakeDoctorDoc();
      Doctor.findById.mockResolvedValueOnce(doc);
      Hospital.findById.mockResolvedValueOnce(null);

      const req = mockReq({ params: { id: 'd1' }, body: { hospitalId: 'hX' } });
      const res = mockRes();

      await updateDoctor(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid hospital' });
    });

    it('updates fields + replaces image and deletes old one', async () => {
      // start with old image
      const doc = fakeDoctorDoc({ image: '/uploads/doctors/old.png' });
      // IMPORTANT: make save() resolve to the *mutated* doc so res.json sees the new image
      doc.save.mockResolvedValueOnce(doc);

      Doctor.findById.mockResolvedValueOnce(doc);
      Hospital.findById.mockResolvedValueOnce({ _id: 'h2' });

      const req = mockReq({
        params: { id: 'd1' },
        body: {
          name: 'Dr B',
          age: '50',
          qualification: 'MD',
          specialization: 'Neuro',
          consultationRate: '2000',
          hospitalId: 'h2'
        },
        file: { filename: 'new.png', path: '/tmp/new.png' }
      });
      const res = mockRes();

      await updateDoctor(req, res);

      expect(fs.unlink).toHaveBeenCalled(); // old image deleted
      expect(doc.image).toBe('/uploads/doctors/new.png'); // mutated on doc
      expect(doc.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ image: '/uploads/doctors/new.png' }));
    });
  });

  describe('deleteDoctor', () => {
    it('404 when not found', async () => {
      Doctor.findById.mockResolvedValueOnce(null);
      const req = mockReq({ params: { id: 'd404' } });
      const res = mockRes();

      await deleteDoctor(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Doctor not found' });
    });

    it('deletes image, cascades appointments, and removes doctor', async () => {
      const doc = fakeDoctorDoc({ image: '/uploads/doctors/x.png' });
      Doctor.findById.mockResolvedValueOnce(doc);

      const req = mockReq({ params: { id: 'd1' } });
      const res = mockRes();

      await deleteDoctor(req, res);

      expect(fs.unlink).toHaveBeenCalled();
      expect(Appointment.deleteMany).toHaveBeenCalledWith({ doctor: 'd1' });
      expect(doc.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Doctor removed' });
    });
  });

  describe('getAvailability', () => {
    it('404 if doctor not found', async () => {
      Doctor.findById.mockResolvedValueOnce(null);
      const req = mockReq({ params: { id: 'd404' } });
      const res = mockRes();

      await getAvailability(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Doctor not found' });
    });

    it('returns availability array', async () => {
      const availability = makeAvail({ date: '2025-10-20', slots: [] });
      const doc = fakeDoctorDoc({ availability });
      Doctor.findById.mockResolvedValueOnce(doc);

      const req = mockReq({ params: { id: 'd1' } });
      const res = mockRes();

      await getAvailability(req, res);
      expect(res.json).toHaveBeenCalledWith(availability);
    });
  });

  describe('setAvailability', () => {
    it('400 on overlap (initial date)', async () => {
      const existingSlot = {
        start: new Date('2025-10-21T08:00:00Z'),
        end:   new Date('2025-10-21T09:00:00Z'),
        isBooked: false
      };
      const availability = makeAvail({
        date: '2025-10-21T00:00:00Z',
        slots: [existingSlot]
      });
      const doc = fakeDoctorDoc({ availability });
      Doctor.findById.mockResolvedValueOnce(doc);

      const req = mockReq({
        params: { id: 'd1' },
        body: {
          date: '2025-10-21T00:00:00Z',
          timeSlots: [{ start: '2025-10-21T08:30:00Z', end: '2025-10-21T09:30:00Z' }],
          recurrence: 'none'
        }
      });
      const res = mockRes();

      await setAvailability(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Overlapping time slot' });
    });

    it('creates non-recurring availability (201)', async () => {
      const doc = fakeDoctorDoc({ availability: makeAvail({ date: '2025-10-20', slots: [] }) });
      Doctor.findById.mockResolvedValueOnce(doc);

      const req = mockReq({
        params: { id: 'd1' },
        body: {
          date: '2025-10-22T00:00:00Z',
          timeSlots: [{ start: '2025-10-22T08:00:00Z', end: '2025-10-22T09:00:00Z' }],
          recurrence: 'none'
        }
      });
      const res = mockRes();

      await setAvailability(req, res);
      expect(doc.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Availability set' });
    });

    it('creates daily recurrence within one month (201)', async () => {
      const doc = fakeDoctorDoc({ availability: [] });
      // add array helpers
      doc.availability.id = () => null;
      doc.availability.pull = () => {};
      // make save resolve so we can assert it
      doc.save.mockResolvedValueOnce(true);

      Doctor.findById.mockResolvedValueOnce(doc);

      const req = mockReq({
        params: { id: 'd1' },
        body: {
          date: '2025-10-01T00:00:00Z',
          timeSlots: [{ start: '2025-10-01T08:00:00Z', end: '2025-10-01T09:00:00Z' }],
          recurrence: 'daily'
        }
      });
      const res = mockRes();

      await setAvailability(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(doc.availability.length).toBeGreaterThan(1);
      expect(res.json).toHaveBeenCalledWith({ message: 'Availability set' });
    });
  });

  describe('updateAvailability', () => {
    it('404 doctor not found', async () => {
      Doctor.findById.mockResolvedValueOnce(null);
      const req = mockReq({ params: { id: 'd404', availId: 'a1' }, body: {} });
      const res = mockRes();

      await updateAvailability(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Doctor not found' });
    });

    it('404 availability not found', async () => {
      const av = makeAvail({ id: 'a1', date: '2025-10-22', slots: [] });
      const doc = fakeDoctorDoc({ availability: av });
      Doctor.findById.mockResolvedValueOnce(doc);

      const req = mockReq({ params: { id: 'd1', availId: 'aX' }, body: {} });
      const res = mockRes();

      await updateAvailability(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Availability not found' });
    });

    it('400 on overlap when updating', async () => {
      const existingSlot = { start: new Date('2025-10-23T08:00:00Z'), end: new Date('2025-10-23T09:00:00Z'), isBooked: false };
      const av = makeAvail({ id: 'a1', date: '2025-10-23T00:00:00Z', slots: [existingSlot] });
      // add another availability on same date to create overlap when updating a1
      av.push({
        _id: 'a2',
        date: new Date('2025-10-23T00:00:00Z'),
        timeSlots: [{ start: new Date('2025-10-23T08:30:00Z'), end: new Date('2025-10-23T09:30:00Z'), isBooked: false }],
        recurrence: 'none'
      });
      av.id = (x) => av.find(v => v._id === x) || null;
      av.pull = () => {};

      const doc = fakeDoctorDoc({ availability: av });
      Doctor.findById.mockResolvedValueOnce(doc);

      const req = mockReq({
        params: { id: 'd1', availId: 'a1' },
        body: {
          date: '2025-10-23T00:00:00Z',
          timeSlots: [{ start: '2025-10-23T08:15:00Z', end: '2025-10-23T08:45:00Z' }]
        }
      });
      const res = mockRes();

      await updateAvailability(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Overlapping time slot' });
    });

    it('updates availability successfully', async () => {
      const av = makeAvail({ id: 'a1', date: '2025-10-24T00:00:00Z', slots: [] });
      const doc = fakeDoctorDoc({ availability: av });
      Doctor.findById.mockResolvedValueOnce(doc);

      const req = mockReq({
        params: { id: 'd1', availId: 'a1' },
        body: {
          date: '2025-10-25T00:00:00Z',
          timeSlots: [{ start: '2025-10-25T10:00:00Z', end: '2025-10-25T11:00:00Z' }],
          recurrence: 'weekly'
        }
      });
      const res = mockRes();

      await updateAvailability(req, res);
      expect(doc.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        date: new Date('2025-10-25T00:00:00Z')
      }));
    });
  });

  describe('deleteAvailability', () => {
    it('400 if any slot is booked', async () => {
      const av = makeAvail({
        id: 'a1',
        date: '2025-10-26T00:00:00Z',
        slots: [{ start: new Date('2025-10-26T08:00:00Z'), end: new Date('2025-10-26T09:00:00Z'), isBooked: true }]
      });
      const doc = fakeDoctorDoc({ availability: av });
      Doctor.findById.mockResolvedValueOnce(doc);

      const req = mockReq({ params: { id: 'd1', availId: 'a1' } });
      const res = mockRes();

      await deleteAvailability(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cannot delete availability with booked slots' });
    });

    it('deletes availability when unbooked', async () => {
      const av = makeAvail({
        id: 'a1',
        date: '2025-10-27T00:00:00Z',
        slots: [{ start: new Date('2025-10-27T08:00:00Z'), end: new Date('2025-10-27T09:00:00Z'), isBooked: false }]
      });
      const doc = fakeDoctorDoc({ availability: av });
      Doctor.findById.mockResolvedValueOnce(doc);

      const req = mockReq({ params: { id: 'd1', availId: 'a1' } });
      const res = mockRes();

      await deleteAvailability(req, res);
      expect(doc.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Availability removed' });
    });
  });

  describe('getDoctorAppointments', () => {
    it('builds query with status and date', async () => {
      // Hijack Appointment.find to spy query + provide chaining
      const populate2 = jest.fn().mockResolvedValueOnce([{ id: 'ap1' }]);
      const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
      Appointment.find.mockReturnValueOnce({ populate: populate1 });

      const req = mockReq({
        params: { id: 'd1' },
        query: { status: 'confirmed', date: '2025-10-30T00:00:00Z' }
      });
      const res = mockRes();

      await getDoctorAppointments(req, res);
      expect(Appointment.find).toHaveBeenCalledWith(expect.objectContaining({
        doctor: 'd1',
        status: 'confirmed',
        date: expect.objectContaining({ $gte: new Date('2025-10-30T00:00:00Z') })
      }));
      expect(res.json).toHaveBeenCalledWith([{ id: 'ap1' }]);
    });
  });

  describe('updateAppointment', () => {
    it('404 when appointment not found or mismatched doctor', async () => {
      Appointment.findById.mockResolvedValueOnce(null);
      const req = mockReq({ params: { doctorId: 'd1', appointmentId: 'apX' }, body: { status: 'cancelled' } });
      const res = mockRes();

      await updateAppointment(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Appointment not found' });
    });

    it('cancelled -> reopens slot in availability', async () => {
      const appt = {
        _id: 'ap1',
        doctor: 'd1',
        date: new Date('2025-10-31T00:00:00Z'),
        timeSlot: { start: new Date('2025-10-31T08:00:00Z') },
        status: 'confirmed',
        save: jest.fn().mockResolvedValue(true)
      };
      Appointment.findById.mockResolvedValueOnce(appt);

      // Doctor with matching availability/slot booked=true
      const availability = [{
        date: new Date('2025-10-31T00:00:00Z'),
        timeSlots: [
          { start: new Date('2025-10-31T08:00:00Z'), end: new Date('2025-10-31T09:00:00Z'), isBooked: true }
        ]
      }];
      const doc = fakeDoctorDoc({ availability });
      Doctor.findById.mockResolvedValueOnce(doc);

      const req = mockReq({ params: { doctorId: 'd1', appointmentId: 'ap1' }, body: { status: 'cancelled' } });
      const res = mockRes();

      await updateAppointment(req, res);

      expect(appt.save).toHaveBeenCalled();
      expect(doc.save).toHaveBeenCalled();
      expect(doc.availability[0].timeSlots[0].isBooked).toBe(false);
      expect(res.json).toHaveBeenCalledWith(appt);
    });
  });
});

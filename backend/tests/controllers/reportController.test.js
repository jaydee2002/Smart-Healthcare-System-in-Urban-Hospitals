// tests/controllers/reportController.test.js

// ---- Inline Mocks ----
jest.mock('../../src/models/Appointment.js', () => ({
  __esModule: true,
  default: {
    aggregate: jest.fn(),
  }
}));

jest.mock('../../src/models/Report.js', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    find: jest.fn(() => {
      // chain: .populate().sort().limit()
      const limit = jest.fn().mockResolvedValue([]);
      const sort = jest.fn(() => ({ limit }));
      const populate = jest.fn(() => ({ sort }));
      return { populate };
    }),
    findById: jest.fn()
  }
}));

jest.mock('../../src/models/Hospital.js', () => ({
  __esModule: true,
  default: {}
}));

import Appointment from '../../src/models/Appointment.js';
import Report from '../../src/models/Report.js';

import {
  generateReport,
  getReports,
  getReportById
} from '../../src/controllers/reportController.js';

// ---- tiny req/res helpers ----
const mockReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: { _id: 'mgr1', name: 'Manager' },
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

describe('reportController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------- generateReport -------------
  describe('generateReport', () => {
    it('generates a DAILY report with no filters and saves it', async () => {
      // Aggregate returns hospital groups with some values
      Appointment.aggregate.mockResolvedValueOnce([
        {
          _id: 'h1',
          totalPatients: 12,
          peakDate: { date: '2025-10-10', count: 7 },
          utilization: 0.6,
          peakTimes: [
            [{ time: new Date('2025-10-10T08:00:00Z') }],
            [{ time: new Date('2025-10-10T09:00:00Z') }]
          ],
          hospitalDetails: { _id: 'h1', name: 'General Hospital' }
        },
        {
          _id: 'h2',
          totalPatients: 8,
          peakDate: { date: '2025-10-11', count: 5 },
          utilization: 0.4,
          peakTimes: [[{ time: new Date('2025-10-11T10:00:00Z') }]],
          hospitalDetails: { _id: 'h2', name: 'City Clinic' }
        }
      ]);

      Report.create.mockResolvedValueOnce({ _id: 'r1' });

      const req = mockReq({ params: { type: 'daily' } });
      const res = mockRes();

      await generateReport(req, res);

      expect(Appointment.aggregate).toHaveBeenCalled();
      expect(Report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'daily',
          generatedBy: 'mgr1'
        })
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'daily',
          reportId: 'r1',
          metrics: expect.objectContaining({
            totalPatientCount: 20,
            // average of 0.6 and 0.4
            averageUtilization: expect.any(Number),
            hospitalBreakdown: [
              { hospital: 'General Hospital', patients: 12, peakDay: '2025-10-10' },
              { hospital: 'City Clinic', patients: 8, peakDay: '2025-10-11' }
            ],
            peakTimes: expect.arrayContaining([
              expect.objectContaining({ time: new Date('2025-10-10T08:00:00Z') }),
              expect.objectContaining({ time: new Date('2025-10-10T09:00:00Z') }),
              expect.objectContaining({ time: new Date('2025-10-11T10:00:00Z') })
            ])
          })
        })
      );
    });

    it('applies hospital filter correctly (post-lookup match) and custom date range', async () => {
      // Return a single hospital record as if filtered
      Appointment.aggregate.mockResolvedValueOnce([
        {
          _id: 'h1',
          totalPatients: 5,
          peakDate: { date: '2025-10-12', count: 5 },
          utilization: 0.5,
          peakTimes: [[{ time: new Date('2025-10-12T08:00:00Z') }]],
          hospitalDetails: { _id: 'h1', name: 'General Hospital' }
        }
      ]);

      Report.create.mockResolvedValueOnce({ _id: 'r2' });

      const req = mockReq({
        params: { type: 'weekly' },
        query: { hospital: 'h1', startDate: '2025-10-10', endDate: '2025-10-17' }
      });
      const res = mockRes();

      await generateReport(req, res);

      expect(Appointment.aggregate).toHaveBeenCalled();
      expect(Report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'weekly',
          filters: expect.objectContaining({ hospital: 'h1', startDate: '2025-10-10', endDate: '2025-10-17' })
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: 'r2',
          metrics: expect.objectContaining({
            totalPatientCount: 5,
            hospitalBreakdown: [
              { hospital: 'General Hospital', patients: 5, peakDay: '2025-10-12' }
            ]
          })
        })
      );
    });

    it('returns 500 on aggregation error', async () => {
      Appointment.aggregate.mockRejectedValueOnce(new Error('agg failed'));

      const req = mockReq({ params: { type: 'daily' } });
      const res = mockRes();

      await generateReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'agg failed' });
    });
  });

  // ------------- getReports -------------
  describe('getReports', () => {
    it('returns list filtered by type and limited', async () => {
      const limit = jest.fn().mockResolvedValueOnce([{ _id: 'r1' }]);
      const sort = jest.fn(() => ({ limit }));
      const populate = jest.fn(() => ({ sort }));
      // override chain for this test
      Report.find.mockReturnValueOnce({ populate });

      const req = mockReq({ query: { type: 'daily', limit: '5' } });
      const res = mockRes();

      await getReports(req, res);

      expect(Report.find).toHaveBeenCalledWith({ type: 'daily' });
      expect(populate).toHaveBeenCalledWith('generatedBy', 'name');
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(limit).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith([{ _id: 'r1' }]);
    });

    it('500 on error', async () => {
      const limit = jest.fn().mockRejectedValueOnce(new Error('db down'));
      const sort = jest.fn(() => ({ limit }));
      const populate = jest.fn(() => ({ sort }));
      Report.find.mockReturnValueOnce({ populate });

      const req = mockReq({});
      const res = mockRes();

      await getReports(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'db down' });
    });
  });

  // ------------- getReportById -------------
  describe('getReportById', () => {
    it('404 when not found', async () => {
      Report.findById.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(null)
      });

      const req = mockReq({ params: { id: 'r404' } });
      const res = mockRes();

      await getReportById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Report not found' });
    });

    it('200 when found', async () => {
      const doc = { _id: 'r1', metrics: {} };
      Report.findById.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(doc)
      });

      const req = mockReq({ params: { id: 'r1' } });
      const res = mockRes();

      await getReportById(req, res);

      expect(res.json).toHaveBeenCalledWith(doc);
    });

    it('500 on error', async () => {
      Report.findById.mockReturnValueOnce({
        populate: jest.fn().mockRejectedValueOnce(new Error('oops'))
      });
      const req = mockReq({ params: { id: 'rX' } });
      const res = mockRes();

      await getReportById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'oops' });
    });
  });
});

export const mockReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  file: null,
  user: { _id: 'user_123' },
  ...overrides
});

export const mockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.headersSent = false;
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json   = jest.fn((data) => { res.body = data; return res; });
  return res;
};

// tests/utils/factories.js
export const makeFakeAvailability = (overrides = {}) => {
  const _id = overrides._id || 'avail_1';
  const date = overrides.date || new Date('2025-10-22T00:00:00Z');
  const timeSlots = overrides.timeSlots || [
    {
      start: new Date('2025-10-22T08:00:00Z'),
      end: new Date('2025-10-22T09:00:00Z'),
      isBooked: false
    }
  ];
  const rec = overrides.recurrence || 'none';
  return { _id, date, timeSlots, recurrence: rec };
};

export const makeFakeDoctorDoc = (overrides = {}) => {
  let availArray = overrides.availability || [makeFakeAvailability()];
  const doc = {
    _id: overrides._id || 'doc_1',
    name: overrides.name || 'Dr A',
    image: overrides.image || null,
    hospital: overrides.hospital || 'h1',
    availability: Object.assign(availArray, {
      id: (id) => availArray.find((a) => a._id === id) || null,
      pull: ({ _id }) => {
        availArray = availArray.filter((a) => a._id !== _id);
        doc.availability.length = 0;
        doc.availability.push(...availArray);
      }
    }),
    save: jest.fn().mockResolvedValue(true),
    deleteOne: jest.fn().mockResolvedValue(true),
    remove: jest.fn().mockResolvedValue(true) // if older mongoose code used
  };
  return doc;
};

export const makePopulateChain = (result) => ({
  populate: jest.fn().mockResolvedValue(result)
});

export const makeDoublePopulateChain = (finalResult) => {
  const second = jest.fn().mockResolvedValue(finalResult);
  const first = jest.fn().mockReturnValue({ populate: second });
  return { populate: first };
};

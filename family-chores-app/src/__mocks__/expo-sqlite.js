export const openDatabase = jest.fn(() => ({
  transaction: jest.fn(),
}));

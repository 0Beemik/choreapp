import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { AdminLogin } from './AdminLogin';
import { adminAuthService } from '../../../services/AdminAuthService';
import { useFamily } from '../../../hooks/useFamily';

jest.mock('../../../services/AdminAuthService');
jest.mock('../../../hooks/useFamily');

const mockStore = configureStore([]);

describe('AdminLogin', () => {
  const mockOnClose = jest.fn();
  const mockFamily = { id: 'family-1', name: 'Test Family' };
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    (useFamily as jest.Mock).mockReturnValue({ family: mockFamily });
    store = mockStore({
      chores: { chores: [], assignments: [] },
      users: { users: [] },
      family: { settings: {} },
    });
  });

  const renderWithProvider = (component) => {
    return render(<Provider store={store}>{component}</Provider>);
  };

  it('renders PinEntry when there is no admin session', () => {
    const { getByText } = renderWithProvider(<AdminLogin visible={true} onClose={mockOnClose} />);
    expect(getByText('Enter Admin PIN')).toBeDefined();
  });

  it('shows an error if family data is not loaded', async () => {
    (useFamily as jest.Mock).mockReturnValue({ family: null });
    const { getByText, getByPlaceholderText } = renderWithProvider(<AdminLogin visible={true} onClose={mockOnClose} />);
    
    fireEvent.changeText(getByPlaceholderText('****'), '1234');
    fireEvent.press(getByText('Submit'));

    await waitFor(() => {
      expect(getByText('Family data not loaded.')).toBeDefined();
    });
  });

  it('shows an error on incorrect PIN submission', async () => {
    const errorMessage = 'Invalid PIN';
    (adminAuthService.authenticateAdmin as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const { getByText, getByPlaceholderText } = renderWithProvider(<AdminLogin visible={true} onClose={mockOnClose} />);
    
    fireEvent.changeText(getByPlaceholderText('****'), 'wrong-pin');
    fireEvent.press(getByText('Submit'));

    await waitFor(() => {
      expect(getByText(errorMessage)).toBeDefined();
    });
  });

  it('renders AdminPanel after successful PIN submission', async () => {
    const mockSession = { id: 'session-1', token: 'admin-token' };
    (adminAuthService.authenticateAdmin as jest.Mock).mockResolvedValue(mockSession);
    
    const { getByText, getByPlaceholderText } = renderWithProvider(<AdminLogin visible={true} onClose={mockOnClose} />);
    
    fireEvent.changeText(getByPlaceholderText('****'), 'correct-pin');
    fireEvent.press(getByText('Submit'));

    await waitFor(() => {
      expect(getByText('Admin Panel')).toBeDefined();
    });
  });

  it('calls onClose and revokes session on logout', async () => {
    const mockSession = { id: 'session-1', token: 'admin-token' };
    (adminAuthService.authenticateAdmin as jest.Mock).mockResolvedValue(mockSession);
    
    const { getByText, getByPlaceholderText } = renderWithProvider(<AdminLogin visible={true} onClose={mockOnClose} />);
    
    fireEvent.changeText(getByPlaceholderText('****'), 'correct-pin');
    fireEvent.press(getByText('Submit'));

    await waitFor(() => {
      expect(getByText('Admin Panel')).toBeDefined();
    });

    fireEvent.press(getByText('Logout'));

    expect(adminAuthService.revokeAdminSession).toHaveBeenCalledWith(mockSession.id);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls handleLogout on modal onRequestClose', async () => {
    const { getByTestId } = renderWithProvider(<AdminLogin visible={true} onClose={mockOnClose} />);
    
    const modal = getByTestId('admin-login-modal');
    fireEvent(modal, 'requestClose');

    await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});

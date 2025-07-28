
// src/components/admin/PointsManagement/PointsAdjustment.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PointsAdjustment from './PointsAdjustment';
import { adminOverrideService } from '../../../services/AdminOverrideService';
import { User } from '../../../models/User';

jest.mock('../../../services/AdminOverrideService');

const mockUser: User = {
  id: '1',
  name: 'Test User',
  role: 'child',
};

describe('PointsAdjustment', () => {
  beforeEach(() => {
    (adminOverrideService.adjustUserPoints as jest.Mock).mockClear();
  });

  it('should render the component with user name', () => {
    const { getByText } = render(<PointsAdjustment user={mockUser} />);
    expect(getByText('Adjust Points for Test User')).toBeTruthy();
  });

  it('should update amount and reason inputs', () => {
    const { getByPlaceholderText } = render(<PointsAdjustment user={mockUser} />);
    const amountInput = getByPlaceholderText('Amount (+/-)');
    const reasonInput = getByPlaceholderText('Reason');

    fireEvent.changeText(amountInput, '100');
    fireEvent.changeText(reasonInput, 'Good behavior');

    expect(amountInput.props.value).toBe('100');
    expect(reasonInput.props.value).toBe('Good behavior');
  });

  it('should call adjustUserPoints with correct parameters for a bonus', () => {
    const { getByText, getByPlaceholderText } = render(<PointsAdjustment user={mockUser} />);
    const amountInput = getByPlaceholderText('Amount (+/-)');
    const reasonInput = getByPlaceholderText('Reason');
    const adjustButton = getByText('Adjust Points');

    fireEvent.changeText(amountInput, '100');
    fireEvent.changeText(reasonInput, 'Good behavior');
    fireEvent.press(adjustButton);

    expect(adminOverrideService.adjustUserPoints).toHaveBeenCalledWith('1', {
      amount: 100,
      reason: 'Good behavior',
      category: 'bonus',
    });
  });

  it('should call adjustUserPoints with correct parameters for a penalty', () => {
    const { getByText, getByPlaceholderText } = render(<PointsAdjustment user={mockUser} />);
    const amountInput = getByPlaceholderText('Amount (+/-)');
    const reasonInput = getByPlaceholderText('Reason');
    const adjustButton = getByText('Adjust Points');

    fireEvent.changeText(amountInput, '-50');
    fireEvent.changeText(reasonInput, 'Missed chore');
    fireEvent.press(adjustButton);

    expect(adminOverrideService.adjustUserPoints).toHaveBeenCalledWith('1', {
      amount: -50,
      reason: 'Missed chore',
      category: 'penalty',
    });
  });

  it('should show an alert if amount or reason is missing', () => {
    jest.spyOn(Alert, 'alert');
    const { getByText } = render(<PointsAdjustment user={mockUser} />);
    const adjustButton = getByText('Adjust Points');

    fireEvent.press(adjustButton);

    expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Please enter a valid amount and reason.');
    expect(adminOverrideService.adjustUserPoints).not.toHaveBeenCalled();
  });
});

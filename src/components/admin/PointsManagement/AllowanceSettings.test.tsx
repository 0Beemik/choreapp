
// src/components/admin/PointsManagement/AllowanceSettings.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AllowanceSettingsPanel from './AllowanceSettings';
import { useFamily } from '../../../hooks/useFamily';
import { userService } from '../../../services/UserService';
import { User } from '../../../models/User';

jest.mock('../../../hooks/useFamily');
jest.mock('../../../services/UserService');

const mockMembers: User[] = [
  { id: '1', name: 'Child One', role: 'child', allowanceRate: 10 },
  { id: '2', name: 'Child Two', role: 'child', allowanceRate: 15 },
  { id: '3', name: 'Parent One', role: 'parent', allowanceRate: 0 },
];

describe('AllowanceSettingsPanel', () => {
  beforeEach(() => {
    (useFamily as jest.Mock).mockReturnValue({
      members: mockMembers,
      loading: false,
    });
    (userService.updateUser as jest.Mock).mockClear();
  });

  it('should render a list of children with their allowance rates', () => {
    const { getByText, getByDisplayValue } = render(<AllowanceSettingsPanel />);

    expect(getByText('Child One')).toBeTruthy();
    expect(getByDisplayValue('10')).toBeTruthy();

    expect(getByText('Child Two')).toBeTruthy();
    expect(getByDisplayValue('15')).toBeTruthy();
  });

  it('should not render parents', () => {
    const { queryByText } = render(<AllowanceSettingsPanel />);
    expect(queryByText('Parent One')).toBeNull();
  });

  it('should update the allowance rate when the input changes', () => {
    const { getByDisplayValue, rerender } = render(<AllowanceSettingsPanel />);
    const input = getByDisplayValue('10');

    fireEvent.changeText(input, '12');

    rerender(<AllowanceSettingsPanel />);
    expect(getByDisplayValue('12')).toBeTruthy();
  });

  it('should call the update user service when the save button is pressed', () => {
    const { getAllByText, getByDisplayValue } = render(<AllowanceSettingsPanel />);
    const input = getByDisplayValue('10');

    fireEvent.changeText(input, '12');
    fireEvent.press(getAllByText('Save')[0]);

    expect(userService.updateUser).toHaveBeenCalledWith('1', { allowanceRate: 12 });
  });

  it('should show a loading indicator when the data is loading', () => {
    (useFamily as jest.Mock).mockReturnValue({
      members: [],
      loading: true,
    });

    const { getByText } = render(<AllowanceSettingsPanel />);
    expect(getByText('Loading...')).toBeTruthy();
  });
});


// src/components/admin/PointsManagement/PointsManagementPanel.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import PointsManagementPanel from './PointsManagementPanel';

jest.mock('./AllowanceSettings', () => () => <></>);

describe('PointsManagementPanel', () => {
  it('should render the panel with the correct title', () => {
    const { getByText } = render(<PointsManagementPanel />);
    expect(getByText('Points Management')).toBeTruthy();
  });
});

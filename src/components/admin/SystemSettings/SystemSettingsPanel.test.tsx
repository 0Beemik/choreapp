
// src/components/admin/SystemSettings/SystemSettingsPanel.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import SystemSettingsPanel from './SystemSettingsPanel';

jest.mock('./FamilySettings', () => () => <></>);

describe('SystemSettingsPanel', () => {
  it('should render the panel with the correct title', () => {
    const { getByText } = render(<SystemSettingsPanel />);
    expect(getByText('System Settings')).toBeTruthy();
  });
});

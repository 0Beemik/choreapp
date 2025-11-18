import React from 'react';
import { render } from '@testing-library/react-native';
import { FamilyInfoSection } from './FamilyInfoSection';
import { Family } from '../../../models/Family';

const mockFamily: Family = {
  id: '1',
  name: 'The Test Family',
  settings: {
    pointsPerChore: 10,
    buyoutCostPercentage: 20,
    maxBuyoutsPerMonth: 4,
    rotationDay: 'sunday',
  },
  createdAt: new Date(),
};

describe('FamilyInfoSection', () => {
  it('renders the family name and settings', () => {
    const { getByText } = render(<FamilyInfoSection family={mockFamily} />);
    expect(getByText('The Test Family')).toBeTruthy();
    expect(getByText('Points per chore: 10')).toBeTruthy();
    expect(getByText('Buyout cost: 20% of points')).toBeTruthy();
  });
});

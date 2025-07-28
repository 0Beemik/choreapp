import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import BadgeNotification from './BadgeNotification';
import { Badge } from '../../../models/Badge';
import { animationController } from '../../../animations/AnimationController';

jest.useFakeTimers();
jest.mock('../../../animations/AnimationController');

const mockBadge: Badge = {
  id: 'badge-1',
  name: 'Test Badge',
  description: 'This is a test badge',
  icon: 'test-icon',
  criteria: { type: 'choresCompleted', count: 10 },
};

describe('BadgeNotification', () => {
  const mockOnDismiss = jest.fn();

  it('renders correctly and shows badge info', () => {
    const { getByText } = render(
      <BadgeNotification badge={mockBadge} onDismiss={mockOnDismiss} />
    );

    expect(getByText('Badge Earned!')).toBeDefined();
    expect(getByText(mockBadge.name)).toBeDefined();
    expect(getByText(mockBadge.description)).toBeDefined();
  });

  it('calls onDismiss after a timeout', async () => {
    render(<BadgeNotification badge={mockBadge} onDismiss={mockOnDismiss} />);
    
    expect(mockOnDismiss).not.toHaveBeenCalled();
    
    jest.runAllTimers();
    
    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  it('calls the animation controller', () => {
    render(<BadgeNotification badge={mockBadge} onDismiss={mockOnDismiss} />);
    
    expect(animationController.celebrations.playBadgeUnlock).toHaveBeenCalled();
  });
});

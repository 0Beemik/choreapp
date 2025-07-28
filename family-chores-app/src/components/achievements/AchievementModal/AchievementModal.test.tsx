import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AchievementModal from './AchievementModal';
import { Badge } from '../../../models/Badge';
import { UserBadge } from '../../../models/UserBadge';

const mockBadge: Badge = {
  id: 'badge-1',
  name: 'Test Badge',
  description: 'This is a test badge',
  icon: 'test-icon',
  criteria: { type: 'choresCompleted', count: 10 },
};

const mockUserBadge: UserBadge = {
  id: 'user-badge-1',
  userId: 'user-1',
  badgeId: 'badge-1',
  earnedAt: new Date(),
};

describe('AchievementModal', () => {
  const mockOnClose = jest.fn();
  const mockOnShare = jest.fn();

  it('renders correctly with share button', () => {
    const { getByText } = render(
      <AchievementModal
        badge={mockBadge}
        userBadge={mockUserBadge}
        onClose={mockOnClose}
        onShare={mockOnShare}
      />
    );

    expect(getByText(mockBadge.name)).toBeDefined();
    expect(getByText(mockBadge.description)).toBeDefined();
    expect(getByText(`Earned on: ${mockUserBadge.earnedAt.toLocaleDateString()}`)).toBeDefined();
    expect(getByText('Share')).toBeDefined();
  });

  it('renders correctly without share button', () => {
    const { getByText, queryByText } = render(
      <AchievementModal
        badge={mockBadge}
        userBadge={mockUserBadge}
        onClose={mockOnClose}
      />
    );

    expect(getByText(mockBadge.name)).toBeDefined();
    expect(queryByText('Share')).toBeNull();
  });

  it('calls onClose when close button is pressed', () => {
    const { getByText } = render(
      <AchievementModal
        badge={mockBadge}
        userBadge={mockUserBadge}
        onClose={mockOnClose}
      />
    );

    fireEvent.press(getByText('Close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onShare when share button is pressed', () => {
    const { getByText } = render(
      <AchievementModal
        badge={mockBadge}
        userBadge={mockUserBadge}
        onClose={mockOnClose}
        onShare={mockOnShare}
      />
    );

    fireEvent.press(getByText('Share'));
    expect(mockOnShare).toHaveBeenCalledTimes(1);
  });
});

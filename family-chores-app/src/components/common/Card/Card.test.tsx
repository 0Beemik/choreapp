// src/components/common/Card/Card.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, StyleSheet } from 'react-native';
import { Card } from './Card';

describe('Card', () => {
  it('should render its children', () => {
    const { getByText } = render(
      <Card>
        <Text>Hello World</Text>
      </Card>,
    );
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('should apply custom styles', () => {
    const { getByTestId } = render(
      <Card style={{ backgroundColor: 'blue' }} testID="card">
        <Text>Hello World</Text>
      </Card>,
    );
    const card = getByTestId('card');
    const cardStyle = StyleSheet.flatten(card.props.style);
    expect(cardStyle.backgroundColor).toBe('blue');
  });
});
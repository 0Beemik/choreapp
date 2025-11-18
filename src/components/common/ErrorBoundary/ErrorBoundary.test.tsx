import React from 'react';
import { render } from '@testing-library/react-native';
import { ErrorBoundary } from './ErrorBoundary';
import { Text } from 'react-native';

const ProblemChild = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  // Mock console.error to avoid polluting the test output
  const consoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = consoleError;
  });

  it('displays an error message when a child component throws an error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );
    expect(getByText('Sorry.. there was an error.')).toBeDefined();
  });

  it('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>No error</Text>
      </ErrorBoundary>
    );
    expect(getByText('No error')).toBeDefined();
  });
});

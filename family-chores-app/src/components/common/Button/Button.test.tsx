import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { Button, ButtonProps } from './Button';
import '@testing-library/jest-native/extend-expect';
import renderer from 'react-test-renderer';

const renderWithTheme = (props: ButtonProps) => {
  return render(
    <ThemeProvider theme={{}}>
      <Button {...props} />
    </ThemeProvider>
  );
};

describe('Button', () => {
  it('renders correctly with a title', () => {
    const { getByText } = renderWithTheme({ title: 'Test Button', onPress: () => {} });
    expect(getByText('Test Button')).toBeDefined();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = renderWithTheme({ title: 'Test Button', onPress: onPressMock });
    fireEvent.press(getByText('Test Button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('is disabled when the disabled prop is true', () => {
    const onPressMock = jest.fn();
    const { getByText } = renderWithTheme({ title: 'Test Button', onPress: onPressMock, disabled: true });
    fireEvent.press(getByText('Test Button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('shows a loading indicator when loading is true', () => {
    const { getByTestId } = renderWithTheme({ title: 'Test Button', onPress: () => {}, loading: true, testID: 'button' });
    expect(getByTestId('loading-indicator')).toBeDefined();
  });

  it('applies the correct styles for the primary variant', () => {
    const { getByTestId } = renderWithTheme({ title: 'Test Button', onPress: () => {}, variant: 'primary', testID: 'button' });
    expect(getByTestId('button')).toHaveStyle({ backgroundColor: '#007bff' });
  });

  it('applies the correct styles for the secondary variant', () => {
    const { getByTestId } = renderWithTheme({ title: 'Test Button', onPress: () => {}, variant: 'secondary', testID: 'button' });
    expect(getByTestId('button')).toHaveStyle({ backgroundColor: '#6c757d' });
  });

  it('applies the correct styles for the danger variant', () => {
    const { getByTestId } = renderWithTheme({ title: 'Test Button', onPress: () => {}, variant: 'danger', testID: 'button' });
    expect(getByTestId('button')).toHaveStyle({ backgroundColor: '#dc3545' });
  });

  it('applies the correct styles for the small size', () => {
    const tree = renderer.create(
      <ThemeProvider theme={{}}>
        <Button title="Test Button" onPress={() => {}} size="small" />
      </ThemeProvider>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('applies the correct styles for the medium size', () => {
    const tree = renderer.create(
      <ThemeProvider theme={{}}>
        <Button title="Test Button" onPress={() => {}} size="medium" />
      </ThemeProvider>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('applies the correct styles for the large size', () => {
    const tree = renderer.create(
      <ThemeProvider theme={{}}>
        <Button title="Test Button" onPress={() => {}} size="large" />
      </ThemeProvider>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('has the correct accessibility label', () => {
    const { getByLabelText } = renderWithTheme({ title: 'Test Button', onPress: () => {}, accessibilityLabel: 'Press this button' });
    expect(getByLabelText('Press this button')).toBeDefined();
  });
});

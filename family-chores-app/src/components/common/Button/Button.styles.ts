import styled from 'styled-components/native';
import { ButtonProps } from './Button';

const variantColors = {
  primary: '#007bff',
  secondary: '#6c757d',
  danger: '#dc3545',
};

const sizeStyles = {
  small: {
    padding: '8px 12px',
    fontSize: '12px',
  },
  medium: {
    padding: '12px 18px',
    fontSize: '16px',
  },
  large: {
    padding: '16px 24px',
    fontSize: '20px',
  },
};

export const ButtonContainer = styled.TouchableOpacity<Omit<ButtonProps, 'title' | 'onPress'>>`
  background-color: ${(props) => variantColors[props.variant || 'primary']};
  padding: ${(props) => sizeStyles[props.size || 'medium'].padding};
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`;

export const ButtonText = styled.Text<Pick<ButtonProps, 'size'>>`
  color: #fff;
  font-size: ${(props) => sizeStyles[props.size || 'medium'].fontSize};
  font-weight: bold;
`;

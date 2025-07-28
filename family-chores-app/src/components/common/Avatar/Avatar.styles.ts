import styled from 'styled-components/native';
import { AvatarProps } from './Avatar';

const sizeMap = {
  small: 32,
  medium: 48,
  large: 64,
};

export const AvatarContainer = styled.TouchableOpacity<Pick<AvatarProps, 'size'>>`
  width: ${(props) => sizeMap[props.size || 'medium']}px;
  height: ${(props) => sizeMap[props.size || 'medium']}px;
  border-radius: ${(props) => sizeMap[props.size || 'medium'] / 2}px;
  background-color: #ccc;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border: 2px solid #fff;
`;

export const AvatarImage = styled.Image<Pick<AvatarProps, 'size'>>`
  width: 100%;
  height: 100%;
`;

export const AvatarText = styled.Text<Pick<AvatarProps, 'size'>>`
  color: #fff;
  font-size: ${(props) => sizeMap[props.size || 'medium'] / 2}px;
  font-weight: bold;
`;

export const Badge = styled.View<Pick<AvatarProps, 'size'>>`
  position: absolute;
  right: 0;
  bottom: 0;
  width: ${(props) => sizeMap[props.size || 'medium'] / 4}px;
  height: ${(props) => sizeMap[props.size || 'medium'] / 4}px;
  border-radius: ${(props) => sizeMap[props.size || 'medium'] / 8}px;
  background-color: #ff0000;
  border: 1px solid #fff;
`;
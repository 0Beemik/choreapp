import styled from 'styled-components/native';

export const CheckboxContainer = styled.View<{ checked: boolean; disabled?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  border: 2px solid ${(props) => (props.checked ? '#28a745' : '#ccc')};
  background-color: ${(props) => (props.checked ? '#28a745' : 'transparent')};
  justify-content: center;
  align-items: center;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
`;

export const CheckboxInner = styled.View`
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background-color: #fff;
`;

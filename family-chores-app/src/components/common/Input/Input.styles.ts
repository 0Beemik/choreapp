import styled from 'styled-components/native';

export const InputContainer = styled.View`
  margin-bottom: 16px;
`;

export const Label = styled.Text`
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
`;

export const StyledInput = styled.TextInput<{ hasError?: boolean }>`
  border: 1px solid ${(props) => (props.hasError ? '#dc3545' : '#ccc')};
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  background-color: #fff;
`;

export const ErrorText = styled.Text`
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
`;

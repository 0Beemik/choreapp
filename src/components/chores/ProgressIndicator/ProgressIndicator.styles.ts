import styled from 'styled-components/native';

export const ProgressContainer = styled.View`
  height: 10px;
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
`;

export const ProgressBar = styled.View<{ progress: number }>`
  height: 100%;
  width: ${(props) => props.progress}%;
  background-color: #28a745;
`;

export const ProgressText = styled.Text`
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  text-align: center;
`;

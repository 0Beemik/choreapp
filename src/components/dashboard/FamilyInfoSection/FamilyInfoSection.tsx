import React from 'react';
import { Family } from '../../../models/Family';
import { InfoContainer, InfoTitle, InfoText } from './FamilyInfoSection.styles';

export interface FamilyInfoSectionProps {
  family: Family;
}

export const FamilyInfoSection: React.FC<FamilyInfoSectionProps> = ({ family }) => {
  return (
    <InfoContainer>
      <InfoTitle>{family.name}</InfoTitle>
      <InfoText>
        Points per chore: {family.settings.pointsPerChore}
      </InfoText>
      <InfoText>
        Buyout cost: {family.settings.buyoutCostPercentage}% of points
      </InfoText>
    </InfoContainer>
  );
};

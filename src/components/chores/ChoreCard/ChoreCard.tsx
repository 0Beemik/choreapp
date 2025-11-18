import React from 'react';
import { Chore } from '../../../models/Chore';
import { ChoreAssignment } from '../../../models/ChoreAssignment';
import { Card } from '../../common/Card/Card';
import { ChoreCardContainer, ChoreName, ChoreDescription } from './ChoreCard.styles';
import { CompletionCheckbox } from '../CompletionCheckbox/CompletionCheckbox';
import { BuyoutButton } from '../BuyoutButton/BuyoutButton';
import { InterfaceAdapter, useAdaptation } from '../../adaptive/InterfaceAdapter/InterfaceAdapter';

export interface ChoreCardProps {
  assignment: ChoreAssignment;
  chore: Chore;
  userAge: number;
  onComplete: (assignmentId: string) => void;
  onBuyout?: (assignmentId: string) => void;
  disabled?: boolean;
  canAffordBuyout: boolean;
}

const AdaptiveChoreCard: React.FC<Omit<ChoreCardProps, 'userAge'>> = ({
  assignment,
  chore,
  onComplete,
  onBuyout,
  disabled,
  canAffordBuyout,
}) => {
  const { fontSize, simplificationLevel } = useAdaptation();

  const handleComplete = () => {
    onComplete(assignment.id);
  };

  const handleBuyout = () => {
    if (onBuyout) {
      onBuyout(assignment.id);
    }
  };

  return (
    <Card>
      <ChoreCardContainer>
        <ChoreName style={{ fontSize: fontSize.medium }}>{chore.name}</ChoreName>
        {simplificationLevel !== 'high' && chore.description && (
          <ChoreDescription style={{ fontSize: fontSize.small }}>
            {chore.description}
          </ChoreDescription>
        )}
        <CompletionCheckbox
          checked={assignment.status === 'completed'}
          onPress={handleComplete}
          disabled={disabled || assignment.status !== 'pending'}
        />
        {onBuyout && simplificationLevel !== 'high' && (
          <BuyoutButton
            onPress={handleBuyout}
            disabled={disabled || assignment.status !== 'pending'}
            canAfford={canAffordBuyout}
          />
        )}
      </ChoreCardContainer>
    </Card>
  );
};

export const ChoreCard: React.FC<ChoreCardProps> = (props) => {
  return (
    <InterfaceAdapter userAge={props.userAge}>
      <AdaptiveChoreCard {...props} />
    </InterfaceAdapter>
  );
};

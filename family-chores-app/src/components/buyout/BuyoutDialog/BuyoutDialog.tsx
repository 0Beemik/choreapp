import React from 'react';
import { Modal, View, Text, Button, StyleSheet } from 'react-native';
import { ChoreAssignment } from '../../../models/ChoreAssignment';
import { BuyoutCalculation } from '../../../services';

interface BuyoutDialogProps {
  assignment: ChoreAssignment;
  choreName: string;
  calculation: BuyoutCalculation;
  onConfirm: () => void;
  onCancel: () => void;
  visible: boolean;
}

const BuyoutDialog: React.FC<BuyoutDialogProps> = ({
  assignment,
  choreName,
  calculation,
  onConfirm,
  onCancel,
  visible,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Buyout Chore?</Text>
          <Text style={styles.choreName}>{choreName}</Text>
          <View style={styles.costBreakdown}>
            <Text style={styles.breakdownTitle}>Cost Breakdown:</Text>
            <Text>Base Cost: {calculation.costBreakdown.basePoints} points</Text>
            <Text>Buyout Percentage: {calculation.costBreakdown.buyoutCostPercentage}%</Text>
            <Text style={styles.totalCost}>Total Cost: {calculation.adjustedCost} points</Text>
          </View>
          <View style={styles.balanceInfo}>
            <Text>Your balance: {calculation.userBalance} points</Text>
            <Text>Remaining balance: {calculation.remainingBalance} points</Text>
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Confirm" onPress={onConfirm} disabled={!calculation.canAfford} />
            <Button title="Cancel" onPress={onCancel} color="#E53935" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
  },
  choreName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  costBreakdown: {
    marginBottom: 15,
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 10,
  },
  breakdownTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  totalCost: {
    fontWeight: 'bold',
    marginTop: 5,
  },
  balanceInfo: {
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
});

export default BuyoutDialog;

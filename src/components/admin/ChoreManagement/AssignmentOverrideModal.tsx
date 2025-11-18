import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Modal, StyleSheet } from 'react-native';
import { ChoreAssignment } from '../../../models/ChoreAssignment';

interface AssignmentOverrideModalProps {
  assignment: ChoreAssignment | null;
  visible: boolean;
  onClose: () => void;
  onSave: (assignmentId: string, newUserId: string, reason: string) => void;
}

export const AssignmentOverrideModal: React.FC<AssignmentOverrideModalProps> = ({ assignment, visible, onClose, onSave }) => {
  const [newUserId, setNewUserId] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!visible) {
      setNewUserId('');
      setReason('');
    }
  }, [visible]);

  const handleSave = () => {
    if (assignment) {
      onSave(assignment.id, newUserId, reason);
    }
  };

  if (!assignment) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Override Assignment</Text>
        <Text>Chore: {assignment.choreId}</Text>
        <Text>Current User: {assignment.userId}</Text>
        <TextInput
          style={styles.input}
          placeholder="New User ID"
          value={newUserId}
          onChangeText={setNewUserId}
        />
        <TextInput
          style={styles.input}
          placeholder="Reason for override"
          value={reason}
          onChangeText={setReason}
        />
        <View style={styles.buttons}>
          <Button title="Save" onPress={handleSave} />
          <Button title="Cancel" onPress={onClose} color="red" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

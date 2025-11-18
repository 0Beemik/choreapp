import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Modal, StyleSheet } from 'react-native';
import { Chore } from '../../../models/Chore';
import { UpdateChoreRequest } from '../../../types';

interface EditChoreModalProps {
  chore: Chore | null;
  visible: boolean;
  onClose: () => void;
  onSave: (choreId: string, updates: UpdateChoreRequest) => void;
  onDelete: (choreId: string) => void;
}

export const EditChoreModal: React.FC<EditChoreModalProps> = ({ chore, visible, onClose, onSave, onDelete }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');

  useEffect(() => {
    if (chore) {
      setName(chore.name);
      setDescription(chore.description || '');
      setEstimatedMinutes(String(chore.estimatedMinutes || ''));
    }
  }, [chore]);

  const handleSave = () => {
    if (chore) {
      const updates: UpdateChoreRequest = {
        name,
        description,
        estimatedMinutes: parseInt(estimatedMinutes, 10),
      };
      onSave(chore.id, updates);
    }
  };

  const handleDelete = () => {
    if (chore) {
      onDelete(chore.id);
    }
  };

  if (!chore) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Edit Chore</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={styles.input}
          placeholder="Estimated Minutes"
          value={estimatedMinutes}
          onChangeText={setEstimatedMinutes}
          keyboardType="number-pad"
        />
        <View style={styles.buttons}>
          <Button title="Save" onPress={handleSave} />
          <Button title="Delete" onPress={handleDelete} color="orange" />
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

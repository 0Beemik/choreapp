import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Modal, StyleSheet, Switch } from 'react-native';
import { User } from '../../../models/User';
import { UpdateUserRequest } from '../../../types';

interface EditUserModalProps {
  user: User | null;
  visible: boolean;
  onClose: () => void;
  onSave: (userId: string, updates: UpdateUserRequest) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, visible, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAge(String(user.age));
      setIsAdmin(user.isAdmin);
    }
  }, [user]);

  const handleSave = () => {
    if (user) {
      const updates: UpdateUserRequest = {
        name,
        age: parseInt(age, 10),
        isAdmin,
      };
      onSave(user.id, updates);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Edit User</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
        />
        <View style={styles.switchContainer}>
          <Text>Is Admin?</Text>
          <Switch value={isAdmin} onValueChange={setIsAdmin} />
        </View>
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

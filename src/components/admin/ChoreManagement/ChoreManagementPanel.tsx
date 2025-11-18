import React from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { Chore, ChoreAssignment } from '../../../models';

interface ChoreManagementPanelProps {
  chores: Chore[];
  assignments: ChoreAssignment[];
  onChoreCreate: () => void;
  onChoreEdit: (chore: Chore) => void;
  onAssignmentOverride: (assignment: ChoreAssignment) => void;
}

export const ChoreManagementPanel: React.FC<ChoreManagementPanelProps> = ({
  chores,
  assignments,
  onChoreCreate,
  onChoreEdit,
  onAssignmentOverride,
}) => {
  return (
    <View>
      <Text style={styles.title}>Chores</Text>
      <FlatList
        data={chores}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text>{item.name}</Text>
            <Button title="Edit" onPress={() => onChoreEdit(item)} />
          </View>
        )}
      />
      <Button title="Add Chore" onPress={onChoreCreate} />

      <Text style={styles.title}>Current Assignments</Text>
      <FlatList
        data={assignments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text>Chore: {item.choreId} - User: {item.userId}</Text>
            <Button title="Override" onPress={() => onAssignmentOverride(item)} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});
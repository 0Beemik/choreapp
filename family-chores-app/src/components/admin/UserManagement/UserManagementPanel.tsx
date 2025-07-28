import React from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { Family, User } from '../../../models';

interface UserManagementPanelProps {
  family: Family;
  onUserAdd: () => void;
  onUserEdit: (user: User) => void;
  onUserRemove: (userId: string) => void;
  onAdjustPoints: (user: User) => void;
}

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({
  family,
  onUserAdd,
  onUserEdit,
  onUserRemove,
  onAdjustPoints,
}) => {
  return (
    <View>
      <Text>User Management</Text>
      <FlatList
        data={family.members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            <Button title="Edit" onPress={() => onUserEdit(item)} />
            <Button title="Adjust Points" onPress={() => onAdjustPoints(item)} />
            <Button title="Remove" onPress={() => onUserRemove(item.id)} />
          </View>
        )}
      />
      <Button title="Add User" onPress={onUserAdd} />
    </View>
  );
};

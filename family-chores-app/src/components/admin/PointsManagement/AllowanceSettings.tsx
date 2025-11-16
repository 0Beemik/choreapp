import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet } from 'react-native';
import { useFamily } from '../../../hooks/useFamily';
import { User } from '../../../models/User';
import { userService } from '../../../services';

const AllowanceSettingsPanel: React.FC = () => {
  const { members, loading } = useFamily('some-family-id');
  const [allowanceRates, setAllowanceRates] = useState<Record<string, number>>({});

  const handleSave = (userId: string) => {
    const rate = allowanceRates[userId];
    if (rate !== undefined) {
      userService.updateUser(userId, { allowanceRate: rate });
    }
  };

  const renderItem = ({ item }: { item: User }) => {
    if (item.role === 'parent') return null;

    return (
      <View style={styles.userItem}>
        <Text>{item.name}</Text>
        <TextInput
          style={styles.input}
          value={String(allowanceRates[item.id] ?? item.allowanceRate)}
          onChangeText={(text) => setAllowanceRates({ ...allowanceRates, [item.id]: Number(text) })}
          keyboardType="numeric"
        />
        <Button title="Save" onPress={() => handleSave(item.id)} />
      </View>
    );
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Allowance Settings</Text>
      <FlatList
        data={members}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    width: 80,
    textAlign: 'right',
  },
});

export default AllowanceSettingsPanel;

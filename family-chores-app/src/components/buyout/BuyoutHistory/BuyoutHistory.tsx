import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TextInput } from 'react-native';
import { BuyoutTransaction } from '../../../models/BuyoutTransaction';

export type BuyoutFilter = {
  keyword: string;
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
};

interface BuyoutHistoryProps {
  transactions: BuyoutTransaction[];
  onFilter: (filter: BuyoutFilter) => void;
  onExport?: () => void;
}

const BuyoutHistory: React.FC<BuyoutHistoryProps> = ({ transactions, onFilter, onExport }) => {
  const [keyword, setKeyword] = useState('');

  const handleFilter = () => {
    onFilter({
      keyword,
      dateRange: { startDate: null, endDate: null }, // Date range filter not implemented yet
    });
  };

  const renderItem = ({ item }: { item: BuyoutTransaction }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.choreId}>Chore ID: {item.choreId}</Text>
      <Text>Date: {item.boughtOutAt.toLocaleDateString()}</Text>
      <Text style={styles.pointsSpent}>Cost: {item.pointsSpent} points</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buyout History</Text>
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search by chore ID..."
          value={keyword}
          onChangeText={setKeyword}
        />
        <Button title="Filter" onPress={handleFilter} />
      </View>
      {onExport && <Button title="Export" onPress={onExport} />}
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No buyout history.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: 'white',
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 10,
  },
  choreId: {
    fontWeight: 'bold',
  },
  pointsSpent: {
    color: '#E53935',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});

export default BuyoutHistory;

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { LeaderboardEntry } from '../../../models/LeaderboardEntry';
import { ILeaderboardService } from '../../../services/LeaderboardService';

interface LeaderboardDisplayProps {
  familyId: string;
  leaderboardService: ILeaderboardService;
}

export const LeaderboardDisplay: React.FC<LeaderboardDisplayProps> = ({ familyId, leaderboardService }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await leaderboardService.generateLeaderboard(familyId, 'weekly');
        setLeaderboard(data);
      } catch (err) {
        setError('Failed to load leaderboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [familyId, leaderboardService]);

  if (loading) {
    return <Text>Loading leaderboard...</Text>;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Leaderboard</Text>
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <Text>{item.position}. {item.userId}</Text>
            <Text>{item.totalPoints} pts</Text>
          </View>
        )}
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
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
});
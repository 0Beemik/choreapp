import React, { useState } from 'react';
import { View, Modal } from 'react-native';
import { PinEntry } from './PinEntry';
import { adminAuthService } from '../../../services';
import { AdminPanel } from '../AdminPanel/AdminPanel';
import { useFamily } from '../../../hooks/useFamily';
import { AdminSession } from '../../../models/AdminSession';

interface AdminLoginProps {
  visible: boolean;
  onClose: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ visible, onClose }) => {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [error, setError] = useState('');
  const { family, currentUser } = useFamily();

  const handlePinSubmit = async (pin: string) => {
    if (!family) {
      setError('Family data not loaded.');
      return;
    }
    if (!currentUser) {
      setError('User not logged in.');
      return;
    }
    try {
      const adminSession = await adminAuthService.authenticateAdmin(family.id, currentUser.id, pin);
      setSession(adminSession);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleLogout = () => {
    if (session) {
      adminAuthService.revokeAdminSession(session.id);
      setSession(null);
    }
    onClose();
  };

  return (
    <Modal testID="admin-login-modal" visible={visible} animationType="slide" onRequestClose={handleLogout}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {session ? (
          <AdminPanel onLogout={handleLogout} />
        ) : (
          <PinEntry onPinSubmit={handlePinSubmit} error={error} />
        )}
      </View>
    </Modal>
  );
};

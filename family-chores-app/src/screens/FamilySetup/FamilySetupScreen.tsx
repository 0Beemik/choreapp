import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/common/Input/Input';
import { Button } from '../../components/common/Button/Button';
import { useFamily } from '../../hooks/useFamily';
import { familyService } from '../../services/FamilyService'; // This should be injected
import { CreateUserRequest, UserRole } from '../../types';
import { DashboardScreenNavigationProp } from '../../types/navigation';
import { z } from 'zod';

const familyNameSchema = z.string().min(2, 'Family name must be at least 2 characters.');
const userNameSchema = z.string().min(2, 'Your name must be at least 2 characters.');
const ageSchema = z.number().min(18, 'You must be at least 18 to create a family.');

export const FamilySetupScreen: React.FC = () => {
  const [step, setStep] = useState(1);
  const [familyName, setFamilyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminAge, setAdminAge] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createFamily, loading } = useFamily(familyService);
  const navigation = useNavigation<DashboardScreenNavigationProp>();

  const handleNext = () => {
    if (step === 1) {
      const result = familyNameSchema.safeParse(familyName);
      if (!result.success) {
        setErrors({ familyName: result.error.errors[0].message });
        return;
      }
    }
    if (step === 2) {
      const nameResult = userNameSchema.safeParse(adminName);
      const ageResult = ageSchema.safeParse(parseInt(adminAge, 10));
      if (!nameResult.success || !ageResult.success) {
        setErrors({
          adminName: nameResult.success ? '' : nameResult.error.errors[0].message,
          adminAge: ageResult.success ? '' : ageResult.error.errors[0].message,
        });
        return;
      }
    }
    setErrors({});
    setStep(step + 1);
  };

  const handleSetup = async () => {
    const adminUser: CreateUserRequest = {
      name: adminName,
      age: parseInt(adminAge, 10),
      role: UserRole.PARENT,
      isAdmin: true,
    };
    const newFamily = await createFamily(familyName, adminUser);
    if (newFamily) {
      navigation.navigate('Dashboard', { familyId: newFamily.id });
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      {step === 1 && (
        <>
          <Text>Step 1: What's your family's name?</Text>
          <Input
            label="Family Name"
            value={familyName}
            onChangeText={setFamilyName}
            placeholder="e.g., The Smiths"
            error={errors.familyName}
          />
          <Button title="Next" onPress={handleNext} />
        </>
      )}
      {step === 2 && (
        <>
          <Text>Step 2: Tell us about yourself</Text>
          <Input
            label="Your Name"
            value={adminName}
            onChangeText={setAdminName}
            placeholder="e.g., John Doe"
            error={errors.adminName}
          />
          <Input
            label="Your Age"
            value={adminAge}
            onChangeText={setAdminAge}
            keyboardType="numeric"
            placeholder="e.g., 35"
            error={errors.adminAge}
          />
          <Button title="Next" onPress={handleNext} />
        </>
      )}
      {step === 3 && (
        <>
          <Text>Step 3: Ready to go?</Text>
          <Button
            title="Create Family"
            onPress={handleSetup}
            loading={loading}
          />
        </>
      )}
    </View>
  );
};

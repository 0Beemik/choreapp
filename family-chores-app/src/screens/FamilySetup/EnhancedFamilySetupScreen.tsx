import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { Input } from '../../components/common/Input/Input';
import { Button } from '../../components/common/Button/Button';
import { UserAvatar } from '../../components/profile/UserAvatar';
import { useFamily } from '../../hooks/useFamily';
import { familyService } from '../../services';
import { CreateUserRequest, UserRole, AvatarConfig, DEFAULT_AVATAR_CONFIG } from '../../types';
import { DashboardScreenNavigationProp } from '../../types/navigation';
import { z } from 'zod';

const familyNameSchema = z.string().min(2, 'Family name must be at least 2 characters.');
const userNameSchema = z.string().min(2, 'Name must be at least 2 characters.');
const ageSchema = z.number().min(18, 'Parent must be at least 18 years old.');
const pinSchema = z.string().min(4, 'PIN must be at least 4 digits.').max(8, 'PIN must be at most 8 digits.');

export const EnhancedFamilySetupScreen: React.FC = () => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1: Family Name
  const [familyName, setFamilyName] = useState('');

  // Step 2: Admin User
  const [adminName, setAdminName] = useState('');
  const [adminAge, setAdminAge] = useState('');
  const [adminAvatar, setAdminAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);

  // Step 3: Admin PIN
  const [adminPin, setAdminPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Step 4: Family Settings
  const [pointsPerChore, setPointsPerChore] = useState('10');
  const [buyoutPercentage, setBuyoutPercentage] = useState('150');
  const [maxBuyoutsPerMonth, setMaxBuyoutsPerMonth] = useState('4');
  const [rotationDay, setRotationDay] = useState<string>('sunday');

  // Step 5: Additional Members (Optional)
  const [additionalMembers, setAdditionalMembers] = useState<Array<{
    name: string;
    age: string;
    role: UserRole;
    avatar: AvatarConfig;
  }>>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAge, setNewMemberAge] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>(UserRole.CHILD);
  const [newMemberAvatar, setNewMemberAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);

  const { createFamily, loading } = useFamily(familyService);
  const navigation = useNavigation<DashboardScreenNavigationProp>();

  const validateStep = (currentStep: number): boolean => {
    setErrors({});

    if (currentStep === 1) {
      const result = familyNameSchema.safeParse(familyName);
      if (!result.success) {
        setErrors({ familyName: result.error.errors[0].message });
        return false;
      }
    }

    if (currentStep === 2) {
      const nameResult = userNameSchema.safeParse(adminName);
      const ageResult = ageSchema.safeParse(parseInt(adminAge, 10));
      if (!nameResult.success || !ageResult.success) {
        setErrors({
          adminName: nameResult.success ? '' : nameResult.error.errors[0].message,
          adminAge: ageResult.success ? '' : ageResult.error.errors[0].message,
        });
        return false;
      }
    }

    if (currentStep === 3) {
      const pinResult = pinSchema.safeParse(adminPin);
      if (!pinResult.success) {
        setErrors({ adminPin: pinResult.error.errors[0].message });
        return false;
      }
      if (adminPin !== confirmPin) {
        setErrors({ confirmPin: 'PINs do not match.' });
        return false;
      }
    }

    if (currentStep === 4) {
      const points = parseInt(pointsPerChore, 10);
      const buyout = parseInt(buyoutPercentage, 10);
      const buyouts = parseInt(maxBuyoutsPerMonth, 10);

      if (isNaN(points) || points < 1 || points > 100) {
        setErrors({ pointsPerChore: 'Points must be between 1 and 100.' });
        return false;
      }
      if (isNaN(buyout) || buyout < 100 || buyout > 500) {
        setErrors({ buyoutPercentage: 'Buyout percentage must be between 100 and 500.' });
        return false;
      }
      if (isNaN(buyouts) || buyouts < 0 || buyouts > 20) {
        setErrors({ maxBuyoutsPerMonth: 'Max buyouts must be between 0 and 20.' });
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleAddMember = () => {
    const nameResult = userNameSchema.safeParse(newMemberName);
    const ageNum = parseInt(newMemberAge, 10);
    const ageResult = z.number().min(1).max(120).safeParse(ageNum);

    if (!nameResult.success || !ageResult.success) {
      setErrors({
        newMemberName: nameResult.success ? '' : nameResult.error.errors[0].message,
        newMemberAge: ageResult.success ? '' : 'Age must be between 1 and 120.',
      });
      return;
    }

    setAdditionalMembers([
      ...additionalMembers,
      {
        name: newMemberName,
        age: newMemberAge,
        role: newMemberRole,
        avatar: newMemberAvatar,
      },
    ]);

    // Reset form
    setNewMemberName('');
    setNewMemberAge('');
    setNewMemberRole(UserRole.CHILD);
    setNewMemberAvatar(DEFAULT_AVATAR_CONFIG);
    setErrors({});
  };

  const handleRemoveMember = (index: number) => {
    setAdditionalMembers(additionalMembers.filter((_, i) => i !== index));
  };

  const handleSetup = async () => {
    const adminUser: CreateUserRequest = {
      name: adminName,
      age: parseInt(adminAge, 10),
      role: UserRole.PARENT,
      isAdmin: true,
      avatarConfig: adminAvatar,
    };

    // TODO: Need to pass additional settings (PIN, points, rotation day) to createFamily
    // For now, createFamily only accepts familyName and adminUser
    // We'll need to update FamilyService to accept these additional parameters
    // or update them after family creation

    const newFamily = await createFamily(familyName, adminUser);

    if (newFamily) {
      // TODO: Update family settings with PIN, points, rotation day
      // TODO: Create additional family members

      navigation.navigate('Dashboard', { familyId: newFamily.id });
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map((s) => (
        <View
          key={s}
          style={[
            styles.stepDot,
            step >= s && styles.stepDotActive,
            step === s && styles.stepDotCurrent,
          ]}
        />
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderStepIndicator()}

        {/* Step 1: Family Name */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Welcome! 👋</Text>
            <Text style={styles.subtitle}>What's your family's name?</Text>
            <Input
              label="Family Name"
              value={familyName}
              onChangeText={setFamilyName}
              placeholder="e.g., The Smiths"
              error={errors.familyName}
            />
            <Text style={styles.hint}>
              This will be displayed on the dashboard and used to identify your family.
            </Text>
            <Button title="Next" onPress={handleNext} />
          </View>
        )}

        {/* Step 2: Admin User */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>You'll be the family admin</Text>

            <View style={styles.avatarSection}>
              <Text style={styles.label}>Your Avatar</Text>
              <UserAvatar
                config={adminAvatar}
                size={100}
                editable
                onConfigChange={setAdminAvatar}
              />
              <Text style={styles.hint}>Tap to customize your avatar</Text>
            </View>

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

            <View style={styles.buttonRow}>
              <Button title="Back" onPress={handleBack} variant="secondary" />
              <Button title="Next" onPress={handleNext} />
            </View>
          </View>
        )}

        {/* Step 3: Admin PIN */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Set Your Admin PIN 🔐</Text>
            <Text style={styles.subtitle}>
              This PIN protects admin features like managing chores and adjusting points
            </Text>

            <Input
              label="Create PIN"
              value={adminPin}
              onChangeText={setAdminPin}
              keyboardType="numeric"
              secureTextEntry
              placeholder="4-8 digits"
              error={errors.adminPin}
              maxLength={8}
            />
            <Input
              label="Confirm PIN"
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="numeric"
              secureTextEntry
              placeholder="Re-enter PIN"
              error={errors.confirmPin}
              maxLength={8}
            />

            <Text style={styles.hint}>
              💡 Remember this PIN! You'll need it to access admin features.
            </Text>

            <View style={styles.buttonRow}>
              <Button title="Back" onPress={handleBack} variant="secondary" />
              <Button title="Next" onPress={handleNext} />
            </View>
          </View>
        )}

        {/* Step 4: Family Settings */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Family Settings ⚙️</Text>
            <Text style={styles.subtitle}>Customize how your family earns and spends points</Text>

            <Input
              label="Points Per Chore"
              value={pointsPerChore}
              onChangeText={setPointsPerChore}
              keyboardType="numeric"
              placeholder="Default: 10"
              error={errors.pointsPerChore}
            />
            <Text style={styles.hint}>Base points earned for completing a chore</Text>

            <Input
              label="Buyout Cost (%)"
              value={buyoutPercentage}
              onChangeText={setBuyoutPercentage}
              keyboardType="numeric"
              placeholder="Default: 150"
              error={errors.buyoutPercentage}
            />
            <Text style={styles.hint}>
              Percentage of points to buyout a chore (150% = 15 points to skip a 10-point chore)
            </Text>

            <Input
              label="Max Buyouts Per Month"
              value={maxBuyoutsPerMonth}
              onChangeText={setMaxBuyoutsPerMonth}
              keyboardType="numeric"
              placeholder="Default: 4"
              error={errors.maxBuyoutsPerMonth}
            />
            <Text style={styles.hint}>Limit buyouts to prevent abuse</Text>

            <Text style={styles.label}>Chore Rotation Day</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={rotationDay}
                onValueChange={(value) => setRotationDay(value)}
                style={styles.picker}
              >
                <Picker.Item label="Sunday" value="sunday" />
                <Picker.Item label="Monday" value="monday" />
                <Picker.Item label="Tuesday" value="tuesday" />
                <Picker.Item label="Wednesday" value="wednesday" />
                <Picker.Item label="Thursday" value="thursday" />
                <Picker.Item label="Friday" value="friday" />
                <Picker.Item label="Saturday" value="saturday" />
              </Picker>
            </View>
            <Text style={styles.hint}>Chores will automatically rotate on this day</Text>

            <View style={styles.buttonRow}>
              <Button title="Back" onPress={handleBack} variant="secondary" />
              <Button title="Next" onPress={handleNext} />
            </View>
          </View>
        )}

        {/* Step 5: Add Family Members (Optional) */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Add Family Members (Optional)</Text>
            <Text style={styles.subtitle}>
              You can add more family members now or later from the admin panel
            </Text>

            {additionalMembers.length > 0 && (
              <View style={styles.membersList}>
                <Text style={styles.label}>Added Members:</Text>
                {additionalMembers.map((member, index) => (
                  <View key={index} style={styles.memberItem}>
                    <UserAvatar config={member.avatar} size={40} />
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberDetails}>
                        Age {member.age} • {member.role}
                      </Text>
                    </View>
                    <Button
                      title="Remove"
                      onPress={() => handleRemoveMember(index)}
                      variant="secondary"
                      size="small"
                    />
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.label}>Add New Member</Text>
            <View style={styles.avatarSection}>
              <UserAvatar
                config={newMemberAvatar}
                size={80}
                editable
                onConfigChange={setNewMemberAvatar}
              />
            </View>

            <Input
              label="Name"
              value={newMemberName}
              onChangeText={setNewMemberName}
              placeholder="e.g., Sarah"
              error={errors.newMemberName}
            />
            <Input
              label="Age"
              value={newMemberAge}
              onChangeText={setNewMemberAge}
              keyboardType="numeric"
              placeholder="e.g., 10"
              error={errors.newMemberAge}
            />

            <Text style={styles.label}>Role</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newMemberRole}
                onValueChange={(value) => setNewMemberRole(value as UserRole)}
                style={styles.picker}
              >
                <Picker.Item label="Child" value={UserRole.CHILD} />
                <Picker.Item label="Parent" value={UserRole.PARENT} />
              </Picker>
            </View>

            <Button title="Add Member" onPress={handleAddMember} variant="secondary" />

            <View style={styles.buttonRow}>
              <Button title="Back" onPress={handleBack} variant="secondary" />
              <Button
                title={additionalMembers.length > 0 ? 'Create Family' : 'Skip & Create Family'}
                onPress={handleSetup}
                loading={loading}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  stepDotActive: {
    backgroundColor: '#007AFF',
  },
  stepDotCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  stepContainer: {
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: -8,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 16,
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: Platform.OS === 'ios' ? 150 : 50,
  },
  membersList: {
    gap: 8,
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  memberDetails: {
    fontSize: 14,
    color: '#666',
  },
});

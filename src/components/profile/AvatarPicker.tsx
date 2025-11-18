import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Avatar from 'react-native-avataaars';
import {
  AvatarConfig,
  DEFAULT_AVATAR_CONFIG,
  KID_AVATAR_PRESETS,
  TopType,
  AccessoriesType,
  HairColor,
  FacialHairType,
  ClotheType,
  ClotheColor,
  EyeType,
  EyebrowType,
  MouthType,
  SkinColor,
} from '../../types/avatar';

interface AvatarPickerProps {
  visible: boolean;
  initialConfig?: AvatarConfig;
  onSave: (config: AvatarConfig) => void;
  onCancel: () => void;
  showPresets?: boolean;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  visible,
  initialConfig = DEFAULT_AVATAR_CONFIG,
  onSave,
  onCancel,
  showPresets = true,
}) => {
  const [config, setConfig] = useState<AvatarConfig>(initialConfig);

  const updateConfig = <K extends keyof AvatarConfig>(
    key: K,
    value: AvatarConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (presetKey: string) => {
    setConfig(KID_AVATAR_PRESETS[presetKey]);
  };

  const handleSave = () => {
    onSave(config);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.button}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Customize Avatar</Text>
          <TouchableOpacity onPress={handleSave} style={styles.button}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Avatar Preview */}
          <View style={styles.previewContainer}>
            <Avatar size={120} {...config} />
            <Text style={styles.previewLabel}>Preview</Text>
          </View>

          {/* Presets */}
          {showPresets && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Presets</Text>
              <View style={styles.presetRow}>
                {Object.keys(KID_AVATAR_PRESETS).map((key) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => applyPreset(key)}
                    style={styles.presetButton}
                  >
                    <Avatar size={60} {...KID_AVATAR_PRESETS[key]} />
                    <Text style={styles.presetLabel}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Skin Tone */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skin Tone</Text>
            <Picker
              selectedValue={config.skinColor}
              onValueChange={(value) => updateConfig('skinColor', value as SkinColor)}
              style={styles.picker}
            >
              <Picker.Item label="Tanned" value="Tanned" />
              <Picker.Item label="Yellow" value="Yellow" />
              <Picker.Item label="Pale" value="Pale" />
              <Picker.Item label="Light" value="Light" />
              <Picker.Item label="Brown" value="Brown" />
              <Picker.Item label="Dark Brown" value="DarkBrown" />
              <Picker.Item label="Black" value="Black" />
            </Picker>
          </View>

          {/* Hairstyle */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hairstyle</Text>
            <Picker
              selectedValue={config.topType}
              onValueChange={(value) => updateConfig('topType', value as TopType)}
              style={styles.picker}
            >
              <Picker.Item label="No Hair" value="NoHair" />
              <Picker.Item label="Short Flat" value="ShortHairShortFlat" />
              <Picker.Item label="Short Curly" value="ShortHairShortCurly" />
              <Picker.Item label="Short Wavy" value="ShortHairShortWaved" />
              <Picker.Item label="Short Round" value="ShortHairShortRound" />
              <Picker.Item label="Long Straight" value="LongHairStraight" />
              <Picker.Item label="Long Curly" value="LongHairCurly" />
              <Picker.Item label="Long Bob" value="LongHairBob" />
              <Picker.Item label="Long Bun" value="LongHairBun" />
              <Picker.Item label="Hat" value="Hat" />
            </Picker>
          </View>

          {/* Hair Color */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hair Color</Text>
            <Picker
              selectedValue={config.hairColor}
              onValueChange={(value) => updateConfig('hairColor', value as HairColor)}
              style={styles.picker}
            >
              <Picker.Item label="Auburn" value="Auburn" />
              <Picker.Item label="Black" value="Black" />
              <Picker.Item label="Blonde" value="Blonde" />
              <Picker.Item label="Golden Blonde" value="BlondeGolden" />
              <Picker.Item label="Brown" value="Brown" />
              <Picker.Item label="Dark Brown" value="BrownDark" />
              <Picker.Item label="Pastel Pink" value="PastelPink" />
              <Picker.Item label="Platinum" value="Platinum" />
              <Picker.Item label="Red" value="Red" />
              <Picker.Item label="Silver Gray" value="SilverGray" />
            </Picker>
          </View>

          {/* Accessories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accessories</Text>
            <Picker
              selectedValue={config.accessoriesType}
              onValueChange={(value) => updateConfig('accessoriesType', value as AccessoriesType)}
              style={styles.picker}
            >
              <Picker.Item label="None" value="Blank" />
              <Picker.Item label="Round Glasses" value="Round" />
              <Picker.Item label="Prescription Glasses" value="Prescription01" />
              <Picker.Item label="Sunglasses" value="Sunglasses" />
              <Picker.Item label="Wayfarers" value="Wayfarers" />
            </Picker>
          </View>

          {/* Eyes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eyes</Text>
            <Picker
              selectedValue={config.eyeType}
              onValueChange={(value) => updateConfig('eyeType', value as EyeType)}
              style={styles.picker}
            >
              <Picker.Item label="Default" value="Default" />
              <Picker.Item label="Happy" value="Happy" />
              <Picker.Item label="Wink" value="Wink" />
              <Picker.Item label="Hearts" value="Hearts" />
              <Picker.Item label="Surprised" value="Surprised" />
              <Picker.Item label="Squint" value="Squint" />
            </Picker>
          </View>

          {/* Eyebrows */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eyebrows</Text>
            <Picker
              selectedValue={config.eyebrowType}
              onValueChange={(value) => updateConfig('eyebrowType', value as EyebrowType)}
              style={styles.picker}
            >
              <Picker.Item label="Default" value="Default" />
              <Picker.Item label="Raised Excited" value="RaisedExcited" />
              <Picker.Item label="Sad Concerned" value="SadConcerned" />
              <Picker.Item label="Up Down" value="UpDown" />
            </Picker>
          </View>

          {/* Mouth */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mouth</Text>
            <Picker
              selectedValue={config.mouthType}
              onValueChange={(value) => updateConfig('mouthType', value as MouthType)}
              style={styles.picker}
            >
              <Picker.Item label="Smile" value="Smile" />
              <Picker.Item label="Default" value="Default" />
              <Picker.Item label="Twinkle" value="Twinkle" />
              <Picker.Item label="Eating" value="Eating" />
              <Picker.Item label="Serious" value="Serious" />
              <Picker.Item label="Tongue" value="Tongue" />
            </Picker>
          </View>

          {/* Clothes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clothes</Text>
            <Picker
              selectedValue={config.clotheType}
              onValueChange={(value) => updateConfig('clotheType', value as ClotheType)}
              style={styles.picker}
            >
              <Picker.Item label="Hoodie" value="Hoodie" />
              <Picker.Item label="T-Shirt" value="ShirtCrewNeck" />
              <Picker.Item label="Scoop Neck" value="ShirtScoopNeck" />
              <Picker.Item label="Overall" value="Overall" />
              <Picker.Item label="Sweater" value="CollarSweater" />
            </Picker>
          </View>

          {/* Clothes Color */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clothes Color</Text>
            <Picker
              selectedValue={config.clotheColor}
              onValueChange={(value) => updateConfig('clotheColor', value as ClotheColor)}
              style={styles.picker}
            >
              <Picker.Item label="Black" value="Black" />
              <Picker.Item label="Blue" value="Blue01" />
              <Picker.Item label="Pastel Blue" value="PastelBlue" />
              <Picker.Item label="Pastel Green" value="PastelGreen" />
              <Picker.Item label="Pastel Orange" value="PastelOrange" />
              <Picker.Item label="Pastel Red" value="PastelRed" />
              <Picker.Item label="Pastel Yellow" value="PastelYellow" />
              <Picker.Item label="Pink" value="Pink" />
              <Picker.Item label="Red" value="Red" />
              <Picker.Item label="White" value="White" />
            </Picker>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  saveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f9f9f9',
  },
  previewLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  picker: {
    height: Platform.OS === 'ios' ? 150 : 50,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  presetButton: {
    alignItems: 'center',
    margin: 8,
  },
  presetLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
});

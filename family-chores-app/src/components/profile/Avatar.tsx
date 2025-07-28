
import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, Text, Button } from 'react-native';
import Avatar from 'react-native-avataaars';

const UserAvatar = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [avatarProps, setAvatarProps] = useState({
    size: 100,
    avatarStyle: 'Circle',
    topType: 'LongHairMiaWallace',
    accessoriesType: 'Prescription02',
    hairColor: 'BrownDark',
    facialHairType: 'Blank',
    clotheType: 'Hoodie',
    clotheColor: 'PastelBlue',
    eyeType: 'Happy',
    eyebrowType: 'Default',
    mouthType: 'Smile',
    skinColor: 'Light',
  });

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Avatar {...avatarProps} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Edit Avatar</Text>
            {/* Add your avatar editing UI here */}
            <Button
              title="Close"
              onPress={() => setModalVisible(!modalVisible)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default UserAvatar;

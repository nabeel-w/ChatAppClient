/* eslint-disable */

import React, { useRef, useState } from 'react';
import { View, Pressable, Text, Modal, StyleSheet, TextStyle, ViewStyle, Alert} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';


interface PressableMessageProp{
    message: string,
    style: {text: TextStyle; container: ViewStyle}
}
interface buttonLayout{
    x:number,
    y:number,
    width: number,
    height: number,
    X: number
}

const PressableMessage = ({ message, style }:PressableMessageProp) => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [buttonLayout, setButtonLayout] = useState<buttonLayout>();
  const buttonRef = useRef<View>(null);

  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);

    if (buttonRef.current) {
        buttonRef.current.measure((x, y, width, height, pageX, pageY) => {
            setButtonLayout({ x: pageX, y: pageY, width, height, X: x });
          })
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(message);
    toggleDropdown();
  };

  const handleReport = () =>{
    toggleDropdown();
    Alert.alert('Report', 'Do you want to report this message', [
      {
        text: 'Yes',
        onPress: () => console.log('Yes Pressed'),
      },
      {
        text: 'No',
        onPress: () => console.log('No Pressed'),
        style: 'cancel'
      },
    ]);
  }
  

  return (
    <>
      <Pressable onLongPress={toggleDropdown} ref={buttonRef}>
        <Text style={style.text}>{message}</Text>
      </Pressable>

      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleDropdown}
      >
        <View style={[styles.dropdownContainer, style.container, { top: (buttonLayout?.y || 0) + (buttonLayout?.height || 0) }]}>
          <Pressable style={styles.dropdownItem} onPress={copyToClipboard}>
            <Text style={styles.itemText}>Copy</Text>
          </Pressable>
          <Pressable style={styles.dropdownItem} onPress={handleReport}>
            <Text style={styles.itemText}>Report</Text>
          </Pressable>
          <Pressable style={styles.dropdownItem} onPress={toggleDropdown}>
            <Text style={styles.itemText}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    backgroundColor: '#fff',
    borderColor: '#fcedde',
    borderWidth: 4,
    padding: 5,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    position: 'absolute',
    alignSelf: 'flex-start',
  },
  dropdownItem: {
    padding: 6,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    margin: 4,
  },
  dropdownItemLast:{
    fontSize: 18,
    paddingHorizontal: 6,
  },
  itemText: {
    fontSize: 18,
  }
});

export default PressableMessage;

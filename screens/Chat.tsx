/* eslint-disable */

import { Alert, KeyboardAvoidingView, PermissionsAndroid, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
import ChatMessages from './components/ChatMessages';
import { Socket } from 'socket.io-client';
import { generateKeys, generateSharedSecret } from '../utils/createKeys';
import { FCM_SERVER_KEY, REST_URI } from "@env"
import bigInt from 'big-integer';
import CryptoJS from "react-native-crypto-js";
import Tags from "react-native-tags";
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { useSocket } from '../utils/SocketContext';



const getFCMCode = async () => {
  try {
    const Token = await AsyncStorage.getItem('FCM');
    if (Token !== undefined) return Token;
    else {
      const Code = await messaging().getToken();
      return Code;
    }
  } catch (error) {
    console.error('Error fetching FCM token:', error);
  }
}


type Room = {
  name: String,
  users: Array<String | undefined>
}

type TextObj = {
  message: string,
  recived: Boolean,
  isUrl: Boolean,
  userId: string
}


async function storeUserData(fcmCurrentToken: string) {
  const Token = await AsyncStorage.getItem('FCM');
  const andriodId = await DeviceInfo.getAndroidId();
  const url = `${REST_URI}api/user/token`
  const data = { androidId: andriodId, fcmToken: fcmCurrentToken };
  if (Token === fcmCurrentToken) return;
  if (Token === null) {
    //Store FCM code and andriodID to backend
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
    try {
      await AsyncStorage.setItem('FCM', fcmCurrentToken);
      const res = await fetch(url, options);
    } catch (error) {
      const option = {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      };
      try {
        const res = await fetch(url, option);
      } catch (error) {
        console.log(error);
      }
    }
  }
  else {
    //Update FCM code and andriodID to backend
    const options = {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
    try {
      await AsyncStorage.setItem('FCM', fcmCurrentToken);
      const res = await fetch(url, options);
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  }
}

export default function Chat() {
  const [message, setMessage] = useState('');
  const [interest, setInterest] = useState<String[]>();
  const [commanInt, setCommanInt] = useState<String[]>([]);
  const [room, setRoom] = useState<Room>();
  const [recepient, setRecepient] = useState<String>();
  const [ended, setEnded] = useState(false);
  const [text, setText] = useState<TextObj[]>([]);
  const [isTyping, setTyping] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [sharedSecret, setSharedSecret] = useState<string>();
  const [scroll, setScroll] = useState(false);
  const navigation = useNavigation();

  const userKey = generateKeys();
  const  { socket }  = useSocket() as { socket: Socket };

  const sendNotification = async (message: string, title: string) => {
    const fcmToken = await messaging().getToken();
    storeUserData(fcmToken);

    const notification = {
      to: fcmToken,
      notification: {
        title: title,
        body: message,
        icon: 'ic_stat_send_786306'
      },
    };

    await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FCM_SERVER_KEY}`,
      },
      body: JSON.stringify(notification),
    });
  };

  function isLink(text: string): boolean {
    const urlRegex = /(https?:\/\/[^\s]+)/;
    return urlRegex.test(text);
  }

  function handleNewChat() {
    if (connecting) return;
    const intArray: Array<String> = interest?.map(int => int.toLowerCase().trim()) || [];
    socket.emit('joinRandomRoom', intArray);
    console.log(intArray);
    setText([]);
    setEnded(false);
    setConnecting(true);
  }

  function handleEndChat() {
    socket.emit('leaveRoom');
    setRoom(undefined);
    setRecepient(undefined);
    setCommanInt([]);
  }

  function handleBlur() {
    if (recepient === undefined) return;
    socket.emit('isTyping', recepient, false);
  }

  function handleFocus() {
    setScroll(true);
    if (recepient === undefined) return;
    socket.emit('isTyping', recepient, true);
  }

  function handleSend() {
    if (message.trim() === '' || recepient === undefined || connecting || sharedSecret === undefined) return;
    setText((prev) => {
      const text:TextObj = { message: message.trim(), recived: false, isUrl: isLink(message), userId: socket.id as string }
      return [...prev, text];
    });
    const encryptedMes = CryptoJS.AES.encrypt(message.trim(), sharedSecret).toString();
    socket.emit('sendMessage', encryptedMes, recepient);
    setMessage('');
  }

  useEffect(() => {
    const handleRecive = (msg: string) => {
      if (sharedSecret === undefined) return
      const decryptedMsg = CryptoJS.AES.decrypt(msg, sharedSecret).toString(CryptoJS.enc.Utf8);
      setText((prev) => {
        const text:TextObj={ message: decryptedMsg, recived: true, isUrl: isLink(decryptedMsg),  userId: recepient as string }
        return [...prev, text];
      });
      setTyping(false);
      sendNotification(decryptedMsg, 'New Message');
    };

    const handleJoinRoom = (users: String[], roomName: String, commanIntrests: String[]) => {
      setRoom({
        name: roomName,
        users: [...users],
      });
      if (commanIntrests.length !== 0) setCommanInt([...commanIntrests]);
      const recpId: String[] = users.filter(user => user !== socket.id);
      setRecepient(recpId[0]);
      socket.emit('exchangeKey', userKey.publicKey.toString(), recpId[0]);
    };

    const handleNewRoom = (roomName: string) => {
      setRoom({
        name: roomName,
        users: [socket.id],
      });
    };

    const handleDisconnect = () => {
      setRoom(undefined);
      setRecepient(undefined);
      setCommanInt([]);
      setEnded(true);
      setTyping(false);
      setConnecting(false);
      sendNotification('Start a new Chat', 'Stranger Disconnected')
    };

    const handleError = () => {
      setRoom(undefined);
      setRecepient(undefined);
      setCommanInt([]);
      setTyping(false);
      setConnecting(false);
      Alert.alert('Error', 'There have been some server error try later', [
        {
          text: 'Try Again',
          onPress: () => { socket.connect() },
        },
      ])
    }

    const handleTyping = (Typing: boolean) => {
      setTyping(Typing);
    };

    const handleKeyExchange = (publicKey: string) => {
      const receivedKey = bigInt(publicKey);
      const secret = generateSharedSecret(userKey.privateKey, receivedKey, userKey.prime);
      setSharedSecret(secret);
      setConnecting(false);
      sendNotification('Tap To Start Chatting', 'Stranger Connected')
    };

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
    });

    const checkPermission = async () => {
      const res = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (!res) PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    const handleConnection = async () => {
      console.log("connection estasblished");
      const fcm = await getFCMCode();
      socket.emit('userCredential', fcm);
    }

    socket.on('newMessage', handleRecive);
    socket.on('roomJoined', handleJoinRoom);
    socket.on('roomCreated', handleNewRoom);
    socket.on('roomDestroyed', handleDisconnect);
    socket.on('disconnect', handleError);
    socket.on('typing', handleTyping);
    socket.on('handleKey', handleKeyExchange);
    socket.on('connect', handleConnection);
    return () => {
      socket.off('newMessage', handleRecive);
      socket.off('roomJoined', handleJoinRoom);
      socket.off('roomCreated', handleNewRoom);
      socket.off('roomDestroyed', handleDisconnect);
      socket.off('disconnect', handleError);
      socket.off('typing', handleTyping);
      socket.off('handleKey', handleKeyExchange);
      socket.off('connect', handleConnection);
      unsubscribe
      checkPermission
    };
  }, [sharedSecret]);


  return (
    <KeyboardAvoidingView style={styles.container}>
      <ChatMessages scroll={scroll} text={text} recepient={recepient} interests={commanInt} ended={ended} isTyping={isTyping} connecting={connecting} />
      <View style={styles.intContainer}>
        <Tags
          initialText=''
          textInputProps={{
            placeholder: "Interests: Programming Music Gaming",

          }}
          onChangeTags={(txt) => setInterest(txt)}
          onTagPress={(index, tagLabel, event, deleted) => { }}
          renderTag={({ tag, index, onPress, deleteTagOnPress, readonly }) => (
            <TouchableOpacity key={`${tag}-${index}`} onPress={onPress} style={styles.tagStyle}>
              <Text style={styles.tagText}>{tag}</Text>
              <Ionicons name='close-circle-outline' size={20} color={'red'} />
            </TouchableOpacity>
          )}
          inputStyle={styles.intInterest}
        />
      </View>
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.button} onPress={room === undefined ? handleNewChat : handleEndChat}>
          {room === undefined ? <Text style={styles.buttonText}>New Chat</Text>
            : <Text style={styles.buttonText}>End Chat</Text>}
        </TouchableOpacity>
        <View style={styles.inputFeild}>
          <TextInput onChangeText={(txt) => setMessage(txt)} style={styles.textInput} onFocus={handleFocus} onBlur={handleBlur}
            numberOfLines={undefined} multiline placeholder="Enter Your Message" value={message}

          />
          <TouchableOpacity onPress={handleSend}>
            <Ionicons name="send" size={28} style={styles.buttonIcon} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e68627',
    padding: 10,
    paddingTop: 15,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fcedde',
  },
  button: {
    justifyContent: 'center',
    backgroundColor: '#e68627',
    padding: 8,
    marginHorizontal: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 8,
    fontSize: 18,
  },
  textInput: {
    width: '80%',
    maxHeight: 56,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 18,
  },
  buttonIcon: {
    padding: 10,
    alignItems: 'center',
    borderRadius: 50,
    backgroundColor: '#e68627',
    justifyContent: 'center',
    color: '#FFF'
  },
  intContainer: {
    display: 'flex',
    padding: 6,
    margin: 6,
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 0.5,
  },
  interest: {
    flexGrow: 1,
    fontSize: 16,
    maxHeight: 48,
  },
  inputFeild: {
    width: '73%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.7,
    borderRadius: 8,
    borderTopRightRadius: 50,
    borderBottomEndRadius: 50,
    paddingVertical: 11,
  },
  intInterest: {
    width: '100%',
    height: '100%',
    fontSize: 18,
    backgroundColor: 'white',
    borderRadius: 0,
  },
  tagStyle: {
    flexDirection: 'row',
    width: 'auto',
    backgroundColor: '#e68627',
    borderRadius: 8,
    margin: 6,
    padding: 6,
    justifyContent: 'center',
  },
  tagText: {
    color: '#FFF',
    fontSize: 18,
    marginEnd: 5,
  }
});

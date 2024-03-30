/* eslint-disable */

import { KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
import ChatMessages from './components/ChatMessages';
import io from 'socket.io-client';
import { generateKeys, generateSharedSecret } from '../utils/createKeys';
import { SOCKET_URI, FCM_SERVER_KEY } from "@env"
import bigInt from 'big-integer';
import CryptoJS from "react-native-crypto-js";


const url: string = SOCKET_URI;

const socket = io(url);

type Room = {
  name: String,
  users: Array<String | undefined>
}

type TextObj = {
  message: String,
  recived: Boolean,
}

export default function Chat() {
  const [message, setMessage] = useState('');
  const [interests, setInterests] = useState('');
  const [commanInt, setCommanInt] = useState<String[]>([]);
  const [room, setRoom] = useState<Room>();
  const [recepient, setRecepient] = useState<String>();
  const [ended, setEnded] = useState(false);
  const [text, setText] = useState<TextObj[]>([]);
  const [isTyping, setTyping] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [sharedSecret, setSharedSecret] = useState<string>();

  const userKey = generateKeys();
  
  const sendNotification = async (message: string, title: string) => {
    const fcmToken = await messaging().getToken();
    
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

  function handleNewChat() {
    if(connecting) return;
    const intArray: Array<String> = interests.split(',').map((interest) => interest.trim());
    socket.emit('joinRandomRoom', intArray);
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
    if (recepient === undefined) return;
    console.log('Keyboard in Focus');
    socket.emit('isTyping', recepient, true);
  }

  function handleSend() {
    if (message === '' || recepient === undefined || connecting || sharedSecret === undefined) return;
    setText((prev) => {
      return [...prev, { message: message, recived: false }];
    });
    const encryptedMes=CryptoJS.AES.encrypt(message,sharedSecret).toString();
    socket.emit('sendMessage', encryptedMes, recepient);
    setMessage('');
  }

  useEffect(() => {
    const handleRecive = (msg: string) => {
      if(sharedSecret===undefined) return
      const decryptedMsg = CryptoJS.AES.decrypt(msg,sharedSecret).toString(CryptoJS.enc.Utf8);
      setText((prev) => {
        return [...prev, { message: decryptedMsg, recived: true }];
      });
      setTyping(false);
      sendNotification(decryptedMsg,'New Message');
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
      sendNotification('Start a new Chat','Stranger Disconnected')
    };

    const handleTyping = (Typing: boolean) => {
      setTyping(Typing);
    };

    const handleKeyExchange = (publicKey: string) => {
      const receivedKey = bigInt(publicKey);
      const secret = generateSharedSecret(userKey.privateKey,receivedKey,userKey.prime);
      setSharedSecret(secret);
      setConnecting(false);
      sendNotification('Tap To Start Chatting','Stranger Connected')
    };

    socket.on('newMessage', handleRecive);
    socket.on('roomJoined', handleJoinRoom);
    socket.on('roomCreated', handleNewRoom);
    socket.on('roomDestroyed', handleDisconnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('typing', handleTyping);
    socket.on('handleKey', handleKeyExchange);
    return () => {
      socket.off('newMessage', handleRecive);
      socket.off('roomJoined', handleJoinRoom);
      socket.off('roomCreated', handleNewRoom);
      socket.off('roomDestroyed', handleDisconnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('typing', handleTyping);
      socket.off('handleKey', handleKeyExchange);
    };
  }, [sharedSecret]);


  return (
    <KeyboardAvoidingView style={styles.container}>
      <ChatMessages text={text} recepient={recepient} interests={commanInt} ended={ended} isTyping={isTyping} connecting={connecting} />
      <View style={styles.intContainer}>
        <TextInput onChangeText={(txt) => setInterests(txt)} style={styles.interest} multiline
          numberOfLines={undefined} placeholder="Interests: 'Programming, Guitar, Music'" value={interests} />
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
    flexDirection: 'row',
    padding: 6,
    margin: 6,
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
});

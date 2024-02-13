/* eslint-disable prettier/prettier */

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import React, { useRef } from 'react';
import IsTyping from './IsTyping';

type TextObj = {
  message: String,
  recived: Boolean,
}

interface ChatMessagesProps {
  text: TextObj[];
  recepient?: String|undefined;
  interests: String[];
  ended: boolean;
  isTyping: boolean;
  connecting: boolean;
}


const ChatMessages: React.FC<ChatMessagesProps> = ({text, recepient, interests, ended, isTyping, connecting}) => {

  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: false })
    }
  };

  const handleContentSizeChange = () => {
    scrollToBottom();
  };

  return (
    <ScrollView style={styles.container} ref={scrollViewRef} onContentSizeChange={handleContentSizeChange} contentContainerStyle={{ flexGrow: 1, paddingBottom: 22 }}>
      {connecting ? <Text style={styles.mutedTitle}>Connecting with a Stranger</Text> : recepient === undefined ? <Text style={styles.mutedTitle}>Connect with a Stranger</Text> : <Text style={styles.mutedTitle}>Stranger Connected</Text>}
      {(interests[0] !== '' && interests.length !== 0) && <Text style={styles.mutedDesc}>You both like {interests.map(interest=>`${interest} `)}</Text>}
      {text.map((txt,index) => (
        !txt.recived ?
          <View style={styles.sentText} key={index}>
            <Text style={styles.textSent}>{txt.message}</Text>
          </View> :
          <View style={styles.recivedText} key={index}>
            <Text style={styles.textRecived}>{txt.message}</Text>
          </View>
      ))}
      {isTyping && <IsTyping />}
      {ended && <Text style={styles.footerChat}>Chat Ended</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    elevation: 3,
    paddingHorizontal: 10,
    paddingVertical: 15,
    margin: 6,
  },
  sentText: {
    maxWidth: '60%',
    alignSelf: 'flex-end',
    padding: 8,
    backgroundColor: '#e68627',
    borderRadius: 8,
    marginVertical: 4,
    textAlign: 'right',
  },
  recivedText: {
    maxWidth: '60%',
    alignSelf: 'flex-start',
    padding: 8,
    marginVertical: 4,
    backgroundColor: '#fcedde',
    borderRadius: 8,
  },
  textSent: {
    fontSize: 18,
    textAlign: 'left',
    color: '#fff',
  },
  textRecived: {
    fontSize: 18,
    textAlign: 'left',
  },
  mutedTitle: {
    fontSize: 20,
    fontWeight: '400',
    textAlign: 'center',
    paddingBottom: 8,
  },
  mutedDesc: {
    fontSize: 16,
    textAlign: 'center',
    paddingBottom: 18,
  },
  footerChat: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '400',
    alignSelf: 'center',
    position: 'relative',
    bottom: 0,
    padding: 10,
  },
});

export default ChatMessages;
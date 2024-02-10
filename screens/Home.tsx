/* eslint-disable */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';

type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function Home({ navigation }:Props) {
  return (
    <View style={styles.container}>
      <View>
      <Text style={styles.title}>ChatRoulette</Text>
      <Text style={styles.descText}>Embark on an unpredictable journey of spontaneous conversations with ChatRoulette</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={()=>{navigation.push('Chat');} }>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fcedde',
  },
  title: {
    fontSize: 33,
    fontWeight: 'bold',
    color: '#e68627',
    padding: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#e68627',
    paddingVertical:10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  descText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#d4a679',
    textAlign: 'center',
  },
});

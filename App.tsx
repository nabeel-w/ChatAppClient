/* eslint-disable */
import React, { createRef, useEffect } from 'react';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import messaging from '@react-native-firebase/messaging';
import {PermissionsAndroid} from 'react-native';
import Home from './screens/Home';
import Chat from './screens/Chat';

type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
};

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {

  const navigationRef = createRef<NavigationContainerRef<RootStackParamList>>();

  useEffect(()=>{
    requestUserPermission();
    messaging().setBackgroundMessageHandler(async remoteMessage => {

      if(navigationRef.current!==null){
        navigationRef.current.navigate('Chat')
      }
    });
  },[])


  PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName='Home'>
        <Stack.Screen
          name="Home"
          component={Home}
        />
        <Stack.Screen name="Chat" component={Chat} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
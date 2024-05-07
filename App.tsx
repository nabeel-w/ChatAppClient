/* eslint-disable */
import React, { createRef, useEffect, useState } from 'react';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import messaging from '@react-native-firebase/messaging';
import {PermissionsAndroid, Text, View} from 'react-native';
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

  return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
}



const Stack = createNativeStackNavigator<RootStackParamList>();

function ChatScreenHeader(){
  return(
    <View style={{height:50, alignItems: 'center', padding: 8}}>
      <Text style={{textAlign:'center', fontSize: 24, fontWeight: 'bold'}}>Chat</Text>
    </View>
  )
}

export default function App() {

  const navigationRef = createRef<NavigationContainerRef<RootStackParamList>>();
  useEffect(()=>{
    requestUserPermission().then(res=>{
      if(res===true&& navigationRef.current!==null) navigationRef.current.navigate('Chat')
    });
    
    messaging().setBackgroundMessageHandler(async remoteMessage => {

      if(navigationRef.current!==null){
        navigationRef.current.navigate('Chat')
      }
    });
  },[])

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName='Home'>
        <Stack.Screen
          name="Home"
          component={Home}
        />
        <Stack.Screen
         name="Chat"
         component={Chat}
         options={{header: ChatScreenHeader}}
         />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
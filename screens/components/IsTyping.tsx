/* eslint-disable */

import { Animated, StyleSheet, View } from 'react-native';
import React, { useEffect, useRef } from 'react';

export default function IsTyping() {

    const progress = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(()=>{

        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
                    Animated.spring(progress, { toValue: 0, useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.spring(scale, { toValue: 1.2, useNativeDriver: true }),
                    Animated.spring(progress, { toValue: 1, useNativeDriver: true }),
                ]),
            ])
        ).start();
    },[]);

  return (
    <View style={styles.recivedText}>
      <Animated.View style={[styles.dot, { opacity: progress, transform: [{ scale }] }]} />
      <Animated.View style={[styles.dot, { opacity: progress, transform: [{ scale }] }]} />
      <Animated.View style={[styles.dot, { opacity: progress, transform: [{ scale }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
    recivedText: {
        maxWidth: '60%',
        alignSelf: 'flex-start',
        padding: 11,
        marginVertical: 4,
        backgroundColor: '#fcedde',
        borderRadius: 8,
        justifyContent: 'center',
        flexDirection: 'row',
      },
    dot: {
        borderRadius: 50,
        height: 9,
        width: 9,
        backgroundColor: '#444746',
        marginRight: 4,
    },
});

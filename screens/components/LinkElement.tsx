/* eslint-disable */

import React from 'react';
import { LinkPreview } from '@flyerhq/react-native-link-preview'
import { Image, StyleSheet, Text, View } from 'react-native';

interface LinkElementProps {
    message: string,
}



const LinkElement: React.FC<LinkElementProps> = ({ message }) => {

    return (
        <LinkPreview text={message}
            renderLinkPreview={({ aspectRatio, containerWidth, previewData }) => {
                if (previewData?.image?.url !== undefined && previewData !== undefined) {
                    return (
                        <>
                            <View style={styles.container}>
                                <Image source={{ uri: previewData.image?.url }} style={styles.image} />
                                <Text style={styles.title}>{previewData.title}</Text>
                                <Text style={styles.description}>{previewData?.description}</Text>
                            </View>
                        </>
                    )
                }
                else {

                    return (
                        <View style={styles.container}>
                            <Text style={styles.textRecived} >{message}</Text>
                        </View>
                    )
                }
            }}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 5,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    header: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    title: {
        width: '100%',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'left',
        marginTop: 7,
        padding: 4
    },
    description: {
        width: '100%',
        fontSize: 14,
        textAlign: 'left',
        marginBottom: 5,
        padding: 4
    },
    image: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
    },
    textRecived: {
        fontSize: 18,
        textAlign: 'left',
        paddingHorizontal: 8,
        paddingVertical: 4,
        color: '#005ce6',
    },
});

export default LinkElement;

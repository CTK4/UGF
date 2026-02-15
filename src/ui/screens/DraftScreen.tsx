import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const DraftScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Draft Screen</Text>
            <Button title='Go to Home' onPress={() => navigation.navigate('Home')} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default DraftScreen;
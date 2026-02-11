// Updated HubScreen.tsx to include navigation buttons for Draft and Schedule screens
import React from 'react';
import { View, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const HubScreen = () => {
    const navigation = useNavigation();
    
    const goToDraft = () => {
        navigation.navigate('Draft');
    };
    
    const goToSchedule = () => {
        navigation.navigate('Schedule');
    };

    return (
        <View>
            <Button title="Go to Draft" onPress={goToDraft} />
            <Button title="Go to Schedule" onPress={goToSchedule} />
        </View>
    );
};

export default HubScreen;
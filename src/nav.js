// In App.js in a new project

import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import Login from './pages/account/login';
import UserProfile from './pages/personalCenter/person';
import SignInScreen from './pages/sign/sign';
import UserTrajectory from './pages/trajectory/trajectory';

function HomeScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Home Screen</Text>
    </View>
  );
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNav() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#56bddb', // 激活状态的颜色
        tabBarInactiveTintColor: '#acb6e5', // 非激活状态的颜色
      }}
    >
      <Tab.Screen
        name="SignInScreen"
        component={SignInScreen}
        options={{
          tabBarLabel: '签到',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="location" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen

        name="UserTrajectory"
        component={UserTrajectory}
        options={{
          title: '当天轨迹',
          tabBarLabel: '当天轨迹',
          headerShown: true,

          headerStyle: {
            backgroundColor: '#acb6e5',  // 这是标题栏的背景颜色
            height: 40,
          },
          headerTintColor: '#fff',  // 这是标题的颜色
          

          tabBarIcon: ({ color, size }) => (
            <Icon name="map" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen 
        name="UserProfile" 
        component={UserProfile} 
        options={{
          tabBarLabel: '个人中心',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function Nav() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('token');
      const loginDate = await AsyncStorage.getItem('loginDate');

      if (token && loginDate) {
        const currentDate = new Date();
        const storedDate = new Date(loginDate);
        const diffInDays = (currentDate - storedDate) / (1000 * 60 * 60 * 24);

        if (diffInDays <= 7) {
          setIsLoggedIn(true);
        }
      }

      setIsLoading(false);
    };

    checkLoginStatus();
  }, []);

  if (isLoading) {
    return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Loading...</Text></View>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isLoggedIn ? 'TabNav' : 'Login'}>
        <Stack.Screen 
          name="Login" 
          component={Login} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
            name="TabNav" 
            component={TabNav} 
            options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Nav;

// components/UserTrajectory.js

import React, { Component } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView from './mapView';
import myRequest from '../../utils/request';
import pathMap from '../../utils/pathMap';

import Geolocation from '@react-native-community/geolocation';
import GeolocationService from 'react-native-geolocation-service';

import getGeoCodeAddress from '../../utils/geoUtils';


export default class UserTrajectory extends Component {
    state = {
        trajectory: null,
        name: '',
        email: '228928276@qq.com',
        mobile: '',
        avatar: 'https://example.com/user-avatar.jpg',
        lastUploadTime: null,
        userPosition: null,
        mapViewKey: 0, // 用于触发地图重新渲染
        location: null,
    };
    

    componentDidMount() {
        this.loadUserData();
        // this.getTrajectory();
        
    }

    refreshFunction = async () => {
        try {
            // 获取上次刷新的时间
            const lastRefreshTime = await AsyncStorage.getItem('lastRefreshTime');
            const currentTime = new Date().getTime();
    
            if (lastRefreshTime) {
                const timeDifference = currentTime - parseInt(lastRefreshTime, 10);
                const fiveMinutesInMilliseconds = 1 * 60 * 1000;
    
                if (timeDifference < fiveMinutesInMilliseconds) {
                    Alert.alert('请勿频繁刷新', '请等待5分钟后再次刷新');
                    return;
                }
            }
    
            // 获取轨迹
            this.getTrajectory();
    
            Geolocation.getCurrentPosition(
                async position => {
                    const { latitude, longitude } = position.coords;
                    this.setState({ 
                        userPosition: { latitude, longitude },
                        mapViewKey: this.state.mapViewKey + 1
                    });
    
                    // 获取真实地址
                    const address = await getGeoCodeAddress(latitude, longitude);
                    if (address) {
                        this.setState({ location: address });
                    }
    
                    // 存储当前刷新的时间
                    await AsyncStorage.setItem('lastRefreshTime', currentTime.toString());
                },
                error => {
                    // 处理错误
                },
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
            );
        } catch (error) {
            console.error('Error in refreshFunction:', error);
        }
    };
    

    getTrajectory = async () => {
        try {
            const date = new Date().toISOString().split('T')[0]; // 获取当前日期，格式为"YYYY-MM-DD"
            const token = await AsyncStorage.getItem('token'); // 获取token
            const response = await myRequest.post(pathMap.getUserTrack, {
                date: date
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response && response.data && response.data.trajectory) {
                console.log("trajectory:")
                console.log(response.data.trajectory);
                this.setState({ trajectory: response.data.trajectory });
            }
        } catch (error) {
            console.error("Error fetching trajectory:", error);
        }
    }
    
    loadUserData = async () => {
        try {
            const userDataString = await AsyncStorage.getItem('userDetails');
            if (userDataString) {
                const user = JSON.parse(userDataString);
                this.setState({ 
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    avatar: user.avatar || this.state.avatar,
                });
            }
            const lastUploadTime = await AsyncStorage.getItem('lastUploadTime');
            if (lastUploadTime !== null) {
                this.setState({ lastUploadTime });
            }
        } catch (error) {
            console.error('Failed to load user data', error);
        }
    }


    render() {
        const { name, email, mobile, avatar, lastUploadTime, location, userPosition  } = this.state;
        const curLocation = null;
        return (
            <View style={styles.container}>
                <MapView 
                    trajectory={this.state.trajectory}
                    latitude={userPosition?.latitude} 
                    longitude={userPosition?.longitude}
                />

                <View style={styles.userInfo}>
                    <View style={styles.userInfoUp}>
                        <Image 
                            source={{ uri: avatar }} 
                            style={styles.avatar}
                        />
                        <View style={styles.nameAndTimeContainer}>
                            <Text style={styles.name}>{name}</Text>
                            <Text style={styles.time}>{lastUploadTime}</Text>
                        </View>
                        <TouchableOpacity onPress={this.refreshFunction}>
                            <Icon 
                                name="refresh" 
                                size={24} 
                                style={styles.refreshIcon}
                            />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.dashedLine}></View>
                    <View style={styles.userInfoDown}>
                        <Icon name="map-marker" size={20} style={styles.locationIcon} />
                        <Text style={styles.location}>{location}</Text>
                    </View>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    userInfo: {
        position: 'absolute',
        top: 10,
        flexDirection: 'column',
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 10,
        elevation: 2,
        width: '90%',
        alignSelf: 'center',
        justifyContent: 'space-between',
        minHeight: 100, // 这里可以根据需要调整
    },
    userInfoUp: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 50,
        marginRight: 20,
    },
    nameAndTimeContainer: {
        flexDirection: 'column',
        flex: 1, // 使其占据剩余空间
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    time: {
        marginTop: 5,
        fontSize: 12,
    },
    refreshIcon: {
        marginRight: 20,
    },
    dashedLine: {
        borderBottomColor: '#d3d3d3',
        borderBottomWidth: 1,
        width: '100%',
        alignSelf: 'center',
        marginVertical: 10, // 上下间距
    },
    userInfoDown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    locationIcon: {
        marginRight: 5,
        color: '#acb6e5',
    },
    location: {
        flex: 1,
        fontSize: 12,
    },
});

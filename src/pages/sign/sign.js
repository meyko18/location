import React, { Component } from 'react';
import { View, Text, Button, StyleSheet, Alert, Platform, TouchableOpacity } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import GeolocationService from 'react-native-geolocation-service';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import getGeoCodeAddress from '../../utils/geoUtils';
import BackgroundTimer from 'react-native-background-timer';
import BackgroundFetch from "react-native-background-fetch";

import MapView from './mapView';

import myRequest from '../../utils/request';
import pathMap from '../../utils/pathMap';

import jwtDecode from 'jwt-decode';

class SignInScreen extends Component {
    constructor(props) {
        super(props);

        this.state = {
            date: new Date(),
            signStatus: "今日你还未签到",
            location: '正在获取位置...',
            userPosition: null,  //用户位置{latitude: 30.657348, longitude: 104.065735}
            companyPosition: { latitude: 30.904800975, longitude: 121.887001447 },
            radius: 1000,
            currentTime: new Date().toLocaleTimeString(),
            curBusiness: "上海电力大学",
            mapViewKey: 0,
            isSignedToday: false,//今日是否已签到
            hasSignedOut: false, //今日是否已签退
            signInStartTime: 9, // 24小时制的9am,签到开始时间
            signOutStartTime: 17, // 24小时制的5pm,签退开始时间
            
        };
        this.timerRunning = false;  // 初始化定时器状态为已停止
    }
    // 组件挂载后，获取位置信息
    componentDidMount() {

        this.checkTokenValidity();
        this.checkAndRequestPermissions();
        this.getLocationAndAddress();
        this.checkSignInStatus();
        this.checkSignOutStatus();
        this.timeInterval = setInterval(() => {
            this.setState({ currentTime: new Date().toLocaleTimeString('zh-CN', { hour12: false }) });
        }, 1000);
        
        this.startTimer();

        // 流氓库
        //配置定时上传位置任务
        // 配置后台获取
        // BackgroundFetch.configure({
        //     minimumFetchInterval: 1, // 任务运行的最小间隔时间（分钟）
        //     stopOnTerminate: false,   // 设置为false，即使应用被终止也会运行任务
        //     startOnBoot: true,        // 设备重启后启动任务
        // }, async (taskId) => {
        //     console.log("[BackgroundFetch] taskId:", taskId);

        //     // 执行任务
        //     this.uploadLocation();

        //     // 任务完成时必须调用此方法
        //     BackgroundFetch.finish(taskId);
        // }, (error) => {
        //     console.log("[BackgroundFetch] configure error:", error);
        // });

        // // 检查状态并启动
        // BackgroundFetch.status((status) => {
        //     switch(status) {
        //         case BackgroundFetch.STATUS_RESTRICTED:
        //             console.log("BackgroundFetch restricted");
        //             break;
        //         case BackgroundFetch.STATUS_DENIED:
        //             console.log("BackgroundFetch denied");
        //             break;
        //         case BackgroundFetch.STATUS_AVAILABLE:
        //             console.log("BackgroundFetch is enabled");
        //             break;
        //     }
        // });
        


    }

    startTimer = () => {
        //判断当前时间是否在指定时间范围内
        if(this.isWithinTimeRange(this.state.signInStartTime, this.state.signOutStartTime)) {
            // 检查是否已经有一个定时器正在运行
            if (!this.timerRunning) {
                // 启动后台定时器
                BackgroundTimer.runBackgroundTimer(() => {
                    // 执行定时任务
                    console.log('Running background task every second');
                    this.uploadLocation();  // 假设您有一个名为uploadLocation的方法来上传位置信息
                }, 1000 * 60 * 10);  // 每10分钟执行一次

                // 设置定时器状态为正在运行
                this.timerRunning = true;
            } else {
                console.log('Timer is already running.');
            }

        }
    }

    stopTimer = () => {
        BackgroundTimer.stopBackgroundTimer();
        this.timerRunning = false;  // 设置定时器状态为已停止
    }

    // 组件卸载后，清除定时器
    componentWillUnmount() {
        // BackgroundTimer.stop();
        clearInterval(this.timeInterval);
    }


    // 检查登录状态
    async checkTokenValidity() {
        try {
            const token = await AsyncStorage.getItem('token');
    
            if (!token || this.isTokenExpired(token)) {
                Alert.alert(
                    '提示',
                    '登录状态已过期，请重新登录',
                    [
                        {
                            text: '确定',
                            onPress: () => this.props.navigation.navigate('Login')
                        }
                    ]
                );
            }
    
        } catch (error) {
            console.error('Error checking token validity:', error);
            Alert.alert(
                '提示',
                '发生错误，请重新登录',
                [
                    {
                        text: '确定',
                        onPress: () => this.props.navigation.navigate('Login')
                    }
                ]
            );
        }
    }

    // 检查token是否过期
    isTokenExpired = (token) => {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        return decodedToken.exp < currentTime;
    }


    // 检查是否今日已经签到
    checkSignInStatus = async () => {
        const lastSignInDate = await AsyncStorage.getItem('lastSignInDate');
        const todayDate = new Date().toDateString();

        if (lastSignInDate === todayDate) {
            this.setState({ isSignedToday: true, signStatus: "今日已签到" });
        }
    }

    // 检查是否今日已经签退
    checkSignOutStatus = async () => {
        const lastSignOutDate = await AsyncStorage.getItem('lastSignOutDate');
        const todayDate = new Date().toDateString();

        if (lastSignOutDate !== todayDate) {
            // 如果最后签退的日期不是今天，则重置签退状态
            this.setState({ hasSignedOut: false });
            await AsyncStorage.setItem('signedOut', 'false');
        }else{
            this.setState({ hasSignedOut: true });
        }
    }

    // 检查并请求权限
    // 请求精确位置权限
    async requestFineLocationPermission() {
        let locationPermission;
        if (Platform.OS === 'ios') {
            locationPermission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
        } else {
            locationPermission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
        }

        const status = await check(locationPermission);
        if (status !== RESULTS.GRANTED) {
            const newStatus = await request(locationPermission);
            if (newStatus !== RESULTS.GRANTED) {
                Alert.alert('Permission Denied', 'Fine location permission is required to sign in.');
            }
        }
    }

    // 请求粗略位置权限
    async requestCoarseLocationPermission() {
        let coarseLocationPermission;
        if (Platform.OS === 'ios') {
            coarseLocationPermission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE; // iOS 不区分精确或粗略位置权限
        } else {
            coarseLocationPermission = PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION;
        }

        const coarseStatus = await check(coarseLocationPermission);
        if (coarseStatus !== RESULTS.GRANTED) {
            const newCoarseStatus = await request(coarseLocationPermission);
            if (newCoarseStatus !== RESULTS.GRANTED) {
                Alert.alert('Permission Denied', 'Coarse location permission is required to sign in.');
            }
        }
    }

    // 请求后台位置权限
    async requestBackgroundLocationPermission() {
        let backgroundLocationPermission;
        if (Platform.OS === 'ios') {
            backgroundLocationPermission = PERMISSIONS.IOS.LOCATION_ALWAYS;
        } else {
            backgroundLocationPermission = PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION;
        }

        const backgroundStatus = await check(backgroundLocationPermission);
        if (backgroundStatus !== RESULTS.GRANTED) {
            const newBackgroundStatus = await request(backgroundLocationPermission);
            if (newBackgroundStatus !== RESULTS.GRANTED) {
                // Alert.alert('Permission Denied', 'Background location permission is required for this app.');
            }
        }
    }

    // 检查并请求所有权限
    async checkAndRequestPermissions() {
        await this.requestFineLocationPermission();
        await this.requestCoarseLocationPermission();
        await this.requestBackgroundLocationPermission();
    }

    
    // 刷新位置信息
    refreshLocation = () => {
        Geolocation.getCurrentPosition(
            async position => {
                const { latitude, longitude } = position.coords;
                this.setState({ 
                    userPosition: { latitude, longitude },
                    mapViewKey: this.state.mapViewKey + 1  // 修改key以触发重新渲染
                }, () => {
                    console.log("333",this.state.userPosition);
                });
                try {
                    
                    const address = await getGeoCodeAddress(latitude, longitude);
                    console.log(address);
                    if (address) {
                        this.setState({ location: address });
                    }
                } catch (error) {
                    Alert.alert('获取地址信息失败', error.message);
                }
            },
            error => {
                // console.error(error);
                // Alert.alert('获取位置失败', error.message);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
        );
    }


    // 获取位置信息
    getLocationAndAddress = () => {
        Geolocation.getCurrentPosition(
            async position => {
                const { latitude, longitude } = position.coords;
                this.setState({ 
                    userPosition: { latitude, longitude },
                    mapViewKey: this.state.mapViewKey + 1  // 修改key以触发重新渲染
                }, () => {
                    // console.log("333",this.state.userPosition);
                });
            },
            error => {
                // console.error(error);
                // Alert.alert('获取位置失败', error.message);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
        );
    }

    // 签到函数
    signAction = async () => {
        const { isSignedToday, signOutStartTime } = this.state;
        const currentHour = new Date().getHours();

        const currentPosition = await this.getCurrentPosition();
        if (!currentPosition) {
            Alert.alert('获取位置失败', '请检查您的位置权限是否已打开');
            return;
        }

        const isFieldworkCheck = this.isFieldwork();

        if (!isSignedToday) {
            // 执行签到
            // console.log("start sign in");
            this.signInRequest(currentPosition, isFieldworkCheck, 'SignIn');
        } else {
            // 检查当前时间是否早于设定的签退开始时间
            if (currentHour < signOutStartTime) {
                Alert.alert(
                    '早退警告', 
                    '当前时间还未到达正常签退时间，你确定要签退吗？',
                    [
                        {
                            text: '取消',
                            style: 'cancel'
                        },
                        { 
                            text: '确定', 
                            onPress: () => this.signInRequest(currentPosition, isFieldworkCheck, 'SignOut')
                        }
                    ]
                );
            } else {
                // 执行签退
                this.signInRequest(currentPosition, isFieldworkCheck, 'SignOut');
            }
        }
    }

    
    
    
    // 签到请求
    // 签到请求
    signInRequest = async (currentPosition, isFieldworkCheck, signInType) => {
        try {
            const token = await AsyncStorage.getItem('token'); // 获取token
            const response = await myRequest.post(pathMap.signIn, {
                type: signInType, 
                latitude: currentPosition.latitude,
                longitude: currentPosition.longitude,
                isFieldwork: isFieldworkCheck
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data && response.data.success) {
                const todayDate = new Date().toDateString();
                let newState = {};

                if(signInType === 'SignIn') {
                    newState.isSignedToday = true;
                    newState.signStatus = `今日签到时间：${response.data.signTime}`;
                    await AsyncStorage.setItem('lastSignInDate', todayDate);
                } else {
                    newState.hasSignedOut = true;
                    newState.signStatus = `今日签退时间：${response.data.signTime}`;
                    await AsyncStorage.setItem('signedOut', 'true');  // 保存签退状态
                    await AsyncStorage.setItem('lastSignOutDate', new Date().toDateString());  // 保存签退日期
                }

                this.setState(newState);
                
                // 启动上传位置定时器
                if(!this.timerRunning) {
                    this.startTimer();
                }
            
                Alert.alert(signInType === 'SignIn' ? '签到成功' : '签退成功');
            } else {
                Alert.alert('操作失败', response.data.message);
            }
        } catch (error) {
            Alert.alert('操作出现问题，请稍后重试');
            console.error('Error during sign in:', error);
        }
    }

    // 判断当前时间是否在指定时间范围内
    isWithinTimeRange = (startHour, endHour) => {
        const currentHour = new Date().getHours();
        return currentHour >= startHour && currentHour < endHour;
    }
    
    
    // 上传位置到后端服务器
    uploadLocation = async () => {
        console.log('在后台上传位置');
        try {
            
            // 获取位置
            const currentPosition = await this.getCurrentPosition();
            const token = await AsyncStorage.getItem('token'); // 获取token
            
            if (currentPosition) {
                await myRequest.post(pathMap.uploadLocation, {
                    latitude: currentPosition.latitude,
                    longitude: currentPosition.longitude
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            } else {
                console.error('Failed to get current position for upload.');
            }

            const now = new Date();
            const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')} : ${String(now.getMinutes()).padStart(2, '0')}`;
            await AsyncStorage.setItem('lastUploadTime', formattedTime);
            
        } catch (error) {
            console.error('Error uploading location:', error);
        }
        // 检查是否超出时间范围
        if(!this.isWithinTimeRange(this.state.signInStartTime, this.state.signOutStartTime)) {
            this.stopTimer();
        }
    };
    
    

    // 使用Haversine公式计算两个经纬度之间的距离
    calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // 地球半径，单位：米
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }

    // 将度数转换为弧度
    toRad = (value) => {
        return value * Math.PI / 180;
    }

    // 判断是否为外勤签到
    isFieldwork = () => {
        const { userPosition, companyPosition, radius } = this.state;
        if (!userPosition) return true; // 如果没有用户位置，则默认为外勤签到

        const distance = this.calculateDistance(
            userPosition.latitude, userPosition.longitude, 
            companyPosition.latitude, companyPosition.longitude
        );
        return distance > radius;
    }


    // 后台获取当前位置
    getCurrentPosition = () => {
        // 后台获取当前位置
        console.log('在后台获取位置...');
        return new Promise((resolve, reject) => {
            GeolocationService.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    resolve({ latitude, longitude });
                },
                error => {
                    console.error('Error getting location:', error);
                    reject(error);  // Reject the promise with the error
                },
                {
                    enableHighAccuracy: true,  // 使用高精度定位
                    timeout: 15000,            // 超时时长15秒
                    maximumAge: 10000,         // 缓存的位置信息的最大有效期是10秒
                    distanceFilter: 0,         // 设定多少米移动一次会触发位置信息的更新
                    forceRequestLocation: true // 在Android上，如果位置服务没有打开，这将强制打开位置设置
                }
            );
        });
    }
    


    
    
    

    render() {
        const { userPosition, companyPosition, radius, date, location, currentTime } = this.state;
        const formattedDate = date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const btnStyle = this.state.hasSignedOut ? styles.disabledBtn : styles.activeBtn;
        const btnTitle = !this.state.isSignedToday 
        ? '签到 ' + this.state.currentTime 
        : (!this.state.hasSignedOut 
            ? '签退 ' + this.state.currentTime 
            : '已签退');

        // const isButtonDisabled = this.state.hasSignedOut;
        const isButtonDisabled = this.state.isSignedToday && this.state.hasSignedOut;
        return (
            <LinearGradient colors={['#acb6e5', '#86fde8']} style={styles.linear}>
                <View style={styles.container}>
                    <View style={styles.dateCompanyRow}>
                        <View style={styles.iconWithText}>
                            <Icon name="calendar" size={20} color="#000" />
                            <Text style={styles.dateText}>{formattedDate}</Text>
                        </View>
                        <View style={styles.iconWithText}>
                            <Icon name="building" size={20} color="#000" />
                            <Text style={styles.curBusinessText}>当前企业: {this.state.curBusiness}</Text>
                        </View>
                    </View>
                    <View style={styles.locationContainer}>
                        <Icon name="map-marker" size={20} color="#000" style={styles.locationIcon} />
                        <Text style={styles.locationText}>{location}</Text>
                        <TouchableOpacity style={styles.refreshButton} onPress={this.refreshLocation}>
                            <Icon name="refresh" size={20} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.map}>
                        <MapView 
                            latitude={userPosition?.latitude} 
                            longitude={userPosition?.longitude} 
                        />
                    </View>
                    
                    
                    <TouchableOpacity 
                        onPress={this.signAction} 
                        disabled={isButtonDisabled} 
                        style={[styles.button, isButtonDisabled ? styles.disabledBtn : styles.activeBtn]}
                    >
                        <Text style={styles.buttonText}>{`${btnTitle}`}</Text>
                    </TouchableOpacity>
                    <Text style={styles.signStatusText}>{this.state.signStatus}</Text>
                </View>
            </LinearGradient>
        );
    }
}

const styles = StyleSheet.create({
    locationContainer: {
        flexDirection: 'row',
        // alignItems: 'center',
        justifyContent: 'left',
    },
    locationText: {
        // flexWrap: 'wrap',
        fontSize: 20,
        fontStyle: 'italic',
        color: 'black',
    },
    locationIcon: {
          marginRight: 5,
    },
    refreshButton: {
        marginLeft: 30,  // 或更多，根据你的需要
    },
    iconWithText: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,  // 控制图标和文本之间的距离
    },
    linear: {
        flex: 1,
        padding: 20,
        backgroundColor: 'white'
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
    },
    dateCompanyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    dateText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 12
    },
    curBusinessText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 12
    },
    locationText: {
        marginBottom: 20
    },
    map: {
        height: 250,
        marginBottom: 20,
        borderRadius: 8,
        overflow: 'hidden'
    },
    signStatusText: {
        marginTop: 20,
        color: 'gray',
        textAlign: 'center',
    },
    signInButton: {
        backgroundColor: "#3498db", // 您的默认颜色
        // 其他样式属性
    },
    disabledSignInButton: {
        backgroundColor: "gray",
        // 其他样式属性，如需要的话
    },
    button: {
        padding: 10,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10
    },
    buttonText: {
        color: '#fff', 
        fontWeight: 'bold'
    },
    activeBtn: {
        backgroundColor: '#56bddb'
    },
    disabledBtn: {
        backgroundColor: '#ccc'
    }
});

export default SignInScreen;
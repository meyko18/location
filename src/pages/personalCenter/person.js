import React, { Component } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';


class UserProfile extends Component {
    state = {
        name: '',
        email: '228928276@qq.com',
        mobile: '',
        avatar: 'https://example.com/user-avatar.jpg',
        version: '1.0.0',
    }

    componentDidMount() {
        this.loadUserData();
    }

    //这些是点击事件
    handleMessageCenterPress = () => {
        //消息中心
        this.props.navigation.navigate('MessageCenter');
    }
    handleDocumentPress = () => {
        //用户协议
        this.props.navigation.navigate('Document');
    }
    handlePrivacyPress = () => {
        //隐私协议
        this.props.navigation.navigate('Privacy');
    }
    handleVersionPress = () => {
        //版本信息
        this.props.navigation.navigate('Version');
    }
    handleSettingsPress = () => {
        //权限设置
        this.props.navigation.navigate('Settings');
    }
    handleHelpPress = () => {
        //常见问题
        this.props.navigation.navigate('Help');
    }
    handleLogoutPress = async () => {
        try {
            // 清除本地存储的用户数据
            await AsyncStorage.removeItem('userDetails');
            await AsyncStorage.removeItem('token');
            // 可以添加其他清理逻辑，比如清除Redux状态等
    
            // 导航到登录页面
            this.props.navigation.navigate('Login');
        } catch (error) {
            console.error('Failed to logout', error);
        }
    }
    
    //点击事件结束

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
        } catch (error) {
            console.error('Failed to load user data', error);
        }
    }

    renderMenuItem(iconName, label, description, onPressCallback) {
        return (
            <TouchableOpacity style={styles.menuItem} onPress={onPressCallback}>
                <Icon name={iconName} size={24} style={styles.menuIcon} />
                <Text style={styles.menuLabel}>{label}</Text>
                <Text style={[styles.menuDescription, styles.menuRightDescription]}>{description}</Text>
            </TouchableOpacity>
        );
    }

    render() {
        const { name, email, mobile, avatar, version } = this.state;

        return (
            <LinearGradient colors={['#acb6e5', '#86fde8']} style={styles.container}>
                <View style={styles.container}>
                    <View style={styles.userInfo}>
                        <Image 
                            source={{ uri: avatar }} 
                            style={styles.avatar}
                        />
                        <View style={styles.nameAndMobile}>
                            <Text style={styles.name}>{name}</Text>
                            <Text style={styles.mobile}>{mobile}</Text>
                        </View>
                    </View>
                    <View  style={styles.activate}>
                        {this.renderMenuItem("notifications", "消息中心", "查看或管理消息", this.handleMessageCenterPress)}
                        {this.renderMenuItem("document-text", "用户协议", "查看用户协议", this.handleDocumentPress)}
                        {this.renderMenuItem("shield-checkmark", "隐私协议", "查看隐私协议", this.handlePrivacyPress)}
                        {this.renderMenuItem("information-circle", "版本信息", "查看当前版本信息", this.handleVersionPress)}
                        {this.renderMenuItem("settings", "权限设置", "管理应用权限", this.handleSettingsPress)}
                        {this.renderMenuItem("help-circle-outline", "常见问题", "查看常见问题", this.handleHelpPress)}
                        {this.renderMenuItem("exit", "注销登录", "", this.handleLogoutPress)}
                    </View>
                </View>
            </LinearGradient>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 8,
        paddingTop: 10, // Adjust as needed for your app's top spacing
    },
    userInfo: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 50,
        marginRight: 20,
    },
    nameAndMobile: {
        flexDirection: 'column',
        marginLeft: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    mobile: {
        fontSize: 16,
    },
    activate: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderBottomWidth: 0.5, // 添加这个属性来创建淡淡的分割线
        borderBottomColor: 'rgba(0, 0, 0, 0.1)', // 分割线的颜色
    },
    menuIcon: {
        color: '#acb6e5',  // 图标颜色
        marginRight: 10,
    },
    menuLabel: {
        fontSize: 16,
        color: 'black',  // 修改字体颜色为黑色
        flex: 1,
    },
    menuDescription: {
        fontSize: 10,
        color: 'black',  // 修改字体颜色为黑色
    },
    menuRightDescription: {
        textAlign: 'right',
        marginLeft: 10,
        color: 'black',  // 修改字体颜色为黑色
    }
});

export default UserProfile;

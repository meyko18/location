import React, { Component } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import request from '../../../utils/request';
import pathMap from '../../../utils/pathMap';
import DingLoginService from '../../../utils/DingLoginService';

class Login extends Component {
  state = {
    oauthUrl: ""
  }

  componentDidMount() {
    Linking.addEventListener('url', this.handleOpenURL);
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this.handleOpenURL);
  }
  handleAdminLogin = async () => {
    console.log("handleAdminLogin");

  }

  handleLogin = async () => {
    try {
      const oauthUrl = await DingLoginService.getOAuthUrl();
      console.log("Received OAuth URL:", oauthUrl);
      Linking.openURL(oauthUrl);
    } catch (error) {
      console.error('Error during request:', error);
    }
  }

  handleOpenURL = (event) => {
    const code = this.getQueryParam(event.url, "code");
    console.log("Received code:", code);
    if (code) {
      this.loginWithCode(code);
    }
  }

  getQueryParam = (url, param) => {
    const regex = new RegExp('[?&]' + param + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  loginWithCode = async (authCode) => {
    try {
      const response = await request.post(pathMap.login, { authCode });
      // 将token和userDetails保存到AsyncStorage中
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('userDetails', JSON.stringify(response.data.userDetails));
      // 保存登录信息
      const loginDate = new Date().toISOString();
      await AsyncStorage.setItem('loginDate', loginDate);

      // 跳转到首页
      this.props.navigation.navigate('TabNav');
      
      // // 重置导航堆栈并跳转到首页:待测试是否有效
      // this.props.navigation.replace('TabNav');

    } catch (error) {
      console.error("Error during login:", error);
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Image 
          source={require('./../../../res/beijin1.jpg')} 
          style={styles.backgroundImage} 
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.loginButton} onPress={this.handleLogin}>
          <Image
            source={require('./../../../res/dingLogo.png')}
            style={styles.dingLogo}
            resizeMode="contain"
          />
          <Text style={styles.buttonText}>钉钉登录</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginButton} onPress={this.handleAdminLogin}>
          <Image
            source={require('./../../../res/admin.png')}
            style={styles.adminLogo}
            resizeMode="contain"
          />
          <Text style={styles.buttonText}>管理员登录</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center', 
  },
  backgroundImage: {
    width: '60%',
    height: '30%',
  },
  loginButton: {
    marginTop: 10,
    backgroundColor: '#FFFFFF', // 按钮背景颜色
    flexDirection: 'row', // 水平排列图标和文本
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10, // 垂直方向的内边距
    paddingHorizontal: 20, // 水平方向的内边距
    borderRadius: 5, // 按钮边缘圆角
    width: '80%', // 按钮宽度
    elevation: 2, // 在Android上添加阴影效果
    shadowColor: '#000', // 在iOS上添加阴影效果
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    marginLeft: 10, // 文本与图标之间的间距
    color: '#000', // 文本颜色
    fontSize: 16, // 文本字体大小
  },
  dingLogo: {
    height: 30, // 调整图标大小
    width: 30, // 确保图标宽高一致
  },
  adminLogo: {
    height: 30,
    width: 30,
  }
});

export default Login;

//后端接口映射
const pathMap = {
    //基础路径
    baseURL: 'http://110.40.133.250:3000',
    //获取授权URL
    getOAuthUrl: '/ding/getOAuthUrl',
    //获取access_token
    // getAccessToken: '/ding/getAccessToken',
    //登录
    login: '/auth/login',

    //签到
    signIn: '/sign/signin',

    //定时上传位置
    uploadLocation: '/location/uploadLocation',

    //获取用户一天的轨迹
    getUserTrack: '/location/getDailyTrajectory',
    
}

export default pathMap
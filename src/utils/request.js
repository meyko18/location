// request.js
import axios from "axios";
import pathMap from "./pathMap";


// 创建axios实例
const service = axios.create({
    baseURL: pathMap.baseURL, // api的base_url
    // timeout: 5000 // 请求超时时间
});

export default {
    get: service.get,
    post: service.post
}
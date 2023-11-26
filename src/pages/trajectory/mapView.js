// MapView.js

import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import amapData from "../../utils/amapData";

const MapView = ({ trajectory, latitude, longitude }) => {
    
  const key = amapData.webKey;
  const secret = amapData.webSecret;

  const trajectoryStr = JSON.stringify(trajectory);

  const injectedHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
        <style type="text/css">
          html, body, #container {
            width: 100%;
            height: 100%;
            margin: 0px;
            padding: 0px;
          }
        </style>
        <script type="text/javascript">
          window._AMapSecurityConfig = {
              securityJsCode: ${JSON.stringify(secret)},
          }
        </script>
        <script type="text/javascript" src="https://webapi.amap.com/maps?v=1.4.15&key=${key}"></script>
      </head>
      <body>
        <div id="container"></div>
        <script type="text/javascript">
            // 创建地图
            var map = new AMap.Map('container', {
                resizeEnable: true,
                zoom: 14
            });

            // 创建自身标记
            var marker = new AMap.Marker({
            position: [${longitude}, ${latitude}],
            title: "Marker!"
            });
            marker.setMap(map);

            // 添加缩放工具条
            let toolbar;
            AMap.plugin('AMap.ToolBar',function(){ // 异步加载插件
                toolbar = new AMap.ToolBar(); // 缩放工具条实例化
                map.addControl(toolbar);
            });

            var trajectory = ${trajectoryStr};
            var polyline = new AMap.Polyline({
                path: trajectory,
                strokeColor: "#FF0000",
                strokeWeight: 2
            });
            map.add(polyline);
            map.setFitView();

        </script>
      </body>
    </html>
  `;

  return (
    <WebView 
      source={{ html: injectedHTML }} 
      style={styles.webview} 
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  }
});

export default MapView;

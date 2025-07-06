/**
 * 主服务器文件
 * 负责启动Express服务器，提供API和静态文件服务
 */
const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const apiRoutes = require('./api');
const reload = require('./reload')

/**
 * 启动服务器
 * @param {*} hre - Hardhat Runtime Environment
 * @param {*} port - 服务器端口
 * @returns {Promise} - 启动完成的Promise
 */
async function launchServer(hre, port) {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  // 存储hre以便在路由中使用
  app.locals.hre = hre;

  // 允许跨域请求
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // 热重载
  const api_path = path.join(__dirname, 'api')
  app.use(reload(api_path))

  // 提供静态文件
  app.use(express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  }));

  // API路由
  app.use('/api', apiRoutes);

  // 实时事件处理
  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // 确保前端路由都返回index.html
  app.get(/.*/, (req, res) => {
    console.log(req.path)
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
  });

  // 启动服务器
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`Web UI server running at http://localhost:${port}`);
      console.log(`Connected to network: ${hre.network.name}`);
      resolve();
    });
  });  
}

module.exports = {
  launchServer,
};
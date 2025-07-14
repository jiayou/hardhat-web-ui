/**
 * 插件主入口文件
 * 负责注册Hardhat任务和扩展配置
 */
const { extendConfig, task } = require('hardhat/config');
const { launchServer } = require('./server');

// 扩展Hardhat配置
extendConfig((config) => {
  config.webUI = {
    enabled: true,
    port: 31337,
  };
});

// 注册web-ui任务
task('web-ui', 'Starts the web UI server for interacting with the blockchain')
  .setAction(async (args, hre) => {
    if (!hre.config.webUI.enabled) {
      console.log('Web UI is disabled in config');
      return;
    }

    console.log(`Starting Web UI server...`);
    await launchServer(hre, hre.config.webUI.port);

    // 保持进程活跃
    await new Promise(() => {});
  });

module.exports = {};

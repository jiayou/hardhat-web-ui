/**
 * 插件主入口文件
 * 负责注册Hardhat任务和扩展配置
 */
const { extendConfig, task } = require('hardhat/config');
const { launchServer } = require('./server');

// 扩展Hardhat配置
extendConfig((config) => {
  // 设置默认配置
  const defaultConfig = {
    enabled: true,
    localChainIds: [31337, 1337],
    port: 3337,
  };

  // 如果没有config.webUI则使用默认配置，否则合并用户配置和默认配置
  config.webUI = Object.assign({}, defaultConfig, config.webUI || {});
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

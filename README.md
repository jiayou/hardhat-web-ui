# Hardhat Web UI Plugin

- 提供WEBUI 查看网络、区块、账户、合约等信息
- 提供与合约交互的功能（类似REMIX）

## 特性
- 查看区块
- 查看账户
- 查看交易
- 浏览项目中的所有合约
- 查看合约ABI和字节码
- 部署合约到网络
- 与已部署的合约交互（调用读写函数）

## 安装

```bash
npm install hardhat-web-ui --save-dev
```

## 使用方法

在你的hardhat.config.js中引入插件:

```javascript
require("hardhat-web-ui");
```

启动Web UI:

```bash
npx hardhat web-ui --network <network-name>
# e.g.
npx hardhat web-ui --network localhost
```

然后在浏览器中访问 http://localhost:3337

## 配置

可以在hardhat.config.js中配置插件:

```javascript
module.exports = {
  webUI: {
    enabled: true,
    localChainIds: [31337, ...],
    port: 3337,
  }
};
```

## 许可证

MIT

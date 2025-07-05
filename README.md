# Hardhat Web UI Plugin

一个类似Remix的Hardhat插件，提供Web界面来与智能合约交互。

## 特性

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
npx hardhat serve-ui --network <network-name>
```

然后在浏览器中访问 http://localhost:3337

## 配置

可以在hardhat.config.js中配置插件:

```javascript
module.exports = {
  webUI: {
    enabled: true,
    port: 3337,  // 可自定义端口
  }
};
```

## 许可证

MIT

/**
 * API路由入口文件
 * 统一处理所有API路由
 */
const express = require('express');
const router = express.Router();

// 引入各个模块的路由
const blockRoutes = require('./routes/block');
const txRoutes = require('./routes/tx');
const accountRoutes = require('./routes/account');
const contractRoutes = require('./routes/contract');
const networkRoutes = require('./routes/network');

// 添加统一请求日志中间件
router.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// 注册路由
router.use('/block', blockRoutes);
router.use('/tx', txRoutes);
router.use('/account', accountRoutes);
router.use('/contract', contractRoutes);

// 获取网络信息
router.get('/network', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const networkName = hre.network.name;
    const chainId = await ethers.provider.getNetwork().then(net => net.chainId);
    
    res.json({
      network: {
        name: networkName,
        chainId: chainId.toString(),
        provider: hre.network.config.url || 'local'
      }
    });
  } catch (error) {
    console.error('Error fetching network info:', error);
    res.status(500).json({ error: 'Failed to fetch network info' });
  }
});

router.use('/network', networkRoutes);

module.exports = router;
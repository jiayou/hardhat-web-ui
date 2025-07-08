/**
 * API路由入口文件
 * 统一处理所有API路由
 */
const express = require('express');
const router = express.Router();

// 引入各个模块的路由
const blockRoutes = require('./routes/block');
const transactionRoutes = require('./routes/transaction');
const accountRoutes = require('./routes/account');
const contractRoutes = require('./routes/contract');
const networkRoutes = require('./routes/network');
const testRoutes = require('./routes/test');
const miscRoutes = require('./routes/misc');

// 添加统一请求日志中间件
router.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// 注册路由
router.use('/api/block', blockRoutes);
router.use('/api/transaction', transactionRoutes);
router.use('/api/account', accountRoutes);
router.use('/api/contract', contractRoutes);
router.use('/api/network', networkRoutes);
router.use('/api/test', testRoutes);
router.use('/api', miscRoutes);

// 处理未找到的API路由
router.use('/api/*', (req, res) => {
  return res.status(404).json({ error: 'API not found' });
})

module.exports = router;

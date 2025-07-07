/**
 * 交易相关API路由
 */
const express = require('express');
const router = express.Router();
const ethereum = require('../services/ethereum');

// 获取signer列表
router.get('/signer', async (req, res) => {
  try {
    const { httpProvider } = req.app.locals;
    const signers = await ethereum.getSigners(httpProvider);
    res.json(signers);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});



// 转账操作
router.post('/transfer', async (req, res) => {
  console.log('transfer', req.body);
  try {
    const { from, to, amount } = req.body;

    console.log('from:', from);
    console.log('to:', to);
    console.log('amount:', amount);

    const { httpProvider } = req.app.locals;

    // 使用ethereum服务发送交易
    const result = await ethereum.sendTransaction(httpProvider, from, to, amount);
    res.json(result);
  } catch (error) {
    console.error('Error executing transfer:', error);
    res.status(500).json({ error: error.message || 'Failed to execute transfer' });
  }
})

module.exports = router;
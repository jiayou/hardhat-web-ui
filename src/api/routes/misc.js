/**
 * 交易相关API路由
 */
const express = require('express');
const router = express.Router();
const ethereum = require('../services/ethereum');

// 存储全局批量大小设置
let globalBatchSize = 10;

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


// 签名交易操作
router.post('/wallet_transfer', async (req, res) => {
  console.log(req.body);
  try {
    const { from, to, signedTx } = req.body;
    const { httpProvider } = req.app.locals;

    // 发送签名过的交易
    const result = await ethereum.walletTransaction(httpProvider, from, to, signedTx);
    res.json(result);
  } catch (error) {
    console.error('Error executing transfer:', error);
    res.status(500).json({ error: error.message || 'Failed to execute transfer' });
  }
})


// 准备转账交易数据
router.post('/prepare-transfer', async (req, res) => {
  console.log('prepare-transfer', req.body);
  try {
    const { from, to, amount } = req.body;
    
    console.log('from:', from);
    console.log('to:', to);
    console.log('amount:', amount);
    
    const { httpProvider } = req.app.locals;
    
    // 获取当前网络ID
    const network = await httpProvider.getNetwork();
    const chainId = '0x' + network.chainId.toString(16);
    
    // 获取当前gas价格
    // const gasPrice = await httpProvider.getGasPrice();
    const gasPrice = (await httpProvider.getFeeData()).gasPrice
    const gasPriceHex = '0x' + gasPrice.toString(16);
    
    // 估算gas限制 - 标准转账通常是21000
    const gasLimit = '0x5208'; // 十六进制的21000
    
    // 获取nonce
    const nonce = await httpProvider.getTransactionCount(from, 'latest');
    const nonceHex = '0x' + nonce.toString(16);
    
    const valueInHex = amount // 前端已经处理过，这里直接使用

    // 构建完整的交易数据
    const txData = {
      from: from,
      to: to,
      value: valueInHex,
      gas: gasLimit,
      gasPrice: gasPriceHex,
      chainId: chainId,
      nonce: nonceHex
    };
    
    res.json({
      txData,
      message: '请使用钱包应用签名此交易数据'
    });
  } catch (error) {
    console.error('Error preparing transfer data:', error);
    res.status(500).json({ error: error.message || 'Failed to prepare transfer data' });
  }
})



// 设置批量大小
router.post('/batch-size/:size', (req, res) => {
  try {
    const size = parseInt(req.params.size, 10);
    if (isNaN(size) || size <= 0) {
      return res.status(400).json({ error: 'Invalid batch size' });
    }
    
    globalBatchSize = size;
    console.log(`批量大小已更新为: ${size}`);
    
    // 将批量大小保存在应用程序全局变量中，使其对所有路由可用
    req.app.locals.batchSize = size;
    
    res.json({ batchSize: size });
  } catch (error) {
    console.error('Error setting batch size:', error);
    res.status(500).json({ error: 'Failed to set batch size' });
  }
});

// 获取当前批量大小
router.get('/batch-size', (req, res) => {
  res.json({ batchSize: req.app.locals.batchSize || globalBatchSize });
});


module.exports = router;
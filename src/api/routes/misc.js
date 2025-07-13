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
    console.log('amount (ETH):', amount);
    
    // 将ETH转换为十六进制Wei值（使用BigInt处理大金额）
    const valueInBigInt = BigInt(Math.floor(amount * 10000)) * BigInt(10)**BigInt(14); // 转换为Wei (处理小数点后4位)
    const valueInHex = '0x' + valueInBigInt.toString(16);
    console.log('valueInHex:', valueInHex);

    const { httpProvider } = req.app.locals;

    // 构建交易对象
    const transaction = {
      to: to,
      value: valueInHex,
      from: from,
      gas: "0xFFFF",
    };

    console.log('transaction:', transaction);
    const txHash = await httpProvider.send("eth_sendTransaction", [transaction]);

    res.json({
      txHash: txHash,
    });
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
    
    // 前端传入的是ETH金额，这里转换为十六进制Wei值（使用BigInt处理大金额）
    const valueInBigInt = BigInt(Math.floor(amount * 10000)) * BigInt(10)**BigInt(14); // 转换为Wei (处理小数点后4位)
    const valueInHex = '0x' + valueInBigInt.toString(16);
    console.log('valueInHex:', valueInHex);

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

module.exports = router;
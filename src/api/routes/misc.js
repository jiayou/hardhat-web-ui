/**
 * 交易相关API路由
 */
const express = require('express');
const router = express.Router();
const ethereum = require('../services/ethereum');
const wallet = require('../services/wallet');

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




// 准备合约部署交易数据
router.post('/prepare-deploy', async (req, res) => {
  console.log('prepare-deploy', req.body);
  try {
    const { from, bytecode, args } = req.body;

    console.log('from:', from);
    console.log('bytecode length:', bytecode ? bytecode.length : 0);

    const { httpProvider } = req.app.locals;

    // 使用wallet服务准备部署合约的交易数据
    const deployData = await wallet.prepareDeploy(httpProvider, from, bytecode, args);

    // 获取当前网络ID
    const network = await httpProvider.getNetwork();
    const chainId = '0x' + network.chainId.toString(16);

    // 获取nonce
    const nonce = await httpProvider.getTransactionCount(from, 'latest');
    const nonceHex = '0x' + nonce.toString(16);

    // 转换gas价格和gas限制为十六进制格式
    const gasPriceHex = '0x' + deployData.gasPrice.toString(16);
    const gasLimitHex = '0x' + deployData.gasLimit.toString(16);

    // 构建完整的交易数据
    const txData = {
      from: from,
      data: deployData.data,
      gas: gasLimitHex,
      gasPrice: gasPriceHex,
      chainId: chainId,
      nonce: nonceHex
    };

    res.json({
      txData,
      message: '请使用钱包应用签名此交易数据'
    });
  } catch (error) {
    console.error('Error preparing deploy data:', error);
    res.status(500).json({ error: error.message || 'Failed to prepare deploy data' });
  }
});

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

// 准备合约调用交易数据
router.post('/prepare-call', async (req, res) => {
  console.log('prepare-call', req.body);
  try {
    const { from, to, contractABI, functionName, args, data, value } = req.body;

    console.log('from:', from);
    console.log('to:', to);

    const { httpProvider } = req.app.locals;
    
    let callData;
    let encodedData = data;

    // 如果提供了ABI和函数信息，先进行函数调用编码
    if (contractABI && functionName && !data) {
      console.log('使用ABI编码函数调用');
      console.log('functionName:', functionName);
      console.log('args:', args);
      
      // 进行函数调用编码
      encodedData = await wallet.encodeFunctionCall(contractABI, functionName, args);
      console.log('encoded data length:', encodedData ? encodedData.length : 0);
    } else if (data) {
      console.log('使用预编码数据');
      console.log('data length:', data.length);
    } else {
      throw new Error('必须提供合约ABI和函数信息，或者预编码的data');
    }

    // 使用wallet服务准备合约调用的交易数据
    callData = await wallet.prepareCall(httpProvider, from, to, encodedData);

    // 获取当前网络ID
    const network = await httpProvider.getNetwork();
    const chainId = '0x' + network.chainId.toString(16);

    // 获取nonce
    const nonce = await httpProvider.getTransactionCount(from, 'latest');
    const nonceHex = '0x' + nonce.toString(16);

    // 转换gas价格和gas限制为十六进制格式
    const gasPriceHex = '0x' + callData.gasPrice.toString(16);
    const gasLimitHex = '0x' + callData.gasLimit.toString(16);

    // 构建完整的交易数据
    const txData = {
      from: from,
      to: to,
      data: encodedData,
      gas: gasLimitHex,
      gasPrice: gasPriceHex,
      chainId: chainId,
      nonce: nonceHex
    };

    // 如果有value值，添加到交易数据中
    if (value) {
      txData.value = value;
    }

    res.json({
      txData,
      message: '请使用钱包应用签名此交易数据'
    });
  } catch (error) {
    console.error('Error preparing call data:', error);
    res.status(500).json({ error: error.message || 'Failed to prepare call data' });
  }
});

module.exports = router;
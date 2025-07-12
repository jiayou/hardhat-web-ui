/**
 * 合约相关API路由
 */
const express = require('express');
const router = express.Router();
const hardhat = require('../services/hardhat');
const { ethers } = require('ethers');

// 处理函数调用结果，解决JSON序列化问题（主要针对BigInt类型）
// 获取智能合约列表
router.get('/', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const contracts = await hardhat.getContractList(hre);
    res.json({ contracts });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// 获取智能合约详情
router.get('/:contractName', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const contract = await hardhat.getContractDetails(hre, req.params.contractName);
    res.json({ contract });
  } catch (error) {
    console.error(`Error fetching contract ${req.params.contractName}:`, error);
    res.status(500).json({ error: `Failed to fetch contract ${req.params.contractName}` });
  }
});

// 部署合约API
router.post('/deploy', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const { contractName, signer, args = [] } = req.body;

    if (!contractName) {
      return res.status(400).json({ error: 'Contract name is required' });
    }

    console.log('Current network:', hre.network.name);
    console.log('Deploying contract:', contractName, 'signer:', signer);
    const result = await hardhat.deployContract(hre, contractName, args, signer);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error deploying contract:', error);
    res.status(500).json({ error: 'Failed to deploy contract', details: error.message });
  }
});

// 调用合约方法API
router.post('/call', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const { contractName, contractAddress, method, signer, args = [], value = '0' } = req.body;

    if (!contractName || !contractAddress || !method) {
      return res.status(400).json({ error: 'Contract name, address and method are required' });
    }

    console.log('Current network:', hre.network.name);
    console.log('contractAddress:', contractAddress);
    console.log('Calling contract:', contractName, 'method:', method, 'args:', args, value, 'signer:', signer);

    const result = await hardhat.callContractMethod(hre, contractName, contractAddress, method, args, value, signer);
    res.json(result);
  } catch (error) {
    console.error('Error calling contract method:', error);
    res.status(500).json({ error: 'Failed to call contract method', details: error.message });
  }
});






// 准备合约部署交易数据
router.post('/prepare-deploy', async (req, res) => {
  // console.log('prepare-deploy', req.body);
  try {
    const { from, contractName, bytecode, args, value } = req.body;
    let contractABI = [];
    try {
      // 使用Hardhat方法获取合约ABI
      const hre = req.app.locals.hre;
      const contractDetails = await hardhat.getContractDetails(hre, contractName);
      contractABI = contractDetails.abi || [];
    } catch (error) {
      console.error('Error loading contract ABI:', error);
      throw new Error('Failed to load contract ABI');
    }

    console.log('from:', from);
    console.log('bytecode length:', bytecode ? bytecode.length : 0);

    const { httpProvider } = req.app.locals;
    
    // 从ABI中获取构造函数
    const constructor = contractABI.find(item => item.type === 'constructor');
    
    let encodedBytecode = bytecode;

    // 如果有构造函数参数，对参数进行编码并拼接到bytecode
    if (constructor && constructor.inputs && constructor.inputs.length > 0 && args && args.length > 0) {
        // 创建接口实例
        const iface = new ethers.Interface([constructor]);
        const encodedArgs = iface.encodeDeploy(args);
        encodedBytecode += encodedArgs.slice(2); // 移除0x前缀后拼接
    }
    
    // 估算部署合约的gas限制
    const gasEstimate = await httpProvider.estimateGas({
        from: from,
        data: encodedBytecode,
        value: 500000   // TBC
    });

    // 获取当前推荐的gas价格
    const gasPrice = (await httpProvider.getFeeData()).gasPrice

    // 获取当前网络ID
    const network = await httpProvider.getNetwork();

    // 获取nonce
    const nonce = await httpProvider.getTransactionCount(from, 'latest');


    // 转换为十六进制格式
    const gasPriceHex = '0x' + gasPrice.toString(16);
    const gasLimitHex = '0x' + gasEstimate.toString(16);
    const chainId = '0x' + network.chainId.toString(16);
    const nonceHex = '0x' + nonce.toString(16);


    // 构建完整的交易数据
    const txData = {
      from: from,
      data: encodedBytecode,
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




// 准备合约调用交易数据
router.post('/prepare-call', async (req, res) => {
  // console.log('prepare-call', req.body);
  try {
    const { from, to, contractABI, functionName, args, data, value } = req.body;

    console.log('from:', from);
    console.log('to:  ', to);

    const { httpProvider } = req.app.locals;
    
    let callData;
    let encodedData = data;

    // 如果提供了ABI和函数信息，先进行函数调用编码
    if (contractABI && functionName && !data) {
      console.log('使用ABI编码函数调用');
      console.log('functionName:', functionName);
      console.log('args:', args);
      
      // 进行函数调用编码
      // 创建接口实例
      const iface = new ethers.Interface(contractABI);
      // 编码函数调用
      encodedData = await iface.encodeFunctionData(functionName, args);

      console.log('encoded data length:', encodedData ? encodedData.length : 0);
    } else if (data) {
      console.log('使用预编码数据');
      console.log('data length:', data.length);
    } else {
      throw new Error('必须提供合约ABI和函数信息，或者预编码的data');
    }

    const gasEstimate = await httpProvider.estimateGas({
        from: from,
        to: to,
        data: encodedData
    });

    // 获取当前推荐的gas价格
    const gasPrice = (await httpProvider.getFeeData()).gasPrice

    // 获取当前网络ID
    const network = await httpProvider.getNetwork();
    
    // 获取nonce
    const nonce = await httpProvider.getTransactionCount(from, 'latest');
    
    // 转换为十六进制格式
    const chainId = '0x' + network.chainId.toString(16);
    const nonceHex = '0x' + nonce.toString(16);
    const gasPriceHex = '0x' + gasPrice.toString(16);
    const gasLimitHex = '0x' + gasEstimate.toString(16);

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
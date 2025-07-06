/**
 * 合约相关API路由
 */
const express = require('express');
const router = express.Router();
const contractService = require('../services/hardhat');

// 处理函数调用结果，解决JSON序列化问题（主要针对BigInt类型）
// 获取智能合约列表
router.get('/', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const contracts = await contractService.getContractList(hre);
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
    const contract = await contractService.getContractDetails(hre, req.params.contractName);
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
    const { contractName, args = [] } = req.body;

    if (!contractName) {
      return res.status(400).json({ error: 'Contract name is required' });
    }

    const result = await contractService.deployContract(hre, contractName, args);
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
    const { contractName, contractAddress, method, args = [], value = '0' } = req.body;

    if (!contractName || !contractAddress || !method) {
      return res.status(400).json({ error: 'Contract name, address and method are required' });
    }

    console.log('Current network:', hre.network.name);
    console.log('contractAddress:', contractAddress);
    console.log('Calling contract:', contractName, 'method:', method, 'args:', args, value);

    const result = await contractService.callContractMethod(hre, contractName, contractAddress, method, args, value);
    res.json(result);
  } catch (error) {
    console.error('Error calling contract method:', error);
    res.status(500).json({ error: 'Failed to call contract method', details: error.message });
  }
});

module.exports = router;
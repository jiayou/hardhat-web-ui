/**
 * 合约相关API路由
 */
const express = require('express');
const router = express.Router();

// 处理函数调用结果，解决JSON序列化问题（主要针对BigInt类型）
function handleResult(value) {
  if (typeof value === 'bigint') {
    return value.toString();
  } else if (Array.isArray(value)) {
    return value.map(handleResult);
  } else if (value && typeof value === 'object') {
    const result = {};
    for (const key in value) {
      result[key] = handleResult(value[key]);
    }
    return result;
  }
  return value;
}

// 获取智能合约列表
router.get('/', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const artifactNames = await hre.artifacts.getAllFullyQualifiedNames();
    res.json({ contracts: artifactNames });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// 获取智能合约详情
router.get('/:contractName', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const name = req.params.contractName;
    const artifact = await hre.artifacts.readArtifact(name);
    res.json({ contract: artifact });
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

    const Contract = await hre.ethers.getContractFactory(contractName);
    const contract = await Contract.deploy(...args);
    await contract.waitForDeployment();

    res.json({
      success: true,
      address: await contract.getAddress(),
      deployTransaction: contract.deploymentTransaction()
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

    const artifact = await hre.artifacts.readArtifact(contractName);
    const contract = await hre.ethers.getContractAt(artifact.abi, contractAddress);

    // 区分调用方式
    let result;
    if (value && value !== '0') {
      result = await contract[method](...args, { value: hre.ethers.parseEther(value) });
    } else {
      result = await contract[method](...args);
    }

    // 等待交易完成
    if (result.wait) {
      await result.wait();
      res.json({ success: true, txHash: result.hash, result: 'Transaction successful' });
    } else {
      // 对于view/pure函数，处理BigInt序列化问题
      const processedResult = handleResult(result);
      res.json({ success: true, result: processedResult });
    }
  } catch (error) {
    console.error('Error calling contract method:', error);
    res.status(500).json({ error: 'Failed to call contract method', details: error.message });
  }
});

module.exports = router;
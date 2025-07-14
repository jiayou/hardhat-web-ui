/**
 * 网络相关API路由
 */
const express = require('express');
const router = express.Router();
const { isLiveNetwork, handleResult } = require('../utils');

// 获取最新区块高度
router.get('/latest-block', async (req, res) => {
  try {
    const { httpProvider } = req.app.locals;
    const height = await httpProvider.getBlockNumber();
    res.json({ height });
  } catch (error) {
    console.error('Error fetching latest block height:', error);
    res.status(500).json({ error: 'Failed to fetch latest block height' });
  }
});

// 获取网络信息
router.get('/info', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    result = {
      network: {
        name: hre.network.name,
        chainId: await ethers.provider.getNetwork().then(net => net.chainId),
        provider: hre.network.config.url || 'hardhat'
      },
      gasPrice: (await ethers.provider.getFeeData()).gasPrice,
      latestBlock: {
        number: await ethers.provider.getBlockNumber(),
      }
    }
    res.json(handleResult(result))
  } catch (error) {
    console.error('Error fetching network info:', error);
    res.status(500).json({ error: 'Failed to fetch network info' });
  }
});

// 是否是公链（已知ID）
router.get('/is_live', async (req, res) => {
    const { hre } = req.app.locals;
    res.json({ is_live: await isLiveNetwork(hre) });
})

module.exports = router;
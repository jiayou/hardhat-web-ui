/**
 * 网络相关API路由
 */
const express = require('express');
const router = express.Router();
const blockService = require('../services/blockService');

// 获取最新区块高度
router.get('/last-block', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const height = await blockService.getLatestBlockHeight(hre.ethers.provider);
    res.json({ height });
  } catch (error) {
    console.error('Error fetching latest block height:', error);
    res.status(500).json({ error: 'Failed to fetch latest block height' });
  }
});

module.exports = router;
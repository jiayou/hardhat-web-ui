/**
 * 区块相关API路由
 */
const express = require('express');
const router = express.Router();
const blockService = require('../services/blockService');

// 获取区块列表
router.get('/', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const result = await blockService.getBlockList(hre.ethers.provider, page, pageSize);
    res.json(result);
  } catch (error) {
    console.error('Error fetching blocks:', error);
    res.status(500).json({ error: 'Failed to fetch blocks' });
  }
});

// 获取区块详情
router.get('/:blockNumber', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const blockNumber = req.params.blockNumber;
    console.log(`Fetching block ${blockNumber}`);
    
    const block = await blockService.getBlockDetails(hre.ethers.provider, blockNumber);
    res.json({ block });
  } catch (error) {
    if (error.message === 'Block not found') {
      return res.status(404).json({ error: 'Block not found' });
    }
    console.error(`Error fetching block ${req.params.blockNumber}:`, error);
    res.status(500).json({ error: `Failed to fetch block ${req.params.blockNumber}` });
  }
});

module.exports = router;
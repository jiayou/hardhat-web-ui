/**
 * 区块相关API路由
 */
const express = require('express');
const router = express.Router();

// 获取区块列表
router.get('/', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const currentBlockNumber = await hre.ethers.provider.getBlockNumber();
    const startBlock = Math.max(0, currentBlockNumber - (page - 1) * pageSize);
    const endBlock = Math.max(0, startBlock - pageSize + 1);

    const blocks = [];
    for (let i = startBlock; i >= endBlock; i--) {
      const block = await hre.ethers.provider.getBlock(i);
      if (block) {
        blocks.push({
          number: block.number,
          hash: block.hash,
          timestamp: block.timestamp,
          txCount: block.transactions.length
        });
      }
    }

    res.json({
      blocks,
      pagination: {
        page,
        pageSize,
        total: currentBlockNumber + 1
      }
    });
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
    
    const block = await hre.ethers.provider.getBlock(blockNumber, true);
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }

    res.json({ block });
  } catch (error) {
    console.error(`Error fetching block ${req.params.blockNumber}:`, error);
    res.status(500).json({ error: `Failed to fetch block ${req.params.blockNumber}` });
  }
});

module.exports = router;
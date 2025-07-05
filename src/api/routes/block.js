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

    // 将循环获取区块改为并发获取
    const blockNumbers = Array.from({length: pageSize}, (_, i) => startBlock - i);
    const blocks = await Promise.all(
      blockNumbers.map(async (blockNumber) => {
        if (blockNumber < 0) return null;
        return hre.ethers.provider.getBlock(blockNumber);
      })
    );
    
    // 过滤掉null值并格式化
    const validBlocks = blocks
      .filter(block => block)
      .map(block => ({
        number: block.number,
        hash: block.hash,
        timestamp: block.timestamp,
        txCount: block.transactions.length,
        gasUsed: block.gasUsed.toString(),
        gasLimit: block.gasLimit.toString(),
        baseFeePerGas: block.baseFeePerGas?.toString() || null
      }));

    res.json({
      blocks: validBlocks,
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
/**
 * 区块相关API路由
 */
const express = require('express');
const router = express.Router();
const ethereum = require('../services/ethereum');

// 获取区块列表
router.get('/', async (req, res) => {
  try {
    const { httpProvider } = req.app.locals;
    const page = parseInt(req.query.page) || 1;
    const batchSize = parseInt(req.query.batchSize) || 10;

    const result = await ethereum.getBlockList(httpProvider, page, batchSize);
    res.json(result);
  } catch (error) {
    console.error('Error fetching blocks:', error);
    res.status(500).json({ error: 'Failed to fetch blocks' });
  }
});

// 获取区块详情（通过编号或哈希）
router.get('/:blockIdentifier', async (req, res) => {
  try {
    const { httpProvider } = req.app.locals;
    const blockIdentifier = req.params.blockIdentifier;
    let block;

    block = await ethereum.getBlockById(httpProvider, blockIdentifier)
    res.json({ block });
  } catch (error) {
    if (error.message === 'Block not found') {
      return res.status(404).json({ error: '区块未找到' });
    }
    console.error(`获取区块 ${req.params.blockIdentifier} 失败:`, error);
    res.status(500).json({ error: `获取区块 ${req.params.blockIdentifier} 失败` });
  }
});

module.exports = router;
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

// 获取区块详情（通过编号或哈希）
router.get('/:blockIdentifier', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const blockIdentifier = req.params.blockIdentifier;
    let block;

    // 尝试解析为区块号
    const blockNumber = parseInt(blockIdentifier);
    if (!isNaN(blockNumber)) {
      block = await blockService.getBlockByNumber(hre.ethers.provider, blockNumber);
    } else if (blockIdentifier.match(/^0x[0-9a-fA-F]{64}$/)) {
      // 验证哈希格式
      block = await blockService.getBlockByHash(hre.ethers.provider, blockIdentifier);
    } else {
      return res.status(400).json({ error: '无效的区块标识符。必须是数字或66字符的十六进制哈希。' });
    }

    res.json({ block });
  } catch (error) {
    if (error.message === 'Block not found') {
      return res.status(404).json({ error: '区块未找到' });
    }
    console.error(`获取区块 ${req.params.blockIdentifier} 失败:`, error);
    res.status(500).json({ error: `获取区块 ${req.params.blockIdentifier} 失败` });
  }
});

// 通过区块号获取区块详情
router.get('/by-number/:blockNumber', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const blockNumber = parseInt(req.params.blockNumber);
    
    if (isNaN(blockNumber)) {
      return res.status(400).json({ error: '无效的区块号' });
    }
    
    const block = await blockService.getBlockByNumber(hre.ethers.provider, blockNumber);
    res.json({ block });
  } catch (error) {
    if (error.message === 'Block not found') {
      return res.status(404).json({ error: '区块未找到' });
    }
    console.error(`通过区块号 ${req.params.blockNumber} 获取区块失败:`, error);
    res.status(500).json({ error: `通过区块号 ${req.params.blockNumber} 获取区块失败` });
  }
});

// 通过区块哈希获取区块详情
router.get('/by-hash/:blockHash', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const blockHash = req.params.blockHash;
    
    // 验证哈希格式
    if (!blockHash.match(/^0x[0-9a-fA-F]{64}$/)) {
      return res.status(400).json({ error: '无效的区块哈希格式' });
    }
    
    const block = await blockService.getBlockByHash(hre.ethers.provider, blockHash);
    res.json({ block });
  } catch (error) {
    if (error.message === 'Block not found') {
      return res.status(404).json({ error: '区块未找到' });
    }
    console.error(`通过哈希 ${req.params.blockHash} 获取区块失败:`, error);
    res.status(500).json({ error: `通过哈希 ${req.params.blockHash} 获取区块失败` });
  }
});

// 获取区块中的所有交易
router.get('/block-tx/:blockHash', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const blockHash = req.params.blockHash;
    
    // 验证哈希格式
    if (!blockHash.match(/^0x[0-9a-fA-F]{64}$/)) {
      return res.status(400).json({ error: '无效的区块哈希格式' });
    }
    
    const transactions = await blockService.getTransactionsInBlock(hre.ethers.provider, blockHash);
    res.json({ transactions, count: transactions.length });
  } catch (error) {
    if (error.message === 'Block not found') {
      return res.status(404).json({ error: '区块未找到' });
    }
    console.error(`获取区块 ${blockHash} 交易失败:`, error);
    res.status(500).json({ error: `获取区块 ${blockHash} 交易失败` });
  }
});

module.exports = router;
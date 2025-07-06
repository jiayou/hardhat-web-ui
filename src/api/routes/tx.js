/**
 * 交易相关API路由
 */
const express = require('express');
const router = express.Router();
const txService = require('../services/txService');
const blockService = require('../services/blockService');
const { ethersProvider, extractBlockInfo } = require('../utils');

// 获取交易列表
router.get('/', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const lastBlockNum = await blockService.getLatestBlockHeight(hre.ethers.provider);
    const blockNum = parseInt(req.query.blockNum) || lastBlockNum;
    const batchSize = parseInt(req.query.batchSize) || 10;

    const result = await txService.getTransactionList(hre.ethers.provider, blockNum, batchSize);
    res.json(result);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// 获取交易详情
router.get('/:txHash', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const txHash = req.params.txHash;
    let provider = ethersProvider(hre);
    const result = await txService.getTransactionDetails(provider, txHash);
    res.json(result);
  } catch (error) {
    if (error.message === 'Transaction not found') {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    console.error(`Error fetching transaction ${req.params.txHash}:`, error);
    res.status(500).json({ error: `Failed to fetch transaction ${req.params.txHash}` });
  }
});

module.exports = router;
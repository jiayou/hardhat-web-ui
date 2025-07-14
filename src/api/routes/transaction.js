/**
 * 交易相关API路由
 */
const express = require('express');
const router = express.Router();
const ethereum = require('../services/ethereum');
const { isLocalChain } = require('../utils');

// 获取交易列表
router.get('/', async (req, res) => {
  try {
    const { httpProvider } = req.app.locals;
    const lastBlockNum = await httpProvider.getBlockNumber();
    const blockNum = parseInt(req.query.blockNum) || lastBlockNum;
    const batchSize = parseInt(req.query.batchSize) || 10;
    const fields = req.query.fields?.split(',') || [];
    
    let result = {data: [], nextBlock: -1};
    const { hre } = req.app.locals;
    if (isLocalChain(hre)) {
      // 测试链：获取相关交易
      result = await ethereum.searchTransactions(httpProvider, blockNum, batchSize, fields);
    }
    res.json(result);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// 获取交易详情
router.get('/:txHash', async (req, res) => {
  try {
    const { httpProvider } = req.app.locals;
    const txHash = req.params.txHash;

    const result = await ethereum.getTransaction(httpProvider, txHash);
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
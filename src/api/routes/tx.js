/**
 * 交易相关API路由
 */
const express = require('express');
const router = express.Router();

// 获取交易列表
router.get('/', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const currentBlockNumber = await hre.ethers.provider.getBlockNumber();
    const startBlock = Math.max(0, currentBlockNumber - (page - 1) * pageSize);
    const endBlock = Math.max(0, startBlock - pageSize + 1);

    let transactions = [];
    for (let i = startBlock; i >= endBlock; i--) {
      const block = await hre.ethers.provider.getBlock(i, true);
      if (block && block.transactions.length > 0) {
        const blockTxs = block.transactions.map(tx => ({
          hash: tx.hash,
          blockNumber: tx.blockNumber,
          from: tx.from,
          to: tx.to,
          value: tx.value.toString(),
          timestamp: block.timestamp
        }));
        transactions = transactions.concat(blockTxs);
      }
    }

    // 分页处理
    const paginatedTxs = transactions.slice(0, pageSize);

    res.json({
      transactions: paginatedTxs,
      pagination: {
        page,
        pageSize,
        total: transactions.length
      }
    });
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
    
    const tx = await hre.ethers.provider.getTransaction(txHash);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);
    
    res.json({ 
      transaction: tx,
      receipt: receipt
    });
  } catch (error) {
    console.error(`Error fetching transaction ${req.params.txHash}:`, error);
    res.status(500).json({ error: `Failed to fetch transaction ${req.params.txHash}` });
  }
});

module.exports = router;
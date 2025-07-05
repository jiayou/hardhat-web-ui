const ethers = require('ethers');

/**
 * 获取交易列表
 * @param {ethers.providers.Provider} provider - Ethers Provider实例
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 包含交易列表和分页信息的对象
 */
async function getTransactionList(provider, page = 1, pageSize = 10) {
  try {
    const currentBlockNumber = await provider.getBlockNumber();
    const startBlock = Math.max(0, currentBlockNumber - (page - 1) * pageSize);
    const endBlock = Math.max(0, startBlock - pageSize + 1);

    let transactions = [];
    for (let i = startBlock; i >= endBlock; i--) {
      const block = await provider.getBlock(i, true);
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

    return {
      transactions: paginatedTxs,
      pagination: {
        page,
        pageSize,
        total: transactions.length
      }
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

/**
 * 获取交易详情
 * @param {ethers.providers.Provider} provider - Ethers Provider实例
 * @param {string} txHash - 交易哈希
 * @returns {Promise<Object>} 交易详情和收据
 */
async function getTransactionDetails(provider, txHash) {
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      throw new Error('Transaction not found');
    }

    const receipt = await provider.getTransactionReceipt(txHash);

    // 处理BigInt字段
    const formattedTx = {
      ...tx,
      value: tx.value?.toString(),
      gasLimit: tx.gasLimit?.toString(),
      gasPrice: tx.gasPrice?.toString(),
      maxFeePerGas: tx.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
      chainId: tx.chainId?.toString()
    };

    const formattedReceipt = receipt ? {
      ...receipt,
      gasUsed: receipt.gasUsed?.toString(),
      cumulativeGasUsed: receipt.cumulativeGasUsed?.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice?.toString()
    } : null;

    return {
      transaction: formattedTx,
      receipt: formattedReceipt
    };
  } catch (error) {
    console.error(`Error fetching transaction ${txHash}:`, error);
    throw error;
  }
}

module.exports = {
  getTransactionList,
  getTransactionDetails
};
const ethers = require('ethers');

/**
 * 获取区块列表
 * @param {ethers.providers.Provider} provider - Ethers Provider实例
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 包含区块列表和分页信息的对象
 */
async function getBlockList(provider, page = 1, pageSize = 10) {
  try {
    const currentBlockNumber = await provider.getBlockNumber();
    const startBlock = Math.max(0, currentBlockNumber - (page - 1) * pageSize);
    const endBlock = Math.max(0, startBlock - pageSize + 1);

    // 并发获取区块
    const blockNumbers = Array.from({ length: pageSize }, (_, i) => startBlock - i);
    const blocks = await Promise.all(
      blockNumbers.map(async (blockNumber) => {
        if (blockNumber < 0) return null;
        return provider.getBlock(blockNumber);
      })
    );

    // 过滤并格式化区块数据
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

    return {
      blocks: validBlocks,
      pagination: {
        page,
        pageSize,
        total: currentBlockNumber + 1
      }
    };
  } catch (error) {
    console.error('Error fetching blocks:', error);
    throw error;
  }
}

/**
 * 获取区块详情
 * @param {ethers.providers.Provider} provider - Ethers Provider实例
 * @param {string|number} blockNumber - 区块号或区块哈希
 * @returns {Promise<Object>} 格式化的区块详情
 */
async function getBlockDetails(provider, blockNumber) {
  try {
    const block = await provider.getBlock(blockNumber, true);
    if (!block) {
      throw new Error('Block not found');
    }

    // 格式化交易数据
    const formattedTransactions = block.transactions.map(tx => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value ? ethers.utils.formatEther(tx.value) : '0',
      gasLimit: tx.gasLimit?.toString() || null,
      gasPrice: tx.gasPrice?.toString() || null,
      input: tx.input,
      nonce: tx.nonce,
      transactionIndex: tx.transactionIndex
    }));

    // 处理BigInt字段序列化问题
    return {
      number: block.number?.toString(),
      hash: block.hash,
      timestamp: block.timestamp?.toString(),
      parentHash: block.parentHash,
      nonce: block.nonce?.toString(),
      difficulty: block.difficulty?.toString(),
      gasLimit: block.gasLimit.toString(),
      gasUsed: block.gasUsed.toString(),
      miner: block.miner,
      baseFeePerGas: block.baseFeePerGas?.toString(),
      transactions: formattedTransactions,
      txCount: block.transactions.length
    };
  } catch (error) {
    console.error(`Error fetching block ${blockNumber}:`, error);
    throw error;
  }
}

module.exports = {
  getBlockList,
  getBlockDetails
};
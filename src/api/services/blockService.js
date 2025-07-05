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
 * 格式化区块详情数据
 * @param {Object} block - 原始区块数据
 * @returns {Object} 格式化后的区块详情
 */
async function formatBlockDetails(provider, block) {
  console.log(block)
  console.log(block.transactions)
/*
Block {
  number: 1,
  hash: '0x866ccbc7f9d3eb474dce1c1ccab4995d24b9b4c7c1c27979194bd3ec779bb4a7',
  timestamp: 1751199947,
  parentHash: '0x90b4843db62c8c1a731fde2c3187b9de635694d1f6b6d132d0f505f90d83bcf3',
  parentBeaconBlockRoot: undefined,
  nonce: '0x0000000000000000',
  difficulty: 0n,
  gasLimit: 30000000n,
  gasUsed: 21000n,
  stateRoot: undefined,
  receiptsRoot: undefined,
  blobGasUsed: undefined,
  excessBlobGas: undefined,
  miner: '0xC014BA5EC014ba5ec014Ba5EC014ba5Ec014bA5E',
  prevRandao: null,
  extraData: '0x',
  baseFeePerGas: 875000000n
}

*/
  let txInfo = [];
  for (let tx_hash of block.transactions) {
    txInfo.push(await provider.getTransaction(tx_hash));
  }

  return {
      number: block.number?.toString(),
      hash: block.hash,
      timestamp: block.timestamp?.toString(),
      // parentHash: block.parentHash,
      // parentBeaconBlockRoot: block.parentBeaconBlockRoot,
      // nonce: block.nonce?.toString(),
      // difficulty: block.difficulty?.toString(),
      // gasLimit: block.gasLimit.toString(),
      // gasUsed: block.gasUsed.toString(),
      // stateRoot: block.stateRoot,
      // receiptsRoot: block.receiptsRoot,
      // blobGasUsed: block.blobGasUsed?.toString(),
      // excessBlobGas: block.excessBlobGas?.toString(),
      // miner: block.miner,
      // prevRandao: block.prevRandao,
      // extraData: block.extraData,
      // baseFeePerGas: block.baseFeePerGas?.toString(),
      txInfo: txInfo, //block.transactions, //.map(async tx_hash => await provider.getTransaction(tx_hash)),
      txCount: block.transactions.length
    };
}

/**
 * 通过区块哈希获取区块详情
 * @param {ethers.providers.Provider} provider - Ethers Provider实例
 * @param {string} blockHash - 区块哈希
 * @returns {Promise<Object>} 格式化的区块详情
 */
async function getBlockByHash(provider, blockHash) {
  try {
    const block = await provider.getBlock(blockHash, true);
    if (!block) {
      throw new Error('Block not found');
    }
    return await formatBlockDetails(provider, block);
  } catch (error) {
    console.error(`Error fetching block by hash ${blockHash}:`, error);
    throw error;
  }
}

/**
 * 通过区块号获取区块详情
 * @param {ethers.providers.Provider} provider - Ethers Provider实例
 * @param {number} blockNumber - 区块号
 * @returns {Promise<Object>} 格式化的区块详情
 */
async function getBlockByNumber(provider, blockNumber) {
  try {
    const block = await provider.getBlock(blockNumber, true);
    if (!block) {
      throw new Error('Block not found');
    }
    return await formatBlockDetails(provider, block);
  } catch (error) {
    console.error(`Error fetching block by number ${blockNumber}:`, error);
    throw error;
  }
}

/**
 * 获取最新区块高度
 * @param {ethers.providers.Provider} provider - Ethers Provider实例
 * @returns {Promise<number>} 最新区块高度
 */
async function getLatestBlockHeight(provider) {
  try {
    return await provider.getBlockNumber();
  } catch (error) {
    console.error('Error fetching latest block height:', error);
    throw error;
  }
}

/**
 * 获取指定区块中的所有交易详情
 * @param {ethers.providers.Provider} provider - Ethers Provider实例
 * @param {string} blockHash - 区块哈希
 * @returns {Promise<Array>} 格式化后的交易列表
 */
async function getTransactionsInBlock(provider, blockHash) {
  try {
    const block = await getBlockByHash(provider, blockHash);
    return block.transactions;
  } catch (error) {
    console.error(`Error fetching transactions in block ${blockHash}:`, error);
    throw error;
  }
}


module.exports = {
  getBlockList,
  getBlockByNumber,
  getBlockByHash,
  getLatestBlockHeight,
  getTransactionsInBlock
};
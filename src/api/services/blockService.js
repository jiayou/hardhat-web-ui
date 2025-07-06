const ethers = require('ethers');
const { handleResult } = require('../utils');

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
  // console.log(block)
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

  // console.log(block.transactions)
/*
[
  '0xb211011388224583df921f4b2c3b0628dfb26bba8201dae5e235d46714b8ee92'
]
*/

  let txInfo = [];
  for (let tx_hash of block.transactions) {
    tx_item = await provider.getTransaction(tx_hash);
    txInfo.push(handleResult(tx_item));
  }

  let block_info = handleResult(block)
  block_info.txInfo = txInfo
  block_info.txCount = block.transactions.length

  return block_info;
}

/**
 * 通过区块哈希获取区块详情
 * @param {ethers.providers.Provider} provider - Ethers Provider实例
 * @param {string} blockId - 区块哈希或区块号
 * @returns {Promise<Object>} 格式化的区块详情
 */
async function getBlockById(provider, blockId) {
  try {
    const block = await provider.getBlock(blockId, true);
    if (!block) {
      throw new Error('Block not found');
    }
    return await formatBlockDetails(provider, block);
  } catch (error) {
    console.error(`Error fetching block ${blockId}:`, error);
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

module.exports = {
  getBlockList,
  getBlockById,
  getLatestBlockHeight
};
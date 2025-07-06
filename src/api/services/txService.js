const ethers = require('ethers');
const { handleResult, extractBlockInfo } = require('../utils');

/**
 * 获取交易列表
 * @param {ethers.providers.Provider} provider - Ethers Provider实例
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 包含交易列表和分页信息的对象
 */
async function getTransactionList(provider, blockNum, batchSize = 10) {
  try {
    // const currentBlockNumber = await provider.getBlockNumber();
    // const startBlock = Math.max(0, currentBlockNumber - (page - 1) * pageSize);
    // const endBlock = Math.max(0, startBlock - pageSize + 1);

    let paginatedTxs = await extractBlockInfo(provider, blockNum, batchSize, 
      async (block)=>{
        let txs = await Promise.all(block.transactions?.map(async (tx_hash) => {
          console.log("tx_hash:", tx_hash)
          return await provider.getTransaction(tx_hash)
        }))
        // console.log("txs:", txs)
        return txs
      })

    return paginatedTxs
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

    console.log(tx)
    const receipt = await provider.getTransactionReceipt(txHash);
    console.log(receipt)
    
    return {
      transaction: handleResult(tx),
      receipt: handleResult(receipt)
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
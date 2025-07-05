const ethers = require('ethers');

/**
 * 获取账户相关交易
 * @param {ethers.providers.Provider} provider - Ethers Provider实例
 * @param {string} address - 账户地址
 * @returns {Promise<Array>} 格式化后的交易列表
 */
async function getAccountTransactions(provider, address) {
  try {
    const blockNumber = await provider.getBlockNumber();
    const transactions = [];

    // 限制最多查询5个区块以提高性能
    for (let i = 0; i < 5 && blockNumber - i >= 0; i++) {
      const block = await provider.getBlock(blockNumber - i, true);
      if (block && block.transactions) {
        // 筛选与指定地址相关的交易
        const relevantTxs = block.transactions.filter(tx => {
          try {
            const fromMatches = tx && tx.from ? tx.from.toLowerCase() === address.toLowerCase() : false;
            const toMatches = tx && tx.to ? tx.to.toLowerCase() === address.toLowerCase() : false;
            return fromMatches || toMatches;
          } catch (err) {
            console.error('Error filtering transaction:', err, 'Transaction:', JSON.stringify(tx));
            return false;
          }
        });

        // 格式化交易对象
        const formattedTxs = relevantTxs.map(tx => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to || '0x',
          value: tx.value.toString(),
          blockNumber: tx.blockNumber,
          timestamp: block.timestamp,
          gasUsed: tx.gasUsed?.toString() || '0',
          gasPrice: tx.gasPrice?.toString() || '0'
        }));

        transactions.push(...formattedTxs);
      }
    }

    return transactions.slice(0, 50);
  } catch (error) {
    console.error('Error fetching transactions for address:', address, error);
    return [];
  }
}

module.exports = {
  getAccountTransactions
};
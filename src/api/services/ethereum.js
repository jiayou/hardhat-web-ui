const { handleResult } = require('../utils');
const { extractBlockInfo, useFields }= require('../utils');



//=============================================================== 区块高度：
  // const currentBlockNumber = await provider.getBlockNumber();


//=============================================================== 区块列表 TODO：分页查询

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


//=============================================================== 区块详情
async function getBlockById(provider, blockId) {
  try {
    const block = await provider.getBlock(blockId, true);
    if (!block) {
      throw new Error('Block not found');
    }
    // return await formatBlockDetails(provider, block);

    let txInfo = [];
    for (let tx_hash of block.transactions) {
      tx_item = await provider.getTransaction(tx_hash);
      txInfo.push(handleResult(tx_item));
    }

    let block_info = handleResult(block)
    block_info.txInfo = txInfo
    block_info.txCount = block.transactions.length

    return block_info;

  } catch (error) {
    console.error(`Error fetching block ${blockId}:`, error);
    throw error;
  }
}



//=============================================================== 分页查找交易记录

async function searchTransactions(provider, blockNum, batchSize = 10, fields=null) {
  try {
    let paginatedTxs = await extractBlockInfo(provider, blockNum, batchSize, 
      async (block)=>{
        if (!fields) return block.transactions

        return await Promise.all(block.transactions?.map(async (tx_hash) => {
          // console.log("tx_hash:", tx_hash)
          const tx_item = await provider.getTransaction(tx_hash)
          return useFields(tx_item, fields) // 只返回tx_item对象中fields指定的字段
        }))
      })

    return paginatedTxs
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}


//=============================================================== 获取交易详情
async function getTransaction(provider, txHash) {
  try {
    const tx = await provider.getTransaction(txHash);
    // console.log(tx)
    if (!tx) {
      throw new Error('Transaction not found');
    }

    const receipt = await provider.getTransactionReceipt(txHash);
    // console.log(receipt)
    
    return {
      transaction: handleResult(tx),
      receipt: handleResult(receipt)
    };

    // https://cloud.tencent.com/developer/ask/sof/116176256
    // 交易响应和交易收据之间有区别吗？

  } catch (error) {
    console.error(`Error fetching transaction ${txHash}:`, error);
    throw error;
  }
}



//=============================================================== 获取账户列表
async function listAccounts(provider) {
  return await provider.listAccounts()
}

async function getSigners(provider) {
  const accounts =  await provider.listAccounts()
  // const traders = await searchAccounts(provider, null, 100)  // 默认搜索最近100个区块中的交易账户

  // console.log(accounts)
  // console.log(traders)

  let result = accounts.map( x => x.address)
  // console.log(result)

  return result
}


//=============================================================== 分页搜索交易账户

async function searchAccounts(provider, blockNum=null, batchSize = 10) {
  blockNum = blockNum || (await provider.getBlockNumber())
  try {
    let paginatedTraders = await extractBlockInfo(provider, blockNum, batchSize, 
      async (block)=>{
        let traders = await Promise.all(block.transactions?.map(async (tx_hash) => {
          // console.log("tx_hash:", tx_hash)
          let tx_item = await provider.getTransaction(tx_hash)
          // console.log("tx_item:", tx_item)
          return {from: tx_item.from, to: tx_item.to}
        }))
        return traders
      })
    return paginatedTraders

    /*
    Usage: 
      let result = await searchAccounts(provider, 0, 10)
      const flatData = result.data.flat();
      ...
    */
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }

}





//=============================================================== 搜索某账户的全部交易
async function searchAccountTransactions(provider, blockNum, batchSize, accountId) {

  try {
    const account_tx = await extractBlockInfo(provider, blockNum, batchSize, 
      async (block)=>{
        return await Promise.all(block.transactions?.map(async (tx_hash) => {
          let tx_item = await provider.getTransaction(tx_hash)
          if (tx_item.from == accountId || tx_item.to == accountId){
            return tx_item
          }
          return null
        }))
      })

    return account_tx

  } catch (error) {
    console.error(`Error fetching transactions for account ${accountId}:`, error);
    throw error;
  }
}











module.exports = {
  getBlockList,
  getBlockById,
  searchTransactions,
  getTransaction,
  searchAccounts,
  listAccounts,
  getSigners,
  searchAccountTransactions
};



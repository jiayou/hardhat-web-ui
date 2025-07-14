const { handleResult, isLiveNetwork } = require('../utils');
const { extractBlockInfo, useFields }= require('../utils');



//=============================================================== 区块高度：
  // const currentBlockNumber = await provider.getBlockNumber();


//=============================================================== 区块列表 TODO：分页查询

async function getBlockList(provider, blockNum = null, batchSize = 10, fields = null) {
  try {
    blockNum = blockNum || await provider.getBlockNumber();

    // 并发获取区块
    const paginatedBlocks = await extractBlockInfo(provider, blockNum, batchSize, async (block) => block)
    return paginatedBlocks

  } catch (error) {
    console.error('Error fetching blocks:', error);
    throw error;
  }
}


//=============================================================== 区块详情
async function getBlockById(hre, provider, blockId) {
  try {
    if ( ! blockId.startsWith('0x')) {
      blockId = parseInt(blockId);
    }

    const block = await provider.getBlock(blockId, true);
    if (!block) {
      throw new Error('Block not found');
    }
    // return await formatBlockDetails(provider, block);

    let txInfo = [];
    for (let tx_hash of block.transactions) {
      if (isLiveNetwork(hre)) {
        tx_item = { hash: tx_hash }
      }
      else {
        tx_item = await provider.getTransaction(tx_hash);
      }
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





//================================================================== 获取账户详情

/**
 * 获取账户详情，根据账户类型返回不同字段
 * 
 * @param {object} provider - 以太坊提供者
 * @param {string} address - 账户地址
 * @returns {object} 根据账户类型返回不同的账户详情
 */
async function getAccountDetails(provider, address) {
  // 基本信息（所有账户类型都需要）
  const balance = await provider.getBalance(address);
  const transactions = null //await provider.getTransactions(address);
  const nonce = null // await provider.getNonce(address);

  // 获取代码以判断账户类型（EOA账户代码为空，合约账户有代码）
  const code = await provider.getCode(address);
  const isContract = code && code !== '0x';

  // 通用的网络信息
  const gasPrice = (await httpProvider.getFeeData()).gasPrice
  const blockNumber = await provider.getBlockNumber();

  // 根据账户类型返回不同字段
  if (isContract) {
    // 合约账户特有信息
    // const abi = await provider.getABI(address);
    // const events = await provider.getEvents(address);
    // const methods = await provider.getMethods(address);
    // const creationTime = await provider.getCreationTime(address);

    // 代币相关（如果合约是代币合约）
    // const erc20Balance = await provider.getERC20Balance(address);
    // const erc721Balance = await provider.getERC721Balance(address);
    // const erc1155Balance = await provider.getERC1155Balance(address);

    return {
      type: 'Contract',
      address,
      balance,
      transactions,
      nonce,
      code,
      // abi,
      // events,
      // methods,
      // creationTime,
      // erc20Balance,
      // erc721Balance,
      // erc1155Balance,
      // 网络信息
      gasPrice,
      blockNumber
    };
  } else {
    // 外部账户(EOA)特有信息
    const status = null // await provider.getStatus(address);

    // 代币余额
    // const erc20Balance = await provider.getERC20Balance(address);
    // const erc721Balance = await provider.getERC721Balance(address);
    // const erc1155Balance = await provider.getERC1155Balance(address);

    return {
      type: 'EOA',
      address,
      balance,
      transactions,
      nonce,
      // status,
      // erc20Balance,
      // erc721Balance,
      // erc1155Balance,
      // 网络信息
      gasPrice,
      blockNumber
    };
  }
}




module.exports = {
  getBlockList,
  getBlockById,
  searchTransactions,
  getTransaction,
  searchAccounts,
  listAccounts,
  getAccountDetails,
  getSigners,
  searchAccountTransactions
};
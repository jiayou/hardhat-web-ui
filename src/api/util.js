const ethers = require('ethers');

/**
 * 处理函数调用结果，解决JSON序列化问题（主要针对BigInt类型）
 * @param {any} value - 需要处理的值
 * @returns {any} 处理后的值
 */
function handleResult(value) {
  if (typeof value === 'bigint') {
    return value.toString();
  } else if (Array.isArray(value)) {
    return value.map(handleResult);
  } else if (value && typeof value === 'object') {
    const result = {};
    for (const key in value) {
      result[key] = handleResult(value[key]);
    }
    return result;
  }
  return value;
}


function ethersProvider(hre) {
    return hre.ethers.provider
  return new ethers.JsonRpcProvider(hre.network.config.url);
}


// 从最后一个区块向前查找指定数量的区块，从区块中提取符合条件的账户信息
// 参数：当前区块，一次查询数量，查询条件（账户地址），提取方法
// 返回：符合条件的数据
async function extractBlockInfo(provider, startBlock, pageSize, extractFunc) {
  let result = [];
  for (let i = startBlock; i >= 0 && result.length < pageSize; i--) {
    console.log('extractBlockInfo', i)
    let block = await provider.getBlock(i, true);
      let info = await extractFunc(block);
      console.log("info:", info)
      result.push(info);
  }
  return result;
}

module.exports = {
  handleResult,
  ethersProvider,
  extractBlockInfo
}

const express = require('express');

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


// 从最后一个区块向前查找指定数量的区块，从区块中提取符合条件的账户信息
// 参数：当前区块，一次查询数量，查询条件（账户地址），提取方法
// 返回：符合条件的数据，下一个区块号
async function extractBlockInfo(provider, startBlock, batchSize, extractFunc) {
  let result = [];
  let i = startBlock
  for (; i >= 0 && result.length < batchSize; i--) {
    // console.log('extractBlockInfo', i)
    let block = await provider.getBlock(i, true);
    let info = await extractFunc(block);
    //   console.log("info:", info)
    result.push(info);
  }
  return {
    data: result,
    nextBlock: i
  };
}

//从一个对象中提取指定的字段，并返回一个新的对象，其中只包含这些字段。
function useFields(object, fields) 
{
  if (!fields) {
    return object;
  }
  const result = {};
  for (const field of fields) {
    result[field] = object[field];
  }
  return handleResult(result);
}

async function isLocalChain(hre) {
  const localChainIds = hre.config.webUI.localChainIds
  // defined in hardhat.config.js

  try {
    const chainId = await ethers.provider.getNetwork().then(net => net.chainId);
    const criteria = localChainIds.includes(parseInt(chainId))
    // console.log('isLocalChain',localChainIds, chainId, criteria)
    return criteria;
  }
  catch (error) {
    console.log('treat network as non-local due to error:', error)
    return false;
  }
}

module.exports = {
  handleResult,
  useFields,
  isLocalChain,
  extractBlockInfo
}

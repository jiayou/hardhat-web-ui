// 为前端浏览器钱包准备数据。
const { ethers } = require('ethers');
/*
调用方法：

1. 前端 POST /api/transaction
2. 后端判断signer是否为测试账号，
2-a. 如果是直接交易，
2-b. 如果不是调用这里的函数，返回交易数据给前端钱包，前端调用钱包签名交易

TODO：
1. 判断是否为hardhat测试账号
2. 判断如果合约方法是只读方法，不需要钱包签名
*/

async function prepareTansfer(provider, from, to, value) {
    // 准备转账交易数据
    return {
        from: from,
        to: to,
        value: value, // 以wei为单位的转账金额
        // 获取当前网络的推荐gas价格和估算gas限制
        gasPrice: (await provider.getFeeData()).gasPrice,
        gasLimit: 21000, // 简单转账的标准gas限制
    }
}

async function prepareDeploy(provider, from, bytecode, args, contractABI, value = 0) {
    console.log('Preparing deploy with:', { from, bytecodeLength: bytecode?.length, args, contractABI: JSON.stringify(contractABI, null, 2) });
    // 准备部署合约的交易数据
    let deployData = bytecode;
    
    // 从ABI中获取构造函数
    const constructor = contractABI.find(item => item.type === 'constructor');
    
    // 如果有构造函数参数，对参数进行编码并拼接到bytecode
    if (constructor && constructor.inputs && constructor.inputs.length > 0 && args && args.length > 0) {
        // 创建接口实例
        const iface = new ethers.Interface([constructor]);
        const encodedArgs = iface.encodeDeploy(args);
        deployData = bytecode + encodedArgs.slice(2); // 移除0x前缀后拼接
    }
    
    // 估算部署合约的gas限制
    let gasEstimate;
    try {
      gasEstimate = await provider.estimateGas({
        from: from,
        data: deployData,
          value: value
    });
    console.log('Gas estimate successful:', gasEstimate.toString());
  } catch (error) {
    console.error('Gas estimation failed:', error);
    console.error('Deployment data:', deployData);
    throw error;
  }
    
    // 获取当前推荐的gas价格
    const gasPrice = (await provider.getFeeData()).gasPrice
    
    return {
        from: from,
        data: deployData,
        gasLimit: gasEstimate,
        gasPrice: gasPrice
    }
}

async function prepareCall(provider, from, to, data) {
    // 准备调用合约方法的交易数据
    // 估算交易的gas限制
    const gasEstimate = await provider.estimateGas({
        from: from,
        to: to,
        data: data
    });
    
    // 获取当前推荐的gas价格
    const gasPrice = (await provider.getFeeData()).gasPrice
    
    return {
        from: from,
        to: to,
        data: data,
        gasLimit: gasEstimate,
        gasPrice: gasPrice
    }
}


function encodeFunctionCall(abi, functionName, params) {
    // 创建接口实例
    const iface = new ethers.Interface(abi);
    // 编码函数调用
    return iface.encodeFunctionData(functionName, params);
}

module.exports = {
    prepareTansfer,
    prepareDeploy,
    prepareCall,
    encodeFunctionCall
}

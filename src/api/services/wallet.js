// 为前端浏览器钱包准备数据。
import { ethers } from 'ethers';
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

function prepareTansfer(provider, from, to, value) {
    // 准备转账交易数据
    return {
        from: from,
        to: to,
        value: value, // 以wei为单位的转账金额
        // 获取当前网络的推荐gas价格和估算gas限制
        gasPrice: provider.getGasPrice(),
        gasLimit: 21000, // 简单转账的标准gas限制
    }
}

async function prepareDeploy(provider, from, bytecode, args) {
    // 准备部署合约的交易数据
    const deployData = bytecode;
    
    // 估算部署合约的gas限制
    const gasEstimate = await provider.estimateGas({
        from: from,
        data: deployData
    });
    
    // 获取当前推荐的gas价格
    const gasPrice = await provider.getGasPrice();
    
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
    const gasPrice = await provider.getGasPrice();
    
    return {
        from: from,
        to: to,
        data: data,
        gasLimit: gasEstimate,
        gasPrice: gasPrice
    }
}


// 判断地址是否为Hardhat测试账号
function isHardhatTestAccount(address) {
    // Hardhat默认测试账号地址范围
    const hardhatAccounts = [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
        '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
        '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
        '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
        '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720'
    ];
    
    return hardhatAccounts.includes(address.toLowerCase());
}

// 判断合约方法是否为只读方法
async function isReadOnlyMethod(provider, to, data) {
    if (!to || !data) return false;
    
    // 从data中提取函数选择器(前4个字节/8个十六进制字符)
    const selector = data.slice(0, 10); // 包含0x前缀和4字节
    
    try {
        // 获取合约ABI接口
        const contract = new provider.eth.Contract([], to);
        
        // 尝试获取合约接口
        const abi = await contract.methods._jsonInterface;
        
        if (abi) {
            // 查找匹配该选择器的函数定义
            const method = abi.find(item => {
                return item.type === 'function' && 
                       item.signature && 
                       item.signature.slice(0, 10) === selector;
            });
            
            if (method) {
                // constant、view和pure修饰符的函数都是只读的
                return method.constant === true || 
                       method.stateMutability === 'view' || 
                       method.stateMutability === 'pure';
            }
        }
        
        // 如果无法通过ABI判断，使用更可靠的替代方法：
        // 1. 获取当前区块号
        const blockNumber = await provider.getBlockNumber();
        
        // 2. 对同一区块进行两次调用，比较结果是否一致
        // 如果是只读方法，多次调用结果应该一致
        const result1 = await provider.call({
            to: to,
            data: data
        }, blockNumber);
        
        const result2 = await provider.call({
            to: to,
            data: data
        }, blockNumber);
        
        // 如果结果一致，很可能是只读方法
        return result1 === result2;
    } catch (error) {
        console.error('Error determining if method is read-only:', error);
        // 发生错误时，保守地假设它是非只读方法
        return false;
    }
}

function encodeFunctionCall(abi, functionName, params) {
    // 创建接口实例
    const iface = new ethers.utils.Interface(abi);
    // 编码函数调用
    return iface.encodeFunctionData(functionName, params);
}

export default {
    prepareTansfer,
    prepareDeploy,
    prepareCall,
    isHardhatTestAccount,
    isReadOnlyMethod,
    encodeFunctionCall
}
/**
 * API 调用相关函数
 */

import { showToast } from './utils.js';
import { getBatchSize } from './state.js';
import { currentSigner } from './state.js';

/**
 * 获取网络信息
 * @returns {Promise} 包含网络信息的Promise
 */
export async function fetchNetworkInfo() {
  try {
    const response = await fetch('/api/network/info');
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching network info:', error);
    showToast('Error', 'Failed to fetch network information');
    throw error;
  }
}

/**
 * 获取区块列表
 * @param {number} blockNum - 起始区块号
 * @param {number} batchSize - 每批数量
 * @returns {Promise} 包含区块列表的Promise
 */
export async function fetchBlocks(blockNum = null, batchSize = getBatchSize()) {
  try {
    const response = await fetch(`/api/block?blockNum=${blockNum || ''}&batchSize=${batchSize}`);
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching blocks:', error);
    showToast('Error', 'Failed to fetch blocks');
    throw error;
  }
}

/**
 * 获取合约列表
 * @returns {Promise} 包含合约列表的Promise
 */
export async function fetchContracts() {
  try {
    const response = await fetch('/api/contract');
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading contracts:', error);
    showToast('Error', 'Failed to load contracts: ' + error.message);
    throw error;
  }
}

/**
 * 获取合约详情
 * @param {string} contractName - 合约名称
 * @returns {Promise} 包含合约详情的Promise
 */
export async function fetchContractDetails(contractName) {
  try {
    const response = await fetch(`/api/contract/${encodeURIComponent(contractName)}`);
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading contract details:', error);
    showToast('Error', 'Failed to load contract details: ' + error.message);
    throw error;
  }
}

/**
 * 部署合约
 * @param {string} contractName - 合约名称
 * @param {Array} args - 构造函数参数
 * @returns {Promise} 包含部署结果的Promise
 */
export async function deployContract(contractName, args) {
  try {
    // 获取当前选中的signer
    const signer = currentSigner().address;
    console.log("deploy contract with signer:", signer)
    
    const response = await fetch('/api/contract/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractName: contractName,
        args: args,
        signer: signer // 自动附加当前signer
      }),
    });
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error deploying contract:', error);
    showToast('Error', 'Failed to deploy contract: ' + error.message);
    throw error;
  }
}

/**
 * 调用合约函数
 * @param {string} address - 合约地址
 * @param {string} contractName - 合约名称
 * @param {string} functionName - 函数名称
 * @param {Array} args - 函数参数
 * @param {Object} options - 调用选项（如value等）
 * @returns {Promise} 包含调用结果的Promise
 */
export async function callContractFunction(address, contractName, functionName, args, options = {}) {
  try {
    // 获取当前选中的signer
    const signer = currentSigner().address;
    console.log("call contract method with signer:", signer)
    
    const response = await fetch('/api/contract/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractAddress: address,
        contractName: contractName,
        method: functionName,
        args,
        signer: signer, // 自动附加当前signer
        ...options
      }),
    });
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error calling contract function:', error);
    showToast('Error', 'Failed to call contract function: ' + error.message);
    throw error;
  }
}

/**
 * 获取账户列表
 * @returns {Promise} 包含账户列表的Promise
 */
export async function fetchAccounts() {
  try {
    const response = await fetch('/api/account');
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching accounts:', error);
    showToast('Error', 'Failed to fetch accounts');
    throw error;
  }
}

/**
 * 获取指定地址的账户详情
 * @param {string} address - 账户地址
 * @returns {Promise} 包含账户详情的Promise
 */
export async function fetchAccountDetails(address) {
  try {
    const response = await fetch(`/api/account/${encodeURIComponent(address)}`);
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching account details:', error);
    showToast('Error', 'Failed to fetch account details: ' + error.message);
    throw error;
  }
}

/**
 * 获取签名者(signers)列表
 * @returns {Promise} 包含签名者列表的Promise
 */
export async function fetchSigners() {
  try {
    const response = await fetch('/api/signer');
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching signers:', error);
    showToast('Error', 'Failed to fetch signers: ' + error.message);
    throw error;
  }
}

/**
 * 准备合约部署数据（用于钱包交易）
 * @param {string} from - 发送者地址
 * @param {string} contractName - 合约名称
 * @param {string} bytecode - 合约字节码
 * @param {Array} args - 构造函数参数
 * @returns {Promise} 包含准备好的交易数据的Promise
 */
export async function prepareDeploy(from, contractName, bytecode, args, value) {
  try {
    const response = await fetch('/api/prepare-deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        contractName,
        bytecode,
        args,
        value: value
      }),
    });
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error preparing deploy data:', error);
    showToast('Error', 'Failed to prepare deploy data: ' + error.message);
    throw error;
  }
}
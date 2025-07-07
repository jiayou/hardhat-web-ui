const {handleResult} = require('../utils')

/**
 * 获取智能合约列表
 * @param {HardhatRuntimeEnvironment} hre - Hardhat运行时环境
 * @returns {Promise<Array>} 合约名称列表
 */
async function getContractList(hre) {
  try {
    return await hre.artifacts.getAllFullyQualifiedNames();
  } catch (error) {
    console.error('Error fetching contracts:', error);
    throw error;
  }
}

/**
 * 获取智能合约详情
 * @param {HardhatRuntimeEnvironment} hre - Hardhat运行时环境
 * @param {string} contractName - 合约名称
 * @returns {Promise<Object>} 合约 artifact 信息
 */
async function getContractDetails(hre, contractName) {
  try {
    return await hre.artifacts.readArtifact(contractName);
  } catch (error) {
    console.error(`Error fetching contract ${contractName}:`, error);
    throw error;
  }
}

/**
 * 部署合约
 * @param {HardhatRuntimeEnvironment} hre - Hardhat运行时环境
 * @param {string} contractName - 合约名称
 * @param {Array} args - 合约构造函数参数
 * @param {string} signer - 指定调用者地址，默认为空使用默认账户
 * @returns {Promise<Object>} 部署结果
 */
async function deployContract(hre, contractName, args = [], signer = '') {
  try {
    let Contract;
    if (signer && signer.startsWith('0x')) {
      // 如果提供了签名者地址，使用该地址作为签名者
      const signerWallet = await hre.ethers.getSigner(signer);
      Contract = await hre.ethers.getContractFactory(contractName, signerWallet);
    } else {
      // 使用默认签名者
      Contract = await hre.ethers.getContractFactory(contractName);
    }
    
    const contract = await Contract.deploy(...args);
    await contract.waitForDeployment();

    return {
      address: await contract.getAddress(),
      deployTransaction: contract.deploymentTransaction()
    };
  } catch (error) {
    console.error('Error deploying contract:', error);
    throw error;
  }
}

/**
 * 调用合约方法
 * @param {HardhatRuntimeEnvironment} hre - Hardhat运行时环境
 * @param {string} contractName - 合约名称
 * @param {string} contractAddress - 合约地址
 * @param {string} method - 方法名称
 * @param {Array} args - 方法参数
 * @param {string} value - 发送的ETH数量
 * @param {string} signer - 指定调用者地址，默认为空使用默认账户
 * @returns {Promise<Object>} 调用结果
 */
async function callContractMethod(hre, contractName, contractAddress, method, args = [], value = '0', signer = '') {
  try {
    const artifact = await hre.artifacts.readArtifact(contractName);
    
    // 获取合约实例
    let contract;
    if (signer && signer.startsWith('0x')) {
      // 如果提供了签名者地址，使用该地址作为签名者
      const signerWallet = await hre.ethers.getSigner(signer);
      contract = await hre.ethers.getContractAt(artifact.abi, contractAddress, signerWallet);
    } else {
      // 使用默认签名者
      contract = await hre.ethers.getContractAt(artifact.abi, contractAddress);
    }

    let result;
    if (value && value !== '0') {
      result = await contract[method](...args, { value: hre.ethers.parseEther(value) });
    } else {
      result = await contract[method](...args);
    }

    if (result.wait) {
      await result.wait();
      return { success: true, txHash: result.hash, result: 'Transaction successful' };
    } else {
      return { success: true, result: handleResult(result) };
    }
  } catch (error) {
    console.error('Error calling contract method:', error);
    throw error;
  }
}

module.exports = {
  getContractList,
  getContractDetails,
  deployContract,
  callContractMethod
};
/**
 * 账户相关API路由
 */
const express = require('express');
const router = express.Router();
const accountService = require('../services/accountService');


// 获取账户列表
router.get('/', async (req, res) => {
  try {
    const { hre } = req.app.locals;

    // 获取所有可用账户
    const signers = await ethers.getSigners();
    const accounts = await Promise.all(signers.map(signer => signer.getAddress()));
    
    // 获取每个账户的余额
    const accountsWithBalance = await Promise.all(
      accounts.map(async (address) => {
        const balance = await ethers.provider.getBalance(address);
        const code = await ethers.provider.getCode(address);
        
        return {
          address,
          balance: balance.toString(),
          isContract: code !== '0x'
        };
      })
    );

    res.json({ accounts: accountsWithBalance });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// 获取账户详情
router.get('/:address', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const address = req.params.address;
    
    // 获取账户余额
    const balance = await ethers.provider.getBalance(address);
    
    // 检查是否为合约账户
    const code = await ethers.provider.getCode(address);
    const isContract = code !== '0x';
    
    // 获取交易计数
    const transactionCount = await ethers.provider.getTransactionCount(address);
    
    // 构建账户对象
    const accountData = {
      address,
      balance: balance.toString(),
      isContract,
      transactionCount,
      code: isContract ? code : '0x'
    };
    
    // 如果是合约账户，添加合约信息
    if (isContract) {
      accountData.contractInfo = { bytecode: code };
    }
    
    // 获取相关交易
    // 注意：这里是简化实现，实际可能需要从区块链或数据库查询
    const transactions = await accountService.getAccountTransactions(hre.ethers.provider, address);
    
    // 返回符合前端期望的数据结构
    res.json({
      account: accountData,
      transactions
    });
  } catch (error) {
    console.error(`Error fetching account ${req.params.address}:`, error);
    res.status(500).json({ error: `Failed to fetch account ${req.params.address}` });
  }
});

// 辅助函数：获取账户相关交易


module.exports = router;
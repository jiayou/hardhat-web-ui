/**
 * 网络相关API路由
 */
const express = require('express');
const router = express.Router();

// 获取最新区块高度
router.get('/latest-block', async (req, res) => {
  try {
    const { httpProvider } = req.app.locals;
    const height = await httpProvider.getBlockNumber();
    res.json({ height });
  } catch (error) {
    console.error('Error fetching latest block height:', error);
    res.status(500).json({ error: 'Failed to fetch latest block height' });
  }
});

// 获取网络信息
router.get('/info', async (req, res) => {
  try {
    const { hre } = req.app.locals;
    const networkName = hre.network.name;
    const chainId = await ethers.provider.getNetwork().then(net => net.chainId);
    
    res.json({
      network: {
        name: networkName,
        chainId: chainId.toString(),
        provider: hre.network.config.url || 'hardhat'
      }
    });
  } catch (error) {
    console.error('Error fetching network info:', error);
    res.status(500).json({ error: 'Failed to fetch network info' });
  }
});

// 是否是公链（已知ID）
router.get('/is_live', async (req, res) => {
  const liveNetworkIds = [ 1, 11155111 ];
  try {
    const chainId = await ethers.provider.getNetwork().then(net => net.chainId);
    res.json({ is_live: liveNetworkIds.includes(chainId) });
  }
  catch (error) {
    res.json({ is_live: true });
    // 在live网络下功能受限
  } 
})

module.exports = router;
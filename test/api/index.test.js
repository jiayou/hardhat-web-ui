const request = require('supertest');
const express = require('express');
const apiRouter = require('../../src/api/index');
const { ethers } = require('hardhat');

// 模拟ethers模块和hre
jest.mock('hardhat', () => ({
  network: {
    name: 'localhost',
    config: { url: 'http://localhost:8545' }
  },
  ethers: {
    provider: {
      getNetwork: jest.fn().mockResolvedValue({
        chainId: 31337
      })
    }
  }
}));

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('API Routes Integration', () => {
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
  });

  describe('GET /api/network', () => {
    it('should return network information', async () => {
      const response = await request(app).get('/api/network');
      
      expect(response.status).toBe(200);
      expect(response.body.network).toEqual({
        name: 'localhost',
        chainId: '31337',
        provider: 'http://localhost:8545'
      });
    });

    it('should handle errors when fetching network info', async () => {
      ethers.provider.getNetwork.mockRejectedValue(new Error('Failed to get network'));
      
      const response = await request(app).get('/api/network');
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch network info');
    });
  });

  describe('Route Registration', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/nonexistentroute');
      
      expect(response.status).toBe(404);
    });

    it('should register all route modules', async () => {
      // 测试各路由模块是否已注册
      const blockResponse = await request(app).get('/api/block');
      const txResponse = await request(app).get('/api/tx');
      const accountResponse = await request(app).get('/api/account');
      const contractResponse = await request(app).get('/api/contract');
      
      // 即使返回错误也表明路由已注册
      expect(blockResponse.status).not.toBe(404);
      expect(txResponse.status).not.toBe(404);
      expect(accountResponse.status).not.toBe(404);
      expect(contractResponse.status).not.toBe(404);
    });
  });
});
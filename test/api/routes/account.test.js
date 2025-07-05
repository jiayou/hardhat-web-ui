const request = require('supertest');
const express = require('express');
const router = require('../../../src/api/routes/account');
const { ethers } = require('hardhat');

// 模拟ethers模块
jest.mock('hardhat', () => ({
  ethers: {
    getSigners: jest.fn(),
    provider: {
      getBalance: jest.fn(),
      getCode: jest.fn(),
      getTransactionCount: jest.fn(),
      getBlockNumber: jest.fn(),
      getBlock: jest.fn()
    }
  }
}));

const app = express();
app.use(express.json());
app.use(router);

describe('Account API Routes', () => {
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return list of accounts with balances', async () => {
      // 模拟数据
      const mockSigners = [{ getAddress: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef12345678') }];
      ethers.getSigners.mockResolvedValue(mockSigners);
      ethers.provider.getBalance.mockResolvedValue('1000000000000000000');
      ethers.provider.getCode.mockResolvedValue('0x');

      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body.accounts).toBeInstanceOf(Array);
      expect(response.body.accounts[0].address).toBe('0x1234567890abcdef1234567890abcdef12345678');
      expect(response.body.accounts[0].balance).toBe('1000000000000000000');
      expect(response.body.accounts[0].isContract).toBe(false);
    });

    it('should handle errors when fetching accounts', async () => {
      ethers.getSigners.mockRejectedValue(new Error('Failed to get signers'));
      
      const response = await request(app).get('/');
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch accounts');
    });
  });

  describe('GET /:address', () => {
    it('should return account details for a valid address', async () => {
      const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
      ethers.provider.getBalance.mockResolvedValue('1000000000000000000');
      ethers.provider.getCode.mockResolvedValue('0x');
      ethers.provider.getTransactionCount.mockResolvedValue(5);
      ethers.provider.getBlockNumber.mockResolvedValue(100);
      ethers.provider.getBlock.mockResolvedValue({
        transactions: [],
        timestamp: 123456789
      });

      const response = await request(app).get(`/${mockAddress}`);
      
      expect(response.status).toBe(200);
      expect(response.body.account.address).toBe(mockAddress);
      expect(response.body.account.balance).toBe('1000000000000000000');
      expect(response.body.account.isContract).toBe(false);
      expect(response.body.account.transactionCount).toBe(5);
    });

    it('should handle errors when fetching account details', async () => {
      const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
      ethers.provider.getBalance.mockRejectedValue(new Error('Failed to get balance'));
      
      const response = await request(app).get(`/${mockAddress}`);
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe(`Failed to fetch account ${mockAddress}`);
    });
  });
});
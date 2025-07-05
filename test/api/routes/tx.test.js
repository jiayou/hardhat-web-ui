const request = require('supertest');
const express = require('express');
const router = require('../../../src/api/routes/tx');
const { ethers } = require('hardhat');

// 模拟ethers模块
jest.mock('hardhat', () => ({
  ethers: {
    provider: {
      getBlockNumber: jest.fn(),
      getBlock: jest.fn(),
      getTransaction: jest.fn(),
      getTransactionReceipt: jest.fn()
    }
  }
}));

const app = express();
app.use(express.json());
app.use(router);

describe('Transaction API Routes', () => {
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return list of transactions with pagination', async () => {
      // 模拟数据
      ethers.provider.getBlockNumber.mockResolvedValue(100);
      ethers.provider.getBlock.mockImplementation((blockNumber) => {
        return Promise.resolve({
          number: blockNumber,
          timestamp: 123456789 + blockNumber,
          transactions: [{
            hash: `0xtxhash${blockNumber}`,
            blockNumber: blockNumber,
            from: '0xfromaddress',
            to: '0xtoaddress',
            value: BigInt('1000000000000000000')
          }]
        });
      });

      const response = await request(app).get('/?page=1&pageSize=10');
      
      expect(response.status).toBe(200);
      expect(response.body.transactions).toBeInstanceOf(Array);
      expect(response.body.transactions.length).toBe(10);
      expect(response.body.pagination).toEqual({
        page: 1,
        pageSize: 10,
        total: 10
      });
    });

    it('should handle errors when fetching transactions', async () => {
      ethers.provider.getBlockNumber.mockRejectedValue(new Error('Failed to get block number'));
      
      const response = await request(app).get('/');
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch transactions');
    });
  });

  describe('GET /:txHash', () => {
    it('should return transaction details for a valid transaction hash', async () => {
      const mockTxHash = '0xtxhash123';
      const mockTx = {
        hash: mockTxHash,
        from: '0xfromaddress',
        to: '0xtoaddress',
        value: BigInt('1000000000000000000'),
        gasLimit: BigInt(21000),
        gasPrice: BigInt(1000000000)
      };
      const mockReceipt = {
        status: 1,
        gasUsed: BigInt(21000)
      };
      
      ethers.provider.getTransaction.mockResolvedValue(mockTx);
      ethers.provider.getTransactionReceipt.mockResolvedValue(mockReceipt);

      const response = await request(app).get(`/${mockTxHash}`);
      
      expect(response.status).toBe(200);
      expect(response.body.transaction.hash).toBe(mockTxHash);
      expect(response.body.receipt.status).toBe(1);
    });

    it('should return 404 for non-existent transaction', async () => {
      const mockTxHash = '0xnonexistenttxhash';
      ethers.provider.getTransaction.mockResolvedValue(null);
      
      const response = await request(app).get(`/${mockTxHash}`);
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Transaction not found');
    });

    it('should handle errors when fetching transaction details', async () => {
      const mockTxHash = '0xtxhash123';
      ethers.provider.getTransaction.mockRejectedValue(new Error('Failed to get transaction'));
      
      const response = await request(app).get(`/${mockTxHash}`);
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe(`Failed to fetch transaction ${mockTxHash}`);
    });
  });
});
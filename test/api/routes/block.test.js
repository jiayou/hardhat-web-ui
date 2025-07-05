const request = require('supertest');
const express = require('express');
const router = require('../../../src/api/routes/block');
const { ethers } = require('hardhat');

// 模拟ethers模块
jest.mock('hardhat', () => ({
  ethers: {
    provider: {
      getBlockNumber: jest.fn(),
      getBlock: jest.fn()
    }
  }
}));

const app = express();
app.use(express.json());
app.use(router);

describe('Block API Routes', () => {
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return list of blocks with pagination', async () => {
      // 模拟数据
      ethers.provider.getBlockNumber.mockResolvedValue(100);
      ethers.provider.getBlock.mockImplementation((blockNumber) => {
        return Promise.resolve({
          number: blockNumber,
          hash: `0xhash${blockNumber}`,
          timestamp: 123456789 + blockNumber,
          transactions: Array(blockNumber % 5).fill({}),
          gasUsed: BigInt(21000 * blockNumber),
          gasLimit: BigInt(30000000),
          baseFeePerGas: BigInt(1000000000 * blockNumber)
        });
      });

      const response = await request(app).get('/?page=1&pageSize=10');
      
      expect(response.status).toBe(200);
      expect(response.body.blocks).toBeInstanceOf(Array);
      expect(response.body.blocks.length).toBe(10);
      expect(response.body.pagination).toEqual({
        page: 1,
        pageSize: 10,
        total: 101
      });
    });

    it('should handle errors when fetching blocks', async () => {
      ethers.provider.getBlockNumber.mockRejectedValue(new Error('Failed to get block number'));
      
      const response = await request(app).get('/');
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch blocks');
    });
  });

  describe('GET /:blockNumber', () => {
    it('should return block details for a valid block number', async () => {
      const mockBlockNumber = '100';
      ethers.provider.getBlock.mockResolvedValue({
        number: 100,
        hash: '0xblockhash100',
        timestamp: 123456789,
        transactions: [{
          hash: '0xtxhash1',
          from: '0xfromaddress',
          to: '0xtoaddress',
          value: BigInt('1000000000000000000'),
          gasLimit: BigInt(21000),
          gasPrice: BigInt(1000000000),
          input: '0xinputdata',
          nonce: 1,
          transactionIndex: 0
        }],
        gasUsed: BigInt(21000),
        gasLimit: BigInt(30000000),
        baseFeePerGas: BigInt(1000000000),
        difficulty: BigInt(0),
        miner: '0xmineraddress'
      });

      const response = await request(app).get(`/${mockBlockNumber}`);
      
      expect(response.status).toBe(200);
      expect(response.body.block.number).toBe('100');
      expect(response.body.block.hash).toBe('0xblockhash100');
      expect(response.body.block.transactions).toBeInstanceOf(Array);
      expect(response.body.block.transactions[0].hash).toBe('0xtxhash1');
    });

    it('should return 404 for non-existent block', async () => {
      const mockBlockNumber = '9999';
      ethers.provider.getBlock.mockResolvedValue(null);
      
      const response = await request(app).get(`/${mockBlockNumber}`);
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Block not found');
    });

    it('should handle errors when fetching block details', async () => {
      const mockBlockNumber = '100';
      ethers.provider.getBlock.mockRejectedValue(new Error('Failed to get block'));
      
      const response = await request(app).get(`/${mockBlockNumber}`);
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe(`Failed to fetch block ${mockBlockNumber}`);
    });
  });
});
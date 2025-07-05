const request = require('supertest');
const express = require('express');
const router = require('../../../src/api/routes/contract');
const { ethers } = require('hardhat');

// 模拟hardhat和ethers模块
jest.mock('hardhat', () => ({
  artifacts: {
    getAllFullyQualifiedNames: jest.fn(),
    readArtifact: jest.fn()
  },
  ethers: {
    getContractFactory: jest.fn(),
    getContractAt: jest.fn(),
    parseEther: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use(router);

describe('Contract API Routes', () => {
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return list of contracts', async () => {
      // 模拟数据
      const mockContracts = ['Contract1', 'Contract2'];
      ethers.artifacts.getAllFullyQualifiedNames.mockResolvedValue(mockContracts);

      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body.contracts).toEqual(mockContracts);
    });

    it('should handle errors when fetching contracts', async () => {
      ethers.artifacts.getAllFullyQualifiedNames.mockRejectedValue(new Error('Failed to get contracts'));
      
      const response = await request(app).get('/');
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch contracts');
    });
  });

  describe('GET /:contractName', () => {
    it('should return contract details for a valid contract name', async () => {
      const mockContractName = 'Contract1';
      const mockArtifact = {
        abi: [],
        bytecode: '0xbytecode',
        deployedBytecode: '0xdeployedBytecode'
      };
      ethers.artifacts.readArtifact.mockResolvedValue(mockArtifact);

      const response = await request(app).get(`/${mockContractName}`);
      
      expect(response.status).toBe(200);
      expect(response.body.contract).toEqual(mockArtifact);
    });

    it('should handle errors when fetching contract details', async () => {
      const mockContractName = 'NonExistentContract';
      ethers.artifacts.readArtifact.mockRejectedValue(new Error('Contract not found'));
      
      const response = await request(app).get(`/${mockContractName}`);
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe(`Failed to fetch contract ${mockContractName}`);
    });
  });

  describe('POST /deploy', () => {
    it('should deploy a contract successfully', async () => {
      const mockContractName = 'TestContract';
      const mockAddress = '0xdeployedaddress';
      const mockTxHash = '0xdeploystxhash';
      
      const mockContract = {
        deploy: jest.fn().mockResolvedValue({ waitForDeployment: jest.fn().mockResolvedValue(true) }),
        getAddress: jest.fn().mockResolvedValue(mockAddress),
        deploymentTransaction: jest.fn().mockReturnValue({ hash: mockTxHash })
      };
      
      ethers.getContractFactory.mockResolvedValue(mockContract);

      const response = await request(app)
        .post('/deploy')
        .send({ contractName: mockContractName, args: [] });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.address).toBe(mockAddress);
      expect(response.body.deployTransaction.hash).toBe(mockTxHash);
    });

    it('should return 400 when contract name is missing', async () => {
      const response = await request(app)
        .post('/deploy')
        .send({ args: [] });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Contract name is required');
    });
  });

  describe('POST /call', () => {
    it('should call a contract method successfully', async () => {
      const mockContractName = 'TestContract';
      const mockAddress = '0xcontractaddress';
      const mockMethod = 'getValue';
      const mockResult = '100';
      
      const mockContract = {
        [mockMethod]: jest.fn().mockResolvedValue(mockResult)
      };
      
      ethers.artifacts.readArtifact.mockResolvedValue({ abi: [] });
      ethers.getContractAt.mockResolvedValue(mockContract);

      const response = await request(app)
        .post('/call')
        .send({
          contractName: mockContractName,
          contractAddress: mockAddress,
          method: mockMethod,
          args: []
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result).toBe(mockResult);
    });

    it('should handle errors when calling contract method', async () => {
      const mockContractName = 'TestContract';
      const mockAddress = '0xcontractaddress';
      const mockMethod = 'invalidMethod';
      
      ethers.artifacts.readArtifact.mockResolvedValue({ abi: [] });
      ethers.getContractAt.mockResolvedValue({
        [mockMethod]: jest.fn().mockRejectedValue(new Error('Method not found'))
      });

      const response = await request(app)
        .post('/call')
        .send({
          contractName: mockContractName,
          contractAddress: mockAddress,
          method: mockMethod,
          args: []
        });
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to call contract method');
    });
  });
});
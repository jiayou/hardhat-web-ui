/**
 * 合约视图
 */

import { showToast, shortenAddress } from '../utils.js';
import { renderContractInfo, adjustTextareaHeights, initContractInfoView } from './contract_info.js';
import { renderDeployForm, handleDeployContract, initContractDeployView } from './contract_deploy.js';
import { loadContractInstance, initContractCallView, getContractInstances } from './contract_call.js';
import { renderContractSource, initContractSourceView } from './contract_source.js';

// 当前选中的合约
let currentContract = null;


/**
 * 获取合约列表
 * @returns {Promise} 包含合约列表的Promise
 */
async function fetchContracts() {
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
async function fetchContractDetails(contractName) {
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
 * 渲染合约视图
 * @returns {string} HTML内容
 */
const ContractView = async () => {
  try {
    const data = await fetchContracts();
    
    return `
      <div class="row mt-4">
        <div class="col-md-3 sidebar">
          <div class="card mb-4">
            <div class="card-header bg-light">
              <h5 class="mb-0">可用合约</h5>
            </div>
            <ul class="list-group list-group-flush contract-list" id="contractList">
              ${data.contracts && data.contracts.length > 0 ?
                data.contracts.map(contract => `
                  <li class="list-group-item" data-contract="${contract}">${contract}</li>
                `).join('') :
                '<li class="list-group-item text-center">无可用合约</li>'}
            </ul>
          </div>
        </div>
        
        <div class="col-md-9">
          <div id="noContractSelected" class="text-center p-5">
            <h4 class="text-secondary">请从左侧选择一个合约</h4>
            <p class="text-muted">点击合约名称查看详情</p>
          </div>
          
          <div id="contractInfo" style="display: none;">
            <h3 id="contractTitle" class="mb-4">Contract Name</h3>
            
            <ul class="nav nav-tabs" id="contractTabs" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active" id="details-tab" data-bs-toggle="tab" data-bs-target="#details" type="button" role="tab">详情</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="deploy-tab" data-bs-toggle="tab" data-bs-target="#deploy" type="button" role="tab">部署</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="interact-tab" data-bs-toggle="tab" data-bs-target="#interact" type="button" role="tab">交互</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="source-tab" data-bs-toggle="tab" data-bs-target="#source" type="button" role="tab">源代码</button>
              </li>
            </ul>
            
            <div class="tab-content p-3 border border-top-0 rounded-bottom mb-4">
              <!-- 详情标签页 -->
              <div class="tab-pane fade show active" id="details" role="tabpanel">
                <div class="row">
                  <div class="col-md-6">
                    <h5>合约信息</h5>
                    <table class="table">
                      <tbody id="contractDetails-info"></tbody>
                    </table>
                    
                    <h5 class="mt-4">合约字节码</h5>
                    <div class="bytecode-container">
                      <textarea id="contractBytecode" class="form-control" readonly style="font-family: monospace; font-size: 0.85rem; height: 150px;"></textarea>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <h5>ABI</h5>
                    <div class="abi-container">
                      <textarea id="contractAbi" class="form-control" readonly style="font-family: monospace; font-size: 0.85rem; height: 150px;"></textarea>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 部署标签页 -->
              <div class="tab-pane fade" id="deploy" role="tabpanel">
                <h5>部署合约</h5>
                <div id="constructorParams" class="my-4"></div>
                <button id="deployBtn" class="btn btn-primary">部署合约</button>
                <div id="deployResult" class="mt-4"></div>
              </div>
              
              <!-- 交互标签页 -->
              <div class="tab-pane fade" id="interact" role="tabpanel">
                <div class="mb-4">
                  <h5>合约实例</h5>
                  <div class="input-group mb-3">
                    <input type="text" class="form-control" placeholder="合约地址" id="contractAddress">
                    <button class="btn btn-outline-secondary" type="button" id="loadContractBtn">加载合约</button>
                  </div>
                </div>
                
                <div class="row">
                  <div class="col-md-6">
                    <h5>读取函数</h5>
                    <div id="readFunctions">
                      <p class="text-center text-muted">请先加载合约</p>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <h5>写入函数</h5>
                    <div id="writeFunctions">
                      <p class="text-center text-muted">请先加载合约</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 源代码标签页 -->
              <div class="tab-pane fade" id="source" role="tabpanel">
                <h5>源代码</h5>
                <pre><code id="contractSource" class="language-solidity"></code></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering contract view:', error);
    showToast('Error', 'Failed to load contracts');
    return `<div class="alert alert-danger m-5">Failed to load contracts: ${error.message}</div>`;
  }
};

/**
 * 加载合约详情
 * @param {string} contractName - 合约名称
 */
async function loadContractDetails(contractName) {
  try {
    // 更新UI状态
    document.querySelectorAll('.contract-list .list-group-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.contract === contractName) {
        item.classList.add('active');
      }
    });

    document.getElementById('contractTitle').textContent = contractName;
    document.getElementById('noContractSelected').style.display = 'none';
    document.getElementById('contractInfo').style.display = 'block';

    // 获取合约详情
    const data = await fetchContractDetails(contractName);

    if (data.contract) {
      currentContract = data.contract;

      // 渲染各个模块
      renderContractInfo(currentContract, contractName);
      renderDeployForm(currentContract);
      renderContractSource(currentContract);

      // 清空交互区域
      document.getElementById('contractAddress').value = '';
      document.getElementById('readFunctions').innerHTML = '<p class="text-center text-muted">请先加载合约</p>';
      document.getElementById('writeFunctions').innerHTML = '<p class="text-center text-muted">请先加载合约</p>';
    }
  } catch (error) {
    console.error('Error loading contract details:', error);
    showToast('Error', 'Failed to load contract details: ' + error.message);
  }
}

/**
 * 部署成功后的回调
 * @param {string} address - 部署的合约地址
 */
function onDeploySuccess(address) {
  // 自动填充合约地址到交互标签页
  document.getElementById('contractAddress').value = address;

  // 切换到交互标签页
  const interactTab = document.getElementById('interact-tab');
  bootstrap.Tab.getOrCreateInstance(interactTab).show();

  // 加载合约实例
  loadContractInstance(address, currentContract);
}

/**
 * 合约视图初始化函数
 */
ContractView.init = () => {
  // 绑定合约列表点击事件
  document.querySelectorAll('.contract-list .list-group-item').forEach(item => {
    item.addEventListener('click', () => loadContractDetails(item.dataset.contract));
  });

  // 初始化各个模块
  initContractInfoView();
  initContractDeployView(() => handleDeployContract(currentContract, onDeploySuccess));
  initContractCallView(currentContract);
  initContractSourceView();
};

// 导出默认视图函数
export default ContractView;
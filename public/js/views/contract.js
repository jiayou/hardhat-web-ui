/**
 * 合约视图
 */

import { showToast } from '../utils.js';
import { renderContractInfo, initContractInfoView, updateContractInfoContent } from './contract_info.js';
import { renderDeployForm, initContractDeployView, renderContractDeploy } from './contract_deploy.js';
import { loadContractInstance, initContractCallView, renderContractCall } from './contract_call.js';
import { renderContractSource, initContractSourceView } from './contract_source.js';

// 定义tab映射关系
const TAB_MAP = {
  'details': 'contract_info',
  'deploy': 'contract_deploy',
  'interact': 'contract_call',
  'source': 'contract_source'
};

// URL参数映射到tab
const URL_TO_TAB = {
  'contract_info': 'details-tab',
  'contract_deploy': 'deploy-tab',
  'contract_call': 'interact-tab',
  'contract_source': 'source-tab'
};

// 当前选中的合约
let currentContract = null;

/**
 * 获取当前选中的合约
 * @returns {Object|null} 当前合约对象或null
 */
export function getCurrentContract() {
  return currentContract;
}


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
 * 更新URL参数
 * @param {string} contractName - 合约名称
 * @param {string} tab - 选中的标签页
 */
function updateUrlParams(contractName, tab) {
  const url = new URL(window.location);
  const currentParams = url.searchParams;

  // 如果有合约名称参数，则更新或保留现有的
  if (contractName) {
    currentParams.set('name', contractName);
  } else if (!currentParams.has('name')) {
    // 只有当没有提供新的contractName且URL中也没有时才删除
    currentParams.delete('name');
  }

  // 更新标签页参数，如果有新的tab则更新，否则保留现有的
  if (tab) {
    const tabValue = TAB_MAP[tab.replace('-tab', '')];
    if (tabValue) {
      currentParams.set('tab', tabValue);
      
      // 处理address参数 - 只在交互标签页保留
      if (tabValue === 'contract_call') { // interact标签页
        // 保留address参数（如果存在）
      } else {
        // 在其他标签页移除address参数
        currentParams.delete('address');
      }
    }
  } else if (!currentParams.has('tab')) {
    // 只有当没有提供新的tab且URL中也没有时才删除
    currentParams.delete('tab');
  }

  // 更新浏览器历史记录，不刷新页面
  window.history.pushState({}, '', url);
}

/**
 * 从URL参数中获取合约名称和标签页
 * @returns {Object} 包含合约名称和标签页的对象
 */
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    contractName: params.get('name'),
    tab: params.get('tab')
  };
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
                ${renderContractInfo()}
              </div>
              
              <!-- 部署标签页 -->
              <div class="tab-pane fade" id="deploy" role="tabpanel">
                ${renderContractDeploy()}
              </div>
              
              <!-- 交互标签页 -->
              <div class="tab-pane fade" id="interact" role="tabpanel">
                ${renderContractCall()}
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
 * @param {string} tabToShow - 要显示的标签页 ID
 */
async function loadContractDetails(contractName, tabToShow) {
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

      // 渲染源代码模块并更新合约信息内容
      renderContractSource(currentContract);

      // 更新合约信息和部署表单的内容
      updateContractInfoContent(currentContract, contractName);
      renderDeployForm(currentContract);

      // 清空交互区域
      document.getElementById('contractAddress').value = '';
      document.getElementById('readFunctions').innerHTML = '<p class="text-center text-muted">请先加载合约</p>';
      document.getElementById('writeFunctions').innerHTML = '<p class="text-center text-muted">请先加载合约</p>';

      // 更新URL参数（不包含标签页，因为标签页可能在后续单独设置）
      updateUrlParams(contractName, null);

      // 如果指定了标签页，则切换到对应标签
      if (tabToShow && document.getElementById(tabToShow)) {
        const tab = document.getElementById(tabToShow);
        bootstrap.Tab.getOrCreateInstance(tab).show();
      }
      
      return Promise.resolve(data.contract); // 返回已解析的Promise
    }
    return Promise.resolve(null); // 如果没有合约数据，返回null
  } catch (error) {
    console.error('Error loading contract details:', error);
    showToast('Error', 'Failed to load contract details: ' + error.message);
    return Promise.reject(error); // 返回拒绝的Promise
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

  // 更新URL参数
  if (currentContract) {
    updateUrlParams(currentContract.name, 'interact-tab');
  }

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

  // 绑定标签页切换事件
  document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tabEl => {
    tabEl.addEventListener('shown.bs.tab', event => {
      // 获取当前活动的标签页ID
      const activeTabId = event.target.id;
      // 更新URL参数
      if (currentContract) {
        updateUrlParams(currentContract.name, activeTabId);
      }
    });
  });

  // 初始化各个模块
  initContractInfoView();
  initContractDeployView(onDeploySuccess);
  initContractSourceView();

  // 从URL参数加载初始状态
  const { contractName, tab } = getUrlParams();
  if (contractName) {
    // 如果URL中有合约名称，则加载该合约
    const tabElement = tab ? URL_TO_TAB[tab] : null;
    loadContractDetails(contractName, tabElement).then(() => {
      // 在合约加载完成后初始化交互视图
      initContractCallView(currentContract);
    });
  } else {
    // 如果没有指定合约，也初始化交互视图，但传入null
    initContractCallView(null);
  }
};

// 导出默认视图函数
export default ContractView;
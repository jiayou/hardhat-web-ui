/**
 * 主应用入口文件
 */

import { fetchNetworkInfo, fetchSigners } from './api.js';
import { showToast, shortenAddress } from './utils.js';
import { initSettingsUI } from './state.js';
import { currentSigner, cachedSigners } from './state.js';
// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
  console.time('DOMContentLoaded初始化耗时');
  
  // 初始化全局设置
  console.time('initSettingsUI耗时');
  initSettingsUI();
  console.timeEnd('initSettingsUI耗时');
  
  // 初始化Socket.io连接
  console.time('初始化Socket.io连接耗时');
  const socket = io();
  console.timeEnd('初始化Socket.io连接耗时');
  
  // 初始化网络信息
  console.time('initNetworkInfo耗时');
  initNetworkInfo();
  console.timeEnd('initNetworkInfo耗时');
  
  // 加载签名者列表
  loadSigners();
  
  // 处理实时网络事件
  socket.on('newBlock', (blockData) => {
    console.time('处理newBlock事件耗时');
    showToast('New Block', `Block #${blockData.number} has been mined`);
    updateNetworkInfo();
    console.timeEnd('处理newBlock事件耗时');
  });
  
  socket.on('newTransaction', (txData) => {
    console.time('处理newTransaction事件耗时');
    showToast('New Transaction', `Transaction ${txData.hash.slice(0, 10)}... has been submitted`);
    console.timeEnd('处理newTransaction事件耗时');
  });
  
  console.timeEnd('DOMContentLoaded初始化耗时');
  
  // 使用setTimeout延迟绑定事件
  setTimeout(() => {
    // 绑定Signer选择器事件
    document.getElementById('signerSelect').addEventListener('change', function() {
      currentSigner(this.value);
    });
    
    // 绑定新增按钮事件
    document.getElementById('addSigner').addEventListener('click', function() {
      addNewSigner();
    });
  }, 0);
});
/**
 * 初始化网络信息
 */
async function initNetworkInfo() {
  try {
    const data = await fetchNetworkInfo();
    if (data && data.network) {
      document.getElementById('networkName').textContent = data.network.name || 'Unknown';
      document.getElementById('chainId').textContent = data.network.chainId || '-';
    }
  } catch (error) {
    console.error('Error fetching network info:', error);
  }
}

/**
 * 更新网络信息
 */
async function updateNetworkInfo() {
  try {
    const data = await fetchNetworkInfo();
    if (data && data.network) {
      document.getElementById('networkName').textContent = data.network.name || 'Unknown';
      document.getElementById('chainId').textContent = data.network.chainId || '-';
    }
  } catch (error) {
    console.error('Error updating network info:', error);
  }
}

/**
 * 加载签名者列表
 */
async function loadSigners() {
  try {
    // 获取当前选中的signer
    const selectedSigner = currentSigner();
    
    // 如果有缓存先用缓存填充
    if (cachedSigners().length > 0) {
      renderSignerOptions(document.getElementById('signerSelect'), cachedSigners(), selectedSigner);
    }
    
    // 获取最新的signers数据
    const signers = await fetchSigners();
    
    // 更新缓存
    cachedSigners(signers);
    
    // 如果没有选中的签名者且签名者列表不为空，选择第一个
    if (signers.length > 0 && !currentSigner()) {
      currentSigner(signers[0]);
    }
    
    // 渲染签名者选项
    renderSignerOptions(document.getElementById('signerSelect'), signers, currentSigner());
  } catch (error) {
    console.error('Error loading signers:', error);
  }
}

/**
 * 添加新的Signer地址
 */
function addNewSigner() {
  // 创建一个模态对话框
  const modalHtml = `
    <div class="modal fade" id="addSignerModal" tabindex="-1" aria-labelledby="addSignerModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="addSignerModalLabel">新增Signer地址</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="newSignerAddress" class="form-label">Signer地址</label>
              <input type="text" class="form-control" id="newSignerAddress" placeholder="输入以0x开头的地址...">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-primary" id="confirmAddSigner">确认</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // 添加模态框到DOM
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);

  // 初始化模态框
  const modal = new bootstrap.Modal(document.getElementById('addSignerModal'));
  modal.show();

  // 绑定确认按钮事件
  document.getElementById('confirmAddSigner').addEventListener('click', function() {
    const newAddress = document.getElementById('newSignerAddress').value.trim();

    // 验证地址格式
    if (!newAddress || !newAddress.startsWith('0x')) {
      showToast('错误', '请输入有效的以0x开头的地址', 'danger');
      return;
    }

    // 获取当前signers列表
    const currentSigners = cachedSigners();

    // 检查地址是否已存在
    if (currentSigners.includes(newAddress)) {
      showToast('警告', '该地址已在列表中', 'warning');
      modal.hide();
      document.body.removeChild(modalContainer);
      return;
    }

    // 将新地址添加到列表开头
    currentSigners.unshift(newAddress);

    // 更新缓存
    cachedSigners(currentSigners);

    // 设置为当前选中的signer
    currentSigner(newAddress);

    // 重新渲染下拉列表
    renderSignerOptions(document.getElementById('signerSelect'), currentSigners, newAddress);

    // 关闭模态框
    modal.hide();
    document.body.removeChild(modalContainer);

    showToast('成功', '新Signer地址已添加', 'success');
  });

  // 模态框关闭时移除DOM元素
  document.getElementById('addSignerModal').addEventListener('hidden.bs.modal', function() {
    if (modalContainer && modalContainer.parentNode) {
      document.body.removeChild(modalContainer);
    }
  });
}

/**
 * 渲染签名者选项到下拉菜单
 */
function renderSignerOptions(selectElement, signers, selectedSigner) {
  const signerSelect = selectElement || document.getElementById('signerSelect');
  signerSelect.innerHTML = '';
  
  // 添加默认选项
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Select a signer --';
  defaultOption.disabled = true;
  defaultOption.selected = !selectedSigner;
  signerSelect.appendChild(defaultOption);
  
  signers.forEach(signer => {
    const option = document.createElement('option');
    const signerAddress = typeof signer === 'string' ? signer : signer.address;
    option.value = signerAddress;
    option.textContent = typeof signer === 'string' ? shortenAddress(signerAddress) : (signer.name || signerAddress.slice(0, 10) + '...');
    
    if (selectedSigner && signerAddress === (typeof selectedSigner === 'string' ? selectedSigner : selectedSigner.address)) {
      option.selected = true;
    }
    
    signerSelect.appendChild(option);
  });
}
/**
 * 主应用入口文件
 */

import { fetchNetworkInfo, fetchSigners } from './api.js';
import { showToast, shortenAddress, longerAddress } from './utils.js';
import { 
  initSettingsUI, 
  currentSigner, 
  addWalletAccount, 
  removeWalletAccount, 
  getWalletAccounts, 
  getSignerType
} from './state.js';
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
  
  // 显示签名者信息
  displayCurrentSigner();  

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
  
  // 绑定切换Signer按钮事件
  document.getElementById('switchSigner').addEventListener('click', function() {
    openSignerDialog();
  });
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
 * 更新当前Signer显示
 */
function displayCurrentSigner() {
  const selectedSigner = currentSigner();
  const signerType = getSignerType ? getSignerType() : 'hardhat';
  const signerDisplay = document.getElementById('currentSignerAddress');
  
  if (selectedSigner) {
    signerDisplay.textContent = shortenAddress(selectedSigner);
    signerDisplay.title = selectedSigner;
    
    // 根据类型设置不同样式
    if (signerType === 'hardhat') {
      signerDisplay.classList.add('bg-light', 'text-dark');
      signerDisplay.classList.remove('bg-info', 'text-white');
    } else {
      signerDisplay.classList.add('bg-info', 'text-white');
      signerDisplay.classList.remove('bg-light', 'text-dark');
    }
  } else {
    signerDisplay.textContent = '请选择Signer';
    signerDisplay.title = '';
  }
}

/**
 * 打开Signer选择对话框
 */
function openSignerDialog() {
  // 创建一个模态对话框
  const modalHtml = `
    <div class="modal fade" id="signerDialog" tabindex="-1" aria-labelledby="signerDialogLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="signerDialogLabel">选择Signer</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <div class="form-check">
                <input class="form-check-input" type="radio" name="signerType" id="hardhatSigner" value="hardhat" checked>
                <label class="form-check-label" for="hardhatSigner">
                  Hardhat测试账户
                </label>
              </div>
              <div class="mt-2 mb-3" id="hardhatSignerList">
                <select class="form-select" id="hardhatSelect">
                  <!-- Hardhat账户将在这里动态填充 -->
                </select>
              </div>
              
              <div class="form-check">
                <input class="form-check-input" type="radio" name="signerType" id="walletSigner" value="wallet">
                <label class="form-check-label" for="walletSigner">
                  钱包账户
                </label>
              </div>
              <div class="mt-2 mb-3" id="walletSignerList" style="display:none;">
                <div class="d-flex justify-content-between mb-2">
                  <h6>已保存的钱包地址</h6>
                  <button type="button" class="btn btn-sm btn-primary" id="addWalletBtn">添加钱包地址</button>
                </div>
                <div class="list-group" id="walletList">
                  <!-- 钱包账户将在这里动态填充 -->
                </div>
              </div>
              
              <div id="addWalletForm" style="display:none;" class="mt-3 p-3 border rounded">
                <div class="mb-3">
                  <label for="newWalletAddress" class="form-label">钱包地址</label>
                  <input type="text" class="form-control" id="newWalletAddress" placeholder="输入以0x开头的地址...">
                </div>
                <div class="d-flex justify-content-end">
                  <button type="button" class="btn btn-secondary me-2" id="cancelAddWallet">取消</button>
                  <button type="button" class="btn btn-success" id="confirmAddWallet">添加</button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-primary" id="confirmSigner">确认</button>
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
  const modal = new bootstrap.Modal(document.getElementById('signerDialog'));
  modal.show();
  
  // 获取当前选中的signer和类型
  const selectedSigner = currentSigner();
  const currentType = getSignerType ? getSignerType() : 'hardhat';
  
  // 设置初始选中的类型
  document.getElementById(currentType === 'hardhat' ? 'hardhatSigner' : 'walletSigner').checked = true;
  if (currentType === 'wallet') {
    document.getElementById('hardhatSignerList').style.display = 'none';
    document.getElementById('walletSignerList').style.display = 'block';
  }
  
  // 获取并填充Hardhat测试账户
  const hardhatSelect = document.getElementById('hardhatSelect');
  hardhatSelect.innerHTML = ''; // 清空现有选项

  fetchSigners().then(signers => {
    const selectElement = hardhatSelect;
    selectElement.innerHTML = ''; // 清空现有的选项

    if (signers && signers.length > 0) {
      signers.forEach(signer => {
        const option = document.createElement('option');
        const address = typeof signer === 'string' ? signer : signer.address;
        option.value = address;
        option.textContent = typeof signer === 'string' ? longerAddress(signer) : 
                            (signer.name ? `${signer.name} (${longerAddress(address)})` : longerAddress(address));
        
        if (selectedSigner === address && currentType === 'hardhat') {
          option.selected = true;
        }
        selectElement.appendChild(option);
      });
    } else {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = '没有可用的Hardhat账户';
      option.disabled = true;
      selectElement.appendChild(option);
    }
  })
  .catch(error => {
    showToast('获取Hardhat账户失败', error)
  });
  
  // 获取并填充钱包账户
  const walletList = document.getElementById('walletList');
  walletList.innerHTML = ''; // 清空现有内容
  
  const walletAccounts = getWalletAccounts ? getWalletAccounts() : [];
  if (walletAccounts && walletAccounts.length > 0) {
    walletAccounts.forEach(address => {
      const item = document.createElement('div');
      item.className = 'list-group-item d-flex justify-content-between align-items-center';
      if (selectedSigner === address && currentType === 'wallet') {
        item.classList.add('active');
      }
      item.dataset.address = address;
      
      const addressSpan = document.createElement('span');
      addressSpan.textContent = shortenAddress(address);
      addressSpan.title = address;
      item.appendChild(addressSpan);
      
      // 创建按钮组
      const btnGroup = document.createElement('div');
      
      // 创建选择按钮
      const selectBtn = document.createElement('button');
      selectBtn.className = 'btn btn-sm btn-outline-primary me-2';
      selectBtn.innerHTML = '<i class="bi bi-check"></i>';
      selectBtn.title = '选择此账户';
      selectBtn.onclick = function() {
        // 清除其他选中状态
        document.querySelectorAll('#walletList .list-group-item').forEach(el => {
          el.classList.remove('active');
        });
        // 设置当前选中
        item.classList.add('active');
      };
      btnGroup.appendChild(selectBtn);
      
      // 创建删除按钮
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm btn-outline-danger';
      deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
      deleteBtn.title = '删除此账户';
      deleteBtn.onclick = function() {
        if (confirm('确定要删除此钱包地址吗？')) {
          // 从列表和存储中删除
          if (removeWalletAccount) {
            removeWalletAccount(address);
          }
          item.remove();
          
          // 如果列表为空，显示提示信息
          if (walletList.children.length === 0) {
            const emptyItem = document.createElement('div');
            emptyItem.className = 'list-group-item text-center text-muted';
            emptyItem.textContent = '没有保存的钱包账户';
            walletList.appendChild(emptyItem);
          }
        }
      };
      btnGroup.appendChild(deleteBtn);
      
      item.appendChild(btnGroup);
      
      // 点击整个item也可以选择
      item.addEventListener('click', function(e) {
        if (e.target === item || e.target === addressSpan) {
          // 清除其他选中状态
          document.querySelectorAll('#walletList .list-group-item').forEach(el => {
            el.classList.remove('active');
          });
          // 设置当前选中
          item.classList.add('active');
        }
      });
      
      walletList.appendChild(item);
    });
  } else {
    const emptyItem = document.createElement('div');
    emptyItem.className = 'list-group-item text-center text-muted';
    emptyItem.textContent = '没有保存的钱包账户';
    walletList.appendChild(emptyItem);
  }
  
  // 切换Signer类型
  document.getElementById('hardhatSigner').addEventListener('change', function() {
    if (this.checked) {
      document.getElementById('hardhatSignerList').style.display = 'block';
      document.getElementById('walletSignerList').style.display = 'none';
      document.getElementById('addWalletForm').style.display = 'none';
    }
  });
  
  document.getElementById('walletSigner').addEventListener('change', function() {
    if (this.checked) {
      document.getElementById('hardhatSignerList').style.display = 'none';
      document.getElementById('walletSignerList').style.display = 'block';
    }
  });
  
  // 添加钱包地址按钮事件
  document.getElementById('addWalletBtn').addEventListener('click', function() {
    document.getElementById('addWalletForm').style.display = 'block';
  });
  
  document.getElementById('cancelAddWallet').addEventListener('click', function() {
    document.getElementById('addWalletForm').style.display = 'none';
  });
  
  document.getElementById('confirmAddWallet').addEventListener('click', function() {
    const newAddress = document.getElementById('newWalletAddress').value.trim();
    
    // 验证地址格式
    if (!newAddress || !newAddress.startsWith('0x')) {
      showToast('错误', '请输入有效的以0x开头的地址', 'danger');
      return;
    }
    
    // 检查地址是否已存在
    const existingWallets = getWalletAccounts ? getWalletAccounts() : [];
    if (existingWallets.includes(newAddress)) {
      showToast('警告', '该地址已在列表中', 'warning');
      return;
    }
    
    // 添加到存储
    if (addWalletAccount) {
      addWalletAccount(newAddress);
    }
    
    // 刷新列表
    // 移除空提示
    if (walletList.querySelector('.text-muted')) {
      walletList.innerHTML = '';
    }
    
    // 添加新项目
    const item = document.createElement('div');
    item.className = 'list-group-item d-flex justify-content-between align-items-center active';
    item.dataset.address = newAddress;
    
    const addressSpan = document.createElement('span');
    addressSpan.textContent = shortenAddress(newAddress);
    addressSpan.title = newAddress;
    item.appendChild(addressSpan);
    
    // 创建按钮组
    const btnGroup = document.createElement('div');
    
    // 创建选择按钮
    const selectBtn = document.createElement('button');
    selectBtn.className = 'btn btn-sm btn-outline-primary me-2';
    selectBtn.innerHTML = '<i class="bi bi-check"></i>';
    selectBtn.title = '选择此账户';
    selectBtn.onclick = function() {
      // 清除其他选中状态
      document.querySelectorAll('#walletList .list-group-item').forEach(el => {
        el.classList.remove('active');
      });
      // 设置当前选中
      item.classList.add('active');
    };
    btnGroup.appendChild(selectBtn);
    
    // 创建删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-outline-danger';
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.title = '删除此账户';
    deleteBtn.onclick = function() {
      if (confirm('确定要删除此钱包地址吗？')) {
        // 从列表和存储中删除
        if (removeWalletAccount) {
          removeWalletAccount(newAddress);
        }
        item.remove();
        
        // 如果列表为空，显示提示信息
        if (walletList.children.length === 0) {
          const emptyItem = document.createElement('div');
          emptyItem.className = 'list-group-item text-center text-muted';
          emptyItem.textContent = '没有保存的钱包账户';
          walletList.appendChild(emptyItem);
        }
      }
    };
    btnGroup.appendChild(deleteBtn);
    
    item.appendChild(btnGroup);
    
    // 清除其他选中状态
    document.querySelectorAll('#walletList .list-group-item').forEach(el => {
      el.classList.remove('active');
    });
    
    walletList.appendChild(item);
    
    // 隐藏表单
    document.getElementById('addWalletForm').style.display = 'none';
    document.getElementById('newWalletAddress').value = '';
    
    showToast('成功', '钱包地址已添加', 'success');
  });
  
  // 确认按钮事件
  document.getElementById('confirmSigner').addEventListener('click', function() {
    let selectedAddress = null;
    let selectedType = null;
    
    // 获取选中的类型
    if (document.getElementById('hardhatSigner').checked) {
      selectedType = 'hardhat';
      const select = document.getElementById('hardhatSelect');
      selectedAddress = select.options[select.selectedIndex].value;
    } else {
      selectedType = 'wallet';
      const activeItem = document.querySelector('#walletList .list-group-item.active');
      if (activeItem) {
        selectedAddress = activeItem.dataset.address;
      }
    }
    
    // 如果选择了地址，更新当前signer
    if (selectedAddress) {
      currentSigner(selectedAddress, selectedType);
      displayCurrentSigner();
      modal.hide();
      showToast('成功', 'Signer已更新', 'success');
    } else {
      showToast('错误', '请选择一个Signer地址', 'danger');
    }
  });
  
  // 模态框关闭时移除DOM元素
  document.getElementById('signerDialog').addEventListener('hidden.bs.modal', function() {
    if (modalContainer && modalContainer.parentNode) {
      document.body.removeChild(modalContainer);
    }
  });
}

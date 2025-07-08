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
  getWalletAccounts
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
  const signerAddress = selectedSigner ? selectedSigner.address : null;
  const signerType = selectedSigner ? selectedSigner.type : 'hardhat';
  const signerDisplay = document.getElementById('currentSignerAddress');
  
  if (signerAddress) {
    signerDisplay.textContent = shortenAddress(signerAddress);
    signerDisplay.title = signerAddress;
    
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
                </div>
                <div id="walletSignerRadioGroup" class="mb-3">
                  <!-- 钱包账户单选按钮将在这里动态填充 -->
                </div>
                
                <div class="mt-3 p-3 border rounded">
                  <div class="mb-3">
                    <label for="newWalletAddress" class="form-label">添加新钱包地址</label>
                    <input type="text" class="form-control" id="newWalletAddress" placeholder="输入以0x开头的地址...">
                  </div>
                  <div class="d-flex justify-content-end">
                    <button type="button" class="btn btn-success" id="confirmAddWallet">添加</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer d-flex justify-content-between">
            <div id="currentSelectedAddress" class="text-muted"></div>
            <div>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
              <button type="button" class="btn btn-primary" id="confirmSigner">确认</button>
            </div>
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
  const signerAddress = selectedSigner ? selectedSigner.address : null;
  const currentType = selectedSigner ? selectedSigner.type : 'hardhat';
  
  // 设置初始选中的类型
  document.getElementById(currentType === 'hardhat' ? 'hardhatSigner' : 'walletSigner').checked = true;
  if (currentType === 'hardhat') {
    document.getElementById('walletSignerList').style.display = 'none';
  } else {
    document.getElementById('hardhatSignerList').style.display = 'none';
    document.getElementById('walletSignerList').style.display = 'block';
  }
  
  // 初始化当前选择的显示
  const currentSelectedAddressDiv = document.getElementById('currentSelectedAddress');
  if (signerAddress) {
    currentSelectedAddressDiv.textContent = `当前选择: ${signerAddress}`;
  } else {
    currentSelectedAddressDiv.textContent = '请选择一个地址';
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
        
        if (signerAddress === address && currentType === 'hardhat') {
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
  const walletRadioGroup = document.getElementById('walletSignerRadioGroup');
  walletRadioGroup.innerHTML = ''; // 清空现有内容
  
  const walletAccounts = getWalletAccounts ? getWalletAccounts() : [];
  if (walletAccounts && walletAccounts.length > 0) {
    walletAccounts.forEach((address, index) => {
      const radioDiv = document.createElement('div');
      radioDiv.className = 'form-check d-flex justify-content-between align-items-center mb-2';
      
      // 创建radio按钮
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.className = 'form-check-input';
      radio.name = 'walletAddress';
      radio.id = `wallet-${index}`;
      radio.value = address;
      radio.checked = signerAddress === address && currentType === 'wallet';
      
      // 创建label
      const label = document.createElement('label');
      label.className = 'form-check-label me-auto';
      label.htmlFor = `wallet-${index}`;
      label.textContent = address;
      
      // 创建删除按钮
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm btn-outline-danger ms-2';
      deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
      deleteBtn.title = '删除此账户';
      deleteBtn.onclick = function(e) {
        e.preventDefault(); // 防止触发radio选择
        if (confirm('确定要删除此钱包地址吗？')) {
          // 从列表和存储中删除
          if (removeWalletAccount) {
            removeWalletAccount(address);
          }
          radioDiv.remove();
          
          // 如果列表为空，显示提示信息
          if (walletRadioGroup.children.length === 0) {
            const emptyItem = document.createElement('div');
            emptyItem.className = 'text-center text-muted p-3';
            emptyItem.textContent = '没有保存的钱包账户';
            walletRadioGroup.appendChild(emptyItem);
          }
        }
      };
      
      // 添加事件监听器更新当前选择的地址
      radio.addEventListener('change', function() {
        if (this.checked) {
          currentSelectedAddressDiv.textContent = `当前选择: ${address}`;
        }
      });
      
      // 如果是选中状态，初始化显示当前地址
      if (radio.checked) {
        currentSelectedAddressDiv.textContent = `当前选择: ${address}`;
      }
      
      radioDiv.appendChild(radio);
      radioDiv.appendChild(label);
      radioDiv.appendChild(deleteBtn);
      
      walletRadioGroup.appendChild(radioDiv);
    });
  } else {
    const emptyItem = document.createElement('div');
    emptyItem.className = 'text-center text-muted p-3';
    emptyItem.textContent = '没有保存的钱包账户';
    walletRadioGroup.appendChild(emptyItem);
  }
  
  // 切换Signer类型
  document.getElementById('hardhatSigner').addEventListener('change', function() {
    if (this.checked) {
      document.getElementById('hardhatSignerList').style.display = 'block';
      document.getElementById('walletSignerList').style.display = 'none';
      
      // 更新当前选择的地址显示
      const hardhatSelect = document.getElementById('hardhatSelect');
      const selectedAddress = hardhatSelect.options[hardhatSelect.selectedIndex].value;
      document.getElementById('currentSelectedAddress').textContent = `当前选择: ${selectedAddress}`;
    }
  });
  
  document.getElementById('walletSigner').addEventListener('change', function() {
    if (this.checked) {
      document.getElementById('hardhatSignerList').style.display = 'none';
      document.getElementById('walletSignerList').style.display = 'block';
      
      // 更新当前选择的地址显示
      const selectedRadio = document.querySelector('input[name="walletAddress"]:checked');
      if (selectedRadio) {
        document.getElementById('currentSelectedAddress').textContent = `当前选择: ${selectedRadio.value}`;
      } else {
        document.getElementById('currentSelectedAddress').textContent = '请选择一个地址';
      }
    }
  });
  
  // 当hardhat select改变时更新当前选择的地址
  document.getElementById('hardhatSelect').addEventListener('change', function() {
    if (document.getElementById('hardhatSigner').checked) {
      document.getElementById('currentSelectedAddress').textContent = `当前选择: ${this.value}`;
    }
  });
  
  // 添加钱包地址事件
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
    const walletRadioGroup = document.getElementById('walletSignerRadioGroup');
    
    // 移除空提示
    const emptyItem = walletRadioGroup.querySelector('.text-muted');
    if (emptyItem) {
      walletRadioGroup.innerHTML = '';
    }
    
    // 创建新的radio div
    const radioDiv = document.createElement('div');
    radioDiv.className = 'form-check d-flex justify-content-between align-items-center mb-2';
    
    // 确定新的索引
    const newIndex = walletRadioGroup.children.length;
    
    // 创建radio按钮
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.className = 'form-check-input';
    radio.name = 'walletAddress';
    radio.id = `wallet-${newIndex}`;
    radio.value = newAddress;
    radio.checked = true; // 新添加的设为选中
    
    // 创建label
    const label = document.createElement('label');
    label.className = 'form-check-label me-auto';
    label.htmlFor = `wallet-${newIndex}`;
    label.textContent = newAddress;
    
    // 创建删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-outline-danger ms-2';
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.title = '删除此账户';
    deleteBtn.onclick = function(e) {
      e.preventDefault();
      if (confirm('确定要删除此钱包地址吗？')) {
        // 从列表和存储中删除
        if (removeWalletAccount) {
          removeWalletAccount(newAddress);
        }
        radioDiv.remove();
        
        // 如果列表为空，显示提示信息
        if (walletRadioGroup.children.length === 0) {
          const emptyItem = document.createElement('div');
          emptyItem.className = 'text-center text-muted p-3';
          emptyItem.textContent = '没有保存的钱包账户';
          walletRadioGroup.appendChild(emptyItem);
        }
      }
    };
    
    // 添加事件监听器更新当前选择的地址
    radio.addEventListener('change', function() {
      if (this.checked) {
        document.getElementById('currentSelectedAddress').textContent = `当前选择: ${newAddress}`;
      }
    });
    
    // 更新当前选择的地址显示
    document.getElementById('currentSelectedAddress').textContent = `当前选择: ${newAddress}`;
    
    // 取消其他radio的选中状态
    document.querySelectorAll('input[name="walletAddress"]').forEach(r => {
      r.checked = false;
    });
    
    radioDiv.appendChild(radio);
    radioDiv.appendChild(label);
    radioDiv.appendChild(deleteBtn);
    
    walletRadioGroup.appendChild(radioDiv);
    
    // 清空输入框
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
      const selectedRadio = document.querySelector('input[name="walletAddress"]:checked');
      if (selectedRadio) {
        selectedAddress = selectedRadio.value;
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
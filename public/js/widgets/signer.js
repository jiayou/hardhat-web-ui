import { fetchSigners } from '../api.js';
import { showToast, longerAddress, shortenAddress,fetchConnectedWalletAccounts } from '../utils.js';
import {
  currentSigner,
  addWalletAccount,
  removeWalletAccount,
  getWalletAccounts
} from '../state.js';

// 存储钱包连接状态和已连接账户
let walletAvailable = true // window.ethereum ? true : false;
let connectedAccounts = [];

/**
 * 打开Signer选择对话框
 */
export function openSignerDialog() {
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
                <input class="form-check-input" type="radio" name="signerAccount" id="hardhatSigner" value="hardhat" checked>
                <label class="form-check-label" for="hardhatSigner">
                  Hardhat测试账户
                </label>
                <div class="mt-2 mb-3" id="hardhatSignerList">
                  <select class="form-select" id="hardhatSelect">
                    <!-- Hardhat账户将在这里动态填充 -->
                  </select>
                </div>
              </div>
              <div id="walletSignerRadioGroup" class="mb-3">
                <!-- 钱包账户单选按钮将在这里动态填充 -->
              </div>
            </div>
            <div class="d-flex align-items-center">
              <input type="text" class="form-control me-2" id="newWalletAddress" placeholder="添加新钱包地址: 0x...">
              <button type="button" class="btn btn-success" id="confirmAddWallet" style="min-width: 80px;">添加</button>
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
  const hardhatSignerRadio = document.getElementById('hardhatSigner');
  hardhatSignerRadio.checked = currentType === 'hardhat';

  // 根据类型设置hardhat select的状态
  const hardhatSelect = document.getElementById('hardhatSelect');
  hardhatSelect.disabled = currentType !== 'hardhat';

  // 初始选中的wallet选项会在填充walletRadioGroup时设置

  // 初始化当前选择的显示
  const currentSelectedAddressDiv = document.getElementById('currentSelectedAddress');
  if (signerAddress) {
    currentSelectedAddressDiv.textContent = `当前选择: ${signerAddress}`;
  } else {
    currentSelectedAddressDiv.textContent = '请选择一个地址';
  }

  // 获取并填充Hardhat测试账户
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

  // 创建钱包账户列表
  fetchConnectedWalletAccounts().then( accounts => {
    connectedAccounts = accounts;
    renderWalletAccountsList();
  })
  
  // 监听所有签名者选项变化
  document.querySelectorAll('input[name="signerAccount"]').forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        const hardhatSelect = document.getElementById('hardhatSelect');

        if (this.id === 'hardhatSigner') {
          // 启用Hardhat下拉选择框
          hardhatSelect.disabled = false;

          // 更新当前选择的地址显示
          const selectedAddress = hardhatSelect.options[hardhatSelect.selectedIndex].value;
          document.getElementById('currentSelectedAddress').textContent = `当前选择: ${selectedAddress}`;

        } else {
          // 禁用Hardhat下拉选择框
          hardhatSelect.disabled = true;

          // 钱包账户被选中
          document.getElementById('currentSelectedAddress').textContent = `当前选择: ${this.value}`;

        }
      }
    });
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

    // 确定新的索引
    const newIndex = walletRadioGroup.children.length;

    // 创建新的wallet item并设为选中
    const radioDiv = createWalletAccountItem(newAddress, newIndex, true, walletRadioGroup);
    walletRadioGroup.appendChild(radioDiv);

    // 取消其他radio的选中状态
    document.querySelectorAll('input[name="signerAccount"]').forEach(r => {
      if (r.id !== `wallet-${newIndex}`) {
        r.checked = false;
      }
    });

    // 更新当前选择的地址显示
    document.getElementById('currentSelectedAddress').textContent = `当前选择: ${newAddress}`;

    // 清空输入框
    document.getElementById('newWalletAddress').value = '';

    showToast('成功', '钱包地址已添加', 'success');
  });

  // 确认按钮事件
  document.getElementById('confirmSigner').addEventListener('click', function() {
    let selectedAddress = null;
    let selectedType = null;

    // 获取选中的账户
    const selectedRadio = document.querySelector('input[name="signerAccount"]:checked');

    if (selectedRadio) {
      if (selectedRadio.id === 'hardhatSigner') {
        selectedType = 'hardhat';
        const select = document.getElementById('hardhatSelect');
        selectedAddress = select.options[select.selectedIndex].value;
      } else if (selectedRadio.id.startsWith('wallet-')) {
        selectedType = 'wallet';
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

/**
 * 创建钱包账户列表项
 * @param {string} address - 钱包地址
 * @param {number} index - 索引号
 * @param {boolean} checked - 是否选中
 * @param {HTMLElement} walletRadioGroup - 钱包列表容器元素
 * @returns {HTMLElement} 创建的列表项DOM元素
 */
/**
 * 创建钱包账户列表项
 * @param {string} address - 钱包地址
 * @param {number} index - 索引号
 * @param {boolean} checked - 是否选中
 * @param {HTMLElement} walletRadioGroup - 钱包列表容器元素
 * @returns {HTMLElement} 创建的列表项DOM元素
 */
function createWalletAccountItem(address, index, checked, walletRadioGroup) {
  const currentSelectedAddressDiv = document.getElementById('currentSelectedAddress');

  // 创建radio容器
  const radioDiv = document.createElement('div');
  radioDiv.className = 'form-check d-flex justify-content-between align-items-center mb-2';

  // 创建radio按钮
  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.className = 'form-check-input';
  radio.name = 'signerAccount';
  radio.id = `wallet-${index}`;
  radio.value = address;
  radio.dataset.type = 'wallet';
  radio.checked = checked;

  // 创建label和状态图标容器
  const labelContainer = document.createElement('div');
  labelContainer.className = 'd-flex align-items-center me-auto';
  
  // 创建label
  const label = document.createElement('label');
  label.className = 'form-check-label';
  label.htmlFor = `wallet-${index}`;
  label.textContent = `钱包账户 ${address}`;
  
  // 添加连接状态图标
  const statusIcon = document.createElement('span');
  statusIcon.className = 'ms-2 badge';
  
  // 检查地址是否在已连接账户中
  const isConnected = connectedAccounts.includes(address.toLowerCase());
  
  if (isConnected) {
    statusIcon.className += ' bg-success';
    statusIcon.title = '已连接';
    statusIcon.innerHTML = '<i class="bi bi-link"></i>';
  } else {
    statusIcon.className += ' bg-secondary';
    statusIcon.title = '未连接';
    statusIcon.innerHTML = '<i class="bi bi-link-45deg"></i>';
  }
  
  labelContainer.appendChild(label);
  labelContainer.appendChild(statusIcon);

  // 添加label点击事件确保对应的radio能被选中
  label.addEventListener('click', function() {
      radio.checked = true;
      // 触发change事件
      const event = new Event('change');
      radio.dispatchEvent(event);
  });

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

  // 创建连接/断开按钮（仅当window.ethereum可用时显示）
  const connectBtn = document.createElement('button');
  connectBtn.className = 'btn btn-sm ms-2';
  connectBtn.style.display = walletAvailable ? 'inline-block' : 'none';
  
  updateConnectButtonState(connectBtn, isConnected);
  
  connectBtn.onclick = async function(e) {
      e.preventDefault(); // 防止触发radio选择
      
      // 获取当前按钮状态，判断是执行连接还是断开操作
      const currentlyConnected = connectedAccounts.includes(address.toLowerCase());
      
      if (currentlyConnected) {
          // 执行断开操作
          await handleDisconnect(connectBtn, address);
      } else {
          // 执行连接操作
          await handleConnect(connectBtn, address);
      }
      
      // 更新状态图标
      const isNowConnected = connectedAccounts.includes(address.toLowerCase());
      const statusIcon = labelContainer.querySelector('.badge');
      
      if (isNowConnected) {
          statusIcon.className = 'ms-2 badge bg-success';
          statusIcon.title = '已连接';
          statusIcon.innerHTML = '<i class="bi bi-link"></i>';
      } else {
          statusIcon.className = 'ms-2 badge bg-secondary';
          statusIcon.title = '未连接';
          statusIcon.innerHTML = '<i class="bi bi-link-45deg"></i>';
      }
  };
  
  /**
   * 处理连接钱包操作
   * @param {HTMLElement} button - 连接按钮
   * @param {string} walletAddress - 要连接的钱包地址
   */
  async function handleConnect(button, walletAddress) {
      try {
          // 显示加载状态
          button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 连接中...';
          button.disabled = true;
          button.classList.remove('btn-outline-primary');
          button.classList.add('btn-outline-secondary');

          // 尝试连接MetaMask
          if (!window.ethereum) {
              throw new Error("MetaMask未安装或不可用");
          }

          // 请求用户连接账户
          const accounts = await window.ethereum.request({
              method: 'eth_requestAccounts'
          });

          if (!accounts || accounts.length === 0) {
              throw new Error("没有连接到MetaMask账户");
          }
          
          // 更新已连接账户列表
          connectedAccounts = accounts.map(acc => acc.toLowerCase());
          
          // 检查输入的钱包地址是否在已连接账户中
          const targetAddress = walletAddress.toLowerCase();
          const isTargetConnected = connectedAccounts.includes(targetAddress);
          
          if (isTargetConnected) {
              showToast('连接成功', `成功连接到钱包地址: ${targetAddress}`, 'success');
              updateConnectButtonState(button, true);
          } else {
              // 地址不在已连接列表中，显示警告
              showToast('地址不匹配', `当前MetaMask中没有地址 ${targetAddress}，已连接账户: ${accounts.join(", ")}`, 'warning');
              updateConnectButtonState(button, false);
          }
          
      } catch (error) {
          console.error('钱包连接失败:', error);
          showToast('连接失败', error.message || '无法连接到钱包', 'danger');
          updateConnectButtonState(button, false);
      } finally {
          button.disabled = false;
      }
  }
  
  /**
   * 处理断开钱包连接操作
   * @param {HTMLElement} button - 连接按钮
   * @param {string} walletAddress - 要断开的钱包地址 
   */
  async function handleDisconnect(button, walletAddress) {
      try {
          button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 断开中...';
          button.disabled = true;
          
          // 目前MetaMask API不支持直接断开特定账户，我们只能在界面上反映这一变化
          // 从连接列表中移除此地址
          const addressLower = walletAddress.toLowerCase();
          connectedAccounts = connectedAccounts.filter(addr => addr !== addressLower);
          
          showToast('已断开', `已从连接列表中移除钱包地址: ${addressLower}`, 'info');
          updateConnectButtonState(button, false);
          
      } catch (error) {
          console.error('断开钱包连接失败:', error);
          showToast('断开失败', error.message || '无法断开钱包连接', 'danger');
      } finally {
          button.disabled = false;
      }
  }
  
  /**
   * 更新连接按钮状态
   * @param {HTMLElement} button - 连接按钮
   * @param {boolean} isConnected - 是否已连接
   */
  function updateConnectButtonState(button, isConnected) {
      if (isConnected) {
          button.innerHTML = '断开连接';
          button.title = '断开与此钱包地址的连接';
          button.className = 'btn btn-sm btn-outline-danger ms-2';
      } else {
          button.innerHTML = '连接';
          button.title = '连接到此钱包地址';
          button.className = 'btn btn-sm btn-outline-primary ms-2';
      }
  }

  // 添加事件监听器更新当前选择的地址
  radio.addEventListener('change', function() {
      if (this.checked) {
      currentSelectedAddressDiv.textContent = `当前选择: ${address}`;
      // 禁用Hardhat下拉选择框
      document.getElementById('hardhatSelect').disabled = true;
      }
  });

  // 如果是选中状态，初始化显示当前地址
  if (radio.checked) {
      currentSelectedAddressDiv.textContent = `当前选择: ${address}`;
  }

  radioDiv.appendChild(radio);
  radioDiv.appendChild(labelContainer);
  radioDiv.appendChild(deleteBtn);
  radioDiv.appendChild(connectBtn);

  return radioDiv;
}


/**
 * 重新渲染钱包账户列表
 */
function renderWalletAccountsList() {
  // 获取钱包账户列表容器
  const walletRadioGroup = document.getElementById('walletSignerRadioGroup');
  if (!walletRadioGroup) return;
  
  // 清空当前列表
  walletRadioGroup.innerHTML = '';
  
  // 获取钱包账户
  const accounts = getWalletAccounts();
  
  // 获取当前选择的signer
  const selectedSigner = currentSigner();
  
  if (accounts && accounts.length > 0) {
    accounts.forEach((address, index) => {
      // 判断是否是当前选中的地址
      const isSelected = selectedSigner && 
                        selectedSigner.type === 'wallet' && 
                        selectedSigner.address.toLowerCase() === address.toLowerCase();
      
      // 创建钱包账户列表项
      const accountItem = createWalletAccountItem(address, index, isSelected, walletRadioGroup);
      walletRadioGroup.appendChild(accountItem);
    });
  } else {
    // 如果没有钱包账户，显示提示信息
    const emptyItem = document.createElement('div');
    emptyItem.className = 'text-center text-muted p-3';
    emptyItem.textContent = '没有保存的钱包账户';
    walletRadioGroup.appendChild(emptyItem);
  }
}

/**
 * 更新当前Signer显示
 */
export function displayCurrentSigner() {
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

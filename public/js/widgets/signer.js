import { showToast, longerAddress, shortenAddress } from '../utils.js';
import { currentSigner } from '../state.js';
import { t } from '../i18n.js';
let walletAccounts = [];

async function fetchConnectedWalletAccounts() {
  if (!window.ethereum) return []

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts'
    });
    console.log(`${t('wallet.connectedAccounts')}:`, accounts);
    if (accounts && accounts.length > 0) {
      return accounts.map(addr => addr.toLowerCase());
    }
  } catch (error) {
    console.error(`${t('wallet.fetchAccountsFailed')}:`, error);
  }

  return [];
}



/**
 * 获取签名者(signers)列表
 * @returns {Promise} 包含签名者列表的Promise
 */
async function fetchSigners() {
  try {
    const response = await fetch('/api/signer');
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching signers:', error);
    showToast('Error', 'Failed to fetch signers: ' + error.message);
    throw error;
  }
}


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
            <h5 class="modal-title" id="signerDialogLabel" data-i18n="signer.selectSigner">选择Signer</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <div class="form-check">
                <input class="form-check-input" type="radio" name="signerAccount" id="hardhatSigner" value="hardhat" checked>
                <label class="form-check-label" for="hardhatSigner" data-i18n="signer.hardhatTestAccounts">
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
            <div>
              <a href="#" class="text-primary small" id="connectWalletLink">
                <span data-i18n="wallet.noAccount">找不到账户？连接钱包</span>
              </a>
            </div>
          </div>
          <div class="modal-footer d-flex justify-content-between">
            <div id="currentSelectedAddress" class="text-muted"></div>
            <div>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="common.cancel">取消</button>
              <button type="button" class="btn btn-primary" id="confirmSigner" data-i18n="common.confirm">确认</button>
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
  const modalElement = document.getElementById('signerDialog');
  const modal = new bootstrap.Modal(modalElement);
  modal.show();

  // 添加连接钱包链接的点击事件
  document.getElementById('connectWalletLink').addEventListener('click', function(e) {
    e.preventDefault();
    if (window.ethereum) {
      window.ethereum.request({
        method: 'eth_requestAccounts'
      }).then(accounts => {
        console.log(`${t('wallet.accountsConnected')}:`, accounts);
        // 更新钱包账户列表
        walletAccounts = accounts.map(addr => addr.toLowerCase());
        renderWalletAccountsList();
        showToast(t('wallet.connectSuccess'), t('wallet.accountsUpdated'), 'success');
      }).catch(error => {
        console.error(`${t('wallet.connectFailed')}:`, error);
        showToast(t('error.title'), t('wallet.connectRejected'), 'danger');
      });
    } else {
      showToast(t('error.title'), t('wallet.noProvider'), 'danger');
    }
  });

  // 确保模态框在关闭时正确销毁
  modalElement.addEventListener('hidden.bs.modal', function() {
    modal.dispose();
  });

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
    currentSelectedAddressDiv.textContent = `${t('signer.currentSelection')}: ${signerAddress}`;
  } else {
    currentSelectedAddressDiv.textContent = t('signer.pleaseSelectAddress');
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
      option.textContent = t('signer.noHardhatAccounts');
      option.disabled = true;
      selectElement.appendChild(option);
    }
  })
  .catch(error => {
    showToast(t('signer.hardhatFetchFailed'), error)
  });

  // 创建钱包账户列表
  fetchConnectedWalletAccounts().then( accounts => {
    walletAccounts = accounts;
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
          document.getElementById('currentSelectedAddress').textContent = `${t('signer.currentSelection')}: ${selectedAddress}`;

        } else {
          // 禁用Hardhat下拉选择框
          hardhatSelect.disabled = true;

          // 钱包账户被选中
          document.getElementById('currentSelectedAddress').textContent = `${t('signer.currentSelection')}: ${this.value}`;

        }
      }
    });
  });

  // 当hardhat select改变时更新当前选择的地址
  document.getElementById('hardhatSelect').addEventListener('change', function() {
    if (document.getElementById('hardhatSigner').checked) {
      document.getElementById('currentSelectedAddress').textContent = `${t('signer.currentSelection')}: ${this.value}`;
    }
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
      window.location.reload();
    } else {
      showToast(t('error.title'), t('signer.pleaseSelectSignerAddress'), 'danger');
    }
  });

  // 模态框关闭时移除DOM元素
  document.getElementById('signerDialog').addEventListener('hidden.bs.modal', function() {
    if (modalContainer && modalContainer.parentNode) {
      document.body.removeChild(modalContainer);
    }
  });

  // 使用Bootstrap的方式处理模态框关闭
  const signerDialog = document.getElementById('signerDialog');
  signerDialog.addEventListener('hide.bs.modal', function(event) {
    // 这个事件在模态框隐藏之前触发
    console.log('Modal is about to hide');
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
function createWalletAccountItem(address, index, checked) {
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

  // 创建label容器
  const labelContainer = document.createElement('div');
  labelContainer.className = 'd-flex align-items-center me-auto';
  
  // 创建label
  const label = document.createElement('label');
  label.className = 'form-check-label';
  label.htmlFor = `wallet-${index}`;
  label.textContent = `${t('wallet.account')} ${address}`;
  
  labelContainer.appendChild(label);

  // 添加label点击事件确保对应的radio能被选中
  label.addEventListener('click', function() {
      radio.checked = true;
      // 触发change事件
      const event = new Event('change');
      radio.dispatchEvent(event);
  });

  // 添加事件监听器更新当前选择的地址
  radio.addEventListener('change', function() {
    if (this.checked) {
      currentSelectedAddressDiv.textContent = `${t('signer.currentSelection')}: ${address}`;
      // 禁用Hardhat下拉选择框
      document.getElementById('hardhatSelect').disabled = true;
    }
  });

  // 如果是选中状态，初始化显示当前地址
  if (radio.checked) {
      currentSelectedAddressDiv.textContent = `${t('signer.currentSelection')}: ${address}`;
  }

  radioDiv.appendChild(radio);
  radioDiv.appendChild(labelContainer);

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
  const accounts = walletAccounts;
  
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
    emptyItem.textContent = t('wallet.noConnectedAccounts');
    walletRadioGroup.appendChild(emptyItem);

    // 选中hardhat选项
    document.getElementById('hardhatSigner').checked = true;
    // 确保hardhat选择框是启用状态
    document.getElementById('hardhatSelect').disabled = false;
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
    signerDisplay.textContent = t('signer.pleaseSelect');
    signerDisplay.title = '';
  }
}
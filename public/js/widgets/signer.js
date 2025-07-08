import { fetchSigners } from '../api.js';
import { showToast, longerAddress, shortenAddress } from '../utils.js';
import {
  currentSigner,
  addWalletAccount,
  removeWalletAccount,
  getWalletAccounts
} from '../state.js';

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

  // 获取并填充钱包账户
  const walletRadioGroup = document.getElementById('walletSignerRadioGroup');
  walletRadioGroup.innerHTML = ''; // 清空现有内容

  const walletAccounts = getWalletAccounts ? getWalletAccounts() : [];
  if (walletAccounts && walletAccounts.length > 0) {
    walletAccounts.forEach((address, index) => {
      const isChecked = signerAddress === address && currentType === 'wallet';
      const radioDiv = createWalletAccountItem(address, index, isChecked, walletRadioGroup);
      walletRadioGroup.appendChild(radioDiv);
    });
  } else {
    const emptyItem = document.createElement('div');
    emptyItem.className = 'text-center text-muted p-3';
    emptyItem.textContent = '没有保存的钱包账户';
    walletRadioGroup.appendChild(emptyItem);
  }

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

  // 创建label
  const label = document.createElement('label');
  label.className = 'form-check-label me-auto';
  label.htmlFor = `wallet-${index}`;
  label.textContent = `钱包账户 ${address}`;

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

  // 创建测试连接按钮
  const testConnectBtn = document.createElement('button');
  testConnectBtn.className = 'btn btn-sm btn-outline-primary ms-2';
  testConnectBtn.innerHTML = '测试连接';
  testConnectBtn.title = '测试与钱包的连接';
  testConnectBtn.onclick = async function(e) {
      e.preventDefault(); // 防止触发radio选择
      try {
      // 显示加载状态
      const originalText = testConnectBtn.innerHTML;
      testConnectBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 连接中...';
      testConnectBtn.disabled = true;

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

      // 验证连接的钱包地址与选择的地址是否匹配
      const connectedAddress = accounts[0].toLowerCase();
      const selectedAddress = address.toLowerCase();

      if (connectedAddress === selectedAddress) {
          showToast('连接成功', `成功连接到钱包地址: ${connectedAddress}`, 'success');
      } else {
          showToast('地址不匹配', `当前连接的钱包地址 (${connectedAddress}) 与选择的地址 (${selectedAddress}) 不符`, 'warning');
      }
      } catch (error) {
      console.error('钱包连接测试失败:', error);
      showToast('连接失败', error.message || '无法连接到钱包', 'danger');
      } finally {
      // 恢复按钮状态
      testConnectBtn.innerHTML = '测试连接';
      testConnectBtn.disabled = false;
      }
  };

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
  radioDiv.appendChild(label);
  radioDiv.appendChild(deleteBtn);
  radioDiv.appendChild(testConnectBtn);

  return radioDiv;
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

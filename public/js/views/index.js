/**
 * 首页视图
 */

import { fetchNetworkInfo, fetchSigners } from '../api.js';
import { showToast, formatDateTime } from '../utils.js';

/**
 * 渲染首页视图
 * @returns {string} HTML内容
 */
const IndexView = async () => {
  try {
    const networkData = await fetchNetworkInfo();

    // 加载signers列表
    loadSigners();

    // 设置刷新按钮事件
    setTimeout(() => {
      const refreshBtn = document.getElementById('refreshSigners');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', loadSigners);
      }

      // 设置signer选择变更事件
      const signerSelect = document.getElementById('signerSelect');
      if (signerSelect) {
        signerSelect.addEventListener('change', function() {
          const selectedSigner = this.value;
          // 将选中的signer保存到localStorage
          if (selectedSigner) {
            localStorage.setItem('currentSigner', selectedSigner);
            showToast('Success', `已将当前Signer设置为: ${selectedSigner.substring(0, 8)}...`);
          }
        });
      }
    }, 100);

    // 更新网络信息显示
    if (networkData.network) {
      document.getElementById('networkName').textContent = networkData.network.name || 'Unknown';
      document.getElementById('chainId').textContent = networkData.network.chainId || '-';
    }
    
    return `
      <div class="row mt-4">
        <div class="col-md-12 mb-4">
          <h2>Hardhat 网络仪表板</h2>
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">网络信息</h5>
              <div class="table-responsive">
                <table class="table">
                  <tbody>
                    <tr>
                      <th scope="row">网络名称</th>
                      <td>${networkData.network?.name || 'Unknown'}</td>
                    </tr>
                    <tr>
                      <th scope="row">Chain ID</th>
                      <td>${networkData.network?.chainId || '-'}</td>
                    </tr>
                    <tr>
                      <th scope="row">最新区块</th>
                      <td>${networkData.latestBlock?.number || 'Unknown'}</td>
                    </tr>
                    <tr>
                      <th scope="row">Gas Price</th>
                      <td>${networkData.gasPrice ? (parseInt(networkData.gasPrice) / 1e9) + ' Gwei' : 'Unknown'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-12 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">最近区块</h5>
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>区块号</th>
                      <th>哈希</th>
                      <th>时间</th>
                      <th>交易数</th>
                    </tr>
                  </thead>
                  <tbody id="recentBlocks">
                    ${networkData.recentBlocks ? networkData.recentBlocks.map(block => `
                      <tr>
                        <td><a href="/block?number=${block.number}" data-link>${block.number}</a></td>
                        <td><code>${block.hash.slice(0, 10)}...</code></td>
                        <td>${formatDateTime(block.timestamp)}</td>
                        <td>${block.transactions.length}</td>
                      </tr>
                    `).join('') : '<tr><td colspan="4">No blocks available</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering index view:', error);
    showToast('Error', 'Failed to load dashboard data');
    return `<div class="alert alert-danger m-5">Failed to load dashboard data: ${error.message}</div>`;
  }
};

/**
 * 加载签名者(signers)列表
 */
async function loadSigners() {
  try {
    const signerSelect = document.getElementById('signerSelect');
    if (!signerSelect) return;

    signerSelect.innerHTML = '<option value="">加载中...</option>';

    const signers = await fetchSigners();
    if (!signers || signers.length === 0) {
      signerSelect.innerHTML = '<option value="">没有可用的Signers</option>';
      return;
    }

    // 获取当前选中的signer
    const currentSigner = localStorage.getItem('currentSigner') || '';

    // 清空选择框并填充新数据
    signerSelect.innerHTML = '<option value="">请选择Signer</option>';

    signers.forEach(signer => {
      const option = document.createElement('option');
      option.value = signer;
      // 显示前8个字符...
      option.textContent = `${signer.substring(0, 8)}...`;
      option.title = signer; // 完整hash显示为title提示

      // 如果是当前选中的signer，设为选中状态
      if (signer === currentSigner) {
        option.selected = true;
      }

      signerSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading signers:', error);
    const signerSelect = document.getElementById('signerSelect');
    if (signerSelect) {
      signerSelect.innerHTML = '<option value="">加载失败</option>';
    }
  }
}

// 导出默认视图函数
export default IndexView;
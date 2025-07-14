/**
 * 首页视图
 */

import { showToast, formatDateTime } from '../utils.js';

/**
 * 渲染首页视图
 * @returns {string} HTML内容
 */
const IndexView = async () => {
  try {
    const response = await fetch('/api/network/info');
    const networkData = await response.json();

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
      </div>
    `;
  } catch (error) {
    console.error('Error rendering index view:', error);
    showToast('Error', 'Failed to load dashboard data');
    return `<div class="alert alert-danger m-5">Failed to load dashboard data: ${error.message}</div>`;
  }
};


// 导出默认视图函数
export default IndexView;
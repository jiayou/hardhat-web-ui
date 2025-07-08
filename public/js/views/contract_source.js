/**
 * 合约源码视图模块
 */

/**
 * 显示合约源代码
 * @param {Object} contract - 合约对象
 */
export function renderContractSource(contract) {
  if (!contract) return;

  // 显示合约源代码
  const contractSource = document.getElementById('contractSource');
  if (contract.source) {
    contractSource.textContent = contract.source;
  } else {
    contractSource.textContent = '// Source code not available';
  }

  // 应用语法高亮
  if (typeof hljs !== 'undefined') {
    hljs.highlightElement(contractSource);
  }
}

/**
 * 初始化合约源码视图
 */
export function initContractSourceView() {
  // 可以添加源码视图的特定初始化逻辑

  // 高亮代码
  document.querySelectorAll('pre code').forEach((block) => {
    if (window.hljs) {
      window.hljs.highlightElement(block);
    }
  });
}

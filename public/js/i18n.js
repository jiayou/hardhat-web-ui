/**
 * i18n国际化支持模块
 * 为前端提供多语言支持
 */

// 支持的语言列表
export const supportedLanguages = {
  'zh-CN': '中文',
  'en-US': 'English'
};

// 当前语言
let currentLanguage = localStorage.getItem('lang') || 'zh-CN';

// 语言包数据
const translations = {
  'zh-CN': {},
  'en-US': {}
};

/**
 * 初始化i18n系统
 */
export async function initI18n() {
  // 加载语言包
  try {
    const zhResponse = await fetch('/js/i18n/zh-CN.json');
    const enResponse = await fetch('/js/i18n/en-US.json');

    translations['zh-CN'] = await zhResponse.json();
    translations['en-US'] = await enResponse.json();

    // 设置HTML语言属性
    document.documentElement.lang = currentLanguage;

    // 触发翻译事件
    translatePage();

    // 标记i18n已初始化完成
    window.i18nInitialized = true;

    // 触发i18n初始化完成事件，供其他模块使用
    const event = new CustomEvent('i18n-initialized');
    document.dispatchEvent(event);

    console.log('i18n initialization completed');
  } catch (error) {
    console.error('加载语言包失败:', error);
  }
}

/**
 * 获取当前语言
 * @returns {string} 当前语言代码
 */
export function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * 切换语言
 * @param {string} lang - 目标语言代码
 */
export function switchLanguage(lang) {
  if (supportedLanguages[lang]) {
    currentLanguage = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;

    // 触发翻译事件
    translatePage();

    // 触发自定义事件, 通知其他组件语言已更改
    const event = new CustomEvent('language-changed', {
      detail: { language: lang }
    });
    document.dispatchEvent(event);

    return true;
  }
  return false;
}

/**
 * 翻译函数
 * @param {string} key - 翻译键
 * @param {object} params - 替换参数
 * @returns {string} 翻译后的文本
 */
export function t(key, params = {}) {
  const keys = key.split('.');
  let value = translations[currentLanguage];

  // 遍历键路径获取翻译值
  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      // 如果当前语言没有该翻译, 尝试使用默认语言(中文)
      if (currentLanguage !== 'zh-CN') {
        let defaultValue = translations['zh-CN'];
        for (const defaultK of keys) {
          if (defaultValue && defaultValue[defaultK]) {
            defaultValue = defaultValue[defaultK];
          } else {
            return key; // 如果默认语言也没有, 则返回键名
          }
        }
        value = defaultValue;
      } else {
        return key; // 如果是默认语言且没有翻译, 返回键名
      }
    }
  }

  // 替换参数
  if (typeof value === 'string' && params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  }

  return value || key;
}

/**
 * 翻译整个页面
 * 查找所有带有data-i18n属性的元素并翻译
 */
export function translatePage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  // 翻译属性
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const attrSpec = el.getAttribute('data-i18n-attr');
    if (attrSpec) {
      const [attr, key] = attrSpec.split(':');
      if (attr && key) {
        el.setAttribute(attr, t(key));
      }
    }
  });

  // 翻译placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      el.setAttribute('placeholder', t(key));
    }
  });
}

// 监听DOM变化, 自动翻译新添加的元素
const observer = new MutationObserver(mutations => {
  let shouldTranslate = false;

  mutations.forEach(mutation => {
    if (mutation.type === 'childList' && mutation.addedNodes.length) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // 元素节点
          if (node.hasAttribute('data-i18n') || 
              node.hasAttribute('data-i18n-attr') || 
              node.hasAttribute('data-i18n-placeholder') ||
              node.querySelector('[data-i18n], [data-i18n-attr], [data-i18n-placeholder]')) {
            shouldTranslate = true;
          }
        }
      });
    }
  });

  if (shouldTranslate) {
    translatePage();
  }
});

// 初始化DOM变化观察器
export function initMutationObserver() {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

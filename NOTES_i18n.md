# 前端国际化 (i18n) 开发规范

## 1. 基本原则

1. **单一事实源**: 所有可翻译文本都应在语言包 JSON 文件中定义
2. **可维护性**: 使用层级键名组织翻译，便于管理和查找
3. **完整覆盖**: 确保界面上所有用户可见文本都支持多语言
4. **代码一致性**: 在相似场景下使用统一的翻译方法

## 2. 键名命名规范

1. **层级式命名**: 使用点号分隔的层次结构，例如: `module.submodule.element`
   - 第一级: 功能模块/页面名称 (如 `contract`, `network`, `account`)
   - 第二级: 子模块/功能区域 (如 `list`, `form`, `table`)
   - 第三级: 具体元素 (如 `title`, `button`, `error`)

2. **通用命名**: 针对全局使用的文本，使用 `common` 作为前缀
   - `common.confirm`, `common.cancel`, `common.save`
   - `common.error`, `common.success`, `common.warning`

3. **错误信息命名**: 使用 `failed` 或 `error` 作为后缀
   - `contract.failedToLoad`, `transaction.sendError`

## 3. HTML 模板中的 i18n

1. **静态内容**: 使用 `data-i18n` 属性
   ```html
   <h1 data-i18n="page.title">默认文本</h1>
   ```

2. **属性翻译**: 使用 `data-i18n-attr` 属性
   ```html
   <input data-i18n-attr="placeholder:form.namePlaceholder" placeholder="默认占位符">
   ```

3. **占位符翻译**: 使用 `data-i18n-placeholder` 属性
   ```html
   <input data-i18n-placeholder="form.emailPlaceholder" placeholder="请输入邮箱">
   ```

## 4. JavaScript 中的 i18n

1. **字符串拼接**:
   ```javascript
   // 正确方式
   const message = `${t('user.greeting')}, ${username}!`;
   
   // 错误方式 - 不要拼接翻译键
   const message = t('user.greeting') + ', ' + username + '!';
   ```

2. **模板字符串**:
   ```javascript
   // HTML 模板中嵌入翻译
   return `<div class="title">${t('module.title')}</div>`;
   ```

3. **参数传递**:
   ```javascript
   // 在翻译中使用参数
   const count = 5;
   const message = t('file.countMessage', { count });  // 文件数量：{count}
   ```

4. **动态渲染元素**:
   ```javascript
   // 在生成的 HTML 中使用 data-i18n 属性，同时立即应用翻译
   return `<button data-i18n="action.submit">${t('action.submit')}</button>`;
   ```

## 5. 错误处理规范

1. **用户提示信息**: 
   ```javascript
   showToast(t('common.error'), t('module.specificError'));
   ```

2. **错误日志**:
   ```javascript
   try {
     // 操作
   } catch (error) {
     console.error('Technical error info:', error);
     showToast(t('common.error'), t('module.failedOperation') + ': ' + error.message);
   }
   ```

## 6. 动态内容处理

1. **列表渲染**:
   ```javascript
   const items = data.map(item => `
     <li>
       <span data-i18n="item.prefix">${t('item.prefix')}</span>: ${item.name}
     </li>
   `).join('');
   ```

2. **条件文本**:
   ```javascript
   const message = count > 0 
     ? t('results.found', { count }) 
     : t('results.notFound');
   ```

## 7. 开发工作流程

1. **添加新文本**:
   - 先在默认语言包 (zh-CN.json) 中添加新的翻译键和值
   - 为其他语言包 (en-US.json 等) 添加相同的键

2. **重构与维护**:
   - 定期检查未使用的翻译键
   - 保持翻译键的组织结构与项目结构一致

3. **测试**:
   - 在多种语言环境下测试应用
   - 确保所有文本都可以正确翻译，没有硬编码的文本

## 8. 常见问题与解决方案

1. **长文本处理**:
   ```javascript
   // 长文本可以在语言包中使用 \n 换行，然后在显示时转换
   const longText = t('help.instructions').replace(/\\n/g, '<br>');
   ```

2. **富文本内容**:
   ```javascript
   // 对于包含 HTML 的富文本，可以使用 dangerouslySetInnerHTML 或类似机制
   element.innerHTML = t('content.richText');
   ```

3. **数字和日期格式化**:
   ```javascript
   // 使用辅助函数处理本地化的数字和日期
   const formattedDate = formatDate(date, getCurrentLanguage());
   ```


class MedicalOrderEditor {
    constructor() {
        this.currentResult = null;
        this.parser = new MedicalFormatParser();
        this.init();
    }

    init() {
        this.bindEvents();
        this.showWelcomeMessage();
    }

    bindEvents() {
        document.getElementById('parse-btn').addEventListener('click', () => this.parseData());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearAll());
        document.getElementById('load-template').addEventListener('click', () => this.showTemplateModal());
        
        document.getElementById('export-json').addEventListener('click', () => this.exportData('json'));
        document.getElementById('export-text').addEventListener('click', () => this.exportData('text'));

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        document.getElementById('order-input').addEventListener('input', () => this.autoDetectFormat());
        
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.parseData();
            }
        });

        // Accessibility improvements
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.switchTab(e.target.dataset.tab);
                }
            });
        });
    }

    showWelcomeMessage() {
        const tableBody = document.querySelector('#result-table tbody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="welcome-message">
                    <div class="emoji">👋</div>
                    <div class="title">検査オーダーフォーマットエディタへようこそ</div>
                    <div class="description">
                        ASTMまたはHL7フォーマットのデータを入力して「構文解析」ボタンを押してください<br>
                        テンプレートを使用して簡単に開始することもできます
                    </div>
                    <div class="shortcut">Ctrl + Enter</div>
                    <div style="font-size: 0.9rem; margin-top: 0.5rem;">で解析実行</div>
                </td>
            </tr>
        `;
    }

    parseData() {
        const input = document.getElementById('order-input').value.trim();
        const format = document.getElementById('format-selector').value;
        
        if (!input) {
            this.showError('入力データが空です。ASTMまたはHL7フォーマットのデータを入力してください。');
            return;
        }

        this.showLoading();

        try {
            // Use client-side parser
            const parseFormat = format === 'auto' ? null : format;
            const parseResult = this.parser.parse(input, parseFormat);
            
            // Create result object similar to server response
            const result = {
                success: true,
                result: parseResult,
                displayData: this.parser.formatForDisplay(parseResult),
                detectedFormat: parseResult.format.toLowerCase()
            };
            
            this.currentResult = result;
            this.displayResults(result);
            this.updateFormatSelector(result.detectedFormat);
            
        } catch (error) {
            console.error('Parse error:', error);
            this.showError(`解析エラー: ${error.message}`);
        }
    }

    displayResults(result) {
        this.displayTableView(result.displayData);
        this.displayJsonView(result.result);
        this.displayTreeView(result.result);
        
        if (result.result.errors && result.result.errors.length > 0) {
            this.showWarnings(result.result.errors);
        }
    }

    displayTableView(displayData) {
        const tableBody = document.querySelector('#result-table tbody');
        
        if (!displayData || displayData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="welcome-message">
                        <div class="emoji">📭</div>
                        <div class="title">解析結果がありません</div>
                        <div class="description">有効なASTMまたはHL7データを入力してください</div>
                    </td>
                </tr>
            `;
            return;
        }

        const rows = displayData.map(item => `
            <tr>
                <td>
                    <div><strong>${this.escapeHtml(item.segment)}</strong></div>
                    <div style="font-size: 0.85em; color: var(--text-secondary); margin-top: 0.25rem;">
                        Line ${item.lineNumber}
                    </div>
                </td>
                <td>
                    <div style="font-weight: 600; color: var(--blue-primary); margin-bottom: 0.25rem;">
                        ${this.escapeHtml(item.field)}
                    </div>
                    <div style="font-family: 'SF Mono', 'Monaco', monospace; background: var(--pale-blue); 
                               padding: 0.5rem; border-radius: 6px; margin-top: 0.25rem; 
                               border-left: 3px solid var(--blue-primary); font-size: 0.9rem;">
                        ${this.escapeHtml(item.value)}
                    </div>
                </td>
                <td style="font-size: 0.9em; color: var(--text-secondary);">
                    ${this.escapeHtml(item.description)}
                </td>
            </tr>
        `).join('');

        tableBody.innerHTML = rows;
    }

    displayJsonView(result) {
        const jsonOutput = document.getElementById('json-output');
        jsonOutput.textContent = JSON.stringify(result, null, 2);
    }

    displayTreeView(result) {
        const treeContainer = document.getElementById('tree-container');
        
        if (!result.segments || result.segments.length === 0) {
            treeContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="emoji">🌱</div>
                    <div class="title">構文木データがありません</div>
                    <div class="description">解析されたデータから構文木を生成できませんでした</div>
                </div>
            `;
            return;
        }

        const treeHtml = result.segments.map(segment => `
            <div class="tree-segment">
                <div class="tree-segment-header">
                    ${segment.segmentType || segment.recordType} - ${segment.description}
                    <span style="font-size: 0.85em; color: var(--text-secondary); font-weight: normal;">
                        (Line ${segment.lineNumber})
                    </span>
                </div>
                <div style="margin-left: 1rem;">
                    ${segment.fields.map(field => `
                        <div class="tree-field">
                            <strong>${this.escapeHtml(field.name)}:</strong> 
                            <code>${this.escapeHtml(field.value)}</code>
                            ${field.description && field.description !== 'Standard field' && field.description !== 'Standard ASTM field' && field.description !== 'Standard HL7 field' 
                                ? `<div style="font-size: 0.8em; color: var(--text-secondary); margin-top: 0.25rem; font-style: italic;">${this.escapeHtml(field.description)}</div>` 
                                : ''
                            }
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        treeContainer.innerHTML = treeHtml;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const activeContent = document.getElementById(`${tabName}-view`);
        
        activeBtn.classList.add('active');
        activeBtn.setAttribute('aria-selected', 'true');
        activeContent.classList.add('active');
    }

    autoDetectFormat() {
        const input = document.getElementById('order-input').value.trim();
        const selector = document.getElementById('format-selector');
        
        if (!input || input.length < 10) return;

        try {
            const detectedFormat = this.parser.detectFormat(input);
            
            if (detectedFormat !== 'unknown' && selector.value === 'auto') {
                // Visual feedback for auto-detection
                const option = selector.querySelector(`option[value="${detectedFormat}"]`);
                if (option) {
                    option.textContent = option.textContent + ' ✓';
                    setTimeout(() => {
                        option.textContent = option.textContent.replace(' ✓', '');
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Format detection error:', error);
        }
    }

    updateFormatSelector(detectedFormat) {
        const selector = document.getElementById('format-selector');
        if (detectedFormat && detectedFormat !== 'unknown') {
            selector.value = detectedFormat.toLowerCase();
        }
    }

    showTemplateModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'modal-title');

        const content = document.createElement('div');
        content.className = 'modal-content';

        let templateOptions = '';
        Object.entries(TEMPLATE_DATA).forEach(([format, templates]) => {
            templateOptions += `<div class="template-section">`;
            templateOptions += `<h4>${format.toUpperCase()} テンプレート</h4>`;
            Object.entries(templates).forEach(([templateName, template]) => {
                templateOptions += `
                    <button class="template-btn" 
                            data-format="${format}" 
                            data-template="${templateName}"
                            type="button">
                        <div class="template-name">${template.name}</div>
                        <div class="template-description">${template.description}</div>
                    </button>
                `;
            });
            templateOptions += `</div>`;
        });

        content.innerHTML = `
            <div class="modal-header">
                <h3 id="modal-title">📋 テンプレート選択</h3>
                <button class="close-btn" type="button" aria-label="モーダルを閉じる">
                    ✕
                </button>
            </div>
            <div style="margin-bottom: 1rem;">
                ${templateOptions}
            </div>
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                <p style="font-size: 0.95rem; color: var(--text-secondary); text-align: center;">
                    💡 テンプレートを選択すると、フォーマットが自動入力され構文解析が実行されます
                </p>
            </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // Focus management
        const closeBtn = content.querySelector('.close-btn');
        closeBtn.focus();

        // Template button events
        content.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.currentTarget.dataset.format;
                const templateName = e.currentTarget.dataset.template;
                
                try {
                    const templateData = TEMPLATE_DATA[format][templateName];
                    
                    if (templateData) {
                        document.getElementById('order-input').value = templateData.template;
                        document.getElementById('format-selector').value = format;
                        document.body.removeChild(modal);
                        this.parseData();
                    } else {
                        this.showError('テンプレートデータが見つかりませんでした');
                    }
                } catch (error) {
                    console.error('Template load error:', error);
                    this.showError('テンプレートの処理中にエラーが発生しました');
                }
            });
        });

        // Close button event
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Keyboard navigation
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
            }
        });
    }

    exportData(format) {
        if (!this.currentResult) {
            this.showError('エクスポートするデータがありません。まず構文解析を実行してください。');
            return;
        }

        let data, filename, mimeType;
        
        if (format === 'json') {
            data = JSON.stringify(this.currentResult.result, null, 2);
            filename = `medical-order-${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
        } else {
            data = this.formatAsText(this.currentResult.result);
            filename = `medical-order-${new Date().toISOString().split('T')[0]}.txt`;
            mimeType = 'text/plain';
        }

        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Visual feedback
        const btn = format === 'json' ? document.getElementById('export-json') : document.getElementById('export-text');
        const originalText = btn.textContent;
        btn.textContent = '✅ エクスポート完了';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }

    formatAsText(result) {
        let output = `Medical Order Format Analysis Report\n`;
        output += `Generated: ${new Date().toLocaleString('ja-JP')}\n`;
        output += `Format: ${result.format}\n`;
        output += `Total Segments: ${result.segments.length}\n`;
        output += `\n${'='.repeat(50)}\n\n`;

        result.segments.forEach((segment, index) => {
            output += `Segment ${index + 1}: ${segment.segmentType || segment.recordType} (${segment.description})\n`;
            output += `Line: ${segment.lineNumber}\n`;
            output += `Raw Data: ${segment.rawData}\n`;
            output += `\nFields:\n`;
            
            segment.fields.forEach(field => {
                output += `  ${field.index}. ${field.name}: "${field.value}"\n`;
                if (field.description && field.description !== 'Standard field') {
                    output += `     Description: ${field.description}\n`;
                }
            });
            output += `\n${'-'.repeat(40)}\n\n`;
        });

        if (result.errors && result.errors.length > 0) {
            output += `Errors:\n`;
            result.errors.forEach(error => {
                output += `  Line ${error.line}: ${error.message}\n`;
            });
        }

        if (result.metadata) {
            output += `\nMetadata:\n`;
            output += `  Parsed At: ${result.metadata.parsedAt}\n`;
            if (result.metadata.detectedFormat) {
                output += `  Detected Format: ${result.metadata.detectedFormat}\n`;
            }
        }

        return output;
    }

    clearAll() {
        document.getElementById('order-input').value = '';
        document.getElementById('format-selector').value = 'auto';
        document.querySelector('#result-table tbody').innerHTML = '';
        document.getElementById('json-output').textContent = '';
        document.getElementById('tree-container').innerHTML = '';
        this.currentResult = null;
        this.showWelcomeMessage();
    }

    showLoading() {
        const tableBody = document.querySelector('#result-table tbody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="loading-message">
                    <div class="spinner">⚡</div>
                    <div class="title">解析中...</div>
                    <div class="description">データを処理しています</div>
                </td>
            </tr>
        `;
    }

    showError(message) {
        const tableBody = document.querySelector('#result-table tbody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="error-message">
                    <div class="emoji">⚠️</div>
                    <div class="title">エラー</div>
                    <div class="description">${this.escapeHtml(message)}</div>
                </td>
            </tr>
        `;
    }

    showWarnings(errors) {
        if (errors.length > 0) {
            console.warn('Parse warnings:', errors);
            
            // Show a subtle warning indicator
            const warningIndicator = document.createElement('div');
            warningIndicator.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 1001;
                background: #FFF3CD; color: #856404; padding: 1rem; border-radius: 8px;
                border-left: 4px solid #FFC107; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                font-size: 0.9rem; max-width: 300px;
            `;
            warningIndicator.innerHTML = `
                <strong>⚠️ 警告</strong><br>
                ${errors.length}件の解析警告があります。詳細はコンソールをご確認ください。
            `;
            document.body.appendChild(warningIndicator);
            
            setTimeout(() => {
                if (document.body.contains(warningIndicator)) {
                    document.body.removeChild(warningIndicator);
                }
            }, 5000);
        }
    }

    escapeHtml(text) {
        if (typeof text !== 'string') {
            text = String(text);
        }
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new MedicalOrderEditor();
    } catch (error) {
        console.error('Failed to initialize Medical Order Editor:', error);
        // Fallback error display
        document.body.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #dc2626;">
                <h1>🚨 アプリケーションの初期化に失敗しました</h1>
                <p>ページを再読み込みしてください。問題が続く場合は、ブラウザのコンソールをご確認ください。</p>
                <button onclick="location.reload()" style="padding: 1rem 2rem; margin-top: 1rem; 
                        background: #2196F3; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    ページを再読み込み
                </button>
            </div>
        `;
    }
});
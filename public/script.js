class MedicalOrderEditor {
    constructor() {
        try {
            this.currentResult = null;
            this.parser = new MedicalFormatParser();
            this.init();
        } catch (error) {
            console.error('Constructor error:', error);
            throw error;
        }
    }

    init() {
        try {
            this.bindEvents();
            this.showWelcomeMessage();
        } catch (error) {
            console.error('Initialization error:', error);
            throw error;
        }
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
        const container = document.querySelector('#table-view');
        if (container) {
            container.innerHTML = `
                <div class="welcome-message">
                    <div class="emoji">👋</div>
                    <div class="title">検査オーダーフォーマットエディタへようこそ</div>
                    <div class="description">
                        ASTMまたはHL7フォーマットのデータを入力して「構文解析」ボタンを押してください<br>
                        テンプレートを使用して簡単に開始することもできます
                    </div>
                    <div class="shortcut">Ctrl + Enter</div>
                    <div style="font-size: 0.9rem; margin-top: 0.5rem;">で解析実行</div>
                </div>
            `;
        }
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
        const container = document.querySelector('#table-view');
        
        if (!displayData || displayData.length === 0) {
            container.innerHTML = `
                <div class="welcome-message">
                    <div class="emoji">📭</div>
                    <div class="title">解析結果がありません</div>
                    <div class="description">有効なASTMまたはHL7データを入力してください</div>
                </div>
            `;
            return;
        }

        // Group data by segments
        const segments = this.groupDataBySegment(displayData);
        
        container.innerHTML = `
            <div class="segments-container">
                ${segments.map((segment, index) => this.renderSegmentCard(segment, index)).join('')}
            </div>
            <div class="summary-stats">
                <div class="stat-item">
                    <span class="stat-number">${segments.length}</span>
                    <span class="stat-label">セグメント</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${displayData.length}</span>
                    <span class="stat-label">フィールド</span>
                </div>
            </div>
        `;

        // Add event listeners for collapse functionality
        this.addCollapseEventListeners();
    }

    groupDataBySegment(displayData) {
        const segmentMap = new Map();
        
        displayData.forEach(item => {
            const segmentKey = `${item.segment}-${item.lineNumber}`;
            if (!segmentMap.has(segmentKey)) {
                segmentMap.set(segmentKey, {
                    segment: item.segment,
                    lineNumber: item.lineNumber,
                    fields: []
                });
            }
            segmentMap.get(segmentKey).fields.push(item);
        });
        
        return Array.from(segmentMap.values()).sort((a, b) => a.lineNumber - b.lineNumber);
    }

    renderSegmentCard(segment, index) {
        const segmentId = `segment-${index}`;
        const isExpanded = index < 3; // 最初の3つのセグメントを展開状態で表示
        const collapseClass = isExpanded ? '' : 'collapsed';
        
        return `
            <div class="segment-card ${collapseClass}" data-segment-id="${segmentId}">
                <div class="segment-header" 
                     role="button" 
                     tabindex="0" 
                     aria-expanded="${isExpanded}"
                     title="クリックして${isExpanded ? '折りたたむ' : '展開する'}">
                    <div class="segment-info">
                        <div class="segment-title">
                            <span class="segment-icon">${this.getSegmentIcon(segment.segment)}</span>
                            <span class="segment-name">${this.escapeHtml(segment.segment)}</span>
                            <span class="segment-line">Line ${segment.lineNumber}</span>
                        </div>
                        <div class="segment-meta">
                            <span class="field-count">${segment.fields.length} フィールド</span>
                        </div>
                    </div>
                    <div class="collapse-icon" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                    </div>
                </div>
                <div class="segment-content ${isExpanded ? 'expanded' : ''}" 
                     aria-hidden="${!isExpanded}">
                    <div class="fields-grid">
                        ${segment.fields.map(field => this.renderFieldCard(field)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderFieldCard(field) {
        const hasDescription = field.description && 
                              field.description !== 'Standard field' && 
                              field.description !== 'Standard ASTM field' && 
                              field.description !== 'Standard HL7 field';
        
        return `
            <div class="field-card">
                <div class="field-header">
                    <div class="field-name">${this.escapeHtml(field.field)}</div>
                    ${field.index ? `<div class="field-index">#${field.index}</div>` : ''}
                </div>
                <div class="field-value">
                    <code class="field-code">${this.escapeHtml(field.value)}</code>
                </div>
                ${hasDescription ? `
                    <div class="field-description">
                        <span class="description-icon">💡</span>
                        ${this.escapeHtml(field.description)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    getSegmentIcon(segmentName) {
        const icons = {
            'H (Header)': '📋',
            'P (Patient Information)': '👤',
            'O (Test Order)': '🧪',
            'R (Result)': '📊',
            'L (Terminator)': '🔚',
            'MSH (Message Header)': '📨',
            'PID (Patient Identification)': '🆔',
            'ORC (Common Order)': '📝',
            'OBR (Observation Request)': '🔬',
            'OBX (Observation/Result)': '📈',
            'NTE (Notes and Comments)': '📝',
            'EVN (Event Type)': '⚡',
            'PV1 (Patient Visit)': '🏥'
        };
        
        // Check for exact matches first
        if (icons[segmentName]) return icons[segmentName];
        
        // Check for partial matches
        const segmentType = segmentName.split(' ')[0];
        const fallbackIcons = {
            'H': '📋', 'P': '👤', 'O': '🧪', 'R': '📊', 'L': '🔚',
            'MSH': '📨', 'PID': '🆔', 'ORC': '📝', 'OBR': '🔬', 
            'OBX': '📈', 'NTE': '📝', 'EVN': '⚡', 'PV1': '🏥'
        };
        
        return fallbackIcons[segmentType] || '📄';
    }

    addCollapseEventListeners() {
        // Remove existing event listeners to avoid duplicates
        const existingControls = document.querySelector('.table-controls');
        if (existingControls) {
            existingControls.remove();
        }

        // Add expand/collapse all buttons
        const tableView = document.querySelector('#table-view');
        if (tableView) {
            const controlsHtml = `
                <div class="table-controls">
                    <button class="control-btn" id="expand-all" type="button">
                        📂 すべて展開
                    </button>
                    <button class="control-btn" id="collapse-all" type="button">
                        📁 すべて折りたたむ
                    </button>
                </div>
            `;
            tableView.insertAdjacentHTML('afterbegin', controlsHtml);
            
            // Add event listeners with error handling
            try {
                const expandBtn = document.getElementById('expand-all');
                const collapseBtn = document.getElementById('collapse-all');
                
                if (expandBtn) {
                    expandBtn.addEventListener('click', () => {
                        document.querySelectorAll('.segment-card').forEach(card => {
                            card.classList.remove('collapsed');
                            const content = card.querySelector('.segment-content');
                            const header = card.querySelector('.segment-header');
                            
                            if (content) {
                                content.classList.add('expanded');
                            }
                            if (header) {
                                header.setAttribute('aria-expanded', 'true');
                            }
                        });
                    });
                }
                
                if (collapseBtn) {
                    collapseBtn.addEventListener('click', () => {
                        document.querySelectorAll('.segment-card').forEach(card => {
                            card.classList.add('collapsed');
                            const content = card.querySelector('.segment-content');
                            const header = card.querySelector('.segment-header');
                            
                            if (content) {
                                content.classList.remove('expanded');
                            }
                            if (header) {
                                header.setAttribute('aria-expanded', 'false');
                            }
                        });
                    });
                }
            } catch (error) {
                console.error('Error setting up control buttons:', error);
            }
        }

        // Set up segment headers with error handling
        try {
            document.querySelectorAll('.segment-header').forEach(header => {
                // Remove existing event listeners by cloning
                const newHeader = header.cloneNode(true);
                header.parentNode.replaceChild(newHeader, header);
                
                // Set up accessibility attributes
                newHeader.setAttribute('tabindex', '0');
                newHeader.setAttribute('role', 'button');
                newHeader.setAttribute('aria-expanded', !newHeader.parentElement.classList.contains('collapsed'));
                
                // Add event listeners
                newHeader.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.toggleSegment(newHeader);
                    }
                });
                
                newHeader.addEventListener('click', () => {
                    this.toggleSegment(newHeader);
                });
            });
        } catch (error) {
            console.error('Error setting up segment headers:', error);
        }
    }

    toggleSegment(header) {
        try {
            const card = header.parentElement;
            if (card) {
                const content = card.querySelector('.segment-content');
                const isCollapsed = card.classList.toggle('collapsed');
                
                if (content) {
                    if (isCollapsed) {
                        content.classList.remove('expanded');
                    } else {
                        content.classList.add('expanded');
                    }
                }
                
                header.setAttribute('aria-expanded', !isCollapsed);
            }
        } catch (error) {
            console.error('Error toggling segment:', error);
        }
    }

    displayJsonView(result) {
        const jsonOutput = document.getElementById('json-output');
        if (jsonOutput) {
            try {
                // Format JSON with 2-space indentation for better mobile readability
                const formattedJson = JSON.stringify(result, null, 2);
                jsonOutput.textContent = formattedJson;
                
                // Force word-wrapping styles for long strings
                jsonOutput.style.maxWidth = '100%';
                jsonOutput.style.width = '100%';
                jsonOutput.style.boxSizing = 'border-box';
                jsonOutput.style.overflowX = 'auto';
                jsonOutput.style.overflowY = 'auto';
                jsonOutput.style.whiteSpace = 'pre-wrap';
                jsonOutput.style.wordBreak = 'break-word';
                jsonOutput.style.wordWrap = 'break-word';
                jsonOutput.style.overflowWrap = 'break-word';
            } catch (error) {
                console.error('Error displaying JSON:', error);
                jsonOutput.textContent = 'JSON表示エラーが発生しました';
            }
        }
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
        try {
            document.getElementById('order-input').value = '';
            document.getElementById('format-selector').value = 'auto';
            
            // Clear all result containers
            const tableView = document.getElementById('table-view');
            if (tableView) {
                tableView.innerHTML = '';
            }
            
            const jsonOutput = document.getElementById('json-output');
            if (jsonOutput) {
                jsonOutput.textContent = '';
            }
            
            const treeContainer = document.getElementById('tree-container');
            if (treeContainer) {
                treeContainer.innerHTML = '';
            }
            
            this.currentResult = null;
            this.showWelcomeMessage();
        } catch (error) {
            console.error('Error clearing data:', error);
        }
    }

    showLoading() {
        const container = document.querySelector('#table-view');
        if (container) {
            container.innerHTML = `
                <div class="loading-message">
                    <div class="spinner">⚡</div>
                    <div class="title">解析中...</div>
                    <div class="description">データを処理しています</div>
                </div>
            `;
        }
    }

    showError(message) {
        const container = document.querySelector('#table-view');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <div class="emoji">⚠️</div>
                    <div class="title">エラー</div>
                    <div class="description">${this.escapeHtml(message)}</div>
                </div>
            `;
        }
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
        // Check if required elements exist
        const requiredElements = [
            'parse-btn', 'clear-btn', 'load-template', 
            'export-json', 'export-text', 'order-input', 
            'format-selector', 'table-view', 'json-output', 'tree-view'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            throw new Error(`Required elements missing: ${missingElements.join(', ')}`);
        }

        // Check if MedicalFormatParser is available
        if (typeof MedicalFormatParser === 'undefined') {
            throw new Error('MedicalFormatParser is not loaded. Please check parsers.js file.');
        }

        // Check if TEMPLATE_DATA is available
        if (typeof TEMPLATE_DATA === 'undefined') {
            throw new Error('TEMPLATE_DATA is not loaded. Please check parsers.js file.');
        }

        // Initialize the application
        const app = new MedicalOrderEditor();
        
        // Global error handler for unhandled errors
        window.addEventListener('error', (event) => {
            console.error('Runtime error:', event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
        });
        
        console.log('Medical Order Editor initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize Medical Order Editor:', error);
        
        // More detailed error message
        const errorDetails = error.stack || error.message || 'Unknown error';
        
        // Fallback error display
        document.body.innerHTML = `
            <div style="max-width: 800px; margin: 2rem auto; padding: 2rem; text-align: center; 
                        color: #dc2626; background: #fef2f2; border: 2px solid #fecaca; 
                        border-radius: 12px; font-family: system-ui;">
                <h1 style="font-size: 2rem; margin-bottom: 1rem;">🚨 アプリケーションの初期化に失敗しました</h1>
                
                <div style="margin: 1.5rem 0; padding: 1rem; background: white; border-radius: 8px; 
                           text-align: left; font-family: monospace; font-size: 0.9rem; 
                           border: 1px solid #e5e7eb; max-height: 200px; overflow-y: auto;">
                    <strong>エラー詳細:</strong><br>
                    ${errorDetails.replace(/\n/g, '<br>')}
                </div>
                
                <p style="margin: 1rem 0; color: #6b7280;">
                    以下の手順をお試しください：<br>
                    1. ページを再読み込みしてください<br>
                    2. ブラウザのキャッシュをクリアしてください<br>
                    3. 問題が続く場合は、ブラウザの開発者ツール（F12）でコンソールをご確認ください
                </p>
                
                <button onclick="location.reload()" 
                        style="padding: 1rem 2rem; margin: 1rem; background: #2196F3; 
                               color: white; border: none; border-radius: 8px; cursor: pointer; 
                               font-size: 1rem; font-weight: 600;">
                    ページを再読み込み
                </button>
                
                <button onclick="window.location.href = window.location.href.split('?')[0]" 
                        style="padding: 1rem 2rem; margin: 1rem; background: #6b7280; 
                               color: white; border: none; border-radius: 8px; cursor: pointer; 
                               font-size: 1rem; font-weight: 600;">
                    キャッシュをクリアして再読み込み
                </button>
            </div>
        `;
    }
});
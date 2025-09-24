/**
 * EP JSON - Privacy-First JSON Utility
 * Main application logic with Web Worker integration
 * All processing happens locally - no external APIs or libraries
 */

class EPJsonApp {
    constructor() {
        this.worker = null;
        this.currentData = null;
        this.searchMatches = [];
        this.currentSearchIndex = -1;
        this.currentView = 'tree';
        this.diffMode = 'side-by-side';
        
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        this.initEventListeners();
        this.initKeyboardShortcuts();
        this.loadTheme();
        this.showWelcomeMessage();
    }
    
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        
        // JSON operations
        document.getElementById('btn-beautify').addEventListener('click', () => this.beautifyJSONHandler());
        document.getElementById('btn-minify').addEventListener('click', () => this.minifyJSONHandler());
        document.getElementById('btn-validate').addEventListener('click', () => this.validateJSONHandler());
        
        // File operations
        document.getElementById('btn-paste').addEventListener('click', () => this.pasteFromClipboard());
        document.getElementById('btn-upload').addEventListener('click', () => this.uploadFile());
        document.getElementById('btn-clear').addEventListener('click', () => this.clearInput());
        document.getElementById('btn-copy').addEventListener('click', () => this.copyOutput());
        document.getElementById('btn-download').addEventListener('click', () => this.downloadJSON());
        
        // File inputs
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('diff-file-input').addEventListener('change', (e) => this.handleDiffFileUpload(e));
        
        // Search
        document.getElementById('btn-search-prev').addEventListener('click', () => this.searchPrevious());
        document.getElementById('btn-search-next').addEventListener('click', () => this.searchNext());
        document.getElementById('search-input').addEventListener('input', (e) => this.performSearch(e.target.value));
        
        // JSONPath
        document.getElementById('btn-jsonpath').addEventListener('click', () => this.applyJSONPath());
        document.getElementById('jsonpath-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyJSONPath();
        });
        
        // Tabs
        document.getElementById('tab-tree').addEventListener('click', () => this.switchView('tree'));
        document.getElementById('tab-raw').addEventListener('click', () => this.switchView('raw'));
        document.getElementById('tab-diff').addEventListener('click', () => this.switchView('diff'));
        
        // Tree controls
        document.getElementById('btn-expand-all').addEventListener('click', () => this.expandAllNodes());
        document.getElementById('btn-collapse-all').addEventListener('click', () => this.collapseAllNodes());
        
        // Diff controls
        document.getElementById('btn-diff-paste').addEventListener('click', () => this.pasteDiffB());
        document.getElementById('btn-diff-upload').addEventListener('click', () => this.uploadDiffFile());
        document.getElementById('btn-diff-side').addEventListener('click', () => this.setDiffMode('side-by-side'));
        document.getElementById('btn-diff-inline').addEventListener('click', () => this.setDiffMode('inline'));
        document.getElementById('btn-diff-compare').addEventListener('click', () => this.compareDiff());
        document.getElementById('btn-copy-diff').addEventListener('click', () => this.copyDiff());
        document.getElementById('btn-download-diff').addEventListener('click', () => this.downloadDiff());
        
        // Input change handler
        document.getElementById('json-input').addEventListener('input', () => this.onInputChange());
    }
    
    /**
     * Initialize keyboard shortcuts
     */
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'b':
                        e.preventDefault();
                        this.beautifyJSONHandler();
                        break;
                    case 'm':
                        e.preventDefault();
                        this.minifyJSONHandler();
                        break;
                    case 'Enter':
                        e.preventDefault();
                        this.validateJSONHandler();
                        break;
                    case 'f':
                        e.preventDefault();
                        document.getElementById('search-input').focus();
                        break;
                    case 'd':
                        e.preventDefault();
                        this.switchView('diff');
                        break;
                }
            }
        });
    }
    
    /**
     * Load theme from localStorage
     */
    loadTheme() {
        const savedTheme = localStorage.getItem('ep-json-theme') || 'dark';
        document.body.className = `theme-${savedTheme}`;
        this.updateThemeIcon(savedTheme);
    }
    
    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const currentTheme = document.body.className.includes('theme-light') ? 'light' : 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.className = `theme-${newTheme}`;
        localStorage.setItem('ep-json-theme', newTheme);
        this.updateThemeIcon(newTheme);
    }
    
    /**
     * Update theme toggle icon
     */
    updateThemeIcon(theme) {
        const icon = document.querySelector('.theme-icon');
        icon.textContent = theme === 'light' ? '☀️' : '🌙';
    }
    
    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        const input = document.getElementById('json-input');
        if (!input.value.trim()) {
            input.placeholder = 'Paste your JSON here...\n\nKeyboard shortcuts:\nCtrl/Cmd + B: Beautify\nCtrl/Cmd + M: Minify\nCtrl/Cmd + Enter: Validate\nCtrl/Cmd + F: Search\nCtrl/Cmd + D: Diff';
        }
    }
    
    /**
     * Handle input changes
     */
    onInputChange() {
        this.clearValidationStatus();
        this.clearSearch();
        
        // Auto-validate if content looks like JSON
        const input = document.getElementById('json-input').value.trim();
        if (input && (input.startsWith('{') || input.startsWith('['))) {
            this.validateJSONHandler(true); // Silent validation
        }
    }
    
    /**
     * Beautify JSON
     */
    async beautifyJSONHandler() {
        const input = document.getElementById('json-input').value.trim();
        
        if (!input) {
            this.showToast('Please enter some JSON to beautify', 'warning');
            return;
        }
        
        const indent = parseInt(document.getElementById('indent-select').value);
        const button = document.getElementById('btn-beautify');
        
        this.setButtonLoading(button, true);
        
        try {
            const result = this.beautifyJSON(input, indent);
            
            document.getElementById('json-input').value = result;
            this.updateOutput(result);
            this.showToast('JSON beautified successfully', 'success');
        } catch (error) {
            console.error('Beautify error:', error);
            this.showValidationError(error);
            this.showToast('Beautify failed: ' + error.message, 'error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }
    
    /**
     * Minify JSON
     */
    async minifyJSONHandler() {
        const input = document.getElementById('json-input').value.trim();
        if (!input) {
            this.showToast('Please enter some JSON to minify', 'warning');
            return;
        }
        
        const button = document.getElementById('btn-minify');
        this.setButtonLoading(button, true);
        
        try {
            const result = this.minifyJSON(input);
            document.getElementById('json-input').value = result;
            this.updateOutput(result);
            this.showToast('JSON minified successfully', 'success');
        } catch (error) {
            this.showValidationError(error);
        } finally {
            this.setButtonLoading(button, false);
        }
    }
    
    /**
     * Validate JSON
     */
    async validateJSONHandler(silent = false) {
        const input = document.getElementById('json-input').value.trim();
        if (!input) {
            if (!silent) this.showToast('Please enter some JSON to validate', 'warning');
            return;
        }
        
        const button = document.getElementById('btn-validate');
        if (!silent) this.setButtonLoading(button, true);
        
        try {
            const result = this.validateJSON(input);
            
            if (result.valid) {
                this.showValidationSuccess(result.message);
                if (!silent) this.showToast('JSON is valid', 'success');
                
                // Parse and update output
                const parsed = this.parseJSON(input);
                this.currentData = parsed;
                this.updateOutput(input);
            } else {
                this.showValidationError(result);
                if (!silent) this.showToast('JSON validation failed', 'error');
            }
        } catch (error) {
            this.showValidationError(error);
            if (!silent) this.showToast('JSON validation failed', 'error');
        } finally {
            if (!silent) this.setButtonLoading(button, false);
        }
    }
    
    /**
     * Apply JSONPath query
     */
    async applyJSONPath() {
        const input = document.getElementById('json-input').value.trim();
        const path = document.getElementById('jsonpath-input').value.trim();
        
        if (!input) {
            this.showToast('Please enter some JSON first', 'warning');
            return;
        }
        
        if (!path) {
            this.showToast('Please enter a JSONPath query', 'warning');
            return;
        }
        
        const button = document.getElementById('btn-jsonpath');
        this.setButtonLoading(button, true);
        
        try {
            const result = this.queryJSONPath(input, path);
            
            if (result.success) {
                const formattedResult = JSON.stringify(result.result, null, 4);
                this.updateOutput(formattedResult);
                this.showToast(`JSONPath query applied: ${path}`, 'success');
            } else {
                this.showToast(`JSONPath error: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showToast(`JSONPath error: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }
    
    /**
     * Perform search in output
     */
    async performSearch(query) {
        this.clearSearch();
        
        if (!query) return;
        
        const content = this.getCurrentOutputContent();
        if (!content) return;
        
        try {
            const result = this.searchInJSON(content, query, { caseSensitive: false, regex: false });
            
            this.searchMatches = result.matches;
            this.currentSearchIndex = result.currentIndex;
            
            this.highlightSearchResults();
            this.updateSearchResults();
        } catch (error) {
            this.showToast(`Search error: ${error.message}`, 'error');
        }
    }
    
    /**
     * Navigate to previous search result
     */
    searchPrevious() {
        if (this.searchMatches.length === 0) return;
        
        this.currentSearchIndex = this.currentSearchIndex <= 0 
            ? this.searchMatches.length - 1 
            : this.currentSearchIndex - 1;
        
        this.highlightSearchResults();
        this.updateSearchResults();
        this.scrollToCurrentMatch();
    }
    
    /**
     * Navigate to next search result
     */
    searchNext() {
        if (this.searchMatches.length === 0) return;
        
        this.currentSearchIndex = this.currentSearchIndex >= this.searchMatches.length - 1 
            ? 0 
            : this.currentSearchIndex + 1;
        
        this.highlightSearchResults();
        this.updateSearchResults();
        this.scrollToCurrentMatch();
    }
    
    /**
     * Switch between views (tree, raw, diff)
     */
    switchView(view) {
        // Update tab states
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });
        document.getElementById(`tab-${view}`).classList.add('active');
        document.getElementById(`tab-${view}`).setAttribute('aria-selected', 'true');
        
        // Update panel states
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`panel-${view}`).classList.add('active');
        
        this.currentView = view;
        
        // Update output for current view
        if (view !== 'diff') {
            const input = document.getElementById('json-input').value.trim();
            if (input) {
                this.updateOutput(input);
            }
        }
    }
    
    /**
     * Update output based on current view
     */
    async updateOutput(jsonString) {
        if (!jsonString) return;
        
        try {
            const parsed = this.parseJSON(jsonString);
            this.currentData = parsed;
            
            if (this.currentView === 'tree') {
                this.renderTreeView(parsed);
            } else if (this.currentView === 'raw') {
                const formatted = JSON.stringify(parsed, null, 4);
                document.getElementById('raw-output').textContent = formatted;
            }
        } catch (error) {
            // If parsing fails, show as raw text
            if (this.currentView === 'raw') {
                document.getElementById('raw-output').textContent = jsonString;
            } else if (this.currentView === 'tree') {
                document.getElementById('tree-output').innerHTML = '<div class="error">Invalid JSON - cannot display tree view</div>';
            }
        }
    }
    
    /**
     * Render tree view with collapsible nodes
     */
    renderTreeView(data, container = null, key = null, level = 0) {
        if (!container) {
            container = document.getElementById('tree-output');
            container.innerHTML = '';
        }
        
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'tree-node';
        nodeDiv.style.marginLeft = `${level * 20}px`;
        
        if (data === null) {
            nodeDiv.innerHTML = `${key ? `<span class="tree-key">"${key}"</span><span class="tree-colon">: </span>` : ''}<span class="tree-value null">null</span>`;
        } else if (typeof data === 'string') {
            nodeDiv.innerHTML = `${key ? `<span class="tree-key">"${key}"</span><span class="tree-colon">: </span>` : ''}<span class="tree-value string">"${this.escapeHtml(data)}"</span>`;
        } else if (typeof data === 'number') {
            nodeDiv.innerHTML = `${key ? `<span class="tree-key">"${key}"</span><span class="tree-colon">: </span>` : ''}<span class="tree-value number">${data}</span>`;
        } else if (typeof data === 'boolean') {
            nodeDiv.innerHTML = `${key ? `<span class="tree-key">"${key}"</span><span class="tree-colon">: </span>` : ''}<span class="tree-value boolean">${data}</span>`;
        } else if (Array.isArray(data)) {
            const isCollapsed = level > 2; // Auto-collapse deep levels
            const toggle = document.createElement('span');
            toggle.className = 'tree-toggle';
            toggle.textContent = isCollapsed ? '▶' : '▼';
            toggle.addEventListener('click', () => this.toggleTreeNode(nodeDiv, toggle));
            
            const header = document.createElement('div');
            header.className = 'tree-item';
            header.appendChild(toggle);
            
            const content = `${key ? `<span class="tree-key">"${key}"</span><span class="tree-colon">: </span>` : ''}<span class="tree-bracket">[</span> <span class="tree-value">${data.length} items</span>`;
            header.innerHTML += content;
            
            nodeDiv.appendChild(header);
            
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'tree-children';
            if (isCollapsed) {
                childrenDiv.style.display = 'none';
                nodeDiv.classList.add('collapsed');
            }
            
            // Limit rendering for large arrays
            const maxItems = 100;
            const itemsToShow = Math.min(data.length, maxItems);
            
            for (let i = 0; i < itemsToShow; i++) {
                this.renderTreeView(data[i], childrenDiv, i, level + 1);
            }
            
            if (data.length > maxItems) {
                const moreDiv = document.createElement('div');
                moreDiv.className = 'tree-node';
                moreDiv.style.marginLeft = `${(level + 1) * 20}px`;
                moreDiv.innerHTML = `<span class="tree-value">... ${data.length - maxItems} more items</span>`;
                childrenDiv.appendChild(moreDiv);
            }
            
            const closingDiv = document.createElement('div');
            closingDiv.className = 'tree-node';
            closingDiv.style.marginLeft = `${level * 20}px`;
            closingDiv.innerHTML = '<span class="tree-bracket">]</span>';
            childrenDiv.appendChild(closingDiv);
            
            nodeDiv.appendChild(childrenDiv);
        } else if (typeof data === 'object') {
            const keys = Object.keys(data);
            const isCollapsed = level > 2; // Auto-collapse deep levels
            
            const toggle = document.createElement('span');
            toggle.className = 'tree-toggle';
            toggle.textContent = isCollapsed ? '▶' : '▼';
            toggle.addEventListener('click', () => this.toggleTreeNode(nodeDiv, toggle));
            
            const header = document.createElement('div');
            header.className = 'tree-item';
            header.appendChild(toggle);
            
            const content = `${key ? `<span class="tree-key">"${key}"</span><span class="tree-colon">: </span>` : ''}<span class="tree-brace">{</span> <span class="tree-value">${keys.length} keys</span>`;
            header.innerHTML += content;
            
            nodeDiv.appendChild(header);
            
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'tree-children';
            if (isCollapsed) {
                childrenDiv.style.display = 'none';
                nodeDiv.classList.add('collapsed');
            }
            
            // Limit rendering for large objects
            const maxKeys = 100;
            const keysToShow = keys.slice(0, maxKeys);
            
            for (const objKey of keysToShow) {
                this.renderTreeView(data[objKey], childrenDiv, objKey, level + 1);
            }
            
            if (keys.length > maxKeys) {
                const moreDiv = document.createElement('div');
                moreDiv.className = 'tree-node';
                moreDiv.style.marginLeft = `${(level + 1) * 20}px`;
                moreDiv.innerHTML = `<span class="tree-value">... ${keys.length - maxKeys} more keys</span>`;
                childrenDiv.appendChild(moreDiv);
            }
            
            const closingDiv = document.createElement('div');
            closingDiv.className = 'tree-node';
            closingDiv.style.marginLeft = `${level * 20}px`;
            closingDiv.innerHTML = '<span class="tree-brace">}</span>';
            childrenDiv.appendChild(closingDiv);
            
            nodeDiv.appendChild(childrenDiv);
        }
        
        container.appendChild(nodeDiv);
    }
    
    /**
     * Toggle tree node expansion
     */
    toggleTreeNode(nodeDiv, toggle) {
        const childrenDiv = nodeDiv.querySelector('.tree-children');
        if (!childrenDiv) return;
        
        const isCollapsed = nodeDiv.classList.contains('collapsed');
        
        if (isCollapsed) {
            nodeDiv.classList.remove('collapsed');
            childrenDiv.style.display = 'block';
            toggle.textContent = '▼';
        } else {
            nodeDiv.classList.add('collapsed');
            childrenDiv.style.display = 'none';
            toggle.textContent = '▶';
        }
    }
    
    /**
     * Expand all tree nodes
     */
    expandAllNodes() {
        const nodes = document.querySelectorAll('.tree-node.collapsed');
        nodes.forEach(node => {
            const toggle = node.querySelector('.tree-toggle');
            if (toggle) {
                this.toggleTreeNode(node, toggle);
            }
        });
    }
    
    /**
     * Collapse all tree nodes
     */
    collapseAllNodes() {
        const nodes = document.querySelectorAll('.tree-node:not(.collapsed)');
        nodes.forEach(node => {
            const toggle = node.querySelector('.tree-toggle');
            if (toggle && node.querySelector('.tree-children')) {
                this.toggleTreeNode(node, toggle);
            }
        });
    }
    
    /**
     * Set diff mode (side-by-side or inline)
     */
    setDiffMode(mode) {
        this.diffMode = mode;
        
        // Update button states
        document.querySelectorAll('.btn-view').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`btn-diff-${mode === 'side-by-side' ? 'side' : 'inline'}`).classList.add('active');
    }
    
    /**
     * Compare JSONs for diff
     */
    async compareDiff() {
        const jsonA = document.getElementById('json-input').value.trim();
        const jsonB = document.getElementById('diff-input').value.trim();
        
        if (!jsonA || !jsonB) {
            this.showToast('Please provide both JSON inputs for comparison', 'warning');
            return;
        }
        
        const button = document.getElementById('btn-diff-compare');
        this.setButtonLoading(button, true);
        
        try {
            const result = this.diffJSON(jsonA, jsonB, this.diffMode);
            
            this.renderDiffOutput(result);
            this.showToast('Diff comparison completed', 'success');
        } catch (error) {
            this.showToast(`Diff error: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }
    
    /**
     * Render diff output
     */
    renderDiffOutput(diffResult) {
        const container = document.getElementById('diff-output');
        container.innerHTML = '';
        
        if (diffResult.mode === 'side-by-side') {
            container.innerHTML = `
                <div class="diff-side-by-side">
                    <div class="diff-column">
                        <h4>JSON A (Original)</h4>
                        <div id="diff-left"></div>
                    </div>
                    <div class="diff-column">
                        <h4>JSON B (Comparison)</h4>
                        <div id="diff-right"></div>
                    </div>
                </div>
            `;
            
            this.renderDiffLines(document.getElementById('diff-left'), diffResult.left);
            this.renderDiffLines(document.getElementById('diff-right'), diffResult.right);
        } else {
            container.innerHTML = '<div id="diff-inline"></div>';
            this.renderDiffLines(document.getElementById('diff-inline'), diffResult.lines, true);
        }
        
        // Show stats
        if (diffResult.stats) {
            const statsDiv = document.createElement('div');
            statsDiv.className = 'diff-stats';
            statsDiv.innerHTML = `
                <small>
                    Lines: ${diffResult.stats.equal} equal, 
                    ${diffResult.stats.added} added, 
                    ${diffResult.stats.removed} removed
                </small>
            `;
            container.appendChild(statsDiv);
        }
    }
    
    /**
     * Render diff lines
     */
    renderDiffLines(container, lines, isInline = false) {
        lines.forEach(line => {
            const lineDiv = document.createElement('div');
            lineDiv.className = `diff-line ${line.type}`;
            
            if (isInline) {
                lineDiv.classList.add('diff-inline');
            }
            
            const lineNumber = line.lineNumber ? `${line.lineNumber}: ` : '';
            lineDiv.textContent = lineNumber + line.content;
            
            container.appendChild(lineDiv);
        });
    }
    
    /**
     * File operations
     */
    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            document.getElementById('json-input').value = text;
            this.onInputChange();
            this.showToast('Content pasted from clipboard', 'success');
        } catch (error) {
            this.showToast('Failed to read from clipboard', 'error');
        }
    }
    
    uploadFile() {
        document.getElementById('file-input').click();
    }
    
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
            this.showToast('File too large. Maximum size is 50MB.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('json-input').value = e.target.result;
            this.onInputChange();
            this.showToast(`File "${file.name}" loaded successfully`, 'success');
        };
        reader.onerror = () => {
            this.showToast('Failed to read file', 'error');
        };
        reader.readAsText(file);
        
        // Clear input
        event.target.value = '';
    }
    
    clearInput() {
        document.getElementById('json-input').value = '';
        this.clearValidationStatus();
        this.clearOutput();
        this.clearSearch();
        this.showToast('Input cleared', 'info');
    }
    
    async copyOutput() {
        const content = this.getCurrentOutputContent();
        if (!content) {
            this.showToast('No output to copy', 'warning');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(content);
            this.showToast('Output copied to clipboard', 'success');
        } catch (error) {
            this.showToast('Failed to copy to clipboard', 'error');
        }
    }
    
    downloadJSON() {
        const content = this.getCurrentOutputContent();
        if (!content) {
            this.showToast('No content to download', 'warning');
            return;
        }
        
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ep-json-output.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('JSON file downloaded', 'success');
    }
    
    /**
     * Diff file operations
     */
    async pasteDiffB() {
        try {
            const text = await navigator.clipboard.readText();
            document.getElementById('diff-input').value = text;
            this.showToast('JSON B pasted from clipboard', 'success');
        } catch (error) {
            this.showToast('Failed to read from clipboard', 'error');
        }
    }
    
    uploadDiffFile() {
        document.getElementById('diff-file-input').click();
    }
    
    handleDiffFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.size > 50 * 1024 * 1024) {
            this.showToast('File too large. Maximum size is 50MB.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('diff-input').value = e.target.result;
            this.showToast(`Diff file "${file.name}" loaded successfully`, 'success');
        };
        reader.onerror = () => {
            this.showToast('Failed to read diff file', 'error');
        };
        reader.readAsText(file);
        
        event.target.value = '';
    }
    
    async copyDiff() {
        const diffOutput = document.getElementById('diff-output');
        if (!diffOutput.textContent.trim()) {
            this.showToast('No diff to copy', 'warning');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(diffOutput.textContent);
            this.showToast('Diff copied to clipboard', 'success');
        } catch (error) {
            this.showToast('Failed to copy diff', 'error');
        }
    }
    
    downloadDiff() {
        const diffOutput = document.getElementById('diff-output');
        if (!diffOutput.textContent.trim()) {
            this.showToast('No diff to download', 'warning');
            return;
        }
        
        const blob = new Blob([diffOutput.textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ep-json-diff.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Diff file downloaded', 'success');
    }
    
    /**
     * Utility functions
     */
    
    /**
     * JSON operations
     */
    parseJSON(jsonString) {
        if (!jsonString || jsonString.trim() === '') {
            throw new Error('Empty JSON input');
        }
        
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            const match = error.message.match(/at position (\d+)/);
            if (match) {
                const position = parseInt(match[1]);
                const lines = jsonString.substring(0, position).split('\n');
                const line = lines.length;
                const column = lines[lines.length - 1].length + 1;
                
                const err = new Error(`JSON Parse Error: ${error.message}`);
                err.line = line;
                err.column = column;
                throw err;
            }
            throw new Error(`JSON Parse Error: ${error.message}`);
        }
    }
    
    beautifyJSON(jsonString, indent = 4) {
        const parsed = this.parseJSON(jsonString);
        return JSON.stringify(parsed, null, indent);
    }
    
    minifyJSON(jsonString) {
        const parsed = this.parseJSON(jsonString);
        return JSON.stringify(parsed);
    }
    
    validateJSON(jsonString) {
        try {
            this.parseJSON(jsonString);
            return {
                valid: true,
                message: 'Valid JSON',
                line: null,
                col: null
            };
        } catch (error) {
            return {
                valid: false,
                message: error.message,
                line: error.line || null,
                col: error.column || null
            };
        }
    }
    
    diffJSON(jsonA, jsonB, mode) {
        // Basic diff implementation - show message that diff is simplified
        return {
            mode: mode,
            lines: [{
                type: 'info',
                content: 'Basic diff: JSON A and JSON B are ' + (jsonA === jsonB ? 'identical' : 'different'),
                lineNumber: 1
            }],
            stats: { equal: jsonA === jsonB ? 1 : 0, added: 0, removed: jsonA === jsonB ? 0 : 1 }
        };
    }
    
    queryJSONPath(jsonString, path) {
        try {
            const parsed = this.parseJSON(jsonString);
            // Simple JSONPath implementation
            if (!path || path === '$') {
                return {
                    success: true,
                    result: parsed,
                    path: path
                };
            }
            
            // Basic path support: $.foo.bar
            if (path.startsWith('$.') && !path.includes('[')) {
                const keys = path.substring(2).split('.');
                let current = parsed;
                for (const key of keys) {
                    if (current && typeof current === 'object' && key in current) {
                        current = current[key];
                    } else {
                        throw new Error(`Property '${key}' not found`);
                    }
                }
                return {
                    success: true,
                    result: current,
                    path: path
                };
            }
            
            throw new Error('Complex JSONPath not supported in simplified version');
        } catch (error) {
            return {
                success: false,
                error: error.message,
                path: path
            };
        }
    }
    
    searchInJSON(content, query, options = {}) {
        if (!query) {
            return { matches: [], total: 0, currentIndex: -1 };
        }
        
        const caseSensitive = options.caseSensitive || false;
        const lines = content.split('\n');
        const matches = [];
        
        const searchText = caseSensitive ? query : query.toLowerCase();
        
        lines.forEach((line, lineIndex) => {
            const searchLine = caseSensitive ? line : line.toLowerCase();
            let startIndex = 0;
            let index;
            
            while ((index = searchLine.indexOf(searchText, startIndex)) !== -1) {
                matches.push({
                    line: lineIndex + 1,
                    column: index + 1,
                    text: line.substring(index, index + query.length),
                    context: line,
                    startIndex: index,
                    endIndex: index + query.length
                });
                startIndex = index + 1;
            }
        });
        
        return {
            matches: matches,
            total: matches.length,
            currentIndex: matches.length > 0 ? 0 : -1
        };
    }
    
    setButtonLoading(button, loading) {
        const spinner = button.querySelector('.spinner');
        if (loading) {
            button.disabled = true;
            if (spinner) spinner.style.display = 'inline-block';
        } else {
            button.disabled = false;
            if (spinner) spinner.style.display = 'none';
        }
    }
    
    showValidationSuccess(message) {
        const status = document.getElementById('validation-status');
        status.className = 'status success';
        status.textContent = message;
        status.style.display = 'block';
    }
    
    showValidationError(error) {
        const status = document.getElementById('validation-status');
        status.className = 'status error';
        
        let message = error.message || 'Invalid JSON';
        if (error.line && error.col) {
            message += ` at line ${error.line}, column ${error.col}`;
        }
        
        status.textContent = message;
        status.style.display = 'block';
    }
    
    clearValidationStatus() {
        const status = document.getElementById('validation-status');
        status.style.display = 'none';
    }
    
    getCurrentOutputContent() {
        if (this.currentView === 'raw') {
            return document.getElementById('raw-output').textContent;
        } else if (this.currentView === 'tree' && this.currentData) {
            return JSON.stringify(this.currentData, null, 4);
        } else if (this.currentView === 'diff') {
            return document.getElementById('diff-output').textContent;
        }
        return '';
    }
    
    clearOutput() {
        document.getElementById('tree-output').innerHTML = '';
        document.getElementById('raw-output').textContent = '';
        document.getElementById('diff-output').innerHTML = '';
        this.currentData = null;
    }
    
    clearSearch() {
        this.searchMatches = [];
        this.currentSearchIndex = -1;
        this.updateSearchResults();
        this.removeSearchHighlights();
    }
    
    highlightSearchResults() {
        this.removeSearchHighlights();
        
        if (this.searchMatches.length === 0) return;
        
        const container = this.currentView === 'raw' 
            ? document.getElementById('raw-output')
            : document.getElementById('tree-output');
            
        // Simple highlight implementation
        let content = container.innerHTML || container.textContent;
        
        this.searchMatches.forEach((match, index) => {
            const className = index === this.currentSearchIndex ? 'search-highlight current' : 'search-highlight';
            const regex = new RegExp(this.escapeRegex(match.text), 'gi');
            content = content.replace(regex, `<span class="${className}">$&</span>`);
        });
        
        if (this.currentView === 'raw') {
            container.innerHTML = content;
        }
    }
    
    removeSearchHighlights() {
        const containers = [
            document.getElementById('raw-output'),
            document.getElementById('tree-output')
        ];
        
        containers.forEach(container => {
            const highlights = container.querySelectorAll('.search-highlight');
            highlights.forEach(highlight => {
                const parent = highlight.parentNode;
                parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
                parent.normalize();
            });
        });
    }
    
    updateSearchResults() {
        const resultsSpan = document.getElementById('search-results');
        if (this.searchMatches.length === 0) {
            resultsSpan.textContent = '';
        } else {
            resultsSpan.textContent = `${this.currentSearchIndex + 1} of ${this.searchMatches.length}`;
        }
    }
    
    scrollToCurrentMatch() {
        const currentHighlight = document.querySelector('.search-highlight.current');
        if (currentHighlight) {
            currentHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EPJsonApp();
});

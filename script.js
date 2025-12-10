document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTI ---
    const textArea = document.getElementById('textArea');
    const statsElem = document.getElementById('stats');
    const pageTitleElem = document.getElementById('pageTitle');
    const toastElem = document.getElementById('toast');
    
    // UI
    const menuBtn = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const overlay = document.getElementById('modalOverlay');
    
    // Pulsanti Menu
    const openRenameBtn = document.getElementById('openRenameModal');
    const openFindReplaceBtn = document.getElementById('openFindReplace');
    const toggleDarkBtn = document.getElementById('toggleDark');
    const saveDraftBtn = document.getElementById('saveDraft');
    const openDeleteBtn = document.getElementById('openDeleteModal');
    const downloadTxtBtn = document.getElementById('downloadTxt');
    const downloadPdfBtn = document.getElementById('downloadPdf');
    const openEmailBtn = document.getElementById('openEmailPopover');
    const guideBtn = document.getElementById('guideBtn');
    
    // Modali
    const renameModal = document.getElementById('renameModal');
    const deleteModal = document.getElementById('deleteModal');
    const findReplaceModal = document.getElementById('findReplaceModal');
    const emailPopover = document.getElementById('emailPopover');
    const guideModal = document.getElementById('guideModal');
    
    // Rename Modal
    const renameInput = document.getElementById('renameInput');
    const confirmRename = document.getElementById('confirmRename');
    const cancelRename = document.getElementById('cancelRename');
    
    // Delete Modal
    const confirmDelete = document.getElementById('confirmDelete');
    const cancelDelete = document.getElementById('cancelDelete');
    
    // Find & Replace Modal
    const closeFindReplaceBtn = document.getElementById('closeFindReplace');
    const findInput = document.getElementById('findInput');
    const replaceInput = document.getElementById('replaceInput');
    const caseSensitiveCheck = document.getElementById('caseSensitive');
    const findResults = document.getElementById('findResults');
    const findPrevBtn = document.getElementById('findPrevBtn');
    const findNextBtn = document.getElementById('findNextBtn');
    const replaceBtn = document.getElementById('replaceBtn');
    const replaceAllBtn = document.getElementById('replaceAllBtn');
    
    // Email Modal
    const emailForm = document.getElementById('emailForm');
    const recipientInput = document.getElementById('recipient');
    const subjectInput = document.getElementById('subject');
    const closeEmailBtn = document.getElementById('closeEmailPopover');
    const copyTextBtn = document.getElementById('copyTextBtn');
    
    // Guide Modal
    const closeGuideBtn = document.querySelector('.close-guide');

    // State
    let titleSet = false;
    let currentMatchIndex = -1;
    let matches = [];

    // --- SETUP INIZIALE ---
    if (localStorage.getItem('dark-mode') === 'true') {
        document.body.classList.add('dark-mode');
        toggleDarkBtn.textContent = 'Toggle Light Mode';
    }

    const savedDraft = localStorage.getItem('draft');
    if (savedDraft) {
        textArea.value = savedDraft;
    }
    
    const savedTitle = localStorage.getItem('pageTitle');
    if (savedTitle) {
        pageTitleElem.innerText = savedTitle;
        document.title = savedTitle;
        titleSet = true;
    }

    // --- FUNZIONI UTILITY ---
    
    // Toast
    function showToast(msg) {
        toastElem.innerText = msg;
        toastElem.classList.add('show');
        setTimeout(() => toastElem.classList.remove('show'), 2000);
    }

    // Debounce
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // --- LOGICA CONTEGGIO ---
    function updateStatsUI() {
        const fullText = textArea.value;
        const words = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;
        const chars = fullText.replace(/\s/g, '').length;
        statsElem.textContent = `${words} words - ${chars} characters`;
        textArea.style.overflowY = (textArea.scrollHeight > textArea.clientHeight) ? 'auto' : 'hidden';
    }

    // --- LOGICA SALVATAGGIO ---
    function saveToStorage() {
        localStorage.setItem('draft', textArea.value);
        localStorage.setItem('pageTitle', pageTitleElem.innerText);
    }

    const debouncedSave = debounce(saveToStorage, 800);

    // Init stats
    updateStatsUI();
    
    textArea.addEventListener('input', () => {
        updateStatsUI();
        debouncedSave();
    });

    // --- GESTIONE MODALI ---
    function closeAllModals() {
        overlay.classList.remove('show');
        renameModal.classList.remove('show');
        deleteModal.classList.remove('show');
        findReplaceModal.classList.remove('show');
        emailPopover.classList.remove('show');
        guideModal.classList.remove('show');
        dropdownMenu.classList.remove('active');
    }

    function openModal(modal) {
        dropdownMenu.classList.remove('active');
        if (modal !== guideModal) overlay.classList.add('show');
        modal.classList.add('show');
        const input = modal.querySelector('input:not([type="checkbox"])');
        if (input) setTimeout(() => input.focus(), 100);
    }

    overlay.addEventListener('click', closeAllModals);

    // --- RENAME MODAL ---
    openRenameBtn.addEventListener('click', () => {
        renameInput.value = pageTitleElem.innerText;
        openModal(renameModal);
    });
    
    confirmRename.addEventListener('click', () => {
        const newVal = renameInput.value.trim();
        if (newVal) {
            pageTitleElem.innerText = newVal;
            document.title = newVal;
            localStorage.setItem('pageTitle', newVal);
            titleSet = true;
            showToast('Title updated!');
            closeAllModals();
        }
    });
    
    renameInput.addEventListener('keydown', (e) => { 
        if (e.key === 'Enter') confirmRename.click(); 
        if (e.key === 'Escape') closeAllModals();
    });
    
    cancelRename.addEventListener('click', closeAllModals);

    // --- DELETE MODAL ---
    openDeleteBtn.addEventListener('click', () => openModal(deleteModal));
    
    confirmDelete.addEventListener('click', () => {
        localStorage.removeItem('draft');
        localStorage.removeItem('pageTitle');
        textArea.value = "";
        pageTitleElem.innerText = "Empty Page";
        document.title = "Empty Page";
        titleSet = false;
        updateStatsUI();
        showToast('Draft deleted!');
        closeAllModals();
    });
    
    cancelDelete.addEventListener('click', closeAllModals);

    // --- FIND & REPLACE ---
    function findAllMatches() {
        const searchText = findInput.value;
        const text = textArea.value;
        const caseSensitive = caseSensitiveCheck.checked;
        
        matches = [];
        currentMatchIndex = -1;
        
        if (!searchText) {
            findResults.textContent = '';
            findResults.className = 'find-results';
            return;
        }
        
        let searchStr = searchText;
        let textStr = text;
        
        if (!caseSensitive) {
            searchStr = searchText.toLowerCase();
            textStr = text.toLowerCase();
        }
        
        let pos = 0;
        while (true) {
            const index = textStr.indexOf(searchStr, pos);
            if (index === -1) break;
            matches.push({
                start: index,
                end: index + searchText.length
            });
            pos = index + 1;
        }
        
        if (matches.length > 0) {
            findResults.textContent = `${matches.length} match${matches.length > 1 ? 'es' : ''} found`;
            findResults.className = 'find-results found';
        } else {
            findResults.textContent = 'No matches found';
            findResults.className = 'find-results not-found';
        }
    }

    function goToMatch(index) {
        if (matches.length === 0) return;
        
        currentMatchIndex = index;
        if (currentMatchIndex >= matches.length) currentMatchIndex = 0;
        if (currentMatchIndex < 0) currentMatchIndex = matches.length - 1;
        
        const match = matches[currentMatchIndex];
        textArea.focus();
        textArea.setSelectionRange(match.start, match.end);
        
        // Scroll to selection
        const lineHeight = parseInt(getComputedStyle(textArea).lineHeight) || 20;
        const textBeforeMatch = textArea.value.substring(0, match.start);
        const linesBeforeMatch = textBeforeMatch.split('\n').length;
        textArea.scrollTop = (linesBeforeMatch - 3) * lineHeight;
        
        findResults.textContent = `Match ${currentMatchIndex + 1} of ${matches.length}`;
        findResults.className = 'find-results found';
    }

    function findNext() {
        if (matches.length === 0) {
            findAllMatches();
            if (matches.length > 0) {
                goToMatch(0);
            }
        } else {
            goToMatch(currentMatchIndex + 1);
        }
    }

    function findPrev() {
        if (matches.length === 0) {
            findAllMatches();
            if (matches.length > 0) {
                goToMatch(matches.length - 1);
            }
        } else {
            goToMatch(currentMatchIndex - 1);
        }
    }

    function replaceCurrent() {
        if (matches.length === 0 || currentMatchIndex === -1) {
            findNext();
            return;
        }
        
        const match = matches[currentMatchIndex];
        const replaceText = replaceInput.value;
        
        textArea.focus();
        textArea.setSelectionRange(match.start, match.end);
        
        // Replace the selected text
        const before = textArea.value.substring(0, match.start);
        const after = textArea.value.substring(match.end);
        textArea.value = before + replaceText + after;
        
        // Update stats and save
        updateStatsUI();
        debouncedSave();
        
        // Re-find matches
        findAllMatches();
        
        // Go to next match (or same position if there are still matches)
        if (matches.length > 0) {
            const newIndex = Math.min(currentMatchIndex, matches.length - 1);
            goToMatch(newIndex);
        }
        
        showToast('Replaced!');
    }

    function replaceAll() {
        const searchText = findInput.value;
        const replaceText = replaceInput.value;
        
        if (!searchText) return;
        
        const caseSensitive = caseSensitiveCheck.checked;
        let text = textArea.value;
        let count = 0;
        
        if (caseSensitive) {
            while (text.includes(searchText)) {
                text = text.replace(searchText, replaceText);
                count++;
            }
        } else {
            const regex = new RegExp(escapeRegex(searchText), 'gi');
            const matchesFound = text.match(regex);
            count = matchesFound ? matchesFound.length : 0;
            text = text.replace(regex, replaceText);
        }
        
        textArea.value = text;
        updateStatsUI();
        debouncedSave();
        
        matches = [];
        currentMatchIndex = -1;
        findResults.textContent = `Replaced ${count} occurrence${count !== 1 ? 's' : ''}`;
        findResults.className = 'find-results found';
        
        showToast(`Replaced ${count} occurrence${count !== 1 ? 's' : ''}!`);
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Find & Replace Event Listeners
    openFindReplaceBtn.addEventListener('click', () => {
        openModal(findReplaceModal);
        findInput.value = '';
        replaceInput.value = '';
        findResults.textContent = '';
        findResults.className = 'find-results';
        matches = [];
        currentMatchIndex = -1;
    });

    closeFindReplaceBtn.addEventListener('click', closeAllModals);

    findInput.addEventListener('input', () => {
        findAllMatches();
        currentMatchIndex = -1;
    });

    caseSensitiveCheck.addEventListener('change', () => {
        findAllMatches();
        currentMatchIndex = -1;
    });

    findNextBtn.addEventListener('click', findNext);
    findPrevBtn.addEventListener('click', findPrev);
    replaceBtn.addEventListener('click', replaceCurrent);
    replaceAllBtn.addEventListener('click', replaceAll);

    // Enter/Shift+Enter in find input
    findInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                findPrev();
            } else {
                findNext();
            }
        }
        if (e.key === 'Escape') {
            closeAllModals();
            textArea.focus();
        }
    });

    replaceInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            replaceCurrent();
        }
        if (e.key === 'Escape') {
            closeAllModals();
            textArea.focus();
        }
    });

    // --- EMAIL MODAL ---
    openEmailBtn.addEventListener('click', () => openModal(emailPopover));
    closeEmailBtn.addEventListener('click', closeAllModals);
    
    copyTextBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(textArea.value).then(() => {
            showToast("Copied!");
            closeAllModals();
        });
    });
    
    emailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const recipient = recipientInput.value;
        const subject = encodeURIComponent(subjectInput.value);
        const body = encodeURIComponent(textArea.value);
        window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
        closeAllModals();
    });

    // --- GUIDE MODAL ---
    guideBtn.addEventListener('click', () => {
        guideModal.classList.add('show');
        dropdownMenu.classList.remove('active');
    });
    
    closeGuideBtn.addEventListener('click', () => guideModal.classList.remove('show'));
    
    guideModal.addEventListener('click', (e) => {
        if (e.target === guideModal) {
            guideModal.classList.remove('show');
        }
    });

    // --- MENU ACTIONS ---
    toggleDarkBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('dark-mode', isDarkMode);
        toggleDarkBtn.textContent = isDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode';
        dropdownMenu.classList.remove('active');
    });

    saveDraftBtn.addEventListener('click', () => {
        saveToStorage();
        showToast('Draft saved!');
        dropdownMenu.classList.remove('active');
    });

    downloadTxtBtn.addEventListener('click', () => {
        let title = pageTitleElem.innerText.trim() || "Empty Page";
        title = title.replace(/[^a-z0-9 \-_]/gi, '_');
        const blob = new Blob([textArea.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        dropdownMenu.classList.remove('active');
    });

    downloadPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFont("Courier", "normal");
        doc.setFontSize(11);
        
        const title = pageTitleElem.innerText.trim() || "Draft";
        const content = textArea.value;
        const margin = 20;
        const maxLineWidth = 170;
        const pageHeight = 297;
        
        doc.setFont("Courier", "bold");
        doc.setFontSize(16);
        doc.text(title, margin, margin);
        
        doc.setFont("Courier", "normal");
        doc.setFontSize(11);
        
        const textLines = doc.splitTextToSize(content, maxLineWidth);
        let y = margin + 15;
        
        for (let i = 0; i < textLines.length; i++) {
            if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(textLines[i], margin, y);
            y += 7;
        }

        doc.save(`${title.replace(/[^a-z0-9 \-_]/gi, '_')}.pdf`);
        showToast('PDF Downloaded!');
        dropdownMenu.classList.remove('active');
    });

    // --- KEYBOARD SHORTCUTS ---
    document.addEventListener('keydown', (e) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifier = isMac ? e.metaKey : e.ctrlKey;
        
        // Escape - Chiudi tutto
        if (e.key === 'Escape') {
            if (dropdownMenu.classList.contains('active') || 
                overlay.classList.contains('show') || 
                guideModal.classList.contains('show') ||
                findReplaceModal.classList.contains('show')) {
                closeAllModals();
                textArea.focus();
            }
        }
        
        // Ctrl/Cmd + S - Salva
        if (modifier && e.key === 's') {
            e.preventDefault();
            saveToStorage();
            showToast('Draft saved!');
        }
        
        // Ctrl/Cmd + F - Find & Replace
        if (modifier && e.key === 'f') {
            e.preventDefault();
            if (findReplaceModal.classList.contains('show')) {
                // Se già aperto, seleziona tutto il testo nel campo di ricerca
                findInput.select();
            } else {
                // Apri il modal
                openModal(findReplaceModal);
                
                // Se c'è testo selezionato, usalo come termine di ricerca
                const selectedText = textArea.value.substring(
                    textArea.selectionStart, 
                    textArea.selectionEnd
                );
                if (selectedText && selectedText.length < 100) {
                    findInput.value = selectedText;
                    findAllMatches();
                } else {
                    findInput.value = '';
                    replaceInput.value = '';
                    findResults.textContent = '';
                    findResults.className = 'find-results';
                    matches = [];
                    currentMatchIndex = -1;
                }
            }
        }
    });

    // --- COMANDI TESTUALI (dark/light + titolo) ---
    textArea.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const pos = textArea.selectionStart;
            const textBefore = textArea.value.substring(0, pos);
            const lineStart = textBefore.lastIndexOf('\n') + 1;
            const currentLine = textBefore.substring(lineStart).trim();
            const lowerCurrentLine = currentLine.toLowerCase();

            // Comandi dark/light
            if (lowerCurrentLine === 'dark' || lowerCurrentLine === 'light') {
                e.preventDefault();
                const textAfter = textArea.value.substring(pos);
                textArea.value = textArea.value.substring(0, lineStart) + textAfter;
                textArea.selectionStart = textArea.selectionEnd = lineStart;
                
                if (lowerCurrentLine === 'dark') {
                    document.body.classList.add('dark-mode');
                    localStorage.setItem('dark-mode', 'true');
                    toggleDarkBtn.textContent = 'Toggle Light Mode';
                } else {
                    document.body.classList.remove('dark-mode');
                    localStorage.setItem('dark-mode', 'false');
                    toggleDarkBtn.textContent = 'Toggle Dark Mode';
                }
                updateStatsUI();
                return;
            }
            
            // Prima riga non vuota diventa titolo
            if (!titleSet && currentLine !== '') {
                e.preventDefault();
                pageTitleElem.style.transition = "opacity 0.5s";
                pageTitleElem.style.opacity = "0";
                setTimeout(() => {
                    pageTitleElem.innerText = currentLine;
                    document.title = currentLine;
                    pageTitleElem.style.opacity = "1";
                    localStorage.setItem('pageTitle', currentLine);
                }, 500);
                titleSet = true;
                const textAfter = textArea.value.substring(pos);
                textArea.value = textArea.value.substring(0, lineStart) + textAfter;
                textArea.selectionStart = textArea.selectionEnd = lineStart;
                updateStatsUI();
            }
        }
    });

    // --- MENU TOGGLE ---
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!dropdownMenu.contains(e.target) && !menuBtn.contains(e.target)) {
            dropdownMenu.classList.remove('active');
        }
    });
});

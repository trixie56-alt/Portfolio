// ===== STATE MANAGEMENT =====
let activities = [];
let currentFilter = 'all';
let selectedFile = null;
let selectedFileData = null;
let selectedFileName = '';
let selectedIsImage = false;

// Load saved activities from localStorage
try {
    const saved = localStorage.getItem('portfolio_activities');
    if (saved) {
        activities = JSON.parse(saved);
    }
} catch (e) {
    console.log('Error loading activities:', e);
}

// ===== DOM ELEMENTS =====
const uploadZone = document.getElementById('upload-zone');
const activitiesGrid = document.getElementById('activities-grid');
const filterBar = document.getElementById('act-filter-bar');
const actFile = document.getElementById('act-file');
const actTitle = document.getElementById('act-title');
const actSubject = document.getElementById('act-subject');
const actDesc = document.getElementById('act-desc-input');
const toast = document.getElementById('toast');

// ===== PHOTO MODAL FUNCTIONS =====
function openPhotoModal() {
    const saved = localStorage.getItem('portfolio_photo_url');
    if (saved) {
        document.getElementById('photo-url-input').value = saved;
    }
    document.getElementById('photo-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('photo-url-input').focus(), 100);
}

function closePhotoModal() {
    document.getElementById('photo-modal').classList.remove('open');
    document.body.style.overflow = '';
    document.getElementById('photo-url-error').style.display = 'none';
}

// Live preview as user types
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('photo-url-input');
    if (input) {
        input.addEventListener('input', function() {
            const url = this.value.trim();
            const wrap = document.getElementById('photo-url-preview-wrap');
            const prev = document.getElementById('photo-url-preview');
            
            if (url) {
                prev.src = url;
                prev.onload = function() {
                    wrap.style.display = 'block';
                    document.getElementById('photo-url-error').style.display = 'none';
                };
                prev.onerror = function() {
                    wrap.style.display = 'none';
                };
            } else {
                wrap.style.display = 'none';
            }
        });
    }
});

function applyPhotoURL() {
    const url = document.getElementById('photo-url-input').value.trim();
    if (!url) return;
    
    const testImg = new Image();
    testImg.onload = function() {
        localStorage.setItem('portfolio_photo_url', url);
        setHeroPhoto(url);
        closePhotoModal();
        showToast('✓ Profile photo updated!');
    };
    
    testImg.onerror = function() {
        document.getElementById('photo-url-error').style.display = 'block';
    };
    
    testImg.src = url;
}

function setHeroPhoto(url) {
    const img = document.getElementById('hero-photo');
    img.src = url;
    img.style.display = 'block';
    
    const aboutAvatar = document.getElementById('about-avatar');
    if (aboutAvatar) {
        aboutAvatar.src = url;
    }
    
    const ph = document.getElementById('hero-placeholder');
    if (ph) ph.style.display = 'none';
}

// Load saved photo on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedPhotoURL = localStorage.getItem('portfolio_photo_url');
    if (savedPhotoURL) {
        setHeroPhoto(savedPhotoURL);
    }
});

// ===== TOAST NOTIFICATION =====
function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(function() {
        toast.classList.remove('show');
    }, 2800);
}

// ===== FILE UPLOAD HANDLING =====
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    selectedFileName = file.name;
    selectedIsImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    // Update button text
    const btn = document.querySelector('.choose-btn');
    if (btn) {
        btn.textContent = '✓ File ready — click again to save!';
        btn.style.background = '#5cb85c';
    }

    // Auto-fill title if empty
    if (!actTitle.value) {
        actTitle.value = file.name.replace(/\.[^/.]+$/, '');
    }

    if (selectedIsImage || isVideo) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            selectedFileData = ev.target.result;
            showToast('✓ ' + (isVideo ? 'Video' : 'Image') + ' loaded: ' + file.name);
        };
        reader.readAsDataURL(file);
    } else {
        selectedFileData = 'non-image';
        showToast('✓ File selected: ' + file.name);
    }
}

// Drag & drop on upload zone
if (uploadZone) {
    uploadZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadZone.classList.add('drag');
    });
    
    uploadZone.addEventListener('dragleave', function() {
        uploadZone.classList.remove('drag');
    });
    
    uploadZone.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadZone.classList.remove('drag');
        
        const file = e.dataTransfer.files[0];
        if (!file) return;
        
        selectedFileName = file.name;
        selectedIsImage = file.type.startsWith('image/');
        
        if (!actTitle.value) {
            actTitle.value = file.name.replace(/\.[^/.]+$/, '');
        }
        
        if (selectedIsImage) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                selectedFileData = ev.target.result;
                showToast('✓ Image dropped: ' + file.name);
            };
            reader.readAsDataURL(file);
        } else {
            selectedFileData = 'non-image';
            showToast('✓ File dropped: ' + file.name);
        }
    });
}

// Choose Files button logic
document.addEventListener('DOMContentLoaded', function() {
    const chooseBtn = document.querySelector('.choose-btn');
    if (chooseBtn && actFile) {
        chooseBtn.onclick = function() {
            const title = actTitle.value.trim();
            
            // If no file selected yet, open file picker
            if (!selectedFileData) {
                actFile.click();
                return;
            }
            
            // If file is selected but no title, ask for title
            if (!title) {
                showToast('⚠️ Please enter an activity title first.');
                return;
            }
            
            saveActivity();
        };
    }
    
    // File input change handler
    if (actFile) {
        actFile.addEventListener('change', handleFileSelect);
    }
});

// ===== SAVE ACTIVITY =====
function saveActivity() {
    const title = actTitle.value.trim();
    const subject = actSubject.value.trim() || 'General';
    const desc = actDesc.value.trim();
    
    if (!title) {
        showToast('⚠️ Please enter an activity title');
        return;
    }
    
    const isVideo = selectedFileData && selectedFileData.startsWith('data:video');
    
    const activity = {
        id: Date.now(),
        title: title,
        subject: subject,
        desc: desc,
        fileData: (selectedIsImage || isVideo) ? selectedFileData : null,
        fileName: selectedFileName,
        isImage: selectedIsImage,
        isVideo: isVideo,
        type: subject.toLowerCase().includes('project') ? 'project' : 'all'
    };
    
    activities.unshift(activity);

    // Try to save to localStorage
    try {
        localStorage.setItem('portfolio_activities', JSON.stringify(activities));
    } catch(e) {
        // If quota exceeded, save metadata only
        const lite = activities.map(function(a) {
            return {...a, fileData: null};
        });
        try {
            localStorage.setItem('portfolio_activities', JSON.stringify(lite));
        } catch(e2) {}
        showToast('⚠️ File visible this session but may not persist after reload (file too large).');
    }

    // Reset form
    actTitle.value = '';
    actSubject.value = '';
    actDesc.value = '';
    if (actFile) actFile.value = '';
    selectedFileData = null;
    selectedFileName = '';
    selectedIsImage = false;
    
    // Reset button
    const chooseBtn = document.querySelector('.choose-btn');
    if (chooseBtn) {
        chooseBtn.textContent = '＋ Choose Files';
        chooseBtn.style.background = '';
    }

    renderActivities();
    showToast('✓ Activity added successfully!');
}

// ===== FILTER ACTIVITIES =====
if (filterBar) {
    filterBar.addEventListener('click', function(e) {
        if (!e.target.matches('.act-filter-btn')) return;
        
        document.querySelectorAll('.act-filter-btn').forEach(function(b) {
            b.classList.remove('active');
        });
        
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        renderActivities();
    });
}

// ===== RENDER ACTIVITIES =====
function renderActivities() {
    if (!activitiesGrid) return;
    
    const filtered = currentFilter === 'all' 
        ? activities 
        : activities.filter(function(a) {
            return a.type === currentFilter;
        });

    if (filtered.length === 0) {
        activitiesGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🗂️</div>
                <p>${currentFilter === 'all' ? 'No activities yet. Upload your first one above!' : 'No items in this category.'}</p>
            </div>
        `;
        return;
    }

    let html = '';
    
    for (let i = 0; i < filtered.length; i++) {
        const a = filtered[i];
        let thumb = '';

        if (a.isVideo && a.fileData) {
            thumb = `<video controls style="width:100%;height:100%;object-fit:cover;display:block;" preload="metadata">
                <source src="${a.fileData}" type="video/mp4">
                Your browser does not support video.
            </video>`;
        } else if (a.isImage && a.fileData) {
            thumb = `<img src="${a.fileData}" alt="${a.title}" style="width:100%;height:100%;object-fit:cover;cursor:pointer;" onclick="openLightbox('${a.fileData}', '${a.title}')">`;
        } else {
            const ext = a.fileName ? a.fileName.split('.').pop().toUpperCase() : 'FILE';
            const icons = {
                'PDF': '📄', 'DOCX': '📝', 'DOC': '📝', 
                'ZIP': '🗜️', 'MP4': '🎬', 'MOV': '🎬',
                'PPTX': '📊', 'XLSX': '📊'
            };
            const icon = icons[ext] || '📁';
            thumb = `<div style="display:flex;flex-direction:column;align-items:center;gap:0.5rem;opacity:0.6">
                <span style="font-size:2.5rem">${icon}</span>
                <span style="font-size:0.7rem;color:var(--muted);letter-spacing:0.1em">${ext}</span>
            </div>`;
        }

        html += `
            <div class="activity-card" style="animation-delay:${i * 0.07}s">
                <div class="act-card-thumb" style="${a.isVideo ? 'aspect-ratio:16/9;height:auto;' : ''}">
                    ${thumb}
                </div>
                <div class="act-card-body">
                    <div class="act-subject">${a.subject}</div>
                    <div class="act-title">${a.title}</div>
                    ${a.desc ? `<div class="act-desc">${a.desc}</div>` : ''}
                    ${a.fileName ? `<div class="act-desc" style="font-size:0.75rem;opacity:0.5">📎 ${a.fileName}</div>` : ''}
                    <div class="act-actions">
                        ${(a.fileData && !a.isVideo && a.isImage) ? 
                            `<button class="act-btn" onclick="openLightbox('${a.fileData}', '${a.title}')">View</button>` : 
                            ''
                        }
                        <button class="act-btn danger" onclick="deleteActivity(${a.id})">Remove</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    activitiesGrid.innerHTML = html;
}

// ===== DELETE ACTIVITY =====
window.deleteActivity = function(id) {
    if (!confirm('Remove this activity?')) return;
    
    activities = activities.filter(function(a) {
        return a.id !== id;
    });
    
    localStorage.setItem('portfolio_activities', JSON.stringify(activities));
    renderActivities();
    showToast('Activity removed.');
};

// ===== LIGHTBOX =====
window.openLightbox = function(src, title) {
    // Remove any existing lightbox first
    const existingLightbox = document.getElementById('lightbox');
    if (existingLightbox) {
        existingLightbox.remove();
        document.body.style.overflow = '';
    }
    
    // Create new lightbox
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('id', 'lightbox');
    
    // Simple lightbox with just image and close button
    lightbox.innerHTML = `
        <button class="lightbox-close" onclick="closeLightbox()">✕</button>
        <img class="lightbox-img" src="${src}" alt="${title}" />
    `;
    
    // Close when clicking on background
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden'; // Lock scrolling
};

// ===== CLOSE LIGHTBOX =====
window.closeLightbox = function() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.remove();
        document.body.style.overflow = ''; // Unlock scrolling
    }
};

// Close lightbox with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});

// ===== SEND MESSAGE =====
window.sendMessage = function() {
    // Show success message
    showToast('✓ Message sent! Thank you 💛');
    
    // Clear ALL form fields
    const nameInputs = document.querySelectorAll('.contact-form-input');
    const textarea = document.querySelector('.contact-form-textarea');
    
    // Clear all input fields
    for (let i = 0; i < nameInputs.length; i++) {
        nameInputs[i].value = '';
    }
    
    // Clear textarea
    if (textarea) {
        textarea.value = '';
    }
};

// ===== INITIAL RENDER =====
renderActivities();

// Handle photo modal overlay click
document.addEventListener('DOMContentLoaded', function() {
    const photoModal = document.getElementById('photo-modal');
    if (photoModal) {
        photoModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closePhotoModal();
            }
        });
    }
});
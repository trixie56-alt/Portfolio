// ===== ADMIN MODE =====
// Press Shift + A + D together to show/hide the upload zone (only you know this!)
let adminMode = false;
const keysPressed = {};

document.addEventListener('keydown', function(e) {
    keysPressed[e.key] = true;
    if (keysPressed['A'] && keysPressed['D'] && keysPressed['Shift']) {
        adminMode = !adminMode;
        const uploadZone = document.getElementById('upload-zone');
        const filterBar = document.getElementById('act-filter-bar');
        if (uploadZone) {
            uploadZone.style.display = adminMode ? 'block' : 'none';
        }
        showToast(adminMode ? '🔓 Admin mode ON' : '🔒 Admin mode OFF');
    }
});

document.addEventListener('keyup', function(e) {
    delete keysPressed[e.key];
});

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

// Hide upload zone by default (only visible in admin mode)
document.addEventListener('DOMContentLoaded', function() {
    const uploadZone = document.getElementById('upload-zone');
    if (uploadZone) {
        uploadZone.style.display = 'none';
    }
});

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
    if (aboutAvatar) aboutAvatar.src = url;
    const ph = document.getElementById('hero-placeholder');
    if (ph) ph.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    const savedPhotoURL = localStorage.getItem('portfolio_photo_url');
    if (savedPhotoURL) setHeroPhoto(savedPhotoURL);
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

    const btn = document.querySelector('.choose-btn');
    if (btn) {
        btn.textContent = '✓ File ready — click again to save!';
        btn.style.background = '#5cb85c';
    }

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

// Drag & drop
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
        if (!actTitle.value) actTitle.value = file.name.replace(/\.[^/.]+$/, '');
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

document.addEventListener('DOMContentLoaded', function() {
    const chooseBtn = document.querySelector('.choose-btn');
    if (chooseBtn && actFile) {
        chooseBtn.onclick = function() {
            const title = actTitle.value.trim();
            if (!selectedFileData) {
                actFile.click();
                return;
            }
            if (!title) {
                showToast('⚠️ Please enter an activity title first.');
                return;
            }
            saveActivity();
        };
    }
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

    try {
        localStorage.setItem('portfolio_activities', JSON.stringify(activities));
    } catch(e) {
        const lite = activities.map(function(a) { return {...a, fileData: null}; });
        try { localStorage.setItem('portfolio_activities', JSON.stringify(lite)); } catch(e2) {}
        showToast('⚠️ File visible this session only (file too large to persist).');
    }

    actTitle.value = '';
    actSubject.value = '';
    actDesc.value = '';
    if (actFile) actFile.value = '';
    selectedFileData = null;
    selectedFileName = '';
    selectedIsImage = false;

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
        document.querySelectorAll('.act-filter-btn').forEach(function(b) { b.classList.remove('active'); });
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        renderActivities();
    });
}

// ===== RENDER ACTIVITIES =====
function renderActivities() {
    if (!activitiesGrid) return;

    // Get hardcoded cards from HTML (those with data-hardcoded attribute)
    const hardcodedCards = activitiesGrid.querySelectorAll('.activity-card[data-hardcoded]');
    
    // Remove all dynamic cards (not hardcoded ones)
    activitiesGrid.querySelectorAll('.activity-card:not([data-hardcoded])').forEach(function(c) { c.remove(); });
    
    // Remove empty state if it exists
    const emptyState = activitiesGrid.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
    
    // If there are no hardcoded cards, show empty state
    if (hardcodedCards.length === 0) {
        activitiesGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🗂️</div>
                <p>No activities yet.</p>
            </div>
        `;
        return;
    }
    
    // NO DYNAMIC CARDS CREATED HERE - JUST KEEP THE HARDCODED ONES
}

// ===== DELETE ACTIVITY =====
window.deleteActivity = function(id) {
    if (!confirm('Remove this activity?')) return;
    activities = activities.filter(function(a) { return a.id !== id; });
    localStorage.setItem('portfolio_activities', JSON.stringify(activities));
    renderActivities();
    showToast('Activity removed.');
};

// ===== LIGHTBOX =====
window.openLightbox = function(src, title) {
    const existingLightbox = document.getElementById('lightbox');
    if (existingLightbox) {
        existingLightbox.remove();
        document.body.style.overflow = '';
    }
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('id', 'lightbox');
    lightbox.innerHTML = `
        <button class="lightbox-close" onclick="closeLightbox()">✕</button>
        <img class="lightbox-img" src="${src}" alt="${title}" />
    `;
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) closeLightbox();
    });
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';
};

window.closeLightbox = function() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.remove();
        document.body.style.overflow = '';
    }
};

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeLightbox();
});

// ===== SEND MESSAGE =====
window.sendMessage = function() {
    showToast('✓ Message sent! Thank you 💛');
    document.querySelectorAll('.contact-form-input').forEach(function(i) { i.value = ''; });
    const textarea = document.querySelector('.contact-form-textarea');
    if (textarea) textarea.value = '';
};

// ===== INITIAL RENDER =====
renderActivities();

document.addEventListener('DOMContentLoaded', function() {
    const photoModal = document.getElementById('photo-modal');
    if (photoModal) {
        photoModal.addEventListener('click', function(e) {
            if (e.target === this) closePhotoModal();
        });
    }
});

/* =============================================
   MEDIA SYSTEM
   ============================================= */

// Convertir File en base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Erreur lecture fichier'));
        reader.readAsDataURL(file);
    });
}

// Sauvegarder un média
async function saveMedia(base64Data, type, name) {
    const id = 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const mediaData = { id, base64: base64Data, type, name };

    // Toujours mettre en cache d'abord
    mediaStore.set(id, mediaData);

    if (!db) {
        try {
            localStorage.setItem('media_' + id, JSON.stringify(mediaData));
        } catch (e) {
            console.error('Erreur sauvegarde localStorage:', e);
            mediaStore.delete(id);
            return null;
        }
        return id;
    }

    return new Promise((resolve) => {
        const tx = db.transaction('media', 'readwrite');
        tx.objectStore('media').put(mediaData);
        tx.oncomplete = () => resolve(id);
        tx.onerror = () => {
            mediaStore.delete(id);
            resolve(null);
        };
    });
}

// Récupérer un média
async function getMedia(id) {
    if (!id) return null;

    // Vérifier le cache d'abord
    if (mediaStore.has(id)) {
        return mediaStore.get(id);
    }

    if (!db) {
        try {
            const data = localStorage.getItem('media_' + id);
            if (data) {
                const parsed = JSON.parse(data);
                mediaStore.set(id, parsed);
                return parsed;
            }
        } catch (e) {}
        return null;
    }

    return new Promise((resolve) => {
        const tx = db.transaction('media', 'readonly');
        const request = tx.objectStore('media').get(id);
        request.onsuccess = () => {
            if (request.result) {
                mediaStore.set(id, request.result);
                resolve(request.result);
            } else {
                resolve(null);
            }
        };
        request.onerror = () => resolve(null);
    });
}

// Supprimer un média
async function deleteMedia(id) {
    if (!id) return;

    mediaStore.delete(id);

    if (!db) {
        localStorage.removeItem('media_' + id);
        return;
    }

    return new Promise((resolve) => {
        const tx = db.transaction('media', 'readwrite');
        tx.objectStore('media').delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
    });
}

// Render background
async function renderBackground(containerId, mediaId) {
    const container = document.getElementById(containerId);

    if (!mediaId) {
        container.innerHTML = '';
        return;
    }

    const media = await getMedia(mediaId);

    if (!media || !media.base64) {
        console.warn('Média non trouvé:', mediaId);
        return;
    }

    container.innerHTML = '';

    if (media.type && media.type.startsWith('video')) {
        const video = document.createElement('video');
        video.src = media.base64;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.style.cssText = 'width:100%;height:100%;object-fit:cover';
        container.appendChild(video);
        video.play().catch(() => {});
    } else {
        const img = document.createElement('img');
        img.src = media.base64;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover';
        container.appendChild(img);
    }
}

// Card background helper
async function getCardBackground(mediaId) {
    if (!mediaId) return '<div class="card-overlay"></div>';

    const media = await getMedia(mediaId);
    if (!media || !media.base64) return '<div class="card-overlay"></div>';

    if (media.type && media.type.startsWith('video')) {
        return `<video class="card-bg" src="${media.base64}" autoplay loop muted playsinline></video><div class="card-overlay"></div>`;
    }
    return `<img class="card-bg" src="${media.base64}"><div class="card-overlay"></div>`;
}

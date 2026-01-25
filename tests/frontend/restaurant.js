import { API_BASE } from './config.js';

/**
 * Search for restaurants based on menu and location
 * @param {Object} params - { menu_id, latitude, longitude, radius_km, max_result }
 */
export async function searchRestaurants(params) {
    try {
        const response = await fetch(`${API_BASE}/restaurant/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Parse response (matches RestaurantSearchResponse)
        return data.data || [];
    } catch (error) {
        console.error('Error searching restaurants:', error);
        throw error;
    }
}

/**
 * Get restaurant detail info
 * @param {string} url - Kakao map url
 */
export async function getRestaurantDetail(url) {
    try {
        const response = await fetch(`${API_BASE}/restaurant/detail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching detail:', error);
        throw error;
    }
}

/**
 * Render restaurants to a container
 * @param {Array} restaurants 
 * @param {HTMLElement} container 
 */
export function displayRestaurants(restaurants, container) {
    container.innerHTML = '';

    if (!restaurants || restaurants.length === 0) {
        container.innerHTML = '<p>No restaurants found nearby.</p>';
        return;
    }

    restaurants.forEach(res => {
        const div = document.createElement('div');
        div.className = 'restaurant-card';
        
        const distanceText = res.distance ? `${res.distance}m` : '';
        const mapUrl = (res.urls && res.urls.length > 0) ? res.urls[0] : '#';
        const address = res.location ? (res.location.address || 'No address') : 'No address';

        // Basic Info
        const basicInfoDiv = document.createElement('div');
        basicInfoDiv.innerHTML = `
            <div class="res-header">
                <h3 class="res-name">${res.name}</h3>
                ${distanceText ? `<span class="res-dist">${distanceText}</span>` : ''}
            </div>
            <div style="font-size: 0.8em; color: #007bff; margin-bottom: 8px;">${res.category}</div>
            <div class="res-info">
                <div>📍 ${address}</div>
                ${res.phone ? `<div>📞 ${res.phone}</div>` : ''}
            </div>
        `;
        div.appendChild(basicInfoDiv);

        // Action Buttons Container
        const actionsDiv = document.createElement('div');
        actionsDiv.style.marginTop = 'auto';
        actionsDiv.style.display = 'flex';
        actionsDiv.style.flexDirection = 'column';
        actionsDiv.style.gap = '5px';

        // 1. Detail Toggle Button
        const detailBtn = document.createElement('button');
        detailBtn.type = 'button'; // Explicitly set type to button to prevent form submission
        detailBtn.className = 'res-detail-btn'; 
        detailBtn.innerText = '상세 정보 보기';
        detailBtn.style.width = '100%';
        detailBtn.style.padding = '8px';
        detailBtn.style.backgroundColor = '#6c757d';
        detailBtn.style.color = 'white';
        detailBtn.style.border = 'none';
        detailBtn.style.borderRadius = '4px';
        detailBtn.style.cursor = 'pointer';
        
        // 2. Map Link
        if (mapUrl !== '#') {
            const mapLink = document.createElement('a');
            mapLink.href = mapUrl;
            mapLink.target = '_blank';
            mapLink.className = 'res-link';
            mapLink.innerText = '카카오맵에서 보기';
            actionsDiv.appendChild(mapLink);
        }

        // Detail Container (Hidden initially)
        const detailContainer = document.createElement('div');
        detailContainer.style.display = 'none';
        detailContainer.style.marginTop = '10px';
        detailContainer.style.padding = '10px';
        detailContainer.style.backgroundColor = '#f8f9fa';
        detailContainer.style.border = '1px solid #e9ecef';
        detailContainer.style.borderRadius = '4px';
        detailContainer.style.fontSize = '0.9em';

        detailBtn.onclick = async (e) => {
            e.preventDefault();
            const isHidden = detailContainer.style.display === 'none';
            
            if (isHidden) {
                // Show
                detailContainer.style.display = 'block';
                detailBtn.innerText = '상세 정보 닫기';
                
                // Fetch if not already loaded
                if (!detailContainer.hasAttribute('data-loaded')) {
                    detailContainer.innerHTML = '<div style="text-align:center; padding:10px;">⌛ 상세 정보를 조회 중입니다...</div>';
                    
                    try {
                        if (!mapUrl || mapUrl === '#') {
                            throw new Error("상세 정보를 가져올 URL이 없습니다.");
                        }

                        const detail = await getRestaurantDetail(mapUrl);
                        renderDetailContent(detail, detailContainer);
                        detailContainer.setAttribute('data-loaded', 'true');
                    } catch (e) {
                        detailContainer.innerHTML = `<div style="color:#dc3545; padding:5px;">⚠️ 오류: ${e.message}</div>`;
                    }
                }
            } else {
                // Hide
                detailContainer.style.display = 'none';
                detailBtn.innerText = '상세 정보 보기';
            }
        };

        // Insert Detail Button before Map Link
        if (actionsDiv.firstChild) {
            actionsDiv.insertBefore(detailBtn, actionsDiv.firstChild);
        } else {
            actionsDiv.appendChild(detailBtn);
        }

        div.appendChild(actionsDiv);
        div.appendChild(detailContainer);

        container.appendChild(div);
    });
}

function renderDetailContent(detail, container) {
    const businessStatusHtml = (detail.business_status || [])
        .map(status => `<div style="margin-bottom:2px;">• ${status}</div>`).join('');
        
    const menusHtml = (detail.menus || [])
        .map(m => `
            <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #ddd; padding:4px 0;">
                <span style="font-weight:500;">${m.name}</span>
                <span style="color:#666;">${m.price}</span>
            </div>
        `).join('');

    container.innerHTML = `
        <div style="margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid #ddd;">
            <div style="font-size:1.1em; margin-bottom:5px;">
                ⭐ <b>${detail.rating || 'N/A'}</b> 
                <span style="font-size:0.8em; color:#666;">(리뷰 ${detail.review_count}, 블로그 ${detail.blog_review_count})</span>
            </div>
        </div>
        
        ${businessStatusHtml ? `
            <div style="margin-bottom:10px; background:white; padding:8px; border-radius:4px; border:1px solid #eee;">
                <strong style="display:block; margin-bottom:5px; color:#495057;">🕒 영업시간</strong>
                ${businessStatusHtml}
            </div>
        ` : ''}

        ${menusHtml ? `
            <div>
                <strong style="display:block; margin-bottom:5px; color:#495057;">🍽️ 메뉴 정보</strong>
                <div style="background:white; padding:8px; border-radius:4px; border:1px solid #eee;">
                    ${menusHtml}
                </div>
            </div>
        ` : ''}
    `;
}

/**
 * Helper to get current browser location
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser"));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            }
        );
    });
}

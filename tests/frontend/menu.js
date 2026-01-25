import { API_BASE } from './config.js';

/**
 * Fetch all menus
 */
export async function getAllMenus() {
    try {
        const response = await fetch(`${API_BASE}/menu/all`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Parse response based on schema
        let menus = [];
        if (Array.isArray(data)) {
            menus = data;
        } else if (data.data) {
            menus = data.data;
        }
        return menus;
    } catch (error) {
        console.error('Error fetching all menus:', error);
        throw error;
    }
}

/**
 * Request menu recommendations
 * @param {Object} criteria - { limit, included_categories, excluded_categories, attributes }
 */
export async function recommendMenu(criteria) {
    try {
        const response = await fetch(`${API_BASE}/menu/recommend/basic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(criteria)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        // Parse response
        return data.data || [];
    } catch (error) {
        console.error('Error recommending menu:', error);
        throw error;
    }
}

/**
 * Render menus to a container
 * @param {Array} menus 
 * @param {HTMLElement} container 
 * @param {Function} onSelect - Callback when a menu is selected
 */
export function displayMenus(menus, container, onSelect) {
    container.innerHTML = '';
    
    if (!menus || menus.length === 0) {
        container.innerHTML = '<p>No menus found matching your criteria.</p>';
        return;
    }

    menus.forEach(menu => {
        const tagsHtml = (menu.tags || [])
            .map(t => `<span class="tag">${t}</span>`)
            .join('');

        const div = document.createElement('div');
        div.className = 'menu-item';
        div.innerHTML = `
            <div class="menu-header">
                <h3>${menu.name}</h3>
                <span class="menu-cat">${menu.category}</span>
            </div>
            <div class="menu-props">
                <div class="prop-row"><span>Base:</span> <b>${menu.main_base}</b></div>
                <div class="prop-row"><span>Spicy:</span> <b>${menu.spiciness}</b></div>
                <div class="prop-row"><span>Temp:</span> <b>${menu.temperature}</b></div>
                <div class="prop-row"><span>Heavy:</span> <b>${menu.heaviness}</b></div>
            </div>
            <div style="margin-bottom:10px; font-size:0.9em; color:#666;">
                ${menu.description || ''}
            </div>
            <div class="tags">
                ${tagsHtml}
            </div>
            <button class="select-btn" data-id="${menu.id}" data-name="${menu.name}">Find Restaurants</button>
        `;
        
        const btn = div.querySelector('.select-btn');
        btn.onclick = () => {
            if (onSelect) onSelect(menu.id, menu.name);
        };
        
        container.appendChild(div);
    });
}

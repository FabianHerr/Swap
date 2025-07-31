import logo from './images/herreBurger.png'

function renderHome(){
    const section = document.createElement('section');
    section.id = 'home';

    // Create heading of home page
    const title = document.createElement('h1');
    title.textContent = "Welcome to HerreBurger!"

    // Put image 
    const img = document.createElement('img');
    img.src = logo // Relative to your 'dist/' folder after bundling
    img.alt = "HerreBurger - Premium Gourmet Burgers";
    img.style.maxWidth = "400px";
    img.style.height = "auto";

    // Create description of restaurant
    const info = document.createElement('div');
    info.innerHTML = `
        <p><strong>🍔 Crafting Culinary Excellence Since 2025</strong></p>
        <p>At HerreBurger, we're not just serving burgers – we're creating unforgettable culinary experiences. Our commitment to quality starts with 100% locally sourced, premium ingredients and extends to every aspect of your dining experience.</p>
        
        <p><strong>🌟 What Makes Us Special:</strong></p>
        <p>• Fresh, never-frozen beef patties grilled to perfection<br>
        • Artisanal buns baked daily in-house<br>
        • Farm-fresh vegetables from local suppliers<br>
        • House-made sauces and seasonings<br>
        • Plant-based options that don't compromise on flavor</p>
        
        <p><strong>🎯 Our Promise:</strong></p>
        <p>Whether you're craving our signature HerreBurger with our secret house sauce, or exploring our innovative plant-based creations, every bite is crafted with passion and served with pride. Join our community of burger enthusiasts and discover why HerreBurger is quickly becoming the talk of the town!</p>
        
        <p><em>Great food, exceptional service, and memories that last – that's the HerreBurger difference.</em></p>
    `;

    // Create call-to-action section
    const ctaSection = document.createElement('div');
    ctaSection.style.marginTop = '40px';
    ctaSection.style.padding = '30px';
    ctaSection.style.background = 'linear-gradient(135deg, #ff6b35, #f7931e)';
    ctaSection.style.borderRadius = '15px';
    ctaSection.style.color = 'white';
    ctaSection.style.textAlign = 'center';
    ctaSection.innerHTML = `
        <h3 style="color: white; margin-bottom: 15px; border: none; background: none; padding: 0;">Ready to Experience the Best?</h3>
        <p style="color: white; font-size: 1.1rem; margin-bottom: 0;">Visit us today or browse our mouth-watering menu to start your HerreBurger journey!</p>
    `;

    section.appendChild(title);
    section.appendChild(img);
    section.appendChild(info);
    section.appendChild(ctaSection);

    return section;
}

export default renderHome;
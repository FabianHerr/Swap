function renderMenu(){
    const section = document.createElement('section');
    section.id = 'menu';

    // Create big title
    const title = document.createElement('h1');
    title.textContent = 'Our Delicious Menu';
    
    // Create menu description
    const menuDescription = document.createElement('p');
    menuDescription.textContent = 'Discover our carefully crafted selection of gourmet burgers, appetizers, and desserts. Each dish is prepared with premium ingredients and served with our signature HerreBurger hospitality.';
    menuDescription.style.fontSize = '1.3rem';
    menuDescription.style.marginBottom = '40px';
    menuDescription.style.fontStyle = 'italic';
    
    // Create appetizers section
    const subtitle1 = document.createElement('h3');
    subtitle1.textContent = "🥨 Appetizers & Starters";

    const appetizersDescription = document.createElement('p');
    appetizersDescription.textContent = 'Start your meal right with our selection of crowd-pleasing appetizers, perfect for sharing or enjoying solo.';
    appetizersDescription.style.fontSize = '1.1rem';
    appetizersDescription.style.color = '#666';
    appetizersDescription.style.textAlign = 'left';
    appetizersDescription.style.marginBottom = '20px';

    const list1 = document.createElement('ul');
    const nachos = document.createElement('li');
    nachos.innerHTML = '<strong>Loaded Nachos</strong> - $12.99<br><span style="color: #666;">Crispy tortilla chips topped with melted aged cheddar, fresh jalapeños, house-made pico de gallo, and cool sour cream. Add guacamole +$3</span>';
    
    const wings = document.createElement('li');
    wings.innerHTML = '<strong>Buffalo Wings</strong> - $14.99<br><span style="color: #666;">Eight juicy chicken wings tossed in our signature buffalo sauce, served with celery sticks and creamy blue cheese dip. Choice of mild, medium, or hot</span>';
    
    const quesadilla = document.createElement('li');
    quesadilla.innerHTML = '<strong>Grilled Cheese Quesadilla</strong> - $9.99<br><span style="color: #666;">Flour tortilla filled with a blend of monterey jack and cheddar cheeses, grilled to golden perfection. Served with salsa and sour cream</span>';

    list1.appendChild(nachos);
    list1.appendChild(wings);
    list1.appendChild(quesadilla);

    // Create mains section
    const subtitle2 = document.createElement('h3');
    subtitle2.textContent = "🍔 Signature Burgers & Mains";

    const mainsDescription = document.createElement('p');
    mainsDescription.textContent = 'Our star attractions! Each burger is made with fresh, never-frozen beef and served on our signature brioche bun with crispy fries.';
    mainsDescription.style.fontSize = '1.1rem';
    mainsDescription.style.color = '#666';
    mainsDescription.style.textAlign = 'left';
    mainsDescription.style.marginBottom = '20px';

    const list2 = document.createElement('ul');
    const burger = document.createElement('li');
    burger.innerHTML = '<strong>The HerreBurger Classic</strong> - $16.99<br><span style="color: #666;">Our signature 1/3 lb beef patty, aged cheddar cheese, crisp lettuce, vine-ripened tomato, red onion, and our secret house sauce on a toasted brioche bun</span>';
    
    const veganBurger = document.createElement('li');
    veganBurger.innerHTML = '<strong>Plant-Based Paradise</strong> - $15.99<br><span style="color: #666;">Beyond Meat patty with vegan cheese, avocado, mixed greens, tomato, and herb aioli on a whole grain bun. Completely plant-based but full of flavor!</span>';
    
    const ribs = document.createElement('li');
    ribs.innerHTML = '<strong>BBQ Ribs Platter</strong> - $22.99<br><span style="color: #666;">Full rack of slow-cooked pork ribs glazed with our house BBQ sauce, served with coleslaw, baked beans, and cornbread. Fall-off-the-bone tender!</span>';

    const specialBurger = document.createElement('li');
    specialBurger.innerHTML = '<strong>The Spicy Challenger</strong> - $18.99<br><span style="color: #666;">Double beef patty with pepper jack cheese, jalapeños, chipotle mayo, and our fiery ghost pepper sauce. Not for the faint of heart! 🌶️</span>';

    list2.appendChild(burger);
    list2.appendChild(veganBurger);
    list2.appendChild(specialBurger);
    list2.appendChild(ribs);

    // Create desserts section
    const subtitle3 = document.createElement('h3');
    subtitle3.textContent = "🍰 Sweet Endings";

    const dessertsDescription = document.createElement('p');
    dessertsDescription.textContent = 'Complete your HerreBurger experience with our decadent desserts, all made fresh daily by our pastry team.';
    dessertsDescription.style.fontSize = '1.1rem';
    dessertsDescription.style.color = '#666';
    dessertsDescription.style.textAlign = 'left';
    dessertsDescription.style.marginBottom = '20px';

    const list3 = document.createElement('ul');
    const brownie = document.createElement('li');
    brownie.innerHTML = '<strong>Chocolate Fudge Brownie</strong> - $8.99<br><span style="color: #666;">Warm, gooey chocolate brownie made with Belgian chocolate, served with vanilla bean ice cream and hot fudge drizzle</span>';
    
    const churros = document.createElement('li');
    churros.innerHTML = '<strong>Cinnamon Sugar Churros</strong> - $7.99<br><span style="color: #666;">Fresh-fried churros dusted with cinnamon sugar, served with rich chocolate dipping sauce and dulce de leche</span>';
    
    const flan = document.createElement('li');
    flan.innerHTML = '<strong>Classic Crème Caramel</strong> - $6.99<br><span style="color: #666;">Silky smooth vanilla custard topped with golden caramel sauce, a perfect light finish to your meal</span>';

    const milkshake = document.createElement('li');
    milkshake.innerHTML = '<strong>Premium Milkshakes</strong> - $6.99<br><span style="color: #666;">Thick and creamy shakes made with premium ice cream. Choose from vanilla, chocolate, strawberry, or cookies & cream</span>';

    list3.appendChild(brownie);
    list3.appendChild(churros);
    list3.appendChild(flan);
    list3.appendChild(milkshake);

    // Add beverages section
    const subtitle4 = document.createElement('h3');
    subtitle4.textContent = "🥤 Beverages";

    const beveragesList = document.createElement('ul');
    const beverages = document.createElement('li');
    beverages.innerHTML = '<strong>Craft Sodas & Drinks</strong> - $3.99<br><span style="color: #666;">Coca-Cola, Sprite, Orange Fanta, Iced Tea, Lemonade, Coffee, or choose from our selection of craft sodas</span>';
    
    const beer = document.createElement('li');
    beer.innerHTML = '<strong>Local Craft Beer</strong> - $5.99<br><span style="color: #666;">Rotating selection of local craft beers on tap. Ask your server about today\'s featured brews!</span>';

    beveragesList.appendChild(beverages);
    beveragesList.appendChild(beer);

    // Assembly
    section.appendChild(title);
    section.appendChild(menuDescription);
    
    section.appendChild(subtitle1);
    section.appendChild(appetizersDescription);
    section.appendChild(list1);
    
    section.appendChild(subtitle2);
    section.appendChild(mainsDescription);
    section.appendChild(list2);
    
    section.appendChild(subtitle3);
    section.appendChild(dessertsDescription);
    section.appendChild(list3);
    
    section.appendChild(subtitle4);
    section.appendChild(beveragesList);

    return section;
}

export default renderMenu;
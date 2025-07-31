function renderAbout(){
  const section = document.createElement('section');
  section.setAttribute('id', 'about');

  const title = document.createElement('h2');
  title.textContent = 'About HerreBurger';

  // Story section
  const storyTitle = document.createElement('h3');
  storyTitle.textContent = '📖 Our Story';

  const paragraph1 = document.createElement('p');
  paragraph1.textContent = "HerreBurger was born from a simple yet powerful vision: to create the perfect burger experience that combines premium quality with genuine hospitality. Founded in 2025 by a team of culinary enthusiasts, we set out to revolutionize the local burger scene with our commitment to fresh, locally-sourced ingredients and innovative cooking techniques.";

  const paragraph2 = document.createElement('p');
  paragraph2.textContent = "What started as a dream in a small kitchen has grown into a beloved community gathering place. Every day, we hand-craft our signature patties, bake our brioche buns fresh, and prepare our secret sauces with the same passion and attention to detail that started it all.";

  // Mission section
  const missionTitle = document.createElement('h3');
  missionTitle.textContent = '🎯 Our Mission';

  const paragraph3 = document.createElement('p');
  paragraph3.textContent = "At HerreBurger, we believe that great food brings people together. Our mission is to serve not just exceptional burgers, but to create memorable experiences that turn first-time visitors into lifelong friends. Whether you're grabbing a quick lunch or celebrating with family, we're here to make every moment delicious.";

  // Values section
  const valuesTitle = document.createElement('h3');
  valuesTitle.textContent = '💎 What We Stand For';

  const valuesList = document.createElement('div');
  valuesList.style.display = 'grid';
  valuesList.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
  valuesList.style.gap = '20px';
  valuesList.style.margin = '20px 0';

  const qualityValue = document.createElement('div');
  qualityValue.style.padding = '20px';
  qualityValue.style.background = 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(247, 147, 30, 0.1) 100%)';
  qualityValue.style.borderRadius = '12px';
  qualityValue.style.border = '2px solid rgba(255, 107, 53, 0.2)';
  qualityValue.innerHTML = '<h4 style="color: #d62828; margin-bottom: 10px;">🥩 Premium Quality</h4><p style="margin: 0;">We source only the finest ingredients from trusted local suppliers, ensuring every bite meets our exacting standards.</p>';

  const sustainabilityValue = document.createElement('div');
  sustainabilityValue.style.padding = '20px';
  sustainabilityValue.style.background = 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(247, 147, 30, 0.1) 100%)';
  sustainabilityValue.style.borderRadius = '12px';
  sustainabilityValue.style.border = '2px solid rgba(255, 107, 53, 0.2)';
  sustainabilityValue.innerHTML = '<h4 style="color: #d62828; margin-bottom: 10px;">🌱 Sustainability</h4><p style="margin: 0;">We\'re committed to environmental responsibility through local sourcing, minimal waste practices, and eco-friendly packaging.</p>';

  const communityValue = document.createElement('div');
  communityValue.style.padding = '20px';
  communityValue.style.background = 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(247, 147, 30, 0.1) 100%)';
  communityValue.style.borderRadius = '12px';
  communityValue.style.border = '2px solid rgba(255, 107, 53, 0.2)';
  communityValue.innerHTML = '<h4 style="color: #d62828; margin-bottom: 10px;">🤝 Community First</h4><p style="margin: 0;">We\'re more than a restaurant - we\'re neighbors supporting local farmers, suppliers, and community initiatives.</p>';

  const inclusivityValue = document.createElement('div');
  inclusivityValue.style.padding = '20px';
  inclusivityValue.style.background = 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(247, 147, 30, 0.1) 100%)';
  inclusivityValue.style.borderRadius = '12px';
  inclusivityValue.style.border = '2px solid rgba(255, 107, 53, 0.2)';
  inclusivityValue.innerHTML = '<h4 style="color: #d62828; margin-bottom: 10px;">🌈 Inclusive Dining</h4><p style="margin: 0;">From classic beef to plant-based alternatives, we ensure everyone can enjoy the HerreBurger experience, regardless of dietary preferences.</p>';

  valuesList.appendChild(qualityValue);
  valuesList.appendChild(sustainabilityValue);
  valuesList.appendChild(communityValue);
  valuesList.appendChild(inclusivityValue);

  // Team section
  const teamTitle = document.createElement('h3');
  teamTitle.textContent = '👥 Meet the Team';

  const paragraph4 = document.createElement('p');
  paragraph4.textContent = "Behind every great burger is an even greater team. Our passionate chefs, friendly servers, and dedicated management work together to ensure your HerreBurger experience exceeds expectations. We're not just colleagues - we're a family united by our love for great food and exceptional service.";

  // Experience section
  const experienceTitle = document.createElement('h3');
  experienceTitle.textContent = '✨ The HerreBurger Experience';

  const paragraph5 = document.createElement('p');
  paragraph5.textContent = "Step into our warm, inviting atmosphere where the aroma of grilled burgers fills the air and friendly conversations flow freely. Whether you're dining solo, on a date, or with the whole family, our laid-back environment and attentive service create the perfect backdrop for any occasion.";

  const paragraph6 = document.createElement('p');
  paragraph6.textContent = "From the moment you walk through our doors to the last bite of your meal, we're committed to making your visit memorable. Come hungry, leave happy - that's the HerreBurger promise.";

  // Contact info
  const contactTitle = document.createElement('h3');
  contactTitle.textContent = '📍 Visit Us Today';

  const contactInfo = document.createElement('div');
  contactInfo.style.textAlign = 'center';
  contactInfo.style.padding = '25px';
  contactInfo.style.background = 'linear-gradient(135deg, #ff6b35, #f7931e)';
  contactInfo.style.borderRadius = '15px';
  contactInfo.style.color = 'white';
  contactInfo.style.marginTop = '30px';
  contactInfo.innerHTML = `
    <h4 style="color: white; margin-bottom: 15px;">Ready to taste the difference?</h4>
    <p style="color: white; font-size: 1.1rem; margin: 10px 0;">📍 123 Burger Street, Flavor Town</p>
    <p style="color: white; font-size: 1.1rem; margin: 10px 0;">📞 (555) HERRE-BURGER</p>
    <p style="color: white; font-size: 1.1rem; margin: 10px 0;">🕒 Open Daily: 11AM - 10PM</p>
    <p style="color: white; font-size: 1rem; margin-top: 15px; font-style: italic;">Follow us on social media @HerreBurger for daily specials and behind-the-scenes content!</p>
  `;

  // Assembly
  section.appendChild(title);
  section.appendChild(storyTitle);
  section.appendChild(paragraph1);
  section.appendChild(paragraph2);
  section.appendChild(missionTitle);
  section.appendChild(paragraph3);
  section.appendChild(valuesTitle);
  section.appendChild(valuesList);
  section.appendChild(teamTitle);
  section.appendChild(paragraph4);
  section.appendChild(experienceTitle);
  section.appendChild(paragraph5);
  section.appendChild(paragraph6);
  section.appendChild(contactTitle);
  section.appendChild(contactInfo);

  return section;
}

export default renderAbout;
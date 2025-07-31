import renderHome from './home.js';
import renderMenu from './menu.js';
import renderAbout from './about.js';
import './styles.css';

const content = document.getElementById('content');

// Display home page when home is clicked 
const homeBtn = document.querySelector('nav .home');
homeBtn.addEventListener('click', ()=>{
    content.innerHTML = '';
    content.appendChild(renderHome());
})

// Display menu page when menu is clicked 
const menuBtn = document.querySelector('nav .menu');
menuBtn.addEventListener('click', ()=>{
    content.innerHTML = '';
    content.appendChild(renderMenu());
})

// Display menu page when home is clicked 
const aboutBtn = document.querySelector('nav .about');
aboutBtn.addEventListener('click', ()=>{
    content.innerHTML = '';
    content.appendChild(renderAbout());
})
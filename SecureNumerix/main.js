
// Global state
const appState = {
  isAuthenticated: false,
  user: null,
  numbers: [],
  isRegistering: false
};

// DOM ready function
document.addEventListener('DOMContentLoaded', () => {
  // Check current page
  const currentPath = window.location.pathname;
  
  if (currentPath.includes('login.html')) {
    setupAuthPage();
  } else if (currentPath.includes('account.html')) {
    checkAuthentication();
    setupAccountPage();
  } else {
    // Index page
    checkAuthentication();
  }
});

// Authentication related functions
function setupAuthPage() {
  const authForm = document.getElementById('auth-form');
  const authTitle = document.getElementById('auth-title');
  const authButton = document.getElementById('auth-button');
  const toggleAuth = document.getElementById('toggle-auth');
  const errorMessage = document.getElementById('error-message');
  
  // Toggle between login and register
  toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    appState.isRegistering = !appState.isRegistering;
    
    if (appState.isRegistering) {
      authTitle.textContent = 'Create your account';
      authButton.textContent = 'Sign up';
      toggleAuth.textContent = 'Already have an account? Sign in';
    } else {
      authTitle.textContent = 'Sign in to your account';
      authButton.textContent = 'Sign in';
      toggleAuth.textContent = 'Don\'t have an account? Sign up';
    }
  });
  
  // Handle form submission
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.style.display = 'none';
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const recaptchaResponse = grecaptcha?.getResponse();
    
    if (!recaptchaResponse) {
      showError('Please complete the reCAPTCHA verification');
      return;
    }
    
    try {
      const endpoint = appState.isRegistering ? '/api/register' : '/api/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          recaptchaToken: recaptchaResponse
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Authentication failed');
      }
      
      const userData = await response.json();
      appState.isAuthenticated = true;
      appState.user = userData;
      
      // Store authentication status in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Redirect to account page
      window.location.href = 'account.html';
    } catch (error) {
      showError(error.message);
    }
  });
  
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }
}

function checkAuthentication() {
  const storedUser = localStorage.getItem('user');
  
  if (storedUser) {
    try {
      appState.user = JSON.parse(storedUser);
      appState.isAuthenticated = true;
      
      // If on index page and authenticated, redirect to account page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('account.html') && !currentPath.includes('login.html')) {
        const loginButton = document.querySelector('nav .button');
        if (loginButton) {
          loginButton.textContent = 'My Account';
          loginButton.href = 'account.html';
        }
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem('user');
    }
  } else if (window.location.pathname.includes('account.html')) {
    // Redirect to login if trying to access account page without auth
    window.location.href = 'login.html';
  }
}

// Account page functionality
function setupAccountPage() {
  const usernameDisplay = document.getElementById('username-display');
  const logoutButton = document.getElementById('logout-button');
  const addNumberBtn = document.getElementById('add-number-btn');
  const newNumberInput = document.getElementById('new-number');
  const numbersContainer = document.getElementById('numbers-container');
  const chatInput = document.getElementById('chat-input');
  const sendMessageBtn = document.getElementById('send-message-btn');
  const chatMessages = document.getElementById('chat-messages');
  
  // Display username
  if (appState.user) {
    usernameDisplay.textContent = `Welcome, ${appState.user.username}!`;
  }
  
  // Handle logout
  logoutButton.addEventListener('click', async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and redirect
      localStorage.removeItem('user');
      window.location.href = 'index.html';
    }
  });
  
  // Load numbers
  loadNumbers();
  
  // Add number
  addNumberBtn.addEventListener('click', async () => {
    const value = parseInt(newNumberInput.value);
    if (isNaN(value)) {
      alert('Please enter a valid number');
      return;
    }
    
    try {
      const response = await fetch('/api/numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add number');
      }
      
      const newNumber = await response.json();
      appState.numbers.push(newNumber);
      renderNumbers();
      newNumberInput.value = '';
    } catch (error) {
      console.error('Error adding number:', error);
      alert('Failed to add number');
    }
  });
  
  // Chat functionality
  sendMessageBtn.addEventListener('click', async () => {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addChatMessage(message, 'user');
    chatInput.value = '';
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      // Add bot response to chat
      addChatMessage(data.message, 'bot');
    } catch (error) {
      console.error('Chat error:', error);
      addChatMessage('Sorry, there was an error processing your request.', 'bot');
    }
  });
  
  // Enter key for chat
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessageBtn.click();
    }
  });
  
  async function loadNumbers() {
    try {
      const response = await fetch('/api/numbers');
      if (!response.ok) {
        throw new Error('Failed to fetch numbers');
      }
      
      appState.numbers = await response.json();
      renderNumbers();
    } catch (error) {
      console.error('Error loading numbers:', error);
    }
  }
  
  function renderNumbers() {
    numbersContainer.innerHTML = '';
    
    if (appState.numbers.length === 0) {
      numbersContainer.innerHTML = '<p>No numbers added yet.</p>';
      return;
    }
    
    appState.numbers.forEach(num => {
      const numberItem = document.createElement('div');
      numberItem.className = 'number-item';
      numberItem.innerHTML = `
        <span>${num.value}</span>
        <button class="delete-number" data-id="${num.id}">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
          </svg>
        </button>
      `;
      numbersContainer.appendChild(numberItem);
      
      // Add delete event
      const deleteBtn = numberItem.querySelector('.delete-number');
      deleteBtn.addEventListener('click', () => deleteNumber(num.id));
    });
  }
  
  async function deleteNumber(id) {
    try {
      const response = await fetch(`/api/numbers/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete number');
      }
      
      // Update local state
      appState.numbers = appState.numbers.filter(num => num.id !== id);
      renderNumbers();
    } catch (error) {
      console.error('Error deleting number:', error);
      alert('Failed to delete number');
    }
  }
  
  function addChatMessage(text, type) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${type}-message`;
    messageElement.textContent = text;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}


// This is a highly simplified version of the client application
// Note: A complete conversion from TypeScript React to vanilla JS
// would require more extensive work

// Basic state management
const appState = {
  user: null,
  numbers: [],
  isLoading: false,
  error: null,
  currentPage: 'landing' // 'landing', 'auth', 'home'
};

// Utility function to make API calls
async function fetchAPI(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Something went wrong');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Check if user is logged in
async function checkAuth() {
  try {
    appState.isLoading = true;
    const user = await fetchAPI('/api/user');
    appState.user = user;
    appState.currentPage = 'home';
  } catch (error) {
    appState.user = null;
    appState.currentPage = 'landing';
  } finally {
    appState.isLoading = false;
    renderApp();
  }
}

// Login function
async function login(username, password, recaptchaToken) {
  try {
    appState.isLoading = true;
    appState.error = null;
    const user = await fetchAPI('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, recaptchaToken })
    });
    appState.user = user;
    appState.currentPage = 'home';
    fetchNumbers();
  } catch (error) {
    appState.error = error.message || 'Login failed';
  } finally {
    appState.isLoading = false;
    renderApp();
  }
}

// Register function
async function register(username, password, recaptchaToken) {
  try {
    appState.isLoading = true;
    appState.error = null;
    const user = await fetchAPI('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, recaptchaToken })
    });
    appState.user = user;
    appState.currentPage = 'home';
  } catch (error) {
    appState.error = error.message || 'Registration failed';
  } finally {
    appState.isLoading = false;
    renderApp();
  }
}

// Logout function
async function logout() {
  try {
    await fetchAPI('/api/logout', { method: 'POST' });
    appState.user = null;
    appState.numbers = [];
    appState.currentPage = 'landing';
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    renderApp();
  }
}

// Fetch numbers
async function fetchNumbers() {
  if (!appState.user) return;
  
  try {
    appState.isLoading = true;
    const numbers = await fetchAPI('/api/numbers');
    appState.numbers = numbers;
  } catch (error) {
    console.error('Error fetching numbers:', error);
  } finally {
    appState.isLoading = false;
    renderApp();
  }
}

// Add number
async function addNumber(value) {
  try {
    await fetchAPI('/api/numbers', {
      method: 'POST',
      body: JSON.stringify({ value: parseInt(value) })
    });
    fetchNumbers();
  } catch (error) {
    console.error('Error adding number:', error);
  }
}

// Delete number
async function deleteNumber(id) {
  try {
    await fetchAPI(`/api/numbers/${id}`, { method: 'DELETE' });
    fetchNumbers();
  } catch (error) {
    console.error('Error deleting number:', error);
  }
}

// Send chat message
async function sendChatMessage(message) {
  try {
    const response = await fetchAPI('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    return response.message;
  } catch (error) {
    console.error('Chat error:', error);
    return "Sorry, I couldn't process your message.";
  }
}

// Render functions
function renderLandingPage() {
  return `
    <div class="min-h-screen bg-gray-100">
      <nav class="bg-white shadow-sm p-4">
        <div class="container mx-auto flex justify-between items-center">
          <div class="flex items-center">
            <svg class="h-6 w-6 text-blue-600 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span class="font-semibold text-xl">SecureNum</span>
          </div>
          <button onclick="appState.currentPage = 'auth'; renderApp();" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            Get Started
          </button>
        </div>
      </nav>
      
      <div class="container mx-auto py-12 px-4">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">Secure Number Management Platform</h1>
          <p class="text-xl text-gray-600 mb-8">Store, organize, and manage your numbers with maximum security.</p>
          <button onclick="appState.currentPage = 'auth'; renderApp();" class="px-6 py-3 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 text-lg">
            Get Started Now
          </button>
        </div>
        
        <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-semibold mb-3">Secure Storage</h2>
            <p class="text-gray-600">Your numbers are stored with industry-leading encryption protocols.</p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-semibold mb-3">Easy Management</h2>
            <p class="text-gray-600">Add, delete, and organize your numerical data with our intuitive interface.</p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-semibold mb-3">24/7 Access</h2>
            <p class="text-gray-600">Access your numbers anytime, anywhere, from any device.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAuthPage() {
  return `
    <div class="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center">
          <svg class="h-12 w-12 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          ${appState.error ? `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">${appState.error}</div>` : ''}
          
          <form id="authForm" class="space-y-6">
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
              <div class="mt-1">
                <input id="username" name="username" type="text" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <div class="mt-1">
                <input id="password" name="password" type="password" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              </div>
            </div>

            <div class="g-recaptcha" data-sitekey="${process.env.VITE_RECAPTCHA_SITE_KEY}"></div>

            <div class="flex items-center justify-between">
              <div class="text-sm">
                <a href="#" id="toggleAuth" class="font-medium text-blue-600 hover:text-blue-500">
                  Don't have an account? Sign up
                </a>
              </div>
            </div>

            <div>
              <button type="submit" id="authButton" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function renderHomePage() {
  return `
    <div class="min-h-screen bg-gray-100">
      <nav class="bg-white shadow-sm p-4">
        <div class="container mx-auto flex justify-between items-center">
          <div class="flex items-center">
            <svg class="h-6 w-6 text-blue-600 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span class="font-semibold text-xl">SecureNum</span>
          </div>
          <div class="flex items-center">
            <span class="mr-4">Welcome, ${appState.user?.username}</span>
            <button onclick="logout()" class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      <div class="container mx-auto py-8 px-4">
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 class="text-xl font-semibold mb-4">Add a Number</h2>
          <form id="addNumberForm" class="flex items-center">
            <input type="number" id="numberInput" class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm mr-4" placeholder="Enter a number">
            <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              Add Number
            </button>
          </form>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">Your Numbers</h2>
          <div id="numbersList" class="space-y-2">
            ${appState.isLoading ? 
              '<p class="text-gray-500">Loading...</p>' : 
              appState.numbers.length === 0 ? 
                '<p class="text-gray-500">No numbers yet. Add your first number above!</p>' :
                appState.numbers.map(num => `
                  <div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <span>${num.value}</span>
                    <button onclick="deleteNumber(${num.id})" class="text-red-600 hover:text-red-800">
                      <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                `).join('')
            }
          </div>
        </div>
      </div>

      <div id="chatButton" class="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg cursor-pointer hover:bg-blue-700">
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      
      <div id="chatWindow" class="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col hidden">
        <div class="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <span>AI Assistant</span>
          <svg id="closeChatBtn" class="h-5 w-5 cursor-pointer" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div id="chatMessages" class="flex-1 p-4 overflow-y-auto space-y-2"></div>
        <form id="chatForm" class="p-4 border-t">
          <div class="flex">
            <input type="text" id="chatInput" class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md" placeholder="Type a message...">
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700">
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// Main render function
function renderApp() {
  const root = document.getElementById('root');
  let content = '';
  
  switch (appState.currentPage) {
    case 'landing':
      content = renderLandingPage();
      break;
    case 'auth':
      content = renderAuthPage();
      break;
    case 'home':
      content = renderHomePage();
      break;
    default:
      content = renderLandingPage();
  }
  
  root.innerHTML = content;
  
  // Add event listeners after rendering
  setupEventListeners();
}

// Set up event listeners for interactive elements
function setupEventListeners() {
  if (appState.currentPage === 'auth') {
    // Auth form
    const form = document.getElementById('authForm');
    const toggleBtn = document.getElementById('toggleAuth');
    const authBtn = document.getElementById('authButton');
    let isLogin = true;
    
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        authBtn.textContent = isLogin ? 'Sign in' : 'Sign up';
        toggleBtn.textContent = isLogin 
          ? "Don't have an account? Sign up" 
          : 'Already have an account? Sign in';
      });
    }
    
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const recaptchaToken = grecaptcha.getResponse();
        
        if (!recaptchaToken) {
          appState.error = 'Please complete the reCAPTCHA verification';
          renderApp();
          return;
        }
        
        if (isLogin) {
          login(username, password, recaptchaToken);
        } else {
          register(username, password, recaptchaToken);
        }
      });
    }
  }
  
  if (appState.currentPage === 'home') {
    // Number form
    const addNumberForm = document.getElementById('addNumberForm');
    if (addNumberForm) {
      addNumberForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = document.getElementById('numberInput').value;
        if (value) {
          addNumber(value);
          document.getElementById('numberInput').value = '';
        }
      });
    }
    
    // Chat functionality
    const chatButton = document.getElementById('chatButton');
    const chatWindow = document.getElementById('chatWindow');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatForm = document.getElementById('chatForm');
    const chatMessages = document.getElementById('chatMessages');
    
    if (chatButton && chatWindow) {
      chatButton.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
      });
      
      if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
          chatWindow.classList.add('hidden');
        });
      }
      
      if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const chatInput = document.getElementById('chatInput');
          const message = chatInput.value.trim();
          
          if (!message) return;
          
          // Add user message to chat
          chatMessages.innerHTML += `
            <div class="flex justify-end">
              <div class="bg-blue-100 p-2 rounded-lg max-w-xs">
                <p>${message}</p>
              </div>
            </div>
          `;
          
          chatInput.value = '';
          chatMessages.scrollTop = chatMessages.scrollHeight;
          
          // Get AI response
          const response = await sendChatMessage(message);
          
          // Add AI response to chat
          chatMessages.innerHTML += `
            <div class="flex justify-start">
              <div class="bg-gray-100 p-2 rounded-lg max-w-xs">
                <p>${response}</p>
              </div>
            </div>
          `;
          
          chatMessages.scrollTop = chatMessages.scrollHeight;
        });
      }
    }
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  // Create a public directory if it doesn't exist
  if (!document.getElementById('root')) {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
  }
  
  checkAuth();
});

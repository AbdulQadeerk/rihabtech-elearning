// // Common API base URL for all requests
// let API_BASE_URL: string;

// if (typeof window !== 'undefined') {
//   const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
//   API_BASE_URL = isLocalhost
//     ? 'https://zktutorials.baawanerp.com/'
//     : 'http://zktutorials.baawanerp.com/';
// } else {
//   // Fallback for environments where window is not defined (SSR, Node.js)
//   API_BASE_URL = 'http://zktutorials.baawanerp.com/';
// }

// export { API_BASE_URL };
export const API_BASE_URL_IMG = 'https://zktutorials.baawanerp.com/';
export const API_BASE_URL = 'https://zktutorials.baawanerp.com/api/1/';
// export const API_BASE_URL = 'https://103.87.175.111:8152/api/1/';
//export const API_BASE_URL_IMG = 'https://localhost:7219/';
//export const API_BASE_URL = 'https://localhost:7219/api/1/';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // Test reading from a collection
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    console.log('Firebase read test successful');
    
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};

export const testFirestoreWrite = async () => {
  try {
    console.log('Testing Firestore write permissions...');
    
    // Test writing to a test collection
    const testCollection = collection(db, 'test');
    const docRef = await addDoc(testCollection, {
      test: true,
      timestamp: serverTimestamp(),
      message: 'Test document created successfully'
    });
    
    console.log('Firestore write test successful, document ID:', docRef.id);
    return true;
  } catch (error) {
    console.error('Firestore write test failed:', error);
    return false;
  }
};

export const testChatConversationWrite = async () => {
  try {
    console.log('Testing chat conversation write permissions...');
    
    // Test writing to the chat conversations collection
    const conversationsCollection = collection(db, 'chatConversations');
    const docRef = await addDoc(conversationsCollection, {
      participants: ['test-user-1', 'test-user-2'],
      participantNames: ['Test User 1', 'Test User 2'],
      lastMessage: 'Test message',
      lastMessageTime: serverTimestamp(),
      unreadCount: 0,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Chat conversation write test successful, document ID:', docRef.id);
    return true;
  } catch (error) {
    console.error('Chat conversation write test failed:', error);
    return false;
  }
};

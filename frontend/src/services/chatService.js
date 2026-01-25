import db from "../firebase";
import {
    collection,
    doc,
    addDoc,
    setDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    orderBy,
    limit,
    startAfter,
    onSnapshot,
    serverTimestamp,
    where,
  } from "firebase/firestore";

  export const makeChatId = (UserId1, UserId2) => [UserId1, UserId2].sort().join("_");
  
  async function getOrCreateChat(UserId1, UserId2) {
    const chatId = makeChatId(UserId1, UserId2);
    const chatsRef = doc(db, "chats", chatId); // Reference to 'chat' firebase collection
    const snap = await getDoc(chatsRef);

    // If chat exists return it 
    if (snap.exists()){
      return {
        ...snap.data(),
        id: snap.id
      }      
    } 
    else {
      await setDoc( chatsRef, {
        participants: [UserId1, UserId2],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null,
        lastMessageAt: null,
        unreadCounts: { [UserId1]: 0, [UserId2]: 0 }
      });
    }
  }


    async function sendMessage(chatId, senderId, text){
      const messagesRef = collection(db, "chats", chatId, "messages") ; // reference to messages subcollection inside chats
      // Store new message in "messages" subcollection
      await addDoc(messagesRef, {
        text: text,
        senderId: senderId,
        timestamp: serverTimestamp(),
        read: false
      })

      const chatRef = doc(db, "chats", chatId) // reference to  current chat collection 

      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }

    function subscribeToMessages(chatId, callback){
      const messagesRef = collection(db, "chats", chatId, "messages") ; // reference to messages subcollection inside chats
      const query = query(messagesRef, orderBy("timestamp", "asc"))
      const unsubscribe = onSnapshot(query, (snapshot) =>{
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(messages);
      })

      return unsubscribe
    }

    function subscribeToChatList(UserId1, callback){
      
    }









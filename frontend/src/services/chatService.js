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

  export const makeChatId = (uidA, uidB) => [uidA, uidB].sort().join("_");
  
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
      lastMessageAt: null,
      unreadCounts: participants.reduce((acc, uid) => ({ ...acc, [uid]: 0 }), {}),
    });
  }
  
  return chatRef;   
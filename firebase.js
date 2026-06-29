import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyANWIQpyD5_KpWt2rHibNoyDojzFDzAhcI",
  authDomain: "werewolf-ec2b0.firebaseapp.com",
  projectId: "werewolf-ec2b0",
  storageBucket: "werewolf-ec2b0.firebasestorage.app",
  messagingSenderId: "169170370044",
  appId: "1:169170370044:web:bf4811435070d61f0f8679",
  measurementId: "G-L4TCPXT38J"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

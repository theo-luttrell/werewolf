import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyANWIQpyD5_KpWt2rHibNoyDojzFDzAhcI",
  authDomain: "werewolf-ec2b0.firebaseapp.com",
  projectId: "werewolf-ec2b0",
  storageBucket: "werewolf-ec2b0.firebasestorage.app",
  messagingSenderId: "169170370044",
  appId: "1:169170370044:web:bf4811435070d61f0f8679",
  measurementId: "G-L4TCPXT38J",
  databaseURL: "https://werewolf-ec2b0-default-rtdb.australia-southeast2.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function test() {
  console.log("Setting...");
  try {
    await set(ref(db, "test"), { timestamp: Date.now() });
    console.log("Success with default-rtdb!");
    process.exit(0);
  } catch (e) {
    console.error(e);
  }
}

test();

// Importar os módulos do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithRedirect, getRedirectResult } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-storage.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBtYUy_D4nugLpvWbSRZJ8Uzna_LPXwEsE",
  authDomain: "info-mural.firebaseapp.com",
  projectId: "info-mural",
  storageBucket: "info-mural.appspot.com",
  messagingSenderId: "58029158214",
  appId: "1:58029158214:web:a0e63270e57c19306e7f47",
  measurementId: "G-1FST396BCT"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Função de Login
function loginAdmin() {
  const provider = new GoogleAuthProvider();
  signInWithRedirect(auth, provider);
}

// Obter resultado do redirecionamento
getRedirectResult(auth)
  .then((result) => {
    if (result) {
      console.log("Usuário autenticado:", result.user);
      document.getElementById('admin-panel').style.display = 'block'; // Exibe painel admin
    }
  })
  .catch((error) => {
    console.error("Erro na autenticação:", error);
  });

// Função para postar nova mensagem
const postMessage = async () => {
  const title = document.getElementById("title").value;
  const text = document.getElementById("new-message").value;
  const category = document.getElementById("category").value;

  if (!auth.currentUser) {
    console.error("Usuário não autenticado. Não é possível postar a mensagem.");
    return; // Não permite postagem se o usuário não estiver autenticado
  }

  if (!title || !text || !category) {
    console.error("Título, texto e categoria são obrigatórios!");
    return; // Retorna se os campos obrigatórios não forem preenchidos
  }

  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;
  const file = document.getElementById("file-upload").files[0];

  let imageUrl = "";
  if (file) {
    const storageRef = ref(storage, `files/${file.name}`);
    try {
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
    } catch (uploadError) {
      console.error("Erro ao fazer upload da imagem:", uploadError);
    }
  }

  try {
    await addDoc(collection(db, "messages"), {
      title,
      text,
      category,
      imageUrl,
      startDate,
      endDate,
      timestamp: new Date()
    });
    console.log("Mensagem postada com sucesso!");
    // Limpar os campos após a postagem
    document.getElementById("title").value = "";
    document.getElementById("new-message").value = "";
    document.getElementById("file-upload").value = "";
  } catch (error) {
    console.error("Erro ao adicionar documento:", error);
  }
};

// Verificar Autenticação e Exibir Painel
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById('admin-panel').style.display = 'block';
  } else {
    document.getElementById('admin-panel').style.display = 'none';
  }
});

// Adicionar event listeners
document.getElementById("admin-login-btn").addEventListener("click", loginAdmin);
document.getElementById("post-message-btn").addEventListener("click", postMessage);

// Função para carregar e filtrar mensagens
const loadMessages = (category = "", searchTerm = "") => {
  const messagesRef = collection(db, "messages");
  let q = query(messagesRef);

  if (category) {
    q = query(messagesRef, where("category", "==", category));
  }

  onSnapshot(q, (snapshot) => {
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!searchTerm || data.text.includes(searchTerm) || data.title.includes(searchTerm)) {
        displayMessage(data);
      }
    });
  });
};

// Função para exibir uma mensagem no mural
const displayMessage = (data) => {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

  messageDiv.innerHTML = `<h3>${data.title}</h3><p>${data.text}</p><p><strong>Categoria:</strong> ${data.category}</p>`;

  if (data.imageUrl) {
    const img = document.createElement("img");
    img.src = data.imageUrl;
    messageDiv.appendChild(img);
  }

  document.getElementById("messages").appendChild(messageDiv);
};

// Filtrar mensagens ao buscar
document.getElementById("search").addEventListener("input", (e) => {
  loadMessages("", e.target.value);
});

document.getElementById("category-filter").addEventListener("change", (e) => {
  loadMessages(e.target.value);
});

// Carregar mensagens inicialmente
loadMessages();

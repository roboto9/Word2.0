/* ═══════════════════════════════════════════════
   CONFIGURATION
   ► Remplacez APPS_SCRIPT_URL par l'URL de déploiement
     de votre Google Apps Script Web App.
═══════════════════════════════════════════════ */
const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyL-Wq_eaOBrav28d0Y78KalV4U98KrEbIb_FUpviRbuFUhSbInsk-aH3fJS5_5w2qD0g/exec",
  WHATSAPP_NUMBER: "+241074004694",
  ADMIN_SECRET:    "mamayo36&",
  FREE_VIDEO_URL:  "https://roboto9.github.io/Word2.0/deuxième-partie.mp4"
};

/* ═══════════════════════════════════════════════
   ÉTAT
═══════════════════════════════════════════════ */
let currentUser = null; // { name, email, access: 'free'|'full' }

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  // Masquer le loading overlay
  setTimeout(() => {
    document.getElementById("loadingOverlay").classList.add("fade-out");
    setTimeout(() => document.getElementById("loadingOverlay").classList.add("hidden"), 400);
  }, 600);

  // Construire l'URL WhatsApp
  const waMsg = encodeURIComponent(
    "Bonjour, je suis intéressé(e) par la formation Word complète et je suis prêt(e) à effectuer le paiement."
  );
  document.getElementById("whatsappBtn").href =
    `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${waMsg}`;

  // Restaurer session
  const saved = sessionStorage.getItem("fw_user");
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      updateUIForUser();
    } catch { sessionStorage.removeItem("fw_user"); }
  }

  bindEvents();
});

/* ═══════════════════════════════════════════════
   BINDING DES ÉVÉNEMENTS
═══════════════════════════════════════════════ */
function bindEvents() {
  // Navbar
  document.getElementById("navLoginBtn").addEventListener("click", () => openModal("login"));
  document.getElementById("navRegisterBtn").addEventListener("click", () => openModal("register"));
  document.getElementById("heroStartBtn").addEventListener("click", () => {
    if (currentUser) {
      document.getElementById("modules").scrollIntoView({ behavior: "smooth" });
    } else {
      openModal("register");
    }
  });

  // Fermer modal
  document.getElementById("closeModal").addEventListener("click", closeModal);
  document.getElementById("authModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("authModal")) closeModal();
  });

  // Onglets modal
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Auth
  document.getElementById("btnLogin").addEventListener("click", handleLogin);
  document.getElementById("btnRegister").addEventListener("click", handleRegister);
  document.getElementById("btnLogout").addEventListener("click", handleLogout);

  // Entrée clavier
  ["loginEmail", "loginPassword"].forEach(id => {
    document.getElementById(id).addEventListener("keydown", e => { if (e.key === "Enter") handleLogin(); });
  });
  ["regName", "regEmail", "regPassword"].forEach(id => {
    document.getElementById(id).addEventListener("keydown", e => { if (e.key === "Enter") handleRegister(); });
  });

  // Module gratuit — ouvre le player (avec sélecteur fichier local)
  document.getElementById("btnModule2").addEventListener("click", () => {
    if (!currentUser) { openModal("register"); return; }
    openPlayer();
  });

  // Modules payants
  ["btnModule1", "btnModule3", "btnBonus"].forEach(id => {
    document.getElementById(id).addEventListener("click", () => {
      if (!currentUser) { openModal("register"); return; }
      if (currentUser.access === "full") {
        document.getElementById("fullAccessSection").classList.remove("hidden");
        document.getElementById("fullAccessSection").scrollIntoView({ behavior: "smooth" });
      } else {
        document.getElementById("ctaSection").scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Fermer player
  document.getElementById("closePlayer").addEventListener("click", closePlayer);

  // Sélecteur de fichier vidéo local
  document.getElementById("videoFilePicker").addEventListener("change", handleVideoFile);
}

/* ═══════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════ */
function openModal(tab = "login") {
  document.getElementById("authModal").classList.remove("hidden");
  switchTab(tab);
  clearMessages();
  document.body.style.overflow = "hidden";
}
function closeModal() {
  document.getElementById("authModal").classList.add("hidden");
  document.body.style.overflow = "";
}
function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.tab === tab)
  );
  document.querySelectorAll(".tab-content").forEach(c =>
    c.classList.toggle("active", c.id === `tab-${tab}`)
  );
}
function clearMessages() {
  ["loginMsg", "registerMsg"].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = "";
    el.className = "form-msg";
  });
}
function setMsg(elemId, text, type = "error") {
  const el = document.getElementById(elemId);
  el.textContent = text;
  el.className = `form-msg ${type}`;
}

/* ═══════════════════════════════════════════════
   AUTHENTIFICATION — Google Apps Script
═══════════════════════════════════════════════ */
async function appsScriptRequest(action, payload) {
  try {
    const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action, ...payload })
    });
    return await res.json();
  } catch {
    return { success: false, message: "Erreur réseau. Vérifiez votre connexion." };
  }
}

async function handleLogin() {
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!email || !password) { setMsg("loginMsg", "Veuillez remplir tous les champs."); return; }

  const btn = document.getElementById("btnLogin");
  btn.textContent = "Connexion…"; btn.disabled = true;
  const data = await appsScriptRequest("login", { email, password });
  btn.textContent = "Se connecter"; btn.disabled = false;

  if (data.success) {
    currentUser = { name: data.name, email: data.email, access: data.access };
    sessionStorage.setItem("fw_user", JSON.stringify(currentUser));
    closeModal();
    updateUIForUser();
  } else {
    setMsg("loginMsg", data.message || "Identifiants incorrects.");
  }
}

async function handleRegister() {
  const name     = document.getElementById("regName").value.trim();
  const email    = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;

  if (!name || !email || !password) { setMsg("registerMsg", "Veuillez remplir tous les champs."); return; }
  if (password.length < 6) { setMsg("registerMsg", "Le mot de passe doit contenir au moins 6 caractères."); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMsg("registerMsg", "Adresse e-mail invalide."); return; }

  const btn = document.getElementById("btnRegister");
  btn.textContent = "Création…"; btn.disabled = true;
  const data = await appsScriptRequest("register", { name, email, password });
  btn.textContent = "Créer mon compte gratuit"; btn.disabled = false;

  if (data.success) {
    currentUser = { name: data.name, email: data.email, access: "free" };
    sessionStorage.setItem("fw_user", JSON.stringify(currentUser));
    closeModal();
    updateUIForUser();
  } else {
    setMsg("registerMsg", data.message || "Erreur lors de la création du compte.");
  }
}

function handleLogout() {
  currentUser = null;
  sessionStorage.removeItem("fw_user");
  updateUIForUser();
  closePlayer();
  document.getElementById("fullAccessSection").classList.add("hidden");
}

/* ═══════════════════════════════════════════════
   UI SELON L'UTILISATEUR
═══════════════════════════════════════════════ */
function updateUIForUser() {
  const navGuest = document.getElementById("navGuest");
  const navUser  = document.getElementById("navUser");
  const badge    = document.getElementById("userAccessBadge");
  const userName = document.getElementById("userNameDisplay");

  if (!currentUser) {
    navGuest.classList.remove("hidden");
    navUser.classList.add("hidden");
    resetLockedModules();
    document.getElementById("ctaSection").classList.remove("hidden");
    document.getElementById("fullAccessSection").classList.add("hidden");
    return;
  }

  navGuest.classList.add("hidden");
  navUser.classList.remove("hidden");
  userName.textContent = currentUser.name.split(" ")[0];

  if (currentUser.access === "full") {
    badge.textContent = "Accès complet";
    badge.className = "user-badge full";
    unlockAllModules();
    document.getElementById("fullAccessSection").classList.remove("hidden");
    document.getElementById("ctaSection").classList.add("hidden");
    document.getElementById("fullAccessSection").scrollIntoView({ behavior: "smooth" });
  } else {
    badge.textContent = "Accès gratuit";
    badge.className = "user-badge free";
    resetLockedModules();
    document.getElementById("ctaSection").classList.remove("hidden");
  }
}

function unlockAllModules() {
  ["mod1", "mod3", "modBonus"].forEach(id => {
    const card = document.getElementById(id);
    if (!card) return;
    card.classList.remove("locked");
    const btn = card.querySelector(".btn-module");
    btn.classList.remove("premium-btn");
    btn.innerHTML = "Voir le contenu";
  });
}

function resetLockedModules() {
  [
    { id: "mod1",     label: "Accès complet" },
    { id: "mod3",     label: "Accès complet" },
    { id: "modBonus", label: "Accès complet" },
  ].forEach(({ id, label }) => {
    const card = document.getElementById(id);
    if (!card) return;
    card.classList.add("locked");
    const btn = card.querySelector(".btn-module");
    btn.classList.add("premium-btn");
    btn.innerHTML = `<span class="lock-icon">🔒</span> ${label}`;
  });
}

/* ═══════════════════════════════════════════════
   PLAYER — VIDÉO LOCALE
═══════════════════════════════════════════════ */
function openPlayer() {
  const section = document.getElementById("playerSection");
  section.classList.remove("hidden");
  section.scrollIntoView({ behavior: "smooth" });

  // Réinitialiser l'état du picker si aucune vidéo chargée
  const video = document.getElementById("mainVideo");
  video.src = CONFIG.FREE_VIDEO_URL;
  document.getElementById("videoPickerWrap").classList.add("hidden");
  document.getElementById("videoContainer").classList.remove("hidden");
}

function showPicker() {
  document.getElementById("videoPickerWrap").classList.remove("hidden");
  document.getElementById("videoContainer").classList.add("hidden");
}

function handleVideoFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const video = document.getElementById("mainVideo");
  video.src = url;
  document.getElementById("videoPickerWrap").classList.add("hidden");
  document.getElementById("videoContainer").classList.remove("hidden");
  video.play().catch(() => {});
}

function closePlayer() {
  const section = document.getElementById("playerSection");
  const video   = document.getElementById("mainVideo");
  video.pause();
  if (video.src && video.src !== window.location.href) {
    URL.revokeObjectURL(video.src);
  }
  video.removeAttribute("src");
  video.load();
  // Remettre le picker pour la prochaine ouverture
  document.getElementById("videoFilePicker").value = "";
  showPicker();
  section.classList.add("hidden");
}

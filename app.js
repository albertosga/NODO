const skills = [
  "Todos",
  "3D",
  "Animación",
  "Dibujo",
  "UI/UX",
  "Branding",
  "Fotografía",
  "Motion Graphics",
  "Ilustración",
  "Video",
  "Web"
];

const subscriptionPlans = {
  free: { name: "Estudiante gratuito", price: "$0 MXN", period: "Sin costo" },
  monthly: { name: "Plan mensual", price: "$20 MXN", period: "mensual" },
  annual: { name: "Plan anual", price: "$200 MXN", period: "anual" }
};

const contractorTrialDays = 7;
const maxProjectFileSize = 5 * 1024 * 1024;

const storageKeys = {
  session: "nodo_session_v2",
  profiles: "nodo_profiles_v2",
  projects: "nodo_projects_v2",
  jobs: "nodo_jobs_v2",
  conversations: "nodo_conversations_v2",
  notifications: "nodo_notifications_v2",
  users: "nodo_users_v1"
};

const defaultProjects = [
  {
    id: crypto.randomUUID(),
    title: "Personaje 3D para videojuego",
    skill: "3D",
    description: "Modelado, texturizado y presentación de personaje estilizado para un universo interactivo.",
    author: "Alberto Soriano",
    color: "#1578d4",
    mine: false
  },
  {
    id: crypto.randomUUID(),
    title: "App móvil para galería creativa",
    skill: "UI/UX",
    description: "Wireframes, prototipo navegable y sistema visual para exposición de proyectos universitarios.",
    author: "María López",
    color: "#ff7a18",
    mine: false
  },
  {
    id: crypto.randomUUID(),
    title: "Animación de logo para marca deportiva",
    skill: "Motion Graphics",
    description: "Animación corta con transiciones dinámicas para redes sociales y pantallas publicitarias.",
    author: "Diego Ramos",
    color: "#0a2a5e",
    mine: false
  },
  {
    id: crypto.randomUUID(),
    title: "Storyboard para corto animado",
    skill: "Dibujo",
    description: "Secuencia visual con composición, actuación y ritmo narrativo para producción animada.",
    author: "Sofía Pérez",
    color: "#ff9f1c",
    mine: false
  },
  {
    id: crypto.randomUUID(),
    title: "Identidad visual para cafetería",
    skill: "Branding",
    description: "Logotipo, paleta cromática, aplicaciones y guía visual para una marca local.",
    author: "NODO Studio",
    color: "#0f5cad",
    mine: false
  },
  {
    id: crypto.randomUUID(),
    title: "Landing page para evento cultural",
    skill: "Web",
    description: "Diseño y desarrollo frontend de sitio responsive para promoción de evento universitario.",
    author: "Camila Reyes",
    color: "#ff7a18",
    mine: false
  }
];

const defaultJobs = [
  {
    id: crypto.randomUUID(),
    title: "Diseño de pósters para evento deportivo",
    skill: "Ilustración",
    budget: "$1,800 MXN a tratar",
    description: "Se buscan 3 piezas digitales para redes sociales con estilo juvenil y deportivo.",
    contractor: "Instituto Deportivo Oaxaca"
  },
  {
    id: crypto.randomUUID(),
    title: "Modelado 3D de producto",
    skill: "3D",
    budget: "$3,500 MXN a tratar",
    description: "Crear un producto en 3D para presentación comercial, con textura y render final.",
    contractor: "Agencia Naranja"
  },
  {
    id: crypto.randomUUID(),
    title: "Prototipo UI/UX para app de servicios",
    skill: "UI/UX",
    budget: "$5,000 MXN a tratar",
    description: "Se necesita flujo de usuario, wireframes y prototipo navegable de una app móvil.",
    contractor: "NODO Business"
  }
];

const state = {
  selectedLoginRole: "student",
  selectedLoginPlan: "monthly",
  selectedRegisterRole: "student",
  selectedRegisterPlan: "monthly",
  session: load(storageKeys.session, null),
  profiles: load(storageKeys.profiles, {}),
  projects: load(storageKeys.projects, defaultProjects),
  jobs: load(storageKeys.jobs, defaultJobs),
  conversations: load(storageKeys.conversations, []),
  notifications: load(storageKeys.notifications, []),
  users: load(storageKeys.users, []),
  activeFilter: "Todos",
  search: "",
  activeConversationId: null,
  projectFile: null,
  profile: null
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isCreativeRole(role = state.session?.role) {
  return role === "student" || role === "alumni";
}

function profileKey(name = currentUserName(), role = state.session?.role || "student") {
  return `${role}-${name.toLowerCase().trim().replace(/\s+/g, "-")}`;
}

function defaultProfileFor(name, role = state.session?.role) {
  const isAlumni = role === "alumni";
  return {
    name,
    role: isAlumni ? "Egresado en Diseño Multimedia" : "Diseñador Multimedia",
    bio: isAlumni
      ? "Egresado creativo con experiencia en diseño visual, portafolio profesional y proyectos multimedia."
      : "Especialista en diseño visual, 3D, animación y experiencias digitales.",
    skills: ["3D", "Animación", "UI/UX", "Ilustración"]
  };
}

function currentUserName() {
  if (!state.session) return "Invitado";
  if (isCreativeRole(state.session.role) && state.profile) return state.profile.name;
  return state.session.name;
}

function currentUserRoleLabel(role = state.session?.role) {
  if (!role) return "";
  const labels = {
    student: "Estudiante",
    alumni: "Egresado",
    contractor: "Contratante"
  };
  return labels[role] || "Usuario";
}

function ensureStudentProfile() {
  if (!state.session || !isCreativeRole(state.session.role)) {
    state.profile = null;
    return;
  }

  const key = profileKey(state.session.name, state.session.role);
  if (!state.profiles[key]) {
    state.profiles[key] = defaultProfileFor(state.session.name, state.session.role);
    save(storageKeys.profiles, state.profiles);
  }
  state.profile = state.profiles[key];

  state.projects = state.projects.map((project) => ({
    ...project,
    mine: project.author.toLowerCase() === state.profile.name.toLowerCase() && (project.authorRole || "student") === state.session.role
  }));
}

function saveCurrentProfile() {
  if (!state.profile || !state.session) return;
  const key = profileKey(state.session.name, state.session.role);
  state.profiles[key] = state.profile;
  save(storageKeys.profiles, state.profiles);
}

function planInfo(planKey = state.session?.plan || "free") {
  return subscriptionPlans[planKey] || subscriptionPlans.free;
}

function daysLeft(timestamp) {
  if (!timestamp) return 0;
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 86400000));
}

function subscriptionLabel() {
  if (!state.session) return "";
  if (state.session.role === "student") return "Gratis";
  const plan = planInfo();
  if (state.session.role === "contractor" && state.session.trialEndsAt && daysLeft(state.session.trialEndsAt) > 0) {
    return `Prueba ${daysLeft(state.session.trialEndsAt)} días · ${plan.price}`;
  }
  return `${plan.price} ${plan.period}`;
}

function bindEvents() {
  bindLogin();
  bindNavigation();
  bindTabs();
  bindModals();
  bindProfile();
  bindProjectForm();
  bindJobForm();
  bindProposalForm();
  bindMessages();
  bindNotifications();
  bindSubscription();

  $("#searchInput").addEventListener("input", (event) => {
    state.search = event.target.value.toLowerCase().trim();
    renderProjects();
  });
}

function bindLogin() {
  const updatePlanCopy = (prefix, role) => {
    const planBox = $(`#${prefix}PlanBox`);
    const freeNote = $(`#${prefix}FreeNote`);
    const planEyebrow = $(`#${prefix}PlanEyebrow`);
    const planTitle = $(`#${prefix}PlanTitle`);
    const planDescription = $(`#${prefix}PlanDescription`);

    if (!planBox || !freeNote) return;

    planBox.classList.toggle("hidden", role === "student");
    freeNote.classList.toggle("hidden", role !== "student");

    if (role === "alumni") {
      planEyebrow.textContent = "Plan para egresados";
      planTitle.textContent = "Suscripción de egresado";
      planDescription.textContent = "Elige $20 MXN mensual o $200 MXN anual para mantener activo tu perfil profesional.";
    }

    if (role === "contractor") {
      planEyebrow.textContent = "Plan para contratantes";
      planTitle.textContent = "7 días gratis + suscripción";
      planDescription.textContent = "La prueba dura 7 días. Después puedes continuar con $20 MXN mensual o $200 MXN anual.";
    }
  };

  const setAuthMode = (mode) => {
    const isRegister = mode === "register";
    $("#loginForm").classList.toggle("hidden", isRegister);
    $("#registerForm").classList.toggle("hidden", !isRegister);
    $("#showLoginTab").classList.toggle("active", !isRegister);
    $("#showRegisterTab").classList.toggle("active", isRegister);

    $("#authEyebrow").textContent = isRegister ? "Registro" : "Acceso";
    $("#authTitle").textContent = isRegister ? "Crea tu cuenta en NODO" : "Inicia sesión en tu cuenta";
    $("#authDescription").textContent = isRegister
      ? "Completa tus datos, selecciona tu tipo de cuenta y empieza a construir tu perfil creativo."
      : "Ingresa tu usuario, contraseña y elige el tipo de cuenta para continuar.";

    const focusTarget = isRegister ? "#registerFullName" : "#loginName";
    setTimeout(() => $(focusTarget)?.focus(), 80);
  };

  const buildSession = ({ name, username, role, plan }) => {
    state.session = {
      name,
      username,
      role,
      plan,
      subscriptionStatus: role === "student" ? "free" : role === "contractor" ? "trial" : "active",
      trialEndsAt: role === "contractor" ? Date.now() + contractorTrialDays * 86400000 : null,
      createdAt: Date.now()
    };

    save(storageKeys.session, state.session);
    ensureStudentProfile();
    renderApp();
    showApp();
    showSection("inicio");
  };

  $("#showLoginTab")?.addEventListener("click", () => setAuthMode("login"));
  $("#showRegisterTab")?.addEventListener("click", () => setAuthMode("register"));

  $$('[data-role-option]').forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedLoginRole = button.dataset.roleOption;
      $$('[data-role-option]').forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      updatePlanCopy("login", state.selectedLoginRole);
    });
  });

  $$('[data-register-role-option]').forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedRegisterRole = button.dataset.registerRoleOption;
      $$('[data-register-role-option]').forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      updatePlanCopy("register", state.selectedRegisterRole);
    });
  });

  $$('input[name="subscriptionPlan"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.selectedLoginPlan = input.value;
      $$('input[name="subscriptionPlan"]').forEach((radio) => {
        radio.closest(".plan-option").classList.toggle("active", radio.checked);
      });
    });
  });

  $$('input[name="registerSubscriptionPlan"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.selectedRegisterPlan = input.value;
      $$('input[name="registerSubscriptionPlan"]').forEach((radio) => {
        radio.closest(".plan-option").classList.toggle("active", radio.checked);
      });
    });
  });

  $("#loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const username = $("#loginName").value.trim();
    const password = $("#loginPassword").value.trim();
    if (!username || !password) return;

    const savedUser = state.users.find((user) => user.username.toLowerCase() === username.toLowerCase());
    const role = state.selectedLoginRole;
    const plan = role === "student" ? "free" : state.selectedLoginPlan;

    buildSession({
      name: savedUser?.fullName || username,
      username,
      role,
      plan
    });

    $("#loginPassword").value = "";
    showToast(`Inicio de sesión correcto. Entraste como ${currentUserRoleLabel()}. ${subscriptionLabel()}.`);
  });

  $("#registerForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const fullName = $("#registerFullName").value.trim();
    const username = $("#registerUsername").value.trim();
    const email = $("#registerEmail").value.trim();
    const password = $("#registerPassword").value.trim();
    const confirmPassword = $("#registerConfirmPassword").value.trim();

    if (!fullName || !username || !email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      showToast("Las contraseñas no coinciden.");
      return;
    }

    const role = state.selectedRegisterRole;
    const plan = role === "student" ? "free" : state.selectedRegisterPlan;
    const existingUserIndex = state.users.findIndex((user) => user.username.toLowerCase() === username.toLowerCase());

    const userRecord = {
      id: existingUserIndex >= 0 ? state.users[existingUserIndex].id : crypto.randomUUID(),
      fullName,
      username,
      email,
      role,
      plan,
      createdAt: existingUserIndex >= 0 ? state.users[existingUserIndex].createdAt : Date.now(),
      updatedAt: Date.now()
    };

    if (existingUserIndex >= 0) {
      state.users[existingUserIndex] = userRecord;
    } else {
      state.users.push(userRecord);
    }

    save(storageKeys.users, state.users);

    buildSession({
      name: fullName,
      username,
      role,
      plan
    });

    $("#registerForm").reset();
    showToast(`Cuenta creada. Entraste como ${currentUserRoleLabel()}. ${subscriptionLabel()}.`);
  });

  $("#logoutBtn").addEventListener("click", () => {
    localStorage.removeItem(storageKeys.session);
    state.session = null;
    state.profile = null;
    state.activeConversationId = null;
    $("#appShell").classList.add("hidden");
    $("#loginScreen").classList.remove("hidden");
    setAuthMode("login");
    $("#loginPassword").value = "";
    updatePlanCopy("login", state.selectedLoginRole);
    updatePlanCopy("register", state.selectedRegisterRole);
  });

  updatePlanCopy("login", state.selectedLoginRole);
  updatePlanCopy("register", state.selectedRegisterRole);
  setAuthMode("login");
}

function bindNavigation() {
  $$('[data-section]').forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      showSection(item.dataset.section);
      $("#nav").classList.remove("open");
    });
  });

  $("#hamburger").addEventListener("click", () => {
    $("#nav").classList.toggle("open");
  });
}

function allowedSections() {
  if (!state.session) return ["inicio"];
  if (isCreativeRole(state.session.role)) {
    const creativeSections = ["inicio", "explorar", "trabajos", "mensajes", "notificaciones", "perfil"];
    if (state.session.role === "alumni") creativeSections.push("plan");
    return creativeSections;
  }
  return ["inicio", "explorar", "trabajos", "mensajes", "notificaciones", "plan"];
}

function showSection(sectionId) {
  const target = allowedSections().includes(sectionId) ? sectionId : "inicio";
  $$(".page").forEach((page) => page.classList.toggle("active-page", page.id === target));
  $$(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.section === target));
  history.replaceState(null, "", `#${target}`);
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (target === "mensajes") {
    markVisibleConversationRead();
  }
}

function bindTabs() {
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((item) => item.classList.remove("active"));
      $$(".tab-panel").forEach((panel) => panel.classList.remove("active-tab"));
      tab.classList.add("active");
      $(`#${tab.dataset.tab}`).classList.add("active-tab");
    });
  });
}

function bindModals() {
  $("#openProjectModal").addEventListener("click", () => $("#projectModal").showModal());
  $("#openJobModal").addEventListener("click", () => $("#jobModal").showModal());

  $$('[data-close]').forEach((btn) => {
    btn.addEventListener("click", () => {
      $(`#${btn.dataset.close}`).close();
    });
  });
}

function bindProfile() {
  $("#profileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.profile || !state.session) return;

    const previousName = state.profile.name;
    const previousKey = profileKey(state.session.name, state.session.role);
    const newName = $("#profileName").value.trim();

    state.profile.name = newName;
    state.profile.role = $("#profileRole").value.trim();
    state.profile.bio = $("#profileBio").value.trim();
    state.session.name = newName;

    state.projects = state.projects.map((project) => {
      if (project.author === previousName || project.mine) {
        return { ...project, author: state.profile.name, authorRole: state.session.role, mine: true };
      }
      return project;
    });

    state.conversations = state.conversations.map((conversation) => {
      if (conversation.studentName === previousName && (conversation.studentRole || "student") === state.session.role) {
        return { ...conversation, studentName: state.profile.name };
      }
      return conversation;
    });

    state.notifications = state.notifications.map((notification) => {
      if (notification.targetRole === state.session.role && notification.targetName === previousName) {
        return { ...notification, targetName: state.profile.name };
      }
      return notification;
    });

    delete state.profiles[previousKey];
    state.profiles[profileKey(newName, state.session.role)] = state.profile;

    save(storageKeys.session, state.session);
    save(storageKeys.profiles, state.profiles);
    save(storageKeys.projects, state.projects);
    save(storageKeys.conversations, state.conversations);
    save(storageKeys.notifications, state.notifications);
    renderApp();
    showToast("Perfil actualizado correctamente.");
  });

  $("#addSkillBtn").addEventListener("click", () => addSkill());
  $("#skillInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSkill();
    }
  });
}

function addSkill() {
  if (!state.profile) return;
  const value = $("#skillInput").value.trim();
  if (!value) return;
  const exists = state.profile.skills.some((skill) => skill.toLowerCase() === value.toLowerCase());
  if (!exists) {
    state.profile.skills.push(value);
    saveCurrentProfile();
    renderProfile();
  }
  $("#skillInput").value = "";
}

function bindProjectForm() {
  const fileInput = $("#projectFile");
  if (fileInput) {
    fileInput.addEventListener("change", handleProjectFileChange);
  }

  $("#projectForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.profile) return;

    const project = {
      id: crypto.randomUUID(),
      title: $("#projectTitle").value.trim(),
      skill: $("#projectSkill").value,
      description: $("#projectDescription").value.trim(),
      author: state.profile.name,
      authorRole: state.session.role,
      color: $("#projectColor").value,
      file: state.projectFile,
      mine: true
    };
    state.projects.unshift(project);
    save(storageKeys.projects, state.projects);
    event.target.reset();
    state.projectFile = null;
    renderProjectFilePreview();
    $("#projectColor").value = "#ff7a18";
    $("#projectModal").close();
    renderProjects();
    renderHomeCategories();
    updateStats();
    showToast("Proyecto publicado en tu portafolio.");
  });
}

function handleProjectFileChange(event) {
  const file = event.target.files?.[0];
  state.projectFile = null;

  if (!file) {
    renderProjectFilePreview();
    return;
  }

  const allowed = file.type.startsWith("image/") || file.type.startsWith("video/") || file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!allowed) {
    event.target.value = "";
    renderProjectFilePreview();
    showToast("Formato no compatible. Usa imagen, video o PDF.");
    return;
  }

  if (file.size > maxProjectFileSize) {
    event.target.value = "";
    renderProjectFilePreview();
    showToast("El archivo supera 5 MB. Para el prototipo usa uno más ligero.");
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.projectFile = {
      name: file.name,
      type: file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "archivo"),
      size: file.size,
      dataUrl: reader.result
    };
    renderProjectFilePreview();
  });
  reader.addEventListener("error", () => {
    event.target.value = "";
    state.projectFile = null;
    renderProjectFilePreview();
    showToast("No se pudo leer el archivo seleccionado.");
  });
  reader.readAsDataURL(file);
}

function renderProjectFilePreview() {
  const preview = $("#projectFilePreview");
  if (!preview) return;

  if (!state.projectFile) {
    preview.className = "file-preview empty";
    preview.innerHTML = `<span>Sin archivo seleccionado</span>`;
    return;
  }

  const file = state.projectFile;
  const safeName = escapeHTML(file.name);
  const safeUrl = escapeHTML(file.dataUrl);
  const size = formatFileSize(file.size);
  let media = `<div class="file-preview-icon">ARCHIVO</div>`;

  if (file.type.startsWith("image/")) {
    media = `<img src="${safeUrl}" alt="Vista previa de ${safeName}" />`;
  } else if (file.type.startsWith("video/")) {
    media = `<video src="${safeUrl}" controls muted></video>`;
  } else if (file.type === "application/pdf") {
    media = `<div class="file-preview-icon">PDF</div>`;
  }

  preview.className = "file-preview";
  preview.innerHTML = `
    ${media}
    <div>
      <strong>${safeName}</strong>
      <span>${size}</span>
    </div>
  `;
}

function formatFileSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function bindJobForm() {
  $("#jobForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.session || state.session.role !== "contractor") return;

    const job = {
      id: crypto.randomUUID(),
      title: $("#jobTitle").value.trim(),
      skill: $("#jobSkill").value,
      budget: $("#jobBudget").value.trim(),
      description: $("#jobDescription").value.trim(),
      contractor: state.session.name
    };
    state.jobs.unshift(job);
    save(storageKeys.jobs, state.jobs);
    event.target.reset();
    $("#jobModal").close();
    renderJobs();
    updateStats();
    showToast("Oferta publicada correctamente.");
  });
}

function bindProposalForm() {
  $("#proposalForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.profile) return;

    const job = state.jobs.find((item) => item.id === $("#proposalJobId").value);
    if (!job) return;

    const price = $("#proposalPrice").value.trim();
    const message = $("#proposalMessage").value.trim();
    const conversation = createOrGetConversation({
      studentName: state.profile.name,
      studentRole: state.session.role,
      contractorName: job.contractor,
      contextTitle: job.title,
      contextType: "Oferta"
    });

    addMessage(conversation.id, `${message}\n\nPrecio propuesto: ${price}`, {
      notify: true,
      notificationTitle: "Nueva propuesta de talento creativo",
      notificationText: `${state.profile.name} propuso ${price} para “${job.title}”.`
    });

    $("#proposalModal").close();
    event.target.reset();
    state.activeConversationId = conversation.id;
    renderApp();
    showSection("mensajes");
  });
}

function bindMessages() {
  $("#messageForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const text = $("#messageInput").value.trim();
    if (!text || !state.activeConversationId) return;

    addMessage(state.activeConversationId, text, {
      notify: true,
      notificationTitle: "Nuevo mensaje en NODO",
      notificationText: `${currentUserName()} te envió un mensaje.`
    });

    $("#messageInput").value = "";
    renderMessages();
    renderBadges();
  });

  $("#markChatReadBtn").addEventListener("click", () => {
    markVisibleConversationRead();
    showToast("Conversación marcada como leída.");
  });
}

function bindNotifications() {
  $("#markAllNotificationsRead").addEventListener("click", () => {
    state.notifications = state.notifications.map((notification) => {
      if (isNotificationForCurrentUser(notification)) return { ...notification, read: true };
      return notification;
    });
    save(storageKeys.notifications, state.notifications);
    renderNotifications();
    renderBadges();
    showToast("Notificaciones marcadas como leídas.");
  });
}

function bindSubscription() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-change-plan]");
    if (!button || !state.session || state.session.role === "student") return;

    state.session.plan = button.dataset.changePlan;
    if (state.session.role === "contractor" && !state.session.trialEndsAt) {
      state.session.trialEndsAt = Date.now() + contractorTrialDays * 86400000;
    }
    save(storageKeys.session, state.session);
    renderRoleUI();
    renderSubscription();
    showToast(`Plan actualizado: ${subscriptionLabel()}.`);
  });
}

function showApp() {
  $("#loginScreen").classList.add("hidden");
  $("#appShell").classList.remove("hidden");
}

function renderApp() {
  ensureStudentProfile();
  renderRoleUI();
  renderSkillOptions();
  renderFilters();
  renderHomeCategories();
  renderProfile();
  renderProjects();
  renderJobs();
  renderMessages();
  renderNotifications();
  renderSubscription();
  updateStats();
  renderBadges();
}

function renderRoleUI() {
  const role = state.session?.role;
  $("#userChip").textContent = `${currentUserName()} · ${currentUserRoleLabel()} · ${subscriptionLabel()}`;
  $("#jobsNavText").textContent = role === "contractor" ? "Mis ofertas" : "Ofertas";

  $$('[data-visible]').forEach((element) => {
    const visibleRoles = element.dataset.visible.split(" ");
    element.classList.toggle("hidden", !visibleRoles.includes(role));
  });

  if (role === "student") {
    $("#homeEyebrow").textContent = "Modo estudiante · gratuito";
    $("#homeTitle").textContent = "Construye tu portafolio y consigue oportunidades reales.";
    $("#homeDescription").textContent = "Muestra tus proyectos, edita tus skills, busca ofertas de trabajo y negocia directamente con contratantes sin pagar suscripción.";
    $("#homePrimaryAction").textContent = "Ver ofertas";
    $("#homePrimaryAction").dataset.section = "trabajos";
    $("#homeSecondaryAction").textContent = "Editar portafolio";
    $("#homeSecondaryAction").dataset.section = "perfil";
    $("#exploreEyebrow").textContent = "Explorar inspiración";
    $("#exploreTitle").textContent = "Descubre proyectos de diseño multimedia";
    $("#exploreText").textContent = "Compara estilos, áreas creativas y referencias para mejorar tu portafolio.";
    $("#jobsEyebrow").textContent = "Modo estudiante";
    $("#jobsTitle").textContent = "Ofertas disponibles";
    $("#jobsDescription").textContent = "Envía una propuesta con tu precio a tratar y abre conversación con el contratante.";
    $("#jobsRoleNote").innerHTML = "Tu cuenta de estudiante es gratuita. Puedes proponer tu precio, explicar qué puedes hacer y negociar en mensajes.";
    return;
  }

  if (role === "alumni") {
    $("#homeEyebrow").textContent = `Modo egresado · ${subscriptionLabel()}`;
    $("#homeTitle").textContent = "Mantén un portafolio profesional activo y conecta con contratantes.";
    $("#homeDescription").textContent = "Como egresado puedes mostrar proyectos, editar skills, aplicar a ofertas y administrar tu suscripción mensual o anual.";
    $("#homePrimaryAction").textContent = "Ver ofertas";
    $("#homePrimaryAction").dataset.section = "trabajos";
    $("#homeSecondaryAction").textContent = "Ver mi plan";
    $("#homeSecondaryAction").dataset.section = "plan";
    $("#exploreEyebrow").textContent = "Explorar red creativa";
    $("#exploreTitle").textContent = "Encuentra referencias y otros talentos";
    $("#exploreText").textContent = "Filtra proyectos de 3D, animación, dibujo, UI/UX y más áreas multimedia.";
    $("#jobsEyebrow").textContent = "Modo egresado";
    $("#jobsTitle").textContent = "Ofertas disponibles";
    $("#jobsDescription").textContent = "Envía propuestas profesionales con tu precio a tratar.";
    $("#jobsRoleNote").innerHTML = `Tu suscripción de egresado está configurada como <strong>${subscriptionLabel()}</strong>. Puedes enviar propuestas y negociar en mensajes.`;
    return;
  }

  $("#homeEyebrow").textContent = `Modo contratante · ${subscriptionLabel()}`;
  $("#homeTitle").textContent = "Encuentra talento multimedia y publica oportunidades.";
  $("#homeDescription").textContent = "Busca estudiantes o egresados por skill, revisa portafolios, publica ofertas y conversa con el talento seleccionado.";
  $("#homePrimaryAction").textContent = "Buscar talento";
  $("#homePrimaryAction").dataset.section = "explorar";
  $("#homeSecondaryAction").textContent = "Ver mi plan";
  $("#homeSecondaryAction").dataset.section = "plan";
  $("#exploreEyebrow").textContent = "Explorar talento";
  $("#exploreTitle").textContent = "Encuentra talento por skill";
  $("#exploreText").textContent = "Filtra portafolios de 3D, animación, dibujo, UI/UX y más áreas multimedia.";
  $("#jobsEyebrow").textContent = "Modo contratante";
  $("#jobsTitle").textContent = "Mis ofertas publicadas";
  $("#jobsDescription").textContent = "Publica trabajos con presupuesto a tratar y recibe propuestas de estudiantes o egresados.";
  $("#jobsRoleNote").innerHTML = `Tu cuenta de contratante tiene <strong>${subscriptionLabel()}</strong>. Puedes publicar nuevas ofertas y eliminar únicamente las que creaste con este nombre de acceso.`;
}

function renderSkillOptions() {
  const options = skills
    .filter((skill) => skill !== "Todos")
    .map((skill) => `<option value="${escapeHTML(skill)}">${escapeHTML(skill)}</option>`)
    .join("");
  $("#projectSkill").innerHTML = options;
  $("#jobSkill").innerHTML = options;
}

function renderFilters() {
  $("#filters").innerHTML = skills.map((skill) => `
    <button class="filter-btn ${skill === state.activeFilter ? "active" : ""}" data-filter="${escapeHTML(skill)}">
      ${escapeHTML(skill)}
    </button>
  `).join("");

  $$(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeFilter = btn.dataset.filter;
      renderFilters();
      renderProjects();
    });
  });
}

function renderHomeCategories() {
  const featured = skills.filter((skill) => skill !== "Todos").slice(0, 6);
  $("#homeCategories").innerHTML = featured.map((skill) => {
    const count = state.projects.filter((project) => project.skill === skill).length;
    return `
      <button class="category-card" data-home-filter="${escapeHTML(skill)}">
        <div><span>${count} proyectos</span></div>
        <strong>${escapeHTML(skill)}</strong>
      </button>
    `;
  }).join("");

  $$('[data-home-filter]').forEach((card) => {
    card.addEventListener("click", () => {
      state.activeFilter = card.dataset.homeFilter;
      renderFilters();
      showSection("explorar");
      renderProjects();
    });
  });
}

function renderProfile() {
  if (!state.profile) return;

  const initials = state.profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("") || "ND";

  $("#profileAvatar").textContent = initials;
  $("#profileNameView").textContent = state.profile.name;
  $("#profileRoleView").textContent = state.profile.role;
  $("#profileBioView").textContent = state.profile.bio;
  $("#profileName").value = state.profile.name;
  $("#profileRole").value = state.profile.role;
  $("#profileBio").value = state.profile.bio;

  $("#profileSkillsView").innerHTML = state.profile.skills.map((skill) => `<span>${escapeHTML(skill)}</span>`).join("");
  $("#editableSkills").innerHTML = state.profile.skills.map((skill) => `
    <span>${escapeHTML(skill)}<button class="remove-skill" type="button" data-remove-skill="${escapeHTML(skill)}">×</button></span>
  `).join("");

  $$('[data-remove-skill]').forEach((btn) => {
    btn.addEventListener("click", () => {
      state.profile.skills = state.profile.skills.filter((skill) => skill !== btn.dataset.removeSkill);
      saveCurrentProfile();
      renderProfile();
    });
  });
}

function renderProjects() {
  const filtered = state.projects.filter((project) => {
    const matchesSkill = state.activeFilter === "Todos" || project.skill === state.activeFilter;
    const searchable = `${project.title} ${project.skill} ${project.description} ${project.author} ${project.file?.name || ""}`.toLowerCase();
    const matchesSearch = !state.search || searchable.includes(state.search);
    return matchesSkill && matchesSearch;
  });

  $("#portfolioGrid").innerHTML = filtered.map((project) => projectCard(project)).join("");
  $("#emptyProjects").classList.toggle("hidden", filtered.length > 0);

  if (state.profile) {
    const myProjects = state.projects.filter((project) => project.author.toLowerCase() === state.profile.name.toLowerCase() || project.mine);
    $("#myProjects").innerHTML = myProjects.length
      ? myProjects.map((project) => projectCard(project, true)).join("")
      : `<p class="empty-state">Todavía no tienes proyectos publicados.</p>`;
  }

  bindProjectCardActions();
}

function projectCard(project, editable = false) {
  const safeTitle = escapeHTML(project.title);
  const safeAuthor = escapeHTML(project.author);
  const safeDescription = escapeHTML(project.description);
  const safeSkill = escapeHTML(project.skill);
  const safeColor = escapeHTML(project.color || "#1578d4");
  const canContact = state.session?.role === "contractor" && !editable;
  const cover = projectCover(project, safeColor, safeTitle);
  const fileAction = project.file?.dataUrl
    ? `<a class="btn ghost compact" href="${escapeHTML(project.file.dataUrl)}" target="_blank" rel="noopener" download="${escapeHTML(project.file.name || "proyecto")}">Abrir archivo</a>`
    : "";

  return `
    <article class="project-card">
      ${cover}
      <div class="card-content">
        <div class="card-meta">
          <span>${safeAuthor}</span>
          ${editable ? `<button class="delete-project" data-delete-project="${project.id}" title="Eliminar proyecto">×</button>` : `<span>★ ${Math.floor(Math.random() * 90) + 10}</span>`}
        </div>
        <h3>${safeTitle}</h3>
        <p>${safeDescription}</p>
        <div class="card-skills"><span>${safeSkill}</span>${project.file ? `<span>${escapeHTML(project.file.type?.split("/")[0] || "archivo")}</span>` : ""}</div>
        <div class="card-actions">
          ${fileAction}
          ${canContact ? `<button class="btn secondary compact" data-contact-student="${project.id}">Contactar talento</button>` : ""}
        </div>
      </div>
    </article>
  `;
}

function projectCover(project, safeColor, safeTitle) {
  if (!project.file?.dataUrl) {
    return `<div class="project-cover" style="background: linear-gradient(135deg, ${safeColor}, #ffffff33), linear-gradient(135deg, ${safeColor}, #0a2a5e);"></div>`;
  }

  const safeUrl = escapeHTML(project.file.dataUrl);
  const safeName = escapeHTML(project.file.name || "Archivo del proyecto");
  const fileType = project.file.type || "archivo";

  if (fileType.startsWith("image/")) {
    return `<div class="project-cover has-media"><img src="${safeUrl}" alt="${safeTitle}" loading="lazy" /></div>`;
  }

  if (fileType.startsWith("video/")) {
    return `<div class="project-cover has-media"><video src="${safeUrl}" muted playsinline></video><span class="media-badge">Video</span></div>`;
  }

  if (fileType === "application/pdf") {
    return `<div class="project-cover file-cover"><span>PDF</span><strong>${safeName}</strong></div>`;
  }

  return `<div class="project-cover file-cover"><span>Archivo</span><strong>${safeName}</strong></div>`;
}

function bindProjectCardActions() {
  $$('[data-delete-project]').forEach((btn) => {
    btn.addEventListener("click", () => {
      state.projects = state.projects.filter((project) => project.id !== btn.dataset.deleteProject);
      save(storageKeys.projects, state.projects);
      renderProjects();
      renderHomeCategories();
      updateStats();
    });
  });

  $$('[data-contact-student]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const project = state.projects.find((item) => item.id === btn.dataset.contactStudent);
      if (!project || !state.session || state.session.role !== "contractor") return;

      const conversation = createOrGetConversation({
        studentName: project.author,
        studentRole: project.authorRole || "student",
        contractorName: state.session.name,
        contextTitle: project.title,
        contextType: "Portafolio"
      });

      if (!conversation.messages.length) {
        addMessage(conversation.id, `Hola ${project.author}, vi tu proyecto “${project.title}” y me interesa hablar contigo para una colaboración.`, {
          notify: true,
          notificationTitle: "Un contratante quiere contactarte",
          notificationText: `${state.session.name} revisó tu portafolio y abrió una conversación.`
        });
      }

      state.activeConversationId = conversation.id;
      renderApp();
      showSection("mensajes");
    });
  });
}

function renderJobs() {
  $("#jobsGrid").innerHTML = state.jobs.map((job) => jobCard(job)).join("");
  bindJobCardActions();
}

function jobCard(job) {
  const isContractor = state.session?.role === "contractor";
  const ownJob = isContractor && job.contractor === state.session.name;
  const safeTitle = escapeHTML(job.title);
  const safeSkill = escapeHTML(job.skill);
  const safeDescription = escapeHTML(job.description);
  const safeBudget = escapeHTML(job.budget);
  const safeContractor = escapeHTML(job.contractor || "Contratante NODO");

  return `
    <article class="job-card">
      <div class="job-meta">
        <span>${safeSkill}</span>
        ${ownJob ? `<button class="delete-job" data-delete-job="${job.id}" title="Eliminar oferta">×</button>` : ""}
      </div>
      <h3>${safeTitle}</h3>
      <p>${safeDescription}</p>
      <div class="job-meta">
        <strong>${safeBudget}</strong>
        <span>${safeContractor}</span>
      </div>
      <div class="job-actions">
        ${isCreativeRole(state.session?.role) ? `<button class="btn secondary" data-propose-job="${job.id}">Enviar propuesta</button>` : ""}
        ${ownJob ? `<button class="btn ghost" data-open-job-messages="${job.title}">Ver mensajes</button>` : ""}
      </div>
    </article>
  `;
}

function bindJobCardActions() {
  $$('[data-delete-job]').forEach((btn) => {
    btn.addEventListener("click", () => {
      state.jobs = state.jobs.filter((job) => job.id !== btn.dataset.deleteJob);
      save(storageKeys.jobs, state.jobs);
      renderJobs();
      updateStats();
    });
  });

  $$('[data-propose-job]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const job = state.jobs.find((item) => item.id === btn.dataset.proposeJob);
      if (!job) return;
      $("#proposalJobId").value = job.id;
      $("#proposalJobTitle").textContent = `Oferta: ${job.title} · ${job.budget}`;
      $("#proposalMessage").value = `Hola, me interesa la oferta “${job.title}”. Puedo apoyar con el proyecto y me gustaría negociar los detalles.`;
      $("#proposalModal").showModal();
    });
  });

  $$('[data-open-job-messages]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const match = conversationsForCurrentUser().find((conversation) => conversation.contextTitle === btn.dataset.openJobMessages);
      if (match) {
        state.activeConversationId = match.id;
        renderMessages();
        showSection("mensajes");
      } else {
        showInfo("Sin mensajes todavía", "Cuando un estudiante o egresado mande una propuesta para esta oferta, aparecerá en Mensajes.");
      }
    });
  });
}

function createOrGetConversation({ studentName, studentRole = "student", contractorName, contextTitle, contextType }) {
  let conversation = state.conversations.find((item) =>
    item.studentName === studentName &&
    (item.studentRole || "student") === studentRole &&
    item.contractorName === contractorName &&
    item.contextTitle === contextTitle
  );

  if (!conversation) {
    conversation = {
      id: crypto.randomUUID(),
      studentName,
      studentRole,
      contractorName,
      contextTitle,
      contextType,
      createdAt: Date.now(),
      unreadForStudent: false,
      unreadForContractor: false,
      messages: []
    };
    state.conversations.unshift(conversation);
    save(storageKeys.conversations, state.conversations);
  }

  return conversation;
}

function addMessage(conversationId, text, options = {}) {
  const conversation = state.conversations.find((item) => item.id === conversationId);
  if (!conversation || !state.session) return;

  const message = {
    id: crypto.randomUUID(),
    fromRole: state.session.role,
    fromName: currentUserName(),
    text,
    createdAt: Date.now()
  };

  conversation.messages.push(message);
  if (isCreativeRole(state.session.role)) {
    conversation.unreadForContractor = true;
    conversation.unreadForStudent = false;
    conversation.studentRole = state.session.role;
  } else {
    conversation.unreadForStudent = true;
    conversation.unreadForContractor = false;
  }
  save(storageKeys.conversations, state.conversations);

  if (options.notify) {
    const targetRole = isCreativeRole(state.session.role) ? "contractor" : (conversation.studentRole || "student");
    const targetName = targetRole === "contractor" ? conversation.contractorName : conversation.studentName;
    addNotification({
      targetRole,
      targetName,
      title: options.notificationTitle || "Nuevo mensaje",
      text: options.notificationText || `${currentUserName()} te escribió en NODO.`,
      conversationId: conversation.id
    });
  }
}

function conversationsForCurrentUser() {
  if (!state.session) return [];
  const name = currentUserName();
  const role = state.session.role;
  return state.conversations
    .filter((conversation) => isCreativeRole(role)
      ? conversation.studentName.toLowerCase() === name.toLowerCase() && (conversation.studentRole || "student") === role
      : conversation.contractorName.toLowerCase() === name.toLowerCase())
    .sort((a, b) => latestConversationTime(b) - latestConversationTime(a));
}

function latestConversationTime(conversation) {
  const last = conversation.messages.at(-1);
  return last ? last.createdAt : conversation.createdAt;
}

function renderMessages() {
  const conversations = conversationsForCurrentUser();
  if (!conversations.length) {
    state.activeConversationId = null;
    $("#conversationList").innerHTML = `<p class="empty-state">No tienes conversaciones todavía.</p>`;
    $("#chatEmpty").classList.remove("hidden");
    $("#chatBox").classList.add("hidden");
    return;
  }

  if (!state.activeConversationId || !conversations.some((item) => item.id === state.activeConversationId)) {
    state.activeConversationId = conversations[0].id;
  }

  $("#conversationList").innerHTML = conversations.map((conversation) => {
    const otherName = isCreativeRole(state.session.role) ? conversation.contractorName : conversation.studentName;
    const unread = isConversationUnread(conversation);
    const lastMessage = conversation.messages.at(-1);
    return `
      <button class="conversation-item ${conversation.id === state.activeConversationId ? "active" : ""}" data-conversation="${conversation.id}">
        <strong>${escapeHTML(otherName)} ${unread ? `<span class="unread-dot" title="Sin leer"></span>` : ""}</strong>
        <span>${escapeHTML(conversation.contextType)} · ${escapeHTML(conversation.contextTitle)}</span>
        <small>${escapeHTML(lastMessage ? lastMessage.text.slice(0, 80) : "Conversación creada")}</small>
      </button>
    `;
  }).join("");

  $$('[data-conversation]').forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeConversationId = btn.dataset.conversation;
      markVisibleConversationRead();
      renderMessages();
      renderBadges();
    });
  });

  const active = state.conversations.find((item) => item.id === state.activeConversationId);
  if (!active) return;

  const otherName = isCreativeRole(state.session.role) ? active.contractorName : active.studentName;
  $("#chatEmpty").classList.add("hidden");
  $("#chatBox").classList.remove("hidden");
  $("#chatTitle").textContent = otherName;
  $("#chatSubtitle").textContent = `${active.contextType}: ${active.contextTitle}`;

  $("#messageThread").innerHTML = active.messages.length
    ? active.messages.map((message) => messageBubble(message)).join("")
    : `<p class="empty-state">Todavía no hay mensajes en esta conversación.</p>`;

  const thread = $("#messageThread");
  thread.scrollTop = thread.scrollHeight;
}

function messageBubble(message) {
  const mine = message.fromRole === state.session.role && message.fromName.toLowerCase() === currentUserName().toLowerCase();
  return `
    <div class="message ${mine ? "me" : "other"}">
      <strong>${escapeHTML(message.fromName)}</strong>
      <p>${escapeHTML(message.text).replaceAll("\n", "<br>")}</p>
      <small>${formatDate(message.createdAt)}</small>
    </div>
  `;
}

function isConversationUnread(conversation) {
  return isCreativeRole(state.session.role) ? conversation.unreadForStudent : conversation.unreadForContractor;
}

function markVisibleConversationRead() {
  const conversation = state.conversations.find((item) => item.id === state.activeConversationId);
  if (!conversation || !state.session) return;

  if (isCreativeRole(state.session.role)) conversation.unreadForStudent = false;
  if (state.session.role === "contractor") conversation.unreadForContractor = false;
  save(storageKeys.conversations, state.conversations);
  renderMessages();
  renderBadges();
}

function addNotification({ targetRole, targetName, title, text, conversationId }) {
  state.notifications.unshift({
    id: crypto.randomUUID(),
    targetRole,
    targetName,
    title,
    text,
    conversationId,
    read: false,
    createdAt: Date.now()
  });
  save(storageKeys.notifications, state.notifications);
}

function isNotificationForCurrentUser(notification) {
  if (!state.session) return false;
  return notification.targetRole === state.session.role &&
    notification.targetName.toLowerCase() === currentUserName().toLowerCase();
}

function notificationsForCurrentUser() {
  return state.notifications
    .filter(isNotificationForCurrentUser)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function renderNotifications() {
  const notifications = notificationsForCurrentUser();

  if (!notifications.length) {
    $("#notificationsList").innerHTML = `<p class="empty-state">No tienes notificaciones todavía.</p>`;
    return;
  }

  $("#notificationsList").innerHTML = notifications.map((notification) => `
    <article class="notification-card ${notification.read ? "" : "unread"}">
      <div>
        <h3>${escapeHTML(notification.title)}</h3>
        <p>${escapeHTML(notification.text)}</p>
        <small>${formatDate(notification.createdAt)}</small>
      </div>
      <div class="card-actions">
        ${notification.conversationId ? `<button class="btn secondary compact" data-open-notification-chat="${notification.id}">Abrir chat</button>` : ""}
        ${!notification.read ? `<button class="mark-read-btn" data-read-notification="${notification.id}" title="Marcar leída">✓</button>` : ""}
      </div>
    </article>
  `).join("");

  $$('[data-read-notification]').forEach((btn) => {
    btn.addEventListener("click", () => {
      markNotificationRead(btn.dataset.readNotification);
      renderNotifications();
      renderBadges();
    });
  });

  $$('[data-open-notification-chat]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const notification = state.notifications.find((item) => item.id === btn.dataset.openNotificationChat);
      if (!notification) return;
      markNotificationRead(notification.id);
      state.activeConversationId = notification.conversationId;
      renderMessages();
      renderNotifications();
      renderBadges();
      showSection("mensajes");
    });
  });
}

function markNotificationRead(id) {
  state.notifications = state.notifications.map((notification) =>
    notification.id === id ? { ...notification, read: true } : notification
  );
  save(storageKeys.notifications, state.notifications);
}

function renderSubscription() {
  const statusCard = $("#subscriptionStatusCard");
  const actions = $("#subscriptionActions");
  if (!statusCard || !actions || !state.session || state.session.role === "student") {
    return;
  }

  const role = state.session.role;
  const plan = planInfo();
  const trialDays = daysLeft(state.session.trialEndsAt);
  const isContractorTrial = role === "contractor" && trialDays > 0;
  const statusText = role === "alumni"
    ? "Suscripción de egresado activa"
    : isContractorTrial
      ? `Prueba gratuita activa · ${trialDays} días restantes`
      : "Suscripción de contratante activa";

  statusCard.innerHTML = `
    <span class="eyebrow">${escapeHTML(currentUserRoleLabel())}</span>
    <h3>${escapeHTML(statusText)}</h3>
    <p>Plan seleccionado: <strong>${escapeHTML(plan.name)}</strong></p>
    <div class="subscription-price">${escapeHTML(plan.price)} <small>${escapeHTML(plan.period)}</small></div>
    <p class="muted-text">${role === "contractor"
      ? "Incluye publicación de ofertas, búsqueda de talento, mensajes y notificaciones durante la prueba y en la suscripción activa."
      : "Incluye perfil profesional, skills, portafolio, propuestas, mensajes y notificaciones."}</p>
  `;

  actions.innerHTML = `
    <article class="plan-switch-card ${state.session.plan === "monthly" ? "active" : ""}">
      <span>Mensual</span>
      <strong>$20 MXN</strong>
      <p>Ideal para mantener el perfil o publicar oportunidades por periodos cortos.</p>
      <button class="btn secondary" data-change-plan="monthly">Elegir mensual</button>
    </article>
    <article class="plan-switch-card ${state.session.plan === "annual" ? "active" : ""}">
      <span>Anual</span>
      <strong>$200 MXN</strong>
      <p>Mejor precio para usar NODO durante todo el año.</p>
      <button class="btn secondary" data-change-plan="annual">Elegir anual</button>
    </article>
  `;
}

function renderBadges() {
  const unreadConversations = conversationsForCurrentUser().filter(isConversationUnread).length;
  const unreadNotifications = notificationsForCurrentUser().filter((notification) => !notification.read).length;

  $("#messageBadge").textContent = unreadConversations;
  $("#messageBadge").classList.toggle("hidden", unreadConversations === 0);
  $("#notificationBadge").textContent = unreadNotifications;
  $("#notificationBadge").classList.toggle("hidden", unreadNotifications === 0);
}

function updateStats() {
  $("#statProjects").textContent = state.projects.length;
  $("#statCreators").textContent = new Set(state.projects.map((project) => project.author)).size;
  $("#statJobs").textContent = state.jobs.length;
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.left = "50%";
  toast.style.bottom = "24px";
  toast.style.transform = "translateX(-50%)";
  toast.style.padding = "0.85rem 1.1rem";
  toast.style.borderRadius = "999px";
  toast.style.color = "white";
  toast.style.fontWeight = "900";
  toast.style.background = "linear-gradient(135deg, #0f5cad, #ff7a18)";
  toast.style.boxShadow = "0 16px 40px rgba(6, 24, 51, 0.22)";
  toast.style.zIndex = "99";
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2200);
}

function showInfo(title, message) {
  $("#infoTitle").textContent = title;
  $("#infoMessage").textContent = message;
  $("#infoModal").showModal();
}

window.addEventListener("DOMContentLoaded", () => {
  bindEvents();

  if (state.session) {
    ensureStudentProfile();
    renderApp();
    showApp();
    const initialSection = location.hash.replace("#", "");
    showSection(allowedSections().includes(initialSection) ? initialSection : "inicio");
  } else {
    $("#loginScreen").classList.remove("hidden");
    $("#appShell").classList.add("hidden");
  }
});

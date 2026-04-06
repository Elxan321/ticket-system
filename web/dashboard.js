const API_BASE = "http://localhost:8081";

let allTickets = [];
let currentFilters = {
  search: "",
  status: "",
  priority: "",
  category: ""
};

function requireToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("No active session. Please log in first.");
    try {
      const current = window.location.href;
      if (current.includes("dashboard")) {
        window.location.href = current.replace("dashboard.html", "login.html");
      }
    } catch (_) {
      // ignore
    }
    throw new Error("Missing token");
  }
  return token;
}

function getAuthHeaders() {
  return {
    "Authorization": `Bearer ${requireToken()}`,
    "Content-Type": "application/json"
  };
}

async function fetchSessionInfo() {
  const token = requireToken();
  try {
    const res = await fetch(`${API_BASE}/api/session`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch session info");
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error fetching session:", err);
    return null;
  }
}

function setUserChipFromToken() {
  const avatarEl = document.getElementById("userAvatar");
  const emailEl = document.getElementById("userEmail");
  const token = localStorage.getItem("token");
  if (!token) return;

  // Fetch session info to get real user data
  fetchSessionInfo().then(session => {
    if (session) {
      emailEl.textContent = session.email || "secure-session@local";
      avatarEl.textContent = (session.name || session.email || "RS").charAt(0).toUpperCase();
    } else {
      emailEl.textContent = "secure-session@local";
      avatarEl.textContent = "RS";
    }
  });
}

function showJwtSessionModal() {
  const modal = document.getElementById("jwtSessionModal");
  const content = document.getElementById("jwtSessionContent");
  const token = localStorage.getItem("token");

  content.innerHTML = `
    <div class="modal-info-row">
      <span class="modal-info-label">Loading session info...</span>
      <span class="modal-info-value"></span>
    </div>
  `;

  modal.classList.add("active");

  fetchSessionInfo().then(session => {
    if (!session) {
      content.innerHTML = `
        <div class="modal-info-row">
          <span class="modal-info-label">Error</span>
          <span class="modal-info-value" style="color: var(--danger);">Failed to load session info</span>
        </div>
      `;
      return;
    }

    const tokenPreview = token ? `${token.substring(0, 20)}...${token.substring(token.length - 20)}` : "N/A";

    content.innerHTML = `
      <div class="modal-info-row">
        <span class="modal-info-label">User ID</span>
        <span class="modal-info-value">${session.user_id || "N/A"}</span>
      </div>
      <div class="modal-info-row">
        <span class="modal-info-label">Email</span>
        <span class="modal-info-value">${session.email || "N/A"}</span>
      </div>
      <div class="modal-info-row">
        <span class="modal-info-label">Name</span>
        <span class="modal-info-value">${session.name || "N/A"}</span>
      </div>
      <div class="modal-info-row">
        <span class="modal-info-label">Ticket Count</span>
        <span class="modal-info-value">${session.ticket_count || 0}</span>
      </div>
      <div class="modal-info-row">
        <span class="modal-info-label">Session Type</span>
        <span class="modal-info-value">${session.session_type || "JWT"}</span>
      </div>
      <div class="modal-info-row">
        <span class="modal-info-label">Token Info</span>
        <span class="modal-info-value"></span>
      </div>
      <div class="token-preview">${tokenPreview}</div>
    `;
  });
}

function closeJwtSessionModal() {
  document.getElementById("jwtSessionModal").classList.remove("active");
}

function closeEditTicketModal() {
  document.getElementById("editTicketModal").classList.remove("active");
}

async function fetchTickets() {
  const token = requireToken();
  const tbody = document.getElementById("ticketsBody");
  const msgBar = document.getElementById("ticketMessage");

  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="padding:10px 6px;color:#9ca3af;">
        Loading tickets from API...
      </td>
    </tr>
  `;

  try {
    const params = new URLSearchParams();
    if (currentFilters.search) params.append("search", currentFilters.search);
    if (currentFilters.status) params.append("status", currentFilters.status);
    if (currentFilters.priority) params.append("priority", currentFilters.priority);
    if (currentFilters.category) params.append("category", currentFilters.category);

    const url = `${API_BASE}/api/tickets${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    let data = [];
    try {
      data = await res.json();
    } catch (_) {
      data = [];
    }

    if (!res.ok) {
      throw new Error(data.error || `Error fetching tickets (${res.status})`);
    }

    allTickets = data;
    renderTicketsTable(data);
    updateStatistics(data);
    msgBar.textContent = "";
    updateTicketsCount(data.length);
  } catch (err) {
    console.error("Error loading tickets:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="padding:10px 6px;color:#fecaca;">
          Could not load tickets: ${err.message}
        </td>
      </tr>
    `;
    msgBar.textContent = "Error loading tickets.";
    msgBar.className = "message-bar error";
  }
}

function getStatusBadgeClass(status) {
  const statusMap = {
    "open": "open",
    "in_progress": "in_progress",
    "closed": "closed",
    "resolved": "resolved"
  };
  return statusMap[status] || "open";
}

function getPriorityBadgeClass(priority) {
  const priorityMap = {
    "low": "low",
    "normal": "normal",
    "high": "high",
    "critical": "critical"
  };
  return priorityMap[priority] || "normal";
}

function renderTicketsTable(tickets) {
  const tbody = document.getElementById("ticketsBody");

  if (!tickets || tickets.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="padding:10px 6px;color:#9ca3af;">
          No tickets found. ${currentFilters.search || currentFilters.status || currentFilters.priority || currentFilters.category ? "Try clearing filters." : "Create your first secure task on the right."}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = "";
  tickets.forEach((t) => {
    const tr = document.createElement("tr");
    const id = t.ID || t.id;
    const title = escapeHtml(t.Title || t.title || "");
    const status = (t.Status || t.status || "open").toLowerCase();
    const priority = (t.Priority || t.priority || "normal").toLowerCase();
    const category = (t.Category || t.category || "other").toLowerCase();

    tr.innerHTML = `
      <td>${id}</td>
      <td class="ticket-title-cell">${title}</td>
      <td>
        <span class="status-badge ${getStatusBadgeClass(status)}">
          ${status === "open" ? "Block" : status === "closed" ? "Compliter" : status.replace("_", " ")}
        </span>
      </td>
      <td>
        <span class="priority-badge ${getPriorityBadgeClass(priority)}">${priority}</span>
      </td>
      <td>
        <span class="category-badge">${category}</span>
      </td>
      <td>
        <div class="actions">
          <button class="btn-status" data-action="status" data-id="${id}" title="Change status">⚡</button>
          <button class="btn-icon" data-action="edit" data-id="${id}" title="Edit ticket">✎</button>
          <button class="btn-icon" data-action="delete" data-id="${id}" title="Delete ticket">✕</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Re-attach event listeners
  tbody.addEventListener("click", handleTicketAction);
}

function handleTicketAction(e) {
  const target = e.target.closest("button[data-action]");
  if (!target) return;
  
  const action = target.getAttribute("data-action");
  const id = target.getAttribute("data-id");
  
  if (action === "delete" && id) {
    deleteTicket(id);
  } else if (action === "edit" && id) {
    editTicket(id);
  } else if (action === "status" && id) {
    quickChangeStatus(id);
  }
}

async function quickChangeStatus(id) {
  const ticket = allTickets.find(t => (t.ID || t.id) == id);
  if (!ticket) return;

  const currentStatus = (ticket.Status || ticket.status || "open").toLowerCase();
  const statuses = ["open", "in_progress", "closed", "resolved"];
  const currentIndex = statuses.indexOf(currentStatus);
  const nextIndex = (currentIndex + 1) % statuses.length;
  const newStatus = statuses[nextIndex];

  await updateTicketStatus(id, newStatus);
}

async function updateTicketStatus(id, status) {
  const token = requireToken();
  const msgBar = document.getElementById("ticketMessage");

  try {
    const res = await fetch(`${API_BASE}/api/tickets/${id}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Failed to update status (${res.status})`);
    }

    msgBar.textContent = "Status updated successfully.";
    msgBar.className = "message-bar success";
    setTimeout(() => {
      msgBar.textContent = "";
      msgBar.className = "message-bar";
    }, 3000);
    
    fetchTickets();
  } catch (err) {
    console.error("Update status error:", err);
    msgBar.textContent = "Error updating status.";
    msgBar.className = "message-bar error";
  }
}

async function editTicket(id) {
  const ticket = allTickets.find(t => (t.ID || t.id) == id);
  if (!ticket) {
    // Try fetching from API
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${id}`, {
        headers: {
          "Authorization": `Bearer ${requireToken()}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        populateEditForm(data);
        document.getElementById("editTicketModal").classList.add("active");
      }
    } catch (err) {
      console.error("Error fetching ticket:", err);
    }
    return;
  }

  populateEditForm(ticket);
  document.getElementById("editTicketModal").classList.add("active");
}

function populateEditForm(ticket) {
  document.getElementById("editTicketId").value = ticket.ID || ticket.id;
  document.getElementById("editTicketTitle").value = ticket.Title || ticket.title || "";
  document.getElementById("editTicketDescription").value = ticket.Description || ticket.description || "";
  document.getElementById("editTicketStatus").value = (ticket.Status || ticket.status || "open").toLowerCase();
  document.getElementById("editTicketPriority").value = (ticket.Priority || ticket.priority || "normal").toLowerCase();
  document.getElementById("editTicketCategory").value = (ticket.Category || ticket.category || "other").toLowerCase();
}

async function handleEditTicket(e) {
  e.preventDefault();
  const token = requireToken();
  const msgBar = document.getElementById("editTicketMessage");

  const id = document.getElementById("editTicketId").value;
  const title = document.getElementById("editTicketTitle").value.trim();
  const description = document.getElementById("editTicketDescription").value.trim();
  const status = document.getElementById("editTicketStatus").value;
  const priority = document.getElementById("editTicketPriority").value;
  const category = document.getElementById("editTicketCategory").value;

  if (!title || !description) {
    msgBar.textContent = "Title and description are required.";
    msgBar.className = "message-bar error";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/tickets/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title,
        description,
        status,
        priority,
        category,
      }),
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      data = {};
    }

    if (!res.ok) {
      throw new Error(data.error || `Error updating ticket (${res.status})`);
    }

    msgBar.textContent = "Ticket updated successfully.";
    msgBar.className = "message-bar success";
    closeEditTicketModal();
    fetchTickets();
    
    setTimeout(() => {
      msgBar.textContent = "";
      msgBar.className = "message-bar";
    }, 3000);
  } catch (err) {
    console.error("Edit ticket error:", err);
    msgBar.textContent = "Could not update ticket.";
    msgBar.className = "message-bar error";
  }
}

async function deleteTicket(id) {
  const token = requireToken();
  const msgBar = document.getElementById("ticketMessage");
  if (!confirm("Delete this ticket?")) return;

  try {
    const res = await fetch(`${API_BASE}/api/tickets/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Failed to delete (status ${res.status})`);
    }
    msgBar.textContent = "Ticket deleted.";
    msgBar.className = "message-bar success";
    fetchTickets();
  } catch (err) {
    console.error("Delete error:", err);
    msgBar.textContent = "Error deleting ticket.";
    msgBar.className = "message-bar error";
  }
}

function updateStatistics(tickets) {
  const total = tickets.length;
  const open = tickets.filter(t => (t.Status || t.status || "open").toLowerCase() === "open").length;
  const inProgress = tickets.filter(t => (t.Status || t.status || "open").toLowerCase() === "in_progress").length;
  const closed = tickets.filter(t => (t.Status || t.status || "open").toLowerCase() === "closed").length;
  const resolved = tickets.filter(t => (t.Status || t.status || "open").toLowerCase() === "resolved").length;

  // Priority breakdown
  const priorityCounts = {
    low: 0,
    normal: 0,
    high: 0,
    critical: 0
  };

  tickets.forEach(t => {
    const priority = (t.Priority || t.priority || "normal").toLowerCase();
    if (priorityCounts.hasOwnProperty(priority)) {
      priorityCounts[priority]++;
    }
  });

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statOpen").textContent = open;
  document.getElementById("statInProgress").textContent = inProgress;
  document.getElementById("statClosed").textContent = closed + resolved;
  
  const priorityBreakdown = document.getElementById("statPriorityBreakdown");
  priorityBreakdown.innerHTML = "";
  
  if (total > 0) {
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      if (count > 0) {
        const badge = document.createElement("span");
        badge.className = "stat-badge";
        badge.textContent = `${priority}: ${count}`;
        priorityBreakdown.appendChild(badge);
      }
    });
  }
  
  if (priorityBreakdown.children.length === 0) {
    document.getElementById("statPriority").textContent = "-";
  } else {
    document.getElementById("statPriority").textContent = total;
  }
}

function updateTicketsCount(count) {
  const pill = document.getElementById("ticketsCountPill");
  pill.textContent = `${count} ticket${count === 1 ? "" : "s"}`;
}

async function handleCreateTicket(e) {
  e.preventDefault();
  const token = requireToken();

  const title = document.getElementById("ticketTitle").value.trim();
  const description = document.getElementById("ticketDescription").value.trim();
  const status = document.getElementById("ticketStatus").value;
  const priority = document.getElementById("ticketPriority").value;
  const category = document.getElementById("ticketCategory").value;
  const msgBar = document.getElementById("ticketMessage");

  if (!title || !description) {
    msgBar.textContent = "Title and description are required.";
    msgBar.className = "message-bar error";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/tickets`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title,
        description,
        status,
        priority,
        category,
      }),
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      data = {};
    }

    if (!res.ok) {
      throw new Error(data.error || `Error creating ticket (${res.status})`);
    }

    document.getElementById("ticketTitle").value = "";
    document.getElementById("ticketDescription").value = "";
    document.getElementById("ticketStatus").value = "open";
    document.getElementById("ticketPriority").value = "normal";
    document.getElementById("ticketCategory").value = "other";
    
    msgBar.textContent = "Ticket created successfully.";
    msgBar.className = "message-bar success";
    fetchTickets();
  } catch (err) {
    console.error("Create ticket error:", err);
    msgBar.textContent = "Could not create ticket.";
    msgBar.className = "message-bar error";
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutModal = document.getElementById("logoutModal");
  const closeLogoutModal = document.getElementById("closeLogoutModal");
  const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");
  const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

  function openLogoutModal() {
    logoutModal.classList.add("active");
  }

  function closeLogout() {
    logoutModal.classList.remove("active");
  }

  logoutBtn.addEventListener("click", openLogoutModal);
  closeLogoutModal.addEventListener("click", closeLogout);
  cancelLogoutBtn.addEventListener("click", closeLogout);

  confirmLogoutBtn.addEventListener("click", async () => {
    const token = localStorage.getItem("token");

    try {
      await fetch(`${API_BASE}/api/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
    } catch (err) {
      console.warn("Backend logout endpoint not available.");
    }

    localStorage.removeItem("token");
    window.location.href = "login.html";
  });
}

function setupFilters() {
  const searchInput = document.getElementById("searchInput");
  const filterStatus = document.getElementById("filterStatus");
  const filterPriority = document.getElementById("filterPriority");
  const filterCategory = document.getElementById("filterCategory");
  const workspaceBtns = document.querySelectorAll(".workspace-btn");
  const clearBtn = document.getElementById("clearFiltersBtn");

  let searchTimeout;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentFilters.search = e.target.value.trim();
      fetchTickets();
    }, 300);
  });

  filterStatus.addEventListener("change", (e) => {
    currentFilters.status = e.target.value;
    fetchTickets();
  });

  filterPriority.addEventListener("change", (e) => {
    currentFilters.priority = e.target.value;
    fetchTickets();
  });

  filterCategory.addEventListener("change", (e) => {
    currentFilters.category = e.target.value;
    // Update workspace button state when filter changes manually
    updateWorkspaceBtnState();
    fetchTickets();
  });

  clearBtn.addEventListener("click", () => {
    currentFilters.search = "";
    currentFilters.status = "";
    currentFilters.priority = "";
    currentFilters.category = "";
    searchInput.value = "";
    filterStatus.value = "";
    filterPriority.value = "";
    filterCategory.value = "";
    updateWorkspaceBtnState();
    fetchTickets();
  });

  // Workspace button handlers
  workspaceBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const category = btn.getAttribute("data-category");
      // Update active state
      workspaceBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      // Apply category filter
      currentFilters.category = category;
      filterCategory.value = category;
      // Reset other filters for clarity when switching workspace
      currentFilters.search = "";
      currentFilters.status = "";
      currentFilters.priority = "";
      searchInput.value = "";
      filterStatus.value = "";
      filterPriority.value = "";
      // Fetch tickets in this workspace
      fetchTickets();
    });
  });
}

function updateWorkspaceBtnState() {
  const workspaceBtns = document.querySelectorAll(".workspace-btn");
  workspaceBtns.forEach(btn => {
    const category = btn.getAttribute("data-category");
    if (category === currentFilters.category) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function setupModals() {
  // JWT Session Modal
  document.getElementById("jwtSessionBtn").addEventListener("click", showJwtSessionModal);
  document.getElementById("closeJwtModal").addEventListener("click", closeJwtSessionModal);
  document.getElementById("jwtSessionModal").addEventListener("click", (e) => {
    if (e.target.id === "jwtSessionModal") {
      closeJwtSessionModal();
    }
  });

  // Edit Ticket Modal
  document.getElementById("closeEditModal").addEventListener("click", closeEditTicketModal);
  document.getElementById("cancelEditBtn").addEventListener("click", closeEditTicketModal);
  document.getElementById("editTicketModal").addEventListener("click", (e) => {
    if (e.target.id === "editTicketModal") {
      closeEditTicketModal();
    }
  });
  document.getElementById("editTicketForm").addEventListener("submit", handleEditTicket);
}

function setupEvents() {
  const form = document.getElementById("createTicketForm");
  form.addEventListener("submit", handleCreateTicket);

  const refreshBtn = document.getElementById("refreshBtn");
  refreshBtn.addEventListener("click", fetchTickets);
}

window.addEventListener("DOMContentLoaded", () => {
  try {
    requireToken();
  } catch {
    return;
  }
  setUserChipFromToken();
  setupLogout();
  setupEvents();
  setupFilters();
  setupModals();
  fetchTickets();
});

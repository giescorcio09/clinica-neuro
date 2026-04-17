const STORAGE_KEY = "clinicaNeuroBookingsV2";

const MONTHS = [
  { number: 4, name: "Abril", days: 30 },
  { number: 5, name: "Maio", days: 31 },
  { number: 6, name: "Junho", days: 30 },
  { number: 7, name: "Julho", days: 31 },
  { number: 8, name: "Agosto", days: 31 },
  { number: 9, name: "Setembro", days: 30 },
  { number: 10, name: "Outubro", days: 31 },
  { number: 11, name: "Novembro", days: 30 },
  { number: 12, name: "Dezembro", days: 31 }
];

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MORNING_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00"];
const AFTERNOON_SLOTS = ["13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const ALL_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

let selectedDateKey = null;
let selectedSlot = null;

const actionButtons = document.querySelectorAll(".action-btn");
const panels = document.querySelectorAll(".panel");

const calendarGrid = document.getElementById("calendar-grid");
const selectedDateTitle = document.getElementById("selected-date-title");
const weekendMessage = document.getElementById("weekend-message");
const scheduleContent = document.getElementById("schedule-content");
const schedulePlaceholder = document.getElementById("schedule-placeholder");
const morningSlotsContainer = document.getElementById("morning-slots");
const afternoonSlotsContainer = document.getElementById("afternoon-slots");
const morningCount = document.getElementById("morning-count");
const afternoonCount = document.getElementById("afternoon-count");
const selectedSlotCard = document.getElementById("selected-slot-card");
const selectedSlotText = document.getElementById("selected-slot-text");
const bookingFeedback = document.getElementById("booking-feedback");
const bookingForm = document.getElementById("booking-form");
const lookupForm = document.getElementById("lookup-form");
const lookupResult = document.getElementById("lookup-result");

init();

function init() {
  setupPanelNavigation();
  renderCalendar();
  setupForms();
}

function setupPanelNavigation() {
  actionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.panelTarget;

      actionButtons.forEach((btn) => btn.classList.remove("active"));
      panels.forEach((panel) => panel.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(target).classList.add("active");
      document.getElementById(target).scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderCalendar() {
  calendarGrid.innerHTML = "";

  MONTHS.forEach((month) => {
    const monthCard = document.createElement("section");
    monthCard.className = "month-card";

    const monthTitle = document.createElement("h4");
    monthTitle.className = "month-title";
    monthTitle.textContent = `${month.name} 2026`;

    const weekdaysRow = document.createElement("div");
    weekdaysRow.className = "weekdays-row";

    WEEKDAYS.forEach((weekday) => {
      const dayLabel = document.createElement("div");
      dayLabel.className = "weekday-label";
      dayLabel.textContent = weekday;
      weekdaysRow.appendChild(dayLabel);
    });

    const daysGrid = document.createElement("div");
    daysGrid.className = "days-grid";

    const firstDayIndex = getMondayBasedDayIndex(2026, month.number, 1);

    for (let i = 0; i < firstDayIndex; i++) {
      const empty = document.createElement("div");
      empty.className = "empty-day";
      daysGrid.appendChild(empty);
    }

    for (let day = 1; day <= month.days; day++) {
      const date = new Date(2026, month.number - 1, day);
      const dateKey = formatDateKey(2026, month.number, day);
      const isWeekend = isWeekendDate(date);

      const dayButton = document.createElement("button");
      dayButton.type = "button";
      dayButton.className = `day-btn${isWeekend ? " weekend" : ""}`;
      dayButton.textContent = String(day);
      dayButton.dataset.dateKey = dateKey;

      if (dateKey === selectedDateKey) {
        dayButton.classList.add("selected");
      }

      dayButton.addEventListener("click", () => handleDateSelection(dateKey));
      daysGrid.appendChild(dayButton);
    }

    monthCard.appendChild(monthTitle);
    monthCard.appendChild(weekdaysRow);
    monthCard.appendChild(daysGrid);
    calendarGrid.appendChild(monthCard);
  });
}

function handleDateSelection(dateKey) {
  selectedDateKey = dateKey;
  selectedSlot = null;
  hideBookingFeedback();

  document.querySelectorAll(".day-btn").forEach((button) => {
    button.classList.toggle("selected", button.dataset.dateKey === dateKey);
  });

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const formatted = formatDateForDisplay(date);

  selectedDateTitle.textContent = formatted;
  selectedSlotCard.classList.add("hidden");
  bookingForm.reset();

  const weekend = isWeekendDate(date);
  schedulePlaceholder.classList.add("hidden");

  if (weekend) {
    weekendMessage.classList.remove("hidden");
    scheduleContent.classList.add("hidden");
    return;
  }

  weekendMessage.classList.add("hidden");
  scheduleContent.classList.remove("hidden");
  renderSlots();
}

function renderSlots() {
  const bookings = getBookings();
  const bookedSlots = bookings
    .filter((booking) => booking.date === selectedDateKey)
    .map((booking) => booking.slot);

  renderSlotGroup(MORNING_SLOTS, morningSlotsContainer, bookedSlots);
  renderSlotGroup(AFTERNOON_SLOTS, afternoonSlotsContainer, bookedSlots);

  const availableMorning = MORNING_SLOTS.filter((slot) => !bookedSlots.includes(slot)).length;
  const availableAfternoon = AFTERNOON_SLOTS.filter((slot) => !bookedSlots.includes(slot)).length;

  morningCount.textContent = `${availableMorning} horário${availableMorning === 1 ? "" : "s"} disponíveis`;
  afternoonCount.textContent = `${availableAfternoon} horário${availableAfternoon === 1 ? "" : "s"} disponíveis`;
}

function renderSlotGroup(slots, container, bookedSlots) {
  container.innerHTML = "";

  slots.forEach((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot-btn";
    button.textContent = slot;

    const isBooked = bookedSlots.includes(slot);

    if (isBooked) {
      button.classList.add("booked");
      button.disabled = true;
    } else {
      if (selectedSlot === slot) {
        button.classList.add("selected");
      }

      button.addEventListener("click", () => {
        selectedSlot = slot;
        selectedSlotText.textContent = slot;
        selectedSlotCard.classList.remove("hidden");
        hideBookingFeedback();
        renderSlots();
        selectedSlotCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }

    container.appendChild(button);
  });
}

function setupForms() {
  bookingForm.addEventListener("submit", handleBookingSubmit);
  lookupForm.addEventListener("submit", handleLookupSubmit);
}

function handleBookingSubmit(event) {
  event.preventDefault();

  if (!selectedDateKey || !selectedSlot) {
    showBookingFeedback("Selecione uma data e um horário antes de confirmar o agendamento.", true);
    return;
  }

  const selectedDate = new Date(`${selectedDateKey}T12:00:00`);
  if (isWeekendDate(selectedDate)) {
    showBookingFeedback("Atendimentos indisponíveis aos finais de semana.", true);
    return;
  }

  if (!ALL_SLOTS.includes(selectedSlot)) {
    showBookingFeedback("Horário inválido. Escolha um horário entre 08:00 e 18:00.", true);
    return;
  }

  const name = document.getElementById("booking-name").value.trim();
  const phone = document.getElementById("booking-phone").value.trim();
  const email = document.getElementById("booking-email").value.trim().toLowerCase();

  if (!name || !phone || !email) {
    showBookingFeedback("Preencha nome, telefone e e-mail para concluir o agendamento.", true);
    return;
  }

  const bookings = getBookings();
  const slotAlreadyBooked = bookings.some(
    (booking) => booking.date === selectedDateKey && booking.slot === selectedSlot
  );

  if (slotAlreadyBooked) {
    showBookingFeedback("Esse horário já foi agendado. Escolha outro horário disponível.", true);
    renderSlots();
    return;
  }

  bookings.push({
    id: generateId(),
    name,
    phone,
    email,
    date: selectedDateKey,
    slot: selectedSlot,
    createdAt: new Date().toISOString()
  });

  saveBookings(bookings);

  showBookingFeedback(
    `Agendamento confirmado com sucesso.<br><strong>Data:</strong> ${formatDateFromKey(selectedDateKey)}<br><strong>Horário:</strong> ${selectedSlot}<br><strong>Paciente:</strong> ${escapeHtml(name)}`,
    false
  );

  bookingForm.reset();
  selectedSlot = null;
  selectedSlotCard.classList.add("hidden");
  renderSlots();
}

function handleLookupSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("lookup-name").value.trim().toLowerCase();
  const phone = document.getElementById("lookup-phone").value.trim();
  const email = document.getElementById("lookup-email").value.trim().toLowerCase();

  const matches = getBookings()
    .filter((booking) => {
      return (
        booking.name.trim().toLowerCase() === name &&
        booking.phone.trim() === phone &&
        booking.email.trim().toLowerCase() === email
      );
    })
    .sort((a, b) => {
      if (a.date === b.date) return a.slot.localeCompare(b.slot);
      return a.date.localeCompare(b.date);
    });

  lookupResult.classList.remove("hidden");

  if (!matches.length) {
    lookupResult.innerHTML = "Nenhum agendamento foi encontrado com os dados informados.";
    return;
  }

  lookupResult.innerHTML = matches
    .map((booking) => {
      return `
        <div class="lookup-booking">
          <strong>Data:</strong> ${formatDateFromKey(booking.date)}<br>
          <strong>Horário:</strong> ${booking.slot}
        </div>
      `;
    })
    .join("");
}

function getBookings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveBookings(bookings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function showBookingFeedback(message, isError = false) {
  bookingFeedback.classList.remove("hidden", "error");
  if (isError) {
    bookingFeedback.classList.add("error");
  }
  bookingFeedback.innerHTML = message;
}

function hideBookingFeedback() {
  bookingFeedback.classList.add("hidden");
  bookingFeedback.classList.remove("error");
  bookingFeedback.innerHTML = "";
}

function formatDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDateForDisplay(date) {
  const weekdays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  return `${weekdays[date.getDay()]}, ${String(date.getDate()).padStart(2, "0")} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

function formatDateFromKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function getMondayBasedDayIndex(year, month, day) {
  const jsDay = new Date(year, month - 1, day).getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function isWeekendDate(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function generateId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return String(Date.now() + Math.random());
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

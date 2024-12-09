let totalHours = 0;
let totalMinutes = 0;
const taskList = document.getElementById('taskList');
const taskForm = document.getElementById('taskForm');
const finishButton = document.getElementById('finishButton');
const deleteAllButton = document.getElementById('deleteAllButton');
const remainingTimeDisplay = document.getElementById('remainingTime');

// Ensure proper setup on page load
document.addEventListener('DOMContentLoaded', loadFromLocalStorage);
toggleDeleteAllButtonVisibility();
checkFormAvailability();

// Form submission handler
taskForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const taskName = document.getElementById('taskName').value.trim();
  const taskHours = parseInt(document.getElementById('taskHours').value);
  const taskMinutes = parseInt(document.getElementById('taskMinutes').value);

  if (!/^[A-Za-z\s]+$/.test(taskName)) {
    alert("Task name must only contain letters and spaces.");
    return;
  }

  let newTotalHours = totalHours + taskHours;
  let newTotalMinutes = totalMinutes + taskMinutes;

  if (newTotalMinutes >= 60) {
    newTotalHours += Math.floor(newTotalMinutes / 60);
    newTotalMinutes = newTotalMinutes % 60;
  }

  if (newTotalHours > 24 || (newTotalHours === 24 && newTotalMinutes > 0)) {
    alert("The total time exceeds 24 hours. Please adjust your tasks.");
    return;
  }

  totalHours = newTotalHours;
  totalMinutes = newTotalMinutes;

  const taskItem = document.createElement('div');
  taskItem.classList.add('taskItem');
  taskItem.dataset.hours = taskHours;
  taskItem.dataset.minutes = taskMinutes;

  taskItem.innerHTML = `
    <strong>${taskName}</strong> - Planned: ${taskHours} hours, ${taskMinutes} minutes
    <br>
    Actual: <span class="actualTime">0 hours, 0 minutes</span>
    <br>
    <label>Update Actual Time:</label>
    <input type="number" class="actualHoursInput" placeholder="Hours" min="0">
    <input type="number" class="actualMinutesInput" placeholder="Minutes" min="0">
    <button class="updateButton">Update</button>
    <button class="deleteButton">Delete</button>
    <div class="taskStatus">Status: Pending</div>
  `;

  taskItem.querySelector('.deleteButton').addEventListener('click', function () {
    taskItem.remove();
    totalHours -= parseInt(taskItem.dataset.hours);
    totalMinutes -= parseInt(taskItem.dataset.minutes);

    if (totalMinutes < 0) {
      totalHours -= 1;
      totalMinutes += 60;
    }

    if (totalHours < 24) {
      finishButton.style.display = 'none';
    }

    toggleDeleteAllButtonVisibility();
    updateRemainingTime();
    saveToLocalStorage();
  });

  taskItem.querySelector('.updateButton').addEventListener('click', function () {
    const actualHoursInput = taskItem.querySelector('.actualHoursInput').value || 0;
    const actualMinutesInput = taskItem.querySelector('.actualMinutesInput').value || 0;
  
    const actualHours = parseInt(actualHoursInput);
    const actualMinutes = parseInt(actualMinutesInput);
  
    if (actualMinutes < 0 || actualMinutes > 59) {
      alert("Minutes must be between 0 and 59.");
      return;
    }
  
    let currentActualHours = parseInt(taskItem.querySelector('.actualTime').textContent.split(" ")[0]);
    let currentActualMinutes = parseInt(taskItem.querySelector('.actualTime').textContent.split(" ")[2]);
  
    currentActualHours += actualHours;
    currentActualMinutes += actualMinutes;
  
    if (currentActualMinutes >= 60) {
      currentActualHours += Math.floor(currentActualMinutes / 60);
      currentActualMinutes = currentActualMinutes % 60;
    }
  
    // Update the actual time in the task display
    taskItem.querySelector('.actualTime').textContent = `${currentActualHours} hours, ${currentActualMinutes} minutes`;
  
    // Save the updated actual time to localStorage
    saveToLocalStorage();
  
    if (currentActualHours === parseInt(taskItem.dataset.hours) && 
        currentActualMinutes === parseInt(taskItem.dataset.minutes)) {
      taskItem.querySelector('.taskStatus').textContent = "Status: Completed";
    } else {
      taskItem.querySelector('.taskStatus').textContent = "Status: Pending";
    }
  
    taskItem.querySelector('.actualHoursInput').value = '';
    taskItem.querySelector('.actualMinutesInput').value = '';
  });
  

  taskList.appendChild(taskItem);
  document.getElementById('taskName').value = '';
  document.getElementById('taskHours').value = '';
  document.getElementById('taskMinutes').value = '';

  if (totalHours >= 24) {
    finishButton.style.display = 'inline-block';
    disableFormInputs();
  }

  toggleDeleteAllButtonVisibility();
  updateRemainingTime();
  saveToLocalStorage();
});

deleteAllButton.addEventListener('click', function () {
  const confirmation = confirm("Are you sure you want to delete all tasks?");
  if (confirmation) {
    taskList.innerHTML = '';
    totalHours = 0;
    totalMinutes = 0;
    finishButton.style.display = 'none';
    toggleDeleteAllButtonVisibility();
    enableFormInputs();
    updateRemainingTime();
    saveToLocalStorage();
  }
});

finishButton.addEventListener('click', function () {
  alert("Congratulations! You've planned your 24 hours!");
  taskList.innerHTML = '';
  totalHours = 0;
  totalMinutes = 0;
  finishButton.style.display = 'none';
  toggleDeleteAllButtonVisibility();
  enableFormInputs();
  updateRemainingTime();
  saveToLocalStorage();
});

// LocalStorage functions
function saveToLocalStorage() {
  const tasks = Array.from(taskList.children).map(task => ({
    name: task.querySelector('strong').textContent,
    plannedHours: task.dataset.hours,
    plannedMinutes: task.dataset.minutes,
    actualTime: task.querySelector('.actualTime').textContent, // Save the actual time
    status: task.querySelector('.taskStatus').textContent
  }));

  const data = { totalHours, totalMinutes, tasks };
  localStorage.setItem('dayManagerData', JSON.stringify(data));
}

function loadFromLocalStorage() {
  const savedData = JSON.parse(localStorage.getItem('dayManagerData'));
  if (savedData) {
    totalHours = savedData.totalHours;
    totalMinutes = savedData.totalMinutes;
    savedData.tasks.forEach(task => {
      const taskItem = document.createElement('div');
      taskItem.classList.add('taskItem');
      taskItem.dataset.hours = task.plannedHours;
      taskItem.dataset.minutes = task.plannedMinutes;

      taskItem.innerHTML = `
        <strong>${task.name}</strong> - Planned: ${task.plannedHours} hours, ${task.plannedMinutes} minutes
        <br>
        Actual: <span class="actualTime">${task.actualTime}</span>
        <br>
        <label>Update Actual Time:</label>
        <input type="number" class="actualHoursInput" placeholder="Hours" min="0">
        <input type="number" class="actualMinutesInput" placeholder="Minutes" min="0">
        <button class="updateButton">Update</button>
        <button class="deleteButton">Delete</button>
        <div class="taskStatus">${task.status}</div>
      `;

      // Ensure the update button works after reload
      taskItem.querySelector('.updateButton').addEventListener('click', function () {
        saveToLocalStorage();
      });

      taskItem.querySelector('.deleteButton').addEventListener('click', function () {
        taskItem.remove();
        saveToLocalStorage();
      });

      // Update the task status based on actual time
      const [actualHours, actualMinutes] = task.actualTime.split(' ').map(val => parseInt(val));
      if (actualHours === parseInt(task.plannedHours) && actualMinutes === parseInt(task.plannedMinutes)) {
        taskItem.querySelector('.taskStatus').textContent = "Status: Completed";
      } else {
        taskItem.querySelector('.taskStatus').textContent = "Status: Pending";
      }

      taskList.appendChild(taskItem);
    });

    updateRemainingTime();
    toggleDeleteAllButtonVisibility();
  }
}


// Utility functions
function toggleDeleteAllButtonVisibility() {
  deleteAllButton.style.display = taskList.children.length > 0 ? 'inline-block' : 'none';
}

function updateRemainingTime() {
  let remainingHours = 24 - totalHours;
  let remainingMinutes = 0;

  if (totalMinutes > 0) {
    remainingHours -= 1;
    remainingMinutes = 60 - totalMinutes;
  }

  remainingHours = Math.max(remainingHours, 0);
  remainingMinutes = Math.max(remainingMinutes, 0);

  remainingTimeDisplay.textContent = `Remaining time: ${remainingHours} hours, ${remainingMinutes} minutes`;
}

function checkFormAvailability() {
  if (totalHours >= 24) {
    disableFormInputs();
  } else {
    enableFormInputs();
  }
}

function disableFormInputs() {
  taskForm.querySelectorAll('input, button[type="submit"]').forEach(input => input.disabled = true);
}

function enableFormInputs() {
  taskForm.querySelectorAll('input, button[type="submit"]').forEach(input => input.disabled = false);
}

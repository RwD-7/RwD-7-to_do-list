const taskInput = document.getElementById('task-input');
const addTaskButton = document.getElementById('add-task');
const taskList = document.getElementById('task-list');

addTaskButton.addEventListener('click', () => {
    const taskText = taskInput.value;
    if (taskText) {
        const li = document.createElement('li');
        li.textContent = taskText;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-task';
        deleteButton.addEventListener('click', () => {
            taskList.removeChild(li);
        });
        li.appendChild(deleteButton);
        taskList.appendChild(li);
        taskInput.value = '';
    }
});